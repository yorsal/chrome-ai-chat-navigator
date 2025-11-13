export type Language = 'zh' | 'en';

export interface Translations {
  title: string;
  questionCount: string;
  loading: string;
  refreshing: string;
  refresh: string;
  retry: string;
  noQuestions: string;
  noQuestionsHint: string;
  errorGetTab: string;
  errorUnsupportedSite: string;
  errorConnect: string;
  errorLoad: string;
  viewAnswer: string;
  viewQuestion: string;
  viewThinking: string;
  viewContent: string;
  downloadContent: string;
  downloadContentError: string;
  exportPdf: string;
  exportingPdf: string;
  exportPdfSuccess: string;
  exportPdfError: string;
}

export const translations: Record<Language, Translations> = {
  zh: {
    title: 'Chat Message Navigator',
    questionCount: '共 {count} 个问题',
    loading: '加载中...',
    refreshing: '刷新中...',
    refresh: '刷新',
    retry: '重试',
    noQuestions: '暂无问题',
    noQuestionsHint: '在聊天中提问后，问题会显示在这里',
    errorGetTab: '无法获取当前标签页',
    errorUnsupportedSite: '请在 DeepSeek 或 ChatGPT 聊天页面使用此扩展',
    errorConnect: '无法连接到页面，请刷新页面后重试',
    errorLoad: '加载问题列表时出错',
    viewAnswer: '查看答案',
    viewQuestion: '查看问题',
    viewThinking: '查看思考',
    viewContent: '查看正文',
    downloadContent: '下载正文',
    downloadContentError: '下载正文失败',
    exportPdf: '导出PDF',
    exportingPdf: '正在导出PDF...',
    exportPdfSuccess: 'PDF导出成功',
    exportPdfError: 'PDF导出失败',
  },
  en: {
    title: 'Chat Message Navigator',
    questionCount: '{count} questions',
    loading: 'Loading...',
    refreshing: 'Refreshing...',
    refresh: 'Refresh',
    retry: 'Retry',
    noQuestions: 'No questions',
    noQuestionsHint: 'Questions will appear here after you ask in the chat',
    errorGetTab: 'Unable to get current tab',
    errorUnsupportedSite: 'Please use this extension on ChatGPT, DeepSeek or Gemini chat page',
    errorConnect: 'Unable to connect to page, please refresh the page and try again',
    errorLoad: 'Error loading question list',
    viewAnswer: 'View Answer',
    viewQuestion: 'View Question',
    viewThinking: 'View Thinking',
    viewContent: 'View Content',
    downloadContent: 'Download Content',
    downloadContentError: 'Failed to download content',
    exportPdf: 'Export PDF',
    exportingPdf: 'Exporting PDF...',
    exportPdfSuccess: 'PDF exported successfully',
    exportPdfError: 'Failed to export PDF',
  },
};

export function formatMessage(message: string, params: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

