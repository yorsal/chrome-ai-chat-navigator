/**
 * 内容脚本 - 注入到支持的聊天页面（DeepSeek / ChatGPT）
 * 负责检测问题并创建锚点
 */

import {
  detectQuestions,
  createAnchor,
  Question,
  scrollToQuestion,
  scrollToAnswer,
} from '../utils/questionDetector'

let questions: Question[] = []
let observer: MutationObserver | null = null
let scanTimer: number | null = null
let isScanning = false

/**
 * 扫描并更新问题列表（带防抖和去重）
 */
function scanAndUpdateQuestions(): void {
  // 防止重复扫描
  if (isScanning) {
    return
  }

  isScanning = true

  try {
    // 暂时断开 observer，避免创建锚点时触发新的变化
    if (observer) {
      observer.disconnect()
    }

    const newQuestions = detectQuestions()

    // 检查是否有新问题或问题顺序变化
    const hasChanges =
      newQuestions.length !== questions.length ||
      newQuestions.some((q, index) => !questions[index] || questions[index].id !== q.id)

    if (hasChanges) {
      // 为每个问题创建锚点（只在元素还没有锚点时创建）
      newQuestions.forEach((question) => {
        createAnchor(question.element, question.anchorId)

        // 为思考节点创建锚点
        if (question.thinkingElement && question.thinkingAnchorId) {
          createAnchor(question.thinkingElement, question.thinkingAnchorId)
        }

        // 为正文节点创建锚点
        if (question.contentElement && question.contentAnchorId) {
          createAnchor(question.contentElement, question.contentAnchorId)
        }
      })

      questions = newQuestions

      console.log('questions', questions)

      // 通知 popup 更新问题列表（异步，不阻塞）
      chrome.runtime
        .sendMessage({
          type: 'QUESTIONS_UPDATED',
          questions: questions.map((q) => ({
            id: q.id,
            text: q.text,
            anchorId: q.anchorId,
            answerAnchorId: q.answerAnchorId,
            thinkingAnchorId: q.thinkingAnchorId,
            contentAnchorId: q.contentAnchorId,
            chatTitle: q.chatTitle,
          })),
        })
        .catch(() => {
          // 忽略错误（popup 可能未打开）
        })
    }
  } finally {
    isScanning = false

    // 重新连接 observer（使用相同的配置）
    if (observer && document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      })
    }
  }
}

/**
 * 防抖扫描函数
 */
function debouncedScan(): void {
  if (scanTimer) {
    clearTimeout(scanTimer)
  }

  scanTimer = window.setTimeout(() => {
    scanAndUpdateQuestions()
    scanTimer = null
  }, 300) // 300ms 防抖延迟
}

/**
 * 初始化内容脚本
 */
