import { Question, Symptom, DietRecommendation } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 'body_frame',
    category: 'physical',
    text: 'How would you describe your body frame and skeletal build?',
    options: [
      { id: 'v1', text: 'Thin, bony, very tall or very short, difficult to gain weight', vata: 3, pitta: 1, kapha: 0 },
      { id: 'p1', text: 'Medium build, muscular, athletic, easily maintains weight', vata: 1, pitta: 3, kapha: 0 },
      { id: 'k1', text: 'Broad, stocky, large frame, gains weight easily, hard to lose', vata: 0, pitta: 0, kapha: 3 }
    ]
  },
  {
    id: 'skin_texture',
    category: 'physical',
    text: 'What is the natural texture and feel of your skin?',
    options: [
      { id: 'v2', text: 'Dry, rough, thin, cool to the touch, cracks easily', vata: 3, pitta: 0, kapha: 0 },
      { id: 'p2', text: 'Warm, oily T-zone, prone to redness, moles, freckles or acne', vata: 0, pitta: 3, kapha: 1 },
      { id: 'k2', text: 'Smooth, soft, thick, moist, cool, pale or glowing, rarely dry', vata: 0, pitta: 0, kapha: 3 }
    ]
  },
  {
    id: 'hair_type',
    category: 'physical',
    text: 'How would you describe your hair?',
    options: [
      { id: 'v3', text: 'Dry, curly, frizzy, coarse, brittle, or easily tangled', vata: 3, pitta: 0, kapha: 0 },
      { id: 'p3', text: 'Fine, soft, straight, light brown/blonde/red, prone to thinning or early graying', vata: 0, pitta: 3, kapha: 0 },
      { id: 'k3', text: 'Thick, strong, wavy, abundant, oily, shiny, and dark', vata: 0, pitta: 0, kapha: 3 }
    ]
  },
  {
    id: 'digestion_appetite',
    category: 'digestion',
    text: 'How are your appetite and digestion on an average day?',
    options: [
      { id: 'v4', text: 'Irregular and variable. Prone to gas, bloating, and light appetite', vata: 3, pitta: 1, kapha: 0 },
      { id: 'p4', text: 'Strong and intense. Cannot tolerate skipping meals. Prone to acidity', vata: 0, pitta: 3, kapha: 0 },
      { id: 'k4', text: 'Steady but slow. Can skip meals easily, digests slowly, feels heavy after eating', vata: 0, pitta: 0, kapha: 3 }
    ]
  },
  {
    id: 'sleep_pattern',
    category: 'energy',
    text: 'What is your typical sleep pattern?',
    options: [
      { id: 'v5', text: 'Light, easily disturbed, sleeps 5-6 hours, prone to racing thoughts at night', vata: 3, pitta: 0, kapha: 0 },
      { id: 'p5', text: 'Sound and moderate (6-7 hours). Can sleep easily but wakes up if too hot', vata: 0, pitta: 3, kapha: 0 },
      { id: 'k5', text: 'Deep, heavy, and long (8-9+ hours). Hard to wake up, feels sluggish in the morning', vata: 0, pitta: 0, kapha: 3 }
    ]
  },
  {
    id: 'stress_response',
    category: 'mind',
    text: 'How do you typically react under stress or pressure?',
    options: [
      { id: 'v6', text: 'Become anxious, fearful, worried, restless, or start overthinking', vata: 3, pitta: 0, kapha: 0 },
      { id: 'p6', text: 'Become irritable, angry, impatient, hyper-competitive, or critical', vata: 0, pitta: 3, kapha: 0 },
      { id: 'k6', text: 'Stay calm, withdrawal, become silent, stubborn, or complacent', vata: 0, pitta: 0, kapha: 3 }
    ]
  },
  {
    id: 'activity_level',
    category: 'energy',
    text: 'How is your natural physical and mental energy level?',
    options: [
      { id: 'v7', text: 'High enthusiasm but tires quickly. Active in short bursts of energy', vata: 3, pitta: 1, kapha: 0 },
      { id: 'p7', text: 'Focused, steady, and purposeful. Good stamina, loves challenge', vata: 0, pitta: 3, kapha: 1 },
      { id: 'k7', text: 'Slow, steady pace. High endurance once started, but hard to motivate', vata: 0, pitta: 0, kapha: 3 }
    ]
  },
  {
    id: 'mind_memory',
    category: 'mind',
    text: 'How does your learning and memory work?',
    options: [
      { id: 'v8', text: 'Grasp concepts very quickly but forget them just as fast', vata: 3, pitta: 0, kapha: 0 },
      { id: 'p8', text: 'Grasp things quickly and remember them logically with sharp focus', vata: 0, pitta: 3, kapha: 1 },
      { id: 'k8', text: 'Grasp concepts slowly but never forget them once memorized', vata: 0, pitta: 0, kapha: 3 }
    ]
  }
];

