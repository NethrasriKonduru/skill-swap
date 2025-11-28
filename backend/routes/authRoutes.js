// backend/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import dotenv from "dotenv";
import calcRank from "../utils/calcRank.js";

dotenv.config();
const router = express.Router();

/* -------------------- Helpers -------------------- */

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v || "").trim()).filter(Boolean);
  if (typeof value === "string" && value.trim().length > 0) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const sanitizeUser = (u) => {
  if (!u) return null;
  const obj = u.toObject ? u.toObject({ versionKey: false }) : { ...u };
  delete obj.password;
  return obj;
};

/* -------------------- AUTH -------------------- */

// signup
router.post("/signup", async (req, res) => {
  try {
    const { firstName = "", lastName = "", email = "", password = "" } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      skills: [],
      subtopics: [],
      courses: [],
      learningGoals: [],
      mentorships: [],
      completedCourses: [],
      courseHistory: [],
      points: 100,
      rank: 3,
      rating: 5,
      activeMentees: 0,
      maxMentees: 5,
      profileCompletion: 0,
      verified: false,
      verificationBadge: null,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.status(201).json({ message: "Signup success", token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// get current user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- PROFILE UPDATE -------------------- */

router.patch("/update", verifyToken, async (req, res) => {
  try {
    const updates = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Basic scalar fields
    if (updates.firstName !== undefined) user.firstName = String(updates.firstName || "").trim();
    if (updates.lastName !== undefined) user.lastName = String(updates.lastName || "").trim();
    if (updates.dob !== undefined) user.dob = updates.dob;
    if (updates.gender !== undefined) user.gender = updates.gender;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.profilePicture !== undefined && updates.profilePicture !== "") user.profilePicture = updates.profilePicture;

    // Lists
    if (updates.skills !== undefined) user.skills = normalizeList(updates.skills);
    if (updates.learningGoals !== undefined) user.learningGoals = normalizeList(updates.learningGoals);
    if (updates.courses !== undefined) user.courses = normalizeList(updates.courses);

    // Subtopics (array of { skill, topics })
    if (updates.subtopics !== undefined && Array.isArray(updates.subtopics)) {
      user.subtopics = updates.subtopics.map((s) => ({
        skill: String(s.skill || "").trim(),
        topics: Array.isArray(s.topics) ? s.topics.map((t) => String(t || "").trim()).filter(Boolean) : [],
      }));
    }

    // recalc profile completion & verification badge
    const checks = [
      Boolean(user.firstName),
      Boolean(user.lastName),
      Boolean(user.email),
      Boolean(user.dob),
      Boolean(user.gender),
      Boolean(user.profilePicture),
      (Array.isArray(user.skills) && user.skills.length > 0),
      (Array.isArray(user.learningGoals) && user.learningGoals.length > 0),
    ];
    const filled = checks.filter(Boolean).length;
    const completion = Math.round((filled / checks.length) * 100);
    user.profileCompletion = completion;

    user.verified = completion >= 80 && Array.isArray(user.skills) && user.skills.length > 0 && Array.isArray(user.learningGoals) && user.learningGoals.length > 0;
    // set badge
    user.verificationBadge = null;
    if (user.verified) {
      if (completion === 100) user.verificationBadge = "Platinum Mentor";
      else if (completion >= 90) user.verificationBadge = "Gold Mentor";
      else user.verificationBadge = "Verified Explorer";
    }

    await user.save();
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: err.message || "Failed to update profile" });
  }
});

/* -------------------- POINTS / REGISTER -------------------- */

// register course (student registers with mentor & courseTitle)
router.post("/register-course", verifyToken, async (req, res) => {
  try {
    const { mentorId, courseTitle, coinCost = 50, totalLectures = 10 } = req.body;
    if (!mentorId || !courseTitle) return res.status(400).json({ message: "mentorId and courseTitle are required" });

    const [student, mentor] = await Promise.all([User.findById(req.user.id), User.findById(mentorId)]);
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });

    if ((student.points || 0) < coinCost) return res.status(400).json({ message: "Not enough coins to register" });
    if ((mentor.activeMentees || 0) >= (mentor.maxMentees || 5)) return res.status(400).json({ message: "Mentor slots full" });

    // Deduct and transfer coins
    student.points = (student.points || 0) - coinCost;
    mentor.points = (mentor.points || 0) + Math.round(coinCost * 0.5);
    mentor.activeMentees = (mentor.activeMentees || 0) + 1;

    // Add mentorship to student (unique per mentor+courseTitle)
    if (!Array.isArray(student.mentorships)) student.mentorships = [];
    const mentorshipLabel = String(courseTitle).trim();

    const mentorshipRecord = {
      mentorId: mentor._id.toString(),
      mentorName: `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim(),
      courseTitle: mentorshipLabel,
      status: "active",
      completedLectures: 0,
      totalLectures: Number.isFinite(Number(totalLectures)) && totalLectures > 0 ? Number(totalLectures) : 10,
      lastUpdated: new Date(),
      rating: null,
    };

    const existsIdx = student.mentorships.findIndex((m) => m.mentorId === mentor._id.toString() && String(m.courseTitle).toLowerCase() === mentorshipLabel.toLowerCase());
    if (existsIdx === -1) student.mentorships.push(mentorshipRecord);
    else {
      // renew
      student.mentorships[existsIdx].status = "active";
      student.mentorships[existsIdx].lastUpdated = new Date();
    }

    // ensure course listed for student
    student.courses = Array.isArray(student.courses) ? student.courses : [];
    if (!student.courses.includes(mentorshipLabel)) student.courses.push(mentorshipLabel);

    // Save both
    await Promise.all([student.save(), mentor.save()]);
    res.json({ user: sanitizeUser(student), coinsSpent: coinCost });
  } catch (err) {
    console.error("Register course error:", err);
    res.status(500).json({ message: err.message || "Failed to register" });
  }
});

/* -------------------- COURSE PROGRESS -------------------- */

router.post("/course-progress", verifyToken, async (req, res) => {
  try {
    const { mentorId, courseTitle, lectures = 1 } = req.body;
    if (!mentorId && !courseTitle) return res.status(400).json({ message: "mentorId or courseTitle required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.mentorships)) user.mentorships = [];
    const mentorship = user.mentorships.find((m) => {
      const matchByMentor = mentorId && m.mentorId && m.mentorId.toString() === mentorId.toString();
      const matchByCourse = courseTitle && m.courseTitle && String(m.courseTitle).toLowerCase() === String(courseTitle).toLowerCase();
      return matchByMentor || matchByCourse;
    });

    if (!mentorship) return res.status(404).json({ message: "Mentorship not found" });

    const total = mentorship.totalLectures || 10;
    const prevCompleted = mentorship.completedLectures || 0;
    const inc = Math.max(0, Number.isFinite(Number(lectures)) ? Number(lectures) : 1);

    const newCompleted = Math.min(total, prevCompleted + inc);
    const actualIncrement = newCompleted - prevCompleted;
    let coinsEarned = 0;
    let completed = false;

    if (actualIncrement > 0) {
      coinsEarned = actualIncrement * 10;
      user.points = (user.points || 0) + coinsEarned;
      mentorship.completedLectures = newCompleted;
      mentorship.lastUpdated = new Date();

      if (newCompleted >= total) {
        mentorship.status = "completed";
        completed = true;
        // mark completed courses
        user.completedCourses = Array.isArray(user.completedCourses) ? user.completedCourses : [];
        if (!user.completedCourses.includes(mentorship.courseTitle)) user.completedCourses.push(mentorship.courseTitle);

        // auto-add skill & subtopics from mentor if available
        const mentor = await User.findById(mentorship.mentorId);
        if (mentor) {
          const skillName = mentorship.courseTitle.trim();
          user.skills = Array.isArray(user.skills) ? user.skills : [];
          if (!user.skills.includes(skillName)) user.skills.push(skillName);

          if (Array.isArray(mentor.subtopics) && mentor.subtopics.length > 0) {
            const mentorSub = mentor.subtopics.find((s) => (s.skill || "").toLowerCase() === skillName.toLowerCase());
            if (mentorSub) {
              user.subtopics = Array.isArray(user.subtopics) ? user.subtopics : [];
              const existing = user.subtopics.find((s) => (s.skill || "").toLowerCase() === skillName.toLowerCase());
              if (existing) {
                mentorSub.topics.forEach((t) => {
                  if (!existing.topics.includes(t)) existing.topics.push(t);
                });
              } else {
                user.subtopics.push({ skill: skillName, topics: [...(mentorSub.topics || [])] });
              }
            }
          }
        }
      }

      // recalc profile completion simple
      const checks = [
        Boolean(user.firstName),
        Boolean(user.lastName),
        Boolean(user.email),
        Boolean(user.dob),
        Boolean(user.gender),
        Boolean(user.profilePicture),
        Array.isArray(user.skills) && user.skills.length > 0,
        Array.isArray(user.learningGoals) && user.learningGoals.length > 0,
      ];
      user.profileCompletion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
      user.verified = user.profileCompletion >= 80;
      await user.save();
    }

    res.json({
      user: sanitizeUser(user),
      coinsEarned,
      completed,
      completedLectures: mentorship.completedLectures,
      totalLectures: total,
    });
  } catch (err) {
    console.error("Course progress error:", err);
    res.status(500).json({ message: err.message || "Failed to update course progress" });
  }
});

/* -------------------- COMPLETE (force) -------------------- */

router.post("/complete-course", verifyToken, async (req, res) => {
  try {
    const { courseTitle } = req.body;
    if (!courseTitle) return res.status(400).json({ message: "courseTitle required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const mentorship = user.mentorships.find((m) => String(m.courseTitle).toLowerCase() === String(courseTitle).toLowerCase());
    if (!mentorship) return res.status(400).json({ message: "You are not registered for this course" });

    mentorship.completedLectures = mentorship.totalLectures || 10;
    mentorship.status = "completed";
    user.points = (user.points || 0) + 100;

    user.completedCourses = Array.isArray(user.completedCourses) ? user.completedCourses : [];
    if (!user.completedCourses.includes(mentorship.courseTitle)) user.completedCourses.push(mentorship.courseTitle);

    await user.save();
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ message: err.message || "Failed to complete course" });
  }
});

/* -------------------- FEEDBACK -------------------- */
/*
  POST /feedback
  body: { mentorId, courseTitle, rating }  (rating: 1..5)
  - stores rating in student's mentorship record
  - updates mentor's overall rating & recalculates rank
*/
router.post("/feedback", verifyToken, async (req, res) => {
  try {
    const { mentorId, rating, courseTitle } = req.body;
    if (!mentorId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "mentorId and numeric rating (1..5) required" });
    }

    const student = await User.findById(req.user.id);
    const mentor = await User.findById(mentorId);
    if (!student || !mentor) return res.status(404).json({ message: "User not found" });

    // find mentorship record for student
    const mentorship = student.mentorships.find((m) => {
      const byMentor = m.mentorId && m.mentorId.toString() === mentorId.toString();
      const byCourse = courseTitle && m.courseTitle && String(m.courseTitle).toLowerCase() === String(courseTitle).toLowerCase();
      return byMentor && (!courseTitle || byCourse);
    });
    if (!mentorship) return res.status(404).json({ message: "Mentorship not found" });

    // store rating in student's mentorship
    mentorship.rating = rating;
    mentorship.lastUpdated = new Date();

    // update mentor aggregate rating (simple smoothing)
    mentor.rating = Math.max(1, Math.min(5, (mentor.rating || 3) * 0.85 + rating * 0.15));

    // recalc rank using calcRank helper for consistency (we feed current user's goals as empty here)
    try {
      const rankResult = calcRank(mentor, { currentUserGoals: (student.learningGoals || []).map((g) => String(g).toLowerCase()) });
      mentor.rank = rankResult.rank;
    } catch (e) {
      // fallback simple rank
      mentor.rank = Math.round(Math.max(1, Math.min(5, mentor.rating)));
    }

    await Promise.all([student.save(), mentor.save()]);

    res.json({
      message: "Feedback saved",
      mentorship,
      mentor: sanitizeUser(mentor),
    });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ message: err.message || "Failed to save feedback" });
  }
});

/* -------------------- RECOMMENDATIONS (Find Mentor) -------------------- */

/*
  GET /recommendations
  - returns mentors sorted by score; includes mentorMatch, coverage, depth, score
  - requires verifyToken to get current user goals & hide self
*/
router.get("/recommendations", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // load other users (mentors)
    const others = await User.find({ _id: { $ne: req.user.id } }).select(
      "firstName lastName profilePicture skills learningGoals courses points rating verified verificationBadge profileCompletion subtopics rank activeMentees maxMentees mentorships"
    );

    // normalize current user's goals
    const userGoals = (normalizeList(currentUser.learningGoals) || []).map((g) => String(g).toLowerCase());

    const recommendations = others
      .map((candidate) => {
        const candidateSkills = normalizeList(candidate.skills).map((s) => String(s).toLowerCase());
        const mentorMatch = candidateSkills.filter((skill) => userGoals.includes(skill));
        // depth by subtopics matching those skills
        const depthScores = (candidate.subtopics || []).reduce((acc, s) => {
          const skillLower = (s.skill || "").toLowerCase();
          if (mentorMatch.includes(skillLower) || mentorMatch.length === 0) {
            const cov = Math.min(1, (Array.isArray(s.topics) ? s.topics.length : 0) / 8);
            acc.push(cov);
          }
          return acc;
        }, []);
        const avgDepth = depthScores.length ? depthScores.reduce((a, b) => a + b, 0) / depthScores.length : 0.35;

        const mentorCoverage = userGoals.length ? mentorMatch.length / userGoals.length : candidateSkills.length > 0 ? 0.5 : 0;
        const verificationBoost = candidate.verified ? 0.15 : 0;
        const ratingBoost = (candidate.rating || 0) / 50;
        const rankNorm = (candidate.rank || 3) / 5;
        const loadRatio = (candidate.activeMentees || 0) / (candidate.maxMentees || 5);
        const availability = 1 - Math.min(loadRatio, 1);

        // Combine score (weights chosen reasonably)
        const score =
          mentorCoverage * 0.45 + avgDepth * 0.25 + rankNorm * 0.15 + verificationBoost + ratingBoost + availability * 0.05;

        // ensure sanitized user object
        return {
          user: sanitizeUser(candidate),
          mentorMatch: mentorMatch.map((s) => s),
          mentorCoverage: Number(mentorCoverage.toFixed(2)),
          depth: Number(avgDepth.toFixed(2)),
          score: Number(score.toFixed(3)),
        };
      })
      .filter((r) => r.mentorMatch && r.mentorMatch.length > 0) // only show mentors that match at least one goal
      .sort((a, b) => b.score - a.score);

    res.json({
      mentorRecommendations: recommendations.map((r) => ({
        user: r.user,
        mentorMatch: r.mentorMatch,
        score: r.score,
        mentorCoverage: r.mentorCoverage,
        depth: r.depth,
      })),
    });
  } catch (err) {
    console.error("Recommendations error:", err);
    // Return JSON error (no HTML)
    res.status(500).json({ message: err.message || "Failed to fetch recommendations" });
  }
});

/* -------------------- OPTIONAL: find-mentors (search by query) -------------------- */

router.get("/find-mentors", verifyToken, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const filter = q
      ? {
          $or: [
            { firstName: new RegExp(q, "i") },
            { lastName: new RegExp(q, "i") },
            { "skills": { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const candidates = await User.find({ _id: { $ne: req.user.id }, ...filter }).limit(50).select(
      "firstName lastName skills profilePicture rating rank profileCompletion verified verificationBadge subtopics activeMentees maxMentees"
    );

    res.json({ mentors: candidates.map((c) => sanitizeUser(c)) });
  } catch (err) {
    console.error("Find mentors error:", err);
    res.status(500).json({ message: "Failed to search mentors" });
  }
});

export default router;
