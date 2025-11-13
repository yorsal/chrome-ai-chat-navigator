/**
 * PDF导出工具函数
 * 使用外部API将HTML内容转换为PDF
 */

export interface ContentItem {
  question?: string
  content: string
}

export interface ExportData {
  chatTitle: string
  contentHtml: ContentItem[]
}

/**
 * 生成完整的HTML文档
 */
function generateHTMLDocument(data: ExportData): string {
  const { chatTitle, contentHtml } = data

  const htmlContent = contentHtml
    .map(
      (item, index) => `
      <article class="entry" data-index="${index + 1}">
        ${
          item.question
            ? `
        <header class="entry__header">
          <span class="entry__badge">Q${index + 1}</span>
          <h2 class="entry__title">${escapeHtml(item.question)}</h2>
        </header>
        `
            : ''
        }
        <div class="entry__content">
          ${item.content}
        </div>
      </article>
    `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(chatTitle || '聊天记录')}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      color: #1f2933;
      margin: 0;
      padding: 48px 24px 64px;
      background: linear-gradient(135deg, #f4f5f7 0%, #eef2ff 50%, #fdf2f8 100%);
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 24px 60px rgba(79, 70, 229, 0.12);
      overflow: hidden;
      border: 1px solid rgba(99, 102, 241, 0.08);
    }
    .hero {
      padding: 48px 56px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      color: #ffffff;
    }
    .hero__title {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.4px;
    }
    .hero__subtitle {
      margin-top: 12px;
      font-size: 15px;
      opacity: 0.86;
    }
    .content {
      padding: 40px 56px 56px;
    }
    blockquote {
      border-left: 3px solid rgba(79, 70, 229, 0.45);
      padding-left: 18px;
      margin: 20px 0;
      color: #4b5563;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 24px 0;
    }
    table th, table td {
      border: 1px solid #e5e7eb;
      padding: 10px 14px;
      text-align: left;
    }
    table th {
      background: #f8fafc;
      font-weight: 600;
      color: #4338ca;
    }
    code {
      background: rgba(59, 130, 246, 0.08);
      padding: 3px 7px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.92em;
    }
    pre {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      overflow-x: auto;
      margin: 22px 0;
      font-size: 0.94em;
      box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.1);
    }
    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    .entry {
      position: relative;
      margin-bottom: 36px;
      padding: 32px 30px 36px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.03) 100%);
      border: 1px solid rgba(99, 102, 241, 0.12);
      box-shadow: 0 12px 30px rgba(123, 97, 255, 0.08);
    }
    .entry__header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }
    .entry__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #4338ca;
      background: rgba(99, 102, 241, 0.12);
      padding: 6px 12px;
      border-radius: 999px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .entry__title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      letter-spacing: 0.2px;
    }
    .entry__content {
      font-size: 15px;
      color: #1f2937;
    }
    bard-avatar, 
    .response-tts-container {
      display: none !important;
    }
    @media print {
      body {
        padding: 0;
        background: #ffffff;
        color: #111827;
      }
      .container {
        box-shadow: none;
        border: none;
        border-radius: 0;
      }
      .hero {
        background: #ffffff;
        color: #111827;
        border-bottom: 1px solid rgba(99, 102, 241, 0.18);
      }
      .entry {
        page-break-inside: avoid;
        box-shadow: none;
        background: #ffffff;
        border: 1px solid rgba(99, 102, 241, 0.18);
      }
      .entry__badge {
        background: rgba(99, 102, 241, 0.16);
      }
      pre {
        color: #1f2937;
        background: #f5f5f5;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <section class="hero">
      <h1 class="hero__title">${escapeHtml(chatTitle)}</h1>
    </section>
    <main class="content">
      ${htmlContent}
    </main>
  </div>
</body>
</html>`
}

/**
 * HTML转义函数
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 使用免费API将HTML转换为PDF
 * 使用 html2pdf.tech 的免费API（无需API密钥）
 */
async function convertHtmlToPdf(html: string): Promise<Blob> {
  try {
    // 方法1: 尝试使用 html2pdf.tech 的免费API
    const response = await fetch('https://api.html2pdf.tech/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: html,
        options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm',
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }

    return await response.blob()
  } catch (error) {
    console.error('PDF转换失败:', error)
    // 如果API失败，抛出错误以便使用备用方案
    throw error
  }
}

/**
 * 使用浏览器内置的打印功能作为备用方案
 */
function downloadPdfUsingPrint(html: string): void {
  // 创建一个新窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('无法打开新窗口，请允许弹出窗口')
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // 等待内容加载后打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * 导出PDF主函数
 * 优先使用API转换，失败时使用浏览器打印功能
 */
export async function exportToPdf(data: ExportData, useApi: boolean = true): Promise<void> {
  try {
    // 生成HTML文档
    const html = generateHTMLDocument(data)

    // 生成文件名
    const chatTitle = data.chatTitle || '聊天记录'
    const sanitizedTitle = chatTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 50)
    const filename = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.pdf`

    if (useApi) {
      try {
        // 尝试使用API转换
        const pdfBlob = await convertHtmlToPdf(html)

        // 下载PDF
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        return
      } catch (apiError) {
        console.warn('API转换失败，使用打印功能:', apiError)
        // 如果API失败，使用打印功能作为备用方案
      }
    }

    // 使用打印功能作为主要或备用方案
    downloadPdfUsingPrint(html)
  } catch (error) {
    console.error('导出PDF失败:', error)
    throw error
  }
}

/**
 * 使用更可靠的免费API：htmlpdfapi.com（需要API密钥）
 * 或者使用其他免费服务如 html2pdf.tech
 *
 * 这里提供一个使用 htmlpdfapi.com 的版本（需要用户提供API密钥）
 */
export async function convertHtmlToPdfWithApiKey(html: string, apiKey?: string): Promise<Blob> {
  if (!apiKey) {
    // 如果没有API密钥，使用备用方案
    throw new Error('需要API密钥')
  }

  const response = await fetch('https://api.htmlpdfapi.com/v1/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      html: html,
      options: {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`API错误: ${response.status}`)
  }

  return await response.blob()
}

/**
 * 使用浏览器打印功能导出PDF（最可靠的方案）
 * 这是Chrome扩展中最可靠的方案，不依赖外部API
 */
export function exportToPdfUsingPrint(data: ExportData): void {
  const html = generateHTMLDocument(data)

  // 创建一个新窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('无法打开新窗口，请允许弹出窗口')
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // 等待内容加载后打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
