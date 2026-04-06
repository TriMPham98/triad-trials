export default function TimerBar({ duration, cardKey, onExpire }) {
  return (
    <div className="timer-track">
      <div
        key={cardKey}
        className="timer-fill"
        style={{ animationDuration: `${duration}s` }}
        onAnimationEnd={onExpire}
      />
    </div>
  )
}
