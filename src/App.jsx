import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";

const CATEGORIES = {
  hopital: [
    { id: "accueil", label: "Accueil", icon: "👋" },
    { id: "soins", label: "Qualité des soins", icon: "🩺" },
    { id: "attente", label: "Temps d'attente", icon: "⏱️" },
    { id: "proprete", label: "Propreté", icon: "✨" },
    { id: "ecoute", label: "Écoute du personnel", icon: "👂" },
    { id: "info", label: "Information reçue", icon: "📋" },
  ],
};

const EMOJIS = [
  { score: 1, emoji: "😡", label: "Très insatisfait", color: "#E74C3C" },
  { score: 2, emoji: "😞", label: "Insatisfait", color: "#E67E22" },
  { score: 3, emoji: "😐", label: "Neutre", color: "#F1C40F" },
  { score: 4, emoji: "😊", label: "Satisfait", color: "#2ECC71" },
  { score: 5, emoji: "🤩", label: "Très satisfait", color: "#1ABC9C" },
];

function StarRating({ value, onChange, size = 42 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: size,
            transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1)",
            transform:
              (hover || value) >= star ? "scale(1.2)" : "scale(1)",
            filter:
              (hover || value) >= star
                ? "grayscale(0) drop-shadow(0 2px 6px rgba(243,156,18,0.4))"
                : "grayscale(1) opacity(0.4)",
          }}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}

