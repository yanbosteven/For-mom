export function ScoreBoard({ score, highScore }: { score: number; highScore: number }) {
  return (
    <div className="score-board">
      <div>
        <div className="score-label">SCORE</div>
        <div className="score-value">{score}</div>
      </div>
      <div>
        <div className="score-label">HIGH SCORE</div>
        <div className="score-value">{highScore}</div>
      </div>
    </div>
  )
}