"use client"
import { useState } from 'react'
import { INTEREST_GROUPS } from '@/lib/interestGroups'

export interface QuizQuestion {
  id: string
  question: string
  emoji: string
  options: {
    text: string
    emoji: string
    groups: string[] // maps to interest group IDs
  }[]
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'weekend',
    question: 'Идеалният ти уикенд е:',
    emoji: '🌟',
    options: [
      { text: 'Приключения на открито в планината', emoji: '🏔️', groups: ['outdoor', 'winter', 'travel'] },
      { text: 'Качване на умения в спортната зала', emoji: '💪', groups: ['fitness', 'team-sports'] },
      { text: 'Изкуство, музеи и култура', emoji: '🎨', groups: ['arts', 'culture', 'music'] },
      { text: 'Релакс с приятели и добра храна', emoji: '🍷', groups: ['food', 'games', 'wellness'] }
    ]
  },
  {
    id: 'energy',
    question: 'Къде зареждаш батериите си:',
    emoji: '⚡',
    options: [
      { text: 'Сред природата, на чист въздух', emoji: '🌲', groups: ['outdoor', 'travel', 'wellness'] },
      { text: 'В динамична тренировка', emoji: '🏃', groups: ['fitness', 'team-sports', 'dance'] },
      { text: 'В креативна работилница', emoji: '🎨', groups: ['arts', 'music', 'learning'] },
      { text: 'На спокойно място с книга или медитация', emoji: '🧘', groups: ['wellness', 'learning'] }
    ]
  },
  {
    id: 'social',
    question: 'Как обичаш да прекарваш време с хора:',
    emoji: '👥',
    options: [
      { text: 'Активности на открито с малка група', emoji: '🚴', groups: ['outdoor', 'team-sports', 'travel'] },
      { text: 'Състезания и отборни спортове', emoji: '⚽', groups: ['team-sports', 'fitness'] },
      { text: 'Творчески проекти и изпълнения', emoji: '🎭', groups: ['arts', 'music', 'culture', 'dance'] },
      { text: 'Настолни игри и дълбоки разговори', emoji: '🎲', groups: ['games', 'food', 'learning', 'professional'] }
    ]
  },
  {
    id: 'challenge',
    question: 'Какъв тип предизвикателство те вдъхновява:',
    emoji: '🎯',
    options: [
      { text: 'Физически предизвикателства и издръжливост', emoji: '🧗', groups: ['outdoor', 'fitness', 'winter'] },
      { text: 'Координация и техника', emoji: '🤸', groups: ['team-sports', 'dance', 'fitness'] },
      { text: 'Творчество и самоизразяване', emoji: '🎨', groups: ['arts', 'music', 'culture'] },
      { text: 'Интелектуални и стратегически игри', emoji: '🧩', groups: ['games', 'learning', 'tech', 'professional'] }
    ]
  },
  {
    id: 'discovery',
    question: 'Как обичаш да откриваш нови неща:',
    emoji: '🔍',
    options: [
      { text: 'Изследване на нови места и пътища', emoji: '🗺️', groups: ['outdoor', 'travel'] },
      { text: 'Опитване на нови спортове и дейности', emoji: '⛷️', groups: ['fitness', 'team-sports', 'winter', 'dance'] },
      { text: 'Културни събития и изложби', emoji: '🎭', groups: ['culture', 'arts', 'music'] },
      { text: 'Гастрономични преживявания', emoji: '🍽️', groups: ['food', 'travel'] }
    ]
  },
  {
    id: 'companion',
    question: 'Твоят идеален спътник за приключения е:',
    emoji: '🐾',
    options: [
      { text: 'Куче или любимец', emoji: '🐕', groups: ['animals', 'outdoor', 'wellness'] },
      { text: 'Тренировъчен партньор', emoji: '🤝', groups: ['fitness', 'team-sports'] },
      { text: 'Творческа душа', emoji: '🎨', groups: ['arts', 'music', 'culture'] },
      { text: 'Добър приятел за дълбоки разговори', emoji: '☕', groups: ['food', 'learning', 'wellness'] }
    ]
  }
]

interface InterestQuizProps {
  onComplete: (interests: string[]) => void
  onSkip?: () => void
  language?: 'bg' | 'en'
}

export default function InterestQuiz({ onComplete, onSkip }: InterestQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [removedInterests, setRemovedInterests] = useState<Set<string>>(new Set())

  const handleAnswer = (optionIndex: number) => {
    const question = QUIZ_QUESTIONS[currentQuestion]
    const newAnswers = { ...answers, [question.id]: optionIndex }
    setAnswers(newAnswers)

    // Animate to next question
    setTimeout(() => {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        calculateResults(newAnswers)
      }
    }, 300)
  }

  const calculateResults = (finalAnswers: Record<string, number>) => {
    // Count interest group scores
    const groupScores: Record<string, number> = {}
    
    QUIZ_QUESTIONS.forEach((question) => {
      const answerIndex = finalAnswers[question.id]
      if (answerIndex !== undefined) {
        const selectedOption = question.options[answerIndex]
        selectedOption.groups.forEach((groupId) => {
          groupScores[groupId] = (groupScores[groupId] || 0) + 1
        })
      }
    })

    // Get top 5-8 interest groups
    const sortedGroups = Object.entries(groupScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, Math.min(8, Object.keys(groupScores).length))

    // Get all interests from top groups
    const interests = sortedGroups.flatMap(([groupId]) => {
      const group = INTEREST_GROUPS.find(g => g.id === groupId)
      return group ? group.interests : []
    })

    // Remove duplicates and take top interests
    const uniqueInterests = Array.from(new Set(interests)).slice(0, 12)
    
    setSelectedInterests(uniqueInterests)
    setShowResults(true)
  }

  const handleRemoveInterest = (interest: string) => {
    const newRemoved = new Set(removedInterests)
    newRemoved.add(interest)
    setRemovedInterests(newRemoved)
  }

  const handleConfirmResults = () => {
    const finalInterests = selectedInterests.filter(i => !removedInterests.has(i))
    onComplete(finalInterests)
  }

  const handleRetake = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setSelectedInterests([])
    setRemovedInterests(new Set())
  }

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100

  if (showResults) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Results Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 animate-bounce-once">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Открихме твоите интереси! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Базирано на отговорите ти, ето какво би те интересувало:
          </p>
        </div>

        {/* Selected Interests */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <span className="mr-2">✨</span>
            Твоите интереси ({selectedInterests.length - removedInterests.size})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Кликни на X за да премахнеш ненужни интереси
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => {
              if (removedInterests.has(interest)) return null
              const group = INTEREST_GROUPS.find(g => g.interests.includes(interest))
              return (
                <div
                  key={interest}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium shadow-md shadow-blue-500/30 flex items-center gap-2 group"
                >
                  {group && <span>{group.emoji}</span>}
                  <span>{interest}</span>
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-1 opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/30"
                    title="Премахни"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleRetake}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Преигай квиза
          </button>
          <button
            onClick={handleConfirmResults}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30 flex items-center justify-center"
          >
            Използвай тези интереси
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const question = QUIZ_QUESTIONS[currentQuestion]

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Въпрос {currentQuestion + 1} от {QUIZ_QUESTIONS.length}
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-4">{question.emoji}</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {question.question}
        </h3>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className="group p-3 sm:p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <div className="text-2xl sm:text-4xl mb-2 sm:mb-3">{option.emoji}</div>
            <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {option.text}
            </p>
          </button>
        ))}
      </div>

      {/* Skip Button */}
      {onSkip && (
        <div className="text-center pt-4">
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Пропусни квиза →
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
