/**
 * 后台服务脚本
 * 处理扩展生命周期事件
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('Chat Message Navigator 已安装');
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((
  message: { type: string; questions?: any[] },
  _sender: chrome.runtime.MessageSender,
  _sendResponse: (response?: any) => void
) => {
  if (message.type === 'QUESTIONS_UPDATED') {
    // 可以在这里处理问题更新逻辑
    console.log('问题列表已更新:', message.questions?.length || 0);
  }
  return true;
});

