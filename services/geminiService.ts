
import { GoogleGenAI, Type } from "@google/genai";
import { ChatStep, LeadData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface BotResponse {
  text: string;
  options?: string[];
}

export async function getBotResponse(
  step: ChatStep,
  userMessage: string,
  leadData: LeadData
): Promise<BotResponse> {
  try {
    // Define instructions for each step to guide the AI
    const stepInstructions: Record<ChatStep, string> = {
      [ChatStep.WELCOME]: "Greet the user warmly to 'Smart LeadGen'. Briefly mention we build high-conversion chat landing pages that turn visitors into leads 3x faster. Ask a simple opening question to start the conversation, like 'Ready to boost your sales?'. Suggested options: 'Да, интересно', 'Как это работает?'",
      [ChatStep.BENEFITS]: "The user responded to the greeting. Explain 3 key benefits concisely: 24/7 automated sales, instant lead qualification, and seamless CRM integration. Emphasize how this increases conversion rates. Then ask: 'What niche is your business in?'. Suggested options: 'Недвижимость', 'Услуги', 'E-commerce', 'Другое'",
      [ChatStep.QUALIFICATION_NICHE]: `The user provided their niche: "${userMessage}". Acknowledge it briefly and professionally. Now ask: 'What is your approximate monthly advertising budget?'. Suggested options: 'До 30к ₽', '30к-100к ₽', 'Более 100к ₽'`,
      [ChatStep.QUALIFICATION_BUDGET]: `The user provided budget: "${userMessage}". Acknowledge it. Now ask: 'What are your main goals or plans for the next month?'. Suggested options: 'Получить больше лидов', 'Снизить стоимость лида', 'Автоматизация'`,
      [ChatStep.QUALIFICATION_PLANS]: `The user shared plans: "${userMessage}". Great. Now ask: 'What is your name?'.`,
      [ChatStep.NAME_COLLECTION]: `The user provided their name: "${userMessage}". Address them by name. Now ask: 'Please leave your phone number so our strategist can contact you with a tailored proposal.'`,
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

IMPORTANT: You must respond in JSON format with 'text' and 'options' fields.
'options' should contain 1-4 short, relevant quick reply buttons for the user based on the context.
`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userMessage,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["text"]
            }
          },
        });

        const responseText = response.text || '{"text": "Извините, я не смог сгенерировать ответ."}';
        return JSON.parse(responseText);
      } catch (error) {
        attempts++;
        console.error(`Gemini API Error (Attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts >= maxAttempts) {
          return { text: "Произошла ошибка при обращении к ИИ. Пожалуйста, попробуйте позже." };
        }
        
        // Wait before retrying (1s, 2s, etc.)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    
    return { text: "Произошла ошибка при обращении к ИИ. Пожалуйста, попробуйте позже." };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Произошла ошибка при обращении к ИИ. Пожалуйста, попробуйте позже." };
  }
}
