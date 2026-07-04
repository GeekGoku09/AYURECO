# PrakritiAI 🌿

PrakritiAI is a personalized, full-stack Ayurvedic Diet Recommender that maps your genetic mind-body constitution (**Prakriti**) and current active symptoms (**Vikriti**) to tailored clinical meal plans, spices, and lifestyle guides.

Leveraging the **Gemini 3.5 Flash model**, the application calculates real-time elemental imbalances and designs highly personalized culinary prescriptions that balance your system's unique spectrum of **Vata** (Air & Ether), **Pitta** (Fire & Water), and **Kapha** (Water & Earth).

---

## 🌟 Key Features

### 1. In-Depth Mind-Body Assessment (Prakriti Quiz)
- An interactive, 8-step baseline quiz analyzing physical frame, skin/hair texture, sleep qualities, appetite speed, stress responses, and cognitive stamina.
- Real-time computation of your inherent biological baseline constitution.

### 2. Immediate Diagnostic Symptom Checklist (Vikriti Imbalance)
- A clinical symptom selector spanning digestive, skin, emotional, and energy axes.
- Maps acute active stressors to calculate your exact current elevated state of disharmony.

### 3. Dynamic Element Matrix Chart
- Custom SVG-based visualization demonstrating the delicate contrast between your inherent genetic blueprint (Prakriti) versus active systemic stressors (Vikriti).
- Provides visual breakdowns of elements with corresponding clinical functions.

### 4. Custom AI-Generated Diet & Lifestyle Prescriptions
- **Circadian Food Sequence:** Full meal plan covering breakfast, lunch, dinner, and late-afternoon tea.
- **Favor & Avoid lists:** Easy-to-read lists of ingredients to target or limit with medical explanations.
- **Therapeutic Spices:** Interactive breakdowns of therapeutic herbs and spices to stoke your digestive fire (*Agni*).
- **Lifestyle & Dinacharya:** Practical habits, sleep, exercise, and custom herbal tea recipes.

### 5. Local History Manager & Reports Sandbox
- **Report History:** Save your diet charts securely to your local browser storage for easy retrieval.
- **Dosha Sandbox:** Experiment with element ratios and symptom combinations directly on the fly to see how the recommendations adapt dynamically.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18+ (TSX), Vite, Tailwind CSS, Lucide Icons, and Motion for modern fluid transitions.
- **Backend:** Express.js Server proxying secure API requests to hide sensitive credentials.
- **AI Core:** `@google/genai` Node.js SDK connecting server-side to the `gemini-3.5-flash` model.
- **Durable Local Storage:** Browser `localStorage` integration for persistent saved plans and historical reports.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** package manager
- **Gemini API Key:** Obtainable from Google AI Studio.

### 2. Installation
Install all dependencies listed in `package.json`:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and configure your secret key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 4. Development Server
Launch the development server running concurrently with the Vite hot-reloading dev environment on port `3000`:
```bash
npm run dev
```

### 5. Production Build
Build the optimized static frontend static assets and compile the server TypeScript into a self-contained CommonJS backend package:
```bash
npm run build
npm start
```

---

## 🍃 Ayurvedic Wisdom Core

| Dosha | Primary Elements | Physical Seat | Imbalance Symptoms (Vikriti) | Balancing Diet |
| :--- | :--- | :--- | :--- | :--- |
| **Vata** | Air & Ether | Colon, Nervous System | Bloating, Insomnia, Anxiety, Dry skin | Warm, moist, heavy, spiced, cooked foods |
| **Pitta** | Fire & Water | Small Intestine, Blood | Acidity, Skin rashes, Anger, Excess heat | Cooling, sweet, bitter, hydrating foods |
| **Kapha** | Water & Earth | Stomach, Lungs | Sluggishness, Congestion, Lethargy, Weight gain | Light, warm, dry, pungent, highly spiced foods |

> *"When diet is wrong, medicine is of no use. When diet is correct, medicine is of no need."* — Ancient Ayurvedic Proverb
