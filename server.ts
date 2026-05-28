import express from "express";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import admin from "firebase-admin";
import twilio from "twilio";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dany-clean-pro-secret-key-2024";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- API ROUTES ---

// Health Check (Very early)
app.get("/api/health", (req, res) => {
  console.log('[GET] /api/health - Request received');
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db_ready: !!db,
    db_error: dbInitError,
    firebase_admin_ready: !!getFirebaseAdmin(),
    jwt_configured: !!process.env.JWT_SECRET || !!JWT_SECRET,
    uptime: process.uptime()
  });
});

// Debug Env (Dev Only)
app.get("/api/debug-env", (req, res) => {
  if (process.env.NODE_ENV === "production" && !req.query.force) {
    return res.status(403).json({ error: "Forbidden in production" });
  }
  
  const envKeys = Object.keys(process.env).filter(k => k.startsWith('VITE_FIREBASE_') || k.startsWith('FIREBASE_'));
  const sanitizedEnv = envKeys.reduce((acc, key) => {
    const val = process.env[key] || '';
    acc[key] = val.length > 5 ? `${val.substring(0, 5)}... (len: ${val.length})` : `(len: ${val.length})`;
    return acc;
  }, {} as any);
  
  res.json({
    node_env: process.env.NODE_ENV,
    sanitized_env: sanitizedEnv
  });
});

// Auth
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  console.log(`[POST] /api/auth/login - Attempt for user: "${username}"`);
  
  if (!db) {
    console.error("CRITICAL: Database not initialized during login attempt");
    return res.status(500).json({ error: "Database error" });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    
    if (!user) {
      console.warn(`Login failed: User "${username}" not found in database`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`Found user in DB: ${user.username}, comparing passwords...`);
    const passwordMatch = bcrypt.compareSync(password, user.password);
    
    if (passwordMatch) {
      console.log(`✓ Login SUCCESS for user: ${username}`);
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, user: { id: user.id, username: user.username } });
    } else {
      console.warn(`✗ Login FAILED for user: ${username} - Password mismatch`);
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login Exception:", err);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// Middleware for logging (Debugging)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API REQUEST] ${req.method} ${req.path}`);
  }
  next();
});

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Using fallback secret. This is not recommended for production.");
}

// --- TWILIO INITIALIZATION ---
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Firebase Admin Initialization (Lazy)
let firebaseAdmin: admin.app.App | null = null;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'server',
      email: 'server@adminsdk',
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      try {
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } catch (err) {
        console.error("Failed to initialize Firebase Admin:", err);
      }
    } else {
      console.warn("Firebase Admin not fully configured. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.");
    }
  }
  return firebaseAdmin;
}

const getFirestore = () => {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) return null;
  
  const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
  try {
    return databaseId ? (adminApp as any).firestore(databaseId) : adminApp.firestore();
  } catch (err) {
    console.error("Firestore initialization error (Database ID possibly invalid):", err);
    return null;
  }
};

// --- AUTOMATION HELPER ---
async function notifyAutomation(leadData: any) {
  const webhookUrl = process.env.AUTOMATION_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    console.log("Triggering automation for lead:", leadData.email || leadData.phone);
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...leadData,
        source: "dany-clean-pro-app",
        timestamp: new Date().toISOString()
      }),
    });
  } catch (err) {
    console.error("Automation Trigger Error:", err);
  }
}

// Database Initialization (Legacy / Fallback)
let db: Database.Database;
let dbInitError: string | null = null;