function init(): void {
  // 初始扫描（延迟执行，确保页面已加载）
  setTimeout(() => {
    scanAndUpdateQuestions()
  }, 1000)

  // 监听 DOM 变化（使用防抖）
  observer = new MutationObserver((mutations) => {
    // 过滤掉我们自己的锚点创建操作
    const hasRelevantChanges = mutations.some((mutation) => {
      // 忽略我们创建的锚点元素
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes)
        const isOurAnchor = addedNodes.some((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element
            return (
              el.hasAttribute('data-cmn-question-anchor') ||
              el.classList.contains('cmn-anchor') ||
              el.classList.contains('cmn-question-element') ||
              (el.tagName === 'A' &&
                (el.hasAttribute('name') || el.id) &&
                el.classList.contains('cmn-anchor'))
            )
          }
          return false
        })
        if (isOurAnchor) {
          return false // 忽略我们自己的锚点
        }
      }
      return true
    })

    if (hasRelevantChanges) {
      debouncedScan()
    }
  })

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      // 不监听属性变化，减少触发频率
      attributes: false,
      characterData: false,
    })
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener(
    (
      message: {
        type: string
        anchorId?: string
        questionId?: string
        contentAnchorId?: string
      },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.type === 'GET_QUESTIONS') {
        sendResponse({
          questions: questions.map((q) => ({
            id: q.id,
            text: q.text,
            anchorId: q.anchorId,
            answerAnchorId: q.answerAnchorId,
            thinkingAnchorId: q.thinkingAnchorId,
            contentAnchorId: q.contentAnchorId,
            chatTitle: q.chatTitle,
          })),
        })
        return true
      }

      if (message.type === 'FORCE_REFRESH') {
        // 强制刷新：清除缓存，重新扫描
        questions = []
        // 强制扫描，忽略 isScanning 标志
        isScanning = false

        // 执行扫描
        try {
          if (observer) {
            observer.disconnect()
          }

          const newQuestions = detectQuestions()

          // 为每个问题创建锚点
          newQuestions.forEach((question) => {
            createAnchor(question.element, question.anchorId)

            // 为思考节点创建锚点
            if (question.thinkingElement && question.thinkingAnchorId) {
              createAnchor(question.thinkingElement, question.thinkingAnchorId)
            }

            // 为正文节点创建锚点
            if (question.contentElement && question.contentAnchorId) {
              createAnchor(question.contentElement, question.contentAnchorId)
            }
          })

          questions = newQuestions

          // 重新连接 observer
          if (observer && document.body) {
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: false,
              characterData: false,
            })
          }
        } finally {
          isScanning = false
        }

        // 等待一小段时间确保 DOM 操作完成，然后返回最新列表
        setTimeout(() => {
          sendResponse({
            questions: questions.map((q) => ({
              id: q.id,
              text: q.text,
              anchorId: q.anchorId,
              answerAnchorId: q.answerAnchorId,
              thinkingAnchorId: q.thinkingAnchorId,
              contentAnchorId: q.contentAnchorId,
              chatTitle: q.chatTitle,
            })),
          })
        }, 300)
        return true // 异步响应
      }

      if (message.type === 'SCROLL_TO_QUESTION') {
        const { anchorId } = message
        if (anchorId) {
          const question = questions.find((q) => q.anchorId === anchorId)
          if (question) {
            scrollToQuestion(anchorId)
            sendResponse({ success: true })
          } else {
            sendResponse({ success: false })
          }
        }
        return true
      }

      if (message.type === 'SCROLL_TO_ANSWER') {
        const { anchorId } = message
        if (anchorId) {
          // 查找思考节点或正文节点
          const question = questions.find(
            (q) => q.thinkingAnchorId === anchorId || q.contentAnchorId === anchorId
          )
          if (
            question &&
            (question.thinkingAnchorId === anchorId || question.contentAnchorId === anchorId)
          ) {
            scrollToAnswer(anchorId)
            sendResponse({ success: true })
          } else {
            sendResponse({ success: false })
          }
        }
        return true
      }

      if (message.type === 'GET_CONTENT_HTML') {
        const targetQuestion = (() => {
          if (message.questionId) {
            return questions.find((q) => q.id === message.questionId)
          }
          if (message.contentAnchorId) {
            return questions.find((q) => q.contentAnchorId === message.contentAnchorId)
          }
          return null
        })()

        if (targetQuestion) {
          let contentHtmlStr = ''
          if (targetQuestion.contentElement) {
            const clonedElement = targetQuestion.contentElement.cloneNode(true) as HTMLElement
            clonedElement
              .querySelectorAll('[data-cmn-question-anchor], .cmn-anchor')
              .forEach((el) => el.remove())
            clonedElement.querySelectorAll('button').forEach((el) => el.remove())
            contentHtmlStr = clonedElement.innerHTML
          }

          sendResponse({
            success: true,
            chatTitle: targetQuestion.chatTitle || '',
            questionId: targetQuestion.id,
            question: targetQuestion.text,
            contentHtml: contentHtmlStr,
          })
          return true
        }

        // 获取所有问题的正文内容HTML
        const contentHtml: Array<{ question: string; content: string }> = []
        const chatTitle = questions.length > 0 ? questions[0].chatTitle : ''

        questions.forEach((question) => {
          const questionText = question.text
          let contentHtmlStr = ''

          // 获取正文内容
          if (question.contentElement) {
            // 克隆元素以避免修改原始DOM
            const clonedElement = question.contentElement.cloneNode(true) as HTMLElement
            // 移除可能的锚点元素
            clonedElement
              .querySelectorAll('[data-cmn-question-anchor], .cmn-anchor')
              .forEach((el) => el.remove())
            clonedElement.querySelectorAll('button').forEach((el) => el.remove())
            contentHtmlStr = clonedElement.innerHTML
          }

          if (contentHtmlStr) {
            contentHtml.push({
              question: questionText,
              content: contentHtmlStr,
            })
          }
        })

        // console.log('contentHtml', contentHtml)

        sendResponse({
          success: true,
          chatTitle,
          contentHtml,
        })
        return true
      }

      return false
    }
  )
}

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
