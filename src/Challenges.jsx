import { useState, useEffect } from "react";

const ARENA_PHOTOS = [
  "/jc-gellidon-XmYSlYrupL8-unsplash.jpg",
  "/edgar-chaparro-kB5DnieBLtM-unsplash.jpg",
  "/logan-weaver-lgnwvr-XcBPc0Q_2h8-unsplash.jpg",
  "/kylie-osullivan-BfaBLVCBTI8-unsplash.jpg",
];

const C = {
  bg: "#06060f", surface: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  orange: "#ff5c00", gold: "#ffd700", green: "#22d37a", red: "#ff4d6d",
  blue: "#4fa3ff", purple: "#c084fc", text: "#f0f0ff", muted: "#6b6b88",
};

const TODAY = new Date().toISOString().split("T")[0];
const STORAGE_KEY = `hoopiq_challenges_${TODAY}`;

const DAILY_CHALLENGES = [
  {
    id: "top_scorer",
    icon: "🏆",
    title: "Top Scorer ce soir",
    question: "Quel joueur marquera le plus de points ce soir ?",
    type: "choice",
    options: ["LeBron James", "Nikola Jokic", "Stephen Curry", "Kevin Durant"],
    answer: "Nikola Jokic",
    points: 150,
    color: C.gold,
  },
  {
    id: "team_winner",
    icon: "🏀",
    title: "Vainqueur du soir",
    question: "Lakers vs Warriors — qui gagne ce soir ?",
    type: "choice",
    options: ["Los Angeles Lakers", "Golden State Warriors"],
    answer: "Los Angeles Lakers",
    points: 100,
    color: C.orange,
  },
  {
    id: "points_lebron",
    icon: "🎯",
    title: "Points LeBron",
    question: "Combien de points LeBron James ce soir ? (fourchette)",
    type: "choice",
    options: ["Moins de 20", "20–25", "26–30", "Plus de 30"],
    answer: "26–30",
    points: 200,
    color: C.blue,
  },
];

const BONUS_CHALLENGE = {
  id: "bonus",
  icon: "⚡",
  title: "Défi Bonus",
  question: "Combien de triple-doubles cette nuit NBA ?",
  type: "choice",
  options: ["0", "1", "2", "3+"],
  answer: "1",
  points: 300,
  color: C.purple,
};

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

