import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Timer,
  Users,
  Award,
} from "lucide-react";
import { useUser } from "../context/UserContext";

const LiveClass = () => {
  const { user, updateUser, fetchCurrentUser } = useUser();
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [marking, setMarking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const mentorship = useMemo(() => {
    if (!Array.isArray(user?.mentorships)) return null;
    return (
      user.mentorships.find(
        (m) => m.mentorId === mentorId || m.courseTitle.includes(mentorId || "")
      ) || null
    );
  }, [user?.mentorships, mentorId]);

  const handleMarkLecture = async () => {
    if (!mentorship) return;
    try {
      setMarking(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/course-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentorId: mentorship.mentorId,
          lectures: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to update progress.");
      }

      updateUser(data.user);
      if (data.completed) {
        setStatusMessage("🎉 Course Completed! You earned 100 coins back!");
      } else {
        setStatusMessage("Lecture logged! +10 coins added.");
      }
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setMarking(false);
    }
  };

  const completedLectures = mentorship?.completedLectures || 0;
  const totalLectures = mentorship?.totalLectures || 10;
  const progress =
    totalLectures > 0
      ? Math.min(100, Math.round((completedLectures / totalLectures) * 100))
      : 0;
  const isCompleted = progress >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-indigo-200/80">
              Live Mentor Session
            </p>
            <h1 className="text-3xl font-semibold mt-1">
              {mentorship?.mentorName || "Skill Swap Classroom"}
            </h1>
            <p className="text-indigo-200/70 text-sm mt-2">
              Collaborate in real-time, share screens, and progress through your skill journey.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-100"
          >
            {statusMessage}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <motion.div
            className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-4 shadow-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 aspect-video flex items-center justify-center">
                <span className="text-indigo-200/80 text-sm">Mentor Screen</span>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 aspect-video flex items-center justify-center">
                <span className="text-indigo-200/80 text-sm">You</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-4 bg-white/10 rounded-2xl border border-white/10">
              <button
                onClick={() => setMicOn((prev) => !prev)}
                className={`rounded-full p-3 transition-colors ${
                  micOn ? "bg-white/10 hover:bg-white/20" : "bg-rose-500/20"
                }`}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setCameraOn((prev) => !prev)}
                className={`rounded-full p-3 transition-colors ${
                  cameraOn ? "bg-white/10 hover:bg-white/20" : "bg-rose-500/20"
                }`}
              >
                {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button className="rounded-full p-3 bg-white/10 hover:bg-white/20 transition-colors">
                <MonitorUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(-1)}
                className="rounded-full p-3 bg-rose-500 hover:bg-rose-600 transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <motion.div
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-2">
              <p className="text-sm text-indigo-200 uppercase tracking-widest">
                Progress Tracker
              </p>
              <h2 className="text-xl font-semibold">
                {completedLectures}/{totalLectures} lectures completed
              </h2>
              <div className="flex items-center gap-2 text-sm text-indigo-200">
                <Timer className="w-4 h-4" />
                Consistency builds mastery — keep the streak going!
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-3 w-full rounded-full bg-white/15 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-indigo-200">
                <span>{isCompleted ? "All lectures complete!" : "Next lecture adds +10 ⭐"}</span>
                <span>{progress}%</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-indigo-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Collaborative learning room with mentor & peers.
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Complete all 10 lectures to regain 100 coins and earn badges.
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleMarkLecture}
              disabled={isCompleted || marking}
              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-100 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
              }`}
            >
              {isCompleted
                ? "Course Completed! 🎉"
                : marking
                ? "Logging lecture..."
                : "Mark Lecture as Completed (+10 ⭐)"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiveClass;






