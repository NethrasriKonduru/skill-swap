// backend/models/User.js
import mongoose from "mongoose";

const subtopicSchema = new mongoose.Schema({
  skill: { type: String, default: "" },
  topics: { type: [String], default: [] },
});

const mentorshipSchema = new mongoose.Schema({
  mentorId: String,
  mentorName: String,
  courseTitle: String,
  status: { type: String, default: "active" },
  completedLectures: { type: Number, default: 0 },
  totalLectures: { type: Number, default: 10 },
  lastUpdated: { type: Date, default: Date.now },
});

const courseHistorySchema = new mongoose.Schema({
  title: String,
  mentorName: String,
  completedAt: Date,
  coinsEarned: Number,
});

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    profilePicture: String,
    dob: String,
    gender: String,
    bio: String,
    verified: { type: Boolean, default: false },
    verificationBadge: { type: String, default: null },
    profileCompletion: { type: Number, default: 0 },
    points: { type: Number, default: 100 },
    skills: { type: [String], default: [] },
    learningGoals: { type: [String], default: [] },
    courses: { type: [String], default: [] },
    completedCourses: { type: [String], default: [] },
    mentorships: { type: [mentorshipSchema], default: [] },
    courseHistory: { type: [courseHistorySchema], default: [] },
    subtopics: { type: [subtopicSchema], default: [] },
    rating: { type: Number, default: 5 },
    rank: { type: Number, default: 3 }, // 1..5
    maxMentees: { type: Number, default: 5 },
    activeMentees: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
