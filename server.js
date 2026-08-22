import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({ limit: '50mb' }));

// ── Google Gen AI (4 Dedicated Clients) ──
const MODEL = 'gemini-3.6-flash'; // Hardcoded to Google's required stable model

const companionAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_COMPANION });
const notebookAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_SIMULATION });
const quizAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_SECONDARY });
const mentalHealthAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_MENTAL_HEALTH });

// Helper to parse Base64 data URLs for Google SDK
function parseBase64Image(dataUrl) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data URL');
  }
  return {
    mimeType: matches[1],
    data: matches[2]
  };
}

// ── AI Companion for Subject Doubts (Companion Key) ──
app.post('/api/companion', async (req, res) => {
  try {
    const { message, history, image } = req.body;
    if (!message && !image) return res.status(400).json({ error: 'Message or image is required' });

    const systemPrompt = `You are "Slip Stream AI", an advanced STEAM (Science, Tech, Engineering, Arts, Math) tutor.
Your core feature is generating precise, browser-renderable JSON payloads that drive interactive physics simulations and animations, while ALSO providing clear explanations and LaTeX equations.

CRITICAL JSON SCHEMA REQUIREMENT:
You MUST return your ENTIRE response as a strictly valid JSON object. DO NOT wrap it in markdown formatting like \`\`\`json. DO NOT add conversational filler outside the JSON.
Your JSON must strictly match this schema:
{
  "title": "String - Short title of the topic",
  "concepts": ["String", "String", "String"],
  "explanation": "String - Your detailed explanation using markdown. Use inline $latex$ and display $$latex$$. Use double backslashes for all LaTeX commands inside JSON (e.g. \\\\frac{a}{b} or \\\\sin(\\\\theta)).",
  "equations": [
    { "name": "Equation Name", "latex": "Escaped LaTeX string" }
  ],
  "scene": {
    "steps": [
      {
        "id": "unique_string",
        "type": "circle|rect|line|text",
        "x": Number (0-100),
        "y": Number (0-60),
        "width": Number (optional),
        "height": Number (optional),
        "radius": Number (optional),
        "text": "String (optional)",
        "color": "Hex string",
        "opacity": Number (0-1),
        "time": Number (seconds when this state occurs)
      }
    ]
  },
  "simulation": {
    "engine": "wave|projectile|pendulum|collision|raytrace|none",
    "variables": {
      "varName": { "value": Number, "min": Number, "max": Number, "label": "String" }
    }
  }
}

BEHAVIORAL RULES:
- Focus HEAVILY on the "simulation" block. If the topic involves physics or math, ALWAYS try to map it to one of the supported engines (wave, projectile, pendulum, collision, raytrace).
- Provide precise, scientifically accurate "variables" for the simulation engine so the user can interactively tweak the physics parameters on the frontend.
- Make the scene steps progressive. Use the 'time' property (e.g., 0, 1, 2) to animate objects over time. Keep object IDs consistent across steps to allow the client to interpolate (lerp) them.
- If an image is provided, analyze it. If it's a problem, solve it in the 'explanation' and set 'simulation.engine' to 'none' if inapplicable.
`;

    // Reconstruct history into a string block (simplest and most robust for generateContent without ChatSession)
    let fullContext = "";
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        fullContext += `\n${msg.role === 'user' ? 'Student' : 'AI'}: ${msg.text}`;
      });
    }

    let contents = [];
    
    // Add text prompt
    const finalPrompt = `Previous context: ${fullContext}\n\nCurrent Request: ${message || 'Analyze this image and explain the concepts.'}`;
    contents.push({ text: finalPrompt });

    // Add image if exists
    if (image) {
      const imgData = parseBase64Image(image);
      contents.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
    }

    const response = await companionAI.models.generateContent({
      model: MODEL,
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error('Companion API error:', err.message || err);
    res.status(500).json({ error: err.message || 'Failed to get AI response' });
  }
});

