# Dany Clean Pro - Full Stack Cleaning Platform

This is a production-ready MVP for **Dany Clean Pro**, a professional cleaning company in Connecticut.

## 🚀 Features

- **Conversion-Optimized Landing Page**: Modern, mobile-first design built with Tailwind CSS and Framer Motion.
- **Smart AI Assistant**: Integrated Gemini AI chatbot to answer customer questions 24/7.
- **Secure Admin Dashboard**: Protected portal to manage leads, track growth metrics, and update statuses.
- **Dynamic Lead System**: Persistent SQLite database to store and organize customer requests.
- **Connecticut-Specific Focus**: Built-in support for Fairfield and New Haven county service areas.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, TanStack Query, Framer Motion.
- **Backend**: Node.js, Express, JWT, better-sqlite3.
- **AI**: Gemini AI (@google/genai).
- **Styling**: Tailwind CSS (Service Company Design Recipe).

## 📦 Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Update `.env` with your `GEMINI_API_KEY` and a secure `JWT_SECRET`.
3. **Run Development**:
   ```bash
   npm run dev
   ```
4. **Admin Access**:
   Default credentials: `admin` / `admin123`
   Login at `/admin/login`

## 📈 Future Scaling

1. **Database**: Migrate from SQLite to PostgreSQL for high-concurrency needs.
2. **Automations**: Hook into the `/api/leads` endpoint with tools like n8n or Zapier for SMS notifications.
3. **Payments**: Integrate Stripe for upfront booking prepayments.
4. **Employee Portal**: Expand the admin dashboard with field-staff assignments and GPS tracking.

---
*Built with ❤️ for Dany Clean Pro.*
