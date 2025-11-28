// frontend/src/components/MySkills.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import "./MySkills.css";

const MySkills = () => {
  const { user, updateUser, fetchCurrentUser } = useUser();

  const [skills, setSkills] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      setSkills(user.skills || []);
      setSubtopics(user.subtopics || []);
    }
  }, [user]);

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    if (!skills.includes(s)) setSkills([...skills, s]);
    setNewSkill("");
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
    setSubtopics(subtopics.filter((st) => st.skill !== skill));
    if (selectedSkill === skill) setSelectedSkill("");
  };

  const addSubtopic = () => {
    if (!selectedSkill || !newTopic.trim()) return;

    const topic = newTopic.trim();
    const updated = [...subtopics];

    const entry = updated.find((e) => e.skill === selectedSkill);
    if (entry) {
      if (!entry.topics.includes(topic)) entry.topics.push(topic);
    } else {
      updated.push({ skill: selectedSkill, topics: [topic] });
    }

    setSubtopics(updated);
    setNewTopic("");
  };

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills, subtopics }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      updateUser(data.user);
      fetchCurrentUser();
      setMessage("Saved successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("Save failed.");
    }
  };

  return (
    <div className="myskills-container">

      <h1 className="page-title">🧠 My Skills & Subtopics</h1>
      <p className="page-desc">Add skills and subtopics — mentors with deeper subtopic coverage get higher rank.</p>

      {/* CARD 1 */}
      <div className="card">
        <h2 className="card-title">Your Skills</h2>

        <div className="input-row">
          <input
            type="text"
            placeholder="Enter a new skill (e.g. Python)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <button className="btn-purple" onClick={addSkill}>Add</button>
        </div>

        <div className="skill-tags">
          {skills.map((skill) => (
            <span
              key={skill}
              className={`skill-pill ${selectedSkill === skill ? "active" : ""}`}
              onClick={() => setSelectedSkill(skill)}
            >
              {skill}
              <button
                className="pill-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSkill(skill);
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* CARD 2 */}
      {selectedSkill && (
        <div className="card">
          <h2 className="card-title">Add Subtopics for {selectedSkill}</h2>

          <div className="input-row">
            <input
              type="text"
              placeholder="Enter subtopic (e.g. Flask)"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
            />
            <button className="btn-purple" onClick={addSubtopic}>Add Subtopic</button>
          </div>

          <div className="subtopic-tags">
            {(subtopics.find((s) => s.skill === selectedSkill)?.topics || []).map((t, i) => (
              <span key={i} className="subtopic-pill">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* CARD 3 */}
      {subtopics.length > 0 && (
        <div className="card">
          <h2 className="card-title">📄 Subtopic Summary</h2>

          {subtopics.map((s, i) => (
            <div key={i} className="summary-box">
              <h3>{s.skill}</h3>
              <p>Coverage: {Math.round((s.topics.length / 4) * 100)}%</p>
              <div className="subtopic-tags">
                {s.topics.map((t, idx) => (
                  <span key={idx} className="subtopic-pill">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="save-btn" onClick={saveProfile}>Save Profile</button>
      {message && <p className="save-msg">{message}</p>}
    </div>
  );
};

export default MySkills;
