import React from "react";
import "./InfoPages.css";

const About = () => {
  return (
    <div className="info-page">
      <div className="info-container">
        <h1>💫 About Skill Swap</h1>
        <p className="subtitle">
          We believe learning is most powerful when shared. Skill Swap turns that belief into action.
        </p>

        <div className="about-section">
          <p>
            Skill Swap is a peer-learning platform where students and professionals connect to
            exchange knowledge. Instead of just consuming content, you interact, mentor,
            and grow with real people.
          </p>
          <p>
            Our mission is to create a world where education is collaborative, inclusive,
            and accessible to everyone — powered by community and curiosity.
          </p>
          <p>
            Whether you want to learn new technologies or teach others what you already know,
            Skill Swap makes it easy and rewarding with its coin-based mentorship system.
          </p>
        </div>

        <div className="about-credits">
          <h3>Made with 💜 by Nethrasri Konduru</h3>
          <p>Bridging knowledge, mentorship, and AI to make learning joyful.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
