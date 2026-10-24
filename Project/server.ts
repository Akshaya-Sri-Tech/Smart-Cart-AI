import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

/**
 * POST /api/ai-explanation
 * Generates a concise, factual 1-2 sentence AI explanation for a grocery recommendation.
 */
app.post('/api/ai-explanation', async (req, res) => {
  try {
    const { productName, topListing, otherListings } = req.body;

    if (!topListing) {
      return res.json({
        explanation: 'Select a product to view the recommendation rationale.',
        source: 'local',
      });
    }

    const { listing, scores } = topListing;
    const shopName = listing.shop?.shop_name || 'Selected Shop';
    const distText = scores.distanceKm !== null ? `${scores.distanceKm} km away` : 'nearby';

    // If Gemini client is available, ask Gemini to produce a clear, concise trade-off summary
    if (aiClient) {
      const othersSummary = (otherListings || [])
        .map(
          (o: any) =>
            `- ${o.listing.shop?.shop_name}: ₹${o.scores.unitPrice}/${o.scores.standardUnit}, ${o.scores.adjustedRating}★, ${o.scores.distanceKm ?? '?'}km`
        )
        .join('\n');

      const prompt = `You are the recommendation explainer for SmartCart AI grocery app.
Write a 1 to 2 sentence, strictly factual explanation of why this product listing is recommended over alternatives.
Mention key trade-offs between unit price, star rating, and distance.
Do NOT invent facts, do NOT claim guaranteed product quality, and keep it under 40 words.

Product: ${productName}
Top Recommended Listing:
- Shop: ${shopName}
- Unit Price: ₹${scores.unitPrice} per ${scores.standardUnit} (Package: ₹${listing.price} for ${listing.quantity_value} ${listing.quantity_unit})
- Adjusted Rating: ${scores.adjustedRating}★ (${listing.rating_count} reviews)
- Distance: ${distText}
- Overall Recommendation Score: ${scores.combinedScore}/100

Other Listings:
${othersSummary || 'No other listings available.'}

Response format: Plain text only, 1-2 sentences.`;

      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const explanationText = response.text?.trim();
        if (explanationText && explanationText.length > 5) {
          return res.json({
            explanation: explanationText,
            source: 'gemini',
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to local reasoning:', geminiError?.message || geminiError);
      }
    }

    // Deterministic local fallback
    let fallbackText = `Recommended from ${shopName} (${distText}) offering ₹${scores.unitPrice}/${scores.standardUnit} with a reliable ${scores.adjustedRating}★ rating.`;
    if (otherListings && otherListings.length > 0) {
      const lowestPrice = Math.min(
        scores.unitPrice,
        ...otherListings.map((o: any) => o.scores.unitPrice)
      );
      if (scores.unitPrice <= lowestPrice) {
        fallbackText = `Recommended for the lowest unit price (₹${scores.unitPrice}/${scores.standardUnit}) and convenient proximity (${distText}) with solid ${scores.adjustedRating}★ quality.`;
      }
    }

    return res.json({
      explanation: fallbackText,
      source: 'local',
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to generate explanation',
      details: err?.message || String(err),
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(aiClient),
    timestamp: new Date().toISOString(),
  });
});

// In development, mount Vite's dev server middleware
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartCart AI server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
