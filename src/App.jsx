import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============== 常量定义 ==============
const COLS = 10
const ROWS = 20
const BLOCK_SIZE = 28

// 经典方块形状 (1984 参考)
const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: '#00f5ff' },
  O: { shape: [[1, 1], [1, 1]], color: '#ffd700' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#bf00ff' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff6a' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff3366' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#3366ff' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#ff9933' },
}

// 得分规则
const SCORE_RULES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
}

// ============== 工具函数 ==============
const createEmptyBoard = () => 
  Array(ROWS).fill(null).map(() => Array(COLS).fill(0))

const getRandomTetromino = () => {
  const keys = Object.keys(TETROMINOES)
  const key = keys[Math.floor(Math.random() * keys.length)]
  return {
    ...TETROMINOES[key],
    shape: TETROMINOES[key].shape.map(row => [...row]),
    x: Math.floor(COLS / 2) - Math.ceil(TETROMINOES[key].shape[0].length / 2),
    y: 0
  }
}

const rotateMatrix = (matrix) => {
  const rows = matrix.length
  const cols = matrix[0].length
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c]
    }
  }
  return rotated
}

// ============== 主组件 ==============
function App() {
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState(getRandomTetromino())
  const [nextPiece, setNextPiece] = useState(getRandomTetromino())
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [level, setLevel] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  
  const gameLoopRef = useRef(null)
  const boardRef = useRef(null)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 检查碰撞
  const checkCollision = useCallback((piece, boardState, offsetX = 0, offsetY = 0) => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const newX = piece.x + c + offsetX
          const newY = piece.y + r + offsetY
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true
          if (newY >= 0 && boardState[newY][newX]) return true
        }
      }
    }
    return false
  }, [])

  // 锁定方块
  const lockPiece = useCallback(() => {
    const newBoard = board.map(row => [...row])
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          const y = currentPiece.y + r
          const x = currentPiece.x + c
          if (y < 0) {
            setGameOver(true)
            return
          }
          newBoard[y][x] = currentPiece.color
        }
      }
    }

    // 消除行
    let linesCleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r].every(cell => cell !== 0)) {
        newBoard.splice(r, 1)
        newBoard.unshift(Array(COLS).fill(0))
        linesCleared++
        r++
      }
    }

    if (linesCleared > 0) {
      setScore(prev => prev + (SCORE_RULES[linesCleared] || 0) * level)
      setLevel(prev => Math.min(10, prev + Math.floor(linesCleared / 2)))
    }

    setBoard(newBoard)
    setCurrentPiece(nextPiece)
    setNextPiece(getRandomTetromino())

    // 检查游戏结束
    if (checkCollision(nextPiece, newBoard, 0, 0)) {
      setGameOver(true)
    }
  }, [board, currentPiece, nextPiece, level, checkCollision])

  // 移动方块
  const movePiece = useCallback((dx, dy) => {
    if (gameOver || isPaused) return
    if (!checkCollision(currentPiece, board, dx, dy)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    } else if (dy > 0) {
      lockPiece()
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision, lockPiece])

  // 旋转方块
  const rotatePiece = useCallback(() => {
    if (gameOver || isPaused) return
    const rotated = rotateMatrix(currentPiece.shape)
    const testPiece = { ...currentPiece, shape: rotated }
    if (!checkCollision(testPiece, board, 0, 0)) {
      setCurrentPiece(testPiece)
    } else if (!checkCollision(testPiece, board, -1, 0)) {
      setCurrentPiece({ ...testPiece, x: testPiece.x - 1 })
    } else if (!checkCollision(testPiece, board, 1, 0)) {
      setCurrentPiece({ ...testPiece, x: testPiece.x + 1 })
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          movePiece(-1, 0)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          movePiece(1, 0)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          movePiece(0, 1)
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault()
          rotatePiece()
          break
        case 'p':
        case 'P':
          setIsPaused(prev => !prev)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [movePiece, rotatePiece, gameOver])

  // 游戏循环
  useEffect(() => {
    if (gameOver || isPaused) return
    const speed = Math.max(100, 1000 - (level - 1) * 100)
    gameLoopRef.current = setInterval(() => {
      movePiece(0, 1)
    }, speed)
    return () => clearInterval(gameLoopRef.current)
  }, [movePiece, gameOver, isPaused, level])

  // 重新开始
  const restart = () => {
    setBoard(createEmptyBoard())
    setCurrentPiece(getRandomTetromino())
    setNextPiece(getRandomTetromino())
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    setLevel(1)
  }

  // 渲染方块
  const renderBlock = (color, isGhost = false) => (
    <div
      className="block-gradient"
      style={{
        width: BLOCK_SIZE - 2,
        height: BLOCK_SIZE - 2,
        opacity: isGhost ? 0.3 : 1,
        borderRadius: 4,
      }}
    />
  )

  return (
    <div className="min-h-screen bg-[#000000] relative flex items-center justify-center overflow-hidden">
      {/* 背景渐变 */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #1a1a2e 0%, #000000 70%)'
        }}
      />

      <div className="relative z-10 flex gap-8 items-start p-4">
        {/* 左侧面板 */}
        <div className="glass-button p-4 flex flex-col items-center min-w-[140px]">
          <h2 className="text-white/80 text-sm mb-4 font-medium">NEXT</h2>
          <div className="grid gap-1" style={{ 
            gridTemplateColumns: 'repeat(2, 20px)',
            gridTemplateRows: 'repeat(2, 20px)'
          }}>
            {nextPiece.shape.map((row, y) =>
              row.map((cell, x) => (
                <div key={`${y}-${x}`}>
                  {cell && (
                    <div 
                      className="block-gradient"
                      style={{ width: 18, height: 18, borderRadius: 3 }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">SCORE</p>
            <p className="text-white text-2xl font-bold">{score}</p>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-white/60 text-xs">LEVEL</p>
            <p className="text-white text-xl font-bold">{level}</p>
          </div>
        </div>

        {/* 游戏区域 */}
        <div className="relative">
          <div 
            ref={boardRef}
            className="glass-button p-1 relative"
            style={{
              width: COLS * BLOCK_SIZE + 8,
              height: ROWS * BLOCK_SIZE + 8,
            }}
          >
            {/* 网格线 */}
            <div 
              className="absolute inset-1 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${BLOCK_SIZE}px ${BLOCK_SIZE}px`
              }}
            />
            
            {/* 游戏方块 */}
            <AnimatePresence>
              {board.map((row, y) =>
                row.map((cell, x) => {
                  if (!cell) return null
                  return (
                    <motion.div
                      key={`board-${y}-${x}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute"
                      style={{
                        left: x * BLOCK_SIZE + 4,
                        top: y * BLOCK_SIZE + 4,
                      }}
                    >
                      {renderBlock(cell)}
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>

            {/* 当前方块 */}
            {!gameOver && !isPaused && currentPiece.shape.map((row, y) =>
              row.map((cell, x) => {
                if (!cell) return null
                return (
                  <motion.div
                    key={`current-${y}-${x}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute"
                    style={{
                      left: (currentPiece.x + x) * BLOCK_SIZE + 4,
                      top: (currentPiece.y + y) * BLOCK_SIZE + 4,
                    }}
                  >
                    {renderBlock(currentPiece.color)}
                  </motion.div>
                )
              })
            )}

            {/* 游戏结束 */}
            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <h2 className="text-white text-3xl font-bold mb-2">GAME OVER</h2>
                  <p className="text-white/80 mb-4">Final Score: {score}</p>
                  <button 
                    onClick={restart}
                    className="glass-button px-6 py-2 text-white font-medium hover:bg-white/20 transition"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* 暂停 */}
            {isPaused && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <h2 className="text-white text-2xl font-bold">PAUSED</h2>
              </div>
            )}
          </div>

          {/* iPad 虚拟按钮 */}
          {isMobile && !gameOver && (
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 flex flex-col gap-3">
              <button 
                onClick={() => movePiece(-1, 0)}
                className="glass-button w-16 h-16 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={() => movePiece(1, 0)}
                className="glass-button w-16 h-16 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {isMobile && !gameOver && (
            <div className="absolute -right-24 top-1/2 -translate-y-1/2 flex flex-col gap-3">
              <button 
                onClick={rotatePiece}
                className="glass-button w-16 h-16 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button 
                onClick={() => movePiece(0, 1)}
                className="glass-button w-16 h-16 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 控制说明 */}
        <div className="glass-button p-4 min-w-[120px]">
          <h3 className="text-white/80 text-sm mb-3 font-medium">CONTROLS</h3>
          <div className="text-white/60 text-xs space-y-2">
            <p>← → Move</p>
            <p>↑ / Space Rotate</p>
            <p>↓ Soft Drop</p>
            <p>P Pause</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
