// frontend/src/components/MyCourses.jsx

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "./SubPages.css";

const MyCourses = () => {
  const { user, updateUser, fetchCurrentUser } = useUser();
  const navigate = useNavigate();
  const [newCourse, setNewCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchCurrentUser();
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !user) return <p className="page-container">Loading...</p>;

  const token = localStorage.getItem("token");

  const myAddedCourses = user.courses || [];
  const mentorships = user.mentorships || [];
  const taughtCourses = mentorships.filter(
    (m) =>
      m.mentorId === user._id ||
      m.mentorName === `${user.firstName} ${user.lastName}`
  );
  const learningCourses = mentorships.filter(
    (m) => m.mentorId !== user._id
  );

  /* ----------------------- Add Course ----------------------- */
  const addCourse = async () => {
    if (!newCourse.trim()) return;

    const updated = [...myAddedCourses, newCourse.trim()];

    try {
      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courses: updated }),
      });

      const data = await res.json();

      if (res.ok) {
        updateUser(data.user);
        await fetchCurrentUser();
        setNewCourse("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ----------------------- Delete Course ----------------------- */
  const deleteCourse = async (course) => {
    const updated = myAddedCourses.filter((c) => c !== course);

    try {
      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courses: updated }),
      });

      const data = await res.json();
      if (res.ok) {
        updateUser(data.user);
        await fetchCurrentUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ----------------------- Feedback ----------------------- */
  const giveFeedback = async (mentorId, rating, courseTitle) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mentorId, rating, courseTitle }),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedbackMsg(`You rated ${rating} stars ⭐`);
        await fetchCurrentUser();

        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        setFeedbackMsg(data.message);
      }
    } catch (err) {
      console.error(err);
      setFeedbackMsg("Error submitting feedback");
    }
  };

  /* ----------------------- Chat ----------------------- */
  const handleChat = (mentorId) => {
    navigate("/chat", { state: { peerId: mentorId } });
  };

  return (
    <div className="page-container">
      <Link to="/student-dashboard" className="back-btn">
        ⬅ Back to Dashboard
      </Link>

      <h1>My Courses</h1>

      {feedbackMsg && (
        <div className="page-alert page-alert-success">
          {feedbackMsg}
        </div>
      )}

      {/* -------------------------- Learning Section -------------------------- */}
      <h2>Courses you're learning</h2>

      {learningCourses.length === 0 ? (
        <p>No active mentorships — try Find Mentor to register for a course.</p>
      ) : (
        <ul className="course-list">
          {learningCourses.map((m, i) => {
            const completed = m.status === "completed";

            return (
              <li key={i} className="course-item">
                <div className="course-main">
                  <span className="course-title">{m.courseTitle}</span>
                  <span
                    className={`status-chip ${
                      completed ? "completed" : "registered"
                    }`}
                  >
                    {completed ? "Completed" : "In Progress"}
                  </span>
                </div>

                <p className="course-mentor">Mentor: {m.mentorName}</p>

                <div className="course-actions">
                  <span className="role-badge student-role">Student • You</span>

                  {!completed && (
                    <button
                      className="ghost-btn"
                      onClick={() => handleChat(m.mentorId)}
                    >
                      Chat with Mentor
                    </button>
                  )}

                  {/* ---- Feedback stars ---- */}
                  {completed && (
                    <div className="feedback-container">
                      <p>Your Rating:</p>

                      {[1, 2, 3, 4, 5].map((num) => (
                        <span
                          key={num}
                          className={
                            m.rating >= num
                              ? "star star-filled"
                              : "star star-empty"
                          }
                          onClick={() =>
                            giveFeedback(m.mentorId, num, m.courseTitle)
                          }
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* -------------------------- Teaching Section -------------------------- */}
      <h2>Courses you teach</h2>

      {taughtCourses.length === 0 ? (
        <p>You are not mentoring any courses right now.</p>
      ) : (
        <ul className="course-list">
          {taughtCourses.map((m, i) => (
            <li key={i} className="course-item">
              <div className="course-main">
                <span className="course-title">{m.courseTitle}</span>
                <span
                  className={`status-chip ${
                    m.status === "completed" ? "completed" : "registered"
                  }`}
                >
                  {m.status === "completed" ? "Completed" : "In Progress"}
                </span>
              </div>

              <p className="course-mentor">
                Student Progress: {m.completedLectures}/{m.totalLectures}
              </p>

              {m.rating && (
                <p className="course-mentor">
                  Student Rating: {"⭐".repeat(m.rating)}
                </p>
              )}

              <div className="course-actions">
                <span className="role-badge mentor-role">Mentor • You</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* -------------------------- Added Courses -------------------------- */}
      <h2>Courses you added</h2>

      {myAddedCourses.length === 0 ? (
        <p>No courses added yet.</p>
      ) : (
        <ul className="skills-list">
          {myAddedCourses.map((course, i) => (
            <li key={i}>
              {course}
              <button
                className="delete-btn"
                onClick={() => deleteCourse(course)}
              >
                ✖
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="add-skill">
        <input
          type="text"
          placeholder="Enter a new course"
          value={newCourse}
          onChange={(e) => setNewCourse(e.target.value)}
        />
        <button onClick={addCourse}>Add Course</button>
      </div>
    </div>
  );
};

export default MyCourses;
