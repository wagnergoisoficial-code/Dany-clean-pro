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
    const body = JSON.parse(event.body || '{}');
    const userMessage = body.message || body.prompt;

    if (!userMessage) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'AI assistant is currently in maintenance mode.',
          details: 'API configuration missing'
        }),
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemContext = `
      Your name is Dany Assistant. You represent Dany Clean Pro, a family-owned cleaning company in Connecticut.
      
      CORE INSTRUCTIONS:
      - You are a professional customer service attendant.
      - Respond in natural, polite, and simple language.
      - NO asterisks (*), NO Markdown, NO symbol lists, NO bold text, NO emojis.
      - Keep answers short: 3 to 5 sentences maximum.
      - Always try to guide the customer toward requesting a quote.
      - Try to collect: name, phone, city, type of cleaning (residential, deep, regular, move-in/out, post-construction, airbnb), number of bedrooms and bathrooms, and preferred day/time.
      - NO FIXED PRICES. Explain that values depend on house size, type of cleaning, and frequency.
      - Service Area: Connecticut, specifically Fairfield County and New Haven County.
      - If they want to speak to a person, tell them to call or SMS the phone number on the website.
      - Do not mention being an AI, Gemini, or technology unless directly asked.
      - Never discuss politics, religion, or medical/legal topics.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemContext,
        temperature: 0.5,
      },
    });

    // Clean up response to ensure no unwanted formatting remains
    let cleanReply = (response.text || "").replace(/[*_#]/g, '').trim();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: cleanReply || "I'm sorry, I couldn't process that right now. How else can I help?" }),
    };
  } catch (error) {
    console.error('Chat function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Sorry, I\'m having trouble processing your request right now.',
        details: error instanceof Error ? error.message : String(error)
      }),
    };
  }
};
