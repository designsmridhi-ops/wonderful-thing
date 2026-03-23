import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import bgVideo from "./assets/bg.mp4";

const Video = () => (
  <video
    id="bg-video"
    autoPlay
    loop
    muted
    playsInline
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      minWidth: "130vw",
      minHeight: "130vh",
      width: "auto",
      height: "auto",
      transform: "translate(-50%, -50%)",
      objectFit: "cover",
      zIndex: -1,
      transition: "transform 0.6s ease-out",
    }}
  >
    <source src={bgVideo} type="video/mp4" />
  </video>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authMode, setAuthMode] = useState(null);
  const [screen, setScreen] = useState("home");
  const [response, setResponse] = useState("");
  const [rating, setRating] = useState(0);
  const [entries, setEntries] = useState([]);
  const [todayEntry, setTodayEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("today");
  const [historyView, setHistoryView] = useState("daily");
  const [selectedDayEntries, setSelectedDayEntries] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetchEntries();
      setScreen("home");
      const savedUsername = session.user.user_metadata?.display_name || session.user.email?.split("@")[0];
      setUsername(savedUsername);
    }
  }, [session]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const video = document.getElementById("bg-video");
      if (!video) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      video.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  async function fetchEntries() {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", session.user.id)
      .order("entry_date", { ascending: false });
    setEntries(data || []);
    const today = new Date().toISOString().split("T")[0];
    const todayE = data?.find((e) => e.entry_date === today);
    setTodayEntry(todayE || null);
  }

  async function handleAuth(type) {
    if (type === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: username } }
      });
      if (error) alert(error.message);
      else alert("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  }

  async function submitEntry() {
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("entries").insert({
      user_id: session.user.id,
      entry_date: today,
      response,
      rating,
    });
    if (!error) {
      setResponse("");
      setRating(0);
      setScreen("home");
      fetchEntries();
    }
  }

  const displayName = session?.user?.user_metadata?.display_name || session?.user?.email?.split("@")[0];

  function getWeekEntries() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return entries.filter((e) => new Date(e.entry_date) >= start);
  }

  function getMonthDays() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return { days, year, month };
  }

  function getEntryForDay(day, year, month) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entries.find((e) => e.entry_date === dateStr);
  }

 const Stars = ({ rating, onRate }) => (
  <div style={{ display: "flex", gap: "4px" }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span
        key={n}
        onClick={() => onRate && onRate(n)}
        style={{ fontSize: isMobile ? "16px" : "24px", cursor: onRate ? "pointer" : "default", color: n <= rating ? "#FFE847" : "#ddd" }}
      >
        ★
      </span>
    ))}
  </div>
);
  if (loading) return (
    <div style={s.page}>
      <Video />
      Loading...
    </div>
  );

  if (!session) {
    return (
      <div style={s.page}>
        <Video />
        <div style={s.topRight}>
          <span style={s.authLink} onClick={() => setAuthMode("login")}>Log in</span>
          <span style={s.authDivider}>|</span>
          <span style={s.authLink} onClick={() => setAuthMode("signup")}>Sign up</span>
        </div>
        <h1 style={s.landingTitle}>Something Wonderful</h1>
        {authMode && (
          <div style={s.authCard}>
            <p style={s.authCardTitle}>{authMode === "login" ? "Log in" : "Sign up"}</p>
            {authMode === "signup" && (
              <input style={s.input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            )}
            <input style={s.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={s.input} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button style={s.darkBtn} onClick={() => handleAuth(authMode)}>
              {authMode === "login" ? "Sign In" : "Create Account"}
            </button>
            <p style={s.switchAuth} onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
              {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (screen === "tomorrow") {
    return (
      <div style={s.page}>
        <Video />
        <div style={s.topLeft}>
          <span style={s.navText} onClick={() => setScreen("home")}>home</span>
        </div>
        <div style={s.topRight}>
         <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
  <span style={s.username}>{displayName}'s wonderful life</span>
  <span
    style={{ color: "#fff", cursor: "pointer", fontSize: "12px", opacity: 0.7 }}
    onClick={() => {
      const newName = prompt("Enter new username:", displayName);
      if (newName && newName.trim()) {
        supabase.auth.updateUser({ data: { display_name: newName.trim() } })
          .then(() => window.location.reload());
      }
    }}
  >✏️</span>
</div>
        </div>
        <h1 style={s.title}>Something Wonderful</h1>
        <div style={s.card}>
          <div style={s.outlineBtn}>is going to happen to me tomorrow</div>
          <p style={s.sleepText}>
            Say this before sleeping tonight<br />
            and come back here tomorrow<br />
            night to tell me all about it!
          </p>
        </div>
        <button style={s.backLink} onClick={() => setScreen("home")}>← back</button>
      </div>
    );
  }

  if (screen === "today-entry") {
    return (
      <div style={s.page}>
        <Video />
        <div style={s.topLeft}>
          <span style={s.navText} onClick={() => setScreen("home")}>home</span>
        </div>
        <div style={s.topRight}>
          <span style={s.username}>{displayName}'s wonderful life</span>
        </div>
        <h1 style={s.title}>Something Wonderful</h1>
        <div style={s.card}>
          <div style={s.greenBtn}>happened to me today</div>
          <textarea
            style={s.textarea}
            placeholder="Tell me what happened!"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          <p style={{ ...s.sleepText, textAlign: "left", marginTop: "12px" }}>rate your day</p>
          <Stars rating={rating} onRate={setRating} />
          <button style={{ ...s.darkBtn, marginTop: "16px" }} onClick={submitEntry}>save</button>
        </div>
        <button style={s.backLink} onClick={() => setScreen("home")}>← back</button>
      </div>
    );
  }

  if (!todayEntry && view === "today") {
    return (
      <div style={s.page}>
        <Video />
        <div style={s.topLeft}>
          <span style={s.navText} onClick={() => fetchEntries()}>home</span>
        </div>
        <div style={s.topRight}>
          <span style={s.username}>{displayName}'s wonderful life</span>
        </div>
        <h1 style={s.title}>Something Wonderful</h1>
        <div style={isMobile ? { ...s.btnGroup, width: "calc(100% - 40px)" } : s.btnGroup}>
          <button style={s.outlineBtn} onClick={() => setScreen("tomorrow")}>is going to happen to me tomorrow</button>
          <button style={s.greenBtn} onClick={() => setScreen("today-entry")}>happened to me today</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <Video />
      <div style={s.dashHeader}>
        <h1 style={s.dashTitle}>Something Wonderful</h1>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <span style={s.username}>{displayName}'s wonderful life</span>
          <span style={s.navText} onClick={() => supabase.auth.signOut()}>sign out</span>
        </div>
      </div>

      <div style={s.dashCard}>
        <div style={s.tabRow}>
          <div style={{ display: "flex", gap: "24px" }}>
            <span style={view === "today" ? s.activeTab : s.tab} onClick={() => setView("today")}>Today</span>
            <span style={view === "history" ? s.activeTab : s.tab} onClick={() => setView("history")}>History</span>
          </div>
          {view === "history" && !isMobile && (
            <div style={{ display: "flex", gap: "16px" }}>
              {["daily", "weekly", "monthly"].map((v) => (
                <span key={v} style={historyView === v ? s.activeTab : s.tab} onClick={() => setHistoryView(v)}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </span>
              ))}
            </div>
          )}
        </div>

        {view === "history" && isMobile && (
          <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
            {["daily", "weekly", "monthly"].map((v) => (
              <span key={v} style={historyView === v ? s.activeTab : s.tab} onClick={() => setHistoryView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </span>
            ))}
          </div>
        )}

        {view === "today" && (
          <div>
            <div style={s.entryCard}>
              <p style={s.entryText}>{todayEntry.response}</p>
              <Stars rating={todayEntry.rating} />
            </div>
            <button
              style={{ ...s.outlineBtn, marginTop: "12px", display: "inline-block", padding: "10px 20px", fontSize: "13px" }}
              onClick={() => { setTodayEntry(null); setScreen("home"); }}
            >
              + add another
            </button>
          </div>
        )}

        {view === "history" && historyView === "daily" && (
          <div style={{ marginTop: "16px" }}>
            {entries
              .filter(e => e.entry_date === new Date().toISOString().split("T")[0])
              .map((entry) => (
                <div key={entry.id} style={s.historyRow}>
                  <span style={s.dateLabel}>{new Date(entry.entry_date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span>
                  <div style={s.historyEntryCard}>
                    <span style={s.entryText}>{entry.response}</span>
                    <Stars rating={entry.rating} />
                  </div>
                </div>
              ))}
          </div>
        )}

        {view === "history" && historyView === "weekly" && (
          <div style={{ marginTop: "16px" }}>
            {getWeekEntries().map((entry) => (
              <div key={entry.id} style={s.historyRow}>
                <span style={s.dateLabel}>{new Date(entry.entry_date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span>
                <div style={s.historyEntryCard}>
                  <span style={s.entryText}>{entry.response}</span>
                  <Stars rating={entry.rating} />
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "history" && historyView === "monthly" && (
          <div style={{ marginTop: "16px" }}>
            {selectedDayEntries.length > 0 && (
  <div style={{
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center"
  }} onClick={() => setSelectedDayEntries([])}>
    <div style={{
      backgroundColor: "#fff", borderRadius: "16px", padding: "24px",
      maxWidth: "360px", width: "90%", maxHeight: "80vh", overflowY: "auto"
    }} onClick={e => e.stopPropagation()}>
      <p style={{ fontSize: "12px", color: "#888", fontFamily: "'DM Mono', monospace", marginBottom: "16px" }}>
        {new Date(selectedDayEntries[0].entry_date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
      </p>
      {selectedDayEntries.map((entry, i) => (
        <div key={entry.id} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: i < selectedDayEntries.length - 1 ? "1px solid #eee" : "none" }}>
          <p style={{ fontSize: "15px", color: "#1a1a1a", fontFamily: "'DM Mono', monospace", marginBottom: "8px" }}>
            {entry.response}
          </p>
          <Stars rating={entry.rating} />
        </div>
      ))}
      <button style={{ ...s.darkBtn, marginTop: "8px" }} onClick={() => setSelectedDayEntries([])}>close</button>
    </div>
  </div>
)}
            {(() => {
              const { days, year, month } = getMonthDays();
              const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long" });
              return (
                <div>
                  <p style={s.dateLabel}>{monthName}</p>
                  <div style={s.calendarGrid}>
                    {days.map((day, i) => {
                      const entry = day ? getEntryForDay(day, year, month) : null;
                      const extraCount = day ? entries.filter(e => e.entry_date === `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`).length - 1 : 0;
                      return (
                        <div
                          key={i}
                          style={entry ? s.calDayFilled : day ? s.calDayEmpty : s.calDayNull}
                          onClick={() => {
  if (day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEntries = entries.filter(e => e.entry_date === dateStr);
    if (dayEntries.length > 0) setSelectedDayEntries(dayEntries);
  }
}}
                        >
                          {day && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <span style={s.calDayNum}>{day}</span>
                              {extraCount > 0 && (
                                <span style={{ fontSize: "9px", color: "#3a6b4a", fontFamily: "'DM Mono', monospace" }}>+{extraCount}</span>
                              )}
                            </div>
                          )}
                          {entry && (
                            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", flex: 1, gap: "2px" }}>
                              {!isMobile && (
                                <p style={{ fontSize: "10px", color: "#3a6b4a", margin: 0, fontFamily: "'DM Mono', monospace" }}>
                                  {entry.response.slice(0, 20)}...
                                </p>
                              )}
                              <div style={{ transform: isMobile ? "scale(0.55)" : "scale(1)", transformOrigin: "left bottom" }}>
                                <Stars rating={entry.rating} />
                              </div>
                              {isMobile && (
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f4a7c3" }} />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Corben', Georgia, serif",
    position: "relative",
    padding: "40px 20px",
    boxSizing: "border-box",
    background: "transparent",
    border: "none",
    outline: "none",
  },
  topLeft: {
    position: "absolute",
    top: "24px",
    left: "32px",
  },
  topRight: {
    position: "absolute",
    top: "24px",
    right: "32px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  navText: {
    color: "#fff",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    fontSize: "clamp(9px, 2vw, 14px)",
    whiteSpace: "nowrap",
  },
  authLink: {
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "'DM Mono', monospace",
  },
  authDivider: {
    color: "#fff",
    fontSize: "14px",
  },
 username: {
    color: "#fff",
    fontFamily: "'Corben', Georgia, serif",
    fontSize: "clamp(9px, 2vw, 14px)",
    whiteSpace: "nowrap",
},
  landingTitle: {
    fontSize: "clamp(28px, 6vw, 48px)",
    fontWeight: "normal",
    color: "#fff",
    marginBottom: "40px",
    fontFamily: "'Corben', Georgia, serif",
  },
  title: {
    fontSize: "clamp(22px, 5vw, 36px)",
    fontWeight: "normal",
    color: "#fff",
    marginBottom: "32px",
    textAlign: "center",
    fontFamily: "'Corben', Georgia, serif",
  },
  dashTitle: {
    fontSize: "clamp(18px, 4vw, 32px)",
    fontWeight: "normal",
    color: "#fff",
    margin: 0,
    fontFamily: "'Corben', Georgia, serif",
    whiteSpace: "nowrap",
  },
  authCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "28px",
    width: "280px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  authCardTitle: {
    fontSize: "14px",
    color: "#555",
    margin: 0,
    fontFamily: "'DM Mono', monospace",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
    fontSize: "13px",
    fontFamily: "'DM Mono', monospace",
    boxSizing: "border-box",
  },
  darkBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
  },
  switchAuth: {
    fontSize: "12px",
    color: "#888",
    cursor: "pointer",
    textAlign: "center",
    margin: 0,
    fontFamily: "'DM Mono', monospace",
  },
  btnGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "420px",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: "16px",
    padding: "32px",
    width: "min(420px, calc(100% - 40px))",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    backdropFilter: "blur(8px)",
  },
  outlineBtn: {
    padding: "16px 24px",
    backgroundColor: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    color: "#1a1a1a",
    textAlign: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    WebkitTextStroke: "0.3px #3a6b4a",
  },
  greenBtn: {
    padding: "16px 24px",
    backgroundColor: "#3a6b4a",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    color: "#fff",
    textAlign: "center",
    WebkitTextStroke: "0.3px #1a3d2a",
  },
  sleepText: {
    fontSize: "18px",
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: "1.8",
    margin: 0,
    fontFamily: "'Corben', Georgia, serif",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    fontFamily: "'DM Mono', monospace",
    minHeight: "160px",
    resize: "vertical",
    boxSizing: "border-box",
  },
  backLink: {
    marginTop: "16px",
    background: "rgba(255,255,255,0.85)",
    border: "none",
    color: "#1a1a1a",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    fontSize: "14px",
    padding: "8px 16px",
    borderRadius: "8px",
    backdropFilter: "blur(4px)",
  },
  dashHeader: {
    position: "absolute",
    top: "16px",
    left: "16px",
    right: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  dashCard: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: "20px",
    padding: "clamp(8px, 2vw, 32px)",
    width: "calc(100% - 32px)",
    maxWidth: "1100px",
    marginTop: "clamp(60px, 12vw, 80px)",
    backdropFilter: "blur(8px)",
    minHeight: "500px",
    overflowX: "hidden",
    overflowY: "auto",
    maxHeight: "80vh",
    boxSizing: "border-box",
  },
  tabRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  tab: {
    fontSize: "clamp(13px, 2.5vw, 16px)",
    color: "#ffffff",
    cursor: "pointer",
    fontFamily: "'Corben', Georgia, serif",
  },
  activeTab: {
    fontSize: "clamp(13px, 2.5vw, 16px)",
    color: "#ffffff",
    cursor: "pointer",
    fontFamily: "'Corben', Georgia, serif",
    fontWeight: "600",
},
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "16px",
    maxWidth: "500px",
  },
  entryText: {
    fontSize: "clamp(11px, 2vw, 15px)",
    color: "#1a1a1a",
    marginBottom: "4px",
    fontFamily: "'DM Mono', monospace",
    wordBreak: "break-word",
  },
  historyRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "10px",
  },
  dateLabel: {
    fontSize: "clamp(10px, 2vw, 14px)",
    color: "#1a1a1a",
    minWidth: "60px",
    fontFamily: "'DM Mono', monospace",
    whiteSpace: "nowrap",
  },
  historyEntryCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "10px 14px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "clamp(3px, 1vw, 6px)",
    marginTop: "12px",
  },
  calDayEmpty: {
    backgroundColor: "#d4c97a",
    borderRadius: "8px",
    padding: "4px",
    height: "clamp(45px, 11vw, 120px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    cursor: "pointer",
  },
  calDayFilled: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "4px",
    height: "clamp(45px, 11vw, 120px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    cursor: "pointer",
  },
  calDayNull: {
    height: "clamp(45px, 11vw, 120px)",
  },
  calDayNum: {
    fontSize: "clamp(8px, 1.5vw, 13px)",
    color: "#1a1a1a",
    fontFamily: "'DM Mono', monospace",
  },
};