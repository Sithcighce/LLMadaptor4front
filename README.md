# LLM Connector<p align="center">

  <img width="200px" src="https://raw.githubusercontent.com/Sithcighce/LLMadaptor4front/main/src/assets/logo.webp" />

<p align="center">  <h1 align="center">LLM Connector</h1>

  <img width="200px" src="https://raw.githubusercontent.com/Sithcighce/LLMadaptor4front/main/src/assets/logo.webp" /></p>

</p>

<p align="center">

一个 React 库，用于在前端应用中解决"自带 API Key"的问题。支持 8 个 AI Provider，提供统一接口。  <a href="https://github.com/Sithcighce/LLMadaptor4front/actions/workflows/ci-cd-pipeline.yml"> <img src="https://github.com/Sithcighce/LLMadaptor4front/actions/workflows/ci-cd-pipeline.yml/badge.svg" /> </a>

  <a href="https://www.npmjs.com/package/llm-connector"> <img src="https://img.shields.io/npm/v/llm-connector?logo=semver&label=version&color=%2331c854" /> </a>

## 🚀 快速开始  <a href="https://www.npmjs.com/package/llm-connector"> <img src="https://img.shields.io/badge/react-16--19-orange?logo=react&label=react" /> </a>

</p>

```bash

npm install llm-connector## 简介

```

## 简介

**🎯 统一的 LLM 连接器库**: 支持三种推理模式 - 前端 BYOK (用户粘贴自己的 API Key)、端侧推理 (Chrome AI/WebLLM 浏览器端本地运行)、后端代理 (企业统一管理/本地模型服务器)。三种模式同等重要,用户根据场景选择。

`LLM Connector` is a React library designed to solve the "bring your own API key" problem in front-end applications. It provides a powerful logic core and a set of beautiful, independent UI components to let your users connect to hundreds of LLM providers securely and easily, with support for frontend BYOK, on-device inference, and backend proxy modes.

### 基础使用

## The Problem

```tsx

import { LlmConnectorProvider, ConnectionFormEn, useLlmConnector } from 'llm-connector';In the world of AI applications, developers face a dilemma. End-users often have their own API keys from various sources:

- Official providers like OpenAI and Anthropic.

function App() {- Third-party proxy services that are cheaper or offer special models.

  return (- Self-hosted models with custom URLs.

    <LlmConnectorProvider>

      <ConnectionFormEn />Forcing users to re-configure these keys in every new app is tedious. Building a UI for this is repetitive for developers. Most existing solutions (like Vercel AI SDK) require a backend to manage keys, which doesn't fit the "user-provided key" model.

      <ChatComponent />

    </LlmConnectorProvider>## Our Solution

  );

}`LLM Connector` solves this by providing a **purely front-end** solution with two primary ways to use it:



const ChatComponent = () => {1.  **The Plug-and-Play Components**: A set of pre-built, independent React components for model selection, connection settings, and token usage display.

  const { llmClient } = useLlmConnector();2.  **The Logic Core**: A powerful set of React Hooks that handle all the state management, configuration persistence, and client creation, allowing you to build a completely custom UI.

  

  const sendMessage = async () => {At its heart, `LLM Connector` uses [Token.js](https://github.com/token-js/token.js) as its engine, enabling it to connect to over 200 LLM providers directly from the browser.

    const result = await llmClient.chat({

      messages: [{ role: 'user', content: 'Hello!' }]## Quick Start

    });

    console.log(result.text);Install the library:

  };```bash

  npm install llm-connector

  return <button onClick={sendMessage}>发送消息</button>;```

};

```### Option 1: The Plug-and-Play Way



## ✨ 支持的 ProviderThis is the easiest way to get started. Wrap your application with `LlmConnectorProvider`, then place the independent UI components anywhere you like. They will work together automatically.



