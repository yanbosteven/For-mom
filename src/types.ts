export type Point = { x: number; y: number }
export type TetrominoType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z'
export type Direction = 'left' | 'right' | 'down'

export const SCORE_TABLE = {
  1: 100,  // 1行 100分
  2: 300,  // 2行 300分
  3: 500,  // 3行 500分
  4: 800   // 4行 800分
} as const