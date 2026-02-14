import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameLogic } from './hooks/useGameLogic'
import { TouchControl } from './components/TouchControl'
import { ScoreBoard } from './components/ScoreBoard'

export default function App() {
  const {
    grid,
    score,
    highScore,
    isGameOver,
    move,
    rotate,
    resetGame
  } = useGameLogic()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') move('left')
      else if (e.key === 'ArrowRight') move('right')
      else if (e.key === 'ArrowDown') move('down')
      else if (e.key === 'ArrowUp') rotate()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move, rotate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-container"
      >
        <div className="p-8">
          <motion.h1 
            className="game-title mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Apple Tetris 2.0
          </motion.h1>

          <ScoreBoard score={score} highScore={highScore} />

          <div className="game-grid">
            {grid.map((row, y) => 
              row.map((cell, x) => (
                <motion.div
                  key={`${x}-${y}`}
                  className={cell ? "tetris-block" : "bg-black/40 aspect-square"}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: (x + y) * 0.01
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Touch Controls */}
        <TouchControl
          onRotate={rotate}
          onMove={move}
          className="left-4 md:left-8"
          hint="滑动移动 / 点击旋转"
          icon="rotate"
        />
        
        <TouchControl
          onRotate={rotate}
          onMove={move}
          className="right-4 md:right-8"
          hint="下滑加速"
          icon="down"
        />

        {/* Game Over Overlay */}
        {isGameOver && (
          <motion.div 
            className="absolute inset-0 backdrop-blur-sm bg-black/50 
                       rounded-3xl flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Game Over</h2>
              <div className="mb-6">
                <div className="text-white/60">Final Score</div>
                <div className="text-3xl font-bold">{score}</div>
              </div>
              <button 
                onClick={resetGame}
                className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 
                         transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}