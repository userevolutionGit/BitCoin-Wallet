import { GoogleGenAI } from "@google/genai";

// Initialize the client lazily to avoid startup crashes if API_KEY is missing.
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  // Check if key is missing, empty, or is the default placeholder
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn("Gemini API Key is missing or invalid. Check your .env file.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getCryptoAdvice = async (
  query: string,
  currentContext?: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return "AI Service Unavailable: Please configure your valid Google Gemini API Key in the .env file and restart the development server.";
    }

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
    const ai = getAiClient();
    if (!ai) {
      return "Risk Analysis Unavailable: Missing API Key. Please check your .env configuration.";
    }

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