| Provider | 类型 | 需要 API Key |```tsx

|----------|------|--------------|import React from 'react';

| **Chrome AI** 🆕 | 浏览器内置 | ❌ |import {

| **LM Studio** 🆕 | 本地服务器 | ❌ |  LlmConnectorProvider,

| **Silicon Flow** 🆕 | 云服务（中国） | ✅ |  ConnectionFormEn,

| **Backend Proxy** 🆕 | 后端代理 | ✅ (后端) |  ModelSelectEn,

| OpenAI | 云服务 | ✅ |  TokenUsageEn,

| Anthropic | 云服务 | ✅ |  useLlmConnector

| Google Gemini | 云服务 | ✅ |} from 'llm-connector';

| WebLLM | 浏览器 WASM | ❌ |

// A component to test the chat functionality

## 📖 文档const ChatButton = () => {

  const { llmClient } = useLlmConnector();

- **开发者交接**: [`docs/HANDOVER.md`](./docs/HANDOVER.md) ⭐

- **新功能指南**: [`docs/NEW_PROVIDERS_GUIDE.md`](./docs/NEW_PROVIDERS_GUIDE.md)  if (!llmClient) return null;

- **架构设计**: [`docs/AI-Adapter-Architecture.md`](./docs/AI-Adapter-Architecture.md)

- **完整文档**: [`docs/README.md`](./docs/README.md)  return (

- **原版 README**: [`docs/README_ORIGINAL.md`](./docs/README_ORIGINAL.md)    <button onClick={async () => {

      const result = await llmClient.chat({ messages: [{ role: 'user', content: 'Hello!' }] });

## 🛠️ 开发      alert(result.text);

    }}>

### 环境要求      Say Hello

- Node.js 16+    </button>

- React 16-19  );

}

### 启动开发服务器

// Your main application

```bashfunction App() {

# 前端测试页面  return (

npm run dev    <LlmConnectorProvider>

# 访问 http://localhost:5173/      <header>

        <h2>My App</h2>

# 后端代理服务器（可选）        <ModelSelectEn />

cd backend-proxy      </header>

node server.js      <main>

# 运行在 http://localhost:3003/        <p>Main content of my application...</p>

```        <ChatButton />

      </main>

### 项目结构      <aside>

        <ConnectionFormEn />

```        <TokenUsageEn />

src/      </aside>

├── providers/        # 8 个 Provider 实现    </LlmConnectorProvider>

├── hooks/           # React Hooks (useLlmConnector 等)  );

├── components/      # UI 组件}

├── test/           # 测试页面```

└── registry/       # 全局 Client 注册表

### Option 2: The Custom UI Way

backend-proxy/      # 后端代理服务器（Express.js）

docs/              # 所有文档If you want to build your own UI from scratch, you can use the `useLlmConnector` hook, which provides all the states and handlers you need.

最新需求/          # 需求文档

``````tsx

import React from 'react';

## ⚠️ 当前状态import { LlmConnectorProvider, useLlmConnector } from 'llm-connector';



**版本**: v0.5.0-dev  const MyCustomConnectorUI = () => {

**状态**: 功能开发完成，测试中  const { states, handlers, llmClient } = useLlmConnector();



**已知问题**:  return (

- ⚠️ 测试页面显示问题待修复    <div>

- ⚠️ 新 Provider 功能未经人工测试      <p>Status: {states.status}</p>

      <input

详见: [`docs/HANDOVER.md`](./docs/HANDOVER.md)        type="password"

        placeholder="Enter your API Key"

## 🤝 贡献        value={states.apiKey}

        onChange={(e) => handlers.setApiKey(e.target.value)}

欢迎提交 Issue 和 Pull Request！        disabled={states.status === 'connected'}

      />

开发前请阅读:      <button onClick={handlers.handleConnect} disabled={states.status !== 'disconnected'}>

1. [`agentreadme.md`](./agentreadme.md) - Agent 开发指南        Connect

2. [`docs/HANDOVER.md`](./docs/HANDOVER.md) - 项目交接文档      </button>

      {llmClient && <p>Connected!</p>}

## 📄 License    </div>

  );

MIT}



---function App() {

  return (

**核心特性**:    <LlmConnectorProvider>

- ✅ 纯前端解决方案      <MyCustomConnectorUI />

- ✅ 支持 8 个 AI Provider    </LlmConnectorProvider>

- ✅ 统一接口（基于 Token.js）  );

- ✅ 多实例支持}

- ✅ 配置持久化（localStorage）```

- ✅ TypeScript 支持

- ✅ React 16-19 兼容## API Reference



**新增功能** (v0.5.0):### Providers

- 🆕 Chrome AI - 浏览器内置 AI

- 🆕 LM Studio - 本地模型服务器-   **`<LlmConnectorProvider>`**: The root provider component that must wrap your application.

- 🆕 Silicon Flow - 中国 LLM 提供商

- 🆕 Backend Proxy - 后端代理模式### Hooks


-   **`useLlmConnector()`**: The primary hook to access the connector's state and handlers from within the `LlmConnectorProvider`.
-   **`useLlmConnectorLogic()`**: The core logic hook. Use this only if you need to manage the logic outside of the provided context.

### UI Components

Each component comes in an English (`...En`) and Chinese (`...Zh`) version. They accept `className` and `locale` props for customization.

-   **`<ConnectionFormEn />` / `<ConnectionFormZh />`**: A form for setting the provider, API key, and base URL.
-   **`<ModelSelectEn />` / `<ModelSelectZh />`**: A dropdown for selecting the model.
-   **`<TokenUsageEn />` / `<TokenUsageZh />`**: A display for input and output token usage.

### Main Client

-   **`LlmClient`**: The standardized client object returned by the hook after a successful connection. Its main method is `chat(request)`.

## 🌟 Technical Innovation

### Explicit Client Naming System
LLM Connector introduces a breakthrough solution to React Context reliability issues:

```tsx
// Traditional Context mode - relies on "nearest parent"
const { llmClient } = useLlmConnector();

// Explicit naming mode - direct client specification
const { llmClient } = useLlmConnector('chat-client');
```

**Key Benefits:**
- ✅ **Deterministic binding** - No more "which Provider am I connected to?" confusion
- ✅ **Cross-component tree access** - Access named clients from anywhere
- ✅ **Configuration isolation** - Each instance has independent storage
- ✅ **Developer-friendly** - Clear error messages and debugging support

### Multi-Instance Support
Perfect for applications with different cost/performance requirements:

```tsx
// Chat with premium model
<LlmConnectorProvider name="chat" storageKey="chat-config">
  <ChatInterface />
</LlmConnectorProvider>

// Summary with economy model  
<LlmConnectorProvider name="summary" storageKey="summary-config">
  <SummaryInterface />
</LlmConnectorProvider>

// Access both from anywhere
function CrossComponentAccess() {
  const { llmClient: chatClient } = useLlmConnector('chat');
  const { llmClient: summaryClient } = useLlmConnector('summary');
}
```

## Known Issues

### UI Alignment with Demo
- **Issue**: Default UI components do not perfectly match the UIdemo.html styling and layout
- **Status**: ⚠️ Pending resolution
- **Details**: The current React components should be aligned with the static UIdemo.html design for consistent visual appearance
- **Impact**: Visual inconsistencies between demo and actual component rendering

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.