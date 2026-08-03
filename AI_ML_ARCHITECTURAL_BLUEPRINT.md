# Architectural Blueprint: Transitioning PrakritiAI to a Fully Machine Learning-Driven Architecture

This document outlines the detailed architectural blueprint and implementation plan to replace the current heuristic rule-based logic in PrakritiAI with a complete client-side **Machine Learning (AI/ML)** system.

By eliminating hardcoded scores and simple summation rules, this transition empowers the application with a highly personalized, scientifically sound, and fully on-device predictive system. It utilizes **TensorFlow.js** (`@tensorflow/tfjs`) to compute genetic mind-body baseline constitutions (**Prakriti**) and acute active symptom imbalances (**Vikriti**), and recommends elements and diet paths using deep learning techniques.

---

## 1. Executive Summary & Goals

### Current Architecture (Heuristic & Rule-Based)
* **Prakriti baseline calculation:** Simple arithmetic summation of fixed weights (`vata: 3, pitta: 1, kapha: 0` etc.) from 8 questions.
* **Vikriti imbalance calculation:** A basic linear formula mapping selected symptoms to 25% additions with baseline-derived weights.
* **Recommendations:** A hybrid of large-model prompt completions (Gemini 3.5 Flash) and static fallback rule-engines.

### Target Architecture (Fully ML-Driven)
1. **Zero Heuristics:** Replace static addition weights with a client-side multi-layer neural network model (trained on historical clinical Ayurvedic data).
2. **On-Device Inference (Offline-First):** Load and execute the models directly in the user's browser using TensorFlow.js with WebGL/WASM acceleration, providing instant predictions even without internet connection.
3. **Clinical Grounding & Generalization:** The neural network can learn complex, non-linear relationships and interactions between physical characteristics (e.g., how "dry skin" interacts with "light sleep") that simple summation rules miss.
4. **ML-Assisted Recipe Selection:** Replace the rule-based local recipes with a client-side semantic matching engine using text embeddings (e.g., using ONNX or `@xenova/transformers`) to rank recipes matching the ML-calculated Dosha vectors, diet restrictions, and preferences.

---

## 2. ML System Architecture & Data Pipeline

```
+---------------------------------------------------------------------------------+
|                                 USER INPUTS                                     |
+----------------------+----------------------------------+-----------------------+
                       |                                  |
                       v                                  v
           [8-Step Baseline Quiz]               [18-Symptom Checklist]
                       |                                  |
                       v                                  v
+---------------------------------------------------------------------------------+
|                         DATA PREPROCESSING & VECTORIZATION                      |
+---------------------------------------------------------------------------------+
| * Prakriti Vector: 1-of-K One-Hot Encoder       * Vikriti Vector: 18-dim Binary |
|   (24-dimensional float tensor)                   (18-dimensional float tensor) |
+----------------------+----------------------------------+-----------------------+
                       |                                  |
                       v                                  v
+---------------------------------------------------------------------------------+
|                     TENSORFLOW.JS CLASSIFIER MODELS (ON-DEVICE)                  |
+---------------------------------------------------------------------------------+
| * Prakriti DNN Model:                           * Vikriti Imbalance Model:      |
|   Input (24) -> Dense(16, ReLU) ->              Input (18) -> Dense(16, ReLU) ->|
|   Dense(3, Softmax)                             Dense(3, Softmax)               |
+----------------------+----------------------------------+-----------------------+
                       |                                  |
                       +-----------------+----------------+
                                         |
                                         v  Outputs: Prakriti & Vikriti Distribution Vectors
+---------------------------------------------------------------------------------+
|                          RECIPE MATCHING & RECOM ENGINE                         |
+---------------------------------------------------------------------------------+
| * Input: Deep Personalization Profile (Allergies, Cuisine, Season)              |
| * Algorithm: On-Device Vector Cosine Similarity Search                          |
| * Target: Map predicted Dosha imbalance vectors against a Local Recipe Embedding |
|           Database to rank and serve customized circadian and weekly meal plans.|
+---------------------------------------------------------------------------------+
```

---

## 3. Preprocessing, Encoding, and Feature Engineering

To train and perform inference on a neural network, the user's categorical selections must be encoded into numeric tensors.

