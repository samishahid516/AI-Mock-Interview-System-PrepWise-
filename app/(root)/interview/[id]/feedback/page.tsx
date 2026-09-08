"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

import { Button } from "@/frontend/components/ui/button";

// Mock feedback data (UI only)
const mockFeedback: Record<string, any> = {
  "1": {
    id: "feedback-1",
    interviewId: "1",
    role: "Frontend Developer",
    totalScore: 85,
    finalAssessment:
      "Great interview! You demonstrated strong problem-solving skills and good communication.",
    categoryScores: [
      {
        name: "Technical Knowledge",
        score: 88,
        comment: "Excellent grasp of concepts",
      },
      {
        name: "Communication",
        score: 85,
        comment: "Clear explanation of solutions",
      },
      {
        name: "Problem Solving",
        score: 82,
        comment: "Good approach to problems",
      },
    ],
    strengths: [
      "Clear explanations",
      "Good technical knowledge",
      "Methodical approach",
    ],
    areasForImprovement: ["Code optimization", "Edge case handling"],
    createdAt: new Date().toISOString(),
  },
  "2": {
    id: "feedback-2",
    interviewId: "2",
    role: "Backend Developer",
    totalScore: 78,
    finalAssessment:
      "Good interview overall. You showed solid backend knowledge. Continue practicing design patterns.",
    categoryScores: [
      {
        name: "Backend Architecture",
        score: 80,
        comment: "Good understanding",
      },
      {
        name: "Database Design",
        score: 76,
        comment: "Room for improvement",
      },
      { name: "API Design", score: 78, comment: "Solid approach" },
    ],
    strengths: ["Strong API design", "Good database knowledge"],
    areasForImprovement: [
      "System design optimization",
      "Error handling strategies",
    ],
    createdAt: new Date().toISOString(),
  },
  "3": {
    id: "feedback-3",
    interviewId: "3",
    role: "Product Manager",
    totalScore: 92,
    finalAssessment:
      "Excellent interview! You showed exceptional strategic thinking and clear communication of product vision.",
    categoryScores: [
      {
        name: "Product Strategy",
        score: 94,
        comment: "Outstanding strategic vision",
      },
      {
        name: "Communication",
        score: 91,
        comment: "Clear and compelling presentation",
      },
      {
        name: "Leadership",
        score: 91,
        comment: "Strong collaborative approach",
      },
    ],
    strengths: [
      "Clear product vision",
      "Data-driven approach",
      "Team collaboration",
    ],
    areasForImprovement: [
      "Handling resource constraints",
      "Timeline estimation",
    ],
    createdAt: new Date().toISOString(),
  },
};

