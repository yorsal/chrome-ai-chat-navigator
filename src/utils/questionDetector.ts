/**
 * 问题检测工具函数
 * 通过 data-um-id 属性识别问题
 */

export interface Question {
  id: string;
  text: string;
  element: HTMLElement;
  anchorId: string;
  answerElement?: HTMLElement; // ds-message 节点
  answerAnchorId?: string;
  thinkingElement?: HTMLElement; // 思考节点（如果有）
  thinkingAnchorId?: string;
  contentElement?: HTMLElement; // 正文节点（ds-markdown）
  contentAnchorId?: string;
  chatTitle?: string; // Chat 标题
}

/**
 * 获取页面标题（Chat 标题）
 */
function getChatTitle(): string {
  const hostname = window.location.hostname;

  if (hostname.includes('gemini.google.com')) {
    const selectedConversation = document.querySelector('conversations-list .selected');
    const selectedText = selectedConversation?.textContent?.trim();
    if (selectedText) {
      return selectedText;
    }
  }

  if (document.title && document.title.trim().length > 0) {
    return document.title.trim();
  }
  return '';
}

function generateUniqueId(base: string, seen: Set<string>): string {
  let uniqueId = base;
  let counter = 0;
  while (seen.has(uniqueId)) {
    counter += 1;
    uniqueId = `${base}-${counter}`;
  }
  seen.add(uniqueId);
  return uniqueId;
}

function extractVisibleText(element: HTMLElement | null | undefined): string {
  if (!element) {
    return '';
  }
  const cloned = element.cloneNode(true) as HTMLElement;
  cloned.querySelectorAll('h5.sr-only, h6.sr-only, nav, button, svg, img').forEach((el) => el.remove());
  return cloned.textContent?.trim() ?? '';
}

function detectDeepSeekQuestions(chatTitle: string): Question[] {
  const questionElements = document.querySelectorAll('[data-um-id]');
  const questions: Question[] = [];
  const seenIds = new Set<string>();

  questionElements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    const umId = htmlElement.getAttribute('data-um-id') || '';
    const text = htmlElement.textContent?.trim() || '';

    if (!text) {
      return;
    }

    const anchorId = generateUniqueId(`question-${umId}-${index}`, seenIds);

    let answerElement: HTMLElement | undefined;
    let answerAnchorId: string | undefined;
    let thinkingElement: HTMLElement | undefined;
    let thinkingAnchorId: string | undefined;
    let contentElement: HTMLElement | undefined;
    let contentAnchorId: string | undefined;

    const nextSibling = htmlElement.nextElementSibling;
    if (nextSibling) {
      const dsMessage = nextSibling.querySelector?.('.ds-message') as HTMLElement | null;
      if (dsMessage) {
        answerElement = dsMessage;
        answerAnchorId = generateUniqueId(`answer-${umId}-${index}`, seenIds);

        const children = Array.from(dsMessage.children);

        if (children.length > 0) {
          const firstChild = children[0] as HTMLElement;

          if (!firstChild.classList.contains('ds-markdown')) {
            thinkingElement = firstChild;
            thinkingAnchorId = generateUniqueId(`thinking-${umId}-${index}`, seenIds);

            if (children.length > 1) {
              for (let i = 1; i < children.length; i += 1) {
                const child = children[i] as HTMLElement;
                if (child.classList.contains('ds-markdown')) {
                  contentElement = child;
                  contentAnchorId = generateUniqueId(`content-${umId}-${index}`, seenIds);
                  break;
                }
              }
            }
          } else {
            contentElement = firstChild;
            contentAnchorId = generateUniqueId(`content-${umId}-${index}`, seenIds);
          }
        }
      }
    }

    questions.push({
      id: umId,
      text: text.substring(0, 200),
      element: htmlElement,
      anchorId,
      answerElement,
      answerAnchorId,
      thinkingElement,
      thinkingAnchorId,
      contentElement,
      contentAnchorId,
      chatTitle,
    });
  });

  return questions;
}

function detectGeminiQuestions(chatTitle: string): Question[] {
  const questionElements = Array.from(document.querySelectorAll('user-query'));
  
  if (questionElements.length === 0) {
    return [];
  }

  const questions: Question[] = [];
  const seenIds = new Set<string>();

  questionElements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    const questionText =
      extractVisibleText(htmlElement) ||
      htmlElement.shadowRoot?.textContent?.trim() ||
      '';

    if (!questionText) {
      return;
    }

    const turnElement = htmlElement.closest('conversation-turn') as HTMLElement | null;
    const baseId =
      htmlElement.getAttribute('data-message-id') ||
      turnElement?.getAttribute('data-message-id') ||
      htmlElement.id ||
      `gemini-${index}`;

    const anchorId = generateUniqueId(`gemini-question-${baseId}`, seenIds);

    const questionAnchorElement = (turnElement as HTMLElement | null) || htmlElement;

    let answerElement: HTMLElement | undefined;
    let answerAnchorId: string | undefined;
    let contentElement: HTMLElement | undefined;
    let contentAnchorId: string | undefined;

    if (turnElement) {
      const modelResponse = turnElement.querySelector('model-response') as HTMLElement | null;
      if (modelResponse) {
        const answerAnchorElement = modelResponse as HTMLElement;
        answerElement = answerAnchorElement;
        answerAnchorId = generateUniqueId(`gemini-answer-${baseId}`, seenIds);

        contentElement = answerAnchorElement;
        contentAnchorId = generateUniqueId(`gemini-content-${baseId}`, seenIds);
      }
    }

    questions.push({
      id: baseId,
      text: questionText.substring(0, 200),
      element: questionAnchorElement,
      anchorId,
      answerElement,
      answerAnchorId,
      contentElement,
      contentAnchorId,
      chatTitle,
    });
  });

  return questions;
}

