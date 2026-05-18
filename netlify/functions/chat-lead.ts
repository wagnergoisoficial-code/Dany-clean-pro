import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

// Initialize Firebase Admin outside the handler for reuse
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('Firebase Admin credentials missing from environment');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

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

  try {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin not initialized');
    }

    const body = JSON.parse(event.body || '{}');
    const { chatSessionId, name, phone, city, serviceInterest, initialMessage } = body;

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
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid phone number. Must have at least 10 digits.' }),
      };
    }

    // String length limits
    if (name.length > 100 || city?.length > 100 || serviceInterest?.length > 200 || initialMessage?.length > 500) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'One or more fields exceed maximum length' }),
      };
    }

    const db = admin.firestore();
    const leadsRef = db.collection('leads');

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Duplicate prevention: Use a simpler query to avoid requiring composite indexes
    const duplicateQuery = await leadsRef
      .where('phone', '==', phone)
      .where('status', '==', 'new')
      .limit(5) // Get a few to check locally if needed
      .get();

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
    };

    const docRef = await leadsRef.add(newLead);

    console.log('Partial AI lead created successfully:', docRef.id);

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
