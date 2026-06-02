import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { enrichLeadWithShadowAI } from './shared/shadowEngine';

// Initialize Firebase Admin outside the handler for reuse
const initializeAdmin = () => {
  if (admin.apps.length) return true;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || "";

    console.log('--- chat-lead: initializing admin ---');
    console.log('has FIREBASE_PROJECT_ID:', !!projectId);
    console.log('has FIREBASE_CLIENT_EMAIL:', !!clientEmail);
    console.log('has FIREBASE_PRIVATE_KEY:', !!rawPrivateKey);

    if (!projectId || !clientEmail || !rawPrivateKey) {
      console.warn('Firebase Admin credentials missing from environment');
      return false;
    }

    // Normalize private key: handle escaped newlines, wrapping quotes, spaces, and trailing commas
    const privateKey = rawPrivateKey
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/,$/, "")
      .replace(/\\n/g, "\n");

    console.log('private key starts with BEGIN PRIVATE KEY:', privateKey.includes('BEGIN PRIVATE KEY'));
    console.log('private key ends with END PRIVATE KEY:', privateKey.includes('END PRIVATE KEY'));
    console.log('Private Key length after normalization:', privateKey.length);

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully: true');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return false;
  }
};

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  console.log('--- chat-lead: invoked ---');

  try {
    const isInitialized = initializeAdmin();
    if (!isInitialized) {
      throw new Error('Firebase Admin failed to initialize or credentials missing');
    }

    const body = JSON.parse(event.body || '{}');
    const { chatSessionId, name, phone, city, serviceInterest, initialMessage } = body;
    console.log('Payload received:', { chatSessionId, name, phone });

    // Server-side validation
    if (!chatSessionId || !name || !phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: chatSessionId, name, and phone' }),
      };
    }

    // Phone normalization and validation
    const normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.length < 10) {
      console.log('Validation failed: phone too short', normalizedPhone);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid phone number. Must have at least 10 digits.' }),
      };
    }

    // String length limits
    if (name.length > 100 || city?.length > 100 || serviceInterest?.length > 200 || initialMessage?.length > 500) {
      console.log('Validation failed: field too long');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'One or more fields exceed maximum length' }),
      };
    }

    console.log('Normalized phone:', normalizedPhone);

    const db = admin.firestore();
    const leadsRef = db.collection('leads');

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    console.log('Starting duplicate check...');
    // Duplicate prevention: Use a simpler query to avoid requiring composite indexes
    const duplicateQuery = await leadsRef
      .where('phone', '==', phone)
      .where('status', '==', 'new')
      .limit(5)
      .get();

    console.log('Duplicate check query finished, results count:', duplicateQuery.docs.length);

    const isDuplicate = duplicateQuery.docs.some(doc => {
      const data = doc.data();
      const created = data.createdAt?.toDate() || new Date(0);
      return data.source === 'AI Chat (Jennifer)' && created >= oneDayAgo;
    });

    if (isDuplicate) {
      const doc = duplicateQuery.docs.find(d => d.data().source === 'AI Chat (Jennifer)');
      console.log('Duplicate AI lead detected for phone:', phone);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          leadId: doc?.id, 
          duplicate: true 
        }),
      };
    }

    console.log('No duplicate found, creating new lead...');

    // Shadow Mode background analysis silently
    let shadowData: any = {};
    try {
      const payloadForEnrichment = {
        name,
        phone,
        city: city || "",
        service_type: serviceInterest || "AI Chat Lead",
        message: initialMessage || ""
      };
      const analysis = await enrichLeadWithShadowAI(payloadForEnrichment);
      if (analysis) {
        shadowData = {
          lead_score: analysis.lead_score,
          intent_category: analysis.intent_category,
          revenue_estimate: analysis.revenue_estimate,
          ai_summary: analysis.ai_summary
        };
        console.log("[SHADOW MODE CHAT-LEAD SUCCESS] Enrichment retrieved silently:", analysis);
      }
    } catch (enrichErr) {
      console.error("[SHADOW MODE CHAT-LEAD EXCEPTION] Failed to enrich lead silently:", enrichErr);
    }

    // Create the lead
    const newLead = {
      name,
      phone,
      city: city || '',
      service_type: serviceInterest || 'AI Chat Lead',
      message: initialMessage || '',
      chatSessionId,
      source: 'AI Chat (Jennifer)',
      status: 'new',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...shadowData
    };

    const docRef = await leadsRef.add(newLead);
    console.log('Lead created in Firestore, ID:', docRef.id);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        leadId: docRef.id,
        duplicate: false
      }),
    };

  } catch (error) {
    console.error('Error in chat-lead function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
