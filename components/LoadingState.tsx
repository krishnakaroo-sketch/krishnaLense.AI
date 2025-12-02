
import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, ScanFace, Palette, Aperture, Image as ImageIcon, Wand2, Zap, BrainCircuit, CheckCircle2 } from 'lucide-react';

interface LoadingStep {
  threshold: number;
  text: string;
  subtext: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
}

const STEPS: LoadingStep[] = [
  { threshold: 0, text: "Initializing Core", subtext: "Warming up neural engines...", icon: Zap, color: "text-blue-400", glowColor: "shadow-blue-500/50" },
  { threshold: 20, text: "Analyzing Structure", subtext: "Mapping 150+ facial landmarks...", icon: ScanFace, color: "text-purple-400", glowColor: "shadow-purple-500/50" },
  { threshold: 40, text: "Composing Scene", subtext: "Applying style parameters & depth...", icon: Palette, color: "text-pink-400", glowColor: "shadow-pink-500/50" },
  { threshold: 60, text: "Simulating Light", subtext: "Calculating ray-traced shadows...", icon: Aperture, color: "text-yellow-400", glowColor: "shadow-yellow-500/50" },
  { threshold: 80, text: "Refining Details", subtext: "Enhancing skin texture & realism...", icon: Wand2, color: "text-emerald-400", glowColor: "shadow-emerald-500/50" },
  { threshold: 95, text: "Final Polish", subtext: "Upscaling and color grading...", icon: ImageIcon, color: "text-white", glowColor: "shadow-white/50" },
];

