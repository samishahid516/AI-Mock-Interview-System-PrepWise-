"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import Agent from "@/frontend/components/interview/Agent";
import InterviewForm from "@/frontend/components/interview/InterviewForm";
import ConfirmDialog from "@/frontend/components/common/ConfirmDialog";
import { Button } from "@/frontend/components/ui/button";

// Interview creation page with form and AI call functionality
const Page = () => {
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState("mock-user-id");
  const [showInterview, setShowInterview] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [interviewConfig, setInterviewConfig] = useState<{
    role: string;
    level: string;
    type: string;
    techstack: string[];
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createDialog, setCreateDialog] = useState<{
    isOpen: boolean;
    config: {
      role: string;
      level: string;
      type: string;
      techstack: string[];
      amount: number;
    } | null;
  }>({
    isOpen: false,
    config: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedName = localStorage.getItem("userName");
    const storedId = localStorage.getItem("userId");

    if (storedName) setUserName(storedName);
    if (storedId) setUserId(storedId);
  }, []);

  // Handle form submission - show confirmation dialog first
  const handleFormSubmit = (config: {
    role: string;
    level: string;
    type: string;
    techstack: string[];
    amount: number;
  }) => {
    setCreateDialog({
      isOpen: true,
      config,
    });
  };

  // Confirm and generate questions
  const handleConfirmCreate = async () => {
    if (!createDialog.config) return;

    const config = createDialog.config;
    setCreateDialog({ isOpen: false, config: null });
    await generateQuestions(config);
  };

  // Cancel creation
  const handleCancelCreate = () => {
    setCreateDialog({
      isOpen: false,
      config: null,
    });
  };

  const generateQuestions = async (config: {
    role: string;
    level: string;
    type: string;
    techstack: string[];
    amount: number;
  }) => {
    setIsGenerating(true);
    setInterviewConfig(config);

    try {
      // Call API route to generate questions
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      const generatedQuestions = data.questions || [];

      // Ensure we have at least some questions
      if (generatedQuestions.length === 0) {
        // Fallback questions
        generatedQuestions.push(
          `Can you tell me about yourself and your experience with ${config.role}?`,
          `What are the key skills required for a ${config.level} ${config.role}?`,
          `How do you approach problem-solving in your work?`,
          `Tell me about a challenging project you worked on`,
          `What interests you most about this role?`
        );
      }

      setQuestions(generatedQuestions);
      
      // Save interview to localStorage for dashboard display
      const interviewId = `custom-${Date.now()}`;
      const interviewData = {
        id: interviewId,
        role: config.role,
        type: config.type,
        level: config.level,
        techstack: config.techstack,
        questions: generatedQuestions,
        date: "Not taken",
        score: null,
        description: `${config.type} interview for ${config.level} ${config.role}`,
        createdAt: new Date().toISOString(),
      };
      
      // Save to localStorage
      if (typeof window !== "undefined") {
        const savedInterviews = JSON.parse(
          localStorage.getItem("customInterviews") || "[]"
        );
        savedInterviews.push(interviewData);
        localStorage.setItem("customInterviews", JSON.stringify(savedInterviews));
        
        // Also save questions and config for this interview session
        localStorage.setItem(`interviewQuestions_${interviewId}`, JSON.stringify(generatedQuestions));
        localStorage.setItem(`interviewConfig_${interviewId}`, JSON.stringify(config));
        localStorage.setItem(`interviewRole_${interviewId}`, config.role);
      }
      
      // Show success message
      toast.success("Interview created successfully!", {
        description: `${config.role} interview with ${generatedQuestions.length} questions is ready.`,
      });
      
      setShowInterview(true);
    } catch (error) {
      console.error("Error generating questions:", error);
      // Use fallback questions if generation fails
      const fallbackQuestions = [
        `Can you tell me about yourself and your experience with ${config.role}?`,
        `What are the key skills required for a ${config.level} ${config.role}?`,
        `How do you approach problem-solving in your work?`,
        `Tell me about a challenging project you worked on`,
        `What interests you most about this role?`,
      ];
      
      setQuestions(fallbackQuestions);
      
      // Save interview to localStorage even with fallback questions
      const interviewId = `custom-${Date.now()}`;
      const interviewData = {
        id: interviewId,
        role: config.role,
        type: config.type,
        level: config.level,
        techstack: config.techstack,
        questions: fallbackQuestions,
        date: "Not taken",
        score: null,
        description: `${config.type} interview for ${config.level} ${config.role}`,
        createdAt: new Date().toISOString(),
      };
      
      if (typeof window !== "undefined") {
        const savedInterviews = JSON.parse(
          localStorage.getItem("customInterviews") || "[]"
        );
        savedInterviews.push(interviewData);
        localStorage.setItem("customInterviews", JSON.stringify(savedInterviews));
        
        localStorage.setItem(`interviewQuestions_${interviewId}`, JSON.stringify(fallbackQuestions));
        localStorage.setItem(`interviewConfig_${interviewId}`, JSON.stringify(config));
        localStorage.setItem(`interviewRole_${interviewId}`, config.role);
      }
      
      // Show success message even with fallback questions
      toast.success("Interview created successfully!", {
        description: `${config.role} interview with ${fallbackQuestions.length} questions is ready.`,
      });
      
      setShowInterview(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToForm = () => {
    setShowInterview(false);
    setQuestions([]);
    setInterviewConfig(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 to-dark-600">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-dark-400 border-b border-dark-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showInterview ? (
          <>
            {/* Form Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Create a New Interview
              </h1>
              <p className="text-gray-400">
                Configure your interview settings and generate AI-powered questions
              </p>
            </div>

            <div className="bg-dark-300 border border-dark-200 rounded-2xl p-8">
              <InterviewForm
                onSubmit={handleFormSubmit}
                isLoading={isGenerating}
              />
            </div>
          </>
        ) : (
          <>
            {/* Interview Section */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {interviewConfig?.role} Interview
                </h1>
                <p className="text-gray-400">
                  {interviewConfig?.type} • {interviewConfig?.level} Level
                </p>
              </div>
              <Button
                onClick={handleBackToForm}
                className="bg-dark-400 border border-dark-200 text-gray-300 hover:border-primary-200 hover:text-primary-200 px-6"
              >
                ← Change Settings
              </Button>
            </div>

            <div className="bg-dark-300 border border-dark-200 rounded-2xl p-8">
              <Agent
                userName={userName}
                userId={userId}
                type="interview"
                questions={questions}
              />
            </div>
          </>
        )}
      </div>

      {/* Create Interview Confirmation Dialog */}
      <ConfirmDialog
        isOpen={createDialog.isOpen}
        title="Create Interview"
        message={`Are you ready to create a ${createDialog.config?.type} interview for ${createDialog.config?.role} (${createDialog.config?.level} level)? This will generate ${createDialog.config?.amount} AI-powered questions.`}
        onConfirm={handleConfirmCreate}
        onCancel={handleCancelCreate}
        confirmText="Yes, Create"
        cancelText="Cancel"
        confirmVariant="default"
      />
    </div>
  );
};

export default Page;
