import { useState } from "react";
import { Button } from "@/components/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import signupVector from "@/assets/signup-vector.jpg";
import "./signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send POST request to backend
      const response = await axios.post("http://localhost:5000/api/auth/signup", formData);
      console.log(response.data.message); // User created successfully
      navigate("/profile"); // Redirect to profile page
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Signup failed");
    }
  };

  const handleGoogleSignup = () => {
    console.log("Google signup");
    navigate("/profile");
  };

  const handleLinkedInSignup = () => {
    console.log("LinkedIn signup");
    navigate("/profile");
  };

  return (
    <div className="signup-container">
      <div className="signup-image-section">
        <img
          src={signupVector}
          alt="Students learning together"
          className="signup-vector-image"
        />
      </div>

      <div className="signup-form-section">
        <div className="signup-form-wrapper">
          <div className="signup-header">
            <h1 className="signup-title">Join Skill Swap</h1>
            <p className="signup-subtitle">
              Start your learning journey with 100 free points
            </p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="signup-name-grid">
              <div className="signup-field">
                <label htmlFor="firstName" className="signup-label">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  className="signup-input"
                />
              </div>
              <div className="signup-field">
                <label htmlFor="lastName" className="signup-label">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  className="signup-input"
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="email" className="signup-label">Email</label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="signup-input"
              />
            </div>

            <div className="signup-field">
              <label htmlFor="password" className="signup-label">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="signup-input"
              />
            </div>

            <Button type="submit" className="signup-submit-btn" size="lg">
              Sign Up
            </Button>
          </form>

          <div className="signup-divider">
            <div className="signup-divider-line">
              <span className="signup-divider-border" />
            </div>
            <div className="signup-divider-text">
              <span className="signup-divider-text-content">
                Or continue with
              </span>
            </div>
          </div>

          <div className="signup-oauth-buttons">
            <Button
              type="button"
              variant="outline"
              className="signup-oauth-btn"
              onClick={handleGoogleSignup}
            >
              {/* Google SVG */}
              Sign up with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="signup-oauth-btn"
              onClick={handleLinkedInSignup}
            >
              {/* LinkedIn SVG */}
              Sign up with LinkedIn
            </Button>
          </div>

          <p className="signup-signin-link">
            Already have an account?{" "}
            <a href="/signin" className="signup-signin-link-text">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
