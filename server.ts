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

// Robust fallback & retry mechanism across multiple Gemini model variations (2.5-flash is stable, 1.5-flash is robust, 3.5-flash is experimental)
async function generateContentWithRetry(
  client: GoogleGenAI,
  config: {
    contents: any;
    systemInstruction?: string;
    responseMimeType?: string;
  }
): Promise<any> {
  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    let attempts = 2; // Try up to 2 times for each model
    while (attempts > 0) {
      try {
        console.log(`[AI Satellites] Requesting content with model: ${modelName} (${attempts} attempts left for this model)...`);
        const response = await client.models.generateContent({
          model: modelName,
          contents: config.contents,
          config: {
            ...(config.systemInstruction ? { systemInstruction: config.systemInstruction } : {}),
            ...(config.responseMimeType ? { responseMimeType: config.responseMimeType } : {}),
          }
        });
        if (response) {
          console.log(`[AI Satellites] Success using model: ${modelName}`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Satellites WARNING] Model ${modelName} call failed (attempts remaining: ${attempts - 1}):`, err.message || err);
        attempts--;
        if (attempts > 0) {
          // Wait 1000ms before triggering the second attempt
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }
  
  throw lastError || new Error("All generative satellite fallback models failed");
}

// Declare active trains list stateful on the server
let activeTrainsList = [...POPULAR_TRAINS];

const REALISTIC_INDIAN_STATIONS = [
  { code: "NDLS", name: "New Delhi", state: "Delhi", lat: 28.6415, lon: 77.2193 },
  { code: "CNB", name: "Kanpur Central", state: "Uttar Pradesh", lat: 26.4547, lon: 80.3497 },
  { code: "PRYJ", name: "Prayagraj Jn", state: "Uttar Pradesh", lat: 25.4497, lon: 81.8284 },
  { code: "DDU", name: "Pt Deen Dayal Upadhyaya Jn", state: "Uttar Pradesh", lat: 25.2818, lon: 83.0232 },
  { code: "GAYA", name: "Gaya Jn", state: "Bihar", lat: 24.8016, lon: 84.9994 },
  { code: "HWH", name: "Howrah Jn", state: "West Bengal", lat: 22.5834, lon: 88.3415 },
  { code: "KOTA", name: "Kota Jn", state: "Rajasthan", lat: 25.2138, lon: 75.8648 },
  { code: "RTM", name: "Ratlam Jn", state: "Madhya Pradesh", lat: 23.3323, lon: 74.9542 },
  { code: "BRC", name: "Vadodara Jn", state: "Gujarat", lat: 22.3106, lon: 73.1812 },
  { code: "ST", name: "Surat", state: "Gujarat", lat: 21.2044, lon: 72.8406 },
  { code: "MMCT", name: "Mumbai Central", state: "Maharashtra", lat: 18.9696, lon: 72.8193 },
  { code: "MTJ", name: "Mathura Jn", state: "Uttar Pradesh", lat: 27.4924, lon: 77.6743 },
  { code: "AGC", name: "Agra Cantt", state: "Uttar Pradesh", lat: 27.1587, lon: 77.9944 },
  { code: "GWL", name: "Gwalior Jn", state: "Madhya Pradesh", lat: 26.2163, lon: 78.1884 },
  { code: "VGLJ", name: "VGL Jhansi Jn", state: "Uttar Pradesh", lat: 25.4484, lon: 78.5685 },
  { code: "BPL", name: "Bhopal Jn", state: "Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  { code: "RKMP", name: "Rani Kamlapati", state: "Madhya Pradesh", lat: 23.2081, lon: 77.4526 },
  { code: "SBC", name: "KSR Bengaluru City", state: "Karnataka", lat: 12.9779, lon: 77.5697 },
  { code: "MAS", name: "MGR Chennai Central", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  { code: "SC", name: "Secunderabad Jn", state: "Telangana", lat: 17.4344, lon: 78.5017 },
  { code: "BZA", name: "Vijayawada Jn", state: "Andhra Pradesh", lat: 16.5186, lon: 80.6201 },
  { code: "NGP", name: "Nagpur Jn", state: "Maharashtra", lat: 21.1524, lon: 79.0882 },
  { code: "ET", name: "Itarsi Jn", state: "Madhya Pradesh", lat: 22.6241, lon: 77.7289 },
  { code: "TVC", name: "Thiruvananthapuram Central", state: "Kerala", lat: 8.4879, lon: 76.9515 },
  { code: "ERS", name: "Ernakulam Jn", state: "Kerala", lat: 9.9634, lon: 76.2954 },
  { code: "PNBE", name: "Patna Jn", state: "Bihar", lat: 25.6022, lon: 85.1376 },
  { code: "LKO", name: "Lucknow Charbagh NR", state: "Uttar Pradesh", lat: 26.8322, lon: 80.9234 }
];

// Helper to calculate general distance between coordinates (Haversine formula in km)
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function generateProceduralTrain(queryOrNumber: string): any {
  const cleaned = queryOrNumber.trim();
  const trainNum = /^\d+$/.test(cleaned) ? cleaned : "1" + (Math.floor(Math.random() * 9000) + 1000);
  
  let type = "Express";
  if (trainNum.startsWith("22") || trainNum.startsWith("20")) {
    type = "Vande Bharat";
  } else if (trainNum.startsWith("12") && Math.random() > 0.5) {
    type = "Rajdhani";
  } else if (trainNum.startsWith("12")) {
    type = "Shatabdi";
  }

  const nameCandidates = [
    "Garib Rath Express",
    "Duronto Express",
    "Jan Shatabdi Express",
    "Superfast Express",
    "Mail Special",
    "Humsafar Express"
  ];
  
  let name = type === "Vande Bharat" ? "Vande Bharat Express" : type === "Rajdhani" ? "Rajdhani Express" : type === "Shatabdi" ? "Shatabdi Express" : nameCandidates[Math.floor(Math.random() * nameCandidates.length)];
  if (!/^\d+$/.test(cleaned)) {
    name = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    if (!name.toLowerCase().includes("express") && !name.toLowerCase().includes("mail")) {
      name += " Express";
    }
  } else {
    const prefixes = ["Golden Temple", "Grand Trunk", "Kerala Mail", "Coromandel", "Deccan Queen", "Taj", "Gitanjali", "Pushpak", "Ganga Kaveri", "Sampark Kranti"];
    name = prefixes[Math.floor(Math.random() * prefixes.length)] + " " + name;
  }

  // Choose route origin & destination
  let startIdx = Math.floor(Math.random() * REALISTIC_INDIAN_STATIONS.length);
  let endIdx = (startIdx + 7) % REALISTIC_INDIAN_STATIONS.length;
  if (startIdx === endIdx) {
    endIdx = (startIdx + 1) % REALISTIC_INDIAN_STATIONS.length;
  }
  
  const startStation = REALISTIC_INDIAN_STATIONS[startIdx];
  const endStation = REALISTIC_INDIAN_STATIONS[endIdx];

  const isLatMajor = Math.abs(startStation.lat - endStation.lat) > Math.abs(startStation.lon - endStation.lon);
  let candidates = REALISTIC_INDIAN_STATIONS.filter(s => s.code !== startStation.code && s.code !== endStation.code);
  
  if (isLatMajor) {
    const minLat = Math.min(startStation.lat, endStation.lat);
    const maxLat = Math.max(startStation.lat, endStation.lat);
    candidates = candidates.filter(s => s.lat >= minLat && s.lat <= maxLat);
    candidates.sort((a, b) => startStation.lat < endStation.lat ? a.lat - b.lat : b.lat - a.lat);
  } else {
    const minLon = Math.min(startStation.lon, endStation.lon);
    const maxLon = Math.max(startStation.lon, endStation.lon);
    candidates = candidates.filter(s => s.lon >= minLon && s.lon <= maxLon);
    candidates.sort((a, b) => startStation.lon < endStation.lon ? a.lon - b.lon : b.lon - a.lon);
  }

  const intermediate = candidates.slice(0, 3);
  const route = [startStation, ...intermediate, endStation];

  let currentDist = 0;
  let sHour = 6 + Math.floor(Math.random() * 8);
  let sMin = 0;

  const stops = route.map((st, idx) => {
    const isSource = idx === 0;
    const isDest = idx === route.length - 1;

    if (idx > 0) {
      const prev = route[idx - 1];
      const dist = calculateHaversineKm(prev.lat, prev.lon, st.lat, st.lon);
      currentDist += dist;
      
      const travelMins = Math.round((dist / 75) * 60) + 15;
      sMin += travelMins;
      sHour += Math.floor(sMin / 60);
      sMin = sMin % 60;
    }

    const arrStr = isSource ? "Source" : `${String(sHour % 24).padStart(2, "0")}:${String(sMin).padStart(2, "0")}`;
    const halt = isSource || isDest ? 0 : 5 + Math.floor(Math.random() * 5);
    
    let depHour = sHour;
    let depMin = sMin + halt;
    depHour += Math.floor(depMin / 60);
    depMin = depMin % 60;

    const depStr = isDest ? "Destination" : `${String(depHour % 24).padStart(2, "0")}:${String(depMin).padStart(2, "0")}`;

    const delay = isSource ? 0 : Math.floor(Math.random() * 20);

    let actArrHour = sHour;
    let actArrMin = sMin + delay;
    actArrHour += Math.floor(actArrMin / 60);
    actArrMin = actArrMin % 60;
    const actArrStr = isSource ? "Source" : `${String(actArrHour % 24).padStart(2, "0")}:${String(actArrMin).padStart(2, "0")}`;

    let actDepHour = depHour;
    let actDepMin = depMin + delay;
    actDepHour += Math.floor(actDepMin / 60);
    actDepMin = actDepMin % 60;
    const actDepStr = isDest ? "Destination" : `${String(actDepHour % 24).padStart(2, "0")}:${String(actDepMin).padStart(2, "0")}`;

    return {
      station: {
        code: st.code,
        name: st.name,
        state: st.state,
        latitude: st.lat,
        longitude: st.lon
      },
      scheduledArrival: arrStr,
      scheduledDeparture: depStr,
      actualArrival: actArrStr,
      actualDeparture: actDepStr,
      departureDelayMin: delay,
      arrivalDelayMin: delay,
      distanceKm: currentDist,
      status: idx === 0 ? "passed" : "upcoming",
      platformNo: Math.floor(Math.random() * 4) + 1
    };
  });

  return {
    number: trainNum,
    name: name,
    type: type,
    origin: `${startStation.name} (${startStation.code})`,
    destination: `${endStation.name} (${endStation.code})`,
    totalDistanceKm: currentDist,
    runningDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    currentSpeedKmph: type === "Vande Bharat" ? 110 : 80,
    isDelayed: Math.random() > 0.4,
    overallDelayMin: Math.floor(Math.random() * 15) + 3,
    lastUpdated: new Date().toLocaleTimeString(),
    stops: stops
  };
}

// 1. API: Get all trains or search
app.get("/api/trains", (req, res) => {
  const query = (req.query.q as string || "").toLowerCase();
  if (query) {
    const filtered = activeTrainsList.filter(
      (t) =>
        t.number.includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.origin.toLowerCase().includes(query) ||
        t.destination.toLowerCase().includes(query)
    );
    res.json(filtered);
  } else {
    res.json(activeTrainsList);
  }
});

// 2. API: Get single train running status
app.get("/api/trains/:number", (req, res) => {
  const trainNum = req.params.number;
  const train = activeTrainsList.find((t) => t.number === trainNum);
  if (train) {
    res.json({ ...train, lastUpdated: new Date().toLocaleTimeString() });
  } else {
    res.status(404).json({ error: `Train number ${trainNum} not found.` });
  }
});

// 3. API: Dynamic Search / Generation using Gemini or procedural fallback
app.post("/api/trains/search-dynamic", async (req, res) => {
  const { query } = req.body;
  if (!query || String(query).trim().length === 0) {
    return res.status(400).json({ error: "Search query is required." });
  }

  const cleanedQuery = String(query).trim();
  
  // Check if already in activeTrainsList
  const existing = activeTrainsList.find(
    (t) =>
      t.number === cleanedQuery ||
      t.name.toLowerCase().includes(cleanedQuery.toLowerCase())
  );
  if (existing) {
    return res.json({ success: true, train: existing, isNew: false });
  }

  // Otherwise, construct a new train on-the-fly dynamically!
  console.log(`Starting dynamic search/generation for "${cleanedQuery}"...`);

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("MY_GEMINI_API_KEY") || key === "MOCK_KEY") {
      // Missing API key, trigger awesome procedural fallback immediately
      const generated = generateProceduralTrain(cleanedQuery);
      activeTrainsList.push(generated);
      return res.json({ success: true, train: generated, isNew: true });
    }

    const client = getGeminiClient();
    const prompt = `
      You are an expert Indian Railways timetabling database. Generate a detailed, highly accurate running schedule and stops for the train: "${cleanedQuery}".
      You must respond with raw JSON only (do not include any markdown backticks or commentary). The JSON must exactly match this TypeScript structure:

      {
        "number": "string (5-digit number, e.g. '12626')",
        "name": "string (full name of train, e.g. 'Kerala Express')",
        "type": "string (one of: Rajdhani, Shatabdi, Vande Bharat, Duronto, Garib Rath, Express)",
        "origin": "string (station and code, e.g. 'Trivandrum Central (TVC)')",
        "destination": "string (station and code, e.g. 'New Delhi (NDLS)')",
        "totalDistanceKm": number,
        "runningDays": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "currentSpeedKmph": number,
        "isDelayed": boolean,
        "overallDelayMin": number,
        "stops": [
          {
            "station": {
              "code": "string (3-4 letters uppercase)",
              "name": "string (station proper name)",
              "state": "string (Indian state name)",
              "latitude": number (valid real latitude in India between 8.0 and 36.0),
              "longitude": number (valid real longitude in India between 68.0 and 97.0)
            },
            "scheduledArrival": "string (HH:MM or Source)",
            "scheduledDeparture": "string (HH:MM or Destination)",
            "actualArrival": "string (HH:MM or Source)",
            "actualDeparture": "string (HH:MM or Destination)",
            "departureDelayMin": number,
            "arrivalDelayMin": number,
            "distanceKm": number (cumulative distance in km starting from 0),
            "status": "string (either 'passed' or 'upcoming')",
            "platformNo": number
          }
        ]
      }

      Ensure:
      1. Provide between 4 and 8 chronological stops.
      2. If this is a real train, use its actual real route stops and station codes!
      3. Use real geographical lat/lon coordinates inside India for each station code so it renders correctly on a map.
      4. Make sure coordinates are logical (do not jump forward and back randomly).
    `;

    const aiResponse = await generateContentWithRetry(client, {
      contents: prompt,
      responseMimeType: "application/json"
    });

    let outputText = aiResponse.text || "{}";
    // Sanitize any markdown JSON block wrapping returned by old/spiky models
    if (outputText.includes("```")) {
      outputText = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    const generated = JSON.parse(outputText);

    if (generated && generated.number && generated.stops && generated.stops.length > 0) {
      // Set lastUpdated
      generated.lastUpdated = new Date().toLocaleTimeString();
      activeTrainsList.push(generated);
      return res.json({ success: true, train: generated, isNew: true, isProcedural: false });
    }

    throw new Error("Invalid structure returned from model");
  } catch (err: any) {
    console.warn("[Copilot warning] Gemini dynamic search failed or received 503, fallback procedurally generated:", err.message || err);
    const fallback = generateProceduralTrain(cleanedQuery);
    activeTrainsList.push(fallback);
    res.json({ success: true, train: fallback, isNew: true, isProcedural: true });
  }
});

// 4. API: AI Companion / Copilot
app.post("/api/copilot", async (req, res) => {
  const { message, activeTrainNumber, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message prompt is required." });
  }

  const activeTrain = activeTrainsList.find(t => t.number === activeTrainNumber);
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
    const response = await generateContentWithRetry(client, {
      contents: prompt,
      systemInstruction,
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
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { overlay: false },
        watch: isHmrDisabled ? null : {},
      },
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
