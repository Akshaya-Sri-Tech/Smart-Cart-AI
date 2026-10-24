# SmartCart AI — Intelligent Grocery Recommendation Application

SmartCart AI helps grocery shoppers identify the most sensible product purchase by mathematically evaluating three key factors:

1. **Product Quality (40%):** Bayesian-adjusted star rating `(n × R + m × C) / (n + m)` with prior rating `C = 3.5` and prior weight `m = 5`.
2. **Quantity-for-Price Value (40%):** Standardized unit price normalization (grams to kg, ml to liters, count) compared across competing shop listings.
3. **Shop Proximity (20%):** Haversine great-circle distance with a hyperbolic proximity decay function `100 / (1 + distanceKm × 0.12)`.

---

## 1. Demo Accounts (Ready to Test)

The database is pre-seeded with 1 customer, 3 shop owners, 3 shops, and 10 grocery items across 22 shop listings. You can use the **1-Click Demo Buttons** on `/login` or enter the credentials below:

| Role | Email | Password | Location / Coordinates |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `password123` | Indiranagar, Bangalore (12.9784°N, 77.6408°E) |
| **Owner 1 (Green Basket)** | `owner1@example.com` | `password123` | 100ft Road, Indiranagar (0.7 km away) |
| **Owner 2 (Fresh Daily)** | `owner2@example.com` | `password123` | Domlur (1.9 km away) |
| **Owner 3 (Metro Supermarket)** | `owner3@example.com` | `password123` | Whitefield (11.8 km away) |

---

## 2. Windows Local Setup Instructions

### Prerequisites
- **Node.js**: Version 18 or higher (download from [nodejs.org](https://nodejs.org/)).
- **Git**: Download from [git-scm.com](https://git-scm.com/).

### Installation Steps (PowerShell / Command Prompt)

```powershell
# 1. Clone or navigate to the repository directory
cd smartcart-ai

# 2. Copy the environment variables example
copy .env.example .env

# 3. Install dependencies
npm install

# 4. Run unit tests to verify pure mathematical recommendation logic
npm test

# 5. Start the local full-stack server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 3. Configuring Supabase and Gemini

### Supabase Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run `supabase/schema.sql` to create the 6 tables, foreign keys, indexes, and Row Level Security policies.
3. Run `supabase/seed.sql` to populate the demo shops, products, and listings.
4. Copy your **Project URL** and **Anon Public Key** from *Project Settings > API*.
5. Paste them in your `.env` file:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

*Note: SmartCart AI includes an automatic in-memory / persistent repository fallback that allows the application to run out-of-the-box with full cart submission and shop owner synchronization even before Supabase keys are configured.*

### Google Gemini API Setup
1. Get an API key from [Google AI Studio](https://aistudio.google.com/).
2. In `.env`, set:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```
3. The server endpoint `POST /api/ai-explanation` queries `gemini-3.8-flash` to synthesize concise 1-2 sentence trade-off summaries based purely on the calculated numerical scores. If the key is omitted, it falls back seamlessly to deterministic local trade-off reasoning.

---

## 4. Verification and Acceptance Checklist

- [x] **Customer Authentication**: Customer can sign up, log in, and view only the customer discovery and cart interfaces.
- [x] **Owner Authentication**: Shop owner logs in and accesses only their store's owner portal (`/owner`).
- [x] **Grocery Catalog & Comparison**: All 10 grocery items can be compared side-by-side across all 3 local shops with unit rates.
- [x] **Deterministic Recommendation Engine**: Bayesian rating, unit price value, and Haversine distance scoring (verified via 9 automated unit tests).
- [x] **Single-Shop Cart Policy**: Prevents mixing products from different shops in one order request, with clear confirmation prompt.
- [x] **Order Request Submission**: Atomically validates stock, decrements inventory, and assigns submitted status.
- [x] **Shop Owner Visibility**: Submitted customer carts appear in real time in the corresponding shop owner's dashboard with customer delivery location, item breakdown, and total.
- [x] **Design & Theme**: White + green theme (`#F8FBF8`, `#218838`), Lora headings, Arial body text, minimum font size 14px, responsive on mobile and desktop.
