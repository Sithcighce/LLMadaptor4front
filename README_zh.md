<p align="cen`LLM Connector` 是一个 React 库，旨在解决前端应用中"用户自带 API Key"的问题。它提供了一个强大的逻辑核心和一套美观、独立的 UI 组件，让你的用户可以安全、便捷地连接上百个 LLM 服务商，无需任何后端支持。

## ⚠️ 开发者注意

在使用此库时，请务必阅读 [Hooks 架构设计文档](./src/hooks/README.md) 以避免常见的状态管理陷阱。

**重要**：不要直接使用 `useLlmConnectorLogic`，请使用 `useConnectionManager` 或 `useLlmConnector`。

## 我们解决的问题">
  <img width="200px" src="https://raw.githubusercontent.com/Sithcighce/LLMadaptor4front/main/src/assets/logo.webp" />
  <h1 align="center">LLM Connector</h1>
</p>

<p align="center">
  <a href="https://github.com/Sithcighce/LLMadaptor4front/actions/workflows/ci-cd-pipeline.yml"> <img src="https://github.com/Sithcighce/LLMadaptor4front/actions/workflows/ci-cd-pipeline.yml/badge.svg" /> </a>
  <a href="https://www.npmjs.com/package/llm-connector"> <img src="https://img.shields.io/npm/v/llm-connector?logo=semver&label=version&color=%2331c854" /> </a>
  <a href="https://www.npmjs.com/package/llm-connector"> <img src="https://img.shields.io/badge/react-16--19-orange?logo=react&label=react" /> </a>
</p>

## 简介

`LLM Connector` 是一个 React 库，旨在解决前端应用中“用户自带 API Key”的问题。它提供了一个强大的逻辑核心和一套美观、独立的 UI 组件，让你的用户可以安全、便捷地连接上百个 LLM 服务商，无需任何后端支持。

## 我们解决的问题

在 AI 应用的世界里，开发者面临一个困境。最终用户手里的 API Key 来源五花八门：
- OpenAI、Anthropic 等官方渠道。
- 更便宜或提供特殊模型的第三方代理服务。
- 带有自定义 URL 的自托管模型。

在每个新应用中都让用户重新配置这些 Key 是非常繁琐的。对开发者来说，重复构建用于配置的 UI 也很无趣。而市面上大多数现有方案（如 Vercel AI SDK）都需要一个后端来管理密钥，这不符合“用户自带 Key”的模式。

## 我们的解决方案

`LLM Connector` 通过提供一个 **纯前端** 的解决方案来应对挑战，并提供两种核心使用方式：

1.  **即插即用的组件**: 一套预设好的、独立的 React 组件，用于模型选择、连接设置和 Token 用量展示。
2.  **逻辑核心**: 一套强大的 React Hooks，它处理了所有的状态管理、配置持久化和客户端创建，允许你构建完全自定义的 UI。

`LLM Connector` 的核心采用 [Token.js](https://github.com/token-js/token.js) 作为其引擎，使其能够直接从浏览器连接超过 200 个 LLM 服务商。

## 快速上手

安装依赖：
```bash
npm install llm-connector
```

### 方式一：即插即用

这是最简单的上手方式。用 `LlmConnectorProvider` 包裹你的应用，然后把你需要的 UI 组件放在页面的任何角落。它们会自动协同工作。

```tsx
import React from 'react';
import {
  LlmConnectorProvider,
  ConnectionFormZh,
  ModelSelectZh,
  TokenUsageZh,
  useLlmConnector
} from 'llm-connector';

// 一个用于测试对话功能的组件
const ChatButton = () => {
  const { llmClient } = useLlmConnector();

  if (!llmClient) return null;

  return (
    <button onClick={async () => {
      const result = await llmClient.chat({ messages: [{ role: 'user', content: '你好！' }] });
      alert(result.text);
    }}>
      说你好
    </button>
  );
}

// 你的主应用
function App() {
  return (
    <LlmConnectorProvider>
      <header>
        <h2>我的应用</h2>
        <ModelSelectZh />
      </header>
      <main>
        <p>这里是应用主内容...</p>
        <ChatButton />
      </main>
      <aside>
        <ConnectionFormZh />
        <TokenUsageZh />
      </aside>
    </LlmConnectorProvider>
  );
}
```

### 方式二：自定义 UI

如果你想从零开始构建自己的 UI，你可以使用 `useLlmConnector` 这个 Hook，它提供了你需要的所有状态和操作函数。

```tsx
import React from 'react';
import { LlmConnectorProvider, useLlmConnector } from 'llm-connector';

const MyCustomConnectorUI = () => {
  const { states, handlers, llmClient } = useLlmConnector();

  return (
    <div>
      <p>状态: {states.status}</p>
      <input
        type="password"
        placeholder="输入你的 API Key"
        value={states.apiKey}
        onChange={(e) => handlers.setApiKey(e.target.value)}
        disabled={states.status === 'connected'}
      />
      <button onClick={handlers.handleConnect} disabled={states.status !== 'disconnected'}>
        连接
      </button>
      {llmClient && <p>已连接！</p>}
    </div>
  );
}

function App() {
  return (
    <LlmConnectorProvider>
      <MyCustomConnectorUI />
    </LlmConnectorProvider>
  );
}
```

## API 参考

### Providers

-   **`<LlmConnectorProvider>`**: 根组件，必须用它来包裹你的应用。

### Hooks

-   **`useLlmConnector()`**: 主要的 Hook，用于在 `LlmConnectorProvider` 的子组件中访问状态和操作函数。
-   **`useLlmConnectorLogic()`**: 核心逻辑 Hook。仅在你需要在提供的 Context 之外管理逻辑时使用。

### UI 组件

每个组件都提供英文 (`...En`) 和中文 (`...Zh`) 两个版本。它们都接受 `className` 和 `locale` 属性用于定制。

-   **`<ConnectionFormEn />` / `<ConnectionFormZh />`**: 用于设置服务商、API Key 和 URL 的表单。
-   **`<ModelSelectEn />` / `<ModelSelectZh />`**: 用于选择模型的下拉框。
-   **`<TokenUsageEn />` / `<TokenUsageZh />`**: 用于展示输入和输出 Token 用量的面板。

### 主要客户端

-   **`LlmClient`**: 连接成功后，通过 Hook 返回的标准化客户端对象。它的核心方法是 `chat(request)`。

## 已知问题

### UI 与演示页面的对齐问题
- **问题**：默认 UI 组件与 UIdemo.html 的样式和布局不完全匹配
- **状态**：⚠️ 待解决
- **详情**：当前的 React 组件应该与静态的 UIdemo.html 设计保持一致，以确保视觉效果的统一性
- **影响**：演示页面和实际组件渲染之间存在视觉不一致性

## 贡献

欢迎提交贡献！请直接开启一个 Issue 或提交 Pull Request。

## 许可证

本项目基于 MIT 许可证开源。