function ChallengeCard({ challenge, progress, onAnswer, revealed }) {
  const state = progress[challenge.id];
  const answered = !!state;
  const correct = answered && state === challenge.answer;

  return (
    <div style={{
      background: answered
        ? correct ? "rgba(34,211,122,0.07)" : "rgba(255,77,109,0.07)"
        : C.surface,
      border: `1px solid ${answered ? (correct ? "rgba(34,211,122,0.3)" : "rgba(255,77,109,0.3)") : C.border}`,
      borderRadius: 18, padding: "22px 24px",
      transition: "all 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, fontSize: 22,
            background: `${challenge.color}18`, border: `1px solid ${challenge.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{challenge.icon}</div>
          <div>
            <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 18, letterSpacing: 1, color: challenge.color }}>{challenge.title}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>+{challenge.points} pts</div>
          </div>
        </div>
        {answered && (
          <div style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800,
            background: correct ? "rgba(34,211,122,0.15)" : "rgba(255,77,109,0.15)",
            color: correct ? C.green : C.red,
          }}>
            {correct ? "✓ CORRECT" : "✗ RATÉ"}
          </div>
        )}
      </div>

      <p style={{ fontSize: 14, color: C.text, marginBottom: 18, lineHeight: 1.5 }}>{challenge.question}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {challenge.options.map(opt => {
          const isSelected = state === opt;
          const isCorrect = revealed && opt === challenge.answer;
          const isWrong = revealed && isSelected && !isCorrect;
          return (
            <button
              key={opt}
              disabled={answered}
              onClick={() => onAnswer(challenge.id, opt)}
              style={{
                padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: answered ? "default" : "pointer",
                fontFamily: "inherit", textAlign: "left", transition: "all .2s",
                background: isCorrect ? "rgba(34,211,122,0.18)" : isWrong ? "rgba(255,77,109,0.18)" : isSelected ? `${challenge.color}18` : "rgba(255,255,255,0.04)",
                border: `1px solid ${isCorrect ? "rgba(34,211,122,0.5)" : isWrong ? "rgba(255,77,109,0.5)" : isSelected ? `${challenge.color}50` : C.border}`,
                color: isCorrect ? C.green : isWrong ? C.red : isSelected ? challenge.color : C.text,
              }}
            >
              {isCorrect && "✓ "}{isWrong && "✗ "}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Challenges() {
  const [progress, setProgress] = useState(loadProgress);
  const [revealed, setRevealed] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [arenaIdx, setArenaIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setArenaIdx(i => (i + 1) % ARENA_PHOTOS.length), 8000);
    return () => clearInterval(t);
  }, []);

  const allChallenges = [...DAILY_CHALLENGES, ...(showBonus ? [BONUS_CHALLENGE] : [])];
  const answeredCount = Object.keys(progress).length;
  const totalPoints = allChallenges.reduce((sum, c) => {
    return progress[c.id] === c.answer ? sum + c.points : sum;
  }, 0);
  const maxPoints = allChallenges.reduce((sum, c) => sum + c.points, 0);
  const allAnswered = allChallenges.every(c => progress[c.id]);

  const handleAnswer = (id, opt) => {
    const next = { ...progress, [id]: opt };
    setProgress(next);
    saveProgress(next);
    const challenge = allChallenges.find(c => c.id === id);
    if (challenge && Object.keys(next).length === DAILY_CHALLENGES.length) setRevealed(true);
  };

  const completionPct = Math.round((answeredCount / allChallenges.length) * 100);

  return (
    <div className="fade-in">
      <style>{`
        @keyframes popIn { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* Arena hero banner — slideshow */}
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 24, height: 160 }}>
        {ARENA_PHOTOS.map((src, i) => (
          <div key={src} style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center 40%",
            opacity: i === arenaIdx ? 1 : 0, transition: "opacity 2s ease-in-out",
          }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(6,6,15,0.85) 0%, rgba(6,6,15,0.4) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 46, letterSpacing: 2, lineHeight: 1, margin: 0 }}>
            DÉFIS <span style={{ color: C.orange }}>QUOTIDIENS</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 6 }}>
            3 défis · Réinitialisés chaque jour à minuit · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>


      {/* Score bar */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", marginBottom: 28, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: C.muted }}>Progression — {answeredCount}/{allChallenges.length} défis</span>
            <span style={{ color: C.orange, fontWeight: 700 }}>{completionPct}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: `${completionPct}%`, height: "100%", background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, borderRadius: 5, transition: "width 0.5s ease" }} />
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "0 20px", borderLeft: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: C.gold, lineHeight: 1 }}>{totalPoints}</div>
          <div style={{ fontSize: 11, color: C.muted }}>/ {maxPoints} pts</div>
        </div>
        {allAnswered && (
          <div style={{ padding: "8px 16px", borderRadius: 12, background: "rgba(255,215,0,0.1)", border: `1px solid rgba(255,215,0,0.3)`, fontSize: 13, color: C.gold, animation: "shimmer 2s infinite" }}>
            🏆 Défis du jour complétés !
          </div>
        )}
      </div>

      {/* Challenges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16, marginBottom: 20 }}>
        {allChallenges.map(c => (
          <ChallengeCard key={c.id} challenge={c} progress={progress} onAnswer={handleAnswer} revealed={revealed} />
        ))}
      </div>

      {/* Bonus unlock */}
      {!showBonus && answeredCount >= DAILY_CHALLENGES.length && (
        <div
          onClick={() => setShowBonus(true)}
          style={{
            padding: "20px 24px", borderRadius: 18, cursor: "pointer",
            background: "rgba(192,132,252,0.07)", border: `1px dashed rgba(192,132,252,0.4)`,
            textAlign: "center", animation: "popIn 0.4s ease",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 20, color: C.purple, letterSpacing: 1 }}>DÉFI BONUS DÉBLOQUÉ</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Clique pour tenter le défi bonus +300 pts</div>
        </div>
      )}

      {/* Streak */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} style={{
            padding: "10px 4px", borderRadius: 10, textAlign: "center",
            background: i < 5 ? "rgba(255,92,0,0.12)" : C.surface,
            border: `1px solid ${i < 5 ? "rgba(255,92,0,0.3)" : C.border}`,
          }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{d}</div>
            <div style={{ fontSize: 16 }}>{i < 5 ? "🔥" : "○"}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 8 }}>🔥 5 jours de série — continue comme ça !</div>
    </div>
  );
}
