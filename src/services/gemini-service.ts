import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI("apiKAIzaSyDrJpyokEvzWyqYLjDPL0lpjUWh1kk_aEYey");

export async function sendMessageToGemini(userPrompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // System instruction to keep the "Ancient Guide" persona
    const prompt = `You are the Ancient Guide in a Trial Dungeon. 
    Help the player with their journey. User says: ${userPrompt}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The stars are clouded... I cannot see the answer right now.";
  }
}