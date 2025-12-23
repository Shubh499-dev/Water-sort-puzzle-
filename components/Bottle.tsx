import React, { forwardRef } from 'react';
import { BottleData, Theme } from '../types';
import { 
  GLASS_STYLE_DARK, 
  SELECTED_GLASS_STYLE_DARK,
  GLASS_STYLE_LIGHT, 
  SELECTED_GLASS_STYLE_LIGHT,
  BOTTLE_CAPACITY 
} from '../constants';

interface BottleProps {
  data: BottleData;
  isSelected: boolean;
  isValidTarget: boolean;
  theme: Theme;
  animationStyle?: React.CSSProperties; 
  onClick: () => void;
}

export const Bottle = forwardRef<HTMLDivElement, BottleProps>(({ 
  data, 
  isSelected, 
  isValidTarget, 
  theme, 
  animationStyle, 
  onClick 
}, ref) => {
  const { colors } = data;
  const isDark = theme === 'dark';

  const segmentHeight = 100 / BOTTLE_CAPACITY;
  
  // Custom styles for the "Real Glass" look
  const glassBorderColor = isDark ? 'border-slate-400/30' : 'border-slate-300/80';
  const glassBg = isDark ? 'bg-slate-800/20' : 'bg-blue-50/30';
  const shadowStyle = isSelected 
    ? (isDark ? '0 0 30px rgba(0,243,255,0.3), inset 0 0 20px rgba(255,255,255,0.2)' : '0 20px 40px rgba(0,100,255,0.25), inset 0 0 20px rgba(255,255,255,0.6)')
    : (isDark ? '0 10px 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.05)' : '0 10px 20px rgba(0,0,0,0.1), inset 0 0 15px rgba(255,255,255,0.4)');

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        relative flex flex-col justify-end items-center 
        w-16 h-52 md:w-20 md:h-64 
        transition-all duration-300 ease-out cursor-pointer
        backdrop-blur-sm
        border-[4px] ${glassBorderColor} ${glassBg}
        ${isValidTarget && !isSelected && !animationStyle ? 'scale-105 ring-4 ring-green-400/30' : ''}
        rounded-b-[2rem] rounded-t-lg
        mx-auto
        z-10
      `}
      style={{
        boxShadow: shadowStyle,
        transform: isSelected && !animationStyle ? 'translateY(-16px)' : 'none',
        ...animationStyle 
      }}
    >
      {/* --- BOTTLE NECK / RIM --- */}
      {/* Thick outer rim */}
      <div className={`absolute -top-3 w-[110%] h-5 rounded-full z-30 border-[3px] shadow-sm
        ${isDark ? 'bg-slate-700/50 border-slate-400/40' : 'bg-white/80 border-slate-300'}`} 
      />
      {/* Inner hole depth */}
      <div className={`absolute -top-3 w-[110%] h-5 rounded-full z-30 opacity-50 scale-90
         ${isDark ? 'bg-black/20' : 'bg-slate-200/50'}`}
      />

      {/* --- LIQUID CONTAINER --- */}
      <div className="w-full h-full relative overflow-hidden rounded-b-[1.7rem] rounded-t-md px-[1px] pb-[1px]">
        <div className="flex flex-col-reverse w-full h-full">
          {colors.map((color, idx) => (
            <div
              key={`${data.id}-${idx}`}
              className="w-full transition-all duration-500 ease-in-out relative"
              style={{
                height: `${segmentHeight}%`,
                backgroundColor: color,
                // Gradient for 3D Cylinder Effect
                backgroundImage: `
                  linear-gradient(90deg, 
                    rgba(0,0,0,0.2) 0%, 
                    rgba(255,255,255,0.1) 20%, 
                    rgba(255,255,255,0.0) 50%, 
                    rgba(0,0,0,0.2) 85%, 
                    rgba(0,0,0,0.4) 100%)
                `,
                boxShadow: `inset 0 0 20px rgba(0,0,0,0.2)`
              }}
            >
              {/* --- SPARKLES / BUBBLES TEXTURE --- */}
              <div 
                className="absolute inset-0 w-full h-full opacity-40 mix-blend-overlay"
                style={{
                   backgroundImage: `
                     radial-gradient(white 1px, transparent 1px),
                     radial-gradient(white 0.5px, transparent 0.5px)
                   `,
                   backgroundSize: '12px 12px, 8px 8px',
                   backgroundPosition: '0 0, 4px 4px'
                }}
              />

              {/* --- LIQUID SURFACE (Meniscus) --- */}
              <div className="absolute top-0 w-full h-[6px] bg-white/40 rounded-[100%] scale-x-110 blur-[0.5px]" />
              
              {/* --- INTERNAL HIGHLIGHT --- */}
              <div className="absolute top-2 left-2 w-1.5 h-[90%] bg-white/40 rounded-full blur-[1px]" />
            </div>
          ))}
        </div>
      </div>
      
      {/* --- GLASS REFLECTIONS (OVERLAY) --- */}
      {/* Left Gloss */}
      <div className="absolute top-4 left-1.5 w-2 h-[90%] bg-gradient-to-b from-white/30 to-transparent rounded-full pointer-events-none z-20 blur-[1px]" />
      
      {/* Right Rim Highlight */}
      <div className="absolute top-4 right-1.5 w-1 h-[90%] bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none z-20" />
      
      {/* Bottom Shine */}
      <div className="absolute bottom-2 left-[20%] w-[60%] h-4 bg-white/10 rounded-[100%] blur-md pointer-events-none z-20" />
    </div>
  );
});

Bottle.displayName = 'Bottle';