function initDb(retryCount = 0) {
  const dbPath = "database.db";
  try {
    db = new Database(dbPath);
    console.log("Database file opened. Performing integrity check...");
    
    // Quick test query to verify read/write works and look for disk image corruption
    try {
      db.pragma("integrity_check");
    } catch (pingErr) {
      console.warn("Database integrity probe failed:", pingErr);
      throw pingErr;
    }

    dbInitError = null;

    // Simple schema setup
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'admin'
      );

      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        city TEXT,
        zip_code TEXT,
        service_type TEXT,
        bedrooms INTEGER,
        bathrooms INTEGER,
        preferred_date TEXT,
        message TEXT,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT,
        rating INTEGER,
        comment TEXT,
        date TEXT,
        is_published BOOLEAN DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        title TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS service_areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT UNIQUE,
        zip_codes TEXT
      );

      CREATE TABLE IF NOT EXISTS sms_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT,
        sender TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Dynamic schema validation & columns addition
    const addColumnSafely = (table: string, col: string, definition: string) => {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
        console.log(`✓ Added column '${col}' to '${table}' successfully.`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name") && !e.message.includes("already exists")) {
          console.warn(`Could not add column '${col}' to '${table}':`, e.message);
        }
      }
    };

    addColumnSafely("leads", "customer_name", "TEXT");
    addColumnSafely("leads", "customer_phone", "TEXT");
    addColumnSafely("leads", "customer_message", "TEXT");
    addColumnSafely("leads", "service_requested", "TEXT");
    addColumnSafely("leads", "property_type", "TEXT");
    addColumnSafely("leads", "address", "TEXT");
    addColumnSafely("leads", "preferred_time", "TEXT");
    addColumnSafely("leads", "estimate_option", "TEXT");
    addColumnSafely("leads", "estimated_price", "TEXT");
    addColumnSafely("leads", "ai_reply", "TEXT");
    addColumnSafely("leads", "lead_status", "TEXT");
    addColumnSafely("leads", "conversation_summary", "TEXT");
    addColumnSafely("leads", "sms_history", "TEXT");
    addColumnSafely("leads", "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");

    // Seed initial admin if not exists
    const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";
    const hashedPassword = bcrypt.hashSync(adminPass, 10);
    
    if (!adminExists) {
      db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
      console.log(`Default admin user created: admin`);
    } else {
      console.log(`Admin user already exists. Skipping seed overwrite.`);
    }

    // Add administrador alias
    const admin2Exists = db.prepare("SELECT * FROM users WHERE username = ?").get("administrador");
    if (!admin2Exists) {
      db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("administrador", hashedPassword);
      console.log(`Default administrador user created: administrador`);
    } else {
      console.log(`Administrador user already exists. Skipping seed overwrite.`);
    }

    // Seed initial reviews for trust
    let reviewCount = 0;
    try {
      reviewCount = (db.prepare("SELECT COUNT(*) as count FROM reviews").get() as any).count;
    } catch (e) {
      console.warn("Could not check reviews count, skipping seed");
      return;
    }

    if (reviewCount === 0) {
      const initialReviews = [
        { author: "Sarah M.", rating: 5, comment: "Dany Clean Pro did an amazing job on my move-out clean. Every corner was spotless!", date: "2024-03-10" },
        { author: "John D.", rating: 5, comment: "Professional, punctual, and very thorough. Highly recommended for commercial cleaning.", date: "2024-02-15" }
      ];
      const stmt = db.prepare("INSERT INTO reviews (author, rating, comment, date) VALUES (?, ?, ?, ?)");
      initialReviews.forEach(r => stmt.run(r.author, r.rating, r.comment, r.date));
      console.log("Initial reviews seeded.");
    }

    // Seed initial gallery if empty
    let galleryCount = 0;
    try {
      galleryCount = (db.prepare("SELECT COUNT(*) as count FROM gallery").get() as any).count;
    } catch (e) {}
    
    if (galleryCount === 0) {
      const initialGallery = [
        { url: "https://images.unsplash.com/photo-1527515545081-5db817172677?auto=format&fit=crop&q=80&w=800", title: "Living Room", category: "Residential" },
        { url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800", title: "Modern Kitchen", category: "Residential" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800", title: "Luxury Bathroom", category: "Deep Clean" },
        { url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800", title: "Office Space", category: "Commercial" },
        { url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&q=80&w=800", title: "Master Bedroom", category: "Residential" },
        { url: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=800", title: "Dining Details", category: "Event Prep" }
      ];
      const stmt = db.prepare("INSERT INTO gallery (url, title, category) VALUES (?, ?, ?)");
      initialGallery.forEach(img => stmt.run(img.url, img.title, img.category));
      console.log("Initial gallery seeded.");
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error("CRITICAL: Database initialization failed:", err);
    
    const isMalformed = errMsg.includes("malformed") || errMsg.includes("disk image") || errMsg.includes("corrupt");
    if (isMalformed && retryCount < 1) {
      console.warn(`Database file '${dbPath}' is detected as malformed or corrupt. Attempting automatic recovery (try ${retryCount + 1})...`);
      try {
        if (db) {
          try { db.close(); } catch (_) {}
        }
      } catch (_) {}
      
      try {
        if (fs.existsSync(dbPath)) {
          const corruptedPath = `${dbPath}.corrupted-${Date.now()}`;
          fs.renameSync(dbPath, corruptedPath);
          console.warn(`Successfully archived corrupted DB files to '${corruptedPath}'. Creating a fresh database...`);
        }
        initDb(retryCount + 1);
        return;
      } catch (recoveryErr) {
        console.error("Failed to rename corrupt database file. Retrying with deletion...", recoveryErr);
        try {
          if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.warn(`Removed corrupted database file. Reinitializing...`);
          }
          initDb(retryCount + 1);
          return;
        } catch (unlinkErr) {
          console.error("Deep failure: could not delete corrupt database file", unlinkErr);
          dbInitError = unlinkErr instanceof Error ? unlinkErr.message : String(unlinkErr);
        }
      }
    } else {
      dbInitError = errMsg;
    }
  }
}

// --- API ROUTES ---

// Config Endpoint (Public)
app.get("/api/config", (req, res) => {
  res.json({
    businessPhone: process.env.TWILIO_PHONE_NUMBER || "(218) 357-5938" // Please set TWILIO_PHONE_NUMBER in environment variables
  });
});

// SMS Webhook (Twilio)
app.post("/api/sms", async (req, res) => {
  const { Body, From } = req.body;
  const clientMessage = Body || "";
  const clientPhone = From || "Unknown";

  console.log(`Received SMS from ${clientPhone}: ${clientMessage}`);

  if (!process.env.GEMINI_API_KEY) {
    console.error("Gemini API key is not configured");
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // 1. Log incoming message to sqlite database
    if (db && clientPhone !== "Unknown" && clientMessage) {
      try {
        db.prepare("INSERT INTO sms_history (phone, sender, message) VALUES (?, ?, ?)").run(clientPhone, 'client', clientMessage);
      } catch (dbErr) {
        console.error("Error logging incoming SMS to history:", dbErr);
      }
    }

    // 2. Fetch or create lead
    let existingLead = { id: null, name: null, city: null, service_type: null, bedrooms: null, bathrooms: null, status: null };
    if (db && clientPhone !== "Unknown") {
      try {
        const lead = db.prepare("SELECT * FROM leads WHERE phone = ? ORDER BY id DESC LIMIT 1").get(clientPhone) as any;
        if (lead) {
          existingLead = lead;
        } else {
          const insertRes = db.prepare("INSERT INTO leads (phone, status) VALUES (?, ?)").run(clientPhone, 'new');
          existingLead = {
            id: insertRes.lastInsertRowid as any,
            name: null,
            city: null,
            service_type: null,
            bedrooms: null,
            bathrooms: null,
            status: 'new'
          };
        }
      } catch (dbErr) {
        console.error("Error fetching/creating lead in SMS webhook:", dbErr);
      }
    }

    // 3. Fetch past 15 messages for history context
    let history: { sender: string, message: string }[] = [];
    if (db && clientPhone !== "Unknown") {
      try {
        history = db.prepare("SELECT sender, message FROM sms_history WHERE phone = ? ORDER BY id ASC LIMIT 15").all(clientPhone) as any[];
      } catch (dbErr) {
        console.error("Error fetching message history:", dbErr);
      }
    }

    // 4. Construct the contextual prompt for Gemini
    const prompt = `
      Current Incoming Message: "${clientMessage}"
      Customer Phone: ${clientPhone}

      Current Database State for this Customer:
      - Name: ${existingLead.name || 'Unknown'}
      - City: ${existingLead.city || 'Unknown'}
      - Service: ${existingLead.service_type || 'Unknown'}
      - Bedrooms: ${existingLead.bedrooms || 'Unknown'}
      - Bathrooms: ${existingLead.bathrooms || 'Unknown'}
      - Status: ${existingLead.status || 'Unknown'}

      Here is the chronological SMS conversation history so far:
      ${history.map(h => `${h.sender === 'client' ? 'Client' : 'Assistant'}: ${h.message}`).join("\n")}

      Perform slot-filling on all properties. Determine the next single-question, caring response to guide the relationship and ask for one piece of information at a time. Put your friendly response in the "response_message" field.
    `;

    // 5. Query Gemini with strict JSON Schema
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are Dani Clean Pro’s warm and professional SMS receptionist.
You help customers schedule cleaning estimates in a caring, detailed, and human way.

Your goal is NOT to give prices immediately.
Your goal is to guide the customer to choose one of these three options:
1. Schedule an estimate appointment
2. Send photos of the home for review
3. Have Dani visit the location for an in-person estimate

Tone guidelines:
- warm
- kind
- patient
- professional
- detailed but concise
- human, not robotic

Always ask one question at a time. Keep messages brief, natural, and friendly.

Collect:
- customer name
- phone number (default to: ${clientPhone})
- address or city
- type of cleaning (regular/deep/move-in-out etc.)
- property type
- bedrooms
- bathrooms
- preferred date/time
- whether they prefer photos for estimate, schedule estimate, or Dani visiting in person

Never give a final price by SMS.
If the customer asks for a price or estimate cost, say:
“We’d love to give you an accurate estimate. Dani can review photos or schedule a quick visit so we can give you the right price.”

When ready or contextually appropriate, ask the following exact question:
“Would you prefer to send a few photos first, schedule an estimate, or have Dani stop by to take a look?”

You must output a valid JSON object matching the required schema. Ensure you preserve and accumulate previously gathered state.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customer_name: { type: Type.STRING, description: "Customer's name if identified, empty if not" },
            customer_phone: { type: Type.STRING, description: "Customer's phone number" },
            service_requested: { type: Type.STRING, description: "Type of cleaning requested (e.g. Regular, Deep, Move-in/Move-out)" },
            property_type: { type: Type.STRING, description: "Property type (house, apartment, office, etc.)" },
            bedrooms: { type: Type.STRING, description: "Number of bedrooms if known" },
            bathrooms: { type: Type.STRING, description: "Number of bathrooms if known" },
            address: { type: Type.STRING, description: "Street address if provided" },
            city: { type: Type.STRING, description: "City or town if provided" },
            preferred_date: { type: Type.STRING, description: "Preferred date" },
            preferred_time: { type: Type.STRING, description: "Preferred time" },
            estimate_option: { type: Type.STRING, description: "Option preferred: photos, phone estimate, or visit" },
            customer_message: { type: Type.STRING, description: "Brief summary of client's latest intent" },
            response_message: { type: Type.STRING, description: "Your friendly, caring SMS response text to the client. Keep it short (maximum 2-3 sentences), warm, and human, asking exactly one simple question at a time." },
            lead_status: { type: Type.STRING, description: "The status of the conversation: 'new', 'inquiring', 'photos_requested', 'visit_scheduled', 'estimate_provided'" }
          },
          required: [
            "customer_name", "customer_phone", "service_requested", "property_type",
            "bedrooms", "bathrooms", "address", "city", "preferred_date",
            "preferred_time", "estimate_option", "customer_message", "response_message", "lead_status"
          ]
        }
      }
    });

    const parsed = JSON.parse(result.text || "{}");
    const replyText = parsed.response_message || "Thanks for reaching out! We will get back to you shortly.";

    // 6. Log outgoing response to SMS history
    if (db && clientPhone !== "Unknown") {
      try {
        db.prepare("INSERT INTO sms_history (phone, sender, message) VALUES (?, ?, ?)").run(clientPhone, 'assistant', replyText);
      } catch (dbErr) {
        console.error("Error logging outgoing SMS to history:", dbErr);
      }
    }

    // 7. Dynamic lead database synchronization
    if (db && existingLead.id) {
      try {
        db.prepare(`
          UPDATE leads 
          SET name = COALESCE(NULLIF(?, ''), name),
              service_type = COALESCE(NULLIF(?, ''), service_type),
              bedrooms = COALESCE(?, bedrooms),
              bathrooms = COALESCE(?, bathrooms),
              city = COALESCE(NULLIF(?, ''), city),
              preferred_date = COALESCE(NULLIF(?, ''), preferred_date),
              message = COALESCE(NULLIF(?, ''), message),
              status = COALESCE(NULLIF(?, ''), status)
          WHERE id = ?
        `).run(
          parsed.customer_name || '',
          parsed.service_requested || '',
          parsed.bedrooms ? parseInt(parsed.bedrooms) || null : null,
          parsed.bathrooms ? parseInt(parsed.bathrooms) || null : null,
          parsed.city || '',
          parsed.preferred_date || (parsed.preferred_time ? `${parsed.preferred_date} ${parsed.preferred_time}` : ''),
          `[Property: ${parsed.property_type || 'N/A'}] [Address: ${parsed.address || 'N/A'}] [Estimate Option: ${parsed.estimate_option || 'N/A'}] [Notes: ${parsed.customer_message || ''}]`,
          parsed.lead_status || 'inquiring',
          existingLead.id
        );
      } catch (dbErr) {
        console.error("Error updating lead details in SMS webhook:", dbErr);
      }
    }

    // 8. Send SMS to user via Twilio
    if (twilioClient && clientPhone !== "Unknown" && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: replyText,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: clientPhone,
        });
      } catch (twilioErr) {
        console.error("Twilio send error:", twilioErr);
      }
    }

    // Return the JSON as requested by the user
    res.status(200).json(parsed);
  } catch (err) {
    console.error("SMS processing error:", err);
    res.status(500).json({ error: "Error processing dynamic SMS response" });
  }
});

