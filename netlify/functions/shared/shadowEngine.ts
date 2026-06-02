import { GoogleGenAI, Type } from "@google/genai";

export interface ShadowAnalysis {
  lead_score: number;
  intent_category: string;
  revenue_estimate: number;
  ai_summary: string;
}

/**
 * Evaluates lead data using Gemini 3.5-flash in background (Shadow Mode).
 * Returns estimated metrics for pipeline performance analysis without modifying any existing fields.
 */
export async function enrichLeadWithShadowAI(leadData: any): Promise<ShadowAnalysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[SHADOW MODE WARNING] GEMINI_API_KEY environment variable is not set. Skipping shadow enrichment.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Clean and normalize input formats for safe printing
    const name = leadData.name || leadData.customer_name || 'Anonymous';
    const phone = leadData.phone || leadData.customer_phone || '';
    const email = leadData.email || '';
    const city = leadData.city || '';
    const zipCode = leadData.zip_code || '';
    const serviceType = leadData.service_type || leadData.service_requested || 'Regular';
    const bedrooms = (leadData.bedrooms !== undefined && leadData.bedrooms !== null) ? String(leadData.bedrooms) : 'Not specified';
    const bathrooms = (leadData.bathrooms !== undefined && leadData.bathrooms !== null) ? String(leadData.bathrooms) : 'Not specified';
    const preferredDate = leadData.preferred_date || '';
    const preferredTime = leadData.preferred_time || '';
    const message = leadData.message || leadData.customer_message || '';
    const propertyType = leadData.property_type || '';
    const address = leadData.address || '';
    const estimateOption = leadData.estimate_option || '';
    const estimatedPrice = leadData.estimated_price || '';
    const smsHistory = leadData.sms_history || '';
    const conversationSummary = leadData.conversation_summary || '';

    const payloadText = `
=== Lead Payload for Analysis ===
- Name: ${name}
- Phone: ${phone}
- Email: ${email}
- City: ${city}
- Zip Code: ${zipCode}
- Service Type: ${serviceType}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Schedule Preference: ${preferredDate} at ${preferredTime}
- Address: ${address}
- Property Type: ${propertyType}
- Estimate Option: ${estimateOption}
- Pricing Config: ${estimatedPrice}
- Message / Details: ${message}
- Chat Conversation Summary: ${conversationSummary}
- Connected SMSText History: ${smsHistory}
================================
`;

    console.log(`[SHADOW MODE] Dispatching analysis for phone: ${phone}...`);

    const systemInstruction = `
You are the silent strategic background intellect of the Dany Clean Pro ecosystem.
Your exact objective is to evaluate interest level, operational viability, and pricing estimate in background (shadow mode) for inbound leads.

Perform these four calculations based on the payload details provided:
1. Lead Score (integer between 0 and 100):
   - High score (75-100): Customer in Connecticut counties (Fairfield or New Haven), has phone and name, clear cleaning intent, highly motivated to schedule.
   - Medium score (40-74): Clean intent but missing details (such as city or size) or asking general pricing questions.
   - Low score (0-39): Incomplete contact details, spam test, questions, or outside service area.
2. Intent Category (string): Must map to EXACTLY one of these options:
   - "Regular Clean"
   - "Deep Clean"
   - "Move-In/Out"
   - "Commercial"
   - "Airbnb"
   - "Questions"
   - "Invalid"
3. Revenue Estimate (fractional number, USD):
   - Estimate based on bedroom/bathroom and service type if no explicit price exists.
   - Basic Regular Clean: 1-2 Bed: $120-$160. 3+ Bed: $180-$250.
   - Deep Clean / Move-In: 1-2 Bed: $180-$260. 3+ Bed: $280-$450.
   - If size or layout is unknown, output safe median $180.
   - If spam, invalid, or simple off-topic/non-cleaning question, output 0.
4. AI Summary (string, single-line professional summary):
   - Provide a highly concise 1-2 sentence summary of customer intent, location/layout, and schedule urgency.
   - Match the language of the summary to the customer's input message language (Portuguese, English, or Spanish). If undefined, default to Portuguese. No formatting symbols or asterisks.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please run shadow mode enrichment on this lead's state:\n${payloadText}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lead_score: {
              type: Type.INTEGER,
              description: "Qualification score out of 100 evaluating interest and completeness."
            },
            intent_category: {
              type: Type.STRING,
              description: "A category string matching exactly: 'Regular Clean', 'Deep Clean', 'Move-In/Out', 'Commercial', 'Airbnb', 'Questions', or 'Invalid'."
            },
            revenue_estimate: {
              type: Type.NUMBER,
              description: "Revenue estimate for this individual lead appointment in USD (e.g. 195.50)."
            },
            ai_summary: {
              type: Type.STRING,
              description: "A concise 1-2 sentence summary of intent, layout, and urgency in the matching language."
            }
          },
          required: ["lead_score", "intent_category", "revenue_estimate", "ai_summary"]
        }
      }
    });

    const textResult = response.text?.trim() || "";
    if (!textResult) {
      throw new Error("Received empty text response from Gemini API");
    }

    const data = JSON.parse(textResult);

    // Guard rail checking to ensure safe schemas
    const validCategories = ["Regular Clean", "Deep Clean", "Move-In/Out", "Commercial", "Airbnb", "Questions", "Invalid"];
    const matchedCategory = validCategories.includes(data.intent_category) ? data.intent_category : "Regular Clean";

    const cleanResult: ShadowAnalysis = {
      lead_score: Math.min(100, Math.max(0, Number(data.lead_score) || 0)),
      intent_category: matchedCategory,
      revenue_estimate: Math.max(0, Number(data.revenue_estimate) || 0),
      ai_summary: String(data.ai_summary || '').replace(/[\n\r]+/g, ' ').trim()
    };

    console.log(`[SHADOW MODE DONE] Results for phone ${phone}:`, {
      score: cleanResult.lead_score,
      intent: cleanResult.intent_category,
      revenue: cleanResult.revenue_estimate
    });

    return cleanResult;

  } catch (error) {
    console.error("[SHADOW MODE EXCEPTION] Failed to run shadow analyzer on lead:", error);
    return null;
  }
}
