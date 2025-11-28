import React from "react";
import "./InfoPages.css";

const Features = () => {
  const features = [
    {
      title: "🔍 Smart Matching",
      text: "AI-driven mentor suggestions based on your skills, goals, and learning interests.",
    },
    {
      title: "💬 Real-time Chat",
      text: "Communicate instantly with mentors and fellow learners with built-in chat support.",
    },
    {
      title: "🎓 Course Tracking",
      text: "Track every lecture, earn coins, and visualize your progress beautifully.",
    },
    {
      title: "💎 Reward System",
      text: "Earn coins for every milestone — spend them to unlock new mentorships.",
    },
    {
      title: "🌐 Verified Mentors",
      text: "Learn from trusted professionals who have verified expertise.",
    },
    {
      title: "🚀 Gamified Learning",
      text: "Badges, coins, and progress animations to keep you motivated throughout your journey.",
    },
  ];

  return (
    <div className="info-page">
      <div className="info-container">
        <h1>🚀 Skill Swap Features</h1>
        <p className="subtitle">
          Everything you need to make learning interactive, rewarding, and fun!
        </p>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
