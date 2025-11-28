import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import { useUser } from "../context/UserContext"; 
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* 🟣 Logo Section */}
        <div className="navbar-left" onClick={() => navigate("/")}>
          <Coins className="navbar-logo-icon" />
          <span className="navbar-logo-text">Skill Swap</span>
        </div>

        {/* 🧭 Navigation Links */}
        <nav className="navbar-links">
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/features">Features</Link>
          <Link to="/about">About</Link>
        </nav>

        {/* 🧍 Right Side Controls */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              {/* ⭐ Live Points */}
              <div className="user-points">⭐ {user?.points || 100} points</div>

              {/* 🔍 Find Mentor Button */}
              <button
                className="find-mentor-btn"
                onClick={() => navigate("/find-mentor")}
              >
                Find Mentor
              </button>

              {/* 🧑 Profile Picture (Dashboard shortcut) */}
              <div
                className="profile-pic"
                onClick={() => navigate("/student-dashboard")}
                title="Go to Dashboard"
              >
                <img
                  src={
                    user?.profilePicture ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt="Profile"
                />
              </div>

              {/* 👤 Profile Button */}
              <button
                className="profile-btn"
                onClick={() => navigate("/profile")}
              >
                Profile
              </button>
            </>
          ) : (
            <>
              {/* 🔑 Auth Buttons */}
              <button
                className="sign-in-btn"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
              <button
                className="get-started-btn"
                onClick={() => navigate("/signup")}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
