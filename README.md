🚀 HR Trainer - Developer Documentation
Project Name: HR Trainer
Creation Date: January 2026
Lead Developer: A. Athanasopoulos
Local Environment Path: C:\Users\sakis\hr-pulse-google\hr-pulse

🏗️ Project Architecture (Flat Structure)
The project utilizes a Flat Directory Structure to allow immediate access to core logic files and speed up the rapid prototyping process with Gemini AI.
1. Core Logic & State (Root)
    • App.tsx: The central "brain" managing global state, view routing, and Training Mode feedback.
    • types.ts: Defines Interfaces, including the status: 'pass' | 'fail' | null field for progress tracking.
    • index.tsx: Entry point for React rendering.
2. Directory Breakdown
    • components/: UI building blocks like QuestionCard.tsx (neon indicators) and SimulationView.tsx (voice simulation).
    • services/: Infrastructure logic containing geminiService.ts for AI integration and audioService.ts for Web Audio API.
    • public/: Static assets and local screenshots.

🌟 Key Features
    • Neon Training Progress: Real-time visual feedback. A Neon Blue "V" indicates a pass, while a Neon Red "X" signifies areas needing improvement.
    • Aria Briefing: Real-time market insights using Google Search Grounding.
    • Live Simulation: High-fidelity voice practice powered by Gemini Native Audio.

💻 How to Run Locally
    1. Install dependencies: npm install
    2. Configure Environment: Set your VITE_GEMINI_API_KEY in the .env.local file.
    3. Run the app: npm run dev

🛠️ Maintenance & Troubleshooting
Issue	File to Inspect	Action
AI Connectivity	services/geminiService.ts	Verify API Key in .env.local.
Neon UI Missing	components/QuestionCard.tsx	Check CSS drop-shadow classes.
Voice Latency	services/audioService.ts	Check mic permissions and WebSocket status.

Deployment Strategy
    • Platform: Vercel.
    • Environment Variables: Configure VITE_GEMINI_API_KEY in Vercel Project Settings.
