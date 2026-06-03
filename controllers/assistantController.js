import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Load and cache RAG context (venues + photos + cities) ───────────────────
let cachedContext = null;

function loadRAGContext() {
  if (cachedContext) return cachedContext;

  try {
    const assetsDir = path.join(__dirname, '..', 'assets');
    const venuesPath = path.join(assetsDir, 'venues.json');
    const photosPath = path.join(assetsDir, 'venue_photos.json');
    const bhPath = path.join(assetsDir, 'bh.json');

    const venues = fs.existsSync(venuesPath) ? JSON.parse(fs.readFileSync(venuesPath, 'utf8')) : [];
    const photos = fs.existsSync(photosPath) ? JSON.parse(fs.readFileSync(photosPath, 'utf8')) : [];
    const bh = fs.existsSync(bhPath) ? JSON.parse(fs.readFileSync(bhPath, 'utf8')) : {};

    // Group photos by venueId
    const photosMap = {};
    for (const photo of photos) {
      if (!photosMap[photo.venueId]) photosMap[photo.venueId] = [];
      photosMap[photo.venueId].push(photo);
    }

    // Embed photos and cities inside the venues data for RAG context
    const venuesWithDetails = venues.map(v => {
      const venuePhotos = (photosMap[v.id] || []).map(p => ({
        url: p.url,
        caption: p.caption,
        captionAr: p.captionAr,
        isPrimary: p.isPrimary
      }));
      return {
        id: v.id,
        name: v.name,
        nameAr: v.nameAr,
        type: v.type,
        city: v.city,
        cityAr: v.cityAr,
        capacity: v.capacity,
        minCapacity: v.minCapacity,
        pricePerPerson: v.pricePerPerson,
        basePrice: v.basePrice,
        rating: v.rating,
        amenities: v.amenities,
        description: v.description,
        descriptionAr: v.descriptionAr,
        photos: venuePhotos
      };
    });

    cachedContext = {
      venues: venuesWithDetails,
      cities: bh.BahrainCities || []
    };
  } catch (err) {
    console.error('❌ Failed to load RAG context:', err);
    cachedContext = { venues: [], cities: [] };
  }

  return cachedContext;
}

/**
 * POST /api/assistant/chat
 *
 * Real Gemini-powered AI assistant with RAG using local venues, photos, and cities.
 */
export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'message field is required.',
      });
    }

    const apiKey = process.env.GOOGLE_STUDIO_API;
    if (!apiKey) {
      console.error('❌ GOOGLE_STUDIO_API is not set in backend environment variables.');
      return res.status(500).json({
        success: false,
        message: 'AI Assistant is currently unavailable. Please check backend config.',
      });
    }

    // Initialize Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const ragContext = loadRAGContext();

    const prompt = `
You are the official AI Wedding Assistant for the "Qa3at" (قعات) platform in Bahrain.
Your role is to help users search, filter, compare, and recommend wedding venues in Bahrain.

We have a database containing the following venues (with embedded photo URLs and details) and cities:
---
CITIES IN BAHRAIN:
${JSON.stringify(ragContext.cities)}

VENUES DATA (with pricing, ratings, capacities, and photo URLs):
${JSON.stringify(ragContext.venues)}
---

GUIDELINES:
1. Analyze the user's query: "${message}".
2. Support both Arabic and English. Respond in the same language the user queried in.
3. Formulate a polite, helpful, and natural response ("reply").
4. Filter, sort, and recommend the best venues from the database based on the query:
   - Rank and sort venues from most expensive to cheapest, or cheapest to most expensive, or by luxury rating, depending on user request.
   - Filter by city matching names or locations.
   - Filter by guest count capacity.
   - You can describe what the venues look like since you have access to their photos URLs and captions.
5. If the query does not ask for venues (e.g. greeting), return an empty array for recommendations. Otherwise, recommend up to 3 most relevant venues.
6. The output MUST be a JSON object matching this exact schema:
{
  "reply": "Your natural language response here (in Arabic or English, matching the query language)",
  "recommendations": [
    {
      "venueId": "string (must match the 'id' of the venue in the JSON database)",
      "venueName": "string (the English name of the venue)",
      "venueNameAr": "string (the Arabic name of the venue)",
      "tier": "string (either 'BUDGET', 'BALANCED', or 'LUXURY')",
      "reason": "string (brief explanation why this venue fits, in English)",
      "reasonAr": "string (brief explanation why this venue fits, in Arabic)",
      "estimatedTotal": 1500.0 (number - estimated total price based on basePrice or pricePerPerson * guestCount)
    }
  ]
}

Respond ONLY with the raw JSON object. Do not include markdown wraps like \`\`\`json.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON. Raw response:', responseText);
      // Fallback response if JSON parsing fails
      jsonResponse = {
        reply: "Sorry, I encountered an issue formatting my recommendations. Please try asking again.",
        recommendations: []
      };
    }

    res.status(200).json({
      success: true,
      data: jsonResponse,
    });
  } catch (error) {
    console.error('❌ AI Assistant chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message.',
      error: error.message
    });
  }
};