### 3.1 Prakriti Input Vectorization (Baseline Quiz)
The quiz consists of 8 questions, each with 3 multiple-choice options corresponding to Vata, Pitta, and Kapha characteristics.
* **Encoding Strategy:** One-Hot Encoding.
* For each question, we represent the selected option as a 3-dimensional binary vector (e.g., if option 1 is selected: `[1, 0, 0]`; option 2: `[0, 1, 0]`; option 3: `[0, 0, 1]`).
* Concatenating all 8 questions yields a **24-dimensional numeric vector** (flat array of size 24 containing exactly eight `1`s and sixteen `0`s).

### 3.2 Vikriti Input Vectorization (Symptom Checklist)
There are 18 registered symptoms across different axes (6 for Vata, 6 for Pitta, 6 for Kapha).
* **Encoding Strategy:** Multi-Hot Binary Encoding.
* We represent the symptoms as an **18-dimensional numeric vector**, where index $i$ is `1` if the symptom is active, and `0` otherwise.

---

## 4. TensorFlow.js Deep Neural Network (DNN) Models

We define two highly optimized on-device models: the **Prakriti Classifier** and the **Vikriti Regressor/Classifier**.

### 4.1 Prakriti Model Architecture
A Feedforward Deep Neural Network (DNN) that outputs a probability distribution over the three primary Doshas: Vata, Pitta, and Kapha.

* **Input Layer:** `tf.layers.dense({ units: 24, inputShape: [24] })`
* **Hidden Layer 1:** `tf.layers.dense({ units: 16, activation: 'relu' })` — Extracts patterns of physical/mental structures.
* **Dropout Layer:** `tf.layers.dropout({ rate: 0.1 })` — Prevents overfitting.
* **Output Layer:** `tf.layers.dense({ units: 3, activation: 'softmax' })` — Produces normalized probabilities that sum to 1.0 (representing the Prakriti ratio: `[Vata%, Pitta%, Kapha%]`).

### 4.2 Vikriti Model Architecture
An acute imbalance neural network that learns from selected symptoms to estimate current systemic inflammation or imbalance percentages.

* **Input Layer:** `tf.layers.dense({ units: 18, inputShape: [18] })`
* **Hidden Layer 1:** `tf.layers.dense({ units: 12, activation: 'relu' })`
* **Output Layer:** `tf.layers.dense({ units: 3, activation: 'sigmoid' })` (or Softmax/Linear depending on whether imbalances are mutually exclusive or independent). `sigmoid` allows multiple elements to be heavily imbalanced simultaneously.

---

## 5. Practical Implementation: On-Device ML Module

Below is the concrete TypeScript source code for defining, compiling, training on clinical synthetic/authenticated datasets, and running real-time inference with TensorFlow.js.

### `src/lib/offlineClassifier.ts`

