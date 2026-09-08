"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { vapi } from "@/api/integrations/vapi";
import { interviewer } from "@/shared/constants";
import { cn } from "@/shared/utils/utils";
import { generateInterviewFeedback } from "@/shared/utils/feedbackAnalysis";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface TranscriptEntry {
  speaker: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string>("");
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const currentMessageRef = useRef<TranscriptEntry | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserPhoto(localStorage.getItem("userPhoto"));
    }
  }, []);

  // Typing effect function
  const typeText = (text: string) => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsTyping(true);
    setDisplayedText("");
    let currentIndex = 0;

    const typeChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeChar, 30); // 30ms per character
      } else {
        setIsTyping(false);
      }
    };

    typeChar();
  };

  // Initialize Vapi
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
      setError("Vapi web token is missing. Please add NEXT_PUBLIC_VAPI_WEB_TOKEN to your .env.local file.");
      return;
    }

    // Set up Vapi event listeners
    vapi.on("call-start", () => {
      setCallStatus(CallStatus.ACTIVE);
      setIsListening(true);
    });

    vapi.on("call-end", () => {
      setCallStatus(CallStatus.FINISHED);
      setIsListening(false);
      setIsSpeaking(false);
    });

    vapi.on("speech-start", () => {
      setIsSpeaking(true);
      setIsListening(false);
    });

    vapi.on("speech-end", () => {
      setIsSpeaking(false);
      setIsListening(true);
    });

    vapi.on("message", (message: any) => {
      // Handle transcript messages - both partial (real-time) and final
      if (message.type === "transcript") {
        const entry: TranscriptEntry = {
          speaker: message.role === "user" ? "user" : "ai",
          text: message.transcript || "",
          timestamp: new Date(),
        };
        
        if (message.transcriptType === "final") {
          // Final transcript - add to full transcript list
          setTranscript((prev) => {
            // Check if this is updating the last message (same speaker, recent timestamp)
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.speaker === entry.speaker && 
                Math.abs(lastEntry.timestamp.getTime() - entry.timestamp.getTime()) < 3000) {
              // Update the last message
              const updated = [...prev];
              updated[updated.length - 1] = entry;
              return updated;
            } else {
              // Add new message
              return [...prev, entry];
            }
          });
          // Update current message for typing effect
          currentMessageRef.current = entry;
          // Start typing effect for final message
          typeText(entry.text);
        } else if (message.transcriptType === "partial") {
          // Partial transcript - show real-time as user/AI speaks
          // Update displayed text immediately for the current message
          setDisplayedText(message.transcript || "");
          setIsTyping(true);
          
          // If this is a new partial message (different from last), add it temporarily
          setTranscript((prev) => {
            const lastEntry = prev[prev.length - 1];
            if (!lastEntry || lastEntry.speaker !== entry.speaker || 
                Math.abs(lastEntry.timestamp.getTime() - entry.timestamp.getTime()) > 5000) {
              // Add new partial entry
              return [...prev, entry];
            } else {
              // Update last entry with partial text
              const updated = [...prev];
              updated[updated.length - 1] = entry;
              return updated;
            }
          });
          currentMessageRef.current = entry;
        }
      }
    });

    vapi.on("error", (error: any) => {
      // Suppress daily-js version warnings (non-critical)
      if (error?.message?.includes("daily-js version")) {
        console.warn("Vapi dependency warning (non-critical):", error.message);
        return;
      }
      console.error("Vapi error:", error);
      setError(error.message || "An error occurred with the voice assistant.");
    });

    // Cleanup on unmount
    return () => {
      try {
        vapi.stop();
      } catch (e) {
        // Ignore errors on cleanup
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Update displayed text when new message arrives
  useEffect(() => {
    if (currentMessageRef.current && transcript.length > 0) {
      const latestEntry = transcript[transcript.length - 1];
      if (latestEntry.text !== displayedText || !isTyping) {
        typeText(latestEntry.text);
      }
    }
  }, [transcript.length]);

  const handleCall = async () => {
    try {
      setError("");
      setCallStatus(CallStatus.CONNECTING);
      setTranscript([]);
      setDisplayedText("");
      currentMessageRef.current = null;
      setIsTyping(false);

      // Check if workflow ID is provided (preferred method)
      const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
      
      if (workflowId) {
        // Use workflow ID if available
        await vapi.start(workflowId);
      } else {
        // Otherwise, use assistant configuration
        const questionsText = questions && questions.length > 0
          ? questions.map((q, i) => `${i + 1}. ${q}`).join("\n")
          : "Ask relevant interview questions based on the role.";

        // Start with first question if available
        const firstMessage = questions && questions.length > 0
          ? `Hello ${userName}! Thank you for taking the time to speak with me today. Let's begin. ${questions[0]}`
          : `Hello ${userName}! I'm ready to conduct your interview. Let's begin!`;

        // Enhanced system prompt with specific interview context
        const roleContext = questions && questions.length > 0
          ? `You are conducting a professional interview with ${userName} for a specific role. This interview has predefined questions that you MUST ask.`
          : `You are conducting a professional interview with ${userName}.`;

        const systemContent = interviewer.model?.messages?.[0]?.content?.replace(
          "{{questions}}",
          `${roleContext}\n\nCRITICAL INSTRUCTIONS:\n- You MUST ask these EXACT questions in this order:\n${questionsText}\n\nInterview Rules:\n- Ask ONE question at a time\n- Wait for ${userName}'s complete answer before responding\n- If ${userName} says "I don't know" or similar, provide the correct answer with explanation\n- If ${userName} gives an incorrect answer, provide the correct/best answer with explanation\n- Help ${userName} learn and prepare - act as both interviewer and teacher\n- Then move to the next question from the list\n- Ask follow-up questions if ${userName}'s answer is vague or needs more detail\n- After asking all questions, provide detailed professional feedback with rating\n- Use ${userName}'s name when addressing them\n- Be professional but helpful - help them prepare for real interviews`
        ) || `You are a professional job interviewer and coach conducting an interview with ${userName}. ${roleContext} ${questionsText}`;

        const assistantConfig: typeof interviewer = {
          ...interviewer,
          firstMessage,
          model: interviewer.model ? {
            ...interviewer.model,
            messages: [
              {
                role: "system",
                content: systemContent,
              },
            ],
          } : undefined,
        };

        // Start Vapi call with assistant config
        await vapi.start(assistantConfig);
      }
    } catch (error: any) {
      console.error("Error starting call:", error);
      setError(error.message || "Failed to start the interview. Please check your Vapi configuration.");
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    try {
      vapi.stop();
      setCallStatus(CallStatus.FINISHED);
      setIsListening(false);
      setIsSpeaking(false);

      // Save completed interview to localStorage for "Your Interviews" section
      if (interviewId && type === "interview") {
        try {
          const completedInterviews = JSON.parse(
            localStorage.getItem("completedInterviews") || "[]"
          );
          
          // Get interview details from localStorage
          const interviewRole = typeof window !== "undefined" 
            ? localStorage.getItem(`interviewRole_${interviewId}`) || "Interview"
            : "Interview";
          
          // Try to get interview config for type and techstack
          let interviewType = "Technical";
          let interviewTechstack: string[] = [];
          let interviewLevel = "";
          
          if (typeof window !== "undefined") {
            const savedConfig = localStorage.getItem(`interviewConfig_${interviewId}`);
            if (savedConfig) {
              try {
                const config = JSON.parse(savedConfig);
                interviewType = config.type || "Technical";
                interviewTechstack = config.techstack || [];
                interviewLevel = config.level || "";
              } catch (e) {
                console.error("Error parsing interview config:", e);
              }
            }
            
            // Also check customInterviews for more details
            const customInterviews = JSON.parse(
              localStorage.getItem("customInterviews") || "[]"
            );
            const customInterview = customInterviews.find((ci: any) => ci.id === interviewId);
            if (customInterview) {
              interviewType = customInterview.type || interviewType;
              interviewTechstack = customInterview.techstack || interviewTechstack;
              interviewLevel = customInterview.level || interviewLevel;
            }
            
            // Also check mock interviews (for interviews like "4" - Frontend Interview)
            // Mock interviews are hardcoded, but we can infer from the role
            if (!interviewTechstack || interviewTechstack.length === 0) {
              // Try to get from mock interview data structure if available
              // For now, we'll use defaults based on common patterns
              if (interviewRole.toLowerCase().includes("frontend")) {
                interviewTechstack = ["React", "JavaScript", "HTML/CSS"];
              } else if (interviewRole.toLowerCase().includes("backend")) {
                interviewTechstack = [".NET", "SQL Server", "API Design"];
              }
            }
          }

          // Score the interview from the actual transcript content: how much
          // the candidate said, how much of the expected tech stack they
          // mentioned, how many questions they answered, and how many filler
          // words they used. Deterministic - no random fallback.
          const generated = generateInterviewFeedback({
            role: interviewRole,
            techstack: interviewTechstack,
            totalQuestions: questions?.length ?? 0,
            transcript,
          });

          const interviewData = {
            id: interviewId,
            role: interviewRole,
            type: interviewType,
            level: interviewLevel,
            techstack: interviewTechstack,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            score: generated.totalScore,
            description: `${interviewType} interview for ${interviewLevel} ${interviewRole}`,
            transcript: transcript,
            finalAssessment: generated.finalAssessment,
            categoryScores: generated.categoryScores,
            strengths: generated.strengths,
            areasForImprovement: generated.areasForImprovement,
            completedAt: new Date().toISOString(),
          };

          // Check if this interview is already saved
          const existingIndex = completedInterviews.findIndex(
            (i: any) => i.id === interviewId
          );

          if (existingIndex >= 0) {
            completedInterviews[existingIndex] = interviewData;
          } else {
            completedInterviews.push(interviewData);
          }

          localStorage.setItem(
            "completedInterviews",
            JSON.stringify(completedInterviews)
          );

          // Trigger a custom storage event to notify dashboard (for same-tab updates)
          // The storage event only fires in other tabs, so we dispatch a custom event
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("storage"));
            // Also trigger a custom event
            window.dispatchEvent(new CustomEvent("interviewCompleted", {
              detail: { interviewId, interviewData }
            }));
          }

          // Show success message
          toast.success("Interview completed!", {
            description: `Your ${interviewRole} interview has been saved with feedback.`,
          });
          
          console.log("Interview saved:", interviewData);
        } catch (e) {
          console.error("Error saving interview:", e);
        }
      }

      // Navigate to dashboard after interview completes
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000); // Give time for feedback to complete
    } catch (error: any) {
      console.error("Error ending call:", error);
    }
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar relative">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className={cn(
                "object-cover transition-all duration-300",
                isSpeaking && "ring-4 ring-primary-200 ring-opacity-75 scale-105"
              )}
            />
            {isSpeaking && (
              <>
                <span className="animate-speak" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-200 rounded-full animate-pulse border-2 border-dark-400" />
              </>
            )}
          </div>
          <h3>AI Interviewer</h3>
          {isSpeaking && (
            <p className="text-xs text-primary-200 mt-1 font-semibold animate-pulse">
              ● Speaking
            </p>
          )}
          {!isSpeaking && !isListening && (
            <p className="text-xs text-gray-400 mt-1">Ready</p>
          )}
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <div className="relative">
              {userPhoto ? (
                // Uploaded photos are base64 data URLs, which next/image's
                // optimizer doesn't handle - use a plain <img> for those.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userPhoto}
                  alt="profile-image"
                  className={cn(
                    "rounded-full object-cover size-[120px] transition-all duration-300",
                    isListening && "ring-2 ring-primary-300 ring-opacity-50 opacity-70"
                  )}
                />
              ) : (
                <Image
                  src="/user-avatar.png"
                  alt="profile-image"
                  width={539}
                  height={539}
                  className={cn(
                    "rounded-full object-cover size-[120px] transition-all duration-300",
                    isListening && "ring-2 ring-primary-300 ring-opacity-50 opacity-70"
                  )}
                />
              )}
              {isListening && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-300 rounded-full animate-pulse border-2 border-dark-500 opacity-60" />
              )}
            </div>
            <h3 className={cn(isListening && "opacity-70")}>{userName}</h3>
            {isListening && (
              <p className="text-xs text-primary-300 mt-1 opacity-60">
                Speaking...
              </p>
            )}
            {!isListening && !isSpeaking && (
              <p className="text-xs text-gray-400 mt-1">Ready</p>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-yellow-950/40 border border-yellow-500 rounded-lg">
          <p className="text-yellow-200 text-sm mb-2">{error}</p>
          {error.includes("Vapi web token") && (
            <div className="text-xs text-yellow-300">
              <p className="mb-1">To fix this:</p>
              <ol className="list-decimal list-inside ml-4">
                <li>Get your Vapi web token from <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="underline">https://dashboard.vapi.ai</a></li>
                <li>Create/update <code className="font-mono bg-yellow-800/50 px-1 rounded">.env.local</code> in your project root</li>
                <li>Add: <code className="font-mono bg-yellow-800/50 px-1 rounded">NEXT_PUBLIC_VAPI_WEB_TOKEN=your_token_here</code></li>
                <li>Restart your Next.js server</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Transcript Display - Ticker Style (Single Message) */}
      <div className="transcript-border mt-6">
        <div className="transcript min-h-[80px] flex items-center justify-center overflow-hidden">
          {transcript.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              {callStatus === CallStatus.ACTIVE
                ? "Conversation will appear here..."
                : "Press Call to start the interview"}
            </p>
          ) : currentMessageRef.current ? (
            <div
              className={cn(
                "w-full p-4 rounded-lg transition-all duration-300 border-l-4",
                currentMessageRef.current.speaker === "ai"
                  ? "bg-dark-400 border-primary-200"
                  : "bg-dark-500 border-primary-300"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    currentMessageRef.current.speaker === "user"
                      ? "bg-primary-300 text-black"
                      : "bg-primary-200 text-black"
                  )}
                >
                  {currentMessageRef.current.speaker === "user" ? "YOU" : "AI INTERVIEWER"}
                </div>
                <span className="text-xs text-gray-500">
                  {currentMessageRef.current.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-base font-medium flex-1",
                    currentMessageRef.current.speaker === "ai" ? "text-gray-200" : "text-gray-100"
                  )}
                >
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-1 h-5 bg-primary-200 ml-1 animate-pulse" />
                  )}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="w-full flex justify-center mt-6">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            onClick={() => handleCall()}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />
            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button
            className="btn-disconnect"
            onClick={() => handleDisconnect()}
          >
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
