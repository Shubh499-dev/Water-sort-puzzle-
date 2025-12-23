import React, { useState, useEffect } from 'react';
import { GameScreen } from './components/GameScreen';
import { StartScreen } from './components/StartScreen';
import { Theme } from './types';
import { audioService } from './services/audioService';

function App() {
  const [screen, setScreen] = useState<'start' | 'game'>('start');
  
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('aqua-sort-theme') as Theme) || 'dark';
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('aqua-sort-muted') === 'true';
  });

  useEffect(() => {
    audioService.setMuted(isMuted);
    localStorage.setItem('aqua-sort-muted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('aqua-sort-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    audioService.playTap();
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleStart = () => {
    // Ensure Audio Context is resumed on user gesture
    if (!isMuted) {
      // Small silent interaction to unlock audio
      audioService.playTap(); 
    }
    setScreen('game');
  };

  const handleHome = () => {
    setScreen('start');
  };

  return (
    <div className="antialiased">
      {screen === 'start' ? (
        <StartScreen 
          onStart={handleStart} 
          theme={theme}
          toggleTheme={toggleTheme}
          isMuted={isMuted}
          toggleMute={toggleMute}
        />
      ) : (
        <GameScreen 
          theme={theme}
          isMuted={isMuted}
          toggleMute={toggleMute}
          onHome={handleHome}
        />
      )}
    </div>
  );
}

export default App;
