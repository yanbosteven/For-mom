import { useState, useCallback } from 'react'
import { Point, TetrominoType, Direction } from '../types'
import { GRID_SIZE, TETROMINOES } from '../constants'

export function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE.height }, () => Array(GRID_SIZE.width).fill(0))
}

export function getRandomTetromino() {
  const types = Object.keys(TETROMINOES) as TetrominoType[]
  return TETROMINOES[types[Math.floor(Math.random() * types.length)]]
}

export function useGameLogic() {
  const [grid, setGrid] = useState(() => createEmptyGrid())
  const [piece, setPiece] = useState(() => getRandomTetromino())
  const [pos, setPos] = useState<Point>({ x: 4, y: 0 })
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('tetris-high-score')
    return saved ? parseInt(saved, 10) : 0
  })

  const checkCollision = useCallback((position: Point, matrix: number[][]) => {
    return matrix.some((row, y) =>
      row.some((value, x) => {
        if (value === 0) return false
        const newX = position.x + x
        const newY = position.y + y
        return (
          newX < 0 || 
          newX >= GRID_SIZE.width ||
          newY >= GRID_SIZE.height ||
          (newY >= 0 && grid[newY][newX] !== 0)
        )
      })
    )
  }, [grid])

  const move = useCallback((direction: Direction) => {
    if (isGameOver) return
    
    const newPos = {
      x: pos.x + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0),
      y: pos.y + (direction === 'down' ? 1 : 0)
    }

    if (!checkCollision(newPos, piece)) {
      setPos(newPos)
    } else if (direction === 'down') {
      if (pos.y < 1) {
        setIsGameOver(true)
        return
      }

      const newGrid = grid.map(row => [...row])
      piece.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const gridY = pos.y + y
            if (gridY >= 0) {
              newGrid[gridY][pos.x + x] = value
            }
          }
        })
      })

      // 检查是否有行可以消除
      let rowsCleared = 0
      for (let y = GRID_SIZE.height - 1; y >= 0; y--) {
        if (newGrid[y].every(cell => cell !== 0)) {
          newGrid.splice(y, 1)
          newGrid.unshift(Array(GRID_SIZE.width).fill(0))
          rowsCleared++
          y++
        }
      }

      // 更新分数
      if (rowsCleared > 0) {
        const points = [0, 100, 300, 500, 800][rowsCleared]
        const newScore = score + points
        setScore(newScore)
        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('tetris-high-score', newScore.toString())
        }
        // 播放消除音效
        const audio = new Audio('data:audio/mp3;base64,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CAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAI//uSZLYP+BBmMQ9jLwAQgAYAMYqAABkBmGQwwqgEAAGsDGFUAAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgCAIAgC//uSZOwP92BmKY9jLwAQAAYAMYeAAF8BmGQMYVQAIAGsDGFUAApVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV')
        audio.play()
      }

      setGrid(newGrid)
      setPos({ x: 4, y: 0 })
      setPiece(getRandomTetromino())
    }
  }, [pos, piece, grid, isGameOver, checkCollision, score, highScore])

  const rotate = useCallback(() => {
    if (isGameOver) return
    const rotated = piece[0].map((_, i) =>
      piece.map(row => row[row.length - 1 - i])
    )
    if (!checkCollision(pos, rotated)) {
      setPiece(rotated)
    }
  }, [pos, piece, isGameOver, checkCollision])

  const resetGame = useCallback(() => {
    setIsGameOver(false)
    setGrid(createEmptyGrid())
    setPos({ x: 4, y: 0 })
    setPiece(getRandomTetromino())
    setScore(0)
  }, [])

  return {
    grid,
    piece,
    pos,
    score,
    highScore,
    isGameOver,
    move,
    rotate,
    resetGame
  }
}