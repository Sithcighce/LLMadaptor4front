# AnthropicProvider Configuration Guide

The `AnthropicProvider` lets you connect to Anthropic's Claude family (directly via the public API) or any Claude-compatible proxy. Configuration mirrors Anthropic's [Messages API](https://docs.anthropic.com/claude/reference/messages_post) while exposing convenience hooks for streaming and system prompts.

> **ℹ️ Info:**
> This guide assumes you have already set up the `LlmConnector` plugin/component according to the project [README](../../README.md).

---

## 1. Import Provider

```ts
import { AnthropicProvider } from '@rcb-plugins/llm-connector';
```

---

## 2. Basic Instantiation

Direct mode talks to Anthropic's public endpoint and requires an API key. Avoid using this in production unless you fully trust the environment (keys are visible to the browser).

```ts
const claude = new AnthropicProvider({
  mode: 'direct',                      // 'direct' or 'proxy'
  model: 'claude-3-5-sonnet-20241022', // required
  apiKey: process.env.ANTHROPIC_KEY!,  // required in direct mode
  responseFormat: 'stream',            // 'stream' (default) or 'json'
});
```

> **⚠️ Warning:** Shipping your Anthropic API key to the browser is usually unsafe. Use `mode: 'proxy'` whenever possible and keep credentials on your server.

---

## 3. Configuration Options

| Option              | Type                               | Required                 | Default                  | Description |
| ------------------- | ---------------------------------- | ------------------------ | ------------------------ | ----------- |
| `mode`              | `'direct' \| 'proxy'`              | ✅ always                | —                        | Select direct (browser -> Anthropic) or proxy mode. |
| `model`             | `string`                           | ✅ always                | —                        | Claude model name (e.g. `claude-3-5-sonnet-20241022`). |
| `apiKey`            | `string`                           | ✅ if `mode: 'direct'`   | —                        | Anthropic API key (only for direct mode). |
| `baseUrl`           | `string`                           | ✅ if `mode: 'proxy'`    | `https://api.anthropic.com/v1/messages` | Override endpoint (required for proxy mode, optional override otherwise). |
| `anthropicVersion`  | `string`                           | ❌                       | `2023-06-01`             | Version header sent to Anthropic. |
| `maxOutputTokens`   | `number`                           | ❌                       | `1024`                   | Upper bound for generated tokens. |
| `responseFormat`    | `'stream' \| 'json'`               | ❌                       | `'stream'`               | `stream` uses SSE, `json` waits for the full response. |
| `method`            | `string`                           | ❌                       | `'POST'`                 | HTTP verb for the request. |
| `headers`           | `Record<string, string>`           | ❌                       | `{}`                     | Additional HTTP headers (merged on top of defaults). |
| `body`              | `Record<string, unknown>`          | ❌                       | `{}`                     | Extra payload keys forwarded to the API. |
| `systemMessage`     | `string`                           | ❌                       | `null`                   | System prompt prepended before user messages. |
| `messageParser`     | `(msgs: ChatMessage[]) => ClaudeMessage[]` | ❌              | `null`                   | Fully control the payload by supplying a custom parser. |
| `debug`             | `boolean`                          | ❌                       | `false`                  | Enable verbose logging of requests/responses. |

---

## 4. Advanced Example (Proxy Mode)

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
  systemMessage: 'You are a concise assistant that replies in Chinese.',
  debug: true,
});
```

---

## 5. How It Works

1. **Constructor** – prepares headers/body depending on `mode` and response format.
2. **`sendMessages()`** – posts messages to Anthropic, streaming tokens via SSE when `responseFormat === 'stream'`.

---

*Check out other providers in [`docs/providers`](./).*
