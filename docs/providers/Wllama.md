> [!警告]
> `WllamaProvider` 已不再随插件默认发布。若需要，可参考 [旧版实现](https://gist.github.com/tjtanjin/345fe484c6df26c8194381d2b177f66c) 拷贝至你的代码库，然后阅读以下配置指南。

# WllamaProvider 配置指南

`WllamaProvider` 基于 Wllama WebAssembly 运行时在浏览器端加载 GGUF 模型。它开放了 Wllama 的 [AssetsPathConfig](https://github.ngxson.com/wllama/docs/interfaces/AssetsPathConfig.html)、[WllamaConfig](https://github.ngxson.com/wllama/docs/interfaces/WllamaConfig.html)、[LoadModelConfig](https://github.ngxson.com/wllama/docs/interfaces/LoadModelConfig.html) 与 [ChatCompletionOptions](https://github.ngxson.com/wllama/docs/interfaces/ChatCompletionOptions.html)。在使用前，请先完成 [README](../../README.md) 中的基础集成步骤。

---

## 1. 安装依赖并引入 Provider

```bash
npm install @wllama/wllama
```

```ts
import { WllamaProvider } from '@rcb-plugins/llm-connector';
```

> 请注意：`@wllama/wllama` 需要你自行提供 `.wasm` 文件（可放在项目 `public/` 目录或其他静态资源路径下）。

---

## 2. 基础用法

```ts
const wllama = new WllamaProvider({
  modelUrl: 'https://huggingface.co/.../model.gguf', // 必填，指向 GGUF 模型
});
```

> **⚠️ 提示**：浏览器加载大模型会占用大量内存，请根据目标设备选择合适的模型并充分测试。

---

## 3. 配置项说明

| 选项                  | 类型                       | 是否必填 | 默认值                                                                                                             | 说明 |
| --------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ | ---- |
| `modelUrl`            | `string`                   | ✅       | —                                                                                                                  | GGUF 模型的下载地址或本地路径 |
| `systemMessage`       | `string`                   | ❌       | `undefined`                                                                                                        | 系统提示语 |
| `responseFormat`      | `'stream'` \| `'json'`     | ❌       | `'stream'`                                                                                                         | 流式或整段输出 |
| `assetsPathConfig`    | `AssetsPathConfig`         | ❌       | `{ 'single-thread/wllama.wasm': '/single-thread/wllama.wasm', 'multi-thread/wllama.wasm': '/multi-thread/wllama.wasm' }` | WASM 资源路径映射 |
| `wllamaConfig`        | `WllamaConfig`             | ❌       | `{}`                                                                                                               | Wllama 运行时配置 |
| `loadModelConfig`     | `LoadModelConfig`          | ❌       | `{}`                                                                                                               | 模型加载配置（如分块大小） |
| `chatCompletionOptions` | `Record<string, unknown>`| ❌       | `{}`                                                                                                               | 传递给 `createChatCompletion` 的参数 |
| `messageParser`       | `(msgs: Message[]) => any[]` | ❌     | `undefined`                                                                                                        | 自定义消息格式 |

---

## 4. 进阶示例

```ts
const wllama = new WllamaProvider({
  modelUrl: 'https://huggingface.co/.../model.gguf',
  systemMessage: '你是浏览器中的助手。',
  responseFormat: 'stream',
  assetsPathConfig: {
    'single-thread/wllama.wasm': '/libs/wllama/single-thread/wllama.wasm',
    'multi-thread/wllama.wasm': '/libs/wllama/multi-thread/wllama.wasm',
  },
  loadModelConfig: { n_ctx: 8192 },
  chatCompletionOptions: { temperature: 0.7 },
  messageParser: (msgs) => msgs.map((m) => ({ role: m.role, content: m.content })),
});
```

---

## 5. 工作机制

1. **构造函数**：设置模型地址、WASM 路径及运行时配置。
2. **`sendMessages()`**：调用 `createChatCompletion()`，支持流式与一次性输出。

---

更多 Provider 说明请见 [`docs/providers`](../providers)。
