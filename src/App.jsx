import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";

// ============================================================
// SECTION 1: CONFIGURATION & CONSTANTS
// ============================================================
const EMAILJS_PUBLIC_KEY  = "VOTRE_PUBLIC_KEY";
const EMAILJS_SERVICE_ID  = "VOTRE_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "VOTRE_TEMPLATE_ID";
const ADMIN_EMAIL         = "manwaherberttchando@gmail.com";

const DEFAULT_PASSWORD = "HDL@2024";
const getStoredPwd = () => localStorage.getItem("hdl_admin_pwd") || DEFAULT_PASSWORD;

const API = "/api/feedbacks";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  return res.json();
}

const CATEGORIES = {
  hopital: [
    { id: "accueil",  label: "Accueil",             icon: "👋" },
    { id: "soins",    label: "Qualité des soins",   icon: "🩺" },
    { id: "attente",  label: "Temps d'attente",     icon: "⏱️" },
    { id: "proprete", label: "Propreté",            icon: "✨" },
    { id: "ecoute",   label: "Écoute du personnel", icon: "👂" },
    { id: "info",     label: "Information reçue",   icon: "📋" },
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
  { score: 1, emoji: "😡", label: "Très insatisfait", color: "#DC2626" },
  { score: 2, emoji: "😞", label: "Insatisfait",      color: "#EA580C" },
  { score: 3, emoji: "😐", label: "Neutre",           color: "#D97706" },
  { score: 4, emoji: "😊", label: "Satisfait",        color: "#059669" },
  { score: 5, emoji: "🤩", label: "Très satisfait",   color: "#0D9488" },
];

// ============================================================
// SECTION 2: UTILITY FUNCTIONS
// ============================================================
function getDateBoundTs(filter) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (filter === "today") return todayStart;
  if (filter === "week")  return todayStart - 6 * 86400000;
  if (filter === "month") return todayStart - 29 * 86400000;
  return 0;
}

function buildTimeline(feedbacks, filter) {
  const days = filter === "today" ? 1 : filter === "week" ? 7 : 30;
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d     = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i));
    const start = d.getTime();
    const end   = start + 86400000;
    const fbs   = feedbacks.filter((f) => f.id >= start && f.id < end);
    const avg   = fbs.length ? (fbs.reduce((s, f) => s + f.rating, 0) / fbs.length).toFixed(1) : null;
    const label = i === days - 1 ? "Auj." : i === days - 2 ? "Hier" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    return { label, count: fbs.length, avg, date: d.toLocaleDateString("fr-FR") };
  });
}

function buildHourly(feedbacks) {
  const now  = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Array.from({ length: 24 }, (_, h) => {
    const start = base + h * 3600000;
    const end   = start + 3600000;
    const fbs   = feedbacks.filter((f) => f.id >= start && f.id < end);
    const avg   = fbs.length ? (fbs.reduce((s, f) => s + f.rating, 0) / fbs.length).toFixed(1) : null;
    return { label: `${String(h).padStart(2, "0")}h`, count: fbs.length, avg };
  });
}

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const navigate = (newHash) => { window.location.hash = newHash; };
  const path = hash.replace("#", "") || "/";
  const parts = path.split("/").filter(Boolean);
  return { path, parts, navigate };
}

// ============================================================
// SECTION 3: DESIGN SYSTEM
// ============================================================
const C = {
  bgPage: "#F8F9FB", bgWhite: "#FFFFFF", bgSubtle: "#F1F3F5", bgHover: "#E9ECEF",
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryDark: "#1D4ED8",
  textDark: "#111827", textBody: "#374151", textMuted: "#6B7280", textLight: "#9CA3AF",
  border: "#E5E7EB", borderLight: "#F3F4F6",
  success: "#059669", successBg: "#ECFDF5",
  warning: "#D97706", warningBg: "#FFFBEB",
  danger: "#DC2626", dangerBg: "#FEF2F2",
  accent: "#7C3AED", accentBg: "#F5F3FF",
};

