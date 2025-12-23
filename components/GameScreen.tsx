import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Home, Clock, Heart, Pause, CirclePlay } from 'lucide-react';
import { Bottle } from './Bottle';
import { BottleData, Theme } from '../types';
import { generateLevel, isValidMove, checkWin } from '../services/gameLogic';
import { audioService } from '../services/audioService';

interface GameScreenProps {
  theme: Theme;
  isMuted: boolean;
  toggleMute: () => void;
  onHome: () => void;
}

const MAX_MISTAKES = 3;
const BASE_TIME_LIMIT = 25; 

export const GameScreen: React.FC<GameScreenProps> = ({ theme, onHome }) => {
  const isDark = theme === 'dark';

  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem('aqua-sort-level');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [bottles, setBottles] = useState<BottleData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPouring, setIsPouring] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  
  // New Challenge States
  const [timeLeft, setTimeLeft] = useState(BASE_TIME_LIMIT);
  const [mistakes, setMistakes] = useState(0);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Track animation state for the bottle currently moving
  const [pourAnimation, setPourAnimation] = useState<{ id: string; style: React.CSSProperties } | null>(null);
  
  // Track the liquid stream visualization
  const [streamData, setStreamData] = useState<{
    left: number;
    top: number;
    height: number;
    color: string;
  } | null>(null);

  // Store DOM references to bottles for coordinate calculation
  const bottleRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    startLevel(level);
  }, [level]);

  // Timer Logic
  useEffect(() => {
    if (gameWon || isPouring || timeLeft <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerRestart("Time's Up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameWon, isPouring, isPaused]);

  const startLevel = (lvl: number) => {
    const newBottles = generateLevel(lvl);
    setBottles(newBottles);
    setSelectedId(null);
    setGameWon(false);
    setIsPouring(false);
    setPourAnimation(null);
    setStreamData(null);
    setIsPaused(false);
    
    // Reset Challenges
    setMistakes(0);
    
    // Calculate Time: 25s base + 2s for every 25 levels
    const extraTime = Math.floor(lvl / 25) * 2;
    setTimeLeft(BASE_TIME_LIMIT + extraTime);
    
    localStorage.setItem('aqua-sort-level', String(lvl));
  };

  const togglePause = () => {
    audioService.playTap();
    setIsPaused(!isPaused);
  };

  const triggerRestart = (reason: string) => {
    setShakeScreen(true);
    audioService.playError();
    
    // Short delay to show shake before reset
    setTimeout(() => {
      setShakeScreen(false);
      resetLevel();
    }, 500);
  };

  const handleBottleClick = async (clickedId: string) => {
    if (isPouring || gameWon || isPaused) return;

    audioService.playTap();

    if (selectedId === null) {
      const bottle = bottles.find(b => b.id === clickedId);
      if (bottle && bottle.colors.length > 0) {
        setSelectedId(clickedId);
      }
      return;
    }

    if (selectedId === clickedId) {
      setSelectedId(null);
      return;
    }

    const sourceIndex = bottles.findIndex(b => b.id === selectedId);
    const targetIndex = bottles.findIndex(b => b.id === clickedId);
    const source = bottles[sourceIndex];
    const target = bottles[targetIndex];

    if (isValidMove(source, target)) {
      await performPour(sourceIndex, targetIndex);
    } else {
      // Invalid Move Logic
      audioService.playError();
      setSelectedId(null);
      
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      
      if (newMistakes >= MAX_MISTAKES) {
        triggerRestart("Too many mistakes!");
      }
    }
  };

  const performPour = async (sourceIdx: number, targetIdx: number) => {
    setIsPouring(true); // Lock interactions
    
    const sourceId = bottles[sourceIdx].id;
    const targetId = bottles[targetIdx].id;
    
    // Get DOM elements
    const sourceEl = bottleRefs.current.get(sourceId);
    const targetEl = bottleRefs.current.get(targetId);

    if (sourceEl && targetEl) {
      const sRect = sourceEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      
      // -- MOVEMENT LOGIC --
      // Position the Source Bottle so its mouth is above the target.
      // Rotation: 85 degrees (almost horizontal)
      const isRight = tRect.left > sRect.left; 
      const rotation = isRight ? 85 : -85;
      
      const targetCenterX = tRect.left + tRect.width / 2;
      const targetTopY = tRect.top;

      const sourceCenterX = sRect.left + sRect.width / 2;
      const sourceCenterY = sRect.top + sRect.height / 2;

      // Adjust offset to prevent the bottle from overlapping the stream weirdly
      const horizontalOffset = (sRect.height / 2) - 10; 
      
      const desiredCenterX = isRight 
        ? targetCenterX - horizontalOffset
        : targetCenterX + horizontalOffset;

      // Position vertical: slightly above target rim
      const desiredCenterY = targetTopY - 50; 

      const offsetX = desiredCenterX - sourceCenterX;
      const offsetY = desiredCenterY - sourceCenterY;

      // 1. ANIMATION: Move Source to Target (FASTER SPEED: 0.3s)
      setPourAnimation({
        id: sourceId,
        style: {
          transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
          zIndex: 50, // Source is on top of everything
          transition: 'transform 0.3s cubic-bezier(0.2, 0, 0.4, 1)', // Speed increased
        }
      });

      // Wait for movement (FASTER: 280ms)
      await new Promise(r => setTimeout(r, 280));

      // -- STREAM LOGIC --
      const sourceB = bottles[sourceIdx];
      const targetB = bottles[targetIdx];
      const colorToPour = sourceB.colors[sourceB.colors.length - 1];

      // Stream Start: Calculated based on the rotated bottle tip position
      const streamStartTop = targetTopY - 25; 
      
      // Stream End: Target Bottom - Liquid Height
      const liquidUnitHeight = tRect.height / targetB.capacity; // approx height per unit
      const currentLiquidHeight = targetB.colors.length * liquidUnitHeight;
      const targetBottomY = tRect.bottom;
      
      const liquidSurfaceY = targetBottomY - currentLiquidHeight - (targetB.colors.length > 0 ? 0 : 5); 

      setStreamData({
        left: targetCenterX, 
        top: streamStartTop,
        height: Math.max(0, liquidSurfaceY - streamStartTop),
        color: colorToPour
      });

      audioService.playPour();

      // 2. FILLING ANIMATION
      await new Promise(r => setTimeout(r, 20)); // Minimal delay
      
      // Update State (Logic)
      const newBottles = JSON.parse(JSON.stringify(bottles));
      const newSource = newBottles[sourceIdx];
      const newTarget = newBottles[targetIdx];
      
      let unitsToPour = 0;
      for (let i = newSource.colors.length - 1; i >= 0; i--) {
        if (newSource.colors[i] === colorToPour) {
          unitsToPour++;
        } else {
          break;
        }
      }
      const spaceInTarget = newTarget.capacity - newTarget.colors.length;
      const actualAmount = Math.min(unitsToPour, spaceInTarget);

      for (let i = 0; i < actualAmount; i++) {
        newSource.colors.pop();
        newTarget.colors.push(colorToPour);
      }
      setBottles(newBottles);

      // Keep stream active (FASTER: 300ms)
      await new Promise(r => setTimeout(r, 300));

      // 3. CLEANUP
      setStreamData(null);
      await new Promise(r => setTimeout(r, 50)); 
      
      setPourAnimation(null); // Return source
      
      await new Promise(r => setTimeout(r, 200)); // Faster return
      
      setSelectedId(null);
      setIsPouring(false);
      
      if (checkWin(newBottles)) {
        handleWin();
      }

    } else {
      setIsPouring(false);
      setSelectedId(null);
    }
  };

  const handleWin = () => {
    setGameWon(true);
    audioService.playWin();
    
    if (window.confetti) {
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        window.confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00f3ff', '#ff00ff', '#39ff14']
        });
        window.confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ffea00', '#ff3131', '#bc13fe']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
  };

  const resetLevel = () => {
    audioService.playTap();
    startLevel(level);
  };

  // UI Helpers
  const getTimerColor = () => {
    if (timeLeft > 10) return isDark ? 'text-green-400' : 'text-green-600';
    if (timeLeft > 5) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return 'text-red-500 animate-pulse';
  };

  return (
    <div className={`min-h-screen overflow-hidden flex flex-col relative transition-all duration-700
      ${shakeScreen ? 'animate-[spin_0.1s_ease-in-out_infinite]' : ''}
      ${isDark ? 'text-white' : 'text-slate-800'}
    `}>
      
      {/* --- REALISTIC BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0 transition-opacity duration-1000">
        {isDark ? (
          <div className="w-full h-full relative bg-[#050b14]">
             {/* Deep Abyss Gradients */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_#050b14_70%)] opacity-80" />
             <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#020617] to-transparent opacity-90" />
             
             {/* Atmospheric Glowing Orbs */}
             <div className="absolute top-[10%] left-[20%] w-[30vw] h-[30vw] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
             <div className="absolute top-[40%] right-[10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }} />
             <div className="absolute bottom-[-10%] left-[10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[120px]" />

             {/* Vignette Overlay for Focus */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_50%,_rgba(0,0,0,0.5)_100%)] pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full relative bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
             {/* Light Refraction Effects */}
             <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-white/60 rounded-full blur-[80px]" />
             <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-cyan-200/20 rounded-full blur-[100px]" />
             <div className="absolute top-[30%] right-[20%] w-[20vw] h-[20vw] bg-blue-300/10 rounded-full blur-[60px] animate-pulse" />
          </div>
        )}
      </div>

      {/* --- CONTENT LAYER (Header & Game) --- */}
      <div className="relative z-10 flex flex-col flex-1 h-full">

        {/* Header */}
        <header className={`p-4 flex justify-between items-center z-20 backdrop-blur-md shadow-lg transition-colors duration-500
          ${isDark ? 'bg-black/10 border-b border-white/5 shadow-black/20' : 'bg-white/40 border-b border-white/40 shadow-blue-200/10'}`}>
          <div className="flex items-center gap-2">
            <button 
              onClick={onHome} 
              className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/60 hover:bg-white text-slate-700 shadow-sm'}`}
            >
              <Home size={20} />
            </button>
            
            <button 
              onClick={togglePause} 
              className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/60 hover:bg-white text-slate-700 shadow-sm'}`}
            >
              {isPaused ? <CirclePlay size={20} className="text-green-400" /> : <Pause size={20} />}
            </button>
          </div>

          {/* Stats Center: Time & Lives */}
          <div className="flex items-center gap-4 md:gap-8">
             {/* Timer */}
             <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm">
               <Clock size={16} className={getTimerColor()} />
               <span className={`font-mono text-xl font-black ${getTimerColor()}`}>
                 {timeLeft}s
               </span>
             </div>

             {/* Lives / Mistakes */}
             <div className="flex items-center gap-1">
               {[...Array(MAX_MISTAKES)].map((_, i) => (
                 <Heart 
                    key={i} 
                    size={20} 
                    fill={i < (MAX_MISTAKES - mistakes) ? "#ff3131" : "transparent"} 
                    className={`transition-all duration-300 ${i < (MAX_MISTAKES - mistakes) ? 'text-red-500 drop-shadow-[0_0_5px_rgba(255,49,49,0.5)]' : 'text-slate-500 opacity-20'}`}
                  />
               ))}
             </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-full backdrop-blur text-sm font-mono shadow-[0_0_15px_rgba(0,243,255,0.15)] 
              ${isDark ? 'bg-white/5 border border-white/10 text-cyan-300' : 'bg-white/80 border border-blue-100 text-blue-600'}`}>
              LVL {level}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative w-full max-w-7xl mx-auto">
          
          {/* PAUSE OVERLAY */}
          {isPaused && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in rounded-3xl">
               <h2 className="text-4xl font-black tracking-[0.2em] text-white mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">PAUSED</h2>
               <button 
                 onClick={togglePause}
                 className="p-6 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all transform hover:scale-110 active:scale-95"
               >
                 <Play size={48} fill="currentColor" className="ml-2" />
               </button>
             </div>
          )}

          {/* LIQUID STREAM OVERLAY */}
          {streamData && (
            <>
              {/* Real Water Stream Effect */}
              <div 
                className="absolute z-20 animate-in fade-in duration-75 origin-top animate-stream-wobble"
                style={{
                  left: streamData.left,
                  top: streamData.top,
                  height: streamData.height + 4, // Extend slightly for better connection
                  width: '14px', 
                  transform: 'translateX(-50%)', 
                  clipPath: 'polygon(0% 0%, 100% 0%, 65% 100%, 35% 100%)',
                  background: streamData.color,
                  opacity: 0.9,
                  filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))'
                }}
              >
                  <div 
                      className="w-full h-full animate-flow-y opacity-40 mix-blend-overlay"
                      style={{
                          backgroundImage: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                          backgroundSize: '100% 30px',
                      }}
                  />
              </div>
              
              {/* Droplets */}
              <div 
                className="absolute w-1.5 h-1.5 rounded-full z-20 animate-[ping_0.5s_linear_infinite]"
                style={{
                  left: streamData.left - 6,
                  top: streamData.top + streamData.height * 0.8,
                  backgroundColor: streamData.color,
                  opacity: 0.8,
                }}
              />
               <div 
                className="absolute w-1 h-1 rounded-full z-20 animate-[ping_0.6s_linear_infinite]"
                style={{
                  left: streamData.left + 4,
                  top: streamData.top + streamData.height * 0.6,
                  backgroundColor: streamData.color,
                  opacity: 0.6,
                  animationDelay: '0.1s'
                }}
              />

              {/* Subtle Impact Ring (No Line) */}
               <div 
                className="absolute w-10 h-10 rounded-full z-20 opacity-50 animate-ping"
                style={{
                  left: streamData.left,
                  top: streamData.top + streamData.height - 2,
                  transform: 'translateX(-50%) scale(0.5)',
                  backgroundColor: streamData.color,
                }}
              />
            </>
          )}

          {/* Win Overlay */}
          {gameWon && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-500 animate-in fade-in rounded-3xl">
              <h2 className="text-6xl md:text-8xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 animate-glow filter drop-shadow-2xl">
                CLEARED!
              </h2>
              <div className="flex gap-6">
                 <button 
                  onClick={resetLevel}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-800 border border-white/10 hover:bg-slate-700 hover:border-white/30 transition-all font-bold text-lg text-white shadow-lg"
                >
                  <RotateCcw size={24} /> Replay
                </button>
                <button 
                  onClick={nextLevel}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] font-bold text-xl transform hover:scale-105 active:scale-95 text-white"
                >
                  Next Level <Play size={24} fill="currentColor" />
                </button>
              </div>
            </div>
          )}

          {/* Game Over / Restart Hint */}
          {mistakes > 0 && mistakes < MAX_MISTAKES && !isPaused && (
             <div className="absolute top-1/4 pointer-events-none animate-bounce z-40">
                <span className="bg-red-500/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400/30">
                  {MAX_MISTAKES - mistakes} Lives Left!
                </span>
             </div>
          )}

          <div className={`
            grid gap-x-8 gap-y-16 transition-all duration-500 mt-8
            ${bottles.length <= 6 ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : ''}
            ${bottles.length > 6 && bottles.length <= 10 ? 'grid-cols-4 md:grid-cols-5' : ''}
            ${bottles.length > 10 ? 'grid-cols-4 md:grid-cols-6' : ''}
          `}>
            {bottles.map((bottle) => {
              const isSource = selectedId !== null;
              const sourceBottle = isSource ? bottles.find(b => b.id === selectedId) : null;
              const isValid = sourceBottle ? isValidMove(sourceBottle, bottle) : false;

              const isAnimating = pourAnimation?.id === bottle.id;
              const animationStyle = isAnimating ? pourAnimation.style : undefined;

              return (
                <Bottle 
                  key={bottle.id}
                  ref={(el) => { if (el) bottleRefs.current.set(bottle.id, el); }}
                  data={bottle} 
                  isSelected={selectedId === bottle.id && !isAnimating}
                  isValidTarget={isValid}
                  theme={theme}
                  animationStyle={animationStyle}
                  onClick={() => handleBottleClick(bottle.id)} 
                />
              );
            })}
          </div>
        </main>

         <footer className={`p-4 text-center text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase opacity-40 z-20 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Water Sort Premium
        </footer>
      </div>
    </div>
  );
};