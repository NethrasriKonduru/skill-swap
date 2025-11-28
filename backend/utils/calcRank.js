// backend/utils/calcRank.js

/**
 * NEW RANKING FORMULA — EXACTLY AS NETHRA REQUESTED ❤️
 *
 * Priority:
 * 1) Skill match count (50%)
 * 2) Subtopic depth (30%)
 * 3) Rating (20%)
 *
 * Output:
 * - rank (1–5 stars)
 * - score (0–1 normalized)
 * - breakdown of all components
 */

export function calcRank(mentor = {}, opts = {}) {
  const {
    currentUserGoals = [], // student's goals
    maxSubtopicsForFullScore = 10 // deeper topics get higher score
  } = opts;

  /* ---------------- NORMALIZATION HELPERS ---------------- */
  const normalize = (v) =>
    Array.isArray(v)
      ? v.map((x) => String(x).toLowerCase().trim()).filter(Boolean)
      : [];

  const goals = normalize(currentUserGoals);
  const mentorSkills = normalize(mentor.skills);
  const subtopics = Array.isArray(mentor.subtopics) ? mentor.subtopics : [];

  /* ---------------- 1) SKILL MATCH (0–1) — highest weight ---------------- */
  const matched = mentorSkills.filter((s) => goals.includes(s)).length;

  const skillMatch =
    goals.length > 0 ? matched / goals.length : mentorSkills.length > 0 ? 0.5 : 0;

  /* ---------------- 2) SUBTOPIC DEPTH (0–1) ---------------- */
  let totalDepth = 0;
  let count = 0;

  for (const st of subtopics) {
    const topicCount = Array.isArray(st.topics) ? st.topics.length : 0;
    if (topicCount > 0) {
      totalDepth += Math.min(1, topicCount / maxSubtopicsForFullScore);
      count++;
    }
  }

  const subtopicDepth = count > 0 ? totalDepth / count : 0;

  /* ---------------- 3) RATING NORMALIZED (0–1) ---------------- */
  const rating = Number(mentor.rating || 3);
  const ratingNorm = Math.min(1, Math.max(0, (rating - 1) / 4));

  /* ---------------- FINAL SCORE (0–1) ----------------
   *
   * Final weights as you requested:
   *  Skill Match     → 50%
   *  Subtopic Depth  → 30%
   *  Rating          → 20%
   */

  const score =
    skillMatch * 0.5 +
    subtopicDepth * 0.3 +
    ratingNorm * 0.2;

  const normalizedScore = Math.min(1, Math.max(0, score));

  /* ---------------- MAP TO STAR RANK 1–5 ---------------- */
  const rawRank = 1 + normalizedScore * 4;
  const rank = Math.max(1, Math.min(5, Math.round(rawRank)));

  return {
    rank,
    score: Number(normalizedScore.toFixed(4)),
    components: {
      skillMatch: Number(skillMatch.toFixed(3)),
      subtopicDepth: Number(subtopicDepth.toFixed(3)),
      ratingNorm: Number(ratingNorm.toFixed(3)),
    },
  };
}

export default calcRank;
