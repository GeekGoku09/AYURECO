import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Shared function to instantiate the GoogleGenAI client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in the Secrets panel in AI Studio Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint for Ayurvedic Diet Recommendations
  app.post("/api/recommend", async (req, res) => {
    try {
      const { prakritiScores, selectedSymptoms, selectedSymptomTexts, personalization } = req.body;

      if (!prakritiScores) {
        return res.status(400).json({ error: "Missing prakritiScores parameter." });
      }

      // Check if GEMINI_API_KEY is available. If not, return a structured fallback response.
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not configured. Falling back to local algorithmic recommendations.");
        return res.status(200).json({
          isFallback: true,
          message: "No Gemini API key detected. Showing standard recommendation based on your primary dosha."
        });
      }

      const client = getAiClient();

      // Ensure robust personalization defaults if not passed
      const profile = personalization || {
        age: 30,
        sex: "Female",
        season: "Summer",
        climate: "Moderate",
        occupation: "Desk Job (Sedentary)",
        symptomSeverity: "Mild",
        eatingSchedule: "Regular 3 Meals",
        allergies: [],
        constitutionHistory: "Not sure / Calculate"
      };

      const prompt = `
        You are an expert Ayurvedic Physician, Nutritionist, and Diet Recommender System.
        Analyze the following user data to produce a deeply personalized Ayurvedic Diet and Lifestyle Recommendation.

        User Body Type (Prakriti Baseline) distribution scores:
        - Vata: ${prakritiScores.vata}
        - Pitta: ${prakritiScores.pitta}
        - Kapha: ${prakritiScores.kapha}

        User Current Symptoms (indicating active Vikriti imbalance):
        ${selectedSymptomTexts && selectedSymptomTexts.length > 0 
          ? selectedSymptomTexts.map((s: string) => `- ${s}`).join("\n") 
          : "No specific symptoms reported (balanced state)."}

        Deep Personalization Profile:
        - Age: ${profile.age} (Determine their Ayurvedic stage of life: Childhood/Kapha Kaala, Adulthood/Pitta Kaala, or Elderhood/Vata Kaala, and adapt your advice).
        - Sex: ${profile.sex}
        - Current Season: ${profile.season}
        - Current Climate: ${profile.climate}
        - Occupation/Daily Pace: ${profile.occupation}
        - Severity of Symptoms: ${profile.symptomSeverity} (If moderate or severe, focus heavily on easily digestible, healing foods).
        - Eating Schedule: ${profile.eatingSchedule}
        - Food Allergies, Cuisine & Diet Restrictions: ${profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(", ") : "None"}
        - Known Constitution History (Baseline Record): ${profile.constitutionHistory}

        Task:
        1. Calculate their Primary Dosha (highest score) and Secondary Dosha.
        2. Assess their current imbalances (Vikriti) based on the reported symptoms, and modulate recommendation severity based on symptomSeverity (${profile.symptomSeverity}).
        3. Formulate a personalized diet plan containing:
           - Beneficial foods (specific items with explanations, strictly respecting their food restrictions/allergies and preferred cuisine styles)
           - Foods to avoid (with reasons)
           - Key spices and herbs that are highly therapeutic for their constitution, season, and climate
           - A structured daily representative meal plan (breakfast, lunch, dinner, snacks)
           - A complete, highly structured WEEKLY diet plan (7 days from Monday to Sunday).
             IMPORTANT: The weekly plan MUST center heavily on highly authentic, traditional Ayurvedic Indian dishes suited to their constitution, active symptoms, eating schedule, and allergies.
             CRITICAL FOOD RESTRICTION LAWS:
             * If 'Gluten-free' is requested, do NOT suggest whole wheat, chapatis, rotis, sooji, or semolina. Suggest alternatives like buckwheat (Kuttu), millet (Ragi, Bajra, Jowar), or rice-based flatbreads.
             * If 'Lactose-free' or 'Vegan' is selected, do NOT suggest ghee, milk, cow curd, paneer, or buttermilk. Recommend sesame oil, coconut milk, almond milk, tofu, or dairy-free replacements.
             * If 'Sattvik' is selected, do NOT include onions, garlic, or excessive heat/chillies.
             * If 'South Indian' is selected, lean heavily on classics like Ragi Idli, Pesarattu (moong dal crepe), lemon-ginger rice, Avial, Rasam, and coconut-based light curries.
             * If 'North Indian' is selected, suggest dals (moong, masoor), vegetable sabzis (lauki, turai, kaddu), khichdi, and compatible rotis.
             * If 'Western Cuisine' is selected, suggest warm baked oats, roasted root vegetables, cooked quinoa bowls, herbal stews, pumpkin soups, and cooked apples with cinnamon.
             Ensure dishes used in Monday-Sunday are tailored to these choices.
        4. Provide supportive lifestyle/Dinacharya recommendations (daily habits, sleep, exercise) to balance their unique constitution, age stage, and occupation.

        Rules:
        - Write in an encouraging, comforting, and highly professional Ayurvedic healer's tone.
        - Ensure all foods, spices, and advice match classic Ayurvedic principles (e.g., warm, cooked, moist foods for Vata; cooling, sweet, bitter foods for Pitta; light, dry, stimulating spices for Kapha).
      `;

      // Define the rigid response schema matching our DietRecommendation interface
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional Ayurvedic Vaidya (doctor) and ML diet recommender. You must strictly output JSON matching the provided schema, with precise advice tailored to the user's specific Prakriti and Vikriti.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryDosha: { 
                type: Type.STRING, 
                description: "Must be exactly 'Vata', 'Pitta', or 'Kapha'." 
              },
              secondaryDosha: { 
                type: Type.STRING, 
                description: "Must be 'Vata', 'Pitta', 'Kapha', or 'None'." 
              },
              prakritiDistribution: {
                type: Type.OBJECT,
                properties: {
                  vata: { type: Type.INTEGER },
                  pitta: { type: Type.INTEGER },
                  kapha: { type: Type.INTEGER }
                },
                required: ["vata", "pitta", "kapha"]
              },
              vikritiImbalance: {
                type: Type.OBJECT,
                properties: {
                  vata: { type: Type.INTEGER, description: "Calculated current Vata imbalance percentage (0-100)" },
                  pitta: { type: Type.INTEGER, description: "Calculated current Pitta imbalance percentage (0-100)" },
                  kapha: { type: Type.INTEGER, description: "Calculated current Kapha imbalance percentage (0-100)" }
                },
                required: ["vata", "pitta", "kapha"]
              },
              analysis: { 
                type: Type.STRING, 
                description: "Deep, customized Mind-Body Analysis. Relate their baseline Prakriti scores with their current symptoms (Vikriti) and explain what is causing the imbalance." 
              },
              beneficialFoods: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List 6 to 8 highly specific beneficial ingredients or meals with short explanations."
              },
              avoidFoods: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List 5 to 6 specific foods or habits they must avoid with explanations."
              },
              keySpices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the spice/herb (e.g., Fennel, Cumin)" },
                    purpose: { type: Type.STRING, description: "Detailed clinical/Ayurvedic reason why it helps them." }
                  },
                  required: ["name", "purpose"]
                },
                description: "Spices recommended for seasoning or infusions."
              },
              mealPlan: {
                type: Type.OBJECT,
                properties: {
                  breakfast: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      beneficialFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                      instructions: { type: Type.STRING, description: "Step-by-step Ayurvedic preparation guidelines." }
                    },
                    required: ["name", "beneficialFoods", "instructions"]
                  },
                  lunch: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      beneficialFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                      instructions: { type: Type.STRING }
                    },
                    required: ["name", "beneficialFoods", "instructions"]
                  },
                  dinner: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      beneficialFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                      instructions: { type: Type.STRING }
                    },
                    required: ["name", "beneficialFoods", "instructions"]
                  },
                  snacks: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      beneficialFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                      instructions: { type: Type.STRING }
                    },
                    required: ["name", "beneficialFoods", "instructions"]
                  }
                },
                required: ["breakfast", "lunch", "dinner", "snacks"]
              },
              weeklyPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING, description: "e.g., 'Monday', 'Tuesday', ..., 'Sunday'" },
                    meals: {
                      type: Type.OBJECT,
                      properties: {
                        breakfast: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            beneficialFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                            instructions: { type: Type.STRING }
                          },
                          required: ["name", "beneficialFoods", "instructions"]
                        },
                        lunch: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            beneficialFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                            instructions: { type: Type.STRING }
                          },
                          required: ["name", "beneficialFoods", "instructions"]
                        },
                        dinner: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            beneficialFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                            instructions: { type: Type.STRING }
                          },
                          required: ["name", "beneficialFoods", "instructions"]
                        },
                        snacks: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            beneficialFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                            instructions: { type: Type.STRING }
                          },
                          required: ["name", "beneficialFoods", "instructions"]
                        }
                      },
                      required: ["breakfast", "lunch", "dinner", "snacks"]
                    }
                  },
                  required: ["day", "meals"]
                },
                description: "7-day personalized weekly diet plan (Monday to Sunday) using mostly Ayurvedic Indian foods tailored to their dosha."
              },
              lifestyleTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 customized lifestyle or routine (Dinacharya) actions."
              },
              herbalRemedies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 to 3 gentle herbal preparations or teas suitable for daily home care."
              },
              generalAdvice: {
                type: Type.STRING,
                description: "A comforting closing quote or final piece of wisdom regarding mindful eating."
              }
            },
            required: [
              "primaryDosha",
              "secondaryDosha",
              "prakritiDistribution",
              "vikritiImbalance",
              "analysis",
              "beneficialFoods",
              "avoidFoods",
              "keySpices",
              "mealPlan",
              "weeklyPlan",
              "lifestyleTips",
              "herbalRemedies",
              "generalAdvice"
            ]
          }
        }
      });

      const recommendationData = JSON.parse(response.text.trim());
      return res.status(200).json(recommendationData);

    } catch (error: any) {
      console.error("Gemini API error during diet recommendation:", error);
      return res.status(500).json({ 
        error: "Failed to generate recommendation due to an internal server error.",
        details: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
