import React from "react";
import { useNavigate } from "react-router-dom";
import "./InfoPages.css";

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>💡 How Skill Swap Works</h1>
        <p className="subtitle">
          A simple, coin-based learning system that rewards curiosity and sharing knowledge.
        </p>

        <div className="info-steps">

          <div className="step-card">
            <h2>1️⃣ Start with 100 Coins</h2>
            <p>
              Every new learner begins their Skill Swap journey with <strong>100 coins</strong>.  
              These coins are your learning currency — you’ll use them to register for courses with mentors.
            </p>
          </div>

          <div className="step-card">
            <h2>2️⃣ Complete Your Profile for Verification ✅</h2>
            <p>
              Fill out <strong>every single detail</strong> in your profile — your name, skills,
              what you want to learn, and what you can teach.  
              Once verified, your profile becomes visible to mentors and learners.
            </p>
          </div>

          <div className="step-card">
            <h2>3️⃣ Get Personalized Recommendations 🎯</h2>
            <p>
              Based on your learning interests and skill tree, Skill Swap recommends mentors
              who can teach you exactly what you want to learn.  
              You can explore their profiles, see their ratings, and choose the one that fits you best.
            </p>
          </div>

          <div className="step-card">
            <h2>4️⃣ Register for a Course 💬</h2>
            <p>
              Once you find the right mentor, click on <strong>“Register Course”</strong>.
              Your 100 coins will temporarily be deducted as a security hold.  
              You’ll then gain access to the <strong>course classroom page</strong> — where
              live sessions happen (like Google Meet).
            </p>
          </div>

          <div className="step-card">
            <h2>5️⃣ Attend 10 Lectures 🎥</h2>
            <p>
              Each course contains <strong>10 default lectures</strong>.  
              For every lecture you complete, you earn back <strong>10 coins</strong>.  
              By the end of the course, you recover your full 100 coins — plus experience and skills!
            </p>
          </div>

          <div className="step-card">
            <h2>6️⃣ Course Completion 🎉</h2>
            <p>
              After all 10 lectures are completed, the course is marked as <strong>“Completed”</strong>.
              It will automatically move to your “Completed Courses” list on the Dashboard.  
              You can then choose to <strong>teach others</strong> and become a verified mentor yourself!
            </p>
          </div>

        </div>

        <button className="back-btn" onClick={() => navigate("/student-dashboard")}>
          ⬅ Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default HowItWorks;
