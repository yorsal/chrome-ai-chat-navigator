import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { MessageCircle, Lightbulb, CheckCircle, FileDown } from 'lucide-react'

export interface QuestionItem {
  id: string
  text: string
  anchorId: string
  answerAnchorId?: string
  thinkingAnchorId?: string
  contentAnchorId?: string
  chatTitle?: string
}

interface QuestionListProps {
  questions: QuestionItem[]
  onQuestionClick: (anchorId: string) => void
  onAnswerClick?: (anchorId: string) => void
  onDownloadContent?: (question: QuestionItem) => void
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onQuestionClick,
  onAnswerClick,
  onDownloadContent,
}) => {
  const { t } = useLanguage()

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-sm font-medium">{t.noQuestions}</p>
          <p className="text-xs mt-2 text-gray-400">{t.noQuestionsHint}</p>
        </div>
      </div>
    )
  }

  // 获取标题（从第一个问题获取，因为所有问题共享同一个标题）
  const title = questions.length > 0 ? questions[0].chatTitle : ''

  return (
    <div className="space-y-3">
      {title && title.trim() && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 rounded-lg mb-4 -mx-1 border-l-4 border-indigo-400 shadow-md">
          <h3
            className="text-sm font-semibold text-gray-700 truncate flex items-center gap-2"
            title={title}
          >
            <MessageCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" strokeWidth={2.5} />
            {title}
          </h3>
        </div>
      )}
      {questions.map((question, index) => (
        <div
          key={question.anchorId}
          className="p-4 rounded-lg bg-white hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 group border-l-4 border-transparent hover:border-indigo-400"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold transition-all">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p
                onClick={() => onQuestionClick(question.anchorId)}
                className="text-sm text-gray-800 line-clamp-3 group-hover:text-indigo-700 transition-colors leading-relaxed cursor-pointer font-medium"
              >
                {question.text}
              </p>
              {(question.thinkingAnchorId || question.contentAnchorId) &&
                (onAnswerClick || onDownloadContent) && (
                  <div className="mt-3 flex flex-wrap justify-end">
                    {question.thinkingAnchorId && onAnswerClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAnswerClick(question.thinkingAnchorId!)
                        }}
                        className="flex items-center justify-center text-purple-600 hover:text-purple-700 transition-all duration-200 px-2.5 py-1.5 rounded-lg hover:bg-purple-50 active:scale-95"
                        title={t.viewThinking}
                        aria-label={t.viewThinking}
                      >
                        <Lightbulb className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    )}
                    {question.contentAnchorId && onAnswerClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAnswerClick(question.contentAnchorId!)
                        }}
                        className="flex items-center justify-center text-green-600 hover:text-green-700 transition-all duration-200 px-2.5 py-1.5 rounded-lg hover:bg-green-50 active:scale-95"
                        title={t.viewContent}
                        aria-label={t.viewContent}
                      >
                        <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    )}
                    {question.contentAnchorId && onDownloadContent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDownloadContent(question)
                        }}
                        className="flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all duration-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 active:scale-95"
                        title={t.downloadContent}
                        aria-label={t.downloadContent}
                      >
                        <FileDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
