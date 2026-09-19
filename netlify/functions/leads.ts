import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { enrichLeadWithShadowAI } from './shared/shadowEngine';
import { sendLeadEmail } from './shared/leadEmail';

// Initialize Firebase Admin outside the handler for reuse
const initializeAdmin = () => {
  if (admin.apps.length) return true;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || "";

    console.log('--- api/leads: initializing admin ---');
    if (!projectId || !clientEmail || !rawPrivateKey) {
      console.warn('Firebase Admin credentials missing from environment');
      return false;
    }

    const privateKey = rawPrivateKey
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/,$/, "")
      .replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return false;
  }
};

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Handle GET /api/leads
  if (event.httpMethod === 'GET') {
    console.log('[GET] /api/leads - Status check');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "API leads endpoint is active"
      }),
    };
  }

  // Limit only to POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  console.log('--- api/leads (POST): invoked ---');

  try {
    const isInitialized = initializeAdmin();
    if (!isInitialized) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Firebase Admin failed to initialize or credentials missing. Check your Netlify environment variables.'
        }),
      };
    }

    const rawBody = JSON.parse(event.body || '{}');
    console.log('Received raw payload:', JSON.stringify(rawBody));

    const sanitize = (val: any): string => {
      if (val === undefined || val === null) return "";
      return String(val)
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "") // strip script tags
        .replace(/<[^>]*>/g, "") // strip all HTML tags
        .trim();
    };

    // Helper to extract key in a highly lenient way (accent-insensitive, space-insensitive, underscore-insensitive)
    const getOptionalVal = (...keys: string[]): any => {
      for (const k of keys) {
        if (rawBody[k] !== undefined && rawBody[k] !== null) return rawBody[k];
        
        const cleanK = (str: string) => str.toLowerCase()
          .replace(/[-_\s]/g, '')
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
          
        const targetClean = cleanK(k);
        for (const [bodyKey, bodyVal] of Object.entries(rawBody)) {
          if (cleanK(bodyKey) === targetClean) {
            return bodyVal;
          }
        }
      }
      return undefined;
    };

    // Normalize fields, supporting both English and Portuguese (and auto-translated) dynamic keys
    const phone = sanitize(getOptionalVal(
      "phone", "customer_phone", "customer phone", "telefone", "telefone do cliente", "telefone_do_cliente", "ud", "u d", "id"
    ));
    
    // Fallback if the above didn't find anything, try looking for something with "phone" or "telefone" in it
    const phoneFallback = () => {
      if (phone) return phone;
      for (const [k, v] of Object.entries(rawBody)) {
        const lowerK = k.toLowerCase();
        if (lowerK.includes('phone') || lowerK.includes('telefone') || lowerK.includes('tel')) {
          return sanitize(v);
        }
      }
      return "";
    };
    const finalPhone = phone || phoneFallback();

    const name = sanitize(getOptionalVal(
      "name", "customer_name", "customer name", "nome", "nome do cliente", "nome_do_cliente"
    ) || "Anonymous");

    const email = sanitize(getOptionalVal(
      "email", "e-mail", "email_do_cliente"
    ));

    const city = sanitize(getOptionalVal(
      "city", "cidade"
    ));

    const zip_code = sanitize(getOptionalVal(
      "zip_code", "zip code", "zipcode", "cep"
    ));

    const service_type = sanitize(getOptionalVal(
      "service_type", "service type", "service_requested", "service requested", "servico", "tipo de servico", "tipo_de_servico", "tipo de serviço", "tipo_de_serviço"
    ) || "Regular");
    
    let bedroomsNum: number | null = null;
    const bedroomsVal = getOptionalVal("bedrooms", "quarto", "quartos");
    if (bedroomsVal !== undefined && bedroomsVal !== null && bedroomsVal !== "") {
      bedroomsNum = parseInt(bedroomsVal) || null;
    }

    let bathroomsNum: number | null = null;
    const bathroomsVal = getOptionalVal("bathrooms", "banheiro", "banheiros");
    if (bathroomsVal !== undefined && bathroomsVal !== null && bathroomsVal !== "") {
      bathroomsNum = parseInt(bathroomsVal) || null;
    }

    const preferred_date = sanitize(getOptionalVal(
      "preferred_date", "preferred date", "data_preferida", "data preferida", "data"
    ));

    const preferred_time = sanitize(getOptionalVal(
      "preferred_time", "preferred time", "horario_preferido", "horario preferido", "horario", "hora"
    ));

    const message = sanitize(getOptionalVal(
      "message", "customer_message", "customer message", "mensagem", "mensagem do cliente", "mensagem_do_cliente"
    ));
    
    const property_type = sanitize(getOptionalVal(
      "property_type", "property type", "tipo_de_propriedade", "tipo de propriedade"
    ));

    const address = sanitize(getOptionalVal(
      "address", "endereco", "endereço"
    ));

    const estimate_option = sanitize(getOptionalVal(
      "estimate_option", "estimate option", "opcao_de_estimativa", "opcao de estimativa"
    ));

    const estimated_price = sanitize(getOptionalVal(
      "estimated_price", "estimated price", "preco_estimado", "preço estimado", "preco"
    ));

    const ai_reply = sanitize(getOptionalVal(
      "ai_reply", "ai reply", "aireply", "resposta_da_ia", "resposta da ia"
    ));

    const lead_status = sanitize(getOptionalVal(
      "status", "lead_status", "lead status", "status de lideranca", "status de liderança"
    ) || "new");

    const conversation_summary = sanitize(getOptionalVal(
      "conversation_summary", "conversation summary", "resumo_da_conversa", "resumo da conversa"
    ));

    const sms_history = sanitize(getOptionalVal(
      "sms_history", "sms history", "historico_de_sms", "historico de sms"
    ));

    if (!finalPhone) {
      console.error("Validation error: phone remains missing. Received body keys:", Object.keys(rawBody));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Phone number is required' }),
      };
    }

    const db = admin.firestore();
    const leadsRef = db.collection('leads');

    console.log(`Searching Firestore for existing lead with phone: ${finalPhone}`);
    // Search for existing lead by phone number to support continuous conversations
    let existingLeadId: string | null = null;
    let existingData: any = null;

    // Do separate searches for 'phone' and 'customer_phone' to handle varied schema types
    const queryPhone = await leadsRef.where('phone', '==', finalPhone).limit(3).get();
    let foundDoc = queryPhone.docs[0];

    if (!foundDoc) {
      const queryCustomerPhone = await leadsRef.where('customer_phone', '==', finalPhone).limit(3).get();
      foundDoc = queryCustomerPhone.docs[0];
    }

    if (foundDoc) {
      existingLeadId = foundDoc.id;
      existingData = foundDoc.data();
      console.log(`↳ Found existing Firestore lead doc ID: ${existingLeadId}`);
    }

    if (existingLeadId && existingData) {
      // Build dynamic update payload (COALESCE/fallback behavior) to keep existing values if incoming is empty
      const updatePayload: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const updateIfNotEmpty = (field: string, newVal: any, fallbackVal: any) => {
        if (newVal !== undefined && newVal !== null && newVal !== "") {
          updatePayload[field] = newVal;
        } else if (fallbackVal !== undefined && fallbackVal !== null) {
          // Keep existing value
        }
      };

      updateIfNotEmpty('name', name, existingData.name);
      updateIfNotEmpty('customer_name', name, existingData.customer_name);
      updateIfNotEmpty('email', email, existingData.email);
      updateIfNotEmpty('city', city, existingData.city);
      updateIfNotEmpty('zip_code', zip_code, existingData.zip_code);
      updateIfNotEmpty('service_type', service_type, existingData.service_type);
      updateIfNotEmpty('service_requested', service_type, existingData.service_requested);
      
      if (bedroomsNum !== null) updatePayload.bedrooms = bedroomsNum;
      if (bathroomsNum !== null) updatePayload.bathrooms = bathroomsNum;

      updateIfNotEmpty('preferred_date', preferred_date, existingData.preferred_date);
      updateIfNotEmpty('preferred_time', preferred_time, existingData.preferred_time);
      updateIfNotEmpty('message', message, existingData.message);
      updateIfNotEmpty('customer_message', message, existingData.customer_message);
      updateIfNotEmpty('property_type', property_type, existingData.property_type);
      updateIfNotEmpty('address', address, existingData.address);
      updateIfNotEmpty('estimate_option', estimate_option, existingData.estimate_option);
      updateIfNotEmpty('estimated_price', estimated_price, existingData.estimated_price);
      updateIfNotEmpty('ai_reply', ai_reply, existingData.ai_reply);
      updateIfNotEmpty('status', lead_status, existingData.status);
      updateIfNotEmpty('lead_status', lead_status, existingData.lead_status);
      updateIfNotEmpty('conversation_summary', conversation_summary, existingData.conversation_summary);
      updateIfNotEmpty('sms_history', sms_history, existingData.sms_history);

      // Shadow Mode background analysis silently
      try {
        const payloadForEnrichment = {
          name: name || existingData.name || existingData.customer_name || '',
          email: email || existingData.email || '',
          phone: finalPhone,
          city: city || existingData.city || '',
          zip_code: zip_code || existingData.zip_code || '',
          service_type: service_type || existingData.service_type || existingData.service_requested || '',
          bedrooms: bedroomsNum !== null ? bedroomsNum : existingData.bedrooms,
          bathrooms: bathroomsNum !== null ? bathroomsNum : existingData.bathrooms,
          preferred_date: preferred_date || existingData.preferred_date || '',
          preferred_time: preferred_time || existingData.preferred_time || '',
          message: message || existingData.message || existingData.customer_message || '',
          property_type: property_type || existingData.property_type || '',
          address: address || existingData.address || '',
          estimate_option: estimate_option || existingData.estimate_option || '',
          estimated_price: estimated_price || existingData.estimated_price || '',
          conversation_summary: conversation_summary || existingData.conversation_summary || '',
          sms_history: sms_history || existingData.sms_history || ''
        };
        const analysis = await enrichLeadWithShadowAI(payloadForEnrichment);
        if (analysis) {
          updatePayload.lead_score = analysis.lead_score;
          updatePayload.intent_category = analysis.intent_category;
          updatePayload.revenue_estimate = analysis.revenue_estimate;
          updatePayload.ai_summary = analysis.ai_summary;
          console.log("[SHADOW MODE UPDATE SUCCESS] Enrichment data merged silently:", analysis);
        }
      } catch (enrichErr) {
        console.error("[SHADOW MODE UPDATE EXCEPTION] Failed to enrich lead silently:", enrichErr);
      }

      await leadsRef.doc(existingLeadId).update(updatePayload);
      console.log(`✓ Firestore lead updated successfully.`);

      // Mirror the CRM in the inbox; a mail failure must not fail the request.
      const notifyPayload = {
        name, phone: finalPhone, email, city, address, zip_code,
        service_type, bedrooms: bedroomsNum, bathrooms: bathroomsNum,
        preferred_date, preferred_time, message,
        source: sanitize(getOptionalVal('source')) || 'api',
      };
      await sendLeadEmail({ ...notifyPayload, leadId: existingLeadId });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          id: existingLeadId,
          updated: true,
          message: "Lead updated successfully"
        }),
      };
    } else {
      // Shadow Mode background analysis silently
      let shadowData: any = {};
      try {
        const payloadForEnrichment = {
          name, email, phone: finalPhone, city, zip_code, service_type, bedrooms: bedroomsNum, bathrooms: bathroomsNum,
          preferred_date, preferred_time, message, property_type, address, estimate_option, estimated_price,
          conversation_summary, sms_history
        };
        const analysis = await enrichLeadWithShadowAI(payloadForEnrichment);
        if (analysis) {
          shadowData = {
            lead_score: analysis.lead_score,
            intent_category: analysis.intent_category,
            revenue_estimate: analysis.revenue_estimate,
            ai_summary: analysis.ai_summary
          };
          console.log("[SHADOW MODE INSERT SUCCESS] Enrichment data retrieved silently:", analysis);
        }
      } catch (enrichErr) {
        console.error("[SHADOW MODE INSERT EXCEPTION] Failed to enrich lead silently:", enrichErr);
      }

      // Create new lead document
      const insertPayload = {
        name,
        customer_name: name,
        email: email || "",
        phone: finalPhone,
        customer_phone: finalPhone,
        city: city || "",
        zip_code: zip_code || "",
        service_type,
        service_requested: service_type,
        bedrooms: bedroomsNum,
        bathrooms: bathroomsNum,
        preferred_date: preferred_date || "",
        preferred_time: preferred_time || "",
        message: message || "",
        customer_message: message || "",
        property_type: property_type || "",
        address: address || "",
        estimate_option: estimate_option || "",
        estimated_price: estimated_price || "",
        ai_reply: ai_reply || "",
        status: lead_status,
        lead_status,
        conversation_summary: conversation_summary || "",
        sms_history: sms_history || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...shadowData
      };

      const docRef = await leadsRef.add(insertPayload);
      console.log(`✓ Created new Firestore lead doc ID: ${docRef.id}`);

      // Mirror the CRM in the inbox; a mail failure must not fail the request.
      const notifyPayload = {
        name, phone: finalPhone, email, city, address, zip_code,
        service_type, bedrooms: bedroomsNum, bathrooms: bathroomsNum,
        preferred_date, preferred_time, message,
        source: sanitize(getOptionalVal('source')) || 'api',
      };
      await sendLeadEmail({ ...notifyPayload, leadId: docRef.id });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          id: docRef.id,
          updated: false,
          message: "Lead processed successfully"
        }),
      };
    }

  } catch (error: any) {
    console.error('Error in leads netlify function handler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        details: error.message
      }),
    };
  }
};
