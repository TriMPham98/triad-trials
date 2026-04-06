import { useState } from 'react'
import KeySelector from './components/KeySelector'
import QuizCard from './components/QuizCard'
import ResultsScreen from './components/ResultsScreen'
import StatsScreen from './components/StatsScreen'
import { generateQuiz } from './utils/musicTheory'
import { applyResults } from './utils/stats'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('start') // 'start' | 'quiz' | 'results' | 'stats'
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState([])
  const [stats, setStats] = useState(null)

  function handleStart(key, qualities) {
    setQuestions(generateQuiz(key, qualities))
    setIndex(0)
    setResults([])
    setStats(null)
    setScreen('quiz')
  }

  function handleAnswer(correct) {
    const result = { question: questions[index], correct }
    const newResults = [...results, result]

    if (index + 1 >= questions.length) {
      setResults(newResults)
      setStats(applyResults(newResults))
      setScreen('results')
    } else {
      setResults(newResults)
      setIndex(index + 1)
    }
  }

  function handlePlayAgain() {
    setScreen('start')
  }

  return (
    <div className="app">
      {screen === 'start' && <KeySelector onStart={handleStart} onStats={() => setScreen('stats')} />}
      {screen === 'stats' && <StatsScreen onBack={() => setScreen('start')} />}
      {screen === 'quiz' && (
        <QuizCard
          question={questions[index]}
          questionIndex={index}
          total={questions.length}
          onAnswer={handleAnswer}
        />
      )}
      {screen === 'results' && (
        <ResultsScreen results={results} stats={stats} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  )
}
