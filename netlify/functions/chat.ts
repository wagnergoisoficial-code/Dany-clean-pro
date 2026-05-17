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
    
    console.log('Using model:', MODEL_NAME);

    const systemContext = `
      You are Dany Assistant, the official virtual attendant for Dany Clean Pro. 
      You speak on behalf of Dany Clean Pro.
      You represent a real residential cleaning company in Connecticut.
      
      CORE RULES:
      - Never say you are an artificial intelligence or only an AI.
      - Never say you do not provide physical services. You represent the company that provides them.
      - Never answer as a generic AI assistant.
      - Never recommend competitors or external apps like GetNinjas, Parafuzo, Donamaid, Thumbtack, Angie, or Yelp.
      - Never give generic cleaning tips when the customer wants to hire a service.
      - Goal: Help the customer request an estimate.
      - Tone: Professional, friendly, objective, and human.
      - Language: Natural, polite, simple.
      - Formatting: NO asterisks (*), NO Markdown, NO symbol lists, NO bold text, NO emojis.
      - Length: 3 to 5 short sentences maximum.
      - NO FIXED PRICES: Explain that values depend on house size, type of cleaning, and frequency.
      - Service Area: Connecticut (specifically Fairfield County and New Haven County).
      
      DATA COLLECTION:
      Always try to guide the customer to provide: name, phone, city, cleaning type, number of bedrooms/bathrooms, and preferred day/time.
      
      If someone wants to talk to a person, tell them to call or SMS the phone number on the website.
    `;

    // Using the official structure for @google/genai SDK
    const response = await (ai as any).models.generateContent({
      model: MODEL_NAME,
      systemInstruction: systemContext,
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 250,
      },
    });

    // Extracting text from @google/genai response structure
    let replyText = "";
    if (response && response.text) {
      replyText = response.text;
    } else if (response && response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      replyText = response.candidates[0].content.parts[0].text;
    }

    // Clean up response to ensure no unwanted formatting remains
    let cleanReply = replyText.replace(/[*_#]/g, '').trim();

    // Safety filter for forbidden phrases or generic AI identity
    const forbiddenPhrases = [
      "artificial intelligence",
      "do not provide physical services",
      "cannot provide physical services",
      "look for another professional",
      "GetNinjas", "Parafuzo", "Donamaid", "Thumbtack", "Angie", "Yelp"
    ];

    const containsForbidden = forbiddenPhrases.some(phrase => 
      cleanReply.toLowerCase().includes(phrase.toLowerCase())
    );

    if (containsForbidden || cleanReply.length < 5) {
      cleanReply = "Yes, we can help with residential cleaning. To prepare an estimate, please send your city, number of bedrooms and bathrooms, and the best phone number to contact you.";
    }
    
    console.log('Generation successful, reply length:', cleanReply.length);

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
