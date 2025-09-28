<p align="center">
  <img width="200px" src="https://raw.githubusercontent.com/react-chatbotify-plugins/llm-connector/main/src/assets/logo.webp" />
  <h1 align="center">LLM Connector</h1>
</p>

<p align="center">
  <a href="https://github.com/react-chatbotify-plugins/llm-connector/actions/workflows/ci-cd-pipeline.yml"> <img src="https://github.com/react-chatbotify-plugins/llm-connector/actions/workflows/ci-cd-pipeline.yml/badge.svg" /> </a>
  <a href="https://www.npmjs.com/package/@rcb-plugins/llm-connector"> <img src="https://img.shields.io/npm/v/@rcb-plugins/llm-connector?logo=semver&label=version&color=%2331c854" /> </a>
  <a href="https://www.npmjs.com/package/@rcb-plugins/llm-connector"> <img src="https://img.shields.io/badge/react-16--19-orange?logo=react&label=react" /> </a>
</p>

## 目录

* [简介](#简介)
* [快速开始](#快速开始)
* [功能特性](#功能特性)
* [API 文档](#api-文档)
* [团队](#团队)
* [贡献指南](#贡献指南)
* [其它](#其它)

### 简介

<p align="center">
  <img height="400px" src="https://github.com/user-attachments/assets/72813239-7bb7-4966-a1b9-0ae1d0f7c6d0" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img height="400px" src="https://github.com/user-attachments/assets/c78f88f9-bbb7-4bad-91a8-13633ce35d4a" />
</p>

**LLM Connector** 同时提供两种形态：一个用于纯前端应用的 React 即插即用组件，以及一个面向 React ChatBotify 的聊天插件。项目内置四种常用适配器 —— [**OpenAI**](docs/providers/OpenAI.md)、[**Anthropic**](docs/providers/Anthropic.md)、[**Gemini**](docs/providers/Gemini.md) 与 [**WebLlm（浏览器推理）**](docs/providers/WebLlm.md)。开发者也可以根据需要扩展自定义 Provider，而公共核心负责流式输出、消息历史管理、音频播报和统一的错误处理。

如果需要帮助，可以加入插件社区的 [**Discord**](https://discord.gg/J6pA4v3AMW)。

### 快速开始

安装 npm 包：

```bash
npm install @rcb-plugins/llm-connector
```

#### A. React 组件（纯前端方案）

当你希望用户“自带 API Key”，并在浏览器中直接调用模型时，使用 `LlmConnector` 组件。

```tsx
import { useState } from 'react';
import { LlmConnector, type LlmClient } from '@rcb-plugins/llm-connector';

const MyTool = () => {
  const [client, setClient] = useState<LlmClient | null>(null);

  return (
    <>
      <LlmConnector
        onReady={(readyClient, context) => {
          console.log('已连接的服务商', context.providerId, context.rawConfig.model);
          setClient(readyClient);
        }}
      />

      <button
        onClick={async () => {
          if (!client) return;
          await client.chat({ messages: [{ role: 'user', content: '你好！' }] });
        }}
      >
        发送测试请求
      </button>
    </>
  );
};
```

- 组件会将配置安全地持久化到 `localStorage`，不会上传 API Key。
- `onReady` 同时返回统一的 `LlmClient` 与原始配置，便于你根据业务做二次存储或埋点。

#### B. React ChatBotify 插件

如果你正在使用 [React ChatBotify](https://react-chatbotify.com/) 搭建对话流程，可以继续通过插件方式接入。

1. 引入并注册插件：
   ```tsx
   import ChatBot from 'react-chatbotify';
   import LlmConnector from '@rcb-plugins/llm-connector';

   const MyBot = () => (
     <ChatBot plugins={[LlmConnector()]} />
   );
   ```

2. 在对话流程中指定 `llmConnector` 块：
   ```tsx
   import ChatBot from 'react-chatbotify';
   import LlmConnector, { LlmConnectorBlock, OpenaiProvider } from '@rcb-plugins/llm-connector';

   const flow = {
     start: {
       message: '欢迎来到太空知识问答！',
       transition: 0,
       path: 'talk_to_space',
     },
     talk_to_space: {
       llmConnector: {
         provider: new OpenaiProvider({
           mode: 'direct',
           model: 'gpt-4.1-mini',
           apiKey: process.env.OPENAI_API_KEY!,
         }),
       },
     } as LlmConnectorBlock,
   };

   const MyBot = () => <ChatBot plugins={[LlmConnector()]} flow={flow} />;
   ```

完整的 Provider 配置指南请参见 [`docs/providers/`](docs/providers/)。

### 功能特性

- 即插即用的 React 组件：用户输入密钥即可在浏览器直接调用模型
- React ChatBotify 插件：支持流式输出、停止条件、语音播放等行为
- 内置 Provider：OpenAI、Anthropic、Gemini、WebLLM（纯前端推理）
- 提供统一的 `LlmClient`，方便构建自定义对话 UI
- 支持字符/分段/整篇三种输出模式，自定义速率与历史窗口
- 严格的 Provider 类型定义，便于扩展私有/第三方后端

### API 文档

- [OpenAI Provider 配置说明](docs/providers/OpenAI.md)
- [Anthropic Provider 配置说明](docs/providers/Anthropic.md)
- [Gemini Provider 配置说明](docs/providers/Gemini.md)
- [WebLLM Provider 配置说明](docs/providers/WebLlm.md)
- [Wllama Provider（已归档）](docs/providers/Wllama.md)

### 团队

* [Tan Jin](https://github.com/tjtanjin)

### 贡献指南

欢迎通过 Pull Request 提交改进或 Bug 修复，也可以直接在 Issues 中反馈需求和问题。提交 PR 时请简要说明变更的背景与目的，方便审核。

### 其它

遇到任何问题，欢迎通过 [Discord 社区](https://discord.gg/J6pA4v3AMW) 与我们交流。
