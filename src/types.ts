export interface QuizOption {
  id: string;
  text: string;
  vata: number;
  pitta: number;
  kapha: number;
}

export interface Question {
  id: string;
  category: string;
  text: string;
  options: QuizOption[];
}

export interface Symptom {
  id: string;
  text: string;
  dosha: 'vata' | 'pitta' | 'kapha';
  category: 'digestion' | 'skin' | 'energy' | 'mind' | 'physical';
}

export interface DoshaScore {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface Meal {
  name: string;
  beneficialFoods: string[];
  instructions: string;
}

export interface MealPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

export interface DietRecommendation {
  primaryDosha: 'Vata' | 'Pitta' | 'Kapha';
  secondaryDosha: 'Vata' | 'Pitta' | 'Kapha' | 'None';
  prakritiDistribution: DoshaScore; // Percentage representation of constitution
  vikritiImbalance: DoshaScore; // Imbalance level of Vata, Pitta, Kapha
  analysis: string; // Dynamic AI analysis explaining why they have this balance/imbalance
  beneficialFoods: string[];
  avoidFoods: string[];
  keySpices: { name: string; purpose: string }[];
  mealPlan: MealPlan;
  lifestyleTips: string[];
  herbalRemedies: string[];
  generalAdvice: string;
}

export interface SavedReport {
  id: string;
  date: string;
  prakritiDistribution: DoshaScore;
  vikritiImbalance: DoshaScore;
  primaryDosha: 'Vata' | 'Pitta' | 'Kapha';
  symptomsCount: number;
  recommendation: DietRecommendation;
}