export const LoadingState: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Slower, linear progression to allow users to read percentage
    const targetTime = 15000; // 15 seconds total
    const intervalTime = 120; // Update every 120ms
    const totalSteps = targetTime / intervalTime;
    let stepCount = 0;

    const interval = setInterval(() => {
      stepCount++;
      
      // Linear progression: t goes from 0 to 1
      const t = stepCount / totalSteps;
      
      // Linear curve (y = x) for steady counting
      let curve = t;
      
      // Add minor organic jitter (+/- 0.5%) to feel like processing
      const jitter = (Math.random() * 0.01 - 0.005);
      
      let newProgress = Math.min(99, Math.max(0, (curve + jitter) * 100));
      
      // Ensure it doesn't go backwards significantly
      setProgress(prev => Math.max(prev, newProgress));
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  const activeStepIndex = STEPS.findIndex((step, idx) => {
    const nextStep = STEPS[idx + 1];
    return progress >= step.threshold && (!nextStep || progress < nextStep.threshold);
  });
  
  const activeStep = STEPS[activeStepIndex !== -1 ? activeStepIndex : STEPS.length - 1];

  // Dynamic background gradient based on active step color theme
  const getGradientStyle = () => {
    switch (activeStepIndex) {
      case 0: return 'from-blue-900/40 via-slate-900 to-slate-900';
      case 1: return 'from-purple-900/40 via-slate-900 to-slate-900';
      case 2: return 'from-pink-900/40 via-slate-900 to-slate-900';
      case 3: return 'from-yellow-900/40 via-slate-900 to-slate-900';
      case 4: return 'from-emerald-900/40 via-slate-900 to-slate-900';
      case 5: return 'from-slate-700/40 via-slate-900 to-slate-900';
      default: return 'from-blue-900/40 via-slate-900 to-slate-900';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-12 px-4 relative z-10 min-h-[500px]">
      
      {/* Reactive Ambient Background */}
      <div className={`absolute inset-0 bg-gradient-radial ${getGradientStyle()} transition-colors duration-1000 opacity-60 pointer-events-none rounded-full blur-3xl -z-10 transform scale-150`}></div>
      
      {/* Central Visual HUD */}
      <div className="relative mb-20 group">
        
        {/* Outer Rotating Data Rings */}
        <div className="absolute inset-[-40px] rounded-full border border-slate-700/20 border-dashed animate-spin-slower opacity-40"></div>
        <div className="absolute inset-[-20px] rounded-full border border-slate-600/30 border-dashed animate-spin-reverse-slow opacity-60"></div>
        
        {/* Pulsing Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-current opacity-10 animate-ping-slow text-white"></div>
        
        {/* Main Lens Container */}
        <div className={`relative w-48 h-48 animate-float transition-all duration-700`}>
          
          {/* Glass Circle */}
          <div className="w-full h-full bg-slate-900/60 backdrop-blur-2xl rounded-full border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden ring-1 ring-white/5">
             
             {/* Inner Scanning Beam */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent w-full h-1/2 animate-scan pointer-events-none"></div>
             
             {/* Icon Transition Container */}
             <div className="relative z-10 w-full h-full flex items-center justify-center">
                {STEPS.map((step, idx) => {
                    const isActive = activeStepIndex === idx;
                    const StepIcon = step.icon;
                    // Only render active or adjacent steps for smoother cross-fade potential if needed
                    // For now, strict active rendering with scale animation
                    if (!isActive) return null;
                    
                    return (
                        <div key={idx} className="animate-pop-in flex flex-col items-center justify-center">
                            <div className={`p-4 rounded-2xl bg-slate-800/50 backdrop-blur-md border border-white/5 ${step.glowColor} shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-2`}>
                                <StepIcon className={`w-12 h-12 ${step.color}`} />
                            </div>
                            <div className="absolute -bottom-8 px-3 py-1 bg-black/40 rounded-full text-[10px] font-mono text-slate-400 border border-white/5 backdrop-blur-sm">
                                PROCESSING
                            </div>
                        </div>
                    );
                })}
             </div>
             
             {/* SVG Progress Arc */}
             <svg className="absolute inset-0 w-full h-full -rotate-90 p-2" viewBox="0 0 100 100">
               {/* Background Track */}
               <circle
                 cx="50"
                 cy="50"
                 r="44"
                 fill="none"
                 stroke="#1e293b"
                 strokeWidth="2"
                 strokeDasharray="4 4"
               />
               
               {/* Active Progress */}
               <circle
                 cx="50"
                 cy="50"
                 r="44"
                 fill="none"
                 stroke="url(#gradient-arc)"
                 strokeWidth="3"
                 strokeLinecap="round"
                 strokeDasharray="276"
                 strokeDashoffset={276 - (276 * progress) / 100}
                 className="transition-all duration-300 ease-linear"
                 style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.5))' }}
               />
               
               <defs>
                 <linearGradient id="gradient-arc" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" stopColor="#3b82f6" />
                   <stop offset="100%" stopColor="#c084fc" />
                 </linearGradient>
               </defs>
             </svg>
          </div>
          
          {/* Orbiting Particles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] animate-spin-slow pointer-events-none">
             <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400/80 rounded-full blur-[2px] shadow-[0_0_10px_#3b82f6]"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] animate-spin-reverse-slow pointer-events-none opacity-70">
             <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-400/80 rounded-full blur-[1px]"></div>
          </div>

        </div>
      </div>

      {/* Dynamic Text Section */}
      <div className="w-full text-center space-y-4 relative z-10 h-32">
        <div className="flex flex-col items-center justify-center">
            {STEPS.map((step, idx) => (
               <div 
                 key={idx}
                 className={`absolute transition-all duration-700 ease-in-out transform flex flex-col items-center w-full ${
                    activeStepIndex === idx 
                        ? 'opacity-100 translate-y-0 scale-100 blur-0' 
                        : activeStepIndex > idx 
                            ? 'opacity-0 -translate-y-8 scale-95 blur-sm' 
                            : 'opacity-0 translate-y-8 scale-95 blur-sm'
                 }`}
               >
                   <h2 className={`text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2`}>
                      {step.text}
                   </h2>
                   <p className={`text-sm md:text-base font-medium ${step.color} bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-700/50 backdrop-blur`}>
                      {step.subtext}
                   </p>
               </div>
            ))}
        </div>
      </div>

      {/* Stats / Percentage */}
      <div className="absolute bottom-8 right-8 font-mono text-xs text-slate-500 flex flex-col items-end gap-1">
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>SYSTEM ACTIVE</span>
         </div>
         <span className="text-xl font-bold text-white transition-all duration-200">{Math.floor(progress)}%</span>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes spin-slower {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes ping-slow {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes pop-in {
           0% { transform: scale(0.5); opacity: 0; }
           60% { transform: scale(1.1); opacity: 1; }
           100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .animate-spin-slower {
          animation: spin-slower 20s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 15s linear infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-pop-in {
          animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .bg-gradient-radial {
          background-image: radial-gradient(var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};
    