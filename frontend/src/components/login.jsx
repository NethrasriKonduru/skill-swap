import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import loginImage from "../assets/signup-vector.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",   // ⭐ REQUIRED
      });

      // Backend unreachable
      if (!res.ok) {
        let msg = "Login failed";
        try {
          const errData = await res.json();
          msg = errData.message || msg;
        } catch {
          msg = "Cannot reach server. Check backend/CORS.";
        }
        throw new Error(msg);
      }

      const data = await res.json();

      // ⭐ Save token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/student-dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Illustration */}
      <div className="auth-left">
        <img src={loginImage} alt="Login Illustration" />
      </div>

      {/* Login Form */}
      <div className="auth-right">
        <h1>Welcome Back</h1>
        <p>Sign in to continue your learning journey</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <div className="divider">OR CONTINUE WITH</div>

        <button className="social-login google">Sign in with Google</button>
        <button className="social-login linkedin">Sign in with LinkedIn</button>
      </div>
    </div>
  );
};

export default Login;