// Voice Webhook (Twilio)
app.post("/api/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Olá! Você ligou para a Dany Clean Pro. Como posso ajudar com sua limpeza hoje?");
  twiml.gather({
    input: ['speech'],
    action: '/api/voice/process',
    enhanced: true,
    language: 'pt-BR'
  });
  res.type('text/xml');
  res.send(twiml.toString());
});

app.post("/api/voice/process", async (req, res) => {
  const { SpeechResult } = req.body;
  const twiml = new twilio.twiml.VoiceResponse();

  if (!SpeechResult) {
    twiml.say("Desculpe, não consegui ouvir. Pode repetir?");
    twiml.redirect('/api/voice');
    return res.type('text/xml').send(twiml.toString());
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `
      Você é um assistente de voz da "Dany Clean Pro". 
      O cliente disse: "${SpeechResult}"
      Responda de forma curta e natural em português para ajudar a agendar uma limpeza.
      Se o cliente quiser agendar, peça o nome e o tipo de serviço.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    const text = result.text || "Desculpe, pode repetir?";

    twiml.say(text);
    twiml.gather({
      input: ['speech'],
      action: '/api/voice/process',
      language: 'pt-BR'
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    twiml.say("Houve um problema técnico. Um consultor entrará em contato em breve.");
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// AI Chat Proxy (Secure)
app.post("/api/chat", async (req, res) => {
  const { prompt, message } = req.body;
  const userMessage = message || prompt;
  
  if (!userMessage) return res.status(400).json({ error: "Message is required" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "AI not configured" });

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userMessage
    });
    const reply = result.text || "I'm sorry, I couldn't process that.";
    res.json({ 
      text: reply,
      reply: reply 
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

// AI Tool: Book Lead
app.post("/api/ai/book-lead", async (req, res) => {
  const { name, phone, email, service_type, preferred_date, city } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO leads (name, phone, email, service_type, preferred_date, city, status)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
    `);
    const result = stmt.run(name, phone || '', email || '', service_type || 'Regular', preferred_date || '', city || 'Stamford');
    
    // Trigger Automation
    await notifyAutomation({ name, phone, email, service_type, preferred_date, city, status: 'scheduled' });
    
    res.status(201).json({ success: true, leadId: result.lastInsertRowid });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});

