# 🌊 Slip Stream — Next-Gen STEAM Education

Slip Stream is an advanced, AI-powered STEAM (Science, Technology, Engineering, Art, and Math) education platform. It blends interactive physics simulations, personalized tutoring, and mental health advisory into a single seamless experience.

## ✨ Core Features

- **Interactive Physics Engine**: A custom React Canvas engine that visualizes math and physics concepts dynamically (pendulums, projectile motion, wave interference) based on AI-generated JSON payloads.
- **Flawless AI Architecture**: Powered by 4 dedicated Google Gemini (`gemini-3.6-flash`) API clients handling distinct workloads:
  - 🤖 **Chat Companion**: Solves complex STEAM problems with visual sandbox animations.
  - 🌿 **Mental Health Advisor**: Analyzes student timetables to detect cognitive overload and ultradian rhythm violations, gamifying rest cycles.
  - 🧠 **Quiz & Notebook AI**: Generates dynamic knowledge assessments.
- **Serverless Ready**: Fully configured for Vercel deployment with a robust Express proxy.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend Proxy**: Node.js, Express.js, Google Gen AI SDK
- **Deployment**: Vercel (Zero-Config Serverless Functions)
- **Formatting**: React Markdown & KaTeX for beautiful math equations.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Rename `.env.example` to `.env` and add your Google Gemini API keys:
```env
GEMINI_API_KEY_COMPANION=your_key_here
GEMINI_API_KEY_MENTAL_HEALTH=your_key_here
GEMINI_API_KEY_SIMULATION=your_key_here
GEMINI_API_KEY_SECONDARY=your_key_here
```

### 3. Run Locally
```bash
npm run dev
```
The frontend will start on `http://localhost:5173` and the backend will start on `http://localhost:3000`.

## 🔒 Security Note
Never commit your `.env` file to version control. When deploying to Vercel, upload or paste your `.env` variables directly into the Vercel Dashboard under **Settings > Environment Variables**.