const Feedback = () => {
  const params = useParams();
  const id = params.id as string;
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    // First check mock feedback
    let foundFeedback = mockFeedback[id];

    // If not found, check completed interviews from localStorage
    if (!foundFeedback && typeof window !== "undefined") {
      const completedInterviews = JSON.parse(
        localStorage.getItem("completedInterviews") || "[]"
      );
      const completedInterview = completedInterviews.find(
        (ci: any) => ci.id === id
      );

      if (completedInterview) {
        // Base total score: use saved score if present, otherwise random 70–95
        const baseScore =
          typeof completedInterview.score === "number" &&
          completedInterview.score > 0
            ? completedInterview.score
            : 70 + Math.floor(Math.random() * 26);

        // Generate role-specific category breakdown with random-ish scores near baseScore
        const role: string = (completedInterview.role || "").toLowerCase();
        let categories: { name: string; score: number; comment: string }[] = [];

        const makeScore = (delta: number) =>
          Math.max(60, Math.min(100, baseScore + delta));

        if (role.includes("frontend")) {
          categories = [
            {
              name: "React & UI Skills",
              score: makeScore(+2),
              comment: "Strong understanding of component design and state.",
            },
            {
              name: "JavaScript Fundamentals",
              score: makeScore(0),
              comment: "Good grasp of core language features.",
            },
            {
              name: "Communication",
              score: makeScore(-3),
              comment: "Explains solutions clearly and concisely.",
            },
          ];
        } else if (role.includes("backend")) {
          categories = [
            {
              name: "API & Architecture",
              score: makeScore(+1),
              comment: "Solid approach to designing and structuring services.",
            },
            {
              name: "Database & SQL",
              score: makeScore(-2),
              comment: "Understands schema design and querying.",
            },
            {
              name: "Problem Solving",
              score: makeScore(+3),
              comment: "Handles scenarios methodically under constraints.",
            },
          ];
        } else if (role.includes("product")) {
          categories = [
            {
              name: "Product Strategy",
              score: makeScore(+3),
              comment: "Strong sense of vision and prioritization.",
            },
            {
              name: "Communication",
              score: makeScore(0),
              comment: "Clearly articulates trade-offs and decisions.",
            },
            {
              name: "Leadership",
              score: makeScore(-2),
              comment: "Collaborates effectively with cross‑functional teams.",
            },
          ];
        } else {
          // Generic fallback
          categories = [
            {
              name: "Technical Knowledge",
              score: makeScore(+1),
              comment: "Good understanding of core concepts.",
            },
            {
              name: "Communication",
              score: makeScore(0),
              comment: "Explains ideas in a clear way.",
            },
            {
              name: "Problem Solving",
              score: makeScore(-2),
              comment: "Approaches challenges logically and systematically.",
            },
          ];
        }

        // Generate strengths / improvements if not already provided
        const defaultStrengths: string[] =
          completedInterview.strengths && completedInterview.strengths.length
            ? completedInterview.strengths
            : [
                "Structured answers with clear reasoning.",
                "Stays calm and thoughtful under pressure.",
                "Shows good understanding of real‑world scenarios.",
              ];

        const defaultImprovements: string[] =
          completedInterview.areasForImprovement &&
          completedInterview.areasForImprovement.length
            ? completedInterview.areasForImprovement
            : [
                "Add a bit more depth when explaining trade‑offs.",
                "Practice giving more concrete, real project examples.",
                "Slow down slightly to make complex points easier to follow.",
              ];

        // Convert completed interview to rich feedback format
        foundFeedback = {
          id: `feedback-${id}`,
          interviewId: id,
          role: completedInterview.role,
          totalScore: baseScore,
          finalAssessment: completedInterview.finalAssessment || completedInterview.feedback || "Interview completed successfully.",
          categoryScores: categories,
          strengths: defaultStrengths,
          areasForImprovement: defaultImprovements,
          feedback: completedInterview.feedback,
          transcript: completedInterview.transcript,
          createdAt: completedInterview.completedAt || new Date().toISOString(),
        };
      }
    }

    setFeedback(foundFeedback);
  }, [id]);

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 to-dark-600 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            {feedback === null ? "Loading feedback..." : "Feedback not found"}
          </h1>
          <Link href="/dashboard">
            <Button className="bg-primary-200 text-black font-semibold hover:bg-primary-300 px-8 py-3">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 to-dark-600">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-dark-400 border-b border-dark-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-80 transition"
              >
                <Image src="/logo.svg" alt="PrepWise" width={32} height={32} />
                <span className="text-xl font-bold text-white">PrepWise</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button className="bg-dark-400 border border-dark-200 text-gray-300 hover:border-primary-200 hover:text-primary-200 px-6">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Interview Feedback
          </h1>
          <p className="text-gray-400">
            Here&apos;s your detailed feedback for the{" "}
            <span className="font-semibold text-primary-200">
              {feedback.role}
            </span>{" "}
            interview
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-r from-primary-200 to-primary-300 rounded-2xl p-8 mb-8 text-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90 mb-2">
                Overall Score
              </p>
              <h2 className="text-5xl font-bold">{feedback.totalScore}/100</h2>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-2">Interview Date</p>
              <p className="text-lg font-semibold">
                {dayjs(feedback.createdAt).format("MMM D, YYYY")}
              </p>
            </div>
          </div>
        </div>

        {/* Assessment */}
        <div className="bg-dark-300 border border-dark-200 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-3">Assessment</h3>
          <p className="text-gray-300 leading-relaxed">
            {feedback.finalAssessment}
          </p>
        </div>

        {/* Category Breakdown */}
        {feedback.categoryScores && feedback.categoryScores.length > 0 && (
          <div className="bg-dark-300 border border-dark-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">
              Category Breakdown
            </h3>
            <div className="space-y-4">
              {feedback.categoryScores.map((category: any, index: number) => (
                <div key={index} className="bg-dark-400 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">{category.name}</h4>
                    <span className="text-primary-200 font-bold text-lg">
                      {category.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-dark-500 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-primary-200 to-primary-300 h-2 rounded-full"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{category.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Feedback Text (for completed interviews) */}
        {feedback.feedback && (
          <div className="bg-dark-300 border border-dark-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Detailed Feedback</h3>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {feedback.feedback}
            </div>
          </div>
        )}

        {/* Strengths & Areas for Improvement */}
        {(feedback.strengths?.length > 0 || feedback.areasForImprovement?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {feedback.strengths && feedback.strengths.length > 0 && (
              <div className="bg-dark-300 border border-dark-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Strengths
                </h3>
                <ul className="space-y-2">
                  {feedback.strengths.map((strength: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-gray-300"
                    >
                      <span className="text-primary-200 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
              <div className="bg-dark-300 border border-dark-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-yellow-400">⚡</span> Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {feedback.areasForImprovement.map(
                    (area: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary-200 mt-1">•</span>
                        {area}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-between">
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full bg-dark-400 border border-dark-200 text-gray-300 hover:border-primary-200 hover:text-primary-200 py-3 font-semibold">
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/interview/${id}`} className="flex-1">
            <Button className="w-full bg-primary-200 text-black hover:bg-primary-300 py-3 font-semibold">
              Retake Interview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
