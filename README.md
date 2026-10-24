# SmartCart AI 🛒
### AI-Powered Grocery Comparison and Recommendation System

## 📌 Project Abstract

SmartCart AI is a software project that helps customers compare grocery products across local shops. It evaluates price, quantity, customer ratings, product quality indicators, and shop distance to recommend suitable purchasing options. It also enables shop owners to manage product listings, pricing, and stock availability. The application emphasizes data-driven decisions, location-aware recommendations, security, and modular software design.

## ✨ Key Features

- **🤖 Multi-Factor AI Recommendations:** Compares price, quantity, customer ratings, quality indicators, and shop distance to identify suitable products.
- **📊 Smart Value Analysis:** Evaluates quantity per unit of price rather than comparing prices alone.
- **📍 Location-Aware Comparison:** Uses customer and shop location details to consider proximity when recommending grocery options.
- **🛍️ Customer Shopping Cart:** Supports selecting and managing grocery products for purchase.
- **🏪 Shop Management:** Allows shop owners to manage product listings, prices, quantities, and stock availability.

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface and reusable components |
| TypeScript | Application logic with static typing |
| Vite | Development server and production build |
| Supabase | Authentication and backend services |
| PostgreSQL | Relational data storage |
| Git and GitHub | Version control and source-code management |
| Vercel | Frontend deployment and hosting |

## 🗓️ Project Development Timeline

The project was developed in six stages, with each stage focusing on a specific set of requirements and features.

```text
 09 JUL ─────────────── 23 JUL
 Requirements analysis, UI planning
 and database setup
          │
          ▼
 24 JUL ─────────────── 07 AUG
 Customer UI development
          │
          ▼
 08 AUG ─────────────── 22 AUG
 Shop-owner UI development
          │
          ▼
 23 AUG ─────────────── 06 SEP
 Product management and database integration
          │
          ▼
 07 SEP ─────────────── 21 SEP
 Multi-factor AI recommendations
          │
          ▼
 22 SEP ─────────────── 06 OCT
 Order summaries and related functionality
          │
          ▼
 07 OCT ─────────────── 21 OCT
 Testing, debugging and deployment
```

## 🔄 Software Development Journey

### 01 — Requirements Analysis and Initial Setup
**09 July – 23 July**

The development process began by identifying the needs of customers and shop owners and defining the main application workflows.

- Identified product comparison, shopping cart, and inventory management requirements.
- Planned the user interface and core database entities.
- Established the initial application structure and database setup.
- Identified the product attributes needed for meaningful recommendations, including price, quantity, ratings, and location.

**Outcome:** Defined the project scope and established the foundation for implementation.

### 02 — Customer Interface Development
**24 July – 07 August**

The customer-facing interface was developed around grocery discovery and purchasing decisions.

- Organized product information for browsing and comparison.
- Developed customer workflows for selecting products and managing a shopping cart.
- Planned how product prices, quantities, and ratings would be presented.
- Structured the interface around the customer's shopping requirements.

**Outcome:** Established the customer-facing workflow for discovering and comparing groceries.

### 03 — Shop-Owner Interface Development
**08 August – 22 August**

The shop-owner interface focused on maintaining shop-specific product information.

- Developed workflows for shop-owner operations.
- Structured the interface around shop details and product listings.
- Considered the information required to manage prices and available stock.
- Separated customer-facing operations from shop-management workflows.

**Outcome:** Established the shop-owner side of the application.

### 04 — Product Management and Database Integration
**23 August – 06 September**

Product management and persistent data storage were developed around the relationship between shops and their listings.

- Organized product, shop, and shop-product data in a relational structure.
- Integrated the application with Supabase and PostgreSQL.
- Used product attributes such as price, pack size, ratings, and stock in shop listings.
- Investigated database query and data-relationship issues during integration.

**Outcome:** Connected product and shop information to the application's data layer.

### 05 — Multi-Factor Recommendation Development
**07 September – 21 September**

The recommendation functionality was designed to evaluate multiple factors instead of choosing products solely by the lowest price.

- **Price:** Compare the cost of available product options.
- **Quantity:** Evaluate quantity offered relative to price.
- **Quality indicators:** Use customer ratings as an indicator of perceived product quality.
- **Distance:** Consider the customer's location relative to each shop.
- **Trade-offs:** Evaluate cases where a higher-rated or closer option may be preferable to a cheaper alternative.

**Outcome:** Developed the basis for multi-factor grocery recommendations.

*The recommendation description should match the actual implementation. If the logic uses deterministic scoring rules rather than a trained model or generative AI, it is more accurately described as a multi-factor recommendation engine.*

### 06 — Order Summaries, Testing and Deployment
**22 September – 21 October**

The final development stage focused on related shopping functionality, validation, debugging, and deployment.

- Worked on order summaries and related application workflows.
- Checked product records and shop-product relationships in the database.
- Investigated configuration and integration errors.
- Prepared the application for production hosting and configured the deployment environment.
- Addressed issues affecting product data consistency and application behavior.

**Outcome:** Completed the development cycle and deployed the application.

## 🔐 Security, Location and Software Design

### Security and Data Protection
- Uses Supabase authentication and database services.
- Requires appropriate database access policies and role-based permissions to protect customer and shop-owner data.
- Keeps privileged API keys and service-role credentials out of frontend code.
- Uses environment variables for application configuration.

*Security depends on the actual authentication setup, Row Level Security policies, and deployment configuration. These controls should be verified before describing the application as fully secure.*

### Location-Aware Recommendations 📍
- Stores or uses customer and shop location details for proximity comparisons.
- Allows recommendations to consider distance alongside price, quantity, and ratings.
- Supports trade-offs between nearby shops and potentially better-value options farther away.

Distance calculations depend on valid coordinates and the calculation method used. Straight-line distance and road distance are not equivalent.

### Encapsulation and Modular Design
- Organizes functionality into distinct application components and feature modules.
- Separates customer workflows from shop-owner workflows.
- Keeps product information, shop listings, and shopping-cart data organized into related database entities.
- Supports changes to individual features without requiring the entire application to be redesigned.

Encapsulation is reflected in the organization of application logic and components; stronger claims about private state, class-based encapsulation, or formal architectural patterns should depend on the actual code.

## 🧪 Testing and Maintenance

Testing and debugging focused on database consistency, product comparisons, application configuration, and recommendation scenarios involving different prices, quantities, ratings, and distances.

Future maintenance can include:

- Improving recommendation scoring and explanations.
- Expanding validation for incomplete or inconsistent product data.
- Improving access control and error handling.
- Refining the user experience and adding regression tests.

## 🚀 Deployment Status

**SmartCart AI is deployed on Vercel.**

The production application uses the configured frontend build and Supabase services. Deployment configuration, environment variables, database availability, and access policies remain important to the application's continued operation.

