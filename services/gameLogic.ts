import { BottleData, Color } from '../types';
import { NEON_COLORS, BOTTLE_CAPACITY } from '../constants';

export const generateLevel = (level: number): BottleData[] => {
  // Difficulty progression - HARD MODE
  // Level 1: 4 Colors
  // Level 3: 5 Colors (Increases every 2 levels)
  const numColors = Math.min(4 + Math.floor((level - 1) / 2), NEON_COLORS.length);
  const numEmpty = 2; 
  const totalBottles = numColors + numEmpty;
  
  const activeColors = NEON_COLORS.slice(0, numColors);
  
  // 1. Start with Solved State
  const bottles: BottleData[] = [];
  
  for (let i = 0; i < numColors; i++) {
    bottles.push({
      id: `bottle-${i}`,
      colors: Array(BOTTLE_CAPACITY).fill(activeColors[i]),
      capacity: BOTTLE_CAPACITY
    });
  }
  
  for (let i = numColors; i < totalBottles; i++) {
    bottles.push({
      id: `bottle-${i}`,
      colors: [],
      capacity: BOTTLE_CAPACITY
    });
  }

  // 2. High-Entropy Shuffle
  // To make it "Hard" and "Mix liquids" (thoda thoda), we must allow
  // placing Color A onto Color B during generation.
  // This simulates the reverse of a game where bottles end up mixed.
  
  const shuffleCount = 1000 + (level * 200); // Very high number of small moves
  let lastSource = -1;

  for (let k = 0; k < shuffleCount; k++) {
    const validMoves: { from: number; to: number; mixesColors: boolean }[] = [];

    for (let i = 0; i < totalBottles; i++) {
      if (bottles[i].colors.length === 0) continue; // Source empty
      if (i === lastSource) continue; // Avoid ping-pong

      for (let j = 0; j < totalBottles; j++) {
        if (i === j) continue;
        
        // Target must have space
        if (bottles[j].colors.length < bottles[j].capacity) {
           // Heuristic: Check if this move mixes colors (Entropy increase)
           const sourceColor = bottles[i].colors[bottles[i].colors.length - 1];
           const targetTop = bottles[j].colors.length > 0 ? bottles[j].colors[bottles[j].colors.length - 1] : null;
           
           const mixesColors = targetTop !== null && targetTop !== sourceColor;
           
           validMoves.push({ from: i, to: j, mixesColors });
        }
      }
    }

    if (validMoves.length > 0) {
      // Prioritize moves that mix colors to ensure "thoda thoda" fragmentation
      const mixMoves = validMoves.filter(m => m.mixesColors);
      const movesToConsider = mixMoves.length > 0 && Math.random() > 0.2 ? mixMoves : validMoves;
      
      const move = movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
      
      // Execute 1 unit move
      const color = bottles[move.from].colors.pop()!;
      bottles[move.to].colors.push(color);
      lastSource = move.from;
    }
  }

  return bottles;
};

// Player Rule: Can only pour onto SAME color or EMPTY
export const isValidMove = (source: BottleData, target: BottleData): boolean => {
  if (source.id === target.id) return false;
  if (source.colors.length === 0) return false;
  if (target.colors.length >= target.capacity) return false;

  const sourceColor = source.colors[source.colors.length - 1];
  
  // Target is empty
  if (target.colors.length === 0) return true;
  
  // Colors match
  const targetColor = target.colors[target.colors.length - 1];
  return sourceColor === targetColor;
};

export const checkWin = (bottles: BottleData[]): boolean => {
  return bottles.every(bottle => {
    if (bottle.colors.length === 0) return true;
    if (bottle.colors.length !== bottle.capacity) return false;
    
    const firstColor = bottle.colors[0];
    return bottle.colors.every(c => c === firstColor);
  });
};