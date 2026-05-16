import express from "express";
import path from "path";
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

// Health Check (Very early)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db_connected: !!db,
    firestore_ready: !!getFirebaseAdmin(),
    twilio_ready: !!twilioClient
  });
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

function initDb() {
  try {
    db = new Database("database.db");
    console.log("Database connected successfully.");

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
    `);

    // Seed initial admin if not exists
    const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
      console.log("Default admin user created: admin / admin123");
    } else {
      // Force update for debugging
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.prepare("UPDATE users SET password = ? WHERE username = ?").run(hashedPassword, "admin");
      console.log("Admin password force-reset to admin123");
    }

    // Add administrador alias
    const admin2Exists = db.prepare("SELECT * FROM users WHERE username = ?").get("administrador");
    if (!admin2Exists) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("administrador", hashedPassword);
      console.log("Default administrador user created: administrador / admin123");
    } else {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.prepare("UPDATE users SET password = ? WHERE username = ?").run(hashedPassword, "administrador");
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
  } catch (err) {
    console.error("CRITICAL: Database initialization failed:", err);
    // Continue anyway to avoid total crash, though some features will break
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API ROUTES ---

// Config Endpoint (Public)
app.get("/api/config", (req, res) => {
  res.json({
    businessPhone: process.env.TWILIO_PHONE_NUMBER || "(203) 456-7890" // Please set TWILIO_PHONE_NUMBER in environment variables
  });
});

// SMS Webhook (Twilio)
app.post("/api/sms", async (req, res) => {
  const { Body, From } = req.body;
  console.log(`Received SMS from ${From}: ${Body}`);

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).send("Gemini API key not configured");
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      You are an automated assistant for "Dany Clean Pro", a cleaning company in CT. 
      A client sent an SMS: "${Body}"
      From: ${From}
      
      Goal: Help them schedule a cleaning. 
      Collect: Name, Service Type (Regular, Deep, Move-In/Out), Preferred Date.
      
      Respond politely, helpfully, and briefly (SMS style).
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    const reply = result.text || "Thanks for your message! We will get back to you soon.";

    if (twilioClient) {
      await twilioClient.messages.create({
        body: reply,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: From,
      });
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("SMS processing error:", err);
    res.status(500).send("Error processing message");
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
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "AI not configured" });

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });
    res.json({ text: result.text || "I'm sorry, I couldn't process that." });
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

// Auth
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for user: ${username}`);
  
  if (!db) {
    console.error("Database not initialized during login attempt");
    return res.status(500).json({ error: "Database error" });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    
    if (!user) {
      console.warn(`Login failed: User ${username} not found`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (passwordMatch) {
      console.log(`Login successful for user: ${username}`);
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, user: { id: user.id, username: user.username } });
    } else {
      console.warn(`Login failed for user: ${username} - Password mismatch`);
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal server error during login" });
  }
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
  try {
    if (!JWT_SECRET) return res.status(500).json({ error: "Server misconfigured: JWT_SECRET missing" });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Leads
app.post("/api/leads", async (req, res) => {
  const { name, email, phone, city, zip_code, service_type, bedrooms, bathrooms, preferred_date, message } = req.body;
  
  let leadId: number | bigint | null = null;
  let sqliteSuccess = false;

  // 1. Always save to SQLite for the Admin Panel (Fast & Local)
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    console.log(`Processing lead submission for: ${email || phone}`);
    const stmt = db.prepare(`
      INSERT INTO leads (name, email, phone, city, zip_code, service_type, bedrooms, bathrooms, preferred_date, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `);
    const result = stmt.run(name, email, phone, city, zip_code, service_type, bedrooms, bathrooms, preferred_date, message);
    leadId = result.lastInsertRowid;
    sqliteSuccess = true;
    console.log(`✓ Lead saved to SQLite ID: ${leadId}`);
  } catch (err) {
    console.error("✗ SQLite Lead Save Error:", err);
  }

  // 2. Optionally sync to Firestore (Non-blocking or short-timeout)
  const firestore = getFirestore();
  if (firestore) {
    const syncToFirestore = async () => {
      try {
        console.log("Syncing lead to Firestore...");
        await firestore.collection("leads").add({
          name, email, phone, city, zip_code, service_type, 
          bedrooms, bathrooms, preferred_date, message,
          status: 'new',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          sqlite_id: leadId?.toString()
        });
        console.log("Firestore sync successful");
      } catch (err: any) {
        console.warn("Firestore sync failed, but lead saved in local DB:", err.message);
      }
    };
    
    // We execute this but don't strictly await it if we want to be ultra-fast,
    // OR we await it with a short timeout.
    // Let's use a timeout to avoid hanging the client.
    const firestoreTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore operation timed out')), 4000)
    );
    
    try {
      await Promise.race([syncToFirestore(), firestoreTimeout]);
    } catch (err) {
      console.warn("Firestore sync was skipped or timed out");
    }
  }

  // 3. Trigger Automation (Non-blocking)
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
        // Silent error for automation to avoid log spam
        if (err.name === 'AbortError') {
          console.warn("Automation webhook timed out");
        }
      }
    })();
  }

  if (sqliteSuccess) {
    res.status(201).json({ id: leadId, success: true });
  } else {
    // Check if we can still claim success via Firestore fallback
    if (firestore) {
       res.status(201).json({ id: 'firestore-only', success: true });
    } else {
       res.status(500).json({ error: "Internal database error" });
    }
  }
});

app.get("/api/admin/leads", authenticate, (req, res) => {
  const leads = db.prepare("SELECT id, name, email, phone, city, zip_code, service_type, bedrooms, bathrooms, preferred_date, message, status, created_at as createdAt FROM leads ORDER BY created_at DESC").all();
  res.json(leads);
});

app.patch("/api/admin/leads/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
  res.json({ success: true });
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

// --- VITE MIDDLEWARE ---

async function startServer() {
  initDb();
  
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
