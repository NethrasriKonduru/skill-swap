import React from "react";
import { motion } from "framer-motion";
import {
  PlayCircle,
  Video,
  MessageCircle,
  Trophy,
} from "lucide-react";

const CourseProgress = ({
  mentorship,
  onJoinClass,
  onMarkLecture,
  onOpenChat,
}) => {
  if (!mentorship) return null;

  const {
    mentorName,
    completedLectures = 0,
    totalLectures = 10,
    status = "active",
  } = mentorship;

  const progress =
    totalLectures > 0
      ? Math.min(100, Math.round((completedLectures / totalLectures) * 100))
      : 0;

  const lecturesRemaining = Math.max(totalLectures - completedLectures, 0);
  const isCompleted = status === "completed" || progress >= 100;

  return (
    <motion.div
      whileHover={{ translateY: -6 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-sky-500/20 pointer-events-none" />
      <div className="relative flex flex-col gap-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-200/80">
              Mentorship Journey
            </p>
            <h3 className="text-xl font-semibold">{mentorName || "Your Mentor"}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
            <Trophy className="w-4 h-4" />
            {progress}% complete
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-100">
            <span>
              Completed {completedLectures}/{totalLectures} lectures
            </span>
            <span>
              {lecturesRemaining > 0
                ? `${lecturesRemaining} to go`
                : "Course finished"}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/15 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isCompleted
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onJoinClass?.(mentorship)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-500/80 hover:bg-indigo-500 px-4 py-3 text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/25"
          >
            <Video className="w-4 h-4" />
            Join Live Class
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpenChat?.(mentorship)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-3 text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat Mentor
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onMarkLecture?.(mentorship)}
            disabled={isCompleted}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
              isCompleted
                ? "bg-emerald-500/20 text-emerald-200 cursor-not-allowed"
                : "bg-emerald-500/80 hover:bg-emerald-500 shadow-lg shadow-emerald-500/25"
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            {isCompleted ? "All Lectures Done" : "Mark Lecture Done (+10⭐)"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseProgress;






