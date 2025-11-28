import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Shield } from "lucide-react";

const RegisterCourseModal = ({
  mentor,
  isOpen,
  onConfirm,
  onClose,
  status = "idle",
  message = "",
  coinCost = 100,
}) => {
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <AnimatePresence>
      {isOpen && mentor && (
        <motion.div
          className="fixed inset-0 z-[1300] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white shadow-xl border border-white/10 overflow-hidden"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          >
            <div className="px-6 py-6 space-y-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-200/80">
                  Confirm Mentorship
                </p>
                <h2 className="text-2xl font-semibold mt-1">
                  Join {mentor.firstName}'s course?
                </h2>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
                    {mentor.profilePicture ? (
                      <img
                        src={mentor.profilePicture}
                        alt={mentor.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shield className="w-6 h-6 text-indigo-200" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {mentor.firstName} {mentor.lastName}
                    </p>
                    <p className="text-sm text-indigo-200">
                      {mentor.skills?.slice(0, 3).join(", ") || "Multi-skilled mentor"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-100">Course investment</span>
                  <span className="font-semibold text-amber-300">
                    ⭐ {coinCost} coins
                  </span>
                </div>
                <p className="text-sm text-indigo-200">
                  After 10 lectures you’ll earn your {coinCost} coins back + milestone
                  rewards. Ready to swap skills?
                </p>
              </div>

              {isError && (
                <div className="rounded-xl bg-rose-500/20 border border-rose-500/40 px-3 py-2 text-sm text-rose-100">
                  {message || "We couldn’t complete the registration. Try again."}
                </div>
              )}

              {isSuccess ? (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl px-4 py-4 flex items-center gap-3 text-emerald-100"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-300 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">You’re in! 🌟</p>
                    <p className="text-sm">
                      Head over to My Courses to track your progress and join live classes.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 font-semibold transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    Not now
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Confirm & Deduct Coins"
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegisterCourseModal;