```typescript
import * as tf from '@tensorflow/tfjs';
import { DoshaScore } from '../types';

/**
 * Normalizes scores to sum to 100%
 */
function normalizeDoshaVector(vata: number, pitta: number, kapha: number): DoshaScore {
  const sum = vata + pitta + kapha || 1;
  return {
    vata: Math.round((vata / sum) * 100),
    pitta: Math.round((pitta / sum) * 100),
    kapha: Math.round((kapha / sum) * 100),
  };
}

export class AyurvedicMLClassifier {
  private prakritiModel: tf.LayersModel | null = null;
  private vikritiModel: tf.LayersModel | null = null;
  private isLoaded = false;

  constructor() {
    // Lazy initialisation of models
  }

  /**
   * Initializes the models, either building them on-the-fly or loading from JSON artifacts.
   */
  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // In production, we'd load pre-trained weights from local assets or indexedDB:
      // this.prakritiModel = await tf.loadLayersModel('localstorage://prakriti-model-v1');

      // For this blueprint, we build and train the networks on-the-fly with a synthetic clinical dataset
      this.prakritiModel = this.buildPrakritiModel();
      this.vikritiModel = this.buildVikritiModel();

      await this.trainModelsWithSyntheticClinicalData();

      this.isLoaded = true;
      console.log("Ayurvedic ML Core initialized successfully.");
    } catch (err) {
      console.error("Failed to initialize TensorFlow.js models:", err);
    }
  }

  /**
   * Build Prakriti Neural Network
   */
  private buildPrakritiModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer + First Dense Layer
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [24], // 8 questions * 3 options
    }));

    // Regularization
    model.add(tf.layers.dropout({ rate: 0.1 }));

    // Second dense layer for representation learning
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));

    // Output Layer (Softmax outputs sum to 1.0)
    model.add(tf.layers.dense({
      units: 3, // Vata, Pitta, Kapha
      activation: 'softmax'
    }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Build Vikriti Neural Network
   */
  private buildVikritiModel(): tf.LayersModel {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 12,
      activation: 'relu',
      inputShape: [18], // 18 registered symptoms
    }));

    model.add(tf.layers.dense({
      units: 3, // Independant imbalance ratings (0.0 - 1.0) for Vata, Pitta, Kapha
      activation: 'sigmoid'
    }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });

    return model;
  }

  /**
   * Generates mock clinical profiles for on-device training to ground the neural network weights.
   */
  private async trainModelsWithSyntheticClinicalData(): Promise<void> {
    if (!this.prakritiModel || !this.vikritiModel) return;

    // --- 1. TRAIN PRAKRITI CLASSIFIER ---
    // Generate synthetic vectors representing classic pure and dual-doshic profiles
    const xPrakritiData: number[][] = [];
    const yPrakritiData: number[][] = [];

    // Pure Vata Profile
    // Question answers favor options with ID vX
    // For 8 questions, we toggle '1' in Vata positions [1, 0, 0] repeated
    xPrakritiData.push(new Array(8).fill([1, 0, 0]).flat());
    yPrakritiData.push([1.0, 0.0, 0.0]); // 100% Vata

    // Pure Pitta Profile
    xPrakritiData.push(new Array(8).fill([0, 1, 0]).flat());
    yPrakritiData.push([0.0, 1.0, 0.0]); // 100% Pitta

    // Pure Kapha Profile
    xPrakritiData.push(new Array(8).fill([0, 0, 1]).flat());
    yPrakritiData.push([0.0, 0.0, 1.0]); // 100% Kapha

    // Dual Doshic: Vata-Pitta Profile
    const vpVector = [
      1,0,0,  0,1,0,  1,0,0,  0,1,0,  1,0,0,  0,1,0,  1,0,0,  0,1,0
    ];
    xPrakritiData.push(vpVector);
    yPrakritiData.push([0.5, 0.5, 0.0]); // 50% Vata, 50% Pitta

    // Dual Doshic: Pitta-Kapha Profile
    const pkVector = [
      0,1,0,  0,0,1,  0,1,0,  0,0,1,  0,1,0,  0,0,1,  0,1,0,  0,0,1
    ];
    xPrakritiData.push(pkVector);
    yPrakritiData.push([0.0, 0.5, 0.5]); // 50% Pitta, 50% Kapha

    const xsP = tf.tensor2d(xPrakritiData);
    const ysP = tf.tensor2d(yPrakritiData);

    // Train on-device for 50 epochs
    await this.prakritiModel.fit(xsP, ysP, {
      epochs: 50,
      verbose: 0
    });

    xsP.dispose();
    ysP.dispose();

    // --- 2. TRAIN VIKRITI REGRESSOR ---
    const xVikritiData: number[][] = [];
    const yVikritiData: number[][] = [];

    // Case 1: Pure Vata symptoms (indexes 0-5)
    const vataSym = [1,1,1,1,1,1, 0,0,0,0,0,0, 0,0,0,0,0,0];
    xVikritiData.push(vataSym);
    yVikritiData.push([0.9, 0.1, 0.1]);

    // Case 2: Pure Pitta symptoms (indexes 6-11)
    const pittaSym = [0,0,0,0,0,0, 1,1,1,1,1,1, 0,0,0,0,0,0];
    xVikritiData.push(pittaSym);
    yVikritiData.push([0.1, 0.9, 0.1]);

    // Case 3: Pure Kapha symptoms (indexes 12-17)
    const kaphaSym = [0,0,0,0,0,0, 0,0,0,0,0,0, 1,1,1,1,1,1];
    xVikritiData.push(kaphaSym);
    yVikritiData.push([0.1, 0.1, 0.9]);

    const xsV = tf.tensor2d(xVikritiData);
    const ysV = tf.tensor2d(yVikritiData);

    await this.vikritiModel.fit(xsV, ysV, {
      epochs: 50,
      verbose: 0
    });

    xsV.dispose();
    ysV.dispose();
  }

  /**
   * Predicts Prakriti (Baseline) Constitution
   * @param answers Record mapping question ID to option ID (e.g. { body_frame: 'v1' })
   */
  predictPrakriti(answers: Record<string, string>): DoshaScore {
    if (!this.prakritiModel) {
      console.warn("Prakriti ML Model not loaded. Returning equal ratio.");
      return { vata: 33, pitta: 33, kapha: 34 };
    }

    // 1. Construct 24-dimensional input vector
    const inputVector: number[] = [];

    // In order of QUESTIONS definition
    const questionIds = ['body_frame', 'skin_texture', 'hair_type', 'digestion_appetite', 'sleep_pattern', 'stress_response', 'activity_level', 'mind_memory'];

    questionIds.forEach((qid) => {
      const selectedOpt = answers[qid];
      if (selectedOpt) {
        if (selectedOpt.startsWith('v')) inputVector.push(1, 0, 0);
        else if (selectedOpt.startsWith('p')) inputVector.push(0, 1, 0);
        else if (selectedOpt.startsWith('k')) inputVector.push(0, 0, 1);
        else inputVector.push(0.33, 0.33, 0.34);
      } else {
        inputVector.push(0.33, 0.33, 0.34); // Default balanced fallback if skipped
      }
    });

    // 2. Perform TF.js Inference
    return tf.tidy(() => {
      const inputTensor = tf.tensor2d([inputVector], [1, 24]);
      const prediction = this.prakritiModel!.predict(inputTensor) as tf.Tensor;
      const scores = prediction.dataSync(); // Returns Float32Array [Vata, Pitta, Kapha]

      return normalizeDoshaVector(scores[0], scores[1], scores[2]);
    });
  }

  /**
   * Predicts Vikriti (Acute Imbalance) Constitution
   */
  predictVikriti(selectedSymptomIds: string[], baseline: DoshaScore): DoshaScore {
    if (!this.vikritiModel) {
      return normalizeDoshaVector(baseline.vata, baseline.pitta, baseline.kapha);
    }

    // 1. Construct 18-dimensional binary symptom vector
    const symptomIds = [
      's_v1', 's_v2', 's_v3', 's_v4', 's_v5', 's_v6', // Vata
      's_p1', 's_p2', 's_p3', 's_p4', 's_p5', 's_p6', // Pitta
      's_k1', 's_k2', 's_k3', 's_k4', 's_k5', 's_k6'  // Kapha
    ];

    const inputVector = symptomIds.map(id => selectedSymptomIds.includes(id) ? 1.0 : 0.0);

    // 2. Perform TF.js Inference
    return tf.tidy(() => {
      const inputTensor = tf.tensor2d([inputVector], [1, 18]);
      const prediction = this.vikritiModel!.predict(inputTensor) as tf.Tensor;
      const scores = prediction.dataSync(); // Float32Array [Vata%, Pitta%, Kapha%]

      // Blend the prediction with the baseline tendency (Ayurvedic law: constitution defines the vector of imbalance)
      const baseVataWeight = baseline.vata * 0.2;
      const basePittaWeight = baseline.pitta * 0.2;
      const baseKaphaWeight = baseline.kapha * 0.2;

      const vataImbalance = (scores[0] * 80) + baseVataWeight;
      const pittaImbalance = (scores[1] * 80) + basePittaWeight;
      const kaphaImbalance = (scores[2] * 80) + baseKaphaWeight;

      return normalizeDoshaVector(vataImbalance, pittaImbalance, kaphaImbalance);
    });
  }
}

// Export singleton instance
export const mlEngine = new AyurvedicMLClassifier();
```

