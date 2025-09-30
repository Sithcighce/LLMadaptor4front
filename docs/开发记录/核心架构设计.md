# 核心逻辑说明：LlmConnector 与统一客户端

本文档介绍项目中两个关键部分的职责与交互流程：

1. `LlmConnector` React 组件（收集配置、管理状态）；
2. `createLlmClient` 统一客户端（统一调用接口、处理流式输出）。

## 组件与调用链概览

```
┌────────────────────────────┐        ┌────────────────────────────┐
│ LlmConnector (React 组件)  │        │ Provider 实例 (OpenAI/...) │
│ - 收集用户输入 (API key 等)│        │ - 负责真正的 HTTP 调用      │
│ - 按服务商生成 Provider    │        │ - 通过 AsyncGenerator 输出   │
│ - onReady 返回 client+配置 │──┐     │   结果                      │
└────────────────────────────┘  │     └────────────────────────────┘
                                 ▼
                       ┌────────────────────────────┐
                       │ createLlmClient 返回的 client│
                       │ - chat({ messages, ... })   │
                       │ - 统一封装流式/整段输出      │
                       └────────────────────────────┘
```

## 1. LlmConnector 组件

文件：`src/components/LlmConnector/LlmConnector.tsx`

职责：
- 提供服务商下拉、API Key/baseUrl/模型等表单字段；
- 校验用户输入，支持 JSON 字段验证；
- 通过 `localStorage` 持久化用户配置；
- 提供“拉取模型列表”按钮，帮助用户快速选择模型；
- 根据当前配置实例化相应 Provider；
- 完成配置后，通过 `onReady(client, context)` 回调统一客户端以及原始配置。

关键流程：
1. 用户选择服务商、填写必要字段（API Key、Base URL、模型等）；
2. 点击“Connect”时，组件将配置转换为对应的 Provider 实例（如 `new OpenaiProvider({...})`）；
3. 调用 `createLlmClient(provider)` 获得统一客户端；
4. 将客户端与原始配置信息一起回调给调用方。

## 2. createLlmClient：统一客户端

文件：`src/client/createLlmClient.ts`

职责：
- 接收一个符合 `Provider` 接口的实例；
- 暴露 `client.chat({ messages, stream, onChunk, signal })` 方法；
- 统一管理流式与整段输出模式。

调用流程：
1. `chat()` 会获取 Provider 的 `sendMessages(messages)`，这是一个 `AsyncGenerator<string>`；
2. 根据 `stream` 标志和可选的 `onChunk` 回调，逐段消费生成器；
3. 如果 `stream === true`，返回 `{ type: 'stream', stream: AsyncGenerator }`，调用方可自行遍历；
4. 如果 `stream` 未启用，则累积所有片段后返回 `{ type: 'text', text: string }`；
5. 支持可选的 `AbortSignal`，调用方可中途取消。

## 3. Provider 接口与实现

接口定义：`src/types/Provider.ts`

```ts
export type Provider = {
  sendMessages(messages: ChatMessage[]): AsyncGenerator<string>;
};
```

内置实现：`src/providers/OpenaiProvider.ts`、`GeminiProvider.ts`、`AnthropicProvider.ts`、`WebLlmProvider.ts`

共同职责：
- 根据构造函数传入的配置准备好请求地址、头部、请求体；
- 通过 `fetch`（或 WebLLM 引擎）发起请求；
- 将响应解析为文本片段，以异步生成器的形式逐步产出。

## 4. ChatMessage 与流式工具

- 通用消息结构 `ChatMessage`：`src/types/ChatMessage.ts`
- 流控工具：`src/utils/promptHandler.tsx`、`src/utils/streamController.ts`

即便不使用自带的 UI，也可以直接复用这些工具来管理消息和流式输出。

## 5. 常见调用范式

### 5.1 仅使用 LlmConnector

```tsx
<LlmConnector onReady={(client, context) => {
  // client.chat({ ... })
  // context.providerId 等信息可用于显示或持久化
}} />
```

### 5.2 手动构造 Provider + Client

```ts
import { createLlmClient, OpenaiProvider } from '@rcb-plugins/llm-connector';

const provider = new OpenaiProvider({
  mode: 'proxy',
  baseUrl: 'https://your-proxy.example.com',
  model: 'gpt-4.1-mini',
  headers: { 'X-Token': 'xxx' },
});

const client = createLlmClient(provider);
const result = await client.chat({ messages: [{ role: 'user', content: 'Hello!' }] });
```

目前大部分“后端”逻辑就是 Provider + `createLlmClient` 的组合。`LlmConnector` 负责产生配置并提供 UI，而 `client.chat()` 则统一了调用入口，方便你在自己的前端应用里自由发挥。