export const SYMPTOMS: Symptom[] = [
  // Vata Symptoms
  { id: 's_v1', text: 'Constipation, dry stools, or frequent gas', dosha: 'vata', category: 'digestion' },
  { id: 's_v2', text: 'Dry, flaky skin or chapped lips', dosha: 'vata', category: 'skin' },
  { id: 's_v3', text: 'Joint crackling, stiffness, or low back pain', dosha: 'vata', category: 'physical' },
  { id: 's_v4', text: 'Anxiety, chronic worry, or nervous restlessness', dosha: 'vata', category: 'mind' },
  { id: 's_v5', text: 'Insomnia, light sleep, or difficulty falling asleep', dosha: 'vata', category: 'energy' },
  { id: 's_v6', text: 'Chronic physical fatigue and intolerance to cold wind', dosha: 'vata', category: 'physical' },

  // Pitta Symptoms
  { id: 's_p1', text: 'Acidity, heartburn, or burning sensation in chest', dosha: 'pitta', category: 'digestion' },
  { id: 's_p2', text: 'Skin rashes, hives, red patches, or acne breakouts', dosha: 'pitta', category: 'skin' },
  { id: 's_p3', text: 'Hot flushes, intense body heat, or heavy sweating', dosha: 'pitta', category: 'physical' },
  { id: 's_p4', text: 'Irritability, quick temper, impatience, or frustration', dosha: 'pitta', category: 'mind' },
  { id: 's_p5', text: 'Frequent loose stools or urgent bowel movements', dosha: 'pitta', category: 'digestion' },
  { id: 's_p6', text: 'Inflammation in joints, muscles, or red burning eyes', dosha: 'pitta', category: 'physical' },

  // Kapha Symptoms
  { id: 's_k1', text: 'Very sluggish digestion, feeling heavy for hours after eating', dosha: 'kapha', category: 'digestion' },
  { id: 's_k2', text: 'Excessive mucus, constant congestion, sinus blockage, or chest phlegm', dosha: 'kapha', category: 'physical' },
  { id: 's_k3', text: 'Severe lethargy, morning sluggishness, or excessive sleepiness', dosha: 'kapha', category: 'energy' },
  { id: 's_k4', text: 'Easy weight gain or sudden water retention (bloated tissues)', dosha: 'kapha', category: 'physical' },
  { id: 's_k5', text: 'Possessiveness, feeling unmotivated, lazy, or mental fog', dosha: 'kapha', category: 'mind' },
  { id: 's_k6', text: 'Excessively oily skin, greasy scalp, or heavy feeling limbs', dosha: 'kapha', category: 'skin' }
];