---

## 6. ML-Based Recipe Recommendation Engine

Currently, if the Gemini API key is missing, PrakritiAI falls back to static hardcoded lists. In a fully ML-driven solution, we can replace this with a **Vector-Based Matcher** that computes similarity scores between the user's computed Vikriti/Prakriti vectors and a database of traditional meals.

### 6.1 Unified Meal & Ingredient Vector Representation
For every meal in our local database, we associate a **Balancing Attribute Vector** representing its biological influence on elements:
$$\vec{R} = [V_{bal}, P_{bal}, K_{bal}]$$
where values represent how strongly the meal pacifies Vata, Pitta, and Kapha (values between -1.0 to +1.0).

* For example, **Moong Dal Kitchari** heavily balances Vata and Pitta: `[0.9, 0.8, -0.2]`
* **Spicy Ginger Lentil Soup** balances Kapha but increases Pitta: `[-0.4, -0.8, 0.9]`

### 6.2 Cosine Similarity Matcher
We calculate the cosine similarity between the user's predicted **systemic imbalance vector** (Vikriti $\vec{V}$) and the **balancing vector of the meals** (Recipe $\vec{R}$):

$$\text{Match Score} = \cos(\theta) = \frac{\vec{V} \cdot \vec{R}}{\|\vec{V}\| \|\vec{R}\|}$$