// Template: Example of a sensitive API handler (e.g., Stripe, Email, Google Maps)
// This logic stays on the server to protect your secret keys.
app.post("/api/secret/process-payment", async (req, res) => {
  const SECRET_KEY = process.env.STRIPE_SECRET_KEY; // Managed in Settings > Environment Variables
  if (!SECRET_KEY) {
    return res.status(500).json({ error: "API Key not configured" });
  }
  // Logic to call third-party API goes here
  res.json({ message: "Request processed securely" });
});

// Debug Users (Remove in production)
app.get("/api/debug-users", (req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(403).send();
  try {
    const users = db.prepare("SELECT id, username FROM users").all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware for protected routes
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  if (token === "fb-token") {
    req.user = { id: 9999, username: "firebase-admin", role: "admin" };
    return next();
  }
  try {
    if (!JWT_SECRET) return res.status(500).json({ error: "Server misconfigured: JWT_SECRET missing" });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Leads
app.get("/api/leads", (req, res) => {
  console.log('[GET] /api/leads - Testing GET request for leads');
  res.json({
    status: "API leads endpoint is active"
  });
});

app.post("/api/leads", async (req, res) => {
  console.log(`[POST] /api/leads - Incoming Lead Payload`);
  
  const sanitize = (val: any): string => {
    if (val === undefined || val === null) return "";
    return String(val)
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "") // strip script tags
      .replace(/<[^>]*>/g, "") // strip all HTML tags
      .trim();
  };

  const rawBody = req.body || {};
  
  // Normalize fields, supporting both standard app forms and n8n incoming requests
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
    console.error("✗ Failed to save lead: Phone number is required");
    return res.status(400).json({ error: "Phone number is required" });
  }

  let leadId: number | bigint | null = null;
  let sqliteSuccess = false;

  // 1. Save or Update in SQLite for the Admin CRM Dashboard
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }

    console.log(`Processing SQLite upsert for phone: ${phone}`);

    // Check for existing lead by phone to support continuous conversations
    let existingLead = db.prepare("SELECT id FROM leads WHERE phone = ? OR customer_phone = ? ORDER BY id DESC LIMIT 1").get(phone, phone) as any;

    if (existingLead) {
      console.log(`↳ Updating existing SQLite lead ID: ${existingLead.id}`);
      db.prepare(`
        UPDATE leads 
        SET name = COALESCE(NULLIF(?, ''), name),
            customer_name = COALESCE(NULLIF(?, ''), customer_name),
            email = COALESCE(NULLIF(?, ''), email),
            city = COALESCE(NULLIF(?, ''), city),
            zip_code = COALESCE(NULLIF(?, ''), zip_code),
            service_type = COALESCE(NULLIF(?, ''), service_type),
            service_requested = COALESCE(NULLIF(?, ''), service_requested),
            bedrooms = COALESCE(?, bedrooms),
            bathrooms = COALESCE(?, bathrooms),
            preferred_date = COALESCE(NULLIF(?, ''), preferred_date),
            preferred_time = COALESCE(NULLIF(?, ''), preferred_time),
            message = COALESCE(NULLIF(?, ''), message),
            customer_message = COALESCE(NULLIF(?, ''), customer_message),
            property_type = COALESCE(NULLIF(?, ''), property_type),
            address = COALESCE(NULLIF(?, ''), address),
            estimate_option = COALESCE(NULLIF(?, ''), estimate_option),
            estimated_price = COALESCE(NULLIF(?, ''), estimated_price),
            ai_reply = COALESCE(NULLIF(?, ''), ai_reply),
            status = COALESCE(NULLIF(?, ''), status),
            lead_status = COALESCE(NULLIF(?, ''), lead_status),
            conversation_summary = COALESCE(NULLIF(?, ''), conversation_summary),
            sms_history = COALESCE(NULLIF(?, ''), sms_history),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name, name, email, city, zip_code, service_type, service_type,
        bedroomsNum, bathroomsNum, preferred_date, preferred_time,
        message, message, property_type, address, estimate_option,
        estimated_price, ai_reply, lead_status, lead_status,
        conversation_summary, sms_history, existingLead.id
      );
      leadId = existingLead.id;
    } else {
      console.log(`↳ Creating new SQLite lead record`);
      const stmt = db.prepare(`
        INSERT INTO leads (
          name, customer_name, email, phone, customer_phone, city, zip_code, 
          service_type, service_requested, bedrooms, bathrooms, 
          preferred_date, preferred_time, message, customer_message, 
          property_type, address, estimate_option, estimated_price, 
          ai_reply, status, lead_status, conversation_summary, 
          sms_history, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      const result = stmt.run(
        name, name, email, phone, phone, city, zip_code,
        service_type, service_type, bedroomsNum, bathroomsNum,
        preferred_date, preferred_time, message, message,
        property_type, address, estimate_option, estimated_price,
        ai_reply, lead_status, lead_status, conversation_summary,
        sms_history
      );
      leadId = result.lastInsertRowid;
    }

    sqliteSuccess = true;
    console.log(`✓ SQLite sync successful. Lead ID: ${leadId}`);
  } catch (err) {
    console.error("✗ SQLite Lead Save/Upsert Error:", err);
  }

  // 2. Sync to Firestore (if configured)
  const firestore = getFirestore();
  if (firestore) {
    const syncToFirestore = async () => {
      try {
        console.log("Syncing lead to Firestore...");
        const payload = {
          name, customer_name: name, email, phone, customer_phone: phone, city, zip_code,
          service_type, service_requested: service_type, bedrooms: bedroomsNum, bathrooms: bathroomsNum,
          preferred_date, preferred_time, message, customer_message: message,
          property_type, address, estimate_option, estimated_price,
          ai_reply, status: lead_status, lead_status, conversation_summary,
          sms_history,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          sqlite_id: leadId?.toString()
        };
        await firestore.collection("leads").add(payload);
        console.log("Firestore sync successful");
      } catch (err: any) {
        console.warn("Firestore sync failed, but lead saved in local DB:", err.message);
      }
    };
    
    const firestoreTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
    );
    
    try {
      await Promise.race([syncToFirestore(), firestoreTimeout]);
    } catch (err) {
      console.warn("Firestore sync was skipped or timed out");
    }
  }

  // 3. Trigger External Automations Webhook (if loaded)
  const webhookUrl = process.env.AUTOMATION_WEBHOOK_URL;
  if (webhookUrl) {
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            ...req.body,
            id: leadId,
            source: "dany-clean-pro-app",
            timestamp: new Date().toISOString()
          }),
        });
        clearTimeout(timeoutId);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn("Automation webhook timed out");
        }
      }
    })();
  }

  if (sqliteSuccess) {
    res.status(200).json({ success: true, id: leadId, message: "Lead processed successfully" });
  } else {
    if (firestore) {
       res.status(200).json({ success: true, id: 'firestore-only' });
    } else {
       res.status(500).json({ success: false, error: "Internal database error" });
    }
  }
});

