import { GoogleGenAI } from "@google/genai";

// Initialize the client.
// Note: In a production app, never expose keys on the client side. 
// This is for demonstration purposes within the specified environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCryptoAdvice = async (
  query: string,
  currentContext?: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const systemInstruction = `You are Zenith, an expert cryptocurrency AI advisor. 
    You provide concise, accurate, and helpful information about Bitcoin, blockchain technology, and market trends. 
    You always include a brief disclaimer that you are not a financial advisor.
    Keep answers under 150 words unless asked for a deep dive.
    Tone: Professional, confident, yet accessible.`;

    const prompt = currentContext 
      ? `Context: ${currentContext}\n\nUser Question: ${query}`
      : query;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the network right now. Please try again later.";
  }
};

export const analyzeTransactionRisk = async (address: string, amount: number): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Analyze the risk of sending ${amount} BTC to address ${address}. 
    Since this is a simulation, provide general safety tips for verifying Bitcoin addresses and avoiding common scams. 
    Do not actually analyze the blockchain. Return a bulleted list of 3 safety checks.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return response.text || "Unable to perform risk analysis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Risk analysis service unavailable.";
  }
};