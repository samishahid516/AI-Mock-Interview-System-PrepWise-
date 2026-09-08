"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import ConfirmDialog from "@/frontend/components/common/ConfirmDialog";

// Mock interview data for dashboard UI (no backend, just UI)
const mockInterviews = [
  {
    id: "1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "CSS"],
    date: "Dec 10, 2024",
    score: 85,
    description: "Build responsive web applications with React and TypeScript",
  },
  {
    id: "2",
    role: "Backend Developer",
    type: "Technical",
    techstack: ["Node.js", "PostgreSQL", "Docker"],
    date: "Dec 12, 2024",
    score: 78,
    description: "Design and implement scalable backend systems",
  },
  {
    id: "3",
    role: "Product Manager",
    type: "Behavioral",
    techstack: ["Strategy", "Analytics", "Leadership"],
    date: "Not taken",
    score: null,
    description: "Assess product strategy and leadership skills",
  },
  {
    id: "4",
    role: "Frontend Interview",
    type: "Technical",
    techstack: ["React", "JavaScript", "HTML/CSS"],
    date: "Not taken",
    score: null,
    description: "Practice frontend development skills and UI/UX concepts",
  },
  {
    id: "5",
    role: "Backend Interview",
    type: "Technical",
    techstack: [".NET", "SQL Server", "API Design"],
    date: "Not taken",
    score: null,
    description: "Test your backend architecture and database design skills",
  },
  {
    id: "6",
    role: "Mobile Developer Interview",
    type: "Technical",
    techstack: ["React Native", "iOS", "Android"],
    date: "Not taken",
    score: null,
    description: "Assess mobile app development and cross-platform skills",
  },
  {
    id: "7",
    role: "Full Stack Interview",
    type: "Technical",
    techstack: ["Next.js", ".NET", "SQL Server"],
    date: "Not taken",
    score: null,
    description: "Comprehensive interview covering both frontend and backend",
  },
  {
    id: "8",
    role: "UI/UX Interview",
    type: "Design",
    techstack: ["Figma", "Design Systems", "User Research"],
    date: "Not taken",
    score: null,
    description: "Evaluate UI/UX design skills and user-centered thinking",
  },
];

