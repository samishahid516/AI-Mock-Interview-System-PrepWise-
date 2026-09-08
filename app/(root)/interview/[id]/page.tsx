"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

import Agent from "@/frontend/components/interview/Agent";
import { getRandomInterviewCover } from "@/shared/utils/utils";
import DisplayTechIcons from "@/frontend/components/common/DisplayTechIcons";
import { Button } from "@/frontend/components/ui/button";

// Mock interview data (UI only)
const mockInterviews: Record<string, any> = {
  "1": {
    id: "1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "Tailwind"],
    questions: [
      "What is React?",
      "Explain the concept of hooks",
      "How does state management work?",
    ],
  },
  "2": {
    id: "2",
    role: "Backend Developer",
    type: "Technical",
    techstack: ["Node.js", "PostgreSQL", "Docker"],
    questions: [
      "What is REST API?",
      "Explain database normalization",
      "How do you handle authentication?",
    ],
  },
  "3": {
    id: "3",
    role: "Product Manager",
    type: "Behavioral",
    techstack: ["Strategy", "Analytics", "Leadership"],
    questions: [
      "Tell us about your product experience",
      "How do you handle disagreement in the team?",
      "Describe a product launch you led",
    ],
  },
  "4": {
    id: "4",
    role: "Frontend Interview",
    type: "Technical",
    techstack: ["React", "JavaScript", "HTML/CSS"],
    questions: [
      "Can you tell me about yourself and your frontend development experience?",
      "What are the key differences between React and Vue.js?",
      "How do you optimize website performance?",
      "Explain the difference between let, const, and var in JavaScript",
      "How do you ensure your code is accessible (a11y)?",
    ],
  },
  "5": {
    id: "5",
    role: "Backend Interview",
    type: "Technical",
    techstack: [".NET", "SQL Server", "API Design"],
    questions: [
      "Tell me about your backend development experience",
      "How do you design a RESTful API?",
      "Explain the difference between SQL and NoSQL databases",
      "How do you handle database migrations?",
      "What is the difference between authentication and authorization?",
    ],
  },
  "6": {
    id: "6",
    role: "Mobile Developer Interview",
    type: "Technical",
    techstack: ["React Native", "iOS", "Android"],
    questions: [
      "Can you describe your mobile development experience?",
      "What are the differences between native and cross-platform development?",
      "How do you handle app state management in mobile apps?",
      "Explain how you optimize mobile app performance",
      "How do you handle different screen sizes and orientations?",
    ],
  },
  "7": {
    id: "7",
    role: "Full Stack Interview",
    type: "Technical",
    techstack: ["Next.js", ".NET", "SQL Server"],
    questions: [
      "Tell me about your full stack development experience",
      "How do you structure a full stack application?",
      "Explain the flow of data from frontend to backend to database",
      "How do you ensure security in a full stack application?",
      "What is your approach to API design and documentation?",
    ],
  },
  "8": {
    id: "8",
    role: "UI/UX Interview",
    type: "Design",
    techstack: ["Figma", "Design Systems", "User Research"],
    questions: [
      "Can you tell me about your design process?",
      "How do you conduct user research?",
      "Explain the difference between UI and UX",
      "How do you create and maintain a design system?",
      "Describe a time when you had to redesign a feature based on user feedback",
    ],
  },
};

const InterviewDetails = () => {
  const params = useParams();
  const id = params.id as string;
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState("mock-user-id");
  const [interview, setInterview] = useState<any>(null);

  // Get interview data - check both mock interviews and custom interviews
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedName = localStorage.getItem("userName");
    const storedId = localStorage.getItem("userId");
    if (storedName) setUserName(storedName);
    if (storedId) setUserId(storedId);

    // First check mock interviews
    let foundInterview = mockInterviews[id];
    
    // Save mock interview config to localStorage if it's a mock interview
    if (foundInterview && !id.startsWith("custom-")) {
      const config = {
        type: foundInterview.type || "Technical",
        techstack: foundInterview.techstack || [],
        level: "",
        role: foundInterview.role,
      };
      localStorage.setItem(`interviewConfig_${id}`, JSON.stringify(config));
      localStorage.setItem(`interviewRole_${id}`, foundInterview.role);
    }

    // If not found, check custom interviews from localStorage
    if (!foundInterview && id.startsWith("custom-")) {
      const customInterviews = JSON.parse(
        localStorage.getItem("customInterviews") || "[]"
      );
      foundInterview = customInterviews.find((ci: any) => ci.id === id);
      
      // If found, load questions from localStorage
      if (foundInterview) {
        const savedQuestions = localStorage.getItem(`interviewQuestions_${id}`);
        if (savedQuestions) {
          try {
            foundInterview.questions = JSON.parse(savedQuestions);
          } catch (e) {
            console.error("Error parsing saved questions:", e);
          }
        }
      }
    }

    if (foundInterview) {
      setInterview(foundInterview);
      // Save interview details to localStorage for Agent component
      localStorage.setItem(`interviewRole_${id}`, foundInterview.role);
      
      // Save interview config with all details
      const config = {
        type: foundInterview.type || "Technical",
        techstack: foundInterview.techstack || [],
        level: foundInterview.level || "",
        role: foundInterview.role,
      };
      localStorage.setItem(`interviewConfig_${id}`, JSON.stringify(config));
    }
  }, [id]);

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 to-dark-600 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Loading interview...
          </h1>
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
              <Link href="/">
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
        {/* Interview Header */}
        <div className="mb-8 bg-dark-300 border border-dark-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-black">
                  {interview.role.charAt(0)}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {interview.role} Interview
                </h1>
                <p className="text-gray-400 mb-4">
                  Practice and improve your skills with this targeted interview
                </p>

                <div className="flex items-center gap-6">
                  <span className="inline-block px-4 py-2 rounded-lg text-sm font-semibold bg-dark-400 text-primary-200">
                    {interview.type}
                  </span>

                  <div className="flex items-center gap-2">
                    {(interview.techstack || []).map((tech: string) => (
                      <span
                        key={tech}
                        className="inline-block px-3 py-1 rounded text-xs bg-dark-400 text-gray-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Component */}
        <div className="bg-dark-300 border border-dark-200 rounded-2xl p-8">
          <Agent
            userName={userName}
            userId={userId}
            interviewId={id}
            type="interview"
            questions={interview?.questions || []}
            feedbackId={undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewDetails;
