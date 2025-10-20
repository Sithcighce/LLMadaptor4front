# OpenAIProvider 配置指南

`OpenaiProvider` 支持直接连接 OpenAI 官方接口，也可以连接任何兼容 OpenAI 协议的代理。本文列出所有可用参数，帮助你快速完成配置。阅读本指南之前，请确保已经按照 [README](../../README.md) 中的说明完成 `LlmConnector` 的基础安装。

---

## 1. 引入 Provider

```ts
import { OpenaiProvider } from '@rcb-plugins/llm-connector';
```

---

## 2. 基础用法

`OpenaiProvider` 支持两种模式：`direct`（浏览器直连）与 `proxy`（自定义后端代理）。下面示例展示直连模式的最小配置：

```ts
const openai = new OpenaiProvider({
  mode: 'direct',                     // 可选 'direct' 或 'proxy'
  model: 'gpt-4.1-mini',              // 必填
  apiKey: process.env.OPENAI_API_KEY, // 直连模式必填
  responseFormat: 'stream',           // 'stream'（默认）或 'json'
});
```

> **💡 三种推理模式**：本库支持三种同等重要的推理模式：
>
> 1. **前端 BYOK** - 用户在前端粘贴自己的 API Key,存储在浏览器 localStorage
> 2. **端侧推理** - Chrome AI、WebLLM 等浏览器端推理,无需 API Key
> 3. **后端代理** - Backend Proxy、LM Studio 等后端统一管理
>
> OpenAI Provider 支持模式 1 和模式 3。用户根据场景选择合适的模式。

---

## 3. 配置项说明

| 选项             | 类型                                   | 是否必填                    | 默认值                                        | 说明 |
| ---------------- | -------------------------------------- | --------------------------- | --------------------------------------------- | ---- |
| `mode`           | `'direct'` \| `'proxy'`                | ✅ 总是必填                 | —                                             | 选择直连还是代理模式 |
| `model`          | `string`                               | ✅ 总是必填                 | —                                             | 模型名称 |
| `apiKey`         | `string`                               | ✅ 仅在 `direct` 模式       | —                                             | OpenAI API Key（仅直连模式使用） |
| `baseUrl`        | `string`                               | ✅ 仅在 `proxy` 模式        | `https://api.openai.com/v1/chat/completions`   | 自定义接口地址（代理模式必填） |
| `method`         | `string`                               | ❌                           | `'POST'`                                      | 请求方法 |
| `headers`        | `Record<string, string>`               | ❌                           | `{}`                                          | 额外请求头 |
| `body`           | `Record<string, unknown>`              | ❌                           | `{}`                                          | 额外请求体，最终会合并发送 |
| `systemMessage`  | `string`                               | ❌                           | `undefined`                                   | 会作为系统提示信息插入到对话首位 |
| `responseFormat` | `'stream'` \| `'json'`                 | ❌                           | `'stream'`                                    | `stream` 表示使用 SSE 流式返回，`json` 返回完整文本 |
| `messageParser`  | `(msgs: ChatMessage[]) => any[]`       | ❌                           | `undefined`                                   | 自定义消息转换逻辑 |
| `debug`          | `boolean`                              | ❌                           | `false`                                       | 打印请求与响应日志 |

---

## 4. 进阶示例

```ts
const openai = new OpenaiProvider({
  mode: 'proxy',
  model: 'gpt-4.1-nano',
  baseUrl: 'https://my-proxy.example.com/chat/completions',
  method: 'POST',
  headers: {
    'X-Custom-Header': 'value',
  },
  body: {
    temperature: 0.7,
    max_tokens: 500,
  },
  systemMessage: '你是一位专业的中英翻译助理。',
  responseFormat: 'stream',
  messageParser: (msgs) => msgs.map((m) => ({ role: m.role, content: m.content })),
  debug: true,
});
```

---

## 5. 工作机制

1. **构造函数**：根据配置项初始化请求地址、请求头、请求体。
2. **`sendMessages()`**：向 OpenAI 发起请求，`stream` 模式下逐块解析 SSE，`json` 模式返回一次性文本。

---

更多 Provider 说明请见 [`docs/providers`](../providers)。
