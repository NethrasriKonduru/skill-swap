// frontend/src/components/FindMentor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "./SubPages.css";

const COIN_COST = 50;

const FindMentor = () => {
  const { user, updateUser, fetchCurrentUser } = useUser();
  const navigate = useNavigate();
  const [mentorRecommendations, setMentorRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  const [registeringId, setRegisteringId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const mentorships = Array.isArray(user?.mentorships) ? user.mentorships : [];
  const completion = Math.min(100, Math.round(user?.profileCompletion || 0));
  const isVerified = Boolean(user?.verified);

  useEffect(() => {
    fetchCurrentUser();
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const t = setTimeout(() => setStatusMessage(null), 3500);
    return () => clearTimeout(t);
  }, [statusMessage]);

  const parseJsonSafely = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      // return fallback with raw text for debugging
      return { __raw: text, message: "Invalid JSON response from server" };
    }
  };

  const loadRecommendations = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to view mentors.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseJsonSafely(res);
      if (!res.ok) {
        const msg = data && data.message ? data.message : data.__raw ? "Server returned non-JSON response" : "Failed to load mentors";
        throw new Error(msg);
      }

      setMentorRecommendations(data.mentorRecommendations || []);
    } catch (err) {
      console.error("Load recommendations error:", err);
      setError(err.message || "Error loading recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (rec) => {
    if (!user) return;
    const existingActive = mentorships.find((m) => m.mentorId === rec.user._id && m.status !== "completed");
    if (existingActive) {
      setStatusMessage({ type: "error", text: "You are already registered with this mentor." });
      return;
    }
    if ((user.points || 0) < COIN_COST) {
      setStatusMessage({ type: "error", text: "Not enough coins." });
      return;
    }

    setRegisteringId(rec.user._id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/auth/register-course", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mentorId: rec.user._id, courseTitle: rec.mentorMatch?.[0] || (rec.user.skills && rec.user.skills[0]) || "Mentorship", coinCost: COIN_COST }),
      });

      const data = await (async () => {
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { return { __raw: txt }; }
      })();

      if (!res.ok) {
        const msg = data && data.message ? data.message : "Failed to register";
        throw new Error(msg);
      }

      // update context with returned user (if provided) or re-fetch current user
      if (data.user) updateUser(data.user);
      await fetchCurrentUser();
      setStatusMessage({ type: "success", text: "Registered — check My Courses." });
      loadRecommendations();
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: err.message || "Registration failed" });
    } finally {
      setRegisteringId(null);
    }
  };

  const handleChat = (mentorUser) => {
    if (!mentorUser?.verified) {
      setStatusMessage({ type: "error", text: "This mentor must verify profile before chat." });
      return;
    }
    navigate("/chat", { state: { peerId: mentorUser._id } });
  };

  const goalOptions = useMemo(() => {
    const goals = Array.isArray(user?.learningGoals) ? user.learningGoals : [];
    return ["all", ...new Set(goals)];
  }, [user]);

  const filteredMentors = useMemo(() => {
    if (filterGoal === "all") return mentorRecommendations;
    const normalized = filterGoal.toLowerCase();
    return mentorRecommendations.filter((rec) =>
      (rec.mentorMatch || []).some((s) => (s || "").toLowerCase() === normalized)
    );
  }, [mentorRecommendations, filterGoal]);

  if (!user) return <p className="page-container">Loading profile...</p>;

  return (
    <div className="page-container fadeIn">
      <Link to="/student-dashboard" className="back-btn">⬅ Back to Dashboard</Link>
      <h1>Find a Mentor</h1>
      <p className="page-subtitle">Match with verified mentors whose skills align with what you want to learn. Spend coins to reserve a mentorship slot instantly.</p>

      {statusMessage && <div className={`page-alert page-alert-${statusMessage.type}`}>{statusMessage.text}</div>}

      <div className={`verification-callout ${isVerified ? "verified" : "pending"}`}>
        <div>
          <h2>{isVerified ? "You’re verified!" : "Complete your profile to reach mentors faster"}</h2>
          <p>Profile completeness: <strong>{completion}%</strong> {user.verificationBadge && <span className="inline-badge">{user.verificationBadge}</span>}</p>
          <div className="callout-progress"><span style={{ width: `${completion}%` }} /></div>
        </div>
        <div className="coins-available">⭐ {user.points || 0} coins available</div>
      </div>

      <div className="mentor-filter-bar">
        <div className="filter-group">
          <label htmlFor="goal-filter">Focus on a learning goal:</label>
          <select id="goal-filter" value={filterGoal} onChange={(e) => setFilterGoal(e.target.value)}>
            {goalOptions.map((g) => <option key={g} value={g}>{g === "all" ? "All goals" : g}</option>)}
          </select>
        </div>
        <button className="refresh-btn" onClick={loadRecommendations} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Matches"}
        </button>
      </div>

      {loading ? <p>Matching you with mentors...</p> :
        error ? <p className="error-text">Unable to load mentors — {error}</p> :
        filteredMentors.length === 0 ? <p>No mentors found for this goal.</p> :
        <div className="recommendation-grid">
          {filteredMentors.map((rec) => {
            const mentorSkills = rec.mentorMatch || [];
            const otherSkills = (rec.user.skills || []).filter(s => !mentorSkills.includes(s)).slice(0,3);
            const mentorshipRecord = mentorships.find(m => m.mentorId === rec.user._id);
            const isCompleted = mentorshipRecord?.status === "completed";
            const isRegistered = mentorshipRecord && mentorshipRecord.status !== "completed";

            return (
              <article key={rec.user._id} className={`recommendation-card ${rec.user.verified ? "verified" : ""}`}>
                <div className="card-header">
                  <div className="avatar">
                    {rec.user.profilePicture ? <img src={rec.user.profilePicture} alt={rec.user.firstName} /> : <span>{(rec.user.firstName || "M")[0]}</span>}
                  </div>
                  <div>
                    <h3>{rec.user.firstName} {rec.user.lastName}</h3>
                    <p className="match-pill">Rank: {Array.from({length: (rec.user.rank || 1)}).map((_,i)=>(<span key={i}>⭐</span>))} &nbsp;&nbsp; Skill Coverage: {Math.round((rec.mentorCoverage || 0) * 100)}%</p>
                    {rec.user.verificationBadge && <p className="badge">{rec.user.verificationBadge}</p>}
                    <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Score: {rec.score}</p>
                  </div>
                </div>

                <div className="card-body">
                  <div className="match-block">
                    <strong>Skills you’ll learn</strong>
                    <div className="tag-row">{mentorSkills.map(s => <span key={s} className="tag">{s}</span>)}</div>
                  </div>
                  {otherSkills.length > 0 && (
                    <div className="match-block secondary">
                      <strong>Bonus expertise</strong>
                      <div className="tag-row">{otherSkills.map(s => <span key={s} className="tag muted">{s}</span>)}</div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="card-actions">
                    <button className="ghost-btn" onClick={() => handleChat(rec.user)}>💬 Chat</button>
                    {rec.user.verified ? (
                      isCompleted ? <span className="status-chip completed">Completed 🎉</span> :
                      isRegistered ? <span className="status-chip registered">Registered ✓</span> :
                      <button className="register-btn" onClick={() => handleRegister(rec)} disabled={registeringId === rec.user._id}>
                        {registeringId === rec.user._id ? "Processing..." : `Spend ${COIN_COST} coins`}
                      </button>
                    ) : <span className="unverified-note">Awaiting verification</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      }
    </div>
  );
};

export default FindMentor;
