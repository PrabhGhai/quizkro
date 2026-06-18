'use server';

// Helper function to force execution to pause
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getQuizFromGemini(topic: string, askedQuestions: string[], retries = 3) {
  try {
    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
      console.error("PRODUCTION CRITICAL ERROR: GEMINI_API_KEY is missing on this host environment.");
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

    // Execute the network pipeline inside a loop for resilient error mitigation
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
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
          const errorMessage = data.error?.message || "";
          
          // If Google says high demand or rate limit, catch it and try again!
          if ((response.status === 429 || response.status === 503 || errorMessage.includes("high demand")) && attempt < retries) {
            console.warn(`Gemini busy (Attempt ${attempt}/${retries}). Retrying in 1.5 seconds...`);
            await delay(1500 * attempt); // Wait longer on each successive attempt
            continue; 
          }
          
          console.error("Gemini Endpoint Rejected Payload:", data);
          return { error: data.error?.message || "Google Gemini API error occurred." };
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          console.error("Malformed Response Structure from Gemini:", data);
          return { error: "Invalid payload response structurally returned by AI." };
        }

        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);
        return parsedData;

      } catch (innerError) {
        // If it's a network drop or timeout, try again
        if (attempt === retries) throw innerError;
        await delay(1500 * attempt);
      }
    }

  } catch (error: any) {
    console.error("CRITICAL BACKEND EXCEPTION ENCOUNTERED:", error);
    return { error: "The AI engine is currently overloaded. Please wait a moment and tap Generate again!" };
  }
}