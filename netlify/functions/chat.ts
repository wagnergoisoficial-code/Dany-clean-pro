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

    console.log('--- Chat Function Debug ---');
    console.log('Has GEMINI_API_KEY:', !!apiKey);
    console.log('Message received:', !!userMessage);
    
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
    const MODEL_NAME = "gemini-3-flash-preview";
    
    console.log('--- Chat Function Audit ---');
    console.log('Using model:', MODEL_NAME);
    console.log('User message snippet:', userMessage.substring(0, 50));

    const businessContext = `
      You are Jennifer, the official virtual attendant for Dany Clean Pro.
      Speak on behalf of Dany Clean Pro, a real cleaning company in Connecticut.
      Never say you are only an AI or that you do not provide physical services.
      Never recommend competitors (GetNinjas, Thumbtack, Angie, etc.).
      Your goal is to guide the customer to request an estimate.
      
      RULES:
      - Answer briefly, naturally, and professionally (3-5 short sentences).
      - Do not use asterisks, Markdown, emojis, or numbered lists.
      - Do not invent prices. Say price depends on home size, type, and frequency.
      - Ask for city, bedrooms, bathrooms, and phone number for the estimate.
      - Ask ONLY ONE question at a time.
      - Language: Answer in the same language as the customer (English, Portuguese, or Spanish).

      CONVERSATION GUIDE:
      - If greeting, identify yourself as Jennifer from Dany Clean Pro.
      - If they need cleaning, ask for City/Name.
      - Then ask for Bedrooms/Bathrooms.
      - Then ask for Frequency.
      - Then ask for Day/Time.
      - Finally ask for a Phone Number.
    `;

    const finalPrompt = `${businessContext}\n\nCustomer message:\n${userMessage}`;

    // Use the simplified structure from server.ts which is known to work
    const result = await (ai as any).models.generateContent({
      model: MODEL_NAME,
      contents: finalPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250,
      }
    });

    // Handle extraction safely
    const responseText = result.text || "";
    
    // Clean up response to ensure no unwanted formatting remains
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
