'use server';

export async function getQuizFromGemini(topic: string, askedQuestions: string[]) {
  try {
    const apiKey = process.env.GEMINI_API_KEY; 
    
    // 1. Instantly intercept a missing key before hitting the network pipeline
    if (!apiKey) {
      console.error("PRODUCTION CRITICAL ERROR: GEMINI_API_KEY environment variable is missing on this host environment.");
      return { error: "Configuration issue: Server API key is missing." };
    }
    
    if (!topic || topic.trim() === "") {
      return { error: "Topic string cannot be empty." };
    }

    const prompt = `You are a professional quiz master for an app called QuizKro. 
    Generate exactly 5 unique, highly accurate multiple-choice questions about the topic: "${topic}".
    
    CRITICAL STRUCTURE INSTRUCTIONS:
    1. Do NOT generate any of these previously asked questions to avoid repetition: ${JSON.stringify(askedQuestions)}.
    2. Provide the output strictly in English.
    3. Provide the output strictly in this raw valid JSON format containing an array under a "quiz" key (no markdown code blocks, no text before or after):
    {
      "quiz": [
        {
          "question": "Question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0,
          "reason": "Clear explanation of the answer"
        }
      ]
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      cache: 'no-store'
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini Endpoint Rejected Payload:", data);
      return { error: data.error?.message || "Google Gemini API error occurred." };
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      console.error("Malformed Response Structure from Gemini:", data);
      return { error: "Invalid payload response structurally returned by AI." };
    }

    // Clean markdown blocks safely on a single line
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    return parsedData;

  } catch (error: any) {
    console.error("CRITICAL BACKEND EXCEPTION ENCOUNTERED:", error);
    return { error: error?.message || "Internal App Execution Failure." };
  }
}