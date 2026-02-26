import express from "express";
import { createPool } from "mysql2/promise";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ─── Connexion pool MySQL ─────────────────────────────────────────────────────
let pool = null;

function getPool() {
  if (!pool) {
    pool = createPool({
      host:               process.env.MYSQL_HOST     || "localhost",
      user:               process.env.MYSQL_USER     || "root",
      password:           process.env.MYSQL_PASSWORD || "",
      database:           process.env.MYSQL_DATABASE || "AVISDB",
      port:               parseInt(process.env.MYSQL_PORT || "3306"),
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

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET /api/feedbacks
app.get("/api/feedbacks", async (req, res) => {
  let conn;
  try {
    conn = await getPool().getConnection();
    await initTable(conn);

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

    return res.json(feedbacks);
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Erreur base de données", message: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/feedbacks
app.post("/api/feedbacks", async (req, res) => {
  let conn;
  try {
    conn = await getPool().getConnection();
    await initTable(conn);

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
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Erreur base de données", message: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/feedbacks
app.delete("/api/feedbacks", async (req, res) => {
  let conn;
  try {
    conn = await getPool().getConnection();
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: "id requis" });
    await conn.execute("DELETE FROM feedbacks WHERE id = ?", [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Erreur base de données", message: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ─── Servir le frontend (fichiers statiques) ─────────────────────────────────
app.use(express.static(join(__dirname, "dist")));

// SPA fallback : toute route non-API renvoie index.html
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
