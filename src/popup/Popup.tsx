import React, { useEffect, useState } from 'react'
import { QuestionList, QuestionItem } from '../components/QuestionList'
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext'
import { formatMessage } from '../i18n/locales'
import { RotateCw, AlertCircle, Loader2, FileDown } from 'lucide-react'
import { exportToPdf, ExportData } from '../utils/pdfExporter'

const PopupContent: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // 打开 popup 时自动强制刷新一次
    loadQuestions(true)

    // 监听来自 content script 的更新
    const messageListener = (message: any) => {
      if (message.type === 'QUESTIONS_UPDATED') {
        setQuestions(message.questions || [])
        setLoading(false)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  const loadQuestions = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.id) {
        setError(t.errorGetTab)
        setLoading(false)
        return
      }

      const url = tab.url || ''
      const isSupportedChat =
        url.startsWith('https://chat.deepseek.com') ||
        url.startsWith('https://chat.openai.com') ||
        url.startsWith('https://chatgpt.com') ||
        url.startsWith('https://gemini.google.com')

      if (!isSupportedChat) {
        setError(t.errorUnsupportedSite)
        setLoading(false)
        return
      }

      // 如果强制刷新，先发送刷新请求
      if (forceRefresh) {
        chrome.tabs.sendMessage(tab.id, { type: 'FORCE_REFRESH' }, (response) => {
          if (chrome.runtime.lastError) {
            setError(t.errorConnect)
            setLoading(false)
            return
          }

          if (response && response.questions) {
            setQuestions(response.questions)
          } else {
            setQuestions([])
          }
          setLoading(false)
        })
      } else {
        // 普通加载：直接获取当前列表
        chrome.tabs.sendMessage(tab.id, { type: 'GET_QUESTIONS' }, (response) => {
          if (chrome.runtime.lastError) {
            setError(t.errorConnect)
            setLoading(false)
            return
          }

          if (response && response.questions) {
            setQuestions(response.questions)
          } else {
            setQuestions([])
          }
          setLoading(false)
        })
      }
    } catch (err) {
      setError(t.errorLoad)
      setLoading(false)
    }
  }

  const handleQuestionClick = async (anchorId: string) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.id) {
        return
      }

      // 发送滚动指令到 content script
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'SCROLL_TO_QUESTION',
          anchorId,
        },
        () => {
          // 关闭 popup
          window.close()
        }
      )
    } catch (err) {
      console.error('跳转失败:', err)
    }
  }

  const handleAnswerClick = async (anchorId: string) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.id) {
        return
      }

      // 发送滚动指令到 content script
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'SCROLL_TO_ANSWER',
          anchorId,
        },
        () => {
          // 关闭 popup
          window.close()
        }
      )
    } catch (err) {
      console.error('跳转失败:', err)
    }
  }

  const handleDownloadContent = async (question: QuestionItem) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab?.id) {
        alert(t.errorGetTab)
        return
      }

      if (!question.contentAnchorId) {
        alert(t.downloadContentError)
        return
      }

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'GET_CONTENT_HTML',
          contentAnchorId: question.contentAnchorId,
        },
        async (response) => {
          try {
            if (chrome.runtime.lastError) {
              throw new Error(chrome.runtime.lastError.message || t.downloadContentError)
            }

            if (!response || !response.success || !response.contentHtml) {
              throw new Error(t.downloadContentError)
            }

            const exportData: ExportData = {
              chatTitle: response.chatTitle || question.chatTitle || question.text,
              contentHtml: [{ content: response.contentHtml }],
            }

            await exportToPdf(exportData, false)
          } catch (err) {
            console.error('下载正文失败:', err)
            const message = err instanceof Error ? err.message : String(err)
            alert(`${t.downloadContentError}${message ? `: ${message}` : ''}`)
          }
        }
      )
    } catch (err) {
      console.error('下载正文失败:', err)
      alert(t.downloadContentError)
    }
  }

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true)

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab.id) {
        setError(t.errorGetTab)
        setExportingPdf(false)
        return
      }

      // 从 content script 获取正文内容HTML
      chrome.tabs.sendMessage(tab.id, { type: 'GET_CONTENT_HTML' }, async (response) => {
        try {
          if (chrome.runtime.lastError) {
            throw new Error(t.errorConnect)
          }

          if (!response || !response.success) {
            throw new Error(t.exportPdfError)
          }

          const exportData: ExportData = {
            chatTitle: response.chatTitle || '',
            contentHtml: response.contentHtml || [],
          }

          if (exportData.contentHtml.length === 0) {
            alert('没有可导出的内容')
            setExportingPdf(false)
            return
          }

          // 导出PDF（使用打印功能，用户可以在打印对话框中选择"另存为PDF"）
          await exportToPdf(exportData, false) // 使用打印功能，最可靠且无需外部API
        } catch (err) {
          console.error('导出PDF失败:', err)
          alert(`${t.exportPdfError}: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
          setExportingPdf(false)
        }
      })
    } catch (err) {
      console.error('导出PDF失败:', err)
      alert(t.exportPdfError)
      setExportingPdf(false)
    }
  }

  return (
    <div className="w-[400px] h-[600px] flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with title and refresh icon - 扁平风格渐变 */}
      <div className="flex-shrink-0 px-5 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{t.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              disabled={loading || exportingPdf || questions.length === 0}
              className={`p-2 rounded-lg transition-all duration-200 ${
                loading || exportingPdf || questions.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/20 active:bg-white/30'
              }`}
              title={t.exportPdf}
            >
              <FileDown
                className={`w-5 h-5 text-white ${exportingPdf ? 'animate-pulse' : ''}`}
                strokeWidth={2.5}
              />
            </button>
            {/* Refresh Icon */}
            <button
              onClick={() => !loading && loadQuestions(true)}
              disabled={loading}
              className={`p-2 rounded-lg transition-all duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20 active:bg-white/30'
              }`}
              title={t.refresh}
            >
              <RotateCw
                className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`}
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - 扁平风格 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Question Count */}
        <div className="mb-4 text-xs text-gray-600 text-center font-medium">
          {formatMessage(t.questionCount, { count: questions.length })}
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2
                className="w-10 h-10 text-indigo-500 animate-spin mx-auto"
                strokeWidth={2.5}
              />
              <p className="text-sm text-gray-600 mt-4 font-medium">{t.loading}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="mb-4">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto" strokeWidth={2} />
              </div>
              <p className="text-sm text-red-600 mb-5 font-medium">{error}</p>
              <button
                onClick={() => loadQuestions(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 text-sm font-medium active:scale-95"
              >
                {t.retry}
              </button>
            </div>
          </div>
        ) : (
          <QuestionList
            questions={questions}
            onQuestionClick={handleQuestionClick}
            onAnswerClick={handleAnswerClick}
            onDownloadContent={handleDownloadContent}
          />
        )}
      </div>
    </div>
  )
}

const Popup: React.FC = () => {
  return (
    <LanguageProvider>
      <PopupContent />
    </LanguageProvider>
  )
}

export default Popup
