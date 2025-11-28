import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, CalendarDays, Coins } from "lucide-react";

const CompletedCourses = ({ courses = [] }) => {
  const normalized = courses
    .map((course) => {
      if (typeof course === "string") {
        return {
          title: course,
          mentorName: "Mentor",
          completedAt: null,
          coinsEarned: 100,
        };
      }
      return {
        title: course.title || "Course",
        mentorName: course.mentorName || "Mentor",
        completedAt: course.completedAt ? new Date(course.completedAt) : null,
        coinsEarned: course.coinsEarned ?? 100,
      };
    })
    .reverse();

  if (!normalized.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center text-indigo-100">
        No completed courses yet — finish a mentorship to celebrate a win! 🎉
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {normalized.map((course, index) => (
          <motion.div
            key={`${course.title}-${index}`}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-green-500/5 to-sky-500/10 px-5 py-5 text-white shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-emerald-200">
                  <Trophy className="w-4 h-4" />
                  Course Completed
                </div>
                <h4 className="text-lg font-semibold">{course.title}</h4>
                <p className="text-sm text-emerald-100/80">
                  Mentor: {course.mentorName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-sm text-emerald-100">
                <span className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-300" />
                  +{course.coinsEarned} coins
                </span>
                {course.completedAt && (
                  <span className="flex items-center gap-1 text-xs">
                    <CalendarDays className="w-4 h-4" />
                    {course.completedAt.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CompletedCourses;






