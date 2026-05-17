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
      - We offer: Residential, Deep, Regular/Recurring, Move-in/out, Post-construction, Commercial, and Airbnb cleaning.
      - Service Area: Connecticut (specifically Fairfield and New Haven counties).
      - Pricing: Never invent prices. Explain they depend on home size, type of cleaning, and frequency.
      
      CONVERSATION GOAL:
      - Be human, friendly, and brief (3-5 sentences).
      - Do not use asterisks, Markdown, emojis, or numbered lists.
      - Answer in the SAME LANGUAGE as the user (English, Portuguese, or Spanish).
      - Collect lead data STEP BY STEP: Name/City (Step 1), then Bedrooms/Bathrooms (Step 2), then Frequency (Step 3), then Day/Time (Step 4), then Phone Number (Step 5).
      - ONLY ASK ONE QUESTION AT A TIME.
      - If the user already provided info in the history, do not ask for it again. Move to the next step.
      - If they ask for price, explain the pricing logic and ask for the city to start the estimate.
      
      RESTRICTIONS:
      - Never say you are an AI or virtual assistant that doesn't provide physical services.
      - Never recommend competitors like GetNinjas, Parafuzo, Thumbtack, Angie, or Yelp.
      - Never give cleaning tips/how-to guides.
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
