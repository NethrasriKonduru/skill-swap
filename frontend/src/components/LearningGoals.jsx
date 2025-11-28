import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import MentorChat from "./MentorChat";
import RegisterCourseModal from "./RegisterCourseModal";
import "./SubPages.css";

const COIN_COST = 100;

const LearningGoals = () => {
  const { user, updateUser, fetchCurrentUser } = useUser();
  const navigate = useNavigate();
  const [newGoal, setNewGoal] = useState("");
  const [mentorRecommendations, setMentorRecommendations] = useState([]);
  const [menteeRecommendations, setMenteeRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsError, setRecsError] = useState("");
  const [selectedMentorRec, setSelectedMentorRec] = useState(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerStatus, setRegisterStatus] = useState("idle");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registeringMentorId, setRegisteringMentorId] = useState(null);
  const [chatMentor, setChatMentor] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const completion = Math.min(100, Math.round(user?.profileCompletion || 0));
  const isVerified = Boolean(user?.verified);
  const verificationBadge = user?.verificationBadge || null;

  useEffect(() => {
    fetchCurrentUser();
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const goals = user?.learningGoals || [];
  const mentorships = Array.isArray(user?.mentorships) ? user.mentorships : [];

  const fetchRecommendations = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRecsLoading(false);
      setRecsError("Log in to view recommendations.");
      return;
    }
    setRecsLoading(true);
    setRecsError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Unable to load recommendations");
      }
      const data = await res.json();
      setMentorRecommendations(data.mentorRecommendations || []);
      setMenteeRecommendations(data.menteeRecommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecsError(error.message || "Unable to load recommendations");
    } finally {
      setRecsLoading(false);
    }
  };

  const closeRegisterModal = () => {
    setRegisterModalOpen(false);
    setTimeout(() => {
      setSelectedMentorRec(null);
      setRegisterStatus("idle");
      setRegisterMessage("");
    }, 250);
  };

  const handleAddGoal = async () => {
    if (!newGoal.trim() || !user) return;
    const goalToAdd = newGoal.trim();
    const updatedGoals = [...goals, goalToAdd];
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ learningGoals: updatedGoals }),
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setNewGoal("");
        setStatusMessage({ type: "success", text: "Learning goal added." });
        fetchRecommendations();
      } else {
        const error = await res.json();
        throw new Error(error.message || "Failed to add goal");
      }
    } catch (err) {
      console.error("Error adding goal:", err);
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteGoal = async (goalToRemove) => {
    if (!user) return;
    const updatedGoals = goals.filter((g) => g !== goalToRemove);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ learningGoals: updatedGoals }),
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setStatusMessage({ type: "success", text: "Learning goal removed." });
        fetchRecommendations();
      }
    } catch (err) {
      console.error("Error deleting goal:", err);
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleChatMentor = (mentorUser) => {
    if (!mentorUser?.verified) {
      setStatusMessage({
        type: "error",
        text: "This mentor needs to verify their profile before you can chat.",
      });
      return;
    }
    setChatMentor(mentorUser);
  };

  const openRegisterModal = (mentorRec) => {
    if (!user) return;
    const existingActive = mentorships.find(
      (m) => m.mentorId === mentorRec.user._id && m.status !== "completed"
    );
    if (existingActive) {
      setStatusMessage({
        type: "error",
        text: "You have already registered with this mentor.",
      });
      return;
    }
    if (user.points < COIN_COST) {
      setStatusMessage({
        type: "error",
        text: "Not enough coins. Earn more by teaching or inviting friends.",
      });
      return;
    }
    setSelectedMentorRec(mentorRec);
    setRegisterStatus("idle");
    setRegisterMessage("");
    setRegisterModalOpen(true);
  };

  const confirmRegisterMentor = async () => {
    if (!selectedMentorRec || !user) return;
    const mentorRec = selectedMentorRec;
    setRegisterStatus("loading");
    setRegisteringMentorId(mentorRec.user._id);
    const token = localStorage.getItem("token");
    const defaultCourseTitle =
      mentorRec.mentorMatch?.[0] ||
      mentorRec.user.skills?.[0] ||
      "Skill Swap Mentorship";

    try {
      const res = await fetch("http://localhost:5000/api/auth/register-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentorId: mentorRec.user._id,
          courseTitle: defaultCourseTitle,
          coinCost: COIN_COST,
          totalLectures: 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to register with mentor");
      }

      updateUser(data.user);
      setRegisterStatus("success");
      setRegisterMessage("You're enrolled! Track progress under My Courses.");
      setStatusMessage({
        type: "success",
        text: `Registered with ${mentorRec.user.firstName || "the mentor"} using ${COIN_COST} coins.`,
      });
      fetchRecommendations();
      setTimeout(() => {
        setRegisterModalOpen(false);
      }, 1500);
    } catch (error) {
      console.error("Error registering course:", error);
      setRegisterStatus("error");
      setRegisterMessage(error.message);
      setStatusMessage({ type: "error", text: error.message });
    } finally {
      setRegisteringMentorId(null);
    }
  };

  if (!user) return <p className="page-container">Loading user data...</p>;

  return (
    <div className="page-container">
      <Link to="/student-dashboard" className="back-btn">
        ⬅ Back to Dashboard
      </Link>
      <h1>Learning Outcomes</h1>
      <p className="page-subtitle">
        Spend coins to activate mentorships with verified profiles that cover your learning goals.
      </p>

      {statusMessage && (
        <div className={`page-alert page-alert-${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <div className={`verification-callout ${isVerified ? "verified" : "pending"}`}>
        <div>
          <h2>
            {isVerified ? "You're ready to connect" : "Get verified to unlock instant mentorships"}
          </h2>
          <p>
            Profile completeness: <strong>{completion}%</strong>
            {verificationBadge && (
              <span className="inline-badge">{verificationBadge}</span>
            )}
          </p>
          <div className="callout-progress">
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
        {!isVerified && (
          <p className="callout-hint">
            Add a profile photo, at least one skill and one learning goal, plus your personal details to get verified.
          </p>
        )}
      </div>

      <div className="goals-section">
        <div className="goals-header">
          <h2>Your Learning Goals</h2>
          <span className="coins-available">⭐ {user.points || 0} coins available</span>
        </div>

        <ul className="skills-list">
          {goals.length > 0 ? (
            goals.map((goal, i) => (
              <li key={i}>
                {goal}
                <button className="delete-btn" onClick={() => handleDeleteGoal(goal)}>
                  ✖
                </button>
              </li>
            ))
          ) : (
            <p>No goals added yet.</p>
          )}
        </ul>

        <div className="add-skill">
          <input
            type="text"
            placeholder="Enter a new goal"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
          />
          <button onClick={handleAddGoal}>Add Goal</button>
        </div>
      </div>

      <section className="recommendations-section">
        <div className="section-header">
          <h2>Recommended Mentors</h2>
          <span className="section-helper">Matches people whose skills cover your goals</span>
        </div>
        {recsLoading ? (
          <p>Loading recommendations...</p>
        ) : recsError ? (
          <p className="error-text">{recsError}</p>
        ) : mentorRecommendations.length === 0 ? (
          <p>No mentor matches just yet. Add more goals to improve suggestions.</p>
        ) : (
          <div className="recommendation-grid">
            {mentorRecommendations.map((rec) => {
              const mentorSkills = rec.mentorMatch || [];
              const mentorMatchSet = new Set(mentorSkills.map((skill) => (skill || "").toLowerCase()));
              const otherSkills = (rec.user.skills || [])
                .filter((skill) => !mentorMatchSet.has((skill || "").toLowerCase()))
                .slice(0, 3);
              const mentorshipRecord = mentorships.find((m) => m.mentorId === rec.user._id);
              const isCompleted = mentorshipRecord?.status === "completed";
              const isRegistered = mentorshipRecord && mentorshipRecord.status !== "completed";

              return (
                <article
                  key={rec.user._id}
                  className={`recommendation-card ${rec.user.verified ? "verified" : ""}`}
                >
                  <div className="card-header">
                    <div className="avatar">
                      {rec.user.profilePicture ? (
                        <img src={rec.user.profilePicture} alt={rec.user.firstName} />
                      ) : (
                        <span>{rec.user.firstName?.[0] || "M"}</span>
                      )}
                    </div>
                    <div>
                      <h3>
                        {rec.user.firstName} {rec.user.lastName}
                      </h3>
                      <p className="match-pill">
                        Covers {Math.round((rec.mentorCoverage || 0) * 100)}% of your goals
                      </p>
                      {rec.user.verificationBadge && (
                        <p className="badge">{rec.user.verificationBadge}</p>
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="match-block">
                      <strong>Skills you need</strong>
                      <div className="tag-row">
                        {mentorSkills.map((skill) => (
                          <span key={skill} className="tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {otherSkills.length > 0 && (
                      <div className="match-block secondary">
                        <strong>Other strengths</strong>
                        <div className="tag-row">
                          {otherSkills.map((skill) => (
                            <span key={skill} className="tag muted">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    <div className="card-actions">
                      <button
                        className="ghost-btn"
                        onClick={() => handleChatMentor(rec.user)}
                      >
                        Chat &amp; Plan Session
                      </button>
                      {rec.user.verified ? (
                        isCompleted ? (
                          <span className="status-chip completed">Completed 🎉</span>
                        ) : isRegistered ? (
                          <span className="status-chip registered">Registered ✓</span>
                        ) : (
                          <button
                            className="register-btn"
                            onClick={() => openRegisterModal(rec)}
                            disabled={
                              registeringMentorId === rec.user._id ||
                              (registerStatus === "loading" &&
                                selectedMentorRec?.user._id === rec.user._id)
                            }
                          >
                            {registeringMentorId === rec.user._id
                              ? "Registering..."
                              : `Spend ${COIN_COST} coins`}
                          </button>
                        )
                      ) : (
                        <span className="unverified-note">Waiting for profile verification</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="recommendations-section">
        <div className="section-header">
          <h2>People You Could Mentor</h2>
          <span className="section-helper">Matches learners who want the skills you have</span>
        </div>
        {recsLoading ? (
          <p>Scanning learners...</p>
        ) : menteeRecommendations.length === 0 ? (
          <p>No mentee matches yet. Add more skills to share your knowledge.</p>
        ) : (
          <div className="recommendation-grid">
            {menteeRecommendations.map((rec) => {
              const menteeGoals = rec.menteeMatch || [];
              const menteeMatchSet = new Set(menteeGoals.map((goal) => (goal || "").toLowerCase()));
              const otherGoals = (rec.user.learningGoals || [])
                .filter((goal) => !menteeMatchSet.has((goal || "").toLowerCase()))
                .slice(0, 3);

              return (
                <article key={rec.user._id} className="recommendation-card mentee">
                  <div className="card-header">
                    <div className="avatar mentee">
                      {rec.user.profilePicture ? (
                        <img src={rec.user.profilePicture} alt={rec.user.firstName} />
                      ) : (
                        <span>{rec.user.firstName?.[0] || "L"}</span>
                      )}
                    </div>
                    <div>
                      <h3>
                        {rec.user.firstName} {rec.user.lastName}
                      </h3>
                      <p className="match-pill">
                        Needs {Math.round((rec.menteeCoverage || 0) * 100)}% of your skills
                      </p>
                      {rec.user.verificationBadge && (
                        <p className="badge">{rec.user.verificationBadge}</p>
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="match-block">
                      <strong>They want to learn</strong>
                      <div className="tag-row">
                        {menteeGoals.map((goal) => (
                          <span key={goal} className="tag">
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                    {otherGoals.length > 0 && (
                      <div className="match-block secondary">
                        <strong>Other goals</strong>
                        <div className="tag-row">
                          {otherGoals.map((goal) => (
                            <span key={goal} className="tag muted">
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    <span className="mentor-tip">
                      Reach out from the chat once both of you are verified.
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default LearningGoals;