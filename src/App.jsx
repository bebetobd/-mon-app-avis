import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";

// ─── EMAILJS CONFIG ──────────────────────────────────────────────────────────
// 1. Créer un compte sur https://www.emailjs.com (gratuit)
// 2. Ajouter un service Gmail lié à manwaherberttchando@gmail.com
// 3. Créer un template contenant : {{otp_code}}
// 4. Renseigner les 3 valeurs ci-dessous
const EMAILJS_PUBLIC_KEY  = "VOTRE_PUBLIC_KEY";
const EMAILJS_SERVICE_ID  = "VOTRE_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "VOTRE_TEMPLATE_ID";
const ADMIN_EMAIL         = "manwaherberttchando@gmail.com";
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PASSWORD = "HDL@2024";
const getStoredPwd = () => localStorage.getItem("hdl_admin_pwd") || DEFAULT_PASSWORD;

const CATEGORIES = {
  hopital: [
    { id: "accueil", label: "Accueil",             icon: "👋" },
    { id: "soins",   label: "Qualité des soins",   icon: "🩺" },
    { id: "attente", label: "Temps d'attente",     icon: "⏱️" },
    { id: "proprete",label: "Propreté",            icon: "✨" },
    { id: "ecoute",  label: "Écoute du personnel", icon: "👂" },
    { id: "info",    label: "Information reçue",   icon: "📋" },
  ],
};

const SERVICES = [
  { id: "dermatologie",      label: "Dermatologie",         icon: "🧴" },
  { id: "ophtalmologie",     label: "Ophtalmologie",        icon: "👁️" },
  { id: "accueil",           label: "Accueil",              icon: "🏥" },
  { id: "caisse",            label: "Caisse",               icon: "💳" },
  { id: "odontologie",       label: "Odontologie",          icon: "🦷" },
  { id: "stomatologie",      label: "Stomatologie",         icon: "🫦" },
  { id: "pediatrie",         label: "Pédiatrie",            icon: "👶" },
  { id: "hospitalisation",   label: "Hospitalisation",      icon: "🛏️" },
  { id: "laboratoire",       label: "Laboratoire",          icon: "🔬" },
  { id: "medecine_generale", label: "Médecine Générale",    icon: "🩺" },
  { id: "rdv",               label: "Prise de Rendez-vous", icon: "📅" },
  { id: "cafeteria",         label: "Cafétéria",            icon: "☕" },
];

const EMOJIS = [
  { score: 1, emoji: "😡", label: "Très insatisfait", color: "#E74C3C" },
  { score: 2, emoji: "😞", label: "Insatisfait",      color: "#E67E22" },
  { score: 3, emoji: "😐", label: "Neutre",           color: "#F1C40F" },
  { score: 4, emoji: "😊", label: "Satisfait",        color: "#2ECC71" },
  { score: 5, emoji: "🤩", label: "Très satisfait",   color: "#1ABC9C" },
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
            background: "none", border: "none", cursor: "pointer", fontSize: size,
            transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1)",
            transform: (hover || value) >= star ? "scale(1.2)" : "scale(1)",
            filter: (hover || value) >= star
              ? "grayscale(0) drop-shadow(0 2px 6px rgba(232,196,124,0.5))"
              : "grayscale(1) opacity(0.35)",
          }}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
        >⭐</button>
      ))}
    </div>
  );
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.12)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        width: `${(step / total) * 100}%`, height: "100%",
        background: "linear-gradient(90deg, #E8C47C, #D4A855)",
        borderRadius: 99, transition: "width 0.5s cubic-bezier(.22,1,.36,1)",
      }} />
    </div>
  );
}

