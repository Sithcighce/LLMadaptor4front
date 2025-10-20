# Chrome AI Provider

Chrome 浏览器内置 AI 功能支持。

## 概述

Chrome AI 使用浏览器的内置 AI 能力（window.ai API），无需任何外部 API Key，完全在浏览器本地运行。

## 特性

- ✅ **无需 API Key** - 完全免费
- ✅ **隐私保护** - 数据不离开浏览器
- ✅ **即时响应** - 本地推理
- ⚠️ **浏览器限制** - 需要 Chrome 129+ 并启用实验性功能

## 使用方法

### 1. 启用 Chrome AI

1. 确保使用 Chrome 129 或更高版本
2. 访问 `chrome://flags/#optimization-guide-on-device-model`
3. 启用 "Enables optimization guide on device"
4. 重启浏览器
5. 等待模型下载完成

### 2. 检查可用性

```typescript
import { checkChromeAIAvailability } from 'llm-connector';

const available = await checkChromeAIAvailability();
if (available) {
  console.log('Chrome AI 可用');
} else {
  console.log('Chrome AI 不可用');
}
```

### 3. 连接

```typescript
import { LlmConnectorProvider, useLlmConnector } from 'llm-connector';

function MyComponent() {
  const { handlers } = useLlmConnector();
  
  const connect = async () => {
    handlers.setProviderId('chrome-ai');
    handlers.setModel('chrome-ai-builtin');
    await handlers.handleConnect();
  };
  
  return <button onClick={connect}>连接 Chrome AI</button>;
}
```

### 4. 聊天

```typescript
const { llmClient } = useLlmConnector();

const chat = async () => {
  const result = await llmClient.chat({
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  });
  console.log(result.text);
};
```

## 配置参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `model` | string | ✅ | `'chrome-ai-builtin'` | 固定值 |
| `apiKey` | string | ❌ | - | 不需要 |
| `baseUrl` | string | ❌ | - | 不需要 |

## 限制

- ⚠️ 仅支持 Chrome 129+
- ⚠️ 需要手动启用实验性功能
- ⚠️ 模型需要下载（首次使用）
- ⚠️ 可能有速率限制
- ⚠️ 功能可能在未来版本中变化

## 适用场景

- ✅ 隐私敏感应用
- ✅ 离线应用
- ✅ 快速原型
- ✅ 学习和实验

## 故障排查

### Chrome AI 不可用
1. 检查 Chrome 版本（必须 129+）
2. 检查实验性功能是否启用
3. 等待模型下载完成
4. 尝试重启浏览器

### 连接失败
1. 打开浏览器控制台查看错误
2. 确认 `window.ai` 对象存在
3. 检查是否有权限问题

## 参考资料

- [Chrome AI Origin Trial](https://developer.chrome.com/docs/ai/built-in)
- [Window AI API](https://github.com/windowai/window.ai)
