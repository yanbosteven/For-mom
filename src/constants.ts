import { TetrominoType } from './types'

export const GRID_SIZE = {
  width: 10,
  height: 20
}

export const DROP_TIME = 1000

export const TETROMINOES: Record<TetrominoType, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[1, 0], [1, 0], [1, 1]],
  J: [[0, 1], [0, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]]
}