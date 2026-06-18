import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { POPULAR_TRAINS } from "./src/data/trains";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI Copilot will fall back to smart simulated responses.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Get all trains or search
app.get("/api/trains", (req, res) => {
  const query = (req.query.q as string || "").toLowerCase();
  if (query) {
    const filtered = POPULAR_TRAINS.filter(
      (t) =>
        t.number.includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.origin.toLowerCase().includes(query) ||
        t.destination.toLowerCase().includes(query)
    );
    res.json(filtered);
  } else {
    res.json(POPULAR_TRAINS);
  }
});

// 2. API: Get single train running status
app.get("/api/trains/:number", (req, res) => {
  const trainNum = req.params.number;
  const train = POPULAR_TRAINS.find((t) => t.number === trainNum);
  if (train) {
    res.json({ ...train, lastUpdated: new Date().toLocaleTimeString() });
  } else {
    res.status(404).json({ error: `Train number ${trainNum} not found.` });
  }
});

// 3. API: AI Companion / Copilot
app.post("/api/copilot", async (req, res) => {
  const { message, activeTrainNumber, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message prompt is required." });
  }

  const activeTrain = POPULAR_TRAINS.find(t => t.number === activeTrainNumber);
  const trainContextString = activeTrain
    ? `
Context of currently inspected Train:
- Train Number: ${activeTrain.number}
- Train Name: ${activeTrain.name}
- Route: ${activeTrain.origin} to ${activeTrain.destination}
- Distance: ${activeTrain.totalDistanceKm} km
- Status: ${activeTrain.isDelayed ? `Delayed by ${activeTrain.overallDelayMin} mins.` : "On Time."}
- Last speed: ${activeTrain.currentSpeedKmph} km/h
- Stops info:
${activeTrain.stops
  .map(
    (s) =>
      `  * Station Code: ${s.station.code} (${s.station.name}, ${s.station.state}), Scheduled Arrival: ${s.scheduledArrival}, Scheduled Departure: ${s.scheduledDeparture}, Actual Arrival: ${s.actualArrival}, Actual Departure: ${s.actualDeparture}, Delay: ${s.arrivalDelayMin} mins delay (Platform ${s.platformNo}).`
  )
  .join("\n")}
`
    : "No parsed train is currently active. Provide general travel advice for Indian Railways.";

  const systemInstruction = `
You are the "Indian Railways AI Travel Copilot", an exceptionally smart, friendly, and practical train journey assistant.
Your goal is to answer train running queries, explain potential delay causes (such as dense fog, track maintenance near major junctions, signaling upgrades, or heavy passenger traffic near holidays), predict delay catch-up or propagation, suggest catering/food orders at upcoming stations, platform guide info, or safety measures.

Rules:
- Keep answers highly structured, practical, engaging, and empathetic to travelers.
- Use clear visual formatting, short paragraphs, lists, and bold headers.
- If referencing a station, name its state or code.
- If GEMINI_API_KEY is placeholder or mock, provide a rich, knowledgeable response anyway.
- Strictly adhere to being concise and professional. Avoid tech-jargon or larping coordinates/telemetry unless directly asked for train physics.
`;

  const prompt = `
=== TRAIN REAL-TIME CONTEXT ===
${trainContextString}
===============================

=== HISTORICAL CHAT HISTORY ===
${history ? JSON.stringify(history) : "No previous messages in this thread."}

=== CURRENT USER PASSENGER QUERY ===
User asks: "${message}"
`;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("MY_GEMINI_API_KEY") || key === "MOCK_KEY") {
      // Simulate rich responsive intelligence if key is missing or dummy
      const lower = message.toLowerCase();
      let responseText = `🇮🇳 *Indian Railways Copilot Status Update:*\n\n`;
      if (activeTrain) {
        if (lower.includes("delay") || lower.includes("late") || lower.includes("time")) {
          responseText += `Based on current signals, **${activeTrain.name} (${activeTrain.number})** is ${
            activeTrain.isDelayed ? `experiencing a minor delay of about ${activeTrain.overallDelayMin} minutes.` : "running perfectly on schedule!"
          }\n\n**Copilot Delay Propagation Analysis:**\n` +
            `- **Signal Route Congestion:** The section leading towards ${activeTrain.stops.find(s => s.status === 'upcoming')?.station.name || 'upcoming station'} has standard traffic routing.\n` +
            `- **Catch-up Probability:** High. The train has standard cushion times between subsequent sections and can easily cover the minor lag if speeds hit the standard ${activeTrain.currentSpeedKmph} km/h.\n` +
            `- **What to do:** Sit back and enjoy. Check the live map to see when you'll reach the platform!`;
        } else if (lower.includes("food") || lower.includes("eat") || lower.includes("dinner") || lower.includes("lunch")) {
          responseText += `For **${activeTrain.name}**, you have excellent options:\n\n` +
            `- **On-board Catering:** Standard pantry car meals, tea, and local cutlets are served.\n` +
            `- **e-Catering Recommendation:** You can order fresh hot food online (such as Biryani or Paneer Thali) to be delivered directly to your berth when the train hits major halt stations like **Kanpur Central (CNB)** or **Prayagraj Jn (PRYJ)**!\n` +
            `- **Local Specially:** Don't miss the local hot tea (Kullhad Chai) at upcoming stations!`;
        } else {
          responseText += `Greetings traveler! I am tracking your journey on **${activeTrain.name} (${activeTrain.number})**. \n\n` +
            `I can help you analyze delay propagation, predict platform numbers, suggest hot local foods at upcoming halts, and update you on the current station milestones. What would you like to know?`;
        }
      } else {
        responseText += `I am here to assist you with Indian Railways travel. We can search and track trains like the **Vande Bharat Express (22436)** or **Howrah Rajdhani (12301)**. Please let me know what you'd like to ask or inspect!`;
      }
      return res.json({ text: responseText });
    }

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in server.ts:", error);
    res.status(500).json({ error: `AI Query error: ${error.message || error}` });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
