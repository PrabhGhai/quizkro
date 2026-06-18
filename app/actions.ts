'use server';

export async function getQuizFromGemini(topic: string, askedQuestions: string[]) {
  try {
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

    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
      throw new Error("API Key is missing from environment variables.");
    }
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini Server Error');
    }

    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Server Action Exception:", error);
    throw error;
  }
}