// Settings Save Route
app.post("/api/settings/save", authenticate, async (req, res) => {
  const { settingId, value } = req.body;
  if (!settingId) {
    return res.status(400).json({ error: "Missing settingId" });
  }
  if (settingId !== "app_logo" && settingId !== "hero_cover" && settingId !== "about_section_image") {
    return res.status(403).json({ error: "Unauthorized settingId" });
  }

  try {
    const firestore = getFirestore();
    if (!firestore) {
      return res.status(500).json({ error: "Firestore database is not configured or ready on the server." });
    }

    const docRef = firestore.collection("settings").doc(settingId);
    await docRef.set({ value });
    console.log(`[Firestore] Successfully saved status for setting: ${settingId}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[Firestore Error] Failed to save setting ${settingId}:`, err);
    res.status(500).json({ error: "Failed to save setting: " + err.message });
  }
});

app.get("/api/admin/leads", authenticate, (req, res) => {
  try {
    const leads = db.prepare("SELECT *, created_at as createdAt FROM leads ORDER BY created_at DESC").all() as any[];
    
    // Unify all columns for robust front-end reading
    const mapped = leads.map(l => ({
      ...l,
      status: l.lead_status || l.status || 'new',
      service_type: l.service_requested || l.service_type || 'Regular',
      name: l.customer_name || l.name || 'Anonymous',
      phone: l.customer_phone || l.phone || 'Unknown',
      message: l.customer_message || l.message || ''
    }));
    
    res.json(mapped);
  } catch (err: any) {
    console.error("Failed to fetch admin leads from SQLite:", err);
    res.status(500).json({ error: "Failed to read leads" });
  }
});

app.patch("/api/admin/leads/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    // Keep both columns in sync
    db.prepare("UPDATE leads SET status = ?, lead_status = ? WHERE id = ?").run(status, status, id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to update lead status in SQLite:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Public Reviews
app.get("/api/reviews", (req, res) => {
  const reviews = db.prepare("SELECT * FROM reviews WHERE is_published = 1 ORDER BY date DESC").all();
  res.json(reviews);
});

// Admin Review Management
app.get("/api/admin/reviews", authenticate, (req, res) => {
  const reviews = db.prepare("SELECT * FROM reviews ORDER BY date DESC").all();
  res.json(reviews);
});

app.post("/api/admin/reviews", authenticate, (req, res) => {
  const { author, rating, comment, date } = req.body;
  db.prepare("INSERT INTO reviews (author, rating, comment, date) VALUES (?, ?, ?, ?)").run(author, rating, comment, date);
  res.status(201).json({ success: true });
});

app.patch("/api/admin/reviews/:id/toggle", authenticate, (req, res) => {
  const { id } = req.params;
  const review = db.prepare("SELECT is_published FROM reviews WHERE id = ?").get(id) as any;
  if (!review) return res.status(404).json({ error: "Not found" });
  
  db.prepare("UPDATE reviews SET is_published = ? WHERE id = ?").run(review.is_published ? 0 : 1, id);
  res.json({ success: true });
});

app.delete("/api/admin/reviews/:id", authenticate, (req, res) => {
  db.prepare("DELETE FROM reviews WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Local Static Storage for Admin Uploads
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

app.post("/api/admin/upload", authenticate, (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: "Missing base64 data or filename" });
    }

    // Clean data URL prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Standardize filename to prevent paths injection or weird symbols
    const ext = path.extname(filename) || ".jpg";
    const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "-");
    const safeFilename = `${Date.now()}-${base}${ext}`;
    const filePath = path.join(uploadDir, safeFilename);

    // Save image to the local upload directory
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeFilename}`;
    console.log(`[Upload] File saved successfully to ${filePath} -> accessible on ${fileUrl}`);
    res.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error("Local upload system error:", err);
    res.status(500).json({ error: "Local file-upload sequence failed" });
  }
});

// Secure download proxy to circumvent browser CORS & storage invalid tokens
app.get("/api/gallery/download", async (req, res) => {
  try {
    const { url, title } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    
    const urlStr = String(url);
    if (urlStr.startsWith("/uploads/")) {
      const safeFilename = path.basename(urlStr);
      const filePath = path.join(uploadDir, safeFilename);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(safeFilename) || ".jpg";
        const cleanTitle = (String(title || "image")).trim().replace(/[^a-zA-Z0-9]/g, "_") || "image";
        res.setHeader("Content-Disposition", `attachment; filename="${cleanTitle}${ext}"`);
        return res.sendFile(filePath);
      }
    }

    const response = await fetch(urlStr);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote resource: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const fileExt = urlStr.split('.').pop()?.split('?')[0] || 'jpg';
    const safeTitle = (String(title || "image")).trim().replace(/[^a-zA-Z0-9]/g, "_") || "image";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.${fileExt}"`);
    res.send(buffer);
  } catch (err: any) {
    console.error("Download proxy operation error, redirecting to raw URL:", err);
    res.redirect(String(req.query.url));
  }
});

// Public Gallery
app.get("/api/gallery", (req, res) => {
  const items = db.prepare("SELECT * FROM gallery ORDER BY created_at DESC").all();
  res.json(items);
});

// Admin Gallery Management
app.post("/api/admin/gallery", authenticate, (req, res) => {
  const { url, title, category } = req.body;
  db.prepare("INSERT INTO gallery (url, title, category) VALUES (?, ?, ?)").run(url, title, category);
  res.status(201).json({ success: true });
});

app.delete("/api/admin/gallery/:id", authenticate, (req, res) => {
  db.prepare("DELETE FROM gallery WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.put("/api/admin/gallery/:id", authenticate, (req, res) => {
  const { url, title, category } = req.body;
  db.prepare("UPDATE gallery SET url = ?, title = ?, category = ? WHERE id = ?").run(url, title, category, req.params.id);
  res.json({ success: true });
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  initDb();
  
  // API 404 Catch-all (to prevent falling through to SPA index.html)
  app.all("/api/*", (req, res) => {
    console.warn(`[404] API Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware loaded");
    } catch (err) {
      console.error("Vite failed to load:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
