import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  Utensils, 
  Ban, 
  Compass, 
  Activity, 
  Heart,
  Save,
  Trash2,
  Calendar,
  Layers,
  Flame,
  Wind,
  Droplet,
  Info
} from 'lucide-react';
import { QUESTIONS, SYMPTOMS, FALLBACK_RECOMMENDATIONS } from './data/ayurvedaData';
import { Question, Symptom, DietRecommendation, DoshaScore, SavedReport } from './types';
import DoshaChart from './components/DoshaChart';

export default function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'assess' | 'sandbox' | 'history'>('assess');
  const [quizStep, setQuizStep] = useState<number>(0); // -1 = Introduction, 0-7 = Questions, 8 = Symptom selection, 9 = Recommendation output
  
  // Quiz answers state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  
  // Symptoms checklist state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  // ML Recommendation state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<DietRecommendation | null>(null);
  const [prakritiScores, setPrakritiScores] = useState<DoshaScore>({ vata: 0, pitta: 0, kapha: 0 });
  const [vikritiScores, setVikritiScores] = useState<DoshaScore>({ vata: 0, pitta: 0, kapha: 0 });
  
  // History of saved reports
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  
  // Sandbox state
  const [sandboxPrakriti, setSandboxPrakriti] = useState<DoshaScore>({ vata: 40, pitta: 30, kapha: 30 });
  const [sandboxSymptoms, setSandboxSymptoms] = useState<string[]>([]);
  const [sandboxRecommendation, setSandboxRecommendation] = useState<DietRecommendation | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);

  // Active sub-tab inside recommendation view
  const [recSubTab, setRecSubTab] = useState<'meals' | 'foods' | 'spices' | 'lifestyle'>('meals');

  // Load saved history on startup
  useEffect(() => {
    const history = localStorage.getItem('ayurveda_history');
    if (history) {
      try {
        setSavedReports(JSON.parse(history));
      } catch (e) {
        console.error('Error loading history', e);
      }
    }
  }, []);

  // Calculate Prakriti (constitution) from quiz answers
  const calculatePrakriti = (answers: Record<string, string>): DoshaScore => {
    let vata = 0;
    let pitta = 0;
    let kapha = 0;

    QUESTIONS.forEach((q) => {
      const selectedOptionId = answers[q.id];
      if (selectedOptionId) {
        const option = q.options.find((o) => o.id === selectedOptionId);
        if (option) {
          vata += option.vata;
          pitta += option.pitta;
          kapha += option.kapha;
        }
      }
    });

    const total = vata + pitta + kapha || 1;
    return {
      vata: Math.round((vata / total) * 100),
      pitta: Math.round((pitta / total) * 100),
      kapha: Math.round((kapha / total) * 100),
    };
  };

  // Calculate Vikriti (imbalances) based on symptoms selected
  const calculateVikriti = (symptomIds: string[], baseline: DoshaScore): DoshaScore => {
    let vataCount = 0;
    let pittaCount = 0;
    let kaphaCount = 0;

    symptomIds.forEach((id) => {
      const sym = SYMPTOMS.find((s) => s.id === id);
      if (sym) {
        if (sym.dosha === 'vata') vataCount += 25;
        if (sym.dosha === 'pitta') pittaCount += 25;
        if (sym.dosha === 'kapha') kaphaCount += 25;
      }
    });

    // Add baseline tendency (constitution defines how we slip into imbalance)
    const baseVataWeight = baseline.vata * 0.3;
    const basePittaWeight = baseline.pitta * 0.3;
    const baseKaphaWeight = baseline.kapha * 0.3;

    const totalVata = vataCount + baseVataWeight;
    const totalPitta = pittaCount + basePittaWeight;
    const totalKapha = kaphaCount + baseKaphaWeight;

    const grandTotal = totalVata + totalPitta + totalKapha || 1;

    return {
      vata: Math.round((totalVata / grandTotal) * 100),
      pitta: Math.round((totalPitta / grandTotal) * 100),
      kapha: Math.round((totalKapha / grandTotal) * 100),
    };
  };

  // Run the recommender
  const handleGenerateRecommendation = async (
    scores: DoshaScore, 
    symptomIds: string[], 
    isSandbox: boolean = false
  ) => {
    const activeLoadingSetter = isSandbox ? setSandboxLoading : setIsLoading;
    const activeRecSetter = isSandbox ? setSandboxRecommendation : setRecommendation;
    
    activeLoadingSetter(true);

    const calculatedVikriti = calculateVikriti(symptomIds, scores);
    if (!isSandbox) {
      setVikritiScores(calculatedVikriti);
    }

    // Prepare list of symptom texts for prompt context
    const symptomTexts = symptomIds.map(id => SYMPTOMS.find(s => s.id === id)?.text || '').filter(Boolean);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prakritiScores: scores,
          selectedSymptoms: symptomIds,
          selectedSymptomTexts: symptomTexts
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();

      if (data.isFallback) {
        // Fallback calculation locally based on primary dosha
        console.log("Using local algorithm fallback");
        const primary = getPrimaryDoshaName(scores);
        const fallback = FALLBACK_RECOMMENDATIONS[primary];
        
        // Inject correct distribution scores
        const enrichedFallback: DietRecommendation = {
          ...fallback,
          prakritiDistribution: scores,
          vikritiImbalance: calculatedVikriti,
          analysis: `Based on your Mind-Body Assessment, your dominant constitution is ${primary}. ` +
            `Your symptoms point to an accumulation of ${getPrimaryDoshaName(calculatedVikriti)} energy in your system. ` +
            `Ayurveda teaches that 'like increases like' and 'opposites cure'. Thus, we have generated a diet that cools, moistens, or grounds these specific elements.`
        };

        activeRecSetter(enrichedFallback);
      } else {
        activeRecSetter(data);
      }
    } catch (err) {
      console.error("Failed to connect to recommendation server. Loading local AI model prediction.", err);
      // Perfect graceful fallback
      const primary = getPrimaryDoshaName(scores);
      const fallback = FALLBACK_RECOMMENDATIONS[primary];
      const enrichedFallback: DietRecommendation = {
        ...fallback,
        prakritiDistribution: scores,
        vikritiImbalance: calculatedVikriti,
        analysis: `[Local Ayurvedic Rule-Engine] Your baseline is predominantly ${primary} with some secondary tendencies. Your current lifestyle choices and symptoms suggest a Vikriti (current imbalance) leaning toward ${getPrimaryDoshaName(calculatedVikriti)}. Here is your holistic, element-balancing diet prescription.`
      };
      activeRecSetter(enrichedFallback);
    } finally {
      activeLoadingSetter(false);
      if (!isSandbox) {
        setQuizStep(9); // Render recommendation panel
      }
    }
  };

  const getPrimaryDoshaName = (scores: DoshaScore): 'Vata' | 'Pitta' | 'Kapha' => {
    const { vata, pitta, kapha } = scores;
    if (vata >= pitta && vata >= kapha) return 'Vata';
    if (pitta >= vata && pitta >= kapha) return 'Pitta';
    return 'Kapha';
  };

  const getDoshaDetails = (dosha: 'Vata' | 'Pitta' | 'Kapha') => {
    switch (dosha) {
      case 'Vata':
        return {
          elements: 'Air & Ether (Space)',
          qualities: 'Dry, light, cold, rough, subtle, mobile',
          slogan: 'Governs all physiological movement and energy flow.',
          bgColor: 'bg-sky-50 text-sky-800 border-sky-200',
          textColor: 'text-[#3E7CA6]'
        };
      case 'Pitta':
        return {
          elements: 'Fire & Water',
          qualities: 'Hot, sharp, light, liquid, oily, spreading',
          slogan: 'Governs metabolism, digestion, warmth, and transformation.',
          bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
          textColor: 'text-[#C95B3C]'
        };
      case 'Kapha':
        return {
          elements: 'Water & Earth',
          qualities: 'Heavy, slow, cold, oily, smooth, dense, stable',
          slogan: 'Governs structure, lubrication, physical cohesion, and strength.',
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          textColor: 'text-[#3B8053]'
        };
    }
  };

  // Save the generated recommendation to local storage history
  const handleSaveReport = () => {
    if (!recommendation) return;

    const newReport: SavedReport = {
      id: 'report_' + Date.now(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      prakritiDistribution: prakritiScores,
      vikritiImbalance: vikritiScores,
      primaryDosha: recommendation.primaryDosha,
      symptomsCount: selectedSymptoms.length,
      recommendation: recommendation
    };

    const updatedHistory = [newReport, ...savedReports];
    setSavedReports(updatedHistory);
    localStorage.setItem('ayurveda_history', JSON.stringify(updatedHistory));
    alert('Your custom Ayurvedic dietary report has been saved successfully in your local browser storage!');
  };

  // Delete a report from history
  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem('ayurveda_history', JSON.stringify(updated));
  };

  // Handle option selection during quiz
  const handleSelectOption = (questionId: string, optionId: string) => {
    const updatedAnswers = { ...quizAnswers, [questionId]: optionId };
    setQuizAnswers(updatedAnswers);

    // Calculate intermediate scores
    const currentPrakriti = calculatePrakriti(updatedAnswers);
    setPrakritiScores(currentPrakriti);

    // Auto advance to next question after short delay
    setTimeout(() => {
      if (quizStep < QUESTIONS.length - 1) {
        setQuizStep(prev => prev + 1);
      } else {
        setQuizStep(QUESTIONS.length); // Go to symptoms checklist
      }
    }, 400);
  };

  // Toggle symptoms
  const handleToggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Reset assessment
  const handleRestart = () => {
    setQuizAnswers({});
    setSelectedSymptoms([]);
    setRecommendation(null);
    setPrakritiScores({ vata: 0, pitta: 0, kapha: 0 });
    setVikritiScores({ vata: 0, pitta: 0, kapha: 0 });
    setQuizStep(0);
  };

  // Load a saved report
  const handleLoadSavedReport = (report: SavedReport) => {
    setPrakritiScores(report.prakritiDistribution);
    setVikritiScores(report.vikritiImbalance);
    setRecommendation(report.recommendation);
    setSelectedSymptoms(Array(report.symptomsCount).fill('loaded'));
    setQuizStep(9);
    setActiveTab('assess');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-800 font-sans antialiased selection:bg-amber-200 selection:text-amber-900" id="app_root">
      {/* Decorative top bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-500"></div>

      {/* Main navigation header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/60" id="main_header">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#E29B63] to-[#427C55] rounded-xl text-white shadow-sm flex items-center justify-center">
              <Leaf className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif text-xl font-bold text-stone-800 tracking-tight">PrakritiAI</h1>
              </div>
              <p className="text-xs text-stone-500">Prakriti & Vikriti Element-Balancing Diet Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/50 text-sm font-medium" id="header_nav">
            <button
              id="nav_assess_btn"
              onClick={() => { setActiveTab('assess'); }}
              className={`px-4 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'assess'
                  ? 'bg-white text-stone-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              Diet Assessment
            </button>
            <button
              id="nav_sandbox_btn"
              onClick={() => { setActiveTab('sandbox'); }}
              className={`px-4 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'sandbox'
                  ? 'bg-white text-stone-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              Dosha Sandbox
            </button>
            <button
              id="nav_history_btn"
              onClick={() => { setActiveTab('history'); }}
              className={`px-4 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-stone-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Saved Plans
              {savedReports.length > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono">
                  {savedReports.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8" id="main_content_container">
        
        {/* TAB 1: CONSTITUTION ASSESSMENT */}
        {activeTab === 'assess' && (
          <div className="space-y-8" id="tab_assess">
            
            {/* Step -1: Introduction / Welcome Page */}
            {quizStep === -1 && (
              <div className="max-w-3xl mx-auto bg-white border border-stone-200/80 rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden" id="intro_panel">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5E6D3]/30 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50/40 rounded-full blur-3xl -z-10"></div>
                
                <div className="text-center space-y-6">
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-[#C95B3C] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-100">
                    <Sparkles className="w-3.5 h-3.5" /> 5,000-Year-Old Vedic Science
                  </span>
                  
                  <h2 className="font-serif text-3xl sm:text-4xl text-stone-800 leading-tight">
                    Discover Your Natural Constitution <br/>
                    <span className="text-[#427C55] italic">And Personalized Healing Diet</span>
                  </h2>

                  <p className="text-stone-600 text-base max-w-xl mx-auto leading-relaxed">
                    According to Ayurveda, health is perfect harmony between three biological forces: 
                    <strong> Vata</strong> (Air), <strong>Pitta</strong> (Fire), and <strong>Kapha</strong> (Earth). 
                    Our smart recommender charts your unique baseline (Prakriti) and current symptom imbalances (Vikriti) 
                    to formulate an authentic Ayurvedic culinary prescription.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 text-left">
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100">
                      <div className="text-[#3E7CA6] font-serif font-semibold mb-1">1. Baseline Quiz</div>
                      <p className="text-xs text-stone-500">Determine your genetic Prakriti body frame, skin texture, and mental stamina.</p>
                    </div>
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100">
                      <div className="text-[#C95B3C] font-serif font-semibold mb-1">2. Current Symptoms</div>
                      <p className="text-xs text-stone-500">Identify immediate digestive, sleep, skin, or emotional imbalances (Vikriti).</p>
                    </div>
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100">
                      <div className="text-[#427C55] font-serif font-semibold mb-1">3. AI Culinary Plan</div>
                      <p className="text-xs text-stone-500">Get a targeted macro/micro recipe plan, spices list, and daily lifestyle guides.</p>
                    </div>
                  </div>

                  <button
                    id="start_assessment_btn"
                    onClick={() => setQuizStep(0)}
                    className="inline-flex items-center gap-2 bg-[#427C55] hover:bg-[#346243] text-white font-medium px-8 py-4 rounded-2xl shadow-md transition-all duration-300 hover:translate-y-[-1px] group cursor-pointer"
                  >
                    Begin Mind-Body Assessment
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 0 to 7: Prakriti Quiz Questions */}
            {quizStep >= 0 && quizStep < QUESTIONS.length && (
              <div className="max-w-2xl mx-auto" id="quiz_question_panel">
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-stone-500 font-medium mb-1.5">
                    <span>Baseline Quiz (Prakriti)</span>
                    <span>Question {quizStep + 1} of {QUESTIONS.length}</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-200/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${((quizStep + 1) / QUESTIONS.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Question Card */}
                <div className="bg-white border border-stone-200/70 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <span className="text-xs uppercase tracking-wider text-stone-400 font-mono font-bold block mb-1">
                    {QUESTIONS[quizStep].category} Characteristics
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-stone-800 mb-6 leading-snug">
                    {QUESTIONS[quizStep].text}
                  </h3>

                  <div className="space-y-4">
                    {QUESTIONS[quizStep].options.map((option) => {
                      const isSelected = quizAnswers[QUESTIONS[quizStep].id] === option.id;
                      return (
                        <button
                          key={option.id}
                          id={`option_${option.id}`}
                          onClick={() => handleSelectOption(QUESTIONS[quizStep].id, option.id)}
                          className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                            isSelected
                              ? 'bg-[#FAF6F0] border-amber-500 ring-2 ring-amber-500/10'
                              : 'bg-stone-50 hover:bg-[#FAF8F5] border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <span className="text-stone-700 text-sm sm:text-base font-medium pr-4">{option.text}</span>
                          <div className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-stone-300 group-hover:border-stone-400 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Back button */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-100">
                    <button
                      id="quiz_back_btn"
                      onClick={() => setQuizStep(prev => prev - 1)}
                      className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <span className="text-xs text-stone-400 italic">Select an option to advance automatically</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Vikriti Symptoms Checklist */}
            {quizStep === QUESTIONS.length && (
              <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="symptoms_panel">
                <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-stone-100">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-500">Immediate Diagnostics</span>
                      <h3 className="font-serif text-2xl text-stone-800 mt-0.5">Symptom Checklist (Vikriti Imbalance)</h3>
                      <p className="text-xs text-stone-500 mt-1">Select any current symptoms you have felt consistently over the last 2-3 weeks.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        id="clear_symptoms_btn"
                        onClick={() => setSelectedSymptoms([])}
                        className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                      >
                        Clear All
                      </button>
                      <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-semibold border border-rose-100">
                        {selectedSymptoms.length} Selected
                      </span>
                    </div>
                  </div>

                  {/* Symptom categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Digestion Category */}
                    <div className="space-y-3">
                      <h4 className="font-serif font-semibold text-stone-800 text-sm flex items-center gap-2 border-b border-stone-100 pb-1.5">
                        <Utensils className="w-4 h-4 text-amber-500" /> Digestive & Assimilation
                      </h4>
                      <div className="space-y-2">
                        {SYMPTOMS.filter(s => s.category === 'digestion').map(s => (
                          <label 
                            key={s.id} 
                            id={`label_${s.id}`}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              selectedSymptoms.includes(s.id)
                                ? 'bg-rose-50/40 border-rose-200'
                                : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200/60'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedSymptoms.includes(s.id)}
                              onChange={() => handleToggleSymptom(s.id)}
                              className="mt-0.5 accent-rose-600 rounded"
                            />
                            <div className="text-xs font-medium text-stone-700">{s.text}</div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Skin & Physical Category */}
                    <div className="space-y-3">
                      <h4 className="font-serif font-semibold text-stone-800 text-sm flex items-center gap-2 border-b border-stone-100 pb-1.5">
                        <Activity className="w-4 h-4 text-[#427C55]" /> Skin & Joint Comfort
                      </h4>
                      <div className="space-y-2">
                        {SYMPTOMS.filter(s => s.category === 'skin' || s.category === 'physical').slice(0, 5).map(s => (
                          <label 
                            key={s.id} 
                            id={`label_${s.id}`}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              selectedSymptoms.includes(s.id)
                                ? 'bg-rose-50/40 border-rose-200'
                                : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200/60'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedSymptoms.includes(s.id)}
                              onChange={() => handleToggleSymptom(s.id)}
                              className="mt-0.5 accent-rose-600 rounded"
                            />
                            <div className="text-xs font-medium text-stone-700">{s.text}</div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Mind & Emotional Category */}
                    <div className="space-y-3">
                      <h4 className="font-serif font-semibold text-stone-800 text-sm flex items-center gap-2 border-b border-stone-100 pb-1.5">
                        <Heart className="w-4 h-4 text-sky-500" /> Mind, Emotion & Stress
                      </h4>
                      <div className="space-y-2">
                        {SYMPTOMS.filter(s => s.category === 'mind').map(s => (
                          <label 
                            key={s.id} 
                            id={`label_${s.id}`}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              selectedSymptoms.includes(s.id)
                                ? 'bg-rose-50/40 border-rose-200'
                                : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200/60'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedSymptoms.includes(s.id)}
                              onChange={() => handleToggleSymptom(s.id)}
                              className="mt-0.5 accent-rose-600 rounded"
                            />
                            <div className="text-xs font-medium text-stone-700">{s.text}</div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Sleep & General Energy */}
                    <div className="space-y-3">
                      <h4 className="font-serif font-semibold text-stone-800 text-sm flex items-center gap-2 border-b border-stone-100 pb-1.5">
                        <Clock className="w-4 h-4 text-purple-500" /> Sleep, Energy & Rest
                      </h4>
                      <div className="space-y-2">
                        {SYMPTOMS.filter(s => s.category === 'energy' || s.category === 'physical').slice(5).map(s => (
                          <label 
                            key={s.id} 
                            id={`label_${s.id}`}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              selectedSymptoms.includes(s.id)
                                ? 'bg-rose-50/40 border-rose-200'
                                : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200/60'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedSymptoms.includes(s.id)}
                              onChange={() => handleToggleSymptom(s.id)}
                              className="mt-0.5 accent-rose-600 rounded"
                            />
                            <div className="text-xs font-medium text-stone-700">{s.text}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-100">
                    <button
                      id="symptoms_back_btn"
                      onClick={() => setQuizStep(QUESTIONS.length - 1)}
                      className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Quiz
                    </button>

                    <button
                      id="get_diet_recommendation_btn"
                      disabled={isLoading}
                      onClick={() => handleGenerateRecommendation(prakritiScores, selectedSymptoms)}
                      className="inline-flex items-center gap-2 bg-[#427C55] hover:bg-[#346243] disabled:bg-stone-400 text-white font-medium px-6 py-3 rounded-2xl shadow-xs transition-all duration-300 hover:translate-y-[-1px] cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Analyzing Elements...
                        </>
                      ) : (
                        <>
                          Formulate Diet Prescription
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 9: Recommendation Display Panel */}
            {quizStep === 9 && recommendation && (
              <div className="space-y-8 animate-fade-in" id="recommendation_panel">
                
                {/* Result header summary */}
                <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#427C55]/5 rounded-full blur-2xl"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-100 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Assessment Complete
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 leading-tight">
                        Your Custom Ayurvedic Diet Prescription
                      </h2>
                      <p className="text-xs text-stone-500">
                        Based on baseline Prakriti (Constitution) and active symptoms (Vikriti)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        id="save_report_btn"
                        onClick={handleSaveReport}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Save className="w-4 h-4" /> Save Report
                      </button>
                      <button
                        id="restart_assessment_btn"
                        onClick={handleRestart}
                        className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-stone-200/60 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset Quiz
                      </button>
                    </div>
                  </div>

                  {/* Primary & Secondary Dosha badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <div className={`p-4 rounded-2xl border ${getDoshaDetails(recommendation.primaryDosha).bgColor}`}>
                      <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">Dominant Prakriti (Baseline)</div>
                      <div className="text-xl font-serif font-bold mt-1">{recommendation.primaryDosha}</div>
                      <div className="text-xs mt-1 text-stone-600">
                        Elements: <strong>{getDoshaDetails(recommendation.primaryDosha).elements}</strong>
                      </div>
                      <p className="text-xs mt-1.5 italic text-stone-600">
                        {getDoshaDetails(recommendation.primaryDosha).slogan}
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${
                      recommendation.secondaryDosha !== 'None' 
                        ? getDoshaDetails(recommendation.secondaryDosha as any).bgColor
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}>
                      <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">Secondary Tendency</div>
                      <div className="text-xl font-serif font-bold mt-1">
                        {recommendation.secondaryDosha !== 'None' ? recommendation.secondaryDosha : 'Fully Balanced Baseline'}
                      </div>
                      <div className="text-xs mt-1 text-stone-600">
                        {recommendation.secondaryDosha !== 'None' ? (
                          <>Elements: <strong>{getDoshaDetails(recommendation.secondaryDosha as any).elements}</strong></>
                        ) : 'No high secondary doshas observed.'}
                      </div>
                      <p className="text-xs mt-1.5 italic text-stone-600">
                        {recommendation.secondaryDosha !== 'None' 
                          ? getDoshaDetails(recommendation.secondaryDosha as any).slogan
                          : 'Your element spectrum is highly centered.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dosha Distribution Charts */}
                <DoshaChart 
                  prakriti={prakritiScores} 
                  vikriti={vikritiScores}
                  title="Dynamic Element Matrix"
                  subtitle="Comparison of your inherent genetic baseline (Prakriti) versus active systemic stressors (Vikriti)"
                />

                {/* AI Mind-Body Analysis Box */}
                <div className="bg-gradient-to-br from-[#FAF8F5] to-amber-50/10 border border-amber-200/60 rounded-3xl p-6 sm:p-8" id="ai_analysis_box">
                  <div className="flex items-center gap-2 text-amber-800 font-serif font-semibold text-lg mb-3">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    Custom Mind-Body Analysis
                  </div>
                  <div className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {recommendation.analysis}
                  </div>
                </div>

                {/* Tabbed recommendation items */}
                <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs" id="diet_details_tabs">
                  <div className="flex border-b border-stone-200 overflow-x-auto bg-stone-50/50">
                    <button
                      id="subtab_meals_btn"
                      onClick={() => setRecSubTab('meals')}
                      className={`flex-1 min-w-[120px] px-6 py-4 text-center font-serif text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        recSubTab === 'meals'
                          ? 'border-emerald-600 text-emerald-800 bg-white'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Daily Meal Plan
                    </button>
                    <button
                      id="subtab_foods_btn"
                      onClick={() => setRecSubTab('foods')}
                      className={`flex-1 min-w-[120px] px-6 py-4 text-center font-serif text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        recSubTab === 'foods'
                          ? 'border-emerald-600 text-emerald-800 bg-white'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Favor & Avoid List
                    </button>
                    <button
                      id="subtab_spices_btn"
                      onClick={() => setRecSubTab('spices')}
                      className={`flex-1 min-w-[120px] px-6 py-4 text-center font-serif text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        recSubTab === 'spices'
                          ? 'border-emerald-600 text-emerald-800 bg-white'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Therapeutic Spices
                    </button>
                    <button
                      id="subtab_lifestyle_btn"
                      onClick={() => setRecSubTab('lifestyle')}
                      className={`flex-1 min-w-[120px] px-6 py-4 text-center font-serif text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        recSubTab === 'lifestyle'
                          ? 'border-emerald-600 text-emerald-800 bg-white'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Lifestyle & Herbs
                    </button>
                  </div>

                  <div className="p-6 sm:p-8">
                    {/* SUB-TAB 1: MEAL PLAN */}
                    {recSubTab === 'meals' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="w-5 h-5 text-emerald-600" />
                          <h4 className="font-serif text-lg font-bold text-stone-800">Circadian Food Sequence</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Breakfast */}
                          <div className="border border-stone-200/60 p-5 rounded-2xl hover:bg-[#FAF8F5] transition-all">
                            <span className="text-[10px] bg-sky-50 text-[#3E7CA6] font-bold px-2 py-0.5 rounded font-mono uppercase">Breakfast (Agni Sunrise)</span>
                            <h5 className="font-serif font-bold text-stone-800 text-base mt-2">{recommendation.mealPlan.breakfast.name}</h5>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {recommendation.mealPlan.breakfast.beneficialFoods.map((f, i) => (
                                <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-sans">{f}</span>
                              ))}
                            </div>
                            <p className="text-xs text-stone-600 mt-3 font-sans leading-relaxed border-t border-stone-100 pt-2.5">
                              {recommendation.mealPlan.breakfast.instructions}
                            </p>
                          </div>

                          {/* Lunch */}
                          <div className="border border-stone-200/60 p-5 rounded-2xl hover:bg-[#FAF8F5] transition-all">
                            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded font-mono uppercase">Lunch (Principal Meal - Highest Agni)</span>
                            <h5 className="font-serif font-bold text-stone-800 text-base mt-2">{recommendation.mealPlan.lunch.name}</h5>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {recommendation.mealPlan.lunch.beneficialFoods.map((f, i) => (
                                <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-sans">{f}</span>
                              ))}
                            </div>
                            <p className="text-xs text-stone-600 mt-3 font-sans leading-relaxed border-t border-stone-100 pt-2.5">
                              {recommendation.mealPlan.lunch.instructions}
                            </p>
                          </div>

                          {/* Dinner */}
                          <div className="border border-stone-200/60 p-5 rounded-2xl hover:bg-[#FAF8F5] transition-all">
                            <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded font-mono uppercase">Dinner (Twilight Nourishment)</span>
                            <h5 className="font-serif font-bold text-stone-800 text-base mt-2">{recommendation.mealPlan.dinner.name}</h5>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {recommendation.mealPlan.dinner.beneficialFoods.map((f, i) => (
                                <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-sans">{f}</span>
                              ))}
                            </div>
                            <p className="text-xs text-stone-600 mt-3 font-sans leading-relaxed border-t border-stone-100 pt-2.5">
                              {recommendation.mealPlan.dinner.instructions}
                            </p>
                          </div>

                          {/* Snacks */}
                          <div className="border border-stone-200/60 p-5 rounded-2xl hover:bg-[#FAF8F5] transition-all">
                            <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded font-mono uppercase">Snack (Between Meal Infusions)</span>
                            <h5 className="font-serif font-bold text-stone-800 text-base mt-2">{recommendation.mealPlan.snacks.name}</h5>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {recommendation.mealPlan.snacks.beneficialFoods.map((f, i) => (
                                <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-sans">{f}</span>
                              ))}
                            </div>
                            <p className="text-xs text-stone-600 mt-3 font-sans leading-relaxed border-t border-stone-100 pt-2.5">
                              {recommendation.mealPlan.snacks.instructions}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: BENEFICIAL vs AVOID */}
                    {recSubTab === 'foods' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Beneficial */}
                        <div className="bg-emerald-50/30 border border-emerald-200/60 p-6 rounded-2xl">
                          <div className="flex items-center gap-2 text-emerald-800 font-serif font-bold text-base mb-4">
                            <Check className="w-5 h-5 text-emerald-600" />
                            Foods to Favor (Pushti)
                          </div>
                          <ul className="space-y-3">
                            {recommendation.beneficialFoods.map((item, index) => (
                              <li key={index} className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed">
                                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Avoid */}
                        <div className="bg-rose-50/20 border border-rose-200/50 p-6 rounded-2xl">
                          <div className="flex items-center gap-2 text-rose-800 font-serif font-bold text-base mb-4">
                            <Ban className="w-5 h-5 text-rose-600" />
                            Foods to Avoid / Limit
                          </div>
                          <ul className="space-y-3">
                            {recommendation.avoidFoods.map((item, index) => (
                              <li key={index} className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed">
                                <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 3: THERAPEUTIC SPICES */}
                    {recSubTab === 'spices' && (
                      <div className="space-y-6">
                        <p className="text-xs text-stone-500 mb-2 leading-relaxed">
                          Spices are the primary chemical engines of Ayurvedic medicine. They stoke your digestive fire (Agni) and assist in the digestion and assimilation of heavy nutrients.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {recommendation.keySpices.map((spice, index) => (
                            <div key={index} className="bg-amber-50/20 border border-amber-200/40 p-4 rounded-xl flex items-start gap-3">
                              <span className="bg-[#E29B63]/20 text-[#C95B3C] p-2 rounded-lg text-xs font-bold font-mono">
                                0{index + 1}
                              </span>
                              <div>
                                <h5 className="font-serif font-bold text-stone-800 text-sm">{spice.name}</h5>
                                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{spice.purpose}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 4: LIFESTYLE & HERBS */}
                    {recSubTab === 'lifestyle' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Dinacharya Habits */}
                        <div className="space-y-4">
                          <h5 className="font-serif font-bold text-stone-800 text-sm border-b border-stone-200 pb-2">
                            Daily Rituals (Dinacharya)
                          </h5>
                          <ul className="space-y-3">
                            {recommendation.lifestyleTips.map((tip, index) => (
                              <li key={index} className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed">
                                <span className="bg-[#427C55]/10 text-[#427C55] w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] mt-0.5">
                                  {index + 1}
                                </span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Traditional Herbs */}
                        <div className="space-y-4">
                          <h5 className="font-serif font-bold text-stone-800 text-sm border-b border-stone-200 pb-2">
                            Aromatic Herbo-mineral Preparations
                          </h5>
                          <ul className="space-y-3">
                            {recommendation.herbalRemedies.map((remedy, index) => (
                              <li key={index} className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/40">
                                <span className="text-amber-600 shrink-0 mt-0.5">✦</span>
                                <div>{remedy}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* General closing advice */}
                <div className="text-center p-6 bg-stone-100 rounded-3xl border border-stone-200/60 italic font-serif text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">
                  "{recommendation.generalAdvice}"
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 2: DOSHA SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="space-y-8 max-w-4xl mx-auto" id="tab_sandbox">
            <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <Compass className="w-6 h-6 text-amber-500 animate-spin" />
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl text-stone-800">Dynamic Dosha Sandbox Playground</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Manually adjust the slider percentages of Vata, Pitta, and Kapha to explore how the Ayurvedic kitchen recommendation alters instantly.
                  </p>
                </div>
              </div>

              {/* Slider panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FAF8F5] p-6 rounded-2xl border border-stone-100 mb-8">
                {/* Vata Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono font-bold mb-2">
                    <span className="text-sky-700 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5" /> Vata
                    </span>
                    <span>{sandboxPrakriti.vata}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={sandboxPrakriti.vata}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const diff = 100 - val;
                      const ratio = sandboxPrakriti.pitta + sandboxPrakriti.kapha || 1;
                      setSandboxPrakriti({
                        vata: val,
                        pitta: Math.round((sandboxPrakriti.pitta / ratio) * diff),
                        kapha: Math.round((sandboxPrakriti.kapha / ratio) * diff)
                      });
                    }}
                    className="w-full accent-sky-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Air/Ether balance: mobility, nervous speed.</p>
                </div>

                {/* Pitta Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono font-bold mb-2">
                    <span className="text-[#C95B3C] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> Pitta
                    </span>
                    <span>{sandboxPrakriti.pitta}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={sandboxPrakriti.pitta}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const diff = 100 - val;
                      const ratio = sandboxPrakriti.vata + sandboxPrakriti.kapha || 1;
                      setSandboxPrakriti({
                        pitta: val,
                        vata: Math.round((sandboxPrakriti.vata / ratio) * diff),
                        kapha: Math.round((sandboxPrakriti.kapha / ratio) * diff)
                      });
                    }}
                    className="w-full accent-orange-600"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Fire/Water balance: warmth, digestive fire (Agni).</p>
                </div>

                {/* Kapha Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono font-bold mb-2">
                    <span className="text-[#3B8053] flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5" /> Kapha
                    </span>
                    <span>{sandboxPrakriti.kapha}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={sandboxPrakriti.kapha}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const diff = 100 - val;
                      const ratio = sandboxPrakriti.vata + sandboxPrakriti.pitta || 1;
                      setSandboxPrakriti({
                        kapha: val,
                        vata: Math.round((sandboxPrakriti.vata / ratio) * diff),
                        pitta: Math.round((sandboxPrakriti.pitta / ratio) * diff)
                      });
                    }}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Water/Earth balance: physical tissue, immunity.</p>
                </div>
              </div>

              {/* Dynamic symptom toggle */}
              <div className="space-y-3 mb-8">
                <label className="text-xs font-serif font-bold text-stone-700 block">Simulate Active Symptoms for Sandbox (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.slice(0, 10).map((sym) => {
                    const isSelected = sandboxSymptoms.includes(sym.id);
                    return (
                      <button
                        key={sym.id}
                        id={`sandbox_sym_${sym.id}`}
                        onClick={() => {
                          setSandboxSymptoms(prev =>
                            prev.includes(sym.id) ? prev.filter(x => x !== sym.id) : [...prev, sym.id]
                          );
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50 text-rose-700 border-rose-200 font-medium'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {sym.text}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  id="sandbox_generate_btn"
                  disabled={sandboxLoading}
                  onClick={() => handleGenerateRecommendation(sandboxPrakriti, sandboxSymptoms, true)}
                  className="bg-stone-800 hover:bg-stone-900 text-white text-sm font-semibold px-6 py-3 rounded-2xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  {sandboxLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Rendering Custom Recipe...
                    </>
                  ) : (
                    <>
                      Map Sandbox Values to Diet Plan
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sandbox recommendation output */}
            {sandboxRecommendation && (
              <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-[10px] bg-amber-50 text-amber-800 font-mono font-bold uppercase px-2.5 py-0.5 rounded">Live Map Output</span>
                    <h4 className="font-serif text-lg text-stone-800 mt-1">
                      Culinary Plan for {sandboxRecommendation.primaryDosha}-dominant system
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 font-mono">
                      V: {sandboxPrakriti.vata}% | P: {sandboxPrakriti.pitta}% | K: {sandboxPrakriti.kapha}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Meals */}
                  <div className="space-y-4">
                    <h5 className="font-serif font-bold text-stone-800 text-sm flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-emerald-600" /> Key Recipe Plan
                    </h5>
                    <div className="space-y-3 bg-[#FAF8F5] p-4 rounded-xl border border-stone-100">
                      <div>
                        <div className="text-[10px] text-stone-400 uppercase font-mono">Principal Lunch</div>
                        <div className="text-xs font-bold text-stone-800">{sandboxRecommendation.mealPlan.lunch.name}</div>
                        <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">{sandboxRecommendation.mealPlan.lunch.instructions}</p>
                      </div>
                      <div className="border-t border-stone-200/60 pt-2.5">
                        <div className="text-[10px] text-stone-400 uppercase font-mono">Therapeutic Snack</div>
                        <div className="text-xs font-bold text-stone-800">{sandboxRecommendation.mealPlan.snacks.name}</div>
                        <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">{sandboxRecommendation.mealPlan.snacks.instructions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Beneficial / Avoid lists */}
                  <div className="space-y-4">
                    <h5 className="font-serif font-bold text-stone-800 text-sm flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-500" /> Elements Tuning
                    </h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-emerald-50/20 p-3 rounded-xl border border-emerald-100">
                        <span className="font-bold text-emerald-800">Favor Items:</span>
                        <ul className="list-disc pl-3.5 space-y-1 mt-1.5 text-[11px] text-stone-600">
                          {sandboxRecommendation.beneficialFoods.slice(0, 3).map((f, i) => (
                            <li key={i}>{f.split('(')[0]}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-rose-50/10 p-3 rounded-xl border border-rose-100">
                        <span className="font-bold text-rose-800">Avoid Items:</span>
                        <ul className="list-disc pl-3.5 space-y-1 mt-1.5 text-[11px] text-stone-600">
                          {sandboxRecommendation.avoidFoods.slice(0, 3).map((f, i) => (
                            <li key={i}>{f.split('(')[0]}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200/50">
                  <div className="flex items-center gap-2 text-stone-700 font-serif font-semibold text-xs mb-1.5">
                    <Info className="w-4 h-4 text-stone-500" />
                    Interactive Sandbox Healing Principles
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    If Vata is slider-dominant (Air/Ether), the recipe switches to warm, oily, and heavy components like spiced kitchari. If Pitta dominates (Fire), the engine prioritizes cucumber, sweet melons, and cooling herbs. If Kapha dominates (Earth), dry barley broth and pungent heating spices like black pepper are automatically prioritized to stimulate metabolism.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED REPORTS HISTORY */}
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="tab_history">
            <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h3 className="font-serif text-xl sm:text-2xl text-stone-800">Saved Diagnostic Reports History</h3>
              <p className="text-xs text-stone-500 mt-1">
                Access your previously generated Ayurvedic plans stored securely inside this browser.
              </p>

              {savedReports.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif text-stone-700 font-bold">No saved plans found</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Take the mind-body assessment baseline quiz and symptom checklists to save custom reports directly on this device.
                  </p>
                  <button
                    id="history_goto_assess_btn"
                    onClick={() => { setActiveTab('assess'); setQuizStep(-1); }}
                    className="bg-[#427C55] hover:bg-[#346243] text-white text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Take Assessment Now
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-4" id="history_list">
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      id={`report_card_${report.id}`}
                      onClick={() => handleLoadSavedReport(report)}
                      className="group border border-stone-200/60 rounded-2xl p-5 hover:bg-[#FAF8F5] transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${getDoshaDetails(report.primaryDosha).bgColor}`}>
                            {report.primaryDosha} Dominant
                          </span>
                          <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {report.date}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-stone-800 text-base group-hover:text-[#427C55] transition-colors">
                          Ayurvedic Diet & Balancing Plan
                        </h4>
                        <p className="text-xs text-stone-500">
                          Baseline: V({report.prakritiDistribution.vata}%) P({report.prakritiDistribution.pitta}%) K({report.prakritiDistribution.kapha}%) | Active symptoms: {report.symptomsCount}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-xs text-[#427C55] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Load Report <ChevronRight className="w-4 h-4" />
                        </span>
                        <button
                          id={`delete_report_${report.id}`}
                          onClick={(e) => handleDeleteReport(report.id, e)}
                          className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Floating footer element */}
      <footer className="border-t border-stone-200/60 bg-white py-8 px-4 mt-16" id="app_footer">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span>Ayurvedic Diet Recommender System © 2026</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-stone-700">Prakriti Analysis</span>
            <span>•</span>
            <span className="hover:text-stone-700">Vikriti Symptom Mapping</span>
            <span>•</span>
            <span className="hover:text-stone-700 font-mono">v1.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
