import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

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

    // Normalize fields, supporting both standard forms and incoming n8n/Twilio automation payloads
    const phone = sanitize(rawBody.customer_phone || rawBody.phone);
    const name = sanitize(rawBody.customer_name || rawBody.name || "Anonymous");
    const email = sanitize(rawBody.email);
    const city = sanitize(rawBody.city);
    const zip_code = sanitize(rawBody.zip_code);
    const service_type = sanitize(rawBody.service_requested || rawBody.service_type || "Regular");
    
    let bedroomsNum: number | null = null;
    if (rawBody.bedrooms !== undefined && rawBody.bedrooms !== null && rawBody.bedrooms !== "") {
      bedroomsNum = parseInt(rawBody.bedrooms) || null;
    }
    let bathroomsNum: number | null = null;
    if (rawBody.bathrooms !== undefined && rawBody.bathrooms !== null && rawBody.bathrooms !== "") {
      bathroomsNum = parseInt(rawBody.bathrooms) || null;
    }

    const preferred_date = sanitize(rawBody.preferred_date);
    const preferred_time = sanitize(rawBody.preferred_time);
    const message = sanitize(rawBody.customer_message || rawBody.message);
    
    const property_type = sanitize(rawBody.property_type);
    const address = sanitize(rawBody.address);
    const estimate_option = sanitize(rawBody.estimate_option);
    const estimated_price = sanitize(rawBody.estimated_price);
    const ai_reply = sanitize(rawBody.ai_reply);
    const lead_status = sanitize(rawBody.lead_status || rawBody.status || "new");
    const conversation_summary = sanitize(rawBody.conversation_summary);
    const sms_history = sanitize(rawBody.sms_history);

    if (!phone) {
      console.error("Validation error: customer_phone/phone is missing");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Phone number is required' }),
      };
    }

    const db = admin.firestore();
    const leadsRef = db.collection('leads');

    console.log(`Searching Firestore for existing lead with phone: ${phone}`);
    // Search for existing lead by phone number to support continuous conversations
    let existingLeadId: string | null = null;
    let existingData: any = null;

    // Do separate searches for 'phone' and 'customer_phone' to handle varied schema types
    const queryPhone = await leadsRef.where('phone', '==', phone).limit(3).get();
    let foundDoc = queryPhone.docs[0];

    if (!foundDoc) {
      const queryCustomerPhone = await leadsRef.where('customer_phone', '==', phone).limit(3).get();
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

      await leadsRef.doc(existingLeadId).update(updatePayload);
      console.log(`✓ Firestore lead updated successfully.`);

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
      // Create new lead document
      const insertPayload = {
        name,
        customer_name: name,
        email: email || "",
        phone,
        customer_phone: phone,
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
      };

      const docRef = await leadsRef.add(insertPayload);
      console.log(`✓ Created new Firestore lead doc ID: ${docRef.id}`);

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
