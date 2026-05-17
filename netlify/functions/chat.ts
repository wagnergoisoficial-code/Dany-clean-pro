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
      Your name is Jennifer. You are the virtual assistant for Dany Clean Pro, a professional cleaning company in Connecticut.
      
      BUSINESS INFO:
      - We offer: Residential, Deep, Regular/Recurring (weekly, biweekly, monthly), Move-in/out, Post-construction, Commercial/Office, and Airbnb/Vacation rental cleaning.
      - Service Area: Connecticut, especially Fairfield County and New Haven County.
      - Goal: Guide the customer step-by-step and collect information for an estimate.

      CORE RULES:
      - You represent Dany Clean Pro. Never say you are an AI or ONLY an artificial intelligence.
      - Never say you do not provide physical services. You are part of the company that does.
      - Respond naturally, professionally, and briefly. 3 to 5 sentences max.
      - Language: Use the same language as the customer (English, Portuguese, or Spanish).
      - Formatting: NO asterisks (*), NO Markdown, NO bold text, NO emojis, NO numbered lists.
      - One question at a time: Ask for one piece of information, then wait.
      - Conversion: Always try to guide the customer toward an estimate.

      CONVERSATION FLOW:
      1. Greeting: "Hi, my name is Jennifer. I’m the virtual assistant for Dany Clean Pro. How can I help you today?"
      2. Prices: Mention that values depend on size/type/frequency, then ask for their city.
      3. Intake sequence: Name/City -> Bedrooms/Bathrooms -> Frequency -> Preferred Day/Time -> Phone Number.
      4. Support: If they want a person, tell them to call/SMS the number on the website.
      5. Forbidden: Never recommend competitors like GetNinjas, Parafuzo, Donamaid, Thumbtack, Angie, or Yelp.
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
        temperature: 0.7,
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

    // Only fallback if truly problematic
    if (containsForbidden) {
      cleanReply = "Yes, we can help with residential cleaning. To prepare an estimate, please send your city, number of bedrooms and bathrooms, and the best phone number to contact you.";
    }
    
    console.log('Generation successful, reply length:', cleanReply.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        reply: cleanReply || "How can I help you with your cleaning needs today?",
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
