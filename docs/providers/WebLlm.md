# WebLlmProvider 配置指南

`WebLlmProvider` 使用 MLC WebLLM 运行时在浏览器中加载本地/远程模型，实现完全前端的推理体验。本文记录常用配置项，具体 API 的详细说明可参考 [官方文档](https://webllm.mlc.ai/docs/user/api_reference.html)。

在阅读本指南之前，请确保已按照 [README](../../README.md) 中的步骤完成 `LlmConnector` 的基础集成。

---

## 1. 安装依赖并引入 Provider

WebLLM 需要额外安装运行时依赖：

```bash
npm install @mlc-ai/web-llm
```

```ts
import { WebLlmProvider } from '@rcb-plugins/llm-connector';
```

---

## 2. 基础用法

以下示例展示最小化配置：

```ts
const webllm = new WebLlmProvider({
  model: 'Qwen2-0.5B-Instruct-q4f16_1-MLC', // 模型标识或 CDN 路径
  responseFormat: 'stream',                  // 'stream'（默认）或 'json'
});
```

> **⚠️ 提示**：在浏览器加载大模型会占用大量内存，并受设备算力限制。请根据目标环境挑选模型并提前测试。

---

## 3. 配置项说明

| 选项                    | 类型                                   | 是否必填 | 默认值    | 说明 |
| ----------------------- | -------------------------------------- | -------- | -------- | ---- |
| `model`                 | `string`                               | ✅       | —        | 模型名称或路径（可在 [MLC HuggingFace 仓库](https://huggingface.co/mlc-ai) 找到现成模型） |
| `systemMessage`         | `string`                               | ❌       | `undefined` | 系统提示语 |
| `responseFormat`        | `'stream'` \| `'json'`                 | ❌       | `'stream'` | `stream` 为逐字符/逐分块输出，`json` 返回完整内容 |
| `engineConfig`          | `MLCEngineConfig`                      | ❌       | `{}`      | 运行时配置，如线程数、调度策略等 |
| `chatCompletionOptions` | `Record<string, unknown>`              | ❌       | `{}`      | 推理参数（例如温度、最大长度），会传入 `chat.completions.create` |
| `messageParser`         | `(msgs: ChatMessage[]) => any[]`       | ❌       | `undefined` | 自定义消息格式 |
| `debug`                 | `boolean`                              | ❌       | `false`   | 打印调试信息 |

---

## 4. 进阶示例

```ts
const webllm = new WebLlmProvider({
  model: 'Qwen2-1.5B-Instruct-q4f16_1-MLC',
  systemMessage: '你是运行在浏览器中的友好助手。',
  responseFormat: 'stream',
  engineConfig: {
    numThreads: 4,
    sampler: { topK: 40, topP: 0.95 },
  },
  chatCompletionOptions: {
    temperature: 0.7,
    maxTokens: 512,
  },
  messageParser: (msgs) => msgs.map((m) => ({ role: m.role, content: m.content })),
  debug: true,
});
```

---

## 5. 工作机制

1. **构造函数**：根据配置立即（或按需）加载 MLC 引擎。
2. **`sendMessages()`**：调用 `engine.chat.completions.create`，支持流式逐块输出或整段输出。

---

更多 Provider 指南请查看 [`docs/providers`](../providers)。
