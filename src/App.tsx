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
  Activity, 
  Heart,
  Save,
  Trash2,
  Calendar,
  Layers,
  Flame,
  Wind,
  Droplet,
  Info,
  Bell,
  BellRing,
  BellOff,
  User as UserIcon,
  LogIn,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { QUESTIONS, SYMPTOMS, FALLBACK_RECOMMENDATIONS } from './data/ayurvedaData';
import { Question, Symptom, DietRecommendation, DoshaScore, SavedReport } from './types';
import DoshaChart from './components/DoshaChart';
import { AuthModal } from './components/AuthModal';
import { auth, signOut, onAuthStateChanged, User, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'assess' | 'history'>('assess');
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

  // Active sub-tab inside recommendation view
  const [recSubTab, setRecSubTab] = useState<'meals' | 'weekly' | 'foods' | 'spices' | 'lifestyle'>('meals');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  // Deep personalization profile state
  const [personalization, setPersonalization] = useState({
    age: 30,
    sex: 'Female',
    season: 'Summer',
    climate: 'Moderate',
    occupation: 'Desk Job (Sedentary)',
    symptomSeverity: 'Moderate' as 'Mild' | 'Moderate' | 'Severe',
    eatingSchedule: 'Regular 3 Meals',
    allergies: [] as string[],
    constitutionHistory: 'Not sure / Calculate',
    notificationsEnabled: false
  });

  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [notificationStatusMsg, setNotificationStatusMsg] = useState<string | null>(null);

  // Auth & User State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Listen to Auth State Changes and sync Firestore data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.savedReports && Array.isArray(data.savedReports)) {
              setSavedReports(data.savedReports);
              localStorage.setItem('ayurveda_history', JSON.stringify(data.savedReports));
            }
          }
        } catch (err) {
          console.error('Error fetching Firestore user data:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync notification preference & permission status on startup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }

    const savedNotif = localStorage.getItem('ayurveda_notif_enabled');
    if (savedNotif === 'true') {
      setPersonalization(prev => ({ ...prev, notificationsEnabled: true }));
    }
  }, []);

  // Trigger browser push notification helper
  const sendRoutineNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          tag: 'ayurvedic-routine-reminder'
        });
      } catch (err) {
        console.error('Error triggering notification:', err);
      }
    }
  };

  // Toggle browser push notifications for daily Ayurvedic morning & evening routines
  const handleToggleNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationStatusMsg('Browser push notifications are not supported in this window.');
      return;
    }

    if (!personalization.notificationsEnabled) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === 'granted') {
          setPersonalization(prev => ({ ...prev, notificationsEnabled: true }));
          localStorage.setItem('ayurveda_notif_enabled', 'true');
          setNotificationStatusMsg('Daily routine notifications enabled! Scheduled for 6:30 AM (Morning Dinacharya) & 8:30 PM (Evening Sandhya).');
          
          sendRoutineNotification(
            '🌿 Ayurvedic Routine Reminders Enabled',
            'You are all set! You will receive daily reminders for your recommended morning and evening Dinacharya practices.'
          );
        } else if (permission === 'denied') {
          setPersonalization(prev => ({ ...prev, notificationsEnabled: false }));
          localStorage.setItem('ayurveda_notif_enabled', 'false');
          setNotificationStatusMsg('Notification permission was blocked in browser settings. Please allow notifications in your browser URL bar.');
        } else {
          setNotificationStatusMsg('Notification permission prompt was dismissed.');
        }
      } catch (err) {
        console.error('Notification error:', err);
        setNotificationStatusMsg('Unable to request browser notification permissions in this environment.');
      }
    } else {
      setPersonalization(prev => ({ ...prev, notificationsEnabled: false }));
      localStorage.setItem('ayurveda_notif_enabled', 'false');
      setNotificationStatusMsg('Daily routine notifications disabled.');
    }
  };

  // Background timer to trigger daily morning (6:30 AM) and evening (8:30 PM) routine notifications
  useEffect(() => {
    if (!personalization.notificationsEnabled) return;

    let lastNotifiedTime = '';

    const intervalId = setInterval(() => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeKey = `${now.toDateString()}-${hours}:${minutes}`;

      if (timeKey === lastNotifiedTime) return;

      // 6:30 AM Morning Dinacharya
      if (hours === 6 && minutes === 30) {
        lastNotifiedTime = timeKey;
        sendRoutineNotification(
          '☀️ Morning Dinacharya Reminder',
          'Rise early! Hydrate with warm lemon water, tongue scraping, and gentle prana breathing to ignite your morning Agni.'
        );
      }

      // 8:30 PM Evening Sandhya
      if (hours === 20 && minutes === 30) {
        lastNotifiedTime = timeKey;
        sendRoutineNotification(
          '🌙 Evening Sandhya Routine Reminder',
          'Time to wind down! Enjoy warm golden nutmeg milk, disconnect from digital screens, and prepare for restorative sleep.'
        );
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [personalization.notificationsEnabled]);

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
    symptomIds: string[]
  ) => {
    setIsLoading(true);

    const calculatedVikriti = calculateVikriti(symptomIds, scores);
    setVikritiScores(calculatedVikriti);

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
          selectedSymptomTexts: symptomTexts,
          personalization: personalization
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

        setRecommendation(enrichedFallback);
      } else {
        setRecommendation(data);
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
      setRecommendation(enrichedFallback);
    } finally {
      setIsLoading(false);
      setQuizStep(10); // Render recommendation panel
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

  // Save the generated recommendation to local storage history and Firestore
  const handleSaveReport = async () => {
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
      recommendation: recommendation,
      personalization: personalization
    };

    const updatedHistory = [newReport, ...savedReports];
    setSavedReports(updatedHistory);
    localStorage.setItem('ayurveda_history', JSON.stringify(updatedHistory));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          savedReports: updatedHistory,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Error saving to Firestore:', err);
      }
    }

    alert('Your custom Ayurvedic dietary report has been saved successfully!');
  };

  // Delete a report from history and Firestore
  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem('ayurveda_history', JSON.stringify(updated));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          savedReports: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Error updating Firestore:', err);
      }
    }
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
    setPersonalization({
      age: 30,
      sex: 'Female',
      season: 'Summer',
      climate: 'Moderate',
      occupation: 'Desk Job (Sedentary)',
      symptomSeverity: 'Moderate',
      eatingSchedule: 'Regular 3 Meals',
      allergies: [],
      constitutionHistory: 'Not sure / Calculate'
    });
    setQuizStep(0);
    setActiveTab('assess');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load a saved report
  const handleLoadSavedReport = (report: SavedReport) => {
    setPrakritiScores(report.prakritiDistribution);
    setVikritiScores(report.vikritiImbalance);
    setRecommendation(report.recommendation);
    setSelectedSymptoms(Array(report.symptomsCount).fill('loaded'));
    if (report.personalization) {
      setPersonalization(report.personalization);
    }
    setQuizStep(10);
    setActiveTab('assess');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

          {/* Right Header Controls: Nav & User Auth */}
          <div className="flex items-center gap-3">
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

            {/* Auth Button / Profile Menu */}
            {user ? (
              <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 p-1 pl-3 rounded-xl text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User avatar" className="w-6 h-6 rounded-full border border-emerald-300" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#427C55] text-white flex items-center justify-center font-bold text-[10px]">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                  </div>
                )}
                <span className="font-semibold text-emerald-900 max-w-[100px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  id="user_signout_btn"
                  onClick={() => signOut(auth)}
                  title="Sign Out"
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="open_auth_modal_btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-[#427C55] hover:bg-[#346243] text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
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
                    <div className="flex items-center gap-3">
                      <span>Question {quizStep + 1} of {QUESTIONS.length}</span>
                      <button
                        id="reset_quiz_during_questions_btn"
                        onClick={handleRestart}
                        className="text-stone-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reset Quiz"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </button>
                    </div>
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

                  {/* Back and Start Over buttons */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-100">
                    <button
                      id="quiz_back_btn"
                      onClick={() => {
                        if (quizStep > 0) {
                          setQuizStep(prev => prev - 1);
                        } else {
                          setQuizStep(-1);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      id="quiz_restart_bottom_btn"
                      onClick={handleRestart}
                      className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Start Over
                    </button>
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
                        Clear Symptoms
                      </button>
                      <button
                        id="reset_quiz_symptoms_btn"
                        onClick={handleRestart}
                        className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Quiz
                      </button>
                      <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1.5 rounded-full font-semibold border border-rose-100">
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
                      id="go_to_personalization_btn"
                      onClick={() => setQuizStep(QUESTIONS.length + 1)}
                      className="inline-flex items-center gap-2 bg-[#427C55] hover:bg-[#346243] text-white font-medium px-6 py-3 rounded-2xl shadow-xs transition-all duration-300 hover:translate-y-[-1px] cursor-pointer"
                    >
                      Personalize Diet Plan
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 9: Deep Personalization Profile */}
            {quizStep === QUESTIONS.length + 1 && (
              <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="personalization_panel">
                <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
                  
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-stone-100">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600">Deep Tuning</span>
                      <h3 className="font-serif text-2xl text-stone-800 mt-0.5">Ayurvedic Personalization Profile</h3>
                      <p className="text-xs text-stone-500 mt-1">Configure your physical metadata, environment, schedule, and lifestyle boundaries for custom recipe formulation.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id="reset_quiz_personalization_btn"
                        onClick={handleRestart}
                        className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Quiz
                      </button>
                      <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-semibold border border-emerald-100">
                        Step 3 of 3
                      </span>
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Age (with Ayurvedic life stages) */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-serif font-bold text-stone-700 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-600" /> Age & Life Stage
                        </label>
                        <span className="text-sm font-mono font-bold text-emerald-800">{personalization.age} years old</span>
                      </div>
                      <input 
                        type="range"
                        min="5"
                        max="100"
                        value={personalization.age}
                        onChange={(e) => setPersonalization({ ...personalization, age: parseInt(e.target.value) })}
                        className="w-full accent-emerald-600"
                      />
                      <div className="p-2.5 rounded-xl text-[11px] leading-relaxed bg-white border border-stone-200/60 text-stone-600">
                        {personalization.age < 16 ? (
                          <span>🌱 <strong>Kapha Kaala (Childhood)</strong>: Governed by water & earth elements. Key focus is on healthy growth, building robust immunity, and supporting physical tissue development.</span>
                        ) : personalization.age <= 50 ? (
                          <span>🔥 <strong>Pitta Kaala (Youth/Adulthood)</strong>: Governed by fire & water elements. Metabolism and digestive fire (Agni) are at their peak. Higher risk of inflammatory imbalances.</span>
                        ) : (
                          <span>💨 <strong>Vata Kaala (Elderhood)</strong>: Governed by air & space elements. System naturally tends toward dryness, light sleep, coldness, and joints stiffness. Demands warm, moist, grounding nutrition.</span>
                        )}
                      </div>
                    </div>

                    {/* Sex */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100 space-y-3">
                      <label className="text-xs font-serif font-bold text-stone-700 block">Biological Sex</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Female', 'Male', 'Other'].map((sexOpt) => (
                          <button
                            key={sexOpt}
                            type="button"
                            onClick={() => setPersonalization({ ...personalization, sex: sexOpt })}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              personalization.sex === sexOpt
                                ? 'bg-[#427C55] border-[#427C55] text-white shadow-sm'
                                : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                            }`}
                          >
                            {sexOpt}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-stone-400">Biological cycles and hormonal rhythms modulate individual dosha fluctuations.</p>
                    </div>

                    {/* Season & Climate */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100 space-y-4">
                      <h4 className="font-serif font-bold text-xs text-stone-700 border-b border-stone-200 pb-1">Geographic & Environment</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-600 block">Current Season</label>
                        <select
                          value={personalization.season}
                          onChange={(e) => setPersonalization({ ...personalization, season: e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="Summer">Summer (Grishma Ritu) - High heat, Pitta rises</option>
                          <option value="Monsoon">Monsoon (Varsha Ritu) - High humidity, Vata rises</option>
                          <option value="Autumn">Autumn (Sharad Ritu) - Transitional, Pitta flares</option>
                          <option value="Winter">Winter (Hemanta/Shishira Ritu) - High cold, Kapha rises</option>
                          <option value="Spring">Spring (Vasanta Ritu) - Melting cold, Kapha liquefies</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-600 block">Current Climate</label>
                        <select
                          value={personalization.climate}
                          onChange={(e) => setPersonalization({ ...personalization, climate: e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="Hot & Dry">Hot & Dry (aggravates Vata & Pitta)</option>
                          <option value="Hot & Humid">Hot & Humid (aggravates Pitta & Kapha)</option>
                          <option value="Cold & Dry">Cold & Dry (aggravates Vata)</option>
                          <option value="Cold & Damp">Cold & Damp (aggravates Kapha)</option>
                          <option value="Moderate">Moderate / Temperate (supports balance)</option>
                        </select>
                      </div>
                    </div>

                    {/* Occupation / Daily Routine */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100 space-y-4">
                      <h4 className="font-serif font-bold text-xs text-stone-700 border-b border-stone-200 pb-1">Activity & Occupation</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-600 block">Occupation / Daily Pace</label>
                        <select
                          value={personalization.occupation}
                          onChange={(e) => setPersonalization({ ...personalization, occupation: e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="Desk Job (Sedentary)">Desk Job / Sedentary (slows digestion/Kapha)</option>
                          <option value="High Stress / Corporate">High Stress / Corporate Desk (increases mental Vata/Pitta)</option>
                          <option value="Standing / Active">Standing / Active Pace (Retail, Teacher)</option>
                          <option value="Physical Labor">Physical Labor / Heavy Movement (demands Vata-grounding nutrition)</option>
                          <option value="Highly Active / Athlete">Athlete / Highly Active (rapid element turnover)</option>
                          <option value="Student">Student (high cognitive expenditure, Vata-sensitive)</option>
                          <option value="Retired">Retired / Peaceful (gentle, steady metabolic pace)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-600 block">Symptom Severity</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Mild', 'Moderate', 'Severe'] as const).map((sev) => (
                            <button
                              key={sev}
                              type="button"
                              onClick={() => setPersonalization({ ...personalization, symptomSeverity: sev })}
                              className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                personalization.symptomSeverity === sev
                                  ? sev === 'Mild'
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : sev === 'Moderate'
                                      ? 'bg-amber-600 border-amber-600 text-white'
                                      : 'bg-rose-600 border-rose-600 text-white'
                                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                              }`}
                            >
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Time of Day & Eating Schedule */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100 space-y-3">
                      <label className="text-xs font-serif font-bold text-stone-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-600" /> Eating Schedule & Time Preference
                      </label>
                      <select
                        value={personalization.eatingSchedule}
                        onChange={(e) => setPersonalization({ ...personalization, eatingSchedule: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="Regular 3 Meals">Regular 3 Meals (Breakfast, Lunch, Dinner at set hours)</option>
                        <option value="Intermittent Fasting (16:8)">Intermittent Fasting (e.g. 16:8 schedule, skipped breakfast)</option>
                        <option value="Early Dinner (Before 6 PM)">Early Dinner (Before 6 PM - matches Vedic guidelines)</option>
                        <option value="Grazing / Frequent Snacks">Grazing / Frequent Snacks (small, frequent meals)</option>
                        <option value="Irregular / Shift Worker">Irregular Hours / Night Shifts (requires heavy Agni-kindling)</option>
                      </select>
                      <p className="text-[10px] text-stone-400">Ayurveda strongly advises aligning meals with the solar cycle (highest fire at midday lunch).</p>
                    </div>

                    {/* Constitution History */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100 space-y-3">
                      <label className="text-xs font-serif font-bold text-stone-700 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" /> Known Constitution History
                      </label>
                      <select
                        value={personalization.constitutionHistory}
                        onChange={(e) => setPersonalization({ ...personalization, constitutionHistory: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="Not sure / Calculate">Not sure / Please calculate based on this assessment</option>
                        <option value="Single-dominant (Vata)">Vata-dominant history (predominantly airy/nervous)</option>
                        <option value="Single-dominant (Pitta)">Pitta-dominant history (predominantly warm/fiery)</option>
                        <option value="Single-dominant (Kapha)">Kapha-dominant history (predominantly solid/heavy)</option>
                        <option value="Dual-doshic (Vata-Pitta)">Dual-doshic: Vata-Pitta baseline</option>
                        <option value="Dual-doshic (Pitta-Kapha)">Dual-doshic: Pitta-Kapha baseline</option>
                        <option value="Dual-doshic (Vata-Kapha)">Dual-doshic: Vata-Kapha baseline</option>
                        <option value="Tridoshic (Vata-Pitta-Kapha)">Tridoshic (Fully balanced Vata-Pitta-Kapha baseline)</option>
                      </select>
                      <p className="text-[10px] text-stone-400">If you have been told your Prakriti by an Ayurvedic Vaidya, specify it here to fine-tune the recommendation.</p>
                    </div>

                    {/* Allergies & Diet Restrictions (Full Width Span) */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100 space-y-3 md:col-span-2">
                      <label className="text-xs font-serif font-bold text-stone-700 flex items-center gap-1.5">
                        <Ban className="w-4 h-4 text-rose-500" /> Food Allergies, Cuisine & Diet Preferences
                      </label>
                      
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Gluten-free',
                          'Lactose-free',
                          'Nut-free',
                          'Soy-free',
                          'Vegan',
                          'Vegetarian',
                          'Sattvik (No Onion & Garlic)',
                          'South Indian',
                          'North Indian',
                          'Western Cuisine'
                        ].map((pref) => {
                          const isChecked = personalization.allergies.includes(pref);
                          return (
                            <button
                              key={pref}
                              type="button"
                              onClick={() => {
                                const exists = personalization.allergies.includes(pref);
                                setPersonalization({
                                  ...personalization,
                                  allergies: exists 
                                    ? personalization.allergies.filter(x => x !== pref)
                                    : [...personalization.allergies, pref]
                                });
                              }}
                              className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-[#EBF5EE] border-[#427C55] text-emerald-800 font-semibold shadow-2xs'
                                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                              }`}
                            >
                              {pref}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-stone-400">Our recommendation engine will strictly filter out incompatible ingredients and tailor the recipe selection to your favorite food styles.</p>
                    </div>

                    {/* Daily Routine Reminders (Browser Notifications Toggle) */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-100 space-y-4 md:col-span-2" id="notification_settings_card">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-200/60">
                        <div>
                          <div className="flex items-center gap-2">
                            {personalization.notificationsEnabled ? (
                              <BellRing className="w-4 h-4 text-emerald-600 animate-bounce" />
                            ) : (
                              <BellOff className="w-4 h-4 text-stone-400" />
                            )}
                            <h4 className="font-serif font-bold text-xs text-stone-800 uppercase tracking-wider">
                              Daily Routine Reminders (Browser Notifications)
                            </h4>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Receive daily browser push notifications for recommended Ayurvedic morning (Dinacharya) & evening (Sandhya) practices.
                          </p>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-semibold text-stone-700">
                            {personalization.notificationsEnabled ? 'Reminders Active' : 'Reminders Off'}
                          </span>
                          <button
                            type="button"
                            id="toggle_notifications_switch"
                            role="switch"
                            aria-checked={personalization.notificationsEnabled}
                            onClick={handleToggleNotifications}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                              personalization.notificationsEnabled ? 'bg-[#427C55]' : 'bg-stone-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                personalization.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Routine Schedule Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 bg-white rounded-xl border border-stone-200/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-serif font-bold text-amber-800 flex items-center gap-1">
                              ☀️ Morning Dinacharya
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">
                              6:30 AM
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-snug">
                            Hydrate with warm lemon water, tongue scraping, oil pulling, and gentle prana breathing to ignite morning Agni.
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-stone-200/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-serif font-bold text-indigo-900 flex items-center gap-1">
                              🌙 Evening Sandhya
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                              8:30 PM
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-snug">
                            Spiced golden nutmeg milk, digital detox, self-massage (Abhyanga), and restful bedtime rituals.
                          </p>
                        </div>
                      </div>

                      {/* Status & Test Trigger */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                        <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>
                            Browser permission: <strong className={notificationPermission === 'granted' ? 'text-emerald-700' : notificationPermission === 'denied' ? 'text-rose-600' : 'text-stone-600'}>
                              {notificationPermission === 'granted' ? 'Granted ✓' : notificationPermission === 'denied' ? 'Blocked ✗' : 'Not Requested'}
                            </strong>
                          </span>
                        </div>

                        <button
                          type="button"
                          id="test_notification_btn"
                          onClick={() => {
                            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                              sendRoutineNotification(
                                '🌿 Test Ayurvedic Routine Reminder',
                                'This is a sample reminder! Your morning (6:30 AM) and evening (8:30 PM) routine notifications will appear like this.'
                              );
                              setNotificationStatusMsg('Test notification triggered! Check your browser or system notification panel.');
                            } else {
                              handleToggleNotifications();
                            }
                          }}
                          className="text-xs bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-3.5 py-1.5 rounded-xl font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <Bell className="w-3.5 h-3.5 text-emerald-600" /> Test Reminder Now
                        </button>
                      </div>

                      {notificationStatusMsg && (
                        <div className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 animate-fade-in ${
                          notificationPermission === 'denied' 
                            ? 'bg-rose-50 border-rose-200 text-rose-800' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>{notificationStatusMsg}</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Navigation controls */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-100">
                    <button
                      id="personalization_back_btn"
                      onClick={() => setQuizStep(QUESTIONS.length)}
                      className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Symptoms
                    </button>

                    <button
                      id="get_diet_recommendation_btn"
                      disabled={isLoading}
                      onClick={() => handleGenerateRecommendation(prakritiScores, selectedSymptoms)}
                      className="inline-flex items-center gap-2 bg-[#427C55] hover:bg-[#346243] disabled:bg-stone-400 text-white font-medium px-8 py-3.5 rounded-2xl shadow-sm transition-all duration-300 hover:translate-y-[-1px] cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Formulating Deep Plan...
                        </>
                      ) : (
                        <>
                          Formulate Diet Prescription
                          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Step 10: Recommendation Display Panel */}
            {quizStep === 10 && recommendation && (
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

                  {/* Personalized Parameters badges */}
                  <div className="mt-6 border-t border-stone-100 pt-5" id="personalization_summary_badges">
                    <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#427C55]" /> Fully Personalized Settings Applied:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200/50">
                        Age: <strong>{personalization.age}</strong> ({personalization.age < 16 ? 'Kapha Phase' : personalization.age <= 50 ? 'Pitta Phase' : 'Vata Phase'})
                      </span>
                      <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200/50">
                        Sex: <strong>{personalization.sex}</strong>
                      </span>
                      <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200/50">
                        Season: <strong>{personalization.season}</strong>
                      </span>
                      <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200/50">
                        Climate: <strong>{personalization.climate}</strong>
                      </span>
                      <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200/50">
                        Activity: <strong>{personalization.occupation}</strong>
                      </span>
                      <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200/50">
                        Schedule: <strong>{personalization.eatingSchedule}</strong>
                      </span>
                      <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200/50">
                        Imbalance Severity: <strong className={personalization.symptomSeverity === 'Severe' ? 'text-rose-600' : personalization.symptomSeverity === 'Moderate' ? 'text-amber-600' : 'text-green-600'}>{personalization.symptomSeverity}</strong>
                      </span>
                      {personalization.allergies.length > 0 && (
                        <span className="text-xs bg-rose-50 text-rose-800 px-3 py-1.5 rounded-xl border border-rose-100">
                          Diet limits: <strong>{personalization.allergies.join(', ')}</strong>
                        </span>
                      )}
                      {personalization.constitutionHistory !== 'Not sure / Calculate' && (
                        <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-100">
                          Baseline Record: <strong>{personalization.constitutionHistory}</strong>
                        </span>
                      )}
                      {personalization.notificationsEnabled && (
                        <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 font-medium">
                          <BellRing className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Reminders: <strong>Active (6:30 AM & 8:30 PM)</strong>
                        </span>
                      )}
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
                      id="subtab_weekly_btn"
                      onClick={() => setRecSubTab('weekly')}
                      className={`flex-1 min-w-[120px] px-6 py-4 text-center font-serif text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        recSubTab === 'weekly'
                          ? 'border-emerald-600 text-emerald-800 bg-white'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Weekly Plan (7-Day)
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

                    {/* SUB-TAB: WEEKLY MEAL PLAN */}
                    {recSubTab === 'weekly' && (() => {
                      const activeWeeklyPlan = recommendation.weeklyPlan || FALLBACK_RECOMMENDATIONS[recommendation.primaryDosha]?.weeklyPlan || [];
                      const currentDayData = activeWeeklyPlan.find(d => d.day === selectedDay) || activeWeeklyPlan[0];
                      return (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-emerald-600 font-bold" />
                              <div>
                                <h4 className="font-serif text-lg font-bold text-stone-800">Weekly Dosha Balancing Diet</h4>
                                <p className="text-xs text-stone-500 mt-0.5">Fully customized 7-day Ayurvedic routine featuring traditional Indian foods</p>
                              </div>
                            </div>
                          </div>

                          {/* Day Row Buttons */}
                          <div className="flex flex-wrap gap-2 pb-2">
                            {activeWeeklyPlan.map((d) => (
                              <button
                                key={d.day}
                                id={`day_tab_${d.day}`}
                                onClick={() => setSelectedDay(d.day)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
                                  selectedDay === d.day
                                    ? 'bg-[#427C55] text-white border-[#427C55] shadow-sm shadow-[#427C55]/10'
                                    : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                                }`}
                              >
                                {d.day}
                              </button>
                            ))}
                          </div>

                          {currentDayData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                              {/* Breakfast */}
                              <div className="border border-stone-200/60 p-5 rounded-2xl hover:bg-[#FAF8F5] transition-all">
                                <span className="text-[10px] bg-sky-50 text-[#3E7CA6] font-bold px-2 py-0.5 rounded font-mono uppercase">Breakfast</span>
                                <h5 className="font-serif font-bold text-stone-800 text-base mt-2">{currentDayData.meals.breakfast.name}</h5>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {currentDayData.meals.breakfast.beneficialFoods.map((f, i) => (
                                    <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-sans">{f}</span>
                                  ))}
                                </div>
                                <p className="text-xs text-stone-600 mt-3 font-sans leading-relaxed border-t border-stone-100 pt-2.5">
                                  {currentDayData.meals.breakfast.instructions}
                                </p>
                              </div>

                              {/* Lunch */}
                              <div className="border border-stone-200/60 p-5 rounded-2xl hover:bg-[#FAF8F5] transition-all">
                                <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded font-mono uppercase">Lunch</span>
                                <h5 className="font-serif font-bold text-stone-800 text-base mt-2">{currentDayData.meals.lunch.name}</h5>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {currentDayData.meals.lunch.beneficialFoods.map((f, i) => (
                                    <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-sans">{f}</span>
                                  ))}
                                </div>
                                <p className="text-xs text-stone-600 mt-3 font-sans leading-relaxed border-t border-stone-100 pt-2.5">
                                  {currentDayData.meals.lunch.instructions}
                                </p>
                              </div>

                              {/* Dinner */}
                              <div className="border border-stone-200/60 p-5 rounded-2xl hover:bg-[#FAF8F5] transition-all">
                                <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded font-mono uppercase">Dinner</span>
                                <h5 className="font-serif font-bold text-stone-800 text-base mt-2">{currentDayData.meals.dinner.name}</h5>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {currentDayData.meals.dinner.beneficialFoods.map((f, i) => (
                                    <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-sans">{f}</span>
                                  ))}
                                </div>
                                <p className="text-xs text-stone-600 mt-3 font-sans leading-relaxed border-t border-stone-100 pt-2.5">
                                  {currentDayData.meals.dinner.instructions}
                                </p>
                              </div>

                              {/* Snacks */}
                              <div className="border border-stone-200/60 p-5 rounded-2xl hover:bg-[#FAF8F5] transition-all">
                                <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded font-mono uppercase">Snack</span>
                                <h5 className="font-serif font-bold text-stone-800 text-base mt-2">{currentDayData.meals.snacks.name}</h5>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {currentDayData.meals.snacks.beneficialFoods.map((f, i) => (
                                    <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-sans">{f}</span>
                                  ))}
                                </div>
                                <p className="text-xs text-stone-600 mt-3 font-sans leading-relaxed border-t border-stone-100 pt-2.5">
                                  {currentDayData.meals.snacks.instructions}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-stone-500 text-xs">No weekly plan segments found.</div>
                          )}
                        </div>
                      );
                    })()}

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

                {/* Bottom Retake / Reset Assessment Card */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white border border-stone-200/80 rounded-3xl shadow-xs" id="bottom_retake_bar">
                  <div>
                    <h4 className="font-serif font-bold text-stone-800 text-base">Want to restart or test another profile?</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Resetting clears your current answers and brings you back to Question 1 of the Prakriti Assessment.</p>
                  </div>
                  <button
                    id="bottom_reset_quiz_btn"
                    onClick={handleRestart}
                    className="inline-flex items-center gap-2 bg-[#427C55] hover:bg-[#346243] text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset & Retake Assessment
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 2: SAVED REPORTS HISTORY */}
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

      {/* Login & Registration Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