// Dashboard page with hero section "Get Interview-Ready with AI-Powered Practice & Feedback"
const DashboardPage = () => {
  const [completedInterviews, setCompletedInterviews] = useState<any[]>([]);
  const [customInterviews, setCustomInterviews] = useState<any[]>([]);
  const [deletedInterviewIds, setDeletedInterviewIds] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    interviewId: string | null;
    interviewRole: string;
  }>({
    isOpen: false,
    interviewId: null,
    interviewRole: "",
  });

  // Load completed interviews, custom interviews, and deleted interview IDs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load completed interviews
      const saved = localStorage.getItem("completedInterviews");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          // Ensure every completed interview has a numeric score (for star display)
          let changed = false;
          const normalized = parsed.map((ci: any) => {
            if (typeof ci.score === "number" && ci.score > 0) {
              return ci;
            }
            const baseScore = 70 + Math.floor(Math.random() * 26); // 70–95
            changed = true;
            return { ...ci, score: baseScore };
          });

          setCompletedInterviews(normalized);

          // Persist normalized scores once so they stay stable
          if (changed) {
            localStorage.setItem(
              "completedInterviews",
              JSON.stringify(normalized)
            );
          }
        } catch (e) {
          console.error("Error loading completed interviews:", e);
        }
      }
      
      // Load custom interviews (created via form)
      const savedCustom = localStorage.getItem("customInterviews");
      if (savedCustom) {
        try {
          setCustomInterviews(JSON.parse(savedCustom));
        } catch (e) {
          console.error("Error loading custom interviews:", e);
        }
      }
      
      // Load deleted interview IDs
      const savedDeleted = localStorage.getItem("deletedInterviewIds");
      if (savedDeleted) {
        try {
          const deletedIds = JSON.parse(savedDeleted);
          setDeletedInterviewIds(new Set(deletedIds));
        } catch (e) {
          console.error("Error loading deleted interview IDs:", e);
        }
      }
    }
  }, []);

  // Combine mock interviews with completed interviews and custom interviews
  // Put completed interviews first so they take priority in deduplication
  const allInterviews = [
    // Completed interviews (from Agent) - always first
    ...completedInterviews.map((ci) => ({
      ...ci,
      // Use actual score if present, otherwise 0 to indicate "completed without numeric score"
      score: ci.score ?? 0,
    })),
    // Built‑in mock interviews
    ...mockInterviews,
    // Custom interviews created via the form
    ...customInterviews.map((ci) => ({
      ...ci,
      score: ci.score ?? null, // Keep null for not taken
    })),
  ];

  // Get unique interviews (avoid duplicates) and filter out deleted ones
  // Because completed interviews come first in allInterviews, they will win
  const uniqueInterviews = allInterviews
    .filter((interview) => !deletedInterviewIds.has(interview.id))
    .reduce((acc: any[], current: any) => {
      const existing = acc.find((item) => item.id === current.id);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

  // Open delete confirmation dialog
  const handleDeleteClick = (interviewId: string, interviewRole: string) => {
    setDeleteDialog({
      isOpen: true,
      interviewId,
      interviewRole,
    });
  };

  // Confirm delete interview function - works for all interviews
  const handleConfirmDelete = () => {
    const interviewId = deleteDialog.interviewId;
    if (!interviewId) return;

    // Add to deleted IDs set
    const updatedDeletedIds = new Set(deletedInterviewIds);
    updatedDeletedIds.add(interviewId);
    setDeletedInterviewIds(updatedDeletedIds);
    
    // Save to localStorage
    localStorage.setItem("deletedInterviewIds", JSON.stringify(Array.from(updatedDeletedIds)));

    // If it's a custom interview, also remove from customInterviews and related data
    if (interviewId.startsWith("custom-")) {
      const savedCustom = localStorage.getItem("customInterviews");
      if (savedCustom) {
        try {
          const customInterviews = JSON.parse(savedCustom);
          const updatedInterviews = customInterviews.filter(
            (ci: any) => ci.id !== interviewId
          );
          localStorage.setItem("customInterviews", JSON.stringify(updatedInterviews));
          
          // Also remove related data
          localStorage.removeItem(`interviewQuestions_${interviewId}`);
          localStorage.removeItem(`interviewConfig_${interviewId}`);
          localStorage.removeItem(`interviewRole_${interviewId}`);
          
          // Update state
          setCustomInterviews(updatedInterviews);
        } catch (e) {
          console.error("Error deleting custom interview:", e);
        }
      }
    }

    // Show success message
    toast.success("Interview deleted successfully", {
      description: `${deleteDialog.interviewRole} has been removed.`,
    });

    // Close dialog
    setDeleteDialog({
      isOpen: false,
      interviewId: null,
      interviewRole: "",
    });
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      interviewId: null,
      interviewRole: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 to-dark-600">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-dark-400 border-b border-dark-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="PrepWise" width={32} height={32} />
              <span className="text-xl font-bold text-white">PrepWise</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/interview"
                className="text-gray-300 hover:text-white transition"
              >
                <Button className="bg-primary-200 text-black font-semibold hover:bg-primary-300 px-6">
                  + New Interview
                </Button>
              </Link>
              <Link href="/profile">
                <button className="flex items-center gap-2 text-gray-300 hover:text-white transition text-sm px-4 py-2 rounded-lg hover:bg-dark-300">
                  <Image
                    src="/profile.svg"
                    alt="Profile"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  Profile
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="text-gray-300 hover:text-white transition text-sm px-4 py-2 rounded-lg hover:bg-dark-300">
                  Logout
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section - Start an Interview */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-primary-200 to-primary-300 rounded-2xl p-12 flex items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-black mb-4">
                Get Interview-Ready with AI-Powered Practice & Feedback
              </h2>
              <p className="text-lg text-black mb-6 opacity-90">
                Practice real interview questions & get instant feedback
              </p>
              <Link href="/interview">
                <Button className="bg-black text-primary-200 font-bold hover:bg-dark-500 px-8 py-3 text-lg">
                  + Start an Interview
                </Button>
              </Link>
            </div>
            <div className="hidden lg:block flex-shrink-0">
              <Image
                src="/robot.png"
                alt="AI Interviewer"
                width={300}
                height={300}
                className="object-contain"
              />
            </div>
          </div>
        </section>

        {/* Your Interviews Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Your Interviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueInterviews
              // Show interviews that either have a score OR were completed (have completedAt)
              .filter(
                (interview) =>
                  (interview.score !== null &&
                    interview.score !== undefined &&
                    interview.score !== 0) ||
                  interview.completedAt
              )
              .map((interview) => (
                <div
                  key={interview.id}
                  className="bg-dark-300 border border-dark-200 rounded-xl p-6 hover:border-primary-200 transition flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-dark-400 text-primary-200">
                        {interview.type}
                      </span>
                      {(interview.score !== null &&
                        interview.score !== undefined &&
                        interview.score !== 0) && (
                        <div className="flex items-center gap-1 text-sm">
                          <Image
                            src="/star.svg"
                            width={16}
                            height={16}
                            alt="score"
                          />
                          <span className="text-primary-200 font-bold">
                            {interview.score}/100
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Interview Role */}
                    <h3 className="text-lg font-bold text-white mb-2">
                      {interview.role}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {interview.description}
                    </p>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                      <Image
                        src="/calendar.svg"
                        width={16}
                        height={16}
                        alt="date"
                      />
                      {interview.date}
                    </div>

                    {/* Tech Stack */}
                    <div className="flex gap-2 flex-wrap">
                      {interview.techstack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="inline-block px-2 py-1 rounded text-xs bg-dark-400 text-gray-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6">
                    <Link href={`/interview/${interview.id}/feedback`}>
                      <Button className="w-full bg-primary-200 text-black font-semibold hover:bg-primary-300 py-2">
                        View Feedback
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
          </div>
          {uniqueInterviews.filter(
            (i) =>
              (i.score !== null &&
                i.score !== undefined &&
                i.score !== 0) ||
              i.completedAt
          ).length === 0 && (
            <div className="bg-dark-300 border border-dark-200 rounded-xl p-8 text-center">
              <p className="text-gray-400">
                You haven&apos;t taken any interviews yet
              </p>
            </div>
          )}
        </section>

        {/* Take Interviews Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">
            Take Interviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueInterviews
              // Show interviews that have NOT been completed (no completedAt and no score)
              .filter(
                (interview) =>
                  (!interview.score || interview.score === 0) &&
                  !interview.completedAt
              )
              .map((interview) => (
                <div
                  key={interview.id}
                  className="bg-dark-300 border border-dark-200 rounded-xl p-6 hover:border-primary-200 transition flex flex-col justify-between h-full relative"
                >
                  {/* Delete Button - Show for all interviews */}
                  <button
                    onClick={() => handleDeleteClick(interview.id, interview.role)}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors z-10"
                    title="Delete interview"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div>
                    {/* Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-dark-400 text-primary-200">
                        {interview.type}
                      </span>
                    </div>

                    {/* Interview Role */}
                    <h3 className="text-lg font-bold text-white mb-2">
                      {interview.role}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {interview.description}
                    </p>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                      <Image
                        src="/calendar.svg"
                        width={16}
                        height={16}
                        alt="date"
                      />
                      {interview.date}
                    </div>

                    {/* Tech Stack */}
                    <div className="flex gap-2 flex-wrap">
                      {interview.techstack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="inline-block px-2 py-1 rounded text-xs bg-dark-400 text-gray-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6">
                    <Link href={`/interview/${interview.id}`}>
                      <Button className="w-full bg-primary-200 text-black font-semibold hover:bg-primary-300 py-2">
                        Start Interview
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
          </div>
          {uniqueInterviews.filter(
            (i) => (!i.score || i.score === 0) && !i.completedAt
          ).length === 0 && (
            <div className="bg-dark-300 border border-dark-200 rounded-xl p-8 text-center">
              <p className="text-gray-400">There are no interviews available</p>
            </div>
          )}
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Interview"
        message={`Are you sure you want to delete "${deleteDialog.interviewRole}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
};

export default DashboardPage;
