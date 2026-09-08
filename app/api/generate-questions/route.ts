import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, type, techstack, amount } = body;

    if (!role || !level || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Generative AI API key is not configured" },
        { status: 500 }
      );
    }

    const prompt = `Prepare questions for a job interview.
The job role is ${role}.
The job experience level is ${level}.
The tech stack used in the job is: ${techstack.join(", ")}.
The focus between behavioural and technical questions should lean towards: ${type}.
The amount of questions required is: ${amount}.
Please return only the questions, without any additional text.
The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
Return the questions formatted like this:
["Question 1", "Question 2", "Question 3"]

Thank you!`;

    const { text: generatedText } = await generateText({
      model: google("gemini-pro"),
      prompt: prompt,
    });

    // Parse questions from response
    let parsedQuestions: string[] = [];
    try {
      // Try to parse as JSON array
      parsedQuestions = JSON.parse(generatedText.trim());
    } catch {
      // If not JSON, try to extract questions from text
      const questionMatches = generatedText.match(/\d+\.\s*"([^"]+)"/g);
      if (questionMatches) {
        parsedQuestions = questionMatches.map((match) =>
          match.replace(/\d+\.\s*"/, "").replace(/"$/, "")
        );
      } else {
        // Fallback: split by newlines and clean up
        parsedQuestions = generatedText
          .split("\n")
          .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
          .filter((line: string) => line.length > 0)
          .slice(0, amount);
      }
    }

    // Ensure we have questions
    if (parsedQuestions.length === 0) {
      // Fallback questions
      parsedQuestions = [
        `Can you tell me about yourself and your experience with ${role}?`,
        `What are the key skills required for a ${level} ${role}?`,
        `How do you approach problem-solving in your work?`,
        `Tell me about a challenging project you worked on`,
        `What interests you most about this role?`,
      ].slice(0, amount);
    }

    return NextResponse.json({ questions: parsedQuestions });
  } catch (error: any) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate questions" },
      { status: 500 }
    );
  }
}

