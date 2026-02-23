
import { GoogleGenAI } from "@google/genai";
import { ChatStep, LeadData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getBotResponse(
  step: ChatStep,
  userMessage: string,
  leadData: LeadData
): Promise<string> {
  try {
    // Define instructions for each step to guide the AI
    const stepInstructions: Record<ChatStep, string> = {
      [ChatStep.WELCOME]: "Greet the user warmly to 'Smart LeadGen'. Briefly mention we build high-conversion chat landing pages. Ask a simple opening question to start the conversation, like 'Ready to boost your sales?'",
      [ChatStep.BENEFITS]: "The user responded to the greeting. Explain 3 key benefits concisely: 24/7 operation, instant lead qualification, and seamless CRM integration. Then ask: 'What niche is your business in?'",
      [ChatStep.QUALIFICATION_NICHE]: `The user provided their niche: "${userMessage}". Acknowledge it briefly and professionally. Now ask: 'What is your approximate monthly advertising budget?'`,
      [ChatStep.QUALIFICATION_BUDGET]: `The user provided budget: "${userMessage}". Acknowledge it. Now ask: 'What are your main goals or plans for the next month?'`,
      [ChatStep.QUALIFICATION_PLANS]: `The user shared plans: "${userMessage}". Great. Now ask: 'Please leave your phone number so our strategist can contact you with a tailored proposal.'`,
      [ChatStep.CONTACT_COLLECTION]: `The user provided phone: "${userMessage}". Thank them. Confirm that a manager will contact them shortly at this number.`,
      [ChatStep.COMPLETED]: "The conversation is over. Wish them a great day and say goodbye."
    };

    const specificInstruction = stepInstructions[step] || "Continue the conversation professionally.";

    const systemInstruction = `
You are a professional sales assistant for a "Smart LeadGen" agency.
Your goal is to qualify leads for a high-conversion chat landing page service.
Current conversation step: ${step}

Your specific task for this response:
${specificInstruction}

Keep responses concise, professional, and engaging. Use emojis sparingly but effectively.
Respond in Russian.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "Извините, я не смог сгенерировать ответ.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Произошла ошибка при обращении к ИИ. Пожалуйста, попробуйте позже.";
  }
}
