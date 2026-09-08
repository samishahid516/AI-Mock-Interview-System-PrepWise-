/**
 * Deterministic, transcript-driven interview feedback.
 *
 * Replaces the old approach of regex-guessing a score out of the AI's
 * spoken transcript (falling back to Math.random() when nothing matched)
 * with scoring grounded in measurable signals from what the candidate
 * actually said: how much they said, whether it covered the interview's
 * tech stack, how many questions they answered, and how many filler
 * words ("um", "like", "you know"...) they used.
 *
 * No external API call - same transcript always produces the same
 * feedback, and every score/comment traces back to a number you can
 * point at in the transcript.
 */

export interface FeedbackCategoryScore {
  name: string;
  score: number;
  comment: string;
}

export interface GeneratedFeedback {
  totalScore: number;
  categoryScores: FeedbackCategoryScore[];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
}

export interface TranscriptEntryLike {
  speaker: "user" | "ai";
  text: string;
}

export interface FeedbackInput {
  role: string;
  techstack?: string[];
  totalQuestions?: number;
  transcript: TranscriptEntryLike[];
}

const FILLER_PHRASES = [
  "um",
  "uh",
  "erm",
  "like",
  "you know",
  "i mean",
  "sort of",
  "kind of",
];

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(n)));

function countFillerWords(text: string): number {
  return FILLER_PHRASES.reduce((count, phrase) => {
    const pattern = new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "gi");
    return count + (text.match(pattern)?.length ?? 0);
  }, 0);
}

function scoreCommunication(avgWords: number, fillerRatio: number): number {
  let base: number;
  if (avgWords <= 3) base = 35;
  else if (avgWords < 15) base = 35 + ((avgWords - 3) / 12) * 30;
  else if (avgWords < 40) base = 65 + ((avgWords - 15) / 25) * 25;
  else base = 90 + Math.min(8, (avgWords - 40) / 20);

  const fillerPenalty = Math.min(25, fillerRatio * 300);
  return clamp(base - fillerPenalty, 30, 98);
}

function scoreTechnical(
  fullUserText: string,
  techstack: string[]
): { score: number; mentioned: string[] } {
  if (techstack.length === 0) {
    return { score: 70, mentioned: [] };
  }
  const mentioned = techstack.filter((t) =>
    fullUserText.includes(t.toLowerCase())
  );
  const coverage = mentioned.length / techstack.length;
  return { score: clamp(45 + coverage * 53), mentioned };
}

function scoreCompleteness(answered: number, totalQuestions: number): number {
  if (totalQuestions <= 0) {
    return answered > 0 ? 85 : 50;
  }
  const ratio = Math.min(answered / totalQuestions, 1.2);
  return clamp(40 + Math.min(ratio, 1) * 58);
}

function scoreConfidence(fillerRatio: number, avgWords: number): number {
  const base = avgWords > 3 ? 88 : 60;
  const fillerPenalty = Math.min(35, fillerRatio * 350);
  return clamp(base - fillerPenalty, 30, 95);
}

export function generateInterviewFeedback({
  role,
  techstack = [],
  totalQuestions = 0,
  transcript,
}: FeedbackInput): GeneratedFeedback {
  const userTurns = transcript.filter(
    (t) => t.speaker === "user" && t.text.trim().length > 0
  );
  const words = userTurns.flatMap((t) => t.text.trim().split(/\s+/));
  const totalWords = words.length;
  const avgWords = userTurns.length > 0 ? totalWords / userTurns.length : 0;
  const fullUserText = userTurns.map((t) => t.text).join(" ").toLowerCase();

  const fillerCount = countFillerWords(fullUserText);
  const fillerRatio = totalWords > 0 ? fillerCount / totalWords : 0;

  const commScore = scoreCommunication(avgWords, fillerRatio);
  const { score: techScore, mentioned } = scoreTechnical(fullUserText, techstack);
  const completenessScore = scoreCompleteness(userTurns.length, totalQuestions);
  const confidenceScore = scoreConfidence(fillerRatio, avgWords);

  const categoryScores: FeedbackCategoryScore[] = [
    {
      name: "Communication Skills",
      score: commScore,
      comment: `Averaged ${Math.round(avgWords)} word${
        Math.round(avgWords) === 1 ? "" : "s"
      } per answer${
        fillerCount > 0
          ? ` with ${fillerCount} filler word${fillerCount === 1 ? "" : "s"} (e.g. "um", "like").`
          : ", with clean, filler-free phrasing."
      }`,
    },
    {
      name: "Technical Knowledge",
      score: techScore,
      comment:
        techstack.length > 0
          ? `Referenced ${mentioned.length}/${techstack.length} of the expected technologies${
              mentioned.length > 0 ? ` (${mentioned.join(", ")})` : ""
            }.`
          : "No specific tech stack was configured for this interview to check answers against.",
    },
    {
      name: "Completeness",
      score: completenessScore,
      comment: `Answered ${userTurns.length}${
        totalQuestions > 0 ? ` of ${totalQuestions}` : ""
      } question${userTurns.length === 1 ? "" : "s"} asked during the interview.`,
    },
    {
      name: "Confidence & Clarity",
      score: confidenceScore,
      comment:
        avgWords <= 3
          ? "Answers were too brief to demonstrate confidence - longer responses read as more assured."
          : fillerRatio < 0.03
          ? "Spoke clearly with minimal hesitation."
          : `Noticeable hesitation in responses - filler words made up ${(
              fillerRatio * 100
            ).toFixed(1)}% of words spoken.`,
    },
  ];

  const totalScore = clamp(
    categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length
  );

  // Bucket by an actual quality bar, not just relative rank - otherwise a
  // genuinely good score (e.g. 84/100) can get labeled an "improvement area"
  // purely for being the 2nd-lowest of four strong scores.
  const STRONG_THRESHOLD = 75;
  const sortedByScore = [...categoryScores].sort((a, b) => b.score - a.score);
  const strengths = sortedByScore
    .filter((c) => c.score >= STRONG_THRESHOLD)
    .slice(0, 3)
    .map((c) => `${c.name}: ${c.comment}`);
  const areasForImprovement = [...categoryScores]
    .filter((c) => c.score < STRONG_THRESHOLD)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((c) => `${c.name}: ${c.comment}`);

  if (strengths.length === 0) {
    strengths.push("Completed the interview and engaged with every question asked.");
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push("Keep practicing to build on this strong, well-rounded performance.");
  }

  const weakest = sortedByScore[sortedByScore.length - 1];
  const finalAssessment = `In this ${role} interview, you answered ${userTurns.length}${
    totalQuestions > 0 ? ` of ${totalQuestions}` : ""
  } question${userTurns.length === 1 ? "" : "s"} and scored ${totalScore}/100 overall. ${
    sortedByScore[0].name
  } was your strongest area. ${
    weakest.score < STRONG_THRESHOLD
      ? `Focus on ${weakest.name.toLowerCase()} to improve further.`
      : "Great, consistent performance across the board."
  }`;

  return {
    totalScore,
    categoryScores,
    strengths,
    areasForImprovement,
    finalAssessment,
  };
}
