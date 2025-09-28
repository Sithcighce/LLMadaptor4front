# AnthropicProvider 配置指南

`AnthropicProvider` 用于连接 Anthropic 的 Claude 系列模型，可选择直接访问官方 API，或通过任意兼容的代理。配置方式与 Anthropic 的 [Messages API](https://docs.anthropic.com/claude/reference/messages_post) 保持一致。使用本指南前，请确保你已完成 [README](../../README.md) 中的集成步骤。

---

## 1. 引入 Provider

```ts
import { AnthropicProvider } from '@rcb-plugins/llm-connector';
```

---

## 2. 基础用法

直连模式需要提供 API Key，适合本地调试或完全信任的环境：

```ts
const claude = new AnthropicProvider({
  mode: 'direct',                                // 'direct' 或 'proxy'
  model: 'claude-3-5-sonnet-20241022',           // 必填
  apiKey: process.env.ANTHROPIC_KEY!,            // 直连模式必填
  responseFormat: 'stream',                      // 'stream'（默认）或 'json'
});
```

> **⚠️ 注意**：在浏览器里暴露 Anthropic API Key 风险很高，生产环境应使用 `proxy` 模式，将密钥保存在后端。可参考 [示例代理项目](https://github.com/tjtanjin/llm-proxy)。

---

## 3. 配置项说明

| 选项              | 类型                                   | 是否必填                    | 默认值                                   | 说明 |
| ----------------- | -------------------------------------- | --------------------------- | ---------------------------------------- | ---- |
| `mode`            | `'direct'` \| `'proxy'`                | ✅ 总是必填                 | —                                        | 选择直连还是代理 |
| `model`           | `string`                               | ✅ 总是必填                 | —                                        | Claude 模型名称 |
| `apiKey`          | `string`                               | ✅ 仅在 `direct` 模式       | —                                        | Anthropic API Key |
| `baseUrl`         | `string`                               | ✅ 仅在 `proxy` 模式        | `https://api.anthropic.com/v1/messages`  | 自定义接口地址（代理模式必填） |
| `anthropicVersion`| `string`                               | ❌                           | `'2023-06-01'`                           | 请求头所需的版本号 |
| `maxOutputTokens` | `number`                               | ❌                           | `1024`                                   | 生成上限 Tokens |
| `responseFormat`  | `'stream'` \| `'json'`                 | ❌                           | `'stream'`                               | 是否使用 SSE 流式输出 |
| `method`          | `string`                               | ❌                           | `'POST'`                                 | 请求方法 |
| `headers`         | `Record<string, string>`               | ❌                           | `{}`                                     | 额外请求头 |
| `body`            | `Record<string, unknown>`              | ❌                           | `{}`                                     | 额外请求体字段 |
| `systemMessage`   | `string`                               | ❌                           | `undefined`                              | 系统提示语 |
| `messageParser`   | `(msgs: ChatMessage[]) => any[]`       | ❌                           | `undefined`                              | 自定义消息转换逻辑 |
| `debug`           | `boolean`                              | ❌                           | `false`                                  | 打印调试日志 |

---

## 4. 进阶示例（代理模式）

```ts
const claude = new AnthropicProvider({
  mode: 'proxy',
  baseUrl: 'https://my-proxy.internal/anthropic/messages',
  model: 'claude-3-5-sonnet-20241022',
  responseFormat: 'stream',
  maxOutputTokens: 2048,
  headers: {
    'X-Workspace-Id': 'studio-42',
  },
  body: {
    temperature: 0.7,
  },
  systemMessage: '请用中文、保持简洁作答。',
  debug: true,
});
```

---

## 5. 工作机制

1. **构造函数**：根据模式设置请求头、地址与默认请求体。
2. **`sendMessages()`**：向 Anthropic 发送消息，`stream` 模式逐步解析 SSE，`json` 模式直接返回文本。

---

更多 Provider 说明请见 [`docs/providers`](../providers)。
