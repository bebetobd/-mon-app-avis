import mysql from "mysql2/promise";

// ─── Connexion pool MySQL ─────────────────────────────────────────────────────
let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:               process.env.MYSQL_HOST     || "localhost",
      user:               process.env.MYSQL_USER     || "root",
      password:           process.env.MYSQL_PASSWORD || "",
      database:           process.env.MYSQL_DATABASE || "bebetobd",
      port:               parseInt(process.env.MYSQL_PORT || "3306"),
      ssl:                process.env.MYSQL_SSL === "true"
                            ? { rejectUnauthorized: false }
                            : undefined,
      waitForConnections: true,
      connectionLimit:    5,
      timezone:           "+00:00",
    });
  }
  return pool;
}

// ─── Initialisation de la table ───────────────────────────────────────────────
async function initTable(conn) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id            BIGINT         NOT NULL PRIMARY KEY,
      mode          VARCHAR(50)    NOT NULL DEFAULT 'hopital',
      service       VARCHAR(100),
      service_label VARCHAR(150),
      rating        TINYINT        NOT NULL DEFAULT 0,
      emoji         TINYINT,
      cat_ratings   JSON,
      comment       TEXT,
      contact       VARCHAR(255),
      fb_date       VARCHAR(80),
      created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");

  if (req.method === "OPTIONS") return res.status(200).end();

  let conn;
  try {
    conn = await getPool().getConnection();
    await initTable(conn);

    // ── GET : récupérer tous les avis ──────────────────────────────────────
    if (req.method === "GET") {
      const service = req.query?.service;
      let query = "SELECT * FROM feedbacks ORDER BY created_at DESC";
      let params = [];

      if (service && service !== "all") {
        query = "SELECT * FROM feedbacks WHERE service = ? ORDER BY created_at DESC";
        params = [service];
      }

      const [rows] = await conn.execute(query, params);

      const feedbacks = rows.map((r) => ({
        id:              Number(r.id),
        mode:            r.mode,
        service:         r.service,
        service_label:   r.service_label,
        rating:          r.rating,
        emoji:           r.emoji,
        categoryRatings: typeof r.cat_ratings === "string"
                           ? JSON.parse(r.cat_ratings)
                           : (r.cat_ratings || {}),
        comment:         r.comment  || "",
        contact:         r.contact  || "",
        date:            r.fb_date  || "",
        created_at:      r.created_at,
      }));

      return res.status(200).json(feedbacks);
    }

    // ── POST : sauvegarder un avis ─────────────────────────────────────────
    if (req.method === "POST") {
      const b = req.body || {};
      await conn.execute(
        `INSERT INTO feedbacks
          (id, mode, service, service_label, rating, emoji, cat_ratings, comment, contact, fb_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.id              || Date.now(),
          b.mode            || "hopital",
          b.service         || null,
          b.service_label   || null,
          b.rating          || 0,
          b.emoji           || null,
          JSON.stringify(b.categoryRatings || {}),
          b.comment         || "",
          b.contact         || "",
          b.date            || new Date().toLocaleString("fr-FR"),
        ]
      );
      return res.status(201).json({ success: true, id: b.id });
    }

    // ── DELETE : supprimer un avis (admin) ────────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: "id requis" });
      await conn.execute("DELETE FROM feedbacks WHERE id = ?", [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (err) {
    console.error("❌ DB Error:", err.message);
    return res.status(500).json({
      error:   "Erreur base de données",
      message: err.message,
    });
  } finally {
    if (conn) conn.release();
  }
}
