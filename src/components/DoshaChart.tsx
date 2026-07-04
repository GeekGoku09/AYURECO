import React from 'react';
import { DoshaScore } from '../types';

interface DoshaChartProps {
  prakriti: DoshaScore;
  vikriti?: DoshaScore;
  title?: string;
  subtitle?: string;
}

export default function DoshaChart({ prakriti, vikriti, title, subtitle }: DoshaChartProps) {
  const totalPrakriti = prakriti.vata + prakriti.pitta + prakriti.kapha || 1;
  const pVata = Math.round((prakriti.vata / totalPrakriti) * 100);
  const pPitta = Math.round((prakriti.pitta / totalPrakriti) * 100);
  const pKapha = Math.round((prakriti.kapha / totalPrakriti) * 100);

  let vVata = 0, vPitta = 0, vKapha = 0;
  if (vikriti) {
    const totalVikriti = vikriti.vata + vikriti.pitta + vikriti.kapha || 1;
    vVata = Math.round((vikriti.vata / totalVikriti) * 100);
    vPitta = Math.round((vikriti.pitta / totalVikriti) * 100);
    vKapha = Math.round((vikriti.kapha / totalVikriti) * 100);
  }

  // Colors mapping
  // Vata: Air/Ether -> Soft sky blue/indigo (#5A9EC9, #4F46E5)
  // Pitta: Fire/Water -> Amber/Crimson (#E07A5F, #DC2626)
  // Kapha: Water/Earth -> Forest/Teal (#4C9A6A, #0D9488)

  return (
    <div className="bg-[#FAF8F5] border border-stone-200/60 rounded-2xl p-6 shadow-sm" id="dosha_chart_container">
      {title && (
        <div className="mb-6">
          <h3 className="font-serif text-lg text-stone-800 leading-snug">{title}</h3>
          {subtitle && <p className="text-xs text-stone-500 font-sans mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Main Grid: Visuals and Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* SVG Ring Visualizer */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Vata Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#5A9EC9"
                strokeWidth="10"
                strokeDasharray={`${pVata * 2.51} 251`}
                strokeDashoffset="0"
                className="transition-all duration-1000 ease-out"
              />
              {/* Pitta Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#E07A5F"
                strokeWidth="10"
                strokeDasharray={`${pPitta * 2.51} 251`}
                strokeDashoffset={`-${pVata * 2.51}`}
                className="transition-all duration-1000 ease-out"
              />
              {/* Kapha Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#4C9A6A"
                strokeWidth="10"
                strokeDasharray={`${pKapha * 2.51} 251`}
                strokeDashoffset={`-${(pVata + pPitta) * 2.51}`}
                className="transition-all duration-1000 ease-out"
              />
              {/* Innermost circle for elegant typography hole */}
              <circle cx="50" cy="50" r="32" fill="#FAF8F5" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-serif text-stone-800">Prakriti</span>
              <span className="text-[10px] tracking-wider text-stone-500 uppercase font-mono font-medium">Your Baseline</span>
            </div>
          </div>

          <div className="flex gap-4 mt-4 flex-wrap justify-center text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#5A9EC9]"></span>
              <span className="text-stone-700">Vata ({pVata}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#E07A5F]"></span>
              <span className="text-stone-700">Pitta ({pPitta}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#4C9A6A]"></span>
              <span className="text-stone-700">Kapha ({pKapha}%)</span>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Bars (Prakriti Baseline vs Vikriti Imbalance) */}
        <div className="space-y-6">
          {/* Vata Bar */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <span className="font-serif font-medium text-stone-800 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5A9EC9]"></span> Vata (Air & Ether)
              </span>
              <span className="text-xs text-stone-500 font-mono">
                Baseline: {pVata}% {vikriti && `| Imbalance: ${vVata}%`}
              </span>
            </div>
            <div className="space-y-1.5">
              {/* Prakriti Bar */}
              <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#5A9EC9] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${pVata}%` }}
                />
              </div>
              {/* Vikriti Bar if present */}
              {vikriti && (
                <div className="h-1.5 w-full bg-stone-200/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${vVata}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mt-1 font-sans leading-relaxed">
              Governs: Movement, nervous system, breath, circulation. Prone to dry skin, anxiety, cold.
            </p>
          </div>

          {/* Pitta Bar */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <span className="font-serif font-medium text-stone-800 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E07A5F]"></span> Pitta (Fire & Water)
              </span>
              <span className="text-xs text-stone-500 font-mono">
                Baseline: {pPitta}% {vikriti && `| Imbalance: ${vPitta}%`}
              </span>
            </div>
            <div className="space-y-1.5">
              {/* Prakriti Bar */}
              <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#E07A5F] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${pPitta}%` }}
                />
              </div>
              {/* Vikriti Bar if present */}
              {vikriti && (
                <div className="h-1.5 w-full bg-stone-200/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${vPitta}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mt-1 font-sans leading-relaxed">
              Governs: Digestion, metabolism, body temperature, intellect. Prone to acidity, rashes, anger.
            </p>
          </div>

          {/* Kapha Bar */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <span className="font-serif font-medium text-stone-800 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4C9A6A]"></span> Kapha (Water & Earth)
              </span>
              <span className="text-xs text-stone-500 font-mono">
                Baseline: {pKapha}% {vikriti && `| Imbalance: ${vKapha}%`}
              </span>
            </div>
            <div className="space-y-1.5">
              {/* Prakriti Bar */}
              <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#4C9A6A] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${pKapha}%` }}
                />
              </div>
              {/* Vikriti Bar if present */}
              {vikriti && (
                <div className="h-1.5 w-full bg-stone-200/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-700 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${vKapha}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mt-1 font-sans leading-relaxed">
              Governs: Structure, lubrication, immune strength, stamina. Prone to sluggishness, weight gain, congestion.
            </p>
          </div>
        </div>
      </div>

      {vikriti && (
        <div className="mt-5 pt-4 border-t border-stone-200/60 flex items-center gap-3 text-xs text-stone-600 font-sans leading-relaxed bg-white p-3 rounded-lg border border-stone-100">
          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
          <span>
            The <strong>secondary darker bar</strong> indicates your current imbalance level (Vikriti) calculated based on your reported symptoms. Ayurvedic healing works by eating foods that calm your elevated (highest Vikriti) doshas.
          </span>
        </div>
      )}
    </div>
  );
}
