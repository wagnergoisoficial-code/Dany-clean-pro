import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

export const handler: Handler = async (event) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const body = JSON.parse(event.body || '{}');
    const userMessage = body.message || body.prompt;
    const history = body.history || [];
    const MODEL_NAME = "gemini-3-flash-preview";

    console.log('--- Chat Function Audit ---');
    console.log('Using model:', MODEL_NAME);
    console.log('History length:', history.length);

    if (!userMessage) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'AI assistant is currently in maintenance mode.',
          details: 'API configuration missing on server'
        }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are Jennifer, the official virtual attendant for Dany Clean Pro. 
      You are a human receptionist, not an AI. 
      Speak on behalf of Dany Clean Pro, a real cleaning company in Connecticut.
      
      BUSINESS INFO:
      - We offer: Residential, Deep, Regular, Recurring, Move-in/out, Post-construction, Commercial, and Airbnb cleaning.
      - Service Area: Connecticut (specifically Fairfield and New Haven counties).
      
      CONVERSATION FLOW (Ask ONLY ONE question at a time):
      1. Name & Phone: If not known, ask "May I have your name and the best phone number to contact you?"
      2. City: Once name and phone are known, ask which city in Connecticut the home is located in.
      3. Home Size: Ask for the number of bedrooms and bathrooms.
      4. Frequency: Ask if they need one-time, weekly, biweekly, or monthly service.
      5. Schedule: Ask for their preferred day and time.
      
      RULES:
      - Be human, brief, and professional (2-4 short sentences).
      - NO asterisks, Markdown, emojis, or numbered lists.
      - Answer in the SAME LANGUAGE as the user (English, Portuguese, or Spanish).
      - DO NOT give cleaning tips, DIY instructions, or product advice.
      - DO NOT mention or recommend competitors (GetNinjas, Thumbtack, Angie, Yelp, etc.).
      - DO NOT invent or quote specific prices. Explain that pricing depends on the size and condition of the home.
      - If the user asks for cleaning, treat it as a service request and move to the next intake step.
      - Check chat history first. If we have the information, move to the NEXT missing detail.
      - NEVER say you are an AI. Never say you do not provide physical services.
    `;

    // Map history to Gemini format
    const contents = history.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const result = await (ai as any).models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    const responseText = result.text || "";
    let cleanReply = responseText.replace(/[*_#]/g, '').trim();

    // Safety filter for forbidden phrases or generic AI identity
    const forbiddenPhrases = [
      "artificial intelligence",
      "I am an AI",
      "do not provide physical services",
      "cannot provide physical services",
      "look for another professional",
      "GetNinjas", "Parafuzo", "Donamaid", "Thumbtack", "Angie", "Yelp"
    ];

    const containsForbidden = forbiddenPhrases.some(phrase => 
      cleanReply.toLowerCase().includes(phrase.toLowerCase())
    );

    if (containsForbidden || cleanReply.length < 5) {
      cleanReply = "Yes, we can help with your cleaning. To prepare an estimate, may I have your name and the city where the home is located?";
    }
    
    console.log('Result extracted successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        reply: cleanReply,
        text: cleanReply 
      }),
    };
  } catch (error) {
    console.error('Chat function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Sorry, I\'m having trouble processing your request right now.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