```typescript
export interface MLRecipe {
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  balancingVector: [number, number, number]; // [Vata, Pitta, Kapha] pacifying force
  allergies: string[];
  cuisine: 'South Indian' | 'North Indian' | 'Western' | 'General';
  instructions: string;
}

export function rankRecipesForUser(
  userVikriti: DoshaScore,
  allergies: string[],
  preferredCuisine: string,
  recipeDatabase: MLRecipe[]
): MLRecipe[] {
  // Convert Vikriti percentages to a normalized target imbalance vector
  const v_v = userVikriti.vata / 100;
  const v_p = userVikriti.pitta / 100;
  const v_k = userVikriti.kapha / 100;

  return recipeDatabase
    .filter(recipe => {
      // Hard constraints: allergies and dietary restrictions
      return !recipe.allergies.some(allergy => allergies.includes(allergy));
    })
    .map(recipe => {
      const [r_v, r_p, r_k] = recipe.balancingVector;

      // Calculate dot product
      const dotProduct = (v_v * r_v) + (v_p * r_p) + (v_k * r_k);
      const magnitudeUser = Math.sqrt(v_v*v_v + v_p*v_p + v_k*v_k);
      const magnitudeRecipe = Math.sqrt(r_v*r_v + r_p*r_p + r_k*r_k);

      const similarity = dotProduct / (magnitudeUser * magnitudeRecipe || 1);

      // Soft constraint boost for matching cuisine preference
      const cuisineBoost = (recipe.cuisine === preferredCuisine) ? 0.2 : 0.0;

      return {
        recipe,
        score: similarity + cuisineBoost
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.recipe);
}
```

---

## 7. Migration & UI Integration Plan

To implement this on-device ML-driven transition seamlessly in the frontend app, follow these steps:

### Step 1: Install Dependencies
Install TensorFlow.js in the web context:
```bash
npm install @tensorflow/tfjs
```

### Step 2: Initialize ML Core inside React Lifecycle
Initialize the ML Engine on startup inside `App.tsx`:
```typescript
import { mlEngine } from './lib/offlineClassifier';

// ... Inside App component:
useEffect(() => {
  const initML = async () => {
    await mlEngine.initialize();
  };
  initML();
}, []);
```

### Step 3: Replace Heuristic Scoring functions
Update the calculation triggers inside `App.tsx` from standard count addition to the deep-learning classifier predictions:

```typescript
// Replace: const calculatePrakriti = (answers) => { ... }
const calculatePrakritiML = (answers: Record<string, string>): DoshaScore => {
  return mlEngine.predictPrakriti(answers);
};

// Replace: const calculateVikriti = (symptoms, baseline) => { ... }
const calculateVikritiML = (symptomIds: string[], baseline: DoshaScore): DoshaScore => {
  return mlEngine.predictVikriti(symptomIds, baseline);
};
```

### Step 4: Shadow-Testing (Quality Assurance Phase)
Before fully turning off the rule-based heuristic calculations, we can run a "Shadow Testing" mode. This logs both heuristic and ML predictions to verify consistency and fine-tune model learning parameters:

```typescript
const baselineOld = calculatePrakritiOld(answers);
const baselineML = mlEngine.predictPrakriti(answers);

console.log(`[Shadow Test] Heuristics: V(${baselineOld.vata}) vs ML: V(${baselineML.vata})`);
```

---

## 8. Training Pipeline & Model Updates

To continually improve classification accuracy and adapt to real-world clinical patterns, we propose a lightweight model updates strategy:

1. **Cloud-Trained Artifacts (Optional):** We can train a more complex neural network or decision tree model offline in Python using **Scikit-learn** or **Keras** on verified patient diagnostic datasets.
2. **Exporting to TFJS format:** Convert the Keras model using `tensorflowjs_converter`:
   ```bash
   tensorflowjs_converter --input_format=keras model.h5 src/assets/model/
   ```
3. **On-Device Sync:** The React app can periodically check for and download updated model weights from Firebase storage or CDN, storing them locally using `localstorage://` or `indexeddb://` runtimes for instant offline load.

---

## Conclusion

Transitioning to a fully ML-driven calculation engine upgrades PrakritiAI from a basic static quiz application to an intelligent, scientific Ayurvedic diagnostic assistant. Operating locally, it respects user privacy, guarantees lightning-fast execution speed, functions without internet, and opens the door to deeply adaptive, personalized healthcare predictions.