// ── Generate Solution Notebook (Simulation Key) ──
app.post('/api/notebook', async (req, res) => {
  try {
    const { history } = req.body;
    if (!history) return res.status(400).json({ error: 'History required' });

    const systemPrompt = `You are a NotebookLM-style solution generator. 
Your task is to synthesize the fragmented chat history into a cohesive, structured, and highly formatted Markdown master study guide.

Structure it exactly as:
# [Topic Title]

## Core Conceptual Theories
[High-level prose, historical context, definitions]

## Mathematical Derivations
[Extensive use of LaTeX block formatting $$...$$]

## Common Pitfalls
[Identify misconceptions, conceptual errors]

## Actionable Next Steps
[Bulleted lists of further reading, simulations, or practice problems]

Rules:
- Use LaTeX for ALL mathematical expressions: inline $...$ and display $$...$$
- Synthesize the entire conversation into this format.`;

    const userMessage = `Here is the chat history:\n${JSON.stringify(history, null, 2)}\n\nPlease generate the study guide.`;
    
    const response = await notebookAI.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4
      }
    });

    res.json({ notebook: response.text });
  } catch (err) {
    console.error('Notebook API error:', err.message || err);
    res.status(500).json({ error: err.message || 'Failed to generate notebook' });
  }
});

// ── Interactive Quiz Generation (Secondary Key) ──
app.post('/api/quiz', async (req, res) => {
  try {
    const { notebookText } = req.body;
    if (!notebookText) return res.status(400).json({ error: 'Notebook text is required' });

    const systemPrompt = `You are an expert educator. Based on the provided study notes/notebook, generate a multiple-choice quiz.
You MUST output ONLY valid JSON matching this exact schema:
{
  "questions": [
    {
      "question": "String",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": Number (0-3),
      "explanation": "String - pedagogical explanation of why this is correct."
    }
  ]
}
Generate 3 to 5 questions. Do NOT wrap the JSON in markdown code blocks like \`\`\`json \`\`\`. Output raw JSON only.`;

    const response = await quizAI.models.generateContent({
      model: MODEL,
      contents: notebookText,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    let rawText = response.text;
    rawText = rawText.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch(e) {
      parsed = { questions: [{ question: "Error generating quiz.", options: ["A"], correctIndex: 0, explanation: "JSON parse failed." }] };
    }
    res.json(parsed);
  } catch (err) {
    console.error('Quiz API error:', err.message || err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz' });
  }
});

// ── Mental Health Feedback (Mental Health Key) ──
app.post('/api/mental-health', async (req, res) => {
  try {
    const { timetable, mood } = req.body;
    if (!timetable) return res.status(400).json({ error: 'Timetable data is required' });

    const systemPrompt = `You are an educational psychologist Mental Health Advisor module operating within a STEAM platform.
Your task is to analyze the student's timetable and provide algorithmic mental health advisory outputs.

Analyze for:
1. Cognitive Context Switching Overload (e.g., rapidly shifting between divergent logic frameworks like Chemistry to Algebra).
2. Ultradian Rhythm Violations (study blocks exceeding 90-120 minutes without breaks).
3. Rest and Consolidation Deficits (inadequate gaps between end of day and start of next day, harming REM/slow-wave sleep).

Format your response as a gentle, gamified intervention.
Include a wellness score out of 10.
Suggest specific timeline modifications (e.g., "Insert a 20-minute diffuse-mode walk here").
Format using markdown.`;

    const userMessage = `Here is the temporal matrix of the student's schedule:\n${JSON.stringify(timetable, null, 2)}\nMood: ${mood || 'Not provided'}\n\nProvide the advisory output.`;

    const response = await mentalHealthAI.models.generateContent({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5
      }
    });

    res.json({ feedback: response.text });
  } catch (err) {
    console.error('Mental Health API error:', err.message || err);
    res.status(500).json({ error: err.message || 'Failed to get wellness feedback' });
  }
});

export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n  🌊 Slip Stream Flawless AI Proxy running at http://localhost:${PORT}`);
    console.log(`     - Model: ${MODEL}`);
    console.log(`     - 4 Dedicated Google Clients Initialized\n`);
  });
}
