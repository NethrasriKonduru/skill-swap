import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import Signup from "./components/signup";
import Login from "./components/login";
import Profile from "./components/profile";
import StudentDashboard from "./components/StudentDashboard";
import MySkills from "./components/MySkills";
import LearningGoals from "./components/LearningGoals";
import MyCourses from "./components/MyCourses";
import Chat from "./components/Chat";
import FindMentor from "./components/FindMentor";

import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import About from "./components/About";

// 💡 Import the global user context
import { UserProvider } from "./context/UserContext";

const AppContent = () => {
  const location = useLocation();

  // Pages where footer should be hidden
  const hideFooterPaths = [
    "/profile",
    "/student-dashboard",
    "/signup",
    "/login",
    "/my-skills",
    "/learning-goals",
    "/my-courses",
    "/find-mentor",
    "/chat",
  ];

  return (
    <>
      <Navbar />

      <Routes>
        {/* 🏠 Home */}
        <Route path="/" element={<Hero />} />

        {/* 🔐 Auth */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* 👤 User */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/my-skills" element={<MySkills />} />
        <Route path="/learning-goals" element={<LearningGoals />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/find-mentor" element={<FindMentor />} />
        <Route path="/chat" element={<Chat />} />

        {/* 🌐 Informational Pages */}
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
      </Routes>

      {/* Hide footer on certain routes */}
      {!hideFooterPaths.includes(location.pathname) && <Footer />}
    </>
  );
};

const App = () => (
  <Router>
    <UserProvider>
      <AppContent />
    </UserProvider>
  </Router>
);

export default App;
