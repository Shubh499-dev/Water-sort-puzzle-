export type Color = string;
export type Theme = 'dark' | 'light';

export interface BottleData {
  id: string;
  colors: Color[]; // Stack of colors, index 0 is bottom
  capacity: number;
}

export interface GameState {
  level: number;
  bottles: BottleData[];
  selectedBottleId: string | null;
  isPouring: boolean;
  gameWon: boolean;
  moveCount: number;
  isMuted: boolean;
}

export interface PourEvent {
  fromId: string;
  toId: string;
  color: Color;
  amount: number; // How many units poured
}

// Global definition for canvas-confetti
declare global {
  interface Window {
    confetti: any;
  }
}