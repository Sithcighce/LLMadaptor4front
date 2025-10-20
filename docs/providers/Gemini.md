# GeminiProvider 配置指南

`GeminiProvider` 用于连接 Google Gemini 系列模型，可以直连官方 API，也可以连接自建代理。本文列出所有可配置项，请先完成 [README](../../README.md) 中的基础集成步骤。

---

## 1. 引入 Provider

```ts
import { GeminiProvider } from '@rcb-plugins/llm-connector';
```

---

## 2. 基础用法

同样提供 `direct` 与 `proxy` 两种模式，下面是直连模式的示例：

```ts
const gemini = new GeminiProvider({
  mode: 'direct',                     // 'direct' 或 'proxy'
  model: 'gemini-1.5-flash',          // 必填
  apiKey: process.env.GEMINI_API_KEY, // 直连模式必填
  responseFormat: 'stream',           // 'stream'（默认）或 'json'
});
```

> **💡 三种推理模式**：本库支持三种同等重要的推理模式：
>
> 1. **前端 BYOK** - 用户在前端粘贴自己的 API Key,存储在浏览器 localStorage
> 2. **端侧推理** - Chrome AI、WebLLM 等浏览器端推理,无需 API Key
> 3. **后端代理** - Backend Proxy、LM Studio 等后端统一管理
>
> Gemini Provider 支持模式 1 和模式 3。用户根据场景选择合适的模式。

---

## 3. 配置项说明

| 选项             | 类型                                   | 是否必填                    | 默认值                                             | 说明 |
| ---------------- | -------------------------------------- | --------------------------- | -------------------------------------------------- | ---- |
| `mode`           | `'direct'` \| `'proxy'`                | ✅ 总是必填                 | —                                                  | 选择直连还是代理 |
| `model`          | `string`                               | ✅ 总是必填                 | —                                                  | Gemini 模型名称，可在 [官方列表](https://ai.google.dev/gemini-api/docs/models) 查阅 |
| `apiKey`         | `string`                               | ✅ 仅在 `direct` 模式       | —                                                  | Google API Key（仅直连模式使用） |
| `baseUrl`        | `string`                               | ✅ 仅在 `proxy` 模式        | `https://generativelanguage.googleapis.com/v1beta` | 自定义地址（代理模式必填，可覆盖默认值） |
| `method`         | `string`                               | ❌                           | `'POST'`                                           | 请求方法 |
| `headers`        | `Record<string, string>`               | ❌                           | `{}`                                               | 额外请求头 |
| `body`           | `Record<string, unknown>`              | ❌                           | `{}`                                               | 额外请求体，最终会合并发送 |
| `systemMessage`  | `string`                               | ❌                           | `undefined`                                        | 系统提示信息 |
| `responseFormat` | `'stream'` \| `'json'`                 | ❌                           | `'stream'`                                         | `stream` 使用 SSE，`json` 等待完整响应 |
| `messageParser`  | `(msgs: ChatMessage[]) => any[]`       | ❌                           | `undefined`                                        | 自定义消息转换逻辑 |
| `debug`          | `boolean`                              | ❌                           | `false`                                            | 打印调试日志 |

---

## 4. 进阶示例（代理模式）

```ts
const gemini = new GeminiProvider({
  mode: 'proxy',
  model: 'gemini-1.5-flash',
  baseUrl: 'https://my-proxy.example.com/gemini',
  headers: {
    'X-Team': 'alpha',
  },
  body: {
    temperature: 0.6,
  },
  systemMessage: '请使用中文回答用户问题。',
  responseFormat: 'stream',
  messageParser: (msgs) => msgs.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
  debug: true,
});
```

---

## 5. 工作机制

1. **构造函数**：根据模式拼装请求地址和头部。
2. **`sendMessages()`**：向 Gemini 发起请求，支持 SSE 流式解析或一次性 JSON 输出。

---

更多 Provider 说明请参见 [`docs/providers`](../providers)。