function Confetti() {
  const colors = ["#E8C47C", "#D4A855", "#1ABC9C", "#2ECC71", "#3498DB", "#E74C3C", "#F1C40F"];
  const pieces = Array.from({ length: 45 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360, size: 6 + Math.random() * 8,
  }));
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1000, overflow: "hidden" }}>
      {pieces.map((p) => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.left}%`, top: -20,
          width: p.size, height: p.size * 0.6, background: p.color,
          borderRadius: 2, transform: `rotate(${p.rotation}deg)`,
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg);     opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function FeedbackApp() {
  const [mode, setMode]                       = useState("hopital");
  const [service, setService]                 = useState(null);
  const [step, setStep]                       = useState(0);
  const [rating, setRating]                   = useState(0);
  const [selectedEmoji, setSelectedEmoji]     = useState(null);
  const [categoryRatings, setCategoryRatings] = useState({});
  const [comment, setComment]                 = useState("");
  const [contact, setContact]                 = useState("");
  const [submitted, setSubmitted]             = useState(false);
  const [fadeIn, setFadeIn]                   = useState(true);
  const [showConfetti, setShowConfetti]       = useState(false);
  const [allFeedbacks, setAllFeedbacks]       = useState([]);

  // Admin auth
  const [showAdminLogin, setShowAdminLogin]   = useState(false);
  const [adminAuth, setAdminAuth]             = useState(false);
  const [adminPassword, setAdminPassword]     = useState("");
  const [adminError, setAdminError]           = useState("");
  const [showDashboard, setShowDashboard]     = useState(false);
  const [filterService, setFilterService]     = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Password reset flow
  const [forgotPwd, setForgotPwd]             = useState(false);
  const [otpSent, setOtpSent]                 = useState(false);
  const [otpCode, setOtpCode]                 = useState("");
  const [otpInput, setOtpInput]               = useState("");
  const [otpVerified, setOtpVerified]         = useState(false);
  const [newPwd, setNewPwd]                   = useState("");
  const [confirmPwd, setConfirmPwd]           = useState("");
  const [otpError, setOtpError]               = useState("");
  const [sendingOtp, setSendingOtp]           = useState(false);
  const [pwdChanged, setPwdChanged]           = useState(false);

  // Change password from dashboard
  const [showChangePwd, setShowChangePwd]     = useState(false);
  const [chgCurrent, setChgCurrent]           = useState("");
  const [chgNew, setChgNew]                   = useState("");
  const [chgConfirm, setChgConfirm]           = useState("");
  const [chgError, setChgError]               = useState("");
  const [chgSuccess, setChgSuccess]           = useState("");

  const commentRef = useRef(null);
  const totalSteps = 4;

  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(t);
  }, [step, mode, service, showDashboard, showAdminLogin, forgotPwd, otpSent, otpVerified]);

  const transition = (fn) => {
    setFadeIn(false);
    setTimeout(() => { fn(); setFadeIn(true); }, 250);
  };

  const handleSubmit = () => {
    const feedback = {
      id: Date.now(), mode, service, rating,
      emoji: selectedEmoji, categoryRatings, comment, contact,
      date: new Date().toLocaleString("fr-FR"),
    };
    setAllFeedbacks((prev) => [...prev, feedback]);
    setShowConfetti(true);
    transition(() => setSubmitted(true));
    setTimeout(() => setShowConfetti(false), 3500);
  };

  const handleReset = () => {
    transition(() => {
      setMode("hopital"); setService(null); setStep(0);
      setRating(0); setSelectedEmoji(null); setCategoryRatings({});
      setComment(""); setContact(""); setSubmitted(false);
    });
  };

  const handleAdminLogin = () => {
    if (adminPassword === getStoredPwd()) {
      setAdminAuth(true);
      setAdminError("");
      setAdminPassword("");
      transition(() => { setShowAdminLogin(false); setShowDashboard(true); });
    } else {
      setAdminError("Mot de passe incorrect. Veuillez réessayer.");
    }
  };

  const handleAdminLogout = () => {
    setAdminAuth(false);
    setShowDashboard(false);
    setFilterService("all");
    setSelectedFeedback(null);
    setShowChangePwd(false);
    setChgCurrent(""); setChgNew(""); setChgConfirm("");
    setChgError(""); setChgSuccess("");
  };

  // ── OTP / Reset password ──
  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendOTP = async () => {
    setSendingOtp(true);
    setOtpError("");
    const code = generateOTP();
    setOtpCode(code);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { otp_code: code, to_email: ADMIN_EMAIL },
        EMAILJS_PUBLIC_KEY
      );
      setOtpSent(true);
    } catch {
      // EmailJS non configuré : affichage du code à l'écran
      setOtpSent(true);
      setOtpError(`⚠️ Email non envoyé (service non configuré). Code temporaire : ${code}`);
    }
    setSendingOtp(false);
  };

  const handleVerifyOTP = () => {
    if (otpInput.trim() === otpCode) {
      setOtpVerified(true);
      setOtpError("");
    } else {
      setOtpError("Code incorrect. Veuillez réessayer.");
    }
  };

  const handleChangePasswordReset = () => {
    if (newPwd.length < 6) { setOtpError("Minimum 6 caractères."); return; }
    if (newPwd !== confirmPwd) { setOtpError("Les mots de passe ne correspondent pas."); return; }
    localStorage.setItem("hdl_admin_pwd", newPwd);
    setPwdChanged(true);
    setOtpError("");
  };

  const resetForgotFlow = () => {
    setForgotPwd(false); setOtpSent(false); setOtpVerified(false);
    setOtpCode(""); setOtpInput(""); setNewPwd(""); setConfirmPwd("");
    setOtpError(""); setPwdChanged(false);
  };

  // ── Change password from dashboard ──
  const handleChangePwdDashboard = () => {
    setChgError(""); setChgSuccess("");
    if (chgCurrent !== getStoredPwd()) { setChgError("Mot de passe actuel incorrect."); return; }
    if (chgNew.length < 6) { setChgError("Nouveau mot de passe : minimum 6 caractères."); return; }
    if (chgNew !== chgConfirm) { setChgError("Les mots de passe ne correspondent pas."); return; }
    localStorage.setItem("hdl_admin_pwd", chgNew);
    setChgCurrent(""); setChgNew(""); setChgConfirm("");
    setChgSuccess("✅ Mot de passe modifié avec succès !");
    setTimeout(() => { setChgSuccess(""); setShowChangePwd(false); }, 2500);
  };

  const averageRating = allFeedbacks.length
    ? (allFeedbacks.reduce((s, f) => s + f.rating, 0) / allFeedbacks.length).toFixed(1)
    : "—";

  // ─── STYLES ──────────────────────────
  const font    = `'Cormorant Garamond', 'Georgia', serif`;
  const sans    = `'DM Sans', 'Segoe UI', sans-serif`;
  const gold    = "#E8C47C";
  const goldD   = "#D4A855";
  const txtL    = "rgba(255,255,255,0.92)";
  const txtM    = "rgba(255,255,255,0.52)";
  const bgGrad  = "linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)";
  const cardBg  = "rgba(255,255,255,0.05)";
  const cardBdr = "1px solid rgba(232,196,124,0.15)";

  const wrap = {
    minHeight: "100vh", background: bgGrad,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px 16px", fontFamily: sans,
    position: "relative", overflow: "hidden",
  };

  const orb = (top, left, color, size) => ({
    position: "absolute", top, left, width: size, height: size,
    background: color, borderRadius: "50%",
    filter: "blur(110px)", opacity: 0.13, pointerEvents: "none",
  });

  const card = {
    background: cardBg, backdropFilter: "blur(40px)",
    border: cardBdr, borderRadius: 28, padding: "44px 40px",
    maxWidth: 520, width: "100%", position: "relative",
    boxShadow: "0 25px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? "translateY(0)" : "translateY(14px)",
    transition: "opacity 0.35s ease, transform 0.35s ease",
  };

  const btnP = {
    background: `linear-gradient(135deg, ${gold}, ${goldD})`,
    color: "#1a1a2e", border: "none", borderRadius: 14,
    padding: "15px 36px", fontSize: 15, fontWeight: 700,
    fontFamily: sans, cursor: "pointer", transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(232,196,124,0.28)", letterSpacing: 0.4,
  };

  const btnS = {
    background: "rgba(255,255,255,0.07)", color: txtL,
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
    padding: "13px 26px", fontSize: 14, fontFamily: sans,
    cursor: "pointer", transition: "all 0.25s ease",
  };

  const inputStyle = (hasError) => ({
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasError ? "#E74C3C" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 13, padding: "14px 18px", fontSize: 15, color: txtL,
    fontFamily: sans, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.25s",
  });

  const h = {
    fontFamily: font, fontWeight: 600, fontSize: 30, color: txtL,
    margin: 0, lineHeight: 1.2, letterSpacing: -0.4,
  };

  const sub = {
    fontSize: 14, color: txtM,
    margin: "10px 0 28px", lineHeight: 1.65,
  };

  // ─── ADMIN LOGIN ─────────────────────
  if (showAdminLogin) {

    // ── Mot de passe oublié : succès ──
    if (forgotPwd && pwdChanged) {
      return (
        <div style={wrap}>
          <div style={orb("5%", "-8%", "#1ABC9C", "420px")} />
          <div style={{ ...card, maxWidth: 420, textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <h2 style={{ ...h, fontSize: 22 }}>Mot de passe modifié !</h2>
            <p style={{ fontSize: 13, color: txtM, margin: "10px 0 28px" }}>
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <button onClick={() => { resetForgotFlow(); }} style={{ ...btnP, width: "100%" }}>
              Se connecter
            </button>
          </div>
        </div>
      );
    }

    // ── Nouveau mot de passe ──
    if (forgotPwd && otpVerified) {
      return (
        <div style={wrap}>
          <div style={orb("5%", "-8%", gold, "420px")} />
          <div style={{ ...card, maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>🔑</div>
              <h2 style={{ ...h, fontSize: 22 }}>Nouveau mot de passe</h2>
              <p style={{ fontSize: 13, color: txtM, margin: "8px 0 0" }}>
                Choisissez un nouveau mot de passe sécurisé (min. 6 caractères)
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setOtpError(""); }}
                placeholder="Nouveau mot de passe"
                style={{ ...inputStyle(!!otpError), letterSpacing: 2 }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
                onBlur={(e) => (e.target.style.borderColor = otpError ? "#E74C3C" : "rgba(255,255,255,0.1)")}
              />
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value); setOtpError(""); }}
                placeholder="Confirmer le mot de passe"
                style={{ ...inputStyle(!!otpError), letterSpacing: 2 }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
                onBlur={(e) => (e.target.style.borderColor = otpError ? "#E74C3C" : "rgba(255,255,255,0.1)")}
              />
            </div>

            {otpError && <p style={{ fontSize: 12, color: "#E74C3C", margin: "0 0 14px" }}>⚠️ {otpError}</p>}

            <button onClick={handleChangePasswordReset} style={{ ...btnP, width: "100%" }}>
              💾 Enregistrer le nouveau mot de passe
            </button>
          </div>
        </div>
      );
    }

    // ── Saisie du code OTP ──
    if (forgotPwd && otpSent) {
      return (
        <div style={wrap}>
          <div style={orb("5%", "-8%", gold, "420px")} />
          <div style={{ ...card, maxWidth: 420 }}>
            <button onClick={() => { setOtpSent(false); setOtpInput(""); setOtpError(""); }} style={{ background: "none", border: "none", color: txtM, fontSize: 13, cursor: "pointer", fontFamily: sans, marginBottom: 20, display: "flex", alignItems: "center", gap: 5 }}>
              ← Retour
            </button>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>📩</div>
              <h2 style={{ ...h, fontSize: 22 }}>Vérification</h2>
              <p style={{ fontSize: 13, color: txtM, margin: "8px 0 0" }}>
                Un code à 6 chiffres a été envoyé à<br />
                <strong style={{ color: gold }}>{ADMIN_EMAIL}</strong>
              </p>
            </div>

            {otpError && (
              <div style={{ background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#E74C3C" }}>
                {otpError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={otpInput}
                onChange={(e) => { setOtpInput(e.target.value); setOtpError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                placeholder="Entrez le code reçu"
                maxLength={6}
                style={{ ...inputStyle(false), textAlign: "center", fontSize: 22, letterSpacing: 8, fontWeight: 700 }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            <button onClick={handleVerifyOTP} style={{ ...btnP, width: "100%", marginBottom: 12 }}>
              ✅ Vérifier le code
            </button>

            <button onClick={handleSendOTP} style={{ ...btnS, width: "100%", fontSize: 13, textAlign: "center" }}>
              🔄 Renvoyer le code
            </button>
          </div>
        </div>
      );
    }

    // ── Démarrer reset : confirm email ──
    if (forgotPwd) {
      return (
        <div style={wrap}>
          <div style={orb("5%", "-8%", gold, "420px")} />
          <div style={{ ...card, maxWidth: 420 }}>
            <button onClick={() => { setForgotPwd(false); setOtpError(""); }} style={{ background: "none", border: "none", color: txtM, fontSize: 13, cursor: "pointer", fontFamily: sans, marginBottom: 20, display: "flex", alignItems: "center", gap: 5 }}>
              ← Retour
            </button>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>📧</div>
              <h2 style={{ ...h, fontSize: 22 }}>Réinitialisation</h2>
              <p style={{ fontSize: 13, color: txtM, margin: "8px 0 0" }}>
                Un code de vérification sera envoyé à l'adresse enregistrée
              </p>
            </div>

            <div style={{ background: "rgba(232,196,124,0.07)", border: "1px solid rgba(232,196,124,0.2)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>✉️</span>
              <div>
                <p style={{ fontSize: 11, color: txtM, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Email admin</p>
                <p style={{ fontSize: 14, color: gold, fontWeight: 600, margin: 0 }}>{ADMIN_EMAIL}</p>
              </div>
            </div>

            {otpError && <p style={{ fontSize: 12, color: "#E74C3C", margin: "0 0 14px" }}>⚠️ {otpError}</p>}

            <button
              onClick={handleSendOTP}
              disabled={sendingOtp}
              style={{ ...btnP, width: "100%", opacity: sendingOtp ? 0.7 : 1 }}
            >
              {sendingOtp ? "⏳ Envoi en cours..." : "📤 Envoyer le code de vérification"}
            </button>
          </div>
        </div>
      );
    }

    // ── Écran principal de connexion ──
    return (
      <div style={wrap}>
        <div style={orb("5%", "-8%", gold, "420px")} />
        <div style={orb("75%", "85%", "#3498DB", "380px")} />
        <div style={{ ...card, maxWidth: 420 }}>
          <button
            onClick={() => transition(() => { setShowAdminLogin(false); setAdminError(""); setAdminPassword(""); })}
            style={{ background: "none", border: "none", color: txtM, fontSize: 13, cursor: "pointer", fontFamily: sans, marginBottom: 20, display: "flex", alignItems: "center", gap: 5 }}
          >
            ← Retour
          </button>

          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔐</div>
            <h2 style={{ ...h, fontSize: 24, textAlign: "center" }}>Espace Administrateur</h2>
            <p style={{ fontSize: 13, color: txtM, margin: "8px 0 0" }}>
              Accès réservé à l'administrateur et à la Direction
            </p>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: txtM, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setAdminError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              placeholder="••••••••"
              style={{ ...inputStyle(!!adminError), letterSpacing: 3 }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
              onBlur={(e) => (e.target.style.borderColor = adminError ? "#E74C3C" : "rgba(255,255,255,0.1)")}
            />
            {adminError && (
              <p style={{ fontSize: 12, color: "#E74C3C", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 5 }}>
                ⚠️ {adminError}
              </p>
            )}
          </div>

          {/* Lien mot de passe oublié */}
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <button
              onClick={() => { setForgotPwd(true); setAdminError(""); setAdminPassword(""); }}
              style={{ background: "none", border: "none", fontSize: 12, color: gold, cursor: "pointer", fontFamily: sans, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <button onClick={handleAdminLogin} style={{ ...btnP, width: "100%" }}>
            🔓 Accéder au tableau de bord
          </button>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", margin: "16px 0 0" }}>
            HDL-AVIS · Système de gestion des avis
          </p>
        </div>
      </div>
    );
  }

  // ─── ADMIN DASHBOARD ─────────────────
  if (showDashboard && adminAuth) {
    const filteredFeedbacks = filterService === "all"
      ? allFeedbacks
      : allFeedbacks.filter((f) => f.service === filterService);

    const filteredAvg = filteredFeedbacks.length
      ? (filteredFeedbacks.reduce((s, f) => s + f.rating, 0) / filteredFeedbacks.length).toFixed(1)
      : "—";

    const serviceStats = SERVICES.map((svc) => {
      const fbs = allFeedbacks.filter((f) => f.service === svc.id);
      const avg = fbs.length
        ? (fbs.reduce((sum, f) => sum + f.rating, 0) / fbs.length).toFixed(1)
        : null;
      return { ...svc, count: fbs.length, avg };
    }).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);

    const avgByCategory = () => {
      if (!filteredFeedbacks.length) return [];
      return CATEGORIES["hopital"].map((cat) => {
        const vals = filteredFeedbacks.map((f) => f.categoryRatings[cat.id]).filter(Boolean);
        return { ...cat, avg: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—" };
      });
    };

    return (
      <div style={{ ...wrap, alignItems: "flex-start", paddingTop: 32 }}>
        <div style={orb("5%", "-8%", gold, "420px")} />
        <div style={orb("75%", "85%", "#3498DB", "380px")} />

        <div style={{ ...card, maxWidth: 820, opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(14px)" }}>

          {/* ── EN-TÊTE ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ ...h, fontSize: 22, margin: 0 }}>📊 Tableau de Bord Admin</h1>
              <p style={{ fontSize: 12, color: txtM, margin: "4px 0 0" }}>HDL-AVIS · Espace Direction</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowChangePwd(!showChangePwd)} style={{ ...btnS, padding: "9px 16px", fontSize: 12 }}>
                🔑 Mot de passe
              </button>
              <button onClick={() => transition(() => { setShowDashboard(false); setService(null); })} style={{ ...btnS, padding: "9px 16px", fontSize: 13 }}>
                ← Accueil
              </button>
              <button onClick={handleAdminLogout} style={{ background: "rgba(231,76,60,0.12)", color: "#E74C3C", border: "1px solid rgba(231,76,60,0.25)", borderRadius: 14, padding: "9px 16px", fontSize: 13, fontFamily: sans, cursor: "pointer" }}>
                🔒 Déconnexion
              </button>
            </div>
          </div>

          {/* ── CHANGER MOT DE PASSE (dashboard) ── */}
          {showChangePwd && (
            <div style={{ background: "rgba(232,196,124,0.05)", border: "1px solid rgba(232,196,124,0.2)", borderRadius: 18, padding: "20px 22px", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: gold }}>🔑 Changer le mot de passe</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <input
                  type="password"
                  value={chgCurrent}
                  onChange={(e) => { setChgCurrent(e.target.value); setChgError(""); setChgSuccess(""); }}
                  placeholder="Mot de passe actuel"
                  style={{ ...inputStyle(!!chgError), fontSize: 13, padding: "11px 14px" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <input
                  type="password"
                  value={chgNew}
                  onChange={(e) => { setChgNew(e.target.value); setChgError(""); setChgSuccess(""); }}
                  placeholder="Nouveau mot de passe"
                  style={{ ...inputStyle(!!chgError), fontSize: 13, padding: "11px 14px" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <input
                  type="password"
                  value={chgConfirm}
                  onChange={(e) => { setChgConfirm(e.target.value); setChgError(""); setChgSuccess(""); }}
                  placeholder="Confirmer"
                  style={{ ...inputStyle(!!chgError), fontSize: 13, padding: "11px 14px" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
              {chgError && <p style={{ fontSize: 12, color: "#E74C3C", margin: "10px 0 0" }}>⚠️ {chgError}</p>}
              {chgSuccess && <p style={{ fontSize: 12, color: "#1ABC9C", margin: "10px 0 0" }}>{chgSuccess}</p>}
              <button onClick={handleChangePwdDashboard} style={{ ...btnP, marginTop: 12, fontSize: 13, padding: "11px 24px" }}>
                💾 Enregistrer
              </button>
            </div>
          )}

          {/* ── KPI CARDS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total avis",     value: allFeedbacks.length,                          icon: "📝", color: gold },
              { label: "Note moyenne",   value: averageRating,                                icon: "⭐", color: "#1ABC9C" },
              { label: "Commentaires",  value: allFeedbacks.filter((f) => f.comment).length, icon: "💬", color: "#3498DB" },
              { label: "Services actifs",value: serviceStats.length,                          icon: "🏥", color: "#9B59B6" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: font }}>{s.value}</div>
                <div style={{ fontSize: 10, color: txtM, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── FILTRE PAR SERVICE ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: txtM, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px" }}>
              Filtrer par service
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <button
                onClick={() => setFilterService("all")}
                style={{ background: filterService === "all" ? "rgba(232,196,124,0.18)" : "rgba(255,255,255,0.04)", border: `1px solid ${filterService === "all" ? gold : "rgba(255,255,255,0.1)"}`, borderRadius: 99, padding: "6px 14px", fontSize: 12, color: filterService === "all" ? gold : txtM, cursor: "pointer", fontFamily: sans, fontWeight: 600, transition: "all 0.2s" }}
              >
                Tous ({allFeedbacks.length})
              </button>
              {SERVICES.filter((svc) => allFeedbacks.some((f) => f.service === svc.id)).map((svc) => {
                const count = allFeedbacks.filter((f) => f.service === svc.id).length;
                return (
                  <button
                    key={svc.id}
                    onClick={() => setFilterService(svc.id)}
                    style={{ background: filterService === svc.id ? "rgba(232,196,124,0.18)" : "rgba(255,255,255,0.04)", border: `1px solid ${filterService === svc.id ? gold : "rgba(255,255,255,0.1)"}`, borderRadius: 99, padding: "6px 14px", fontSize: 12, color: filterService === svc.id ? gold : txtM, cursor: "pointer", fontFamily: sans, fontWeight: 600, transition: "all 0.2s" }}
                  >
                    {svc.icon} {svc.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
            {/* ── STATS PAR SERVICE ── */}
            {serviceStats.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "18px 16px" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: gold, textTransform: "uppercase", letterSpacing: 1 }}>
                  🏥 Avis par service
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {serviceStats.map((s) => {
                    const pct = s.avg ? (s.avg / 5) * 100 : 0;
                    const barColor = s.avg >= 4 ? "#1ABC9C" : s.avg >= 3 ? "#F1C40F" : "#E74C3C";
                    return (
                      <div key={s.id} onClick={() => setFilterService(s.id === filterService ? "all" : s.id)}
                        style={{ background: filterService === s.id ? "rgba(232,196,124,0.06)" : "transparent", borderRadius: 10, padding: "9px 10px", cursor: "pointer", transition: "background 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 16 }}>{s.icon}</span>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: txtL }}>{s.label}</span>
                          <span style={{ fontSize: 10, color: txtM }}>{s.count} avis</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{s.avg}/5</span>
                        </div>
                        <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${barColor}, ${gold})`, borderRadius: 99, transition: "width 0.8s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── NOTES PAR CRITÈRE ── */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "18px 16px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: gold, textTransform: "uppercase", letterSpacing: 1 }}>
                📋 Critères
                <span style={{ fontSize: 11, color: txtM, fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>
                  {filteredFeedbacks.length} avis · moy. {filteredAvg}/5
                </span>
              </h3>
              {filteredFeedbacks.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {avgByCategory().map((cat) => (
                    <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                      <span style={{ width: 20, textAlign: "center" }}>{cat.icon}</span>
                      <span style={{ flex: 1, color: txtL }}>{cat.label}</span>
                      <div style={{ width: 90, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: cat.avg !== "—" ? `${(cat.avg / 5) * 100}%` : "0%", height: "100%", background: `linear-gradient(90deg,${gold},${goldD})`, borderRadius: 99 }} />
                      </div>
                      <span style={{ width: 32, textAlign: "right", fontWeight: 700, color: gold, fontSize: 11 }}>{cat.avg}/5</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: txtM, textAlign: "center", padding: "20px 0" }}>Aucun avis pour ce filtre.</p>
              )}
            </div>
          </div>

          {/* ── LISTE DES AVIS ── */}
          <div>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: gold, textTransform: "uppercase", letterSpacing: 1 }}>
              📝 Tous les avis
              <span style={{ fontSize: 11, color: txtM, fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 8 }}>
                ({filteredFeedbacks.length})
              </span>
            </h3>

            {filteredFeedbacks.length === 0 ? (
              <p style={{ textAlign: "center", color: txtM, fontSize: 14, padding: "30px 0" }}>Aucun avis collecté pour le moment.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                {[...filteredFeedbacks].reverse().map((f) => {
                  const svc = SERVICES.find((s) => s.id === f.service);
                  const emo = EMOJIS.find((e) => e.score === f.emoji);
                  const isSelected = selectedFeedback === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFeedback(isSelected ? null : f.id)}
                      style={{ background: isSelected ? "rgba(232,196,124,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${isSelected ? "rgba(232,196,124,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "13px 16px", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{emo?.emoji ?? "😐"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {svc && (
                              <span style={{ fontSize: 11, color: gold, background: "rgba(232,196,124,0.1)", border: "1px solid rgba(232,196,124,0.2)", borderRadius: 99, padding: "2px 9px", fontWeight: 600 }}>
                                {svc.icon} {svc.label}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: emo?.color ?? txtM, fontWeight: 600 }}>{emo?.label}</span>
                            <span style={{ fontSize: 11, color: txtM }}>{"⭐".repeat(f.rating)} {f.rating}/5</span>
                          </div>
                          {f.comment && !isSelected && (
                            <p style={{ fontSize: 12, color: txtM, margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 400 }}>
                              "{f.comment}"
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: txtM }}>{f.date}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{isSelected ? "▲ Réduire" : "▼ Détails"}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                          {Object.keys(f.categoryRatings).length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <p style={{ fontSize: 11, color: txtM, fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Notes par critère</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {CATEGORIES["hopital"].map((cat) => {
                                  const val = f.categoryRatings[cat.id];
                                  if (!val) return null;
                                  return (
                                    <span key={cat.id} style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "4px 10px", color: txtL }}>
                                      {cat.icon} {cat.label} : <strong style={{ color: gold }}>{val}/5</strong>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {f.comment && (
                            <div style={{ marginBottom: 10 }}>
                              <p style={{ fontSize: 11, color: txtM, fontWeight: 600, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: 0.5 }}>Commentaire</p>
                              <p style={{ fontSize: 13, color: txtL, lineHeight: 1.6, fontStyle: "italic", margin: 0, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px" }}>
                                "{f.comment}"
                              </p>
                            </div>
                          )}
                          {f.contact && (
                            <div>
                              <p style={{ fontSize: 11, color: txtM, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Contact</p>
                              <p style={{ fontSize: 13, color: gold, margin: 0 }}>✉️ {f.contact}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── MERCI ───────────────────────────
  if (submitted) {
    return (
      <div style={wrap}>
        {showConfetti && <Confetti />}
        <div style={orb("5%", "-8%", "#1ABC9C", "380px")} />
        <div style={orb("75%", "85%", gold, "320px")} />
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontSize: 68, marginBottom: 14 }}>🎉</div>
          <h1 style={h}>Merci beaucoup !</h1>
          <p style={sub}>
            Votre avis est précieux et nous aide à améliorer nos services. Nous prenons en compte chaque
            retour pour vous offrir une meilleure expérience.
          </p>
          <div style={{ background: "rgba(26,188,156,0.1)", border: "1px solid rgba(26,188,156,0.25)", borderRadius: 14, padding: "15px 20px", marginBottom: 28, fontSize: 14, color: "#1ABC9C", fontWeight: 600 }}>
            ✅ Votre avis a été enregistré avec succès
          </div>
          <button onClick={handleReset} style={{ ...btnP, width: "100%" }}>Donner un nouvel avis</button>
        </div>
      </div>
    );
  }

  // ─── SÉLECTION SERVICE ───────────────
  if (service === null) {
    return (
      <div style={wrap}>
        <div style={orb("5%", "-8%", gold, "450px")} />
        <div style={orb("75%", "85%", "#3498DB", "380px")} />

        <div style={{ ...card, maxWidth: 580 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: txtM, letterSpacing: 3, textTransform: "uppercase" }}>🏥 Bienvenue au</span>
            </div>
            <h1 style={{
              fontFamily: font, fontSize: 62, fontWeight: 700, color: gold,
              letterSpacing: 6, textTransform: "uppercase", margin: "0 0 6px", lineHeight: 1,
              textShadow: "0 0 50px rgba(232,196,124,0.35), 0 2px 20px rgba(232,196,124,0.2)",
            }}>
              HDL-AVIS
            </h1>
            <div style={{ width: 60, height: 2, background: `linear-gradient(90deg,${gold},${goldD})`, margin: "12px auto 16px", borderRadius: 99 }} />
            <h2 style={{ ...h, fontSize: 20, color: txtL, fontWeight: 400, margin: "0 0 6px" }}>
              Quel service<br />
              <span style={{ color: gold, fontWeight: 600 }}>avez-vous visité ?</span>
            </h2>
            <p style={{ fontSize: 13, color: txtM, margin: 0 }}>
              Sélectionnez le service concerné par votre avis
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {SERVICES.map((s) => (
              <button
                key={s.id}
                onClick={() => transition(() => setService(s.id))}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "15px 13px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer", transition: "all 0.22s ease", textAlign: "left" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(232,196,124,0.08)";
                  e.currentTarget.style.borderColor = "rgba(232,196,124,0.35)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(232,196,124,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: txtL, lineHeight: 1.25 }}>{s.label}</span>
              </button>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 22 }}>
            <button
              onClick={() => transition(() => setShowAdminLogin(true))}
              style={{ background: "none", border: "none", fontSize: 11, color: "rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: sans, letterSpacing: 0.5, transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(232,196,124,0.5)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
            >
              🔐 Espace Administration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ÉTAPES ──────────────────────────
  const categories = CATEGORIES[mode];

  return (
    <div style={wrap}>
      <div style={orb("5%", "-8%", gold, "400px")} />
      <div style={orb("75%", "85%", "#3498DB", "360px")} />

      <div style={card}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button
              onClick={() => transition(() => { if (step > 0) setStep(step - 1); else setService(null); })}
              style={{ background: "none", border: "none", color: txtM, fontSize: 13, cursor: "pointer", fontFamily: sans, display: "flex", alignItems: "center", gap: 5 }}
            >
              ← Retour
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {service && (
                <span style={{ fontSize: 11, color: gold, background: "rgba(232,196,124,0.1)", border: "1px solid rgba(232,196,124,0.2)", borderRadius: 99, padding: "3px 10px" }}>
                  {SERVICES.find((s) => s.id === service)?.icon}{" "}{SERVICES.find((s) => s.id === service)?.label}
                </span>
              )}
              <span style={{ fontSize: 12, color: txtM }}>{step + 1} / {totalSteps}</span>
            </div>
          </div>
          <ProgressBar step={step + 1} total={totalSteps} />
        </div>

        {step === 0 && (
          <div>
            <h2 style={{ ...h, textAlign: "center" }}>
              Comment évaluez-vous<br />
              <span style={{ color: gold }}>votre expérience ?</span>
            </h2>
            <p style={{ ...sub, textAlign: "center" }}>Sélectionnez l'emoji qui correspond à votre ressenti</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
              {EMOJIS.map((e) => (
                <button
                  key={e.score}
                  onClick={() => setSelectedEmoji(e.score)}
                  style={{
                    background: selectedEmoji === e.score ? `${e.color}18` : "rgba(255,255,255,0.03)",
                    border: `2px solid ${selectedEmoji === e.score ? e.color : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 18, padding: "16px 12px 12px", cursor: "pointer",
                    transition: "all 0.25s ease", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 7, minWidth: 76,
                    transform: selectedEmoji === e.score ? "scale(1.07)" : "scale(1)",
                    boxShadow: selectedEmoji === e.score ? `0 4px 14px ${e.color}30` : "none",
                  }}
                >
                  <span style={{ fontSize: 34 }}>{e.emoji}</span>
                  <span style={{ fontSize: 10, color: selectedEmoji === e.score ? e.color : txtM, lineHeight: 1.2, fontWeight: 600 }}>
                    {e.label}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 28, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 13, color: txtM, textAlign: "center", marginBottom: 12 }}>Note globale</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <button
              disabled={!selectedEmoji || !rating}
              onClick={() => transition(() => setStep(1))}
              style={{ ...btnP, width: "100%", opacity: !selectedEmoji || !rating ? 0.38 : 1, cursor: !selectedEmoji || !rating ? "default" : "pointer" }}
            >
              Continuer →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ ...h, textAlign: "center" }}>
              Évaluez chaque <span style={{ color: gold }}>aspect</span>
            </h2>
            <p style={{ ...sub, textAlign: "center" }}>Notez les critères qui comptent pour vous</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {categories.map((cat) => (
                <div key={cat.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <span style={{ fontSize: 13, color: txtL, fontWeight: 500 }}>{cat.label}</span>
                  </div>
                  <StarRating size={20} value={categoryRatings[cat.id] || 0} onChange={(v) => setCategoryRatings((prev) => ({ ...prev, [cat.id]: v }))} />
                </div>
              ))}
            </div>
            <button onClick={() => transition(() => setStep(2))} style={{ ...btnP, width: "100%" }}>Continuer →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ ...h, textAlign: "center" }}>
              Un <span style={{ color: gold }}>commentaire</span> ?
            </h2>
            <p style={{ ...sub, textAlign: "center" }}>Partagez plus de détails pour nous aider à nous améliorer</p>
            <textarea
              ref={commentRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience, suggestions d'amélioration..."
              rows={5}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 18px", fontSize: 14, color: txtL, fontFamily: sans, resize: "vertical", outline: "none", lineHeight: 1.6, marginBottom: 16, boxSizing: "border-box", transition: "border-color 0.25s" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 24 }}>
              {["Personnel très aimable", "Temps d'attente trop long", "Locaux propres", "À améliorer", "Excellente prise en charge"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setComment((prev) => (prev ? prev + ". " + tag : tag))}
                  style={{ background: "rgba(232,196,124,0.08)", border: "1px solid rgba(232,196,124,0.2)", borderRadius: 99, padding: "7px 14px", fontSize: 11, color: gold, cursor: "pointer", fontFamily: sans, fontWeight: 600, transition: "all 0.2s" }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <button onClick={() => transition(() => setStep(3))} style={{ ...btnP, width: "100%" }}>Continuer →</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ ...h, textAlign: "center" }}>
              Presque <span style={{ color: gold }}>terminé</span> !
            </h2>
            <p style={{ ...sub, textAlign: "center" }}>Laissez votre email si vous souhaitez être recontacté (optionnel)</p>
            <input
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="votre@email.com (optionnel)"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: "14px 18px", fontSize: 14, color: txtL, fontFamily: sans, outline: "none", marginBottom: 22, boxSizing: "border-box", transition: "border-color 0.25s" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(232,196,124,0.45)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,196,124,0.12)", borderRadius: 18, padding: "18px 22px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: txtM, marginBottom: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                Résumé de votre avis
              </div>
              {service && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "7px 12px", background: "rgba(232,196,124,0.07)", borderRadius: 10 }}>
                  <span style={{ fontSize: 16 }}>{SERVICES.find((s) => s.id === service)?.icon}</span>
                  <span style={{ fontSize: 13, color: gold, fontWeight: 700 }}>{SERVICES.find((s) => s.id === service)?.label}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{EMOJIS.find((e) => e.score === selectedEmoji)?.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, color: txtL, fontWeight: 700 }}>{EMOJIS.find((e) => e.score === selectedEmoji)?.label}</div>
                  <div style={{ fontSize: 12, color: txtM }}>{"⭐".repeat(rating)} ({rating}/5)</div>
                </div>
              </div>
              {comment && (
                <div style={{ fontSize: 13, color: txtM, fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, marginTop: 8, lineHeight: 1.5 }}>
                  "{comment}"
                </div>
              )}
            </div>
            <button onClick={handleSubmit} style={{ ...btnP, width: "100%" }}>
              ✨ Envoyer mon avis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
