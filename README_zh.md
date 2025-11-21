<div align="center">
  <img src="icons/icon128.png" alt="Chat Message Navigator Logo" width="128" height="128">
  
  <h1>Chat Message Navigator</h1>
  
  <p>
    <a href="README.md">English</a> | 
    <a href="README_zh.md">中文</a>
  </p>
</div>

一个用于 DeepSeek、ChatGPT 与 Gemini 聊天页面的 Chrome 扩展，帮助用户快速定位和导航聊天中的多个问题。

## 功能特性

- 🔍 自动检测聊天中的问题（支持 DeepSeek `data-um-id` 结构、ChatGPT `<article>` 结构与 Gemini `<user-query>/<model-response>` 结构）
- 📋 在弹窗中列出所有问题
- 🎯 点击问题快速跳转到对应位置
- ⌨️ 键盘快捷键：按数字键 1-9 快速跳转到对应问题
- 🔄 实时更新问题列表
- 💫 平滑滚动和高亮效果

## 技术栈

- Vite + React + TypeScript
- TailwindCSS
- @crxjs/vite-plugin

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

运行后，Vite 会启动开发服务器并监听文件变化，自动重新编译。

### 调试步骤

1. **启动开发服务器**
   ```bash
   npm run dev
   ```
   开发模式会持续监听文件变化，修改代码后会自动重新编译。

2. **在 Chrome 中加载扩展**
   - 打开 Chrome 浏览器，访问 `chrome://extensions/`
   - 启用右上角的"开发者模式"开关
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录（不是根目录）

3. **调试不同部分**

   **调试 Popup（弹窗）** - 三种方法：
   
   **方法一：右键检查（推荐）**
   - 点击浏览器工具栏中的扩展图标，打开 popup 窗口
   - 在 popup 窗口内右键点击，选择"检查"或"检查元素"
   - 会打开一个独立的开发者工具窗口，专门用于调试 popup
   
   **方法二：通过扩展管理页面**
   - 打开 `chrome://extensions/`
   - 找到你的扩展，在"检查视图"部分
   - 点击"popup.html"或"检查 popup"链接
   - 注意：需要先打开一次 popup，这个链接才会出现
   
   **方法三：保持 popup 打开（调试技巧）**
   - 打开 popup 后，按 `F12` 打开开发者工具
   - 在开发者工具的 Console 中输入：`chrome.action.setPopup({popup: ''})`
   - 这样 popup 会变成新标签页打开，方便调试
   - 调试完成后，刷新扩展恢复 popup 模式
   
   **调试技巧：**
   - 在 Console 中可以直接访问 React 组件（如果使用 React DevTools）
   - 可以在 Sources 标签页中设置断点
   - 修改代码后，刷新 popup 窗口即可看到更新（关闭后重新打开）
   - 使用 `console.log()` 输出调试信息

   **调试 Content Script（内容脚本）**
   - 打开 DeepSeek 聊天页面（https://chat.deepseek.com）、ChatGPT 页面（https://chat.openai.com / https://chatgpt.com）或 Gemini 页面（https://gemini.google.com）
   - 按 `F12` 打开开发者工具
   - 在 Console 标签页中可以看到 content script 的日志
   - 在 Sources 标签页中，可以在 `chrome-extension://[扩展ID]/src/content/` 下找到源码

   **调试 Background Script（后台脚本）**
   - 在 `chrome://extensions/` 页面，找到你的扩展
   - 点击"检查视图"下的"service worker"链接
   - 会打开一个独立的开发者工具窗口用于调试 background script

4. **热重载（HMR）**
   - 修改代码后，Vite 会自动重新编译
   - 刷新扩展：在 `chrome://extensions/` 页面，点击扩展卡片上的刷新图标
   - 或者：修改代码后，popup 和 content script 通常会自动更新（需要刷新页面）

5. **查看日志**
   - Popup 日志：在 popup 的开发者工具 Console 中查看
   - Content Script 日志：在网页的开发者工具 Console 中查看
   - Background Script 日志：在 service worker 的开发者工具 Console 中查看

### 构建

```bash
npm run build
```

构建产物在 `dist` 目录。

## 安装

1. 构建项目：`npm run build`
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 使用

1. 访问 DeepSeek 聊天页面（https://chat.deepseek.com）、ChatGPT 页面（https://chat.openai.com / https://chatgpt.com）或 Gemini 页面（https://gemini.google.com）
2. 点击浏览器工具栏中的扩展图标
3. 在弹窗中查看所有问题列表
4. 点击任意问题即可快速跳转到对应位置

### 键盘快捷键

- 在聊天页面上，直接按数字键 **1-9** 即可快速跳转到对应的问题
  - 按 `1` 跳转到第 1 个问题
  - 按 `2` 跳转到第 2 个问题
  - 以此类推...
- 快捷键仅在非输入框状态下生效，避免干扰正常输入

### 截图

<div align="center">
  <img src="shortcut/shortcut1.png" alt="Chat Message Navigator 截图" style="max-width: 100%; height: auto;">
</div>

## 注意事项

- 需要访问 DeepSeek、ChatGPT 或 Gemini 聊天页面才能使用
- 问题检测基于 DeepSeek 的 `data-um-id` 属性、ChatGPT 的 `<article>` 结构或 Gemini 的 `<user-query>/<model-response>` 结构
- 扩展会自动监听页面变化并更新问题列表