function ProgressBar({ step, total }) {
  return (
    <div
      style={{
        width: "100%",
        height: 5,
        background: "rgba(255,255,255,0.15)",
        borderRadius: 99,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${(step / total) * 100}%`,
          height: "100%",
          background: "linear-gradient(90deg, #E8C47C, #D4A855)",
          borderRadius: 99,
          transition: "width 0.5s cubic-bezier(.22,1,.36,1)",
        }}
      />
    </div>
  );
}

function Confetti() {
  const colors = ["#E8C47C", "#D4A855", "#1ABC9C", "#2ECC71", "#3498DB", "#E74C3C", "#F1C40F"];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 8,
  }));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function FeedbackApp() {
  const [mode, setMode] = useState("hopital");
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [categoryRatings, setCategoryRatings] = useState({});
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const commentRef = useRef(null);

  const totalSteps = 4;

  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(t);
  }, [step, mode, showDashboard]);

  const transition = (nextFn) => {
    setFadeIn(false);
    setTimeout(() => {
      nextFn();
      setFadeIn(true);
    }, 250);
  };

  const handleSubmit = () => {
    const feedback = {
      id: Date.now(),
      mode,
      rating,
      emoji: selectedEmoji,
      categoryRatings,
      comment,
      contact,
      date: new Date().toLocaleString("fr-FR"),
    };
    setAllFeedbacks((prev) => [...prev, feedback]);
    setShowConfetti(true);
    transition(() => setSubmitted(true));
    setTimeout(() => setShowConfetti(false), 3500);
  };

  const handleReset = () => {
    transition(() => {
      setMode("hopital");
      setStep(0);
      setRating(0);
      setSelectedEmoji(null);
      setCategoryRatings({});
      setComment("");
      setContact("");
      setSubmitted(false);
    });
  };

  const averageRating = allFeedbacks.length
    ? (allFeedbacks.reduce((s, f) => s + f.rating, 0) / allFeedbacks.length).toFixed(1)
    : "—";

  // ─── STYLES ─────────────────────────
  const font = `'Cormorant Garamond', 'Georgia', serif`;
  const sansFont = `'DM Sans', 'Segoe UI', sans-serif`;

  const bgGradient = "linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)";
  const cardBg = "rgba(255,255,255,0.04)";
  const cardBorder = "1px solid rgba(232,196,124,0.15)";
  const gold = "#E8C47C";
  const goldDark = "#D4A855";
  const textLight = "rgba(255,255,255,0.92)";
  const textMuted = "rgba(255,255,255,0.55)";

  const containerStyle = {
    minHeight: "100vh",
    background: bgGradient,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: sansFont,
    position: "relative",
    overflow: "hidden",
  };

  const glowOrb = (top, left, color, size) => ({
    position: "absolute",
    top,
    left,
    width: size,
    height: size,
    background: color,
    borderRadius: "50%",
    filter: "blur(100px)",
    opacity: 0.12,
    pointerEvents: "none",
  });

  const cardStyle = {
    background: cardBg,
    backdropFilter: "blur(40px)",
    border: cardBorder,
    borderRadius: 28,
    padding: "48px 40px",
    maxWidth: 520,
    width: "100%",
    position: "relative",
    boxShadow: "0 25px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? "translateY(0)" : "translateY(16px)",
    transition: "opacity 0.4s ease, transform 0.4s ease",
  };

  const btnPrimary = {
    background: `linear-gradient(135deg, ${gold}, ${goldDark})`,
    color: "#1a1a2e",
    border: "none",
    borderRadius: 14,
    padding: "16px 36px",
    fontSize: 16,
    fontWeight: 700,
    fontFamily: sansFont,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(232,196,124,0.25)",
    letterSpacing: 0.5,
  };

  const btnSecondary = {
    background: "rgba(255,255,255,0.06)",
    color: textLight,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: "14px 28px",
    fontSize: 15,
    fontFamily: sansFont,
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const heading = {
    fontFamily: font,
    fontWeight: 600,
    fontSize: 30,
    color: textLight,
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: -0.5,
  };

  const subtext = {
    fontSize: 15,
    color: textMuted,
    margin: "12px 0 32px",
    lineHeight: 1.6,
  };

  // ─── DASHBOARD ──────────────────────
  if (showDashboard) {
    const modeCount = (m) => allFeedbacks.filter((f) => f.mode === m).length;
    const avgByCategory = (m) => {
      const feedbacks = allFeedbacks.filter((f) => f.mode === m);
      if (!feedbacks.length) return [];
      const cats = CATEGORIES[m];
      return cats.map((cat) => {
        const vals = feedbacks.map((f) => f.categoryRatings[cat.id]).filter(Boolean);
        return {
          ...cat,
          avg: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—",
        };
      });
    };

    return (
      <div style={containerStyle}>
        <div style={glowOrb("10%", "-5%", "#E8C47C", "400px")} />
        <div style={glowOrb("70%", "80%", "#3498DB", "350px")} />
        <div style={{ ...cardStyle, maxWidth: 700, padding: "40px 36px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <h1 style={{ ...heading, fontSize: 26 }}>📊 Tableau de Bord</h1>
            <button
              onClick={() => transition(() => setShowDashboard(false))}
              style={{ ...btnSecondary, padding: "10px 20px", fontSize: 13 }}
            >
              ← Retour
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              { label: "Total avis", value: allFeedbacks.length, icon: "📝" },
              { label: "Note moyenne", value: averageRating, icon: "⭐" },
              { label: "Commentaires", value: allFeedbacks.filter((f) => f.comment).length, icon: "💬" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "20px 16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: gold, fontFamily: font }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {modeCount("hopital") > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ color: gold, fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
                🏥 Centre Hospitalier — {modeCount("hopital")} avis
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {avgByCategory("hopital").map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 14,
                      color: textLight,
                    }}
                  >
                    <span style={{ width: 28, textAlign: "center" }}>{cat.icon}</span>
                    <span style={{ flex: 1 }}>{cat.label}</span>
                    <div
                      style={{
                        width: 120,
                        height: 8,
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: cat.avg !== "—" ? `${(cat.avg / 5) * 100}%` : "0%",
                          height: "100%",
                          background: `linear-gradient(90deg, ${gold}, ${goldDark})`,
                          borderRadius: 99,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 36,
                        textAlign: "right",
                        fontWeight: 700,
                        color: gold,
                        fontSize: 13,
                      }}
                    >
                      {cat.avg}/5
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allFeedbacks.length > 0 && (
            <div>
              <h3 style={{ color: gold, fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
                📝 Derniers commentaires
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto" }}>
                {[...allFeedbacks]
                  .reverse()
                  .filter((f) => f.comment)
                  .slice(0, 8)
                  .map((f) => (
                    <div
                      key={f.id}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        padding: "12px 16px",
                        fontSize: 13,
                        color: textLight,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ color: gold, fontSize: 12 }}>
                          🏥 {"⭐".repeat(f.rating)}
                        </span>
                        <span style={{ color: textMuted, fontSize: 11 }}>{f.date}</span>
                      </div>
                      <div style={{ lineHeight: 1.5 }}>{f.comment}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {allFeedbacks.length === 0 && (
            <p style={{ textAlign: "center", color: textMuted, fontSize: 14, padding: 40 }}>
              Aucun avis collecté pour le moment.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── THANK YOU ──────────────────────
  if (submitted) {
    return (
      <div style={containerStyle}>
        {showConfetti && <Confetti />}
        <div style={glowOrb("10%", "-5%", "#1ABC9C", "400px")} />
        <div style={glowOrb("70%", "80%", "#E8C47C", "300px")} />
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <h1 style={heading}>Merci beaucoup !</h1>
          <p style={subtext}>
            Votre avis est précieux et nous aide à améliorer nos services. Nous prenons en compte chaque
            retour pour vous offrir une meilleure expérience.
          </p>
          <div
            style={{
              background: "rgba(26,188,156,0.1)",
              border: "1px solid rgba(26,188,156,0.2)",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 32,
              fontSize: 14,
              color: "#1ABC9C",
              lineHeight: 1.6,
            }}
          >
            ✅ Votre avis a été enregistré avec succès
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleReset} style={btnPrimary}>
              Nouvel avis
            </button>
            <button
              onClick={() => transition(() => setShowDashboard(true))}
              style={btnSecondary}
            >
              📊 Voir le tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEPS ──────────────────────────
  const categories = CATEGORIES[mode];

  return (
    <div style={containerStyle}>
      <div style={glowOrb("10%", "-5%", "#E8C47C", "400px")} />
      <div style={glowOrb("70%", "80%", "#3498DB", "350px")} />

      <div style={cardStyle}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <button
              onClick={() =>
                transition(() => {
                  if (step > 0) setStep(step - 1);
                })
              }
              style={{
                background: "none",
                border: "none",
                color: textMuted,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: sansFont,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Retour
            </button>
            <span style={{ fontSize: 13, color: textMuted }}>
              Étape {step + 1}/{totalSteps}
            </span>
          </div>
          <ProgressBar step={step + 1} total={totalSteps} />
        </div>

        {/* Step 0: Satisfaction globale */}
        {step === 0 && (
          <div>
            <h2 style={{ ...heading, textAlign: "center" }}>
              Comment évaluez-vous
              <br />
              <span style={{ color: gold }}>votre expérience ?</span>
            </h2>
            <p style={{ ...subtext, textAlign: "center" }}>
              Sélectionnez l'emoji qui correspond à votre ressenti
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginBottom: 32,
                flexWrap: "wrap",
              }}
            >
              {EMOJIS.map((e) => (
                <button
                  key={e.score}
                  onClick={() => setSelectedEmoji(e.score)}
                  style={{
                    background:
                      selectedEmoji === e.score
                        ? `${e.color}18`
                        : "rgba(255,255,255,0.03)",
                    border: `2px solid ${
                      selectedEmoji === e.score ? e.color : "rgba(255,255,255,0.08)"
                    }`,
                    borderRadius: 18,
                    padding: "18px 14px 14px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 78,
                    transform: selectedEmoji === e.score ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: 36 }}>{e.emoji}</span>
                  <span style={{ fontSize: 11, color: textMuted, lineHeight: 1.2 }}>
                    {e.label}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 14, color: textMuted, textAlign: "center", marginBottom: 12 }}>
                Note globale
              </p>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <button
              disabled={!selectedEmoji || !rating}
              onClick={() => transition(() => setStep(1))}
              style={{
                ...btnPrimary,
                width: "100%",
                opacity: !selectedEmoji || !rating ? 0.4 : 1,
                cursor: !selectedEmoji || !rating ? "default" : "pointer",
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* Step 1: Category ratings */}
        {step === 1 && (
          <div>
            <h2 style={{ ...heading, textAlign: "center" }}>
              Évaluez chaque <span style={{ color: gold }}>aspect</span>
            </h2>
            <p style={{ ...subtext, textAlign: "center" }}>
              Notez les critères qui comptent pour vous
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <span style={{ fontSize: 14, color: textLight, fontWeight: 500 }}>
                      {cat.label}
                    </span>
                  </div>
                  <StarRating
                    size={22}
                    value={categoryRatings[cat.id] || 0}
                    onChange={(v) =>
                      setCategoryRatings((prev) => ({ ...prev, [cat.id]: v }))
                    }
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => transition(() => setStep(2))}
              style={{ ...btnPrimary, width: "100%" }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* Step 2: Comment */}
        {step === 2 && (
          <div>
            <h2 style={{ ...heading, textAlign: "center" }}>
              Un <span style={{ color: gold }}>commentaire</span> ?
            </h2>
            <p style={{ ...subtext, textAlign: "center" }}>
              Partagez plus de détails pour nous aider à nous améliorer
            </p>

            <textarea
              ref={commentRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience, suggestions d'amélioration..."
              rows={5}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: "18px 20px",
                fontSize: 15,
                color: textLight,
                fontFamily: sansFont,
                resize: "vertical",
                outline: "none",
                lineHeight: 1.6,
                marginBottom: 20,
                boxSizing: "border-box",
                transition: "border-color 0.3s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              {[
                "Personnel très aimable",
                "Temps d'attente trop long",
                "Locaux propres",
                "À améliorer",
                "Excellente prise en charge",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setComment((prev) => (prev ? prev + ". " + tag : tag))
                  }
                  style={{
                    background: "rgba(232,196,124,0.08)",
                    border: "1px solid rgba(232,196,124,0.2)",
                    borderRadius: 99,
                    padding: "8px 16px",
                    fontSize: 12,
                    color: gold,
                    cursor: "pointer",
                    fontFamily: sansFont,
                    transition: "all 0.2s ease",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              onClick={() => transition(() => setStep(3))}
              style={{ ...btnPrimary, width: "100%" }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* Step 3: Contact + Submit */}
        {step === 3 && (
          <div>
            <h2 style={{ ...heading, textAlign: "center" }}>
              Presque <span style={{ color: gold }}>terminé</span> !
            </h2>
            <p style={{ ...subtext, textAlign: "center" }}>
              Laissez votre email si vous souhaitez être recontacté (optionnel)
            </p>

            <input
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="votre@email.com (optionnel)"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "16px 20px",
                fontSize: 15,
                color: textLight,
                fontFamily: sansFont,
                outline: "none",
                marginBottom: 28,
                boxSizing: "border-box",
                transition: "border-color 0.3s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />

            {/* Summary */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: "20px 24px",
                marginBottom: 28,
              }}
            >
              <div style={{ fontSize: 13, color: textMuted, marginBottom: 12, fontWeight: 600, letterSpacing: 0.5 }}>
                RÉSUMÉ DE VOTRE AVIS
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{EMOJIS.find((e) => e.score === selectedEmoji)?.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, color: textLight, fontWeight: 600 }}>
                    {EMOJIS.find((e) => e.score === selectedEmoji)?.label}
                  </div>
                  <div style={{ fontSize: 13, color: textMuted }}>
                    {"⭐".repeat(rating)} ({rating}/5)
                  </div>
                </div>
              </div>
              {comment && (
                <div
                  style={{
                    fontSize: 13,
                    color: textMuted,
                    fontStyle: "italic",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: 10,
                    marginTop: 10,
                    lineHeight: 1.5,
                  }}
                >
                  "{comment}"
                </div>
              )}
            </div>

            <button onClick={handleSubmit} style={{ ...btnPrimary, width: "100%" }}>
              ✨ Envoyer mon avis
            </button>
          </div>
        )}
      </div>

      <Analytics />
    </div>
  );
}