function detectChatGPTQuestions(chatTitle: string): Question[] {
  const articles = Array.from(document.querySelectorAll('article'));
  if (articles.length === 0) {
    return [];
  }

  const questions: Question[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < articles.length; i += 1) {
    const article = articles[i] as HTMLElement;
    const userHeading = article.querySelector('h5.sr-only');
    const headingText = userHeading?.textContent?.trim().toLowerCase() ?? '';

    if (!headingText.includes('you said')) {
      continue;
    }

    const userMessage = article.querySelector('[data-message-author-role="user"]') as HTMLElement | null;
    const questionTextRaw =
      extractVisibleText(userMessage) ||
      extractVisibleText(article);

    const questionText = questionTextRaw.replace(/^you said:\s*/i, '').trim();
    if (!questionText) {
      continue;
    }

    const baseId =
      article.getAttribute('data-testid') ||
      article.getAttribute('id') ||
      `chatgpt-${i}`;

    const anchorId = generateUniqueId(`chatgpt-question-${baseId}`, seenIds);

    let answerArticle: HTMLElement | undefined;
    for (let j = i + 1; j < articles.length; j += 1) {
      const candidate = articles[j] as HTMLElement;
      const assistantHeading = candidate.querySelector('h6.sr-only');
      const assistantHeadingText = assistantHeading?.textContent?.trim().toLowerCase() ?? '';
      if (assistantHeadingText.includes('chatgpt said') || assistantHeadingText.includes('assistant said')) {
        answerArticle = candidate;
        break;
      }
      const assistantRole = candidate.querySelector('[data-message-author-role="assistant"]');
      if (assistantRole) {
        answerArticle = candidate;
        break;
      }
    }

    let answerElement: HTMLElement | undefined;
    let contentElement: HTMLElement | undefined;
    let answerAnchorId: string | undefined;
    let contentAnchorId: string | undefined;

    if (answerArticle) {
      answerElement = answerArticle;
      answerAnchorId = generateUniqueId(`chatgpt-answer-${baseId}`, seenIds);
      const assistantMessage = answerArticle.querySelector('[data-message-author-role="assistant"]') as HTMLElement | null;
      contentElement = assistantMessage || answerArticle;
      contentAnchorId = generateUniqueId(`chatgpt-content-${baseId}`, seenIds);
    }

    questions.push({
      id: baseId,
      text: questionText.substring(0, 200),
      element: userMessage || article,
      anchorId,
      answerElement,
      answerAnchorId,
      contentElement,
      contentAnchorId,
      chatTitle,
    });
  }

  return questions;
}

/**
 * 检测页面中所有可识别的问题元素
 */
export function detectQuestions(): Question[] {
  const chatTitle = getChatTitle();

  const hostname = window.location.hostname;

  if (hostname.includes('gemini.google.com')) {
    const gemini = detectGeminiQuestions(chatTitle);
    if (gemini.length > 0) {
      return gemini;
    }
  }

  const deepSeek = detectDeepSeekQuestions(chatTitle);
  if (deepSeek.length > 0) {
    return deepSeek;
  }

  const chatGPT = detectChatGPTQuestions(chatTitle);
  if (chatGPT.length > 0) {
    return chatGPT;
  }

  return [];
}

/**
 * 为问题元素创建锚点
 * 优先直接在问题元素上设置ID，如果元素已有ID则创建内部锚点
 */
export function createAnchor(element: HTMLElement, anchorId: string): void {
  // 检查元素是否已经设置过这个锚点ID
  if (element.dataset.cmnQuestionAnchorId === anchorId) {
    return;
  }
  
  // 检查全局是否已有这个ID的元素（避免冲突）
  const existingElement = document.getElementById(anchorId);
  if (existingElement && existingElement !== element) {
    // ID已被其他元素使用，创建内部锚点
    let anchor = element.querySelector(`a[name="${anchorId}"], #${anchorId}`) as HTMLAnchorElement;
    if (!anchor) {
      anchor = document.createElement('a');
      anchor.name = anchorId;
      anchor.id = anchorId;
      anchor.style.cssText = 'position: absolute; top: -80px; visibility: hidden; pointer-events: none; display: block; width: 1px; height: 1px;';
      anchor.setAttribute('data-cmn-question-anchor', 'true');
      anchor.classList.add('cmn-anchor');
      
      // 插入到元素内部的开头
      if (element.firstChild) {
        element.insertBefore(anchor, element.firstChild);
      } else {
        element.appendChild(anchor);
      }
    }
  } else {
    // 元素没有ID或ID就是我们要设置的，直接设置
    if (!element.id || element.id === anchorId) {
      element.id = anchorId;
      element.setAttribute('name', anchorId);
    } else {
      // 元素有其他ID，创建内部锚点
      let anchor = element.querySelector(`a[name="${anchorId}"], #${anchorId}`) as HTMLAnchorElement;
      if (!anchor) {
        anchor = document.createElement('a');
        anchor.name = anchorId;
        anchor.id = anchorId;
        anchor.style.cssText = 'position: absolute; top: -80px; visibility: hidden; pointer-events: none; display: block; width: 1px; height: 1px;';
        anchor.setAttribute('data-cmn-question-anchor', 'true');
        anchor.classList.add('cmn-anchor');
        
        if (element.firstChild) {
          element.insertBefore(anchor, element.firstChild);
        } else {
          element.appendChild(anchor);
        }
      }
    }
  }
  
  // 标记这个元素已经处理过
  element.dataset.cmnQuestionAnchorId = anchorId;
  element.classList.add('cmn-question-element');
}

/**
 * 滚动到指定的答案位置（通用函数，用于思考节点和正文节点）
 */
export function scrollToAnswer(anchorId: string): void {
  // 优先查找直接有ID的元素，如果没有则查找锚点
  let targetElement: HTMLElement | null = document.getElementById(anchorId);
  
  if (!targetElement) {
    // 查找锚点元素
    const anchor = document.querySelector(`a[name="${anchorId}"], #${anchorId}`) as HTMLElement;
    if (anchor) {
      // 如果找到的是锚点，找到它所在的元素
      if (anchor.hasAttribute('data-cmn-question-anchor') || anchor.classList.contains('cmn-anchor')) {
        // 锚点在元素内部，使用父元素
        targetElement = anchor.parentElement;
      } else {
        targetElement = anchor;
      }
    }
  }
  
  if (targetElement) {
    // 滚动到目标元素
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // 高亮显示目标元素
    const originalBg = targetElement.style.backgroundColor;
    const originalOutline = targetElement.style.outline;
    targetElement.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
    targetElement.style.outline = '2px solid rgba(34, 197, 94, 0.3)';
    targetElement.style.transition = 'background-color 0.3s, outline 0.3s';
    
    setTimeout(() => {
      targetElement!.style.backgroundColor = originalBg;
      targetElement!.style.outline = originalOutline;
      setTimeout(() => {
        targetElement!.style.transition = '';
      }, 300);
    }, 2000);
  }
}

/**
 * 滚动到指定的问题位置
 */
export function scrollToQuestion(anchorId: string): void {
  // 优先查找直接有ID的元素，如果没有则查找锚点
  let targetElement: HTMLElement | null = document.getElementById(anchorId);
  
  if (!targetElement) {
    // 查找锚点元素
    const anchor = document.querySelector(`a[name="${anchorId}"], #${anchorId}`) as HTMLElement;
    if (anchor) {
      // 如果找到的是锚点，找到它所在的问题元素
      if (anchor.hasAttribute('data-cmn-question-anchor') || anchor.classList.contains('cmn-anchor')) {
        // 锚点在问题元素内部，使用父元素
        targetElement = anchor.parentElement;
      } else {
        targetElement = anchor;
      }
    }
  }
  
  // 如果找到了目标元素，尝试找到实际的问题元素（带有data-um-id的元素）
  if (targetElement) {
    // 如果目标元素本身就是问题元素，直接使用
    let questionElement = targetElement;
    if (!questionElement.hasAttribute('data-um-id')) {
      // 如果不是，向上查找父元素中带有data-um-id的
      let parent = questionElement.parentElement;
      while (parent && !parent.hasAttribute('data-um-id')) {
        parent = parent.parentElement;
      }
      if (parent) {
        questionElement = parent;
      }
    }
    
    // 滚动到问题元素
    questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // 高亮显示问题元素
    const originalBg = questionElement.style.backgroundColor;
    const originalOutline = questionElement.style.outline;
    questionElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    questionElement.style.outline = '2px solid rgba(59, 130, 246, 0.3)';
    questionElement.style.transition = 'background-color 0.3s, outline 0.3s';
    
    setTimeout(() => {
      questionElement.style.backgroundColor = originalBg;
      questionElement.style.outline = originalOutline;
      setTimeout(() => {
        questionElement.style.transition = '';
      }, 300);
    }, 2000);
  }
}