export const FALLBACK_RECOMMENDATIONS: Record<'Vata' | 'Pitta' | 'Kapha', DietRecommendation> = {
  Vata: {
    primaryDosha: 'Vata',
    secondaryDosha: 'None',
    prakritiDistribution: { vata: 60, pitta: 25, kapha: 15 },
    vikritiImbalance: { vata: 70, pitta: 20, kapha: 10 },
    analysis: 'Your profile indicates a strong dominance of Vata. Vata is composed of Air and Ether elements, governing movement, circulation, and nervous system activities. The dryness and irregularity you are experiencing are classic Vata imbalances. Your diet needs to focus on grounding, warming, moist, and nourishing foods that offset Vata’s light, cold, dry, and erratic nature.',
    beneficialFoods: [
      'Warm cooked whole grains (Basmati rice, oats, quinoa, wheat)',
      'Sweet fruits (bananas, cooked apples, avocados, ripe mangoes, grapes)',
      'Root vegetables (sweet potatoes, carrots, beets, cooked squash)',
      'Moist proteins (mung dal, red lentils, organic chicken or fish, soaked almonds)',
      'Healthy fats (Ghee, sesame oil, olive oil, coconut oil)',
      'Warm milk with cardamom and nutmeg'
    ],
    avoidFoods: [
      'Raw vegetables, salads, and cold smoothies',
      'Dry snacks (popcorn, crackers, dry chips)',
      'Bitter or extremely astringent foods (unripe bananas, raw kale, sprouts)',
      'Cold carbonated beverages and iced water',
      'Excessive caffeine and stimulants'
    ],
    keySpices: [
      { name: 'Ginger', purpose: 'Kindles the digestive fire (Agni) and warms the stomach.' },
      { name: 'Cumin', purpose: 'Eases gas, bloating, and supports nutrient assimilation.' },
      { name: 'Cardamom', purpose: 'Neutralizes the mucus-forming properties of dairy and adds warming sweetness.' },
      { name: 'Fennel', purpose: 'Gentle digestive aid that prevents spasms and abdominal cramps.' }
    ],
    mealPlan: {
      breakfast: {
        name: 'Warming Spiced Oatmeal',
        beneficialFoods: ['Rolled oats', 'Almond milk', 'Soaked almonds', 'Raisins', 'Ghee', 'Cinnamon'],
        instructions: 'Cook rolled oats in water or almond milk. Stir in cinnamon, a pinch of cardamom, soaked and peeled almonds, raisins, and top with half a teaspoon of ghee. Serve warm.'
      },
      lunch: {
        name: 'Grounding Kitchari & Root Vegetables',
        beneficialFoods: ['Basmati rice', 'Yellow split mung dal', 'Sweet potato', 'Ghee', 'Ginger'],
        instructions: 'Prepare a classical kitchari by cooking basmati rice and yellow split mung dal together with ginger, cumin, mustard seeds, and turmeric in ghee. Add diced sweet potatoes and carrots. Enjoy hot.'
      },
      dinner: {
        name: 'Nourishing Root Stew with Quinoa',
        beneficialFoods: ['Quinoa', 'Beets', 'Carrots', 'Olive oil', 'Coriander'],
        instructions: 'Gently roast carrots, beets, and zucchini in olive oil with coriander and cumin. Serve over warm, fluffy quinoa with a side of warm water.'
      },
      snacks: {
        name: 'Warm Almond Milk & Dates',
        beneficialFoods: ['Organic dates', 'Almond milk', 'Nutmeg', 'Cardamom'],
        instructions: 'Warm up a cup of almond milk with a pinch of cardamon and nutmeg. Eat 2-3 soft Medjool dates along with the drink in the late afternoon.'
      }
    },
    weeklyPlan: [
      {
        day: 'Monday',
        meals: {
          breakfast: { name: 'Moong Dal Chilla', beneficialFoods: ['Split yellow moong dal', 'Ghee', 'Ginger'], instructions: 'Prepare a warm, soft Moong Dal pancake cooked in Ghee with ginger and coriander.' },
          lunch: { name: 'Soft Moong Dal Khichdi', beneficialFoods: ['Basmati rice', 'Moong dal', 'Ghee', 'Cumin'], instructions: 'Cook mushy rice and lentils with turmeric and ginger, topped with warm ghee.' },
          dinner: { name: 'Warm Bottle Gourd (Lauki) Sabzi & Rotis', beneficialFoods: ['Bottle gourd', 'Whole wheat', 'Ghee', 'Fennel'], instructions: 'Purée cooked bottle gourd with fennel seeds, serve hot with soft roti smeared with ghee.' },
          snacks: { name: 'Warm Cardamom Milk & Dates', beneficialFoods: ['Milk', 'Dates', 'Cardamom'], instructions: 'Warm milk with cardamom, paired with sweet soft dates.' }
        }
      },
      {
        day: 'Tuesday',
        meals: {
          breakfast: { name: 'Warm Ragi Porridge', beneficialFoods: ['Finger millet (Ragi)', 'Milk', 'Almonds', 'Cardamom'], instructions: 'Cook ragi flour in milk until thick, sweeten with dates and ghee.' },
          lunch: { name: 'Basmati Rice & Sweet Pumpkin (Kaddu) Sabzi', beneficialFoods: ['Rice', 'Pumpkin', 'Ghee', 'Coriander'], instructions: 'Enjoy steamed rice with mild pumpkin sabzi simmered in ghee.' },
          dinner: { name: 'Yellow Lentil (Toor Dal) Soup', beneficialFoods: ['Toor dal', 'Ginger', 'Ghee'], instructions: 'Nourishing warm dal tempered with cumin, served with soft Chapatis.' },
          snacks: { name: 'Stewed Apples with Cinnamon', beneficialFoods: ['Apples', 'Cinnamon', 'Cloves'], instructions: 'Cook peeled apple slices with water, cinnamon, and cloves until soft.' }
        }
      },
      {
        day: 'Wednesday',
        meals: {
          breakfast: { name: 'Soft Spiced Sooji Upma', beneficialFoods: ['Semolina (Sooji)', 'Carrots', 'Ghee', 'Ginger'], instructions: 'Sauté semolina in ghee, cook with warm water, grated carrots, and fresh ginger.' },
          lunch: { name: 'Rice, Kadhi & Sautéed Carrots', beneficialFoods: ['Rice', 'Yogurt', 'Gram flour', 'Ghee'], instructions: 'Enjoy warm yogurt Kadhi tempered with cumin alongside soft rice and carrots.' },
          dinner: { name: 'Mung Dal Khichdi & Zucchini Sabzi', beneficialFoods: ['Moong dal', 'Rice', 'Zucchini', 'Ghee'], instructions: 'Mushy khichdi served with a side of zucchini sautéed in ghee.' },
          snacks: { name: 'Roasted Almonds & Raisins', beneficialFoods: ['Almonds', 'Raisins'], instructions: 'Eat soaked and peeled almonds paired with sweet organic raisins.' }
        }
      },
      {
        day: 'Thursday',
        meals: {
          breakfast: { name: 'Besan Chilla', beneficialFoods: ['Gram flour (Besan)', 'Ghee', 'Coriander'], instructions: 'Savory chickpea flour pancake cooked with ghee and seasoned with ajwain.' },
          lunch: { name: 'Mung Dal, Rice, & Palak (Spinach) Sabzi', beneficialFoods: ['Moong dal', 'Rice', 'Spinach', 'Ghee'], instructions: 'Steamed rice with yellow dal and warm wilted spinach seasoned with cumin.' },
          dinner: { name: 'Lauki (Bottle Gourd) Khichdi', beneficialFoods: ['Rice', 'Moong dal', 'Bottle gourd', 'Ghee'], instructions: 'A comforting, easily digestible one-pot meal cooked with ghee and turmeric.' },
          snacks: { name: 'Ginger Tea with Dates', beneficialFoods: ['Fresh ginger', 'Dates'], instructions: 'Boil fresh ginger slices, serve warm with a side of soft dates.' }
        }
      },
      {
        day: 'Friday',
        meals: {
          breakfast: { name: 'Soft Spiced Poha', beneficialFoods: ['Flattened rice (Poha)', 'Ghee', 'Turmeric', 'Coriander'], instructions: 'Rinse poha and steam with turmeric, ginger, and cumin in ghee. Keep it soft.' },
          lunch: { name: 'Whole Wheat Roti & Sweet Potato Sabzi', beneficialFoods: ['Whole wheat', 'Sweet potato', 'Ghee'], instructions: 'Soft rotis served with sweet potatoes sautéed in ghee and cumin.' },
          dinner: { name: 'Nourishing Root Vegetable Stew', beneficialFoods: ['Carrots', 'Beets', 'Quinoa', 'Ghee'], instructions: 'A warm, thick stew of carrots and beets served over warm cooked quinoa.' },
          snacks: { name: 'Warm Almond Milk with Nutmeg', beneficialFoods: ['Almond milk', 'Nutmeg', 'Cardamom'], instructions: 'Warm cup of almond milk spiked with cardamom and grounding nutmeg.' }
        }
      },
      {
        day: 'Saturday',
        meals: {
          breakfast: { name: 'Sweet Rava Porridge', beneficialFoods: ['Semolina', 'Milk', 'Saffron', 'Ghee'], instructions: 'Roast semolina in ghee, boil in milk with a pinch of saffron and cardamom.' },
          lunch: { name: 'Basmati Rice, Toor Dal & Ash Gourd Sabzi', beneficialFoods: ['Rice', 'Toor dal', 'Ash gourd', 'Ghee'], instructions: 'Warm comforting meal of yellow dal, steamed rice, and tender ash gourd.' },
          dinner: { name: 'Light Moong Dal Soup', beneficialFoods: ['Moong dal', 'Ginger', 'Cumin', 'Ghee'], instructions: 'Simple soup of yellow split mung dal with ghee-cumin tempering.' },
          snacks: { name: 'Roasted Makhana in Ghee', beneficialFoods: ['Foxnuts (Makhana)', 'Ghee', 'Turmeric'], instructions: 'Gently roast foxnuts in ghee with a tiny pinch of turmeric and salt.' }
        }
      },
      {
        day: 'Sunday',
        meals: {
          breakfast: { name: 'Moong Dal Chilla with Mint Chutney', beneficialFoods: ['Moong dal', 'Mint', 'Coriander', 'Ghee'], instructions: 'Warm savory pancake served with a refreshing, non-spicy mint-coriander chutney.' },
          lunch: { name: 'Vegetable Khichdi with Ghee Tadka', beneficialFoods: ['Rice', 'Moong dal', 'Carrots', 'Peas', 'Ghee'], instructions: 'Mushy rice and lentil pot with sweet peas and carrots, finished with ghee.' },
          dinner: { name: 'Pumpkin Soup with cooked Quinoa', beneficialFoods: ['Pumpkin', 'Quinoa', 'Fennel', 'Ghee'], instructions: 'Smooth sweet pumpkin soup paired with warm fluffy cooked quinoa.' },
          snacks: { name: 'Warm Fennel Tea & Dates', beneficialFoods: ['Fennel seeds', 'Dates'], instructions: 'Brew fennel seeds in water, sip warm alongside a couple of sweet dates.' }
        }
      }
    ],
    lifestyleTips: [
      'Establish a regular daily routine (sleeping, waking, and eating at the same times).',
      'Massage your body with warm sesame oil (Abhyanga) before taking a warm bath or shower.',
      'Engage in gentle, grounding exercises like restorative yoga, walking, or tai chi.',
      'Protect yourself from cold, windy weather by wearing warm layers and keeping your head covered.'
    ],
    herbalRemedies: [
      'Ashwagandha: A grounding, adaptogenic herb that calms the mind and nourishes the nervous system. Best taken in warm milk before sleep.',
      'Triphala: Taken at night to support regular elimination and clear intestinal dryness.'
    ],
    generalAdvice: 'Always sit down to eat in a peaceful, quiet environment. Avoid reading, working, or watching television while consuming food. Warmth and consistency are your greatest allies.'
  },
  Pitta: {
    primaryDosha: 'Pitta',
    secondaryDosha: 'None',
    prakritiDistribution: { vata: 20, pitta: 60, kapha: 20 },
    vikritiImbalance: { vata: 15, pitta: 70, kapha: 15 },
    analysis: 'Your profile displays a strong Pitta dominance. Pitta is made of Fire and Water elements, governing metabolism, heat, digestion, and transformation in the body. The heat, acidity, and irritability you feel are classic indicators of excess Pitta. Your ideal diet focuses on cooling, soothing, sweet, bitter, and astringent foods to balance the hot, sharp, oily, and spreading qualities of Pitta.',
    beneficialFoods: [
      'Cooling grains (Basmati rice, barley, oats, wheat)',
      'Sweet fruits (sweet apples, pears, melons, sweet cherries, coconut)',
      'Cooling vegetables (cucumber, zucchini, sweet potatoes, asparagus, leafy greens)',
      'Proteins (mung dal, chickpeas, tofu, organic egg whites, sweet almonds)',
      'Cooling oils (coconut oil, ghee, sunflower oil)',
      'Mint tea, coconut water, coriander seed infusion'
    ],
    avoidFoods: [
      'Hot spicy chilies, cayenne, and raw garlic or onions',
      'Highly acidic fruits (grapefruits, sour oranges, tomatoes, pineapples)',
      'Fermented foods (vinegar, sour yogurt, soy sauce, pickles)',
      'Fried, greasy, and heavy foods',
      'Alcohol, red meat, and dark chocolate'
    ],
    keySpices: [
      { name: 'Coriander', purpose: 'A powerful cooling spice that reduces internal heat and inflammation.' },
      { name: 'Fennel', purpose: 'Cooling digestive aid that relieves heartburn and hyperacidity.' },
      { name: 'Turmeric', purpose: 'Bitter and astringent, it purifies blood and relieves skin inflammation.' },
      { name: 'Mint', purpose: 'Provides refreshing, immediate relief to heat congestion in the GI tract.' }
    ],
    mealPlan: {
      breakfast: {
        name: 'Cooling Rice Pudding with Fruits',
        beneficialFoods: ['Basmati rice', 'Coconut milk', 'Maple syrup', 'Pears', 'Cardamom'],
        instructions: 'Simmer basmati rice in coconut milk with a touch of maple syrup and cardamom. Top with sliced sweet pears or blueberries. Serve warm or at room temperature.'
      },
      lunch: {
        name: 'Soothed Green Lentil Dal & Coconut Rice',
        beneficialFoods: ['Basmati rice', 'Coconut shreds', 'Zucchini', 'Mung dal', 'Coriander'],
        instructions: 'Cook mung dal with fennel, coriander, and turmeric. Pair with steamed basmati rice cooked with unsweetened shredded coconut, and sautéed zucchini in coconut oil.'
      },
      dinner: {
        name: 'Sweet Potato & Asparagus Medley with Ghee',
        beneficialFoods: ['Sweet potato', 'Asparagus', 'Basmati rice', 'Ghee', 'Fennel'],
        instructions: 'Sauté asparagus and cubed sweet potatoes in a small amount of ghee with fennel seeds and a pinch of salt. Serve with warm basmati rice.'
      },
      snacks: {
        name: 'Fresh Melon Bowl or Coconut Water',
        beneficialFoods: ['Cantaloupe', 'Watermelon', 'Coconut water'],
        instructions: 'Enjoy a bowl of fresh sweet melon or drink a glass of fresh organic coconut water in the mid-afternoon. Do not combine melon with any other foods.'
      }
    },
    weeklyPlan: [
      {
        day: 'Monday',
        meals: {
          breakfast: { name: 'Sweet Coconut Poha', beneficialFoods: ['Flattened rice', 'Coconut shreds', 'Coriander'], instructions: 'Steam flattened rice with mild fennel, grated coconut, and sweet raisins.' },
          lunch: { name: 'Basmati Rice, Moong Dal, & Zucchini Sabzi', beneficialFoods: ['Rice', 'Moong dal', 'Zucchini', 'Coconut oil'], instructions: 'Yellow mung dal with steamed rice and zucchini sautéed in cooling coconut oil.' },
          dinner: { name: 'Mild Lauki (Bottle Gourd) Sabzi with Rotis', beneficialFoods: ['Bottle gourd', 'Whole wheat', 'Ghee', 'Fennel'], instructions: 'Enjoy soft rotis with sweet bottle gourd cooked with fennel and coriander.' },
          snacks: { name: 'Cooling Coconut Water', beneficialFoods: ['Coconut water'], instructions: 'Drink fresh, pure organic coconut water in the mid-afternoon.' }
        }
      },
      {
        day: 'Tuesday',
        meals: {
          breakfast: { name: 'Oats Porridge with Maple Syrup', beneficialFoods: ['Oats', 'Milk', 'Maple syrup', 'Raisins'], instructions: 'Cook oats in whole milk or coconut milk, sweeten with maple syrup and raisins.' },
          lunch: { name: 'Rice, Kadhi & Sweet Pumpkin Sabzi', beneficialFoods: ['Rice', 'Yogurt', 'Pumpkin', 'Coconut oil'], instructions: 'Enjoy cooling yogurt Kadhi (no mustard seeds) with rice and sweet pumpkin.' },
          dinner: { name: 'Cucumber-Mint Soup with Rice', beneficialFoods: ['Cucumber', 'Mint', 'Rice', 'Ghee'], instructions: 'A cooling cucumber-mint puréed soup served alongside warm steamed basmati rice.' },
          snacks: { name: 'Fresh Watermelon Bowl', beneficialFoods: ['Watermelon'], instructions: 'Enjoy a refreshing bowl of sweet ripe watermelon (eat alone, do not mix).' }
        }
      },
      {
        day: 'Wednesday',
        meals: {
          breakfast: { name: 'Soft Steaped Idli with Coconut Chutney', beneficialFoods: ['Rice flour', 'Urad dal', 'Coconut'], instructions: 'Steamed fermented rice cakes served with mild, sweet coconut chutney.' },
          lunch: { name: 'Barley Khichdi with Peas & Coriander', beneficialFoods: ['Barley', 'Peas', 'Coriander', 'Ghee'], instructions: 'Cook pearled barley with sweet peas, fresh coriander, and a touch of ghee.' },
          dinner: { name: 'Sautéed Asparagus & Sweet Potatoes', beneficialFoods: ['Asparagus', 'Sweet potato', 'Basmati rice', 'Coconut oil'], instructions: 'Asparagus and sweet potato spears sautéed in coconut oil, served over rice.' },
          snacks: { name: 'Sweet Lassi with Cardamom', beneficialFoods: ['Yogurt', 'Cardamom', 'Sugar'], instructions: 'Blend fresh sweet yogurt with water, a pinch of sugar, and cardamom.' }
        }
      },
      {
        day: 'Thursday',
        meals: {
          breakfast: { name: 'Wheat Flakes with Almond Milk', beneficialFoods: ['Wheat flakes', 'Almond milk', 'Cardamom'], instructions: 'Serve organic wheat flakes in warm almond milk flavored with cardamom.' },
          lunch: { name: 'Roti, Sweet Yellow Lentils & Cauliflower Sabzi', beneficialFoods: ['Whole wheat', 'Yellow lentils', 'Cauliflower', 'Coconut oil'], instructions: 'Enjoy soft chapatis with sweet lentils and sautéed cauliflower florets.' },
          dinner: { name: 'Fennel-Infused Barley Soup', beneficialFoods: ['Barley', 'Fennel', 'Carrots', 'Ghee'], instructions: 'Cook barley with carrots and fennel seeds into a light cooling stew.' },
          snacks: { name: 'Soaked Almonds & Sweet Grapes', beneficialFoods: ['Almonds', 'Grapes'], instructions: 'Eat soaked and peeled almonds with a handful of sweet black grapes.' }
        }
      },
      {
        day: 'Friday',
        meals: {
          breakfast: { name: 'Barley Porridge with Coconut Milk', beneficialFoods: ['Barley', 'Coconut milk', 'Maple syrup'], instructions: 'Simmer pearled barley in coconut milk, finish with maple syrup.' },
          lunch: { name: 'Rice, Sprouted Mung Dal & Cucumber Raita', beneficialFoods: ['Rice', 'Mung sprouts', 'Cucumber', 'Yogurt'], instructions: 'Steamed basmati rice with sprouted mung beans and cooling cucumber raita.' },
          dinner: { name: 'Mild Ridge Gourd (Turai) Sabzi & Rotis', beneficialFoods: ['Ridge gourd', 'Whole wheat', 'Coconut oil'], instructions: 'Cook fresh ridge gourd in coconut oil with fennel, serve with soft rotis.' },
          snacks: { name: 'Fresh Sweet Pear or Apple', beneficialFoods: ['Pears', 'Apples'], instructions: 'Enjoy a crisp sweet pear or apple in the late afternoon.' }
        }
      },
      {
        day: 'Saturday',
        meals: {
          breakfast: { name: 'Coriander-Mint Green Smoothie', beneficialFoods: ['Coriander', 'Mint', 'Cucumber', 'Coconut milk'], instructions: 'Blend cucumber, fresh mint, coriander, and light coconut milk into a cooling drink.' },
          lunch: { name: 'Basmati Rice, Sweet Sona Masoori Dal & Broccoli Sauté', beneficialFoods: ['Rice', 'Yellow lentils', 'Broccoli', 'Ghee'], instructions: 'Eat steamed rice with sweet lentils and broccoli florets sautéed in ghee.' },
          dinner: { name: 'Sweet Potato & Green Peas Mash', beneficialFoods: ['Sweet potato', 'Green peas', 'Whole wheat chapatis'], instructions: 'Serve mashed sweet potatoes and peas with warm wheat chapatis.' },
          snacks: { name: 'Coriander Seed Infusion', beneficialFoods: ['Coriander seeds'], instructions: 'Steep coriander seeds in hot water, cool to room temperature, and drink.' }
        }
      },
      {
        day: 'Sunday',
        meals: {
          breakfast: { name: 'Rava Upma with Sweet Peas', beneficialFoods: ['Semolina', 'Peas', 'Coriander', 'Ghee'], instructions: 'Cook savory semolina with sweet peas, cumin, and coriander (no mustard/chillies).' },
          lunch: { name: 'Coconut Rice & Sautéed French Beans', beneficialFoods: ['Basmati rice', 'Coconut milk', 'French beans', 'Coconut oil'], instructions: 'Steamed rice cooked with coconut milk, served with French beans.' },
          dinner: { name: 'Cooling Rice Pudding with Cardamom', beneficialFoods: ['Basmati rice', 'Milk', 'Cardamom', 'Rose water'], instructions: 'Simmer rice in sweet milk with cardamom and a splash of rose water.' },
          snacks: { name: 'Soaked Raisins and Dates', beneficialFoods: ['Raisins', 'Dates'], instructions: 'Snack on sweet soaked raisins and dates to soothe sugar cravings.' }
        }
      }
    ],
    lifestyleTips: [
      'Avoid high midday sun, hot saunas, and steam rooms which raise internal body temperature.',
      'Incorporate cooling lifestyle habits, such as moon-walking (walking under moonlight) and swimming.',
      'Practice calming, non-competitive physical routines like swimming or hatha yoga.',
      'Soothe your eyes and mind by taking screen breaks and applying rose water compress to your eyelids.'
    ],
    herbalRemedies: [
      'Shatavari: A deeply cooling, nourishing adaptogen that soothes the lining of the stomach and balances Pitta hormones.',
      'Amalaki (Amla): An excellent source of vitamin C that cools the digestive tract and reduces systemic acidity.'
    ],
    generalAdvice: 'Eat when you are hungry and do not delay meals. When Pitta’s strong digestive fire lacks food, it burns your own tissues, causing acidity and anger.'
  },
  Kapha: {
    primaryDosha: 'Kapha',
    secondaryDosha: 'None',
    prakritiDistribution: { vata: 20, pitta: 20, kapha: 60 },
    vikritiImbalance: { vata: 10, pitta: 20, kapha: 70 },
    analysis: 'Your profile displays a strong Kapha dominance. Kapha is comprised of Water and Earth elements, governing structure, lubrication, fluid balance, and physical cohesion. Sluggishness, congestion, and a heavy feeling are standard indicators of high Kapha. Your dietary focus should be on light, warm, dry, spicy, bitter, and astringent foods to stimulate metabolism and clear excess fluid/phlegm.',
    beneficialFoods: [
      'Light dry grains (barley, millet, quinoa, buckwheat, amaranth)',
      'Astringent/bitter fruits (apples, pears, pomegranates, cranberries)',
      'Pungent, heating vegetables (leafy greens, broccoli, cabbage, cauliflower, garlic, onions)',
      'Lean light proteins (lentils, black beans, chickpeas, small portions of roasted chicken/turkey)',
      'Minimal oils (mustard oil, corn oil, linseed oil in very small amounts)',
      'Warm herbal teas, ginger tea with raw honey'
    ],
    avoidFoods: [
      'Heavy, cold, and oily foods',
      'Deep-fried items, heavy dairy (cheese, butter, cold cream, ice cream)',
      'Sweet, juicy fruits (bananas, pineapples, avocados, fresh figs, watermelons)',
      'Refined sugars, salt, and wheat products',
      'Iced drinks, sleeping during the day'
    ],
    keySpices: [
      { name: 'Black Pepper', purpose: 'Strong heating spice that stimulates sluggish metabolism and breaks down mucus.' },
      { name: 'Mustard Seeds', purpose: 'Extremely warming, stimulates circulation and clears fat accumulation.' },
      { name: 'Cinnamon', purpose: 'Circulating stimulant that balances blood sugar and warms the body.' },
      { name: 'Garlic', purpose: 'Pungent and heating, it clears dampness and congestion from lungs.' }
    ],
    mealPlan: {
      breakfast: {
        name: 'Warm Spiced Baked Apple',
        beneficialFoods: ['Apple', 'Cinnamon', 'Cloves', 'Raw honey'],
        instructions: 'Bake an apple with cinnamon, cloves, and cardamom. Let it cool slightly to warm, then drizzle with one teaspoon of raw honey. Honey should never be cooked or boiled.'
      },
      lunch: {
        name: 'Spiced Barley Soup & Steamed Greens',
        beneficialFoods: ['Barley', 'Black beans', 'Broccoli', 'Ginger', 'Mustard oil'],
        instructions: 'Prepare a hearty vegetable soup with barley, black beans, celery, onions, garlic, and plenty of ginger and black pepper. Pair with steamed bitter greens drizzled with a tiny amount of mustard oil.'
      },
      dinner: {
        name: 'Dry-Roasted Quinoa & Spicy Lentil Dal',
        beneficialFoods: ['Quinoa', 'Red lentils', 'Cayenne pepper', 'Kale'],
        instructions: 'Cook red lentils into a light dal seasoned with garlic, ginger, and cumin. Serve over dry-toasted quinoa with a side of steam-wilted kale.'
      },
      snacks: {
        name: 'Spicy Ginger-Honey Tea',
        beneficialFoods: ['Fresh ginger', 'Raw honey', 'Lemon juice'],
        instructions: 'Boil fresh sliced ginger root in water for 10 minutes. Let it cool to a warm temperature, add a squeeze of lemon and a teaspoon of raw honey. Sip slowly.'
      }
    },
    weeklyPlan: [
      {
        day: 'Monday',
        meals: {
          breakfast: { name: 'Spicy Besan Chilla', beneficialFoods: ['Gram flour (Besan)', 'Ginger', 'Green chillies', 'Mint'], instructions: 'Savory chickpea flour pancake cooked with ginger, black pepper, and mint chutney.' },
          lunch: { name: 'Spicy Quinoa & Masoor (Red Lentil) Dal', beneficialFoods: ['Quinoa', 'Red lentils', 'Black pepper', 'Ginger'], instructions: 'Red lentils cooked with black pepper and ginger, served over dry-roasted quinoa.' },
          dinner: { name: 'Steamed Cabbage and Broccoli Sauté', beneficialFoods: ['Cabbage', 'Broccoli', 'Mustard oil', 'Ginger'], instructions: 'Wok-tossed cabbage and broccoli seasoned with fresh ginger and a touch of mustard oil.' },
          snacks: { name: 'Warm Ginger-Lemon-Honey Water', beneficialFoods: ['Ginger', 'Lemon', 'Raw honey'], instructions: 'Sip hot ginger-lemon water cooled to warm, stirred with raw honey.' }
        }
      },
      {
        day: 'Tuesday',
        meals: {
          breakfast: { name: 'Dry-Roasted Oats Upma', beneficialFoods: ['Oats', 'Mustard seeds', 'Curry leaves', 'Chillies'], instructions: 'Sauté oats dry, then cook with warm water, mustard seeds, and fresh green chillies.' },
          lunch: { name: 'Millet Roti & Sprouted Mung Bean Sabzi', beneficialFoods: ['Millet (Bajra)', 'Mung sprouts', 'Turmeric', 'Green chillies'], instructions: 'Bajra roti paired with sprouted mung beans stir-fried with green chillies.' },
          dinner: { name: 'Hot Cabbage & Celery Soup', beneficialFoods: ['Cabbage', 'Celery', 'Ginger', 'Black pepper'], instructions: 'A clear, highly stimulating vegetable broth spiced with ginger and black pepper.' },
          snacks: { name: 'Roasted Black Chickpeas (Chana)', beneficialFoods: ['Black chickpeas'], instructions: 'Enjoy a handful of oil-free dry roasted black chickpeas (Chana).' }
        }
      },
      {
        day: 'Wednesday',
        meals: {
          breakfast: { name: 'Baked Spiced Apple', beneficialFoods: ['Apple', 'Cinnamon', 'Cloves'], instructions: 'Bake a crisp apple with cinnamon, cardamom, and cloves; serve hot.' },
          lunch: { name: 'Millet Roti & Spicy Spinach (Palak) Sabzi', beneficialFoods: ['Millet (Jowar)', 'Spinach', 'Garlic', 'Mustard seeds'], instructions: 'Enjoy Jowar roti with spicy garlicky spinach sautéed with mustard seeds.' },
          dinner: { name: 'Spicy Masoor Dal Soup', beneficialFoods: ['Red lentils', 'Cayenne pepper', 'Ginger', 'Garlic'], instructions: 'A fiery, warming red lentil soup seasoned with garlic, ginger, and cumin.' },
          snacks: { name: 'Warm Trikatu Spice Tea', beneficialFoods: ['Black pepper', 'Ginger', 'Long pepper'], instructions: 'Infuse ginger and black pepper in boiling water, sip hot to kindle metabolism.' }
        }
      },
      {
        day: 'Thursday',
        meals: {
          breakfast: { name: 'Spicy Poha with Mustard Seeds', beneficialFoods: ['Flattened rice', 'Mustard seeds', 'Curry leaves', 'Turmeric'], instructions: 'Rinse and drain poha. Cook with mustard seeds, turmeric, and green chillies. Dry texture.' },
          lunch: { name: 'Brown Rice & Spicy Black Chickpeas (Kala Chana)', beneficialFoods: ['Brown rice', 'Black chickpeas', 'Ginger', 'Garlic'], instructions: 'Enjoy a small portion of brown rice with highly spiced dry black chickpeas.' },
          dinner: { name: 'Steamed Asparagus & Brussels Sprouts', beneficialFoods: ['Asparagus', 'Brussels sprouts', 'Black pepper'], instructions: 'Enjoy steamed bitter vegetables sprinkled with freshly ground black pepper.' },
          snacks: { name: 'Dry Roasted Makhana (No Oil)', beneficialFoods: ['Foxnuts'], instructions: 'Dry roast makhana in a pan with turmeric, black pepper, and a pinch of salt.' }
        }
      },
      {
        day: 'Friday',
        meals: {
          breakfast: { name: 'Barley Porridge with Dry Ginger', beneficialFoods: ['Barley', 'Dry ginger', 'Raw honey'], instructions: 'Cook pearled barley in water, flavor with dry ginger, and sweeten with raw honey once warm.' },
          lunch: { name: 'Buckwheat Khichdi with lots of Ginger', beneficialFoods: ['Buckwheat', 'Moong dal', 'Ginger', 'Black pepper'], instructions: 'Prepare a warming, light khichdi using buckwheat instead of rice, heavily spiced.' },
          dinner: { name: 'Spicy Lentil Soup & Rye Cracker', beneficialFoods: ['Lentils', 'Rye crackers', 'Cumin'], instructions: 'A warm bowl of brown lentil soup served with dry-roasted rye crackers.' },
          snacks: { name: 'Sliced Apple with Cinnamon', beneficialFoods: ['Apple', 'Cinnamon'], instructions: 'Snack on fresh crisp apple slices dusted with metabolism-boosting cinnamon.' }
        }
      },
      {
        day: 'Saturday',
        meals: {
          breakfast: { name: 'Ragi Roti with Spicy Tomato Chutney', beneficialFoods: ['Finger millet (Ragi)', 'Tomato', 'Garlic', 'Chillies'], instructions: 'A small ragi flatbread served with a highly stimulating tomato-garlic chutney.' },
          lunch: { name: 'Barley Flatbread & Spiced Bitter Gourd (Karela)', beneficialFoods: ['Barley', 'Bitter gourd', 'Mustard oil', 'Turmeric'], instructions: 'Eat barley roti with bitter gourd stir-fried with turmeric and mustard oil.' },
          dinner: { name: 'Barley Soup with Spinach & Ginger', beneficialFoods: ['Barley', 'Spinach', 'Ginger', 'Black pepper'], instructions: 'A warming green barley broth loaded with wilted spinach and ginger.' },
          snacks: { name: 'Warm Tulsi & Ginger Tea', beneficialFoods: ['Tulsi leaves', 'Fresh ginger'], instructions: 'Steep holy basil (Tulsi) leaves and sliced ginger in hot water.' }
        }
      },
      {
        day: 'Sunday',
        meals: {
          breakfast: { name: 'Savory Besan Chilla with Mint Chutney', beneficialFoods: ['Gram flour', 'Mint', 'Coriander', 'Black pepper'], instructions: 'Chickpea flour savory pancake served with spicy, stimulating mint-coriander chutney.' },
          lunch: { name: 'Quinoa Upma with Mustard-Chilli Tadka', beneficialFoods: ['Quinoa', 'Mustard seeds', 'Green chillies', 'Ginger'], instructions: 'Sauté quinoa in dry spices, steam with ginger and green chillies.' },
          dinner: { name: 'Spiced Vegetable Broth with Moong Sprouts', beneficialFoods: ['Moong sprouts', 'Carrots', 'Cabbage', 'Black pepper'], instructions: 'Cook mung bean sprouts and chopped vegetables in a spicy ginger-cumin broth.' },
          snacks: { name: 'Dry Roasted Pumpkin Seeds', beneficialFoods: ['Pumpkin seeds'], instructions: 'Enjoy a small handful of dry-toasted pumpkin seeds.' }
        }
      }
    ],
    lifestyleTips: [
      'Avoid day sleeping at all costs; it slows down metabolism and increases sluggishness/phlegm.',
      'Wake up early (before 6:00 AM) to align with natural cosmic energetic cycles.',
      'Engage in vigorous, sweat-inducing exercises daily (running, martial arts, power yoga).',
      'Perform dry skin brushing (Garshana) with a raw silk glove to stimulate lymphatic flow and clear cellulite.'
    ],
    herbalRemedies: [
      'Trikatu: A classic formula of black pepper, long pepper, and dry ginger that fires up digestion, burns fat, and clears sinus congestion.',
      'Triphala: Taken at bedtime in warm water to prevent toxic residue (Ama) build-up.'
    ],
    generalAdvice: 'Keep your meals light and seasoned with plenty of herbs and spices. Emphasize physical activity and mental challenges to keep your energy flowing dynamically.'
  }
};
