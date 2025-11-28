import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import CourseProgress from "./CourseProgress";
import MentorChat from "./MentorChat";
import "./Dashboard.css";

const StudentDashboard = () => {
  const { user, loading, fetchCurrentUser, logout, updateUser } = useUser();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState("");
  const [activeMentorChat, setActiveMentorChat] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const mentorships = useMemo(
    () => (Array.isArray(user?.mentorships) ? user.mentorships : []),
    [user?.mentorships]
  );

  const ongoingMentorships = mentorships.filter(
    (mentorship) => mentorship.status !== "completed"
  );
  const featuredMentorships = ongoingMentorships.slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleOpenChat = (mentorship) => {
    const mentor = {
      _id: mentorship.mentorId,
      firstName: mentorship.mentorName?.split(" ")[0] || "Mentor",
      lastName: mentorship.mentorName?.split(" ").slice(1).join(" ") || "",
      profilePicture: mentorship.mentorAvatar || "",
      skills: mentorship.skills || [],
      verified: true,
    };
    setActiveMentorChat(mentor);
  };

  const markLectureProgress = async (mentorship) => {
    if (!mentorship) return;
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/course-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mentorId: mentorship.mentorId, lectures: 1 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to update progress.");

      updateUser(data.user);
      setStatusMessage(
        data.completed
          ? "🎉 Course Completed! You earned 100 coins back!"
          : "Great! Lecture logged and +10 coins added."
      );
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading)
    return (
      <div className="loader">
        Loading your dashboard...
      </div>
    );

  if (!user)
    return (
      <div className="loader">
        Please log in to view your dashboard.
      </div>
    );

  return (
    <div className="dashboard-page">
      {/* ===== Header Section ===== */}
      <header className="dashboard-header">
        <div className="welcome-box">
          <h1>Hey {user.firstName}! 👋</h1>
          <p>Keep learning, keep teaching, and keep earning coins!</p>
        </div>

        <div className="coin-box">
          <h3>⭐ {user.points || 0}</h3>
          <p>Coin Balance</p>
        </div>
      </header>

      {/* ===== Status Message ===== */}
      {statusMessage && <div className="status-banner">{statusMessage}</div>}

      {/* ===== Dashboard Cards ===== */}
      <section className="card-grid">
        <div className="action-card" onClick={() => navigate("/my-skills")}>
          <h2>Sharpen your skills</h2>
          <p>Update your skill tree and show what you can teach.</p>
        </div>

        <div className="action-card" onClick={() => navigate("/learning-goals")}>
          <h2>Set learning quests</h2>
          <p>Add new goals and get matched with expert mentors.</p>
        </div>

        <div className="action-card" onClick={() => navigate("/find-mentor")}>
          <h2>Mentor marketplace</h2>
          <p>Browse verified mentors and spend coins wisely.</p>
        </div>

        <div className="action-card" onClick={() => navigate("/my-courses")}>
          <h2>Course lounge</h2>
          <p>Track progress, join live sessions, and celebrate wins.</p>
        </div>
      </section>

      {/* ===== Active Mentorships ===== */}
      {featuredMentorships.length > 0 && (
        <section className="mentorship-section">
          <h2>Your Active Mentorships</h2>
          <div className="mentorship-grid">
            {featuredMentorships.map((mentorship) => (
              <CourseProgress
                key={mentorship.mentorId}
                mentorship={mentorship}
                onJoinClass={() => navigate(`/live-class/${mentorship.mentorId}`)}
                onMarkLecture={() => markLectureProgress(mentorship)}
                onOpenChat={() => handleOpenChat(mentorship)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ===== Footer Bar ===== */}
      <div className="bottom-bar">
        <p>
          {ongoingMentorships.length > 0
            ? `You have ${ongoingMentorships.length} active mentorship${
                ongoingMentorships.length > 1 ? "s" : ""
              }. Keep going strong!`
            : "Ready for a new adventure? Find a mentor to kickstart your next skill."}
        </p>
        <div className="bottom-actions">
          <button className="chat-btn" onClick={() => navigate("/chat")}>
            💬 Open Chat
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Log Out
          </button>
        </div>
      </div>

      <MentorChat
        mentor={activeMentorChat}
        onClose={() => setActiveMentorChat(null)}
        onRequestRegister={() => navigate("/find-mentor")}
      />
    </div>
  );
};

export default StudentDashboard;
