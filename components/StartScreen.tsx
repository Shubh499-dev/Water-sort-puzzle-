import React from 'react';
import { Play, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { Theme } from '../types';

interface StartScreenProps {
  onStart: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ 
  onStart, 
  isMuted, 
  toggleMute, 
  theme, 
  toggleTheme 
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 overflow-hidden relative
      ${isDark 
        ? 'bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white' 
        : 'bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-white text-slate-800'
      }
    `}>
      
      {/* --- HERO LOGO SECTION --- */}
      <div className="mb-12 relative flex flex-col items-center z-10">
        
        {/* Realistic CSS Bottle Icon */}
        <div className="relative w-24 h-64 md:w-28 md:h-72 mx-auto mb-8 transform hover:scale-105 transition-transform duration-500 ease-in-out cursor-pointer" onClick={onStart}>
            {/* Bottle Container */}
            <div className={`
              w-full h-full rounded-b-[3rem] rounded-t-2xl
              border-[6px]
              backdrop-blur-md overflow-hidden relative z-10
              ${isDark ? 'border-white/20 bg-white/5 shadow-[0_0_50px_rgba(0,243,255,0.2)]' : 'border-white/60 bg-white/30 shadow-[0_20px_50px_rgba(0,100,255,0.25)]'}
            `}>
              {/* Liquid Layer 1 (Bottom - Purple) */}
              <div className="absolute bottom-0 w-full h-[35%] bg-[#bc13fe]">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[length:12px_12px]" />
                  <div className="absolute top-0 w-full h-1 bg-white/20 blur-[1px]" />
              </div>
              
              {/* Liquid Layer 2 (Middle - Orange) */}
              <div className="absolute bottom-[35%] w-full h-[30%] bg-[#ff9900]">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[length:10px_10px]" />
                  <div className="absolute top-0 w-full h-1 bg-white/20 blur-[1px]" />
              </div>
              
              {/* Liquid Layer 3 (Top - Cyan) */}
              <div className="absolute bottom-[65%] w-full h-[25%] bg-[#00f3ff]">
                  <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[length:8px_8px]" />
                  {/* Meniscus */}
                  <div className="absolute top-0 w-full h-3 bg-white/50 rounded-[100%] scale-x-125 blur-[1px]" />
              </div>

              {/* Glass Reflections */}
              <div className="absolute top-4 left-3 w-3 h-[90%] bg-gradient-to-b from-white/50 to-transparent blur-[3px] rounded-full opacity-70" />
              <div className="absolute top-4 right-2 w-1.5 h-[90%] bg-gradient-to-b from-white/30 to-transparent blur-[2px] rounded-full opacity-50" />
            </div>

            {/* Bottle Rim */}
            <div className={`absolute -top-4 left-[-10%] w-[120%] h-7 rounded-full border-[4px] z-20 shadow-md 
              ${isDark ? 'bg-slate-700/80 border-slate-400/50' : 'bg-slate-100/90 border-white/80'}`} 
            />
            
            {/* Background Glow behind bottle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[80%] bg-cyan-500/20 blur-[60px] -z-10 animate-pulse" />
        </div>
        
        {/* Title Text */}
        <h1 className="text-center mb-2 drop-shadow-2xl">
          <span className="block text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 animate-glow pb-2">
            WATER
          </span>
          <span className={`block text-3xl md:text-4xl font-bold tracking-[0.5em] mt-[-5px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            SORT
          </span>
        </h1>
        
        <p className={`text-center tracking-[0.2em] font-medium text-xs mt-4 uppercase opacity-60 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Premium Liquid Puzzle
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-xs z-20">
        <button
          onClick={onStart}
          className="group relative w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-white/10"
        >
          <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Play fill="currentColor" size={28} className="drop-shadow-md" />
          <span className="drop-shadow-md">PLAY NOW</span>
        </button>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={toggleTheme}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 backdrop-blur-sm
              ${isDark 
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200 shadow-lg' 
                : 'bg-white/60 border-slate-200 hover:bg-white text-slate-700 shadow-sm'
              }`}
          >
            {isDark ? <Moon size={24} className="mb-2 text-purple-400" /> : <Sun size={24} className="mb-2 text-amber-500" />}
            <span className="text-[10px] font-bold tracking-wider">THEME</span>
          </button>

          <button
            onClick={toggleMute}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 backdrop-blur-sm
              ${isDark 
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200 shadow-lg' 
                : 'bg-white/60 border-slate-200 hover:bg-white text-slate-700 shadow-sm'
              }`}
          >
            {isMuted ? <VolumeX size={24} className="mb-2 text-red-400" /> : <Volume2 size={24} className="mb-2 text-green-400" />}
            <span className="text-[10px] font-bold tracking-wider">{isMuted ? 'MUTED' : 'SOUND'}</span>
          </button>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 animate-pulse ${isDark ? 'bg-cyan-600' : 'bg-blue-400'}`} style={{animationDuration: '8s'}} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 animate-pulse ${isDark ? 'bg-purple-600' : 'bg-indigo-400'}`} style={{animationDuration: '10s'}} />
        
        {/* Floating Particles */}
        <div className="absolute top-[20%] right-[20%] w-2 h-2 rounded-full bg-white/20 animate-ping" />
        <div className="absolute bottom-[30%] left-[10%] w-3 h-3 rounded-full bg-cyan-400/20 animate-pulse" />
      </div>

      <footer className={`absolute bottom-6 text-[10px] font-medium tracking-widest opacity-50 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        WATER SORT PREMIUM
      </footer>
    </div>
  );
};