const ff = "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const S = {
  card: {
    background: C.bgWhite, borderRadius: 12, border: `1px solid ${C.border}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  },
  btnPrimary: {
    background: C.primary, color: "#fff", border: "none", borderRadius: 10,
    padding: "14px 28px", fontSize: 15, fontWeight: 600, fontFamily: ff,
    cursor: "pointer", transition: "all 0.2s ease",
  },
  btnSecondary: {
    background: C.bgWhite, color: C.textBody, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "12px 24px", fontSize: 14, fontFamily: ff,
    cursor: "pointer", transition: "all 0.2s ease",
  },
  input: (err) => ({
    width: "100%", background: C.bgWhite, border: `1px solid ${err ? C.danger : C.border}`,
    borderRadius: 10, padding: "12px 16px", fontSize: 15, color: C.textDark,
    fontFamily: ff, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
  }),
  filterPill: (active) => ({
    background: active ? C.primaryLight : C.bgWhite, border: `1px solid ${active ? C.primary : C.border}`,
    borderRadius: 99, padding: "6px 14px", fontSize: 13, color: active ? C.primary : C.textMuted,
    cursor: "pointer", fontFamily: ff, fontWeight: active ? 600 : 400, transition: "all 0.2s",
  }),
};

// ============================================================
// SECTION 4: SHARED UI COMPONENTS
// ============================================================
function StarRating({ value, onChange, size = 36 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          style={{
            background: "none", border: "none", cursor: "pointer", fontSize: size, lineHeight: 1, padding: 2,
            transition: "transform 0.15s ease",
            transform: (hover || value) >= star ? "scale(1.15)" : "scale(1)",
            opacity: (hover || value) >= star ? 1 : 0.25,
          }}
        >⭐</button>
      ))}
    </div>
  );
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ width: "100%", height: 4, background: C.borderLight, borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${(step / total) * 100}%`, height: "100%", background: C.primary, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Confetti() {
  const colors = [C.primary, C.success, "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  const pieces = Array.from({ length: 45 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360, size: 6 + Math.random() * 8,
  }));
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1000, overflow: "hidden" }}>
      {pieces.map((p) => (
        <div key={p.id} style={{ position: "absolute", left: `${p.left}%`, top: -20, width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 2, transform: `rotate(${p.rotation}deg)`, animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards` }} />
      ))}
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

function TimelineChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const hasData  = data.some((d) => d.count > 0);

  if (!hasData) return <p style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "24px 0" }}>Aucun avis sur cette periode.</p>;

  return (
    <div style={{ position: "relative" }}>
      {hovered !== null && data[hovered]?.count > 0 && (
        <div style={{ position: "absolute", top: -44, left: `${(hovered / data.length) * 100}%`, transform: "translateX(-50%)", background: C.bgWhite, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.textDark, whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontWeight: 500 }}>
          {data[hovered].date ?? data[hovered].label} — {data[hovered].count} avis{data[hovered].avg && ` — ${data[hovered].avg}/5`}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", gap: data.length > 15 ? 3 : 5, height: 100, marginBottom: 8 }}>
        {data.map((d, i) => {
          const pct   = (d.count / maxCount) * 100;
          const color = d.avg >= 4 ? C.success : d.avg >= 3 ? C.warning : d.avg ? C.danger : C.borderLight;
          return (
            <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: d.count > 0 ? "pointer" : "default" }}>
              <div style={{ width: "100%", height: `${Math.max(pct, d.count > 0 ? 8 : 0)}%`, minHeight: d.count > 0 ? 6 : 2, background: hovered === i ? C.primary : color, borderRadius: "4px 4px 0 0", transition: "all 0.2s ease" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: data.length > 15 ? 3 : 5 }}>
        {data.map((d, i) => {
          const show = data.length <= 7 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1;
          return <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.textLight, overflow: "hidden" }}>{show ? d.label : ""}</div>;
        })}
      </div>
    </div>
  );
}

// ============================================================
// SECTION 5: MAIN APP
// ============================================================
export default function FeedbackApp() {
  const { path, parts, navigate } = useHashRoute();

  // Form state
  const [mode]                                    = useState("hopital");
  const [step, setStep]                           = useState(0);
  const [rating, setRating]                       = useState(0);
  const [selectedEmoji, setSelectedEmoji]         = useState(null);
  const [categoryRatings, setCategoryRatings]     = useState({});
  const [comment, setComment]                     = useState("");
  const [contact, setContact]                     = useState("");
  const [showConfetti, setShowConfetti]           = useState(false);
  const [allFeedbacks, setAllFeedbacks]           = useState([]);

  // Admin
  const [adminAuth, setAdminAuth]                 = useState(false);
  const [adminPassword, setAdminPassword]         = useState("");
  const [adminError, setAdminError]               = useState("");
  const [filterService, setFilterService]         = useState("all");
  const [dateFilter, setDateFilter]               = useState("all");
  const [selectedFeedback, setSelectedFeedback]   = useState(null);

  // DB
  const [dbLoading, setDbLoading]                 = useState(false);
  const [dbError, setDbError]                     = useState("");
  const [dbSaving, setDbSaving]                   = useState(false);

  // Forgot password
  const [forgotPwd, setForgotPwd]                 = useState(false);
  const [otpSent, setOtpSent]                     = useState(false);
  const [otpCode, setOtpCode]                     = useState("");
  const [otpInput, setOtpInput]                   = useState("");
  const [otpVerified, setOtpVerified]             = useState(false);
  const [newPwd, setNewPwd]                       = useState("");
  const [confirmPwd, setConfirmPwd]               = useState("");
  const [otpError, setOtpError]                   = useState("");
  const [sendingOtp, setSendingOtp]               = useState(false);
  const [pwdChanged, setPwdChanged]               = useState(false);

  // Change password dashboard
  const [showChangePwd, setShowChangePwd]         = useState(false);
  const [chgCurrent, setChgCurrent]               = useState("");
  const [chgNew, setChgNew]                       = useState("");
  const [chgConfirm, setChgConfirm]               = useState("");
  const [chgError, setChgError]                   = useState("");
  const [chgSuccess, setChgSuccess]               = useState("");

  const commentRef = useRef(null);
  const totalSteps = 4;

  // Derive current view from route
  const serviceId = path.startsWith("/feedback/") ? parts[1] : null;
  const service = serviceId ? SERVICES.find(s => s.id === serviceId) : null;

  let currentView;
  if (path.startsWith("/admin/dashboard")) currentView = adminAuth ? "dashboard" : "admin";
  else if (path.startsWith("/admin")) currentView = "admin";
  else if (path === "/merci") currentView = "merci";
  else if (path.startsWith("/feedback/") && service) currentView = "feedback";
  else currentView = "home";

  // Redirect to admin login if not authenticated
  useEffect(() => {
    if (path.startsWith("/admin/dashboard") && !adminAuth) navigate("/admin");
  }, [path, adminAuth]);

  // Reset form when leaving feedback
  useEffect(() => {
    if (!path.startsWith("/feedback/")) {
      setStep(0); setRating(0); setSelectedEmoji(null);
      setCategoryRatings({}); setComment(""); setContact("");
    }
  }, [path]);

  // Fetch feedbacks
  const fetchFeedbacks = async () => {
    try {
      setDbLoading(true); setDbError("");
      const data = await apiFetch(API);
      setAllFeedbacks(Array.isArray(data) ? data : []);
    } catch (err) {
      setDbError(err.message);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (currentView !== "dashboard" || !adminAuth) return;
    fetchFeedbacks();
    const interval = setInterval(fetchFeedbacks, 20000);
    return () => clearInterval(interval);
  }, [currentView, adminAuth]);

  // Handlers
  const handleSubmit = async () => {
    const feedback = {
      id: Date.now(), mode, service: serviceId, service_label: service?.label || "",
      rating, emoji: selectedEmoji, categoryRatings, comment, contact,
      date: new Date().toLocaleString("fr-FR"),
    };
    setAllFeedbacks((prev) => [...prev, feedback]);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
    navigate("/merci");
    setDbSaving(true);
    try { await apiFetch(API, { method: "POST", body: JSON.stringify(feedback) }); }
    catch (err) { console.error("Sauvegarde DB echouee :", err.message); }
    finally { setDbSaving(false); }
  };

  const handleAdminLogin = () => {
    if (adminPassword === getStoredPwd()) {
      setAdminAuth(true); setAdminError(""); setAdminPassword("");
      navigate("/admin/dashboard");
    } else {
      setAdminError("Mot de passe incorrect.");
    }
  };

  const handleAdminLogout = () => {
    setAdminAuth(false); setFilterService("all"); setDateFilter("all");
    setSelectedFeedback(null); setShowChangePwd(false);
    setChgCurrent(""); setChgNew(""); setChgConfirm(""); setChgError(""); setChgSuccess("");
    navigate("/");
  };

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendOTP = async () => {
    setSendingOtp(true); setOtpError("");
    const code = generateOTP(); setOtpCode(code);
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { otp_code: code, to_email: ADMIN_EMAIL }, EMAILJS_PUBLIC_KEY);
      setOtpSent(true);
    } catch {
      setOtpSent(true);
      setOtpError(`Email non envoye (service non configure). Code temporaire : ${code}`);
    }
    setSendingOtp(false);
  };

  const handleVerifyOTP = () => {
    if (otpInput.trim() === otpCode) { setOtpVerified(true); setOtpError(""); }
    else setOtpError("Code incorrect.");
  };

  const handleChangePasswordReset = () => {
    if (newPwd.length < 6) { setOtpError("Minimum 6 caracteres."); return; }
    if (newPwd !== confirmPwd) { setOtpError("Les mots de passe ne correspondent pas."); return; }
    localStorage.setItem("hdl_admin_pwd", newPwd);
    setPwdChanged(true); setOtpError("");
  };

  const resetForgotFlow = () => {
    setForgotPwd(false); setOtpSent(false); setOtpVerified(false);
    setOtpCode(""); setOtpInput(""); setNewPwd(""); setConfirmPwd("");
    setOtpError(""); setPwdChanged(false);
  };

  const handleChangePwdDashboard = () => {
    setChgError(""); setChgSuccess("");
    if (chgCurrent !== getStoredPwd()) { setChgError("Mot de passe actuel incorrect."); return; }
    if (chgNew.length < 6) { setChgError("Minimum 6 caracteres."); return; }
    if (chgNew !== chgConfirm) { setChgError("Les mots de passe ne correspondent pas."); return; }
    localStorage.setItem("hdl_admin_pwd", chgNew);
    setChgCurrent(""); setChgNew(""); setChgConfirm("");
    setChgSuccess("Mot de passe modifie !");
    setTimeout(() => { setChgSuccess(""); setShowChangePwd(false); }, 2500);
  };

  // ─── PAGE LAYOUT WRAPPER ──────────────
  const PageWrap = ({ children, style = {} }) => (
    <div style={{ minHeight: "100vh", background: C.bgPage, fontFamily: ff, ...style }}>{children}</div>
  );

  const TopBar = ({ right }) => (
    <div style={{ background: C.bgWhite, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.primary, letterSpacing: -0.5 }}>HDL-AVIS</span>
        <span style={{ fontSize: 13, color: C.textMuted, borderLeft: `1px solid ${C.border}`, paddingLeft: 10 }}>Votre avis compte</span>
      </div>
      {right}
    </div>
  );

  // ============================================================
  // VIEW: HOME
  // ============================================================
  if (currentView === "home") {
    return (
      <PageWrap>
        <TopBar right={
          <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", fontSize: 13, color: C.textMuted, cursor: "pointer", fontFamily: ff }}>
            Administration
          </button>
        } />
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: C.textDark, margin: "0 0 8px" }}>Quel service avez-vous visite ?</h1>
            <p style={{ fontSize: 16, color: C.textMuted, margin: 0 }}>Selectionnez le service concerne par votre avis</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
            {SERVICES.map((s) => (
              <button key={s.id} onClick={() => navigate(`/feedback/${s.id}`)}
                style={{ ...S.card, padding: "18px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.15s ease", textAlign: "left", fontFamily: ff }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = S.card.boxShadow; }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.textDark }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </PageWrap>
    );
  }

  // ============================================================
  // VIEW: FEEDBACK FORM
  // ============================================================
  if (currentView === "feedback") {
    const categories = CATEGORIES[mode];
    return (
      <PageWrap>
        {/* Nav bar */}
        <div style={{ background: C.bgWhite, borderBottom: `1px solid ${C.border}`, padding: "12px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => { if (step > 0) setStep(step - 1); else navigate("/"); }}
              style={{ background: "none", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: ff, display: "flex", alignItems: "center", gap: 6 }}>
              ← Retour
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: C.primary, background: C.primaryLight, borderRadius: 99, padding: "4px 12px", fontWeight: 600 }}>
                {service?.icon} {service?.label}
              </span>
              <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>{step + 1} / {totalSteps}</span>
            </div>
          </div>
          <div style={{ maxWidth: 640, margin: "10px auto 0" }}>
            <ProgressBar step={step + 1} total={totalSteps} />
          </div>
        </div>

        {/* Form content */}
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 24px" }}>

          {/* Step 0: Sentiment */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: C.textDark, textAlign: "center", margin: "0 0 8px" }}>Comment evaluez-vous votre experience ?</h2>
              <p style={{ fontSize: 15, color: C.textMuted, textAlign: "center", margin: "0 0 32px" }}>Selectionnez l'emoji qui correspond a votre ressenti</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
                {EMOJIS.map((e) => (
                  <button key={e.score} onClick={() => setSelectedEmoji(e.score)}
                    style={{
                      ...S.card, padding: "18px 14px 14px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 84, transition: "all 0.2s ease", fontFamily: ff,
                      borderColor: selectedEmoji === e.score ? e.color : C.border,
                      background: selectedEmoji === e.score ? `${e.color}0D` : C.bgWhite,
                      transform: selectedEmoji === e.score ? "scale(1.05)" : "scale(1)",
                    }}>
                    <span style={{ fontSize: 36 }}>{e.emoji}</span>
                    <span style={{ fontSize: 12, color: selectedEmoji === e.score ? e.color : C.textMuted, fontWeight: 600 }}>{e.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ ...S.card, padding: 20, textAlign: "center", marginBottom: 28 }}>
                <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 12px", fontWeight: 500 }}>Note globale</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <button disabled={!selectedEmoji || !rating} onClick={() => setStep(1)}
                style={{ ...S.btnPrimary, width: "100%", opacity: !selectedEmoji || !rating ? 0.4 : 1, cursor: !selectedEmoji || !rating ? "default" : "pointer" }}>
                Continuer
              </button>
            </div>
          )}

          {/* Step 1: Categories */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: C.textDark, textAlign: "center", margin: "0 0 8px" }}>Evaluez chaque aspect</h2>
              <p style={{ fontSize: 15, color: C.textMuted, textAlign: "center", margin: "0 0 28px" }}>Notez les criteres qui comptent pour vous</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {categories.map((cat) => (
                  <div key={cat.id} style={{ ...S.card, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      <span style={{ fontSize: 14, color: C.textDark, fontWeight: 500 }}>{cat.label}</span>
                    </div>
                    <StarRating size={20} value={categoryRatings[cat.id] || 0} onChange={(v) => setCategoryRatings((prev) => ({ ...prev, [cat.id]: v }))} />
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)} style={{ ...S.btnPrimary, width: "100%" }}>Continuer</button>
            </div>
          )}

          {/* Step 2: Comment */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: C.textDark, textAlign: "center", margin: "0 0 8px" }}>Un commentaire ?</h2>
              <p style={{ fontSize: 15, color: C.textMuted, textAlign: "center", margin: "0 0 28px" }}>Partagez plus de details pour nous aider a nous ameliorer</p>
              <textarea ref={commentRef} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Decrivez votre experience, suggestions d'amelioration..." rows={5}
                style={{ ...S.input(false), resize: "vertical", lineHeight: 1.6, marginBottom: 16, minHeight: 120 }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
                {["Personnel tres aimable", "Temps d'attente trop long", "Locaux propres", "A ameliorer", "Excellente prise en charge"].map((tag) => (
                  <button key={tag} onClick={() => setComment((prev) => (prev ? prev + ". " + tag : tag))}
                    style={{ background: C.primaryLight, border: `1px solid ${C.primary}20`, borderRadius: 99, padding: "7px 14px", fontSize: 12, color: C.primary, cursor: "pointer", fontFamily: ff, fontWeight: 500 }}>
                    {tag}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(3)} style={{ ...S.btnPrimary, width: "100%" }}>Continuer</button>
            </div>
          )}

          {/* Step 3: Contact & Summary */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: C.textDark, textAlign: "center", margin: "0 0 8px" }}>Presque termine !</h2>
              <p style={{ fontSize: 15, color: C.textMuted, textAlign: "center", margin: "0 0 28px" }}>Laissez votre email si vous souhaitez etre recontacte (optionnel)</p>
              <input type="email" value={contact} onChange={(e) => setContact(e.target.value)}
                placeholder="votre@email.com (optionnel)" style={{ ...S.input(false), marginBottom: 24 }} />
              <div style={{ ...S.card, padding: 20, marginBottom: 28 }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Resume de votre avis</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 14px", background: C.primaryLight, borderRadius: 10 }}>
                  <span style={{ fontSize: 16 }}>{service?.icon}</span>
                  <span style={{ fontSize: 14, color: C.primary, fontWeight: 700 }}>{service?.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <span style={{ fontSize: 32 }}>{EMOJIS.find((e) => e.score === selectedEmoji)?.emoji}</span>
                  <div>
                    <div style={{ fontSize: 15, color: C.textDark, fontWeight: 600 }}>{EMOJIS.find((e) => e.score === selectedEmoji)?.label}</div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>{"⭐".repeat(rating)} ({rating}/5)</div>
                  </div>
                </div>
                {comment && <div style={{ fontSize: 14, color: C.textMuted, fontStyle: "italic", borderTop: `1px solid ${C.borderLight}`, paddingTop: 12, marginTop: 8, lineHeight: 1.6 }}>"{comment}"</div>}
                {contact && <div style={{ fontSize: 13, color: C.primary, marginTop: 8 }}>{contact}</div>}
              </div>
              <button onClick={handleSubmit} style={{ ...S.btnPrimary, width: "100%" }}>Envoyer mon avis</button>
            </div>
          )}
        </div>
      </PageWrap>
    );
  }

  // ============================================================
  // VIEW: MERCI
  // ============================================================
  if (currentView === "merci") {
    return (
      <PageWrap style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {showConfetti && <Confetti />}
        <div style={{ maxWidth: 480, width: "100%", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36 }}>✓</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.textDark, margin: "0 0 10px" }}>Merci beaucoup !</h1>
          <p style={{ fontSize: 16, color: C.textMuted, margin: "0 0 28px", lineHeight: 1.6 }}>Votre avis est precieux et nous aide a ameliorer nos services.</p>
          <div style={{ background: C.successBg, border: `1px solid ${C.success}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 28, fontSize: 15, color: C.success, fontWeight: 600 }}>
            Votre avis a ete enregistre avec succes
          </div>
          <button onClick={() => navigate("/")} style={{ ...S.btnPrimary, width: "100%" }}>Donner un nouvel avis</button>
        </div>
      </PageWrap>
    );
  }

  // ============================================================
  // VIEW: ADMIN LOGIN
  // ============================================================
  if (currentView === "admin") {
    const adminCard = { ...S.card, maxWidth: 420, width: "100%", padding: 32 };

    // Password changed success
    if (forgotPwd && pwdChanged) {
      return (
        <PageWrap style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={adminCard}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textDark, margin: "0 0 8px" }}>Mot de passe modifie</h2>
              <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 24px" }}>Vous pouvez maintenant vous connecter.</p>
              <button onClick={resetForgotFlow} style={{ ...S.btnPrimary, width: "100%" }}>Se connecter</button>
            </div>
          </div>
        </PageWrap>
      );
    }

    // New password
    if (forgotPwd && otpVerified) {
      return (
        <PageWrap style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={adminCard}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textDark, margin: "0 0 6px", textAlign: "center" }}>Nouveau mot de passe</h2>
            <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 24px", textAlign: "center" }}>Minimum 6 caracteres</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <input type="password" value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setOtpError(""); }} placeholder="Nouveau mot de passe" style={S.input(!!otpError)} />
              <input type="password" value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setOtpError(""); }} placeholder="Confirmer" style={S.input(!!otpError)} />
            </div>
            {otpError && <p style={{ fontSize: 13, color: C.danger, margin: "0 0 14px" }}>{otpError}</p>}
            <button onClick={handleChangePasswordReset} style={{ ...S.btnPrimary, width: "100%" }}>Enregistrer</button>
          </div>
        </PageWrap>
      );
    }

    // OTP verification
    if (forgotPwd && otpSent) {
      return (
        <PageWrap style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={adminCard}>
            <button onClick={() => { setOtpSent(false); setOtpInput(""); setOtpError(""); }}
              style={{ background: "none", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: ff, marginBottom: 20 }}>← Retour</button>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textDark, margin: "0 0 8px" }}>Verification</h2>
              <p style={{ fontSize: 14, color: C.textMuted }}>Code envoye a <strong style={{ color: C.primary }}>{ADMIN_EMAIL}</strong></p>
            </div>
            {otpError && <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: C.danger }}>{otpError}</div>}
            <input type="text" value={otpInput} onChange={(e) => { setOtpInput(e.target.value); setOtpError(""); }} onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
              placeholder="Code a 6 chiffres" maxLength={6} style={{ ...S.input(false), textAlign: "center", fontSize: 22, letterSpacing: 8, fontWeight: 700, marginBottom: 16 }} />
            <button onClick={handleVerifyOTP} style={{ ...S.btnPrimary, width: "100%", marginBottom: 10 }}>Verifier le code</button>
            <button onClick={handleSendOTP} style={{ ...S.btnSecondary, width: "100%", textAlign: "center" }}>Renvoyer le code</button>
          </div>
        </PageWrap>
      );
    }

    // Send OTP
    if (forgotPwd) {
      return (
        <PageWrap style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={adminCard}>
            <button onClick={() => { setForgotPwd(false); setOtpError(""); }}
              style={{ background: "none", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: ff, marginBottom: 20 }}>← Retour</button>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textDark, margin: "0 0 8px" }}>Reinitialisation</h2>
              <p style={{ fontSize: 14, color: C.textMuted }}>Un code sera envoye a l'adresse enregistree</p>
            </div>
            <div style={{ background: C.primaryLight, borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 2px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Email admin</p>
                <p style={{ fontSize: 14, color: C.primary, fontWeight: 600, margin: 0 }}>{ADMIN_EMAIL}</p>
              </div>
            </div>
            {otpError && <p style={{ fontSize: 13, color: C.danger, margin: "0 0 14px" }}>{otpError}</p>}
            <button onClick={handleSendOTP} disabled={sendingOtp} style={{ ...S.btnPrimary, width: "100%", opacity: sendingOtp ? 0.7 : 1 }}>
              {sendingOtp ? "Envoi en cours..." : "Envoyer le code"}
            </button>
          </div>
        </PageWrap>
      );
    }

    // Main login
    return (
      <PageWrap style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={adminCard}>
          <button onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: ff, marginBottom: 24 }}>← Retour</button>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>🔒</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textDark, margin: "0 0 6px" }}>Espace Administrateur</h2>
            <p style={{ fontSize: 14, color: C.textMuted }}>Acces reserve a l'administrateur</p>
          </div>
          <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Mot de passe</label>
          <input type="password" value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAdminError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} placeholder="••••••••"
            style={{ ...S.input(!!adminError), letterSpacing: 3, marginBottom: 8 }} />
          {adminError && <p style={{ fontSize: 13, color: C.danger, margin: "0 0 8px" }}>{adminError}</p>}
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <button onClick={() => { setForgotPwd(true); setAdminError(""); setAdminPassword(""); }}
              style={{ background: "none", border: "none", fontSize: 13, color: C.primary, cursor: "pointer", fontFamily: ff }}>
              Mot de passe oublie ?
            </button>
          </div>
          <button onClick={handleAdminLogin} style={{ ...S.btnPrimary, width: "100%" }}>Acceder au tableau de bord</button>
        </div>
      </PageWrap>
    );
  }

  // ============================================================
  // VIEW: DASHBOARD
  // ============================================================
  if (currentView === "dashboard") {
    const boundTs           = getDateBoundTs(dateFilter);
    const dateFeedbacks     = allFeedbacks.filter((f) => f.id >= boundTs);
    const filteredFeedbacks = filterService === "all" ? dateFeedbacks : dateFeedbacks.filter((f) => f.service === filterService);
    const filteredAvg       = filteredFeedbacks.length ? (filteredFeedbacks.reduce((s, f) => s + f.rating, 0) / filteredFeedbacks.length).toFixed(1) : "—";

    const serviceStats = SERVICES.map((svc) => {
      const fbs = dateFeedbacks.filter((f) => f.service === svc.id);
      const avg = fbs.length ? (fbs.reduce((sum, f) => sum + f.rating, 0) / fbs.length).toFixed(1) : null;
      return { ...svc, count: fbs.length, avg };
    }).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);

    const avgByCategory = () => {
      if (!filteredFeedbacks.length) return [];
      return CATEGORIES["hopital"].map((cat) => {
        const vals = filteredFeedbacks.map((f) => f.categoryRatings[cat.id]).filter(Boolean);
        return { ...cat, avg: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—" };
      });
    };

    const timelineData = dateFilter === "today" ? buildHourly(dateFeedbacks) : buildTimeline(dateFeedbacks, dateFilter);
    const todayStart   = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount   = allFeedbacks.filter((f) => f.id >= todayStart.getTime()).length;
    const satisfaction = dateFeedbacks.length ? Math.round((dateFeedbacks.filter((f) => f.rating >= 4).length / dateFeedbacks.length) * 100) : 0;

    const kpis = [
      { label: "Total avis",    value: allFeedbacks.length,     sub: "depuis le debut",  color: C.primary },
      { label: "Periode",       value: dateFeedbacks.length,    sub: dateFilter === "today" ? "aujourd'hui" : dateFilter === "week" ? "7 jours" : dateFilter === "month" ? "30 jours" : "tout", color: "#3B82F6" },
      { label: "Aujourd'hui",   value: todayCount,              sub: "nouveaux avis",     color: C.success },
      { label: "Note moyenne",  value: filteredAvg !== "—" ? filteredAvg + "/5" : "—", sub: `${filteredFeedbacks.length} avis`, color: C.warning },
      { label: "Satisfaction",  value: dateFeedbacks.length ? satisfaction + "%" : "—",  sub: "notes ≥ 4/5",    color: C.accent },
    ];

    return (
      <PageWrap>
        {/* Header */}
        <div style={{ background: C.bgWhite, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.textDark }}>Tableau de Bord</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.successBg, border: `1px solid ${C.success}30`, borderRadius: 99, padding: "4px 12px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, display: "inline-block", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, color: C.success, fontWeight: 700 }}>LIVE</span>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowChangePwd(!showChangePwd)} style={{ ...S.btnSecondary, padding: "8px 14px", fontSize: 13 }}>Mot de passe</button>
            <button onClick={() => navigate("/")} style={{ ...S.btnSecondary, padding: "8px 14px", fontSize: 13 }}>Accueil</button>
            <button onClick={handleAdminLogout} style={{ background: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontFamily: ff, cursor: "pointer", fontWeight: 500 }}>Deconnexion</button>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

          {/* DB Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: dbError ? C.dangerBg : C.successBg, border: `1px solid ${dbError ? C.danger : C.success}30`, borderRadius: 99, padding: "5px 14px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: dbError ? C.danger : C.success, display: "inline-block", animation: dbLoading ? "pulse 1s infinite" : "none" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: dbError ? C.danger : C.success }}>
                {dbLoading ? "Synchronisation..." : dbError ? "DB deconnectee" : "MySQL AVISDB — Connecte"}
              </span>
            </div>
            {dbError && <span style={{ fontSize: 12, color: C.danger }}>{dbError}</span>}
            <button onClick={fetchFeedbacks} disabled={dbLoading} style={{ ...S.btnSecondary, padding: "5px 14px", fontSize: 12 }}>Actualiser</button>
          </div>

          {/* Change password */}
          {showChangePwd && (
            <div style={{ ...S.card, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: C.textDark }}>Changer le mot de passe</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Mot de passe actuel", chgCurrent, setChgCurrent], ["Nouveau", chgNew, setChgNew], ["Confirmer", chgConfirm, setChgConfirm]].map(([ph, val, setter]) => (
                  <input key={ph} type="password" value={val} onChange={(e) => { setter(e.target.value); setChgError(""); setChgSuccess(""); }} placeholder={ph} style={{ ...S.input(!!chgError), fontSize: 13, padding: "10px 12px" }} />
                ))}
              </div>
              {chgError && <p style={{ fontSize: 13, color: C.danger, margin: "10px 0 0" }}>{chgError}</p>}
              {chgSuccess && <p style={{ fontSize: 13, color: C.success, margin: "10px 0 0" }}>{chgSuccess}</p>}
              <button onClick={handleChangePwdDashboard} style={{ ...S.btnPrimary, marginTop: 12, fontSize: 13, padding: "10px 22px" }}>Enregistrer</button>
            </div>
          )}

          {/* Date filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 600, marginRight: 4 }}>Periode :</span>
            {[
              { key: "today", label: "Aujourd'hui" },
              { key: "week",  label: "7 jours" },
              { key: "month", label: "30 jours" },
              { key: "all",   label: "Tout" },
            ].map((d) => (
              <button key={d.key} onClick={() => setDateFilter(d.key)} style={S.filterPill(dateFilter === d.key)}>{d.label}</button>
            ))}
            {dateFilter !== "all" && <span style={{ fontSize: 13, color: C.textMuted }}>{dateFeedbacks.length} avis</span>}
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
            {kpis.map((k) => (
              <div key={k.label} style={{ ...S.card, padding: "20px 16px", textAlign: "center", borderTop: `3px solid ${k.color}` }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: C.textDark, lineHeight: 1.1, marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textBody, marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div style={{ ...S.card, padding: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.textDark }}>
                Evolution des avis
                <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400, marginLeft: 10 }}>
                  {dateFilter === "today" ? "par heure" : dateFilter === "week" ? "7 derniers jours" : "30 derniers jours"}
                </span>
              </h3>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.textMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.success, display: "inline-block" }} /> ≥ 4/5</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.warning, display: "inline-block" }} /> 3-4/5</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.danger, display: "inline-block" }} /> &lt; 3/5</span>
              </div>
            </div>
            <TimelineChart data={timelineData} />
          </div>

          {/* Two-column: Services + Criteria */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

            {/* Services */}
            <div style={{ ...S.card, padding: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600, color: C.textDark }}>
                Par service
                <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>{dateFeedbacks.length} avis</span>
              </h3>
              {serviceStats.length === 0 ? (
                <p style={{ fontSize: 14, color: C.textMuted, textAlign: "center", padding: "24px 0" }}>Aucun avis sur cette periode.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {serviceStats.map((s) => {
                    const pct = s.avg ? (s.avg / 5) * 100 : 0;
                    const barColor = s.avg >= 4 ? C.success : s.avg >= 3 ? C.warning : C.danger;
                    const isActive = filterService === s.id;
                    return (
                      <div key={s.id} onClick={() => setFilterService(s.id === filterService ? "all" : s.id)}
                        style={{ background: isActive ? C.primaryLight : "transparent", border: `1px solid ${isActive ? C.primary : "transparent"}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", transition: "all 0.15s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 16 }}>{s.icon}</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.textDark }}>{s.label}</span>
                          <span style={{ fontSize: 12, color: C.textMuted, background: C.bgSubtle, borderRadius: 99, padding: "2px 8px" }}>{s.count}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: barColor, minWidth: 36, textAlign: "right" }}>{s.avg}/5</span>
                        </div>
                        <div style={{ width: "100%", height: 4, background: C.borderLight, borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Criteria */}
            <div style={{ ...S.card, padding: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600, color: C.textDark }}>
                Criteres
                {filterService !== "all" && <span style={{ fontSize: 13, color: C.primary, fontWeight: 500, marginLeft: 6 }}>— {SERVICES.find((s) => s.id === filterService)?.label}</span>}
                <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>{filteredFeedbacks.length} avis — {filteredAvg}/5</span>
              </h3>
              {filteredFeedbacks.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {avgByCategory().map((cat) => (
                    <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 20, fontSize: 16 }}>{cat.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, color: C.textDark }}>{cat.label}</span>
                      <div style={{ width: 100, height: 6, background: C.borderLight, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: cat.avg !== "—" ? `${(cat.avg / 5) * 100}%` : "0%", height: "100%", background: C.primary, borderRadius: 99 }} />
                      </div>
                      <span style={{ width: 32, textAlign: "right", fontWeight: 700, color: C.textDark, fontSize: 13 }}>{cat.avg}</span>
                    </div>
                  ))}

                  {/* Distribution */}
                  <div style={{ marginTop: 8, paddingTop: 14, borderTop: `1px solid ${C.borderLight}` }}>
                    <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Distribution</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {EMOJIS.map((e) => {
                        const cnt = filteredFeedbacks.filter((f) => f.emoji === e.score).length;
                        const pct = filteredFeedbacks.length ? Math.round((cnt / filteredFeedbacks.length) * 100) : 0;
                        return (
                          <div key={e.score} style={{ flex: 1, textAlign: "center", background: C.bgSubtle, borderRadius: 10, padding: "10px 4px" }}>
                            <div style={{ fontSize: 20 }}>{e.emoji}</div>
                            <div style={{ fontSize: 14, color: C.textDark, fontWeight: 700, marginTop: 2 }}>{pct}%</div>
                            <div style={{ fontSize: 11, color: C.textMuted }}>{cnt}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 14, color: C.textMuted, textAlign: "center", padding: "24px 0" }}>Aucun avis pour ce filtre.</p>
              )}
            </div>
          </div>

          {/* Service filter pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <button onClick={() => setFilterService("all")} style={S.filterPill(filterService === "all")}>Tous ({dateFeedbacks.length})</button>
            {SERVICES.filter((svc) => dateFeedbacks.some((f) => f.service === svc.id)).map((svc) => {
              const count = dateFeedbacks.filter((f) => f.service === svc.id).length;
              return <button key={svc.id} onClick={() => setFilterService(svc.id)} style={S.filterPill(filterService === svc.id)}>{svc.icon} {svc.label} ({count})</button>;
            })}
          </div>

          {/* Feedback list */}
          <div style={{ ...S.card, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600, color: C.textDark }}>
              Avis detailles
              <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>({filteredFeedbacks.length})</span>
            </h3>
            {filteredFeedbacks.length === 0 ? (
              <p style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "28px 0" }}>Aucun avis sur cette periode / ce service.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 500, overflowY: "auto" }}>
                {[...filteredFeedbacks].reverse().map((f) => {
                  const svc    = SERVICES.find((s) => s.id === f.service);
                  const emo    = EMOJIS.find((e) => e.score === f.emoji);
                  const isOpen = selectedFeedback === f.id;
                  return (
                    <div key={f.id} onClick={() => setSelectedFeedback(isOpen ? null : f.id)}
                      style={{ padding: "14px 0", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer", transition: "background 0.15s",
                        background: isOpen ? C.bgSubtle : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 4px" }}>
                        <span style={{ fontSize: 24 }}>{emo?.emoji ?? "😐"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {svc && <span style={{ fontSize: 12, color: C.primary, background: C.primaryLight, borderRadius: 99, padding: "2px 10px", fontWeight: 600 }}>{svc.icon} {svc.label}</span>}
                            <span style={{ fontSize: 12, color: emo?.color ?? C.textMuted, fontWeight: 600 }}>{emo?.label}</span>
                            <span style={{ fontSize: 12, color: C.textMuted }}>⭐ {f.rating}/5</span>
                          </div>
                          {f.comment && !isOpen && <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 500 }}>"{f.comment}"</p>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: C.textMuted }}>{f.date}</div>
                          <div style={{ fontSize: 10, color: C.textLight, marginTop: 2 }}>{isOpen ? "▲" : "▼"}</div>
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: 14, padding: "14px 16px", background: C.bgWhite, borderRadius: 10, marginLeft: 4, marginRight: 4, border: `1px solid ${C.borderLight}` }}>
                          {Object.keys(f.categoryRatings || {}).length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Notes par critere</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {CATEGORIES["hopital"].map((cat) => {
                                  const val = f.categoryRatings[cat.id];
                                  if (!val) return null;
                                  return <span key={cat.id} style={{ fontSize: 12, background: C.bgSubtle, borderRadius: 8, padding: "4px 10px", color: C.textBody }}>{cat.icon} {cat.label} : <strong style={{ color: C.textDark }}>{val}/5</strong></span>;
                                })}
                              </div>
                            </div>
                          )}
                          {f.comment && (
                            <div style={{ marginBottom: 8 }}>
                              <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Commentaire</p>
                              <p style={{ fontSize: 14, color: C.textBody, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>"{f.comment}"</p>
                            </div>
                          )}
                          {f.contact && <p style={{ fontSize: 13, color: C.primary, margin: 0 }}>{f.contact}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PageWrap>
    );
  }

  return null;
}
