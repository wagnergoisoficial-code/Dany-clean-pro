# Technical Checkpoint: Stable AI Chat Lead Capture Pipeline

**Date:** 2026-05-18
**Version:** v1.2.0-stable-lead-capture
**Commit Message:** `checkpoint: stable AI chat lead capture pipeline`

## 1. Overview
This checkpoint documents the stable implementation of the AI-powered lead capture system for Dany Clean Pro. The system automatically detects lead information (Name and Phone) from chat conversations and saves them to Firestore via a secure server-side pipeline.

## 2. Infrastructure & Components

### Backend (Netlify Functions)
- **AI Conversation:** `netlify/functions/chat.ts`
  - Handles proxying requests to Google GenAI.
  - Uses Gemini model: `gemini-3-flash-preview`
  - **Environment Variable:** `GEMINI_API_KEY`
- **Lead Capture:** `netlify/functions/chat-lead.ts`
  - Uses **Firebase Admin SDK** for privileged writes to Firestore.
  - Implements server-side validation and duplicate prevention (by normalized phone and source).
  - **Environment Variables:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (normalized for line breaks and quotes).

### Frontend (React)
- **Chat Interface:** `src/components/AIChatWidget.tsx`
  - Manages chat state, history, and rendering.
  - Performs non-blocking **lead detection** (Regex-based) in background.
  - Calls `/api/chat-lead` when both Name and Phone are identified.

### Routing (`netlify.toml`)
- `/api/chat` -> `/.netlify/functions/chat`
- `/api/chat-lead` -> `/.netlify/functions/chat-lead`
- Standard SPA fallback `/*` -> `/index.html`

## 3. Data Schema (Firestore)
- **Collection Name:** `leads`
- **Field Mappings:**
  - `name`: User's identified name.
  - `phone`: Literal phone string (normalized version checked server-side).
  - `city`: Identified city (if available).
  - `service_type`: Set to identified service or default `AI Chat Lead`.
  - `message`: The specific message that triggered the lead capture.
  - `chatSessionId`: Unique browser session ID for tracking.
  - `source`: Hardcoded as `AI Chat (Jennifer)`.
  - `status`: Hardcoded as `new`.
  - `createdAt`: Server-side Timestamp.

## 4. Verification & Testing
- **Test Input:** "Hi, my name is Sarah Johnson and my phone number is 203-555-0198. I need deep cleaning."
- **Expected Success Logs (Browser Console):**
  - `AI lead detection triggered`
  - `Potential phone detected: 203-555-0198`
  - `Detected name: Sarah Johnson`
  - `Found complete lead - Calling /api/chat-lead`
  - `AI lead saved [ID]`
- **Success Criteria:** Lead appears in the Admin Dashboard (`LeadsManager.tsx`) under the "Gerenciar leads" section.

## 5. Development Guidelines

### Safe to Modify (Jennifer's Style)
- Only edit `netlify/functions/chat.ts` for instructions, tone, and conversation flow.

### DO NOT MODIFY (Core Infrastructure)
- `src/components/AIChatWidget.tsx` (Unless fixing detection logic)
- `netlify/functions/chat-lead.ts` (Firebase Admin setup)
- `netlify.toml` (API routing)
- `src/pages/admin/LeadsManager.tsx` (Panel reading logic)

## 6. Rollback Instructions
If a future change breaks the chat or lead capture:
1. Revert `netlify/functions/chat.ts` to the state at tag `v1.2.0-stable-lead-capture`.
2. Ensure Netlify environment variables match the certified ones (Check `FIREBASE_PRIVATE_KEY` formatting).
3. Verify that `/api/chat-lead` returns status `201` for new leads.
