# Vercel AI SDK 集成预研报告

**研究日期**：2025-10-20  
**项目**：LLM Connector  
**目的**：评估集成或借鉴 Vercel AI SDK 的可行性

---

## 1. Vercel AI SDK 概述

### 核心特性
- **统一接口** - 支持 OpenAI, Anthropic, Google, Mistral 等
- **流式响应** - 原生支持 SSE 和 React Stream
- **React Hooks** - useChat, useCompletion, useAssistant
- **边缘运行** - Vercel Edge Runtime 优化
- **类型安全** - 完整 TypeScript 支持

### 架构模式
```
React App
  ↓ useChat()
AI SDK UI (前端)
  ↓ fetch('/api/chat')
AI SDK Core (后端)
  ↓ createOpenAI()
Provider API
```

---

## 2. 与 LLM Connector 对比

### 相似之处

| 特性 | LLM Connector | Vercel AI SDK | 备注 |
|------|--------------|---------------|------|
| 统一接口 | ✅ LlmClient | ✅ LanguageModel | 都提供统一抽象 |
| 多 Provider | ✅ 8 个 | ✅ 10+ | 都支持主流服务 |
| 流式响应 | ✅ SSE | ✅ Stream | 实现方式类似 |
| React Hooks | ✅ useLlmConnector | ✅ useChat | 都提供 Hook |
| TypeScript | ✅ 完整 | ✅ 完整 | 类型都很好 |

### 核心差异

| 维度 | LLM Connector | Vercel AI SDK | 影响 |
|------|--------------|---------------|------|
| **部署模型** | 前端直连 | 后端代理 | 🔴 架构差异大 |
| **API Key** | 前端管理 | 后端管理 | 🔴 安全模型不同 |
| **目标场景** | BYOK 应用 | SaaS 应用 | 🔴 用户群不同 |
| **浏览器 AI** | ✅ 支持 | ❌ 不支持 | 🟢 我们有优势 |
| **多实例** | ✅ ClientRegistry | ❌ 单例 | 🟢 我们更灵活 |
| **UI 组件** | ✅ 独立组件 | ⚠️ Hook 绑定 | 🟡 各有优劣 |

---

## 3. 集成可行性分析

### 方案 A：完全替换（不推荐 ❌）

**做法**：放弃 LLM Connector，直接用 Vercel AI SDK

**优点**：
- 社区支持强
- 文档完善
- 持续更新

**缺点**：
- ❌ **架构不兼容** - 必须有后端
- ❌ **丧失核心优势** - BYOK 模式
- ❌ **不支持浏览器 AI** - Chrome AI, WebLLM
- ❌ **多实例支持差**
- ❌ **前期投入白费**

**结论**：❌ **不可行**

---

### 方案 B：双模式集成（复杂 ⚠️）

**做法**：同时支持两种模式
- 前端直连模式 - 保留现有架构
- 后端代理模式 - 集成 Vercel AI SDK

**优点**：
- 兼顾两种场景
- 用户可选择

**缺点**：
- ⚠️ **维护成本翻倍**
- ⚠️ **API 不统一**
- ⚠️ **测试复杂度高**
- ⚠️ **文档工作量大**

**结论**：⚠️ **不推荐** - 除非有明确需求

---

### 方案 C：API 设计借鉴（推荐 ✅）

**做法**：学习 Vercel AI SDK 的优秀设计，改进我们的 API

#### 可借鉴的设计

##### 1. Hook API 设计
```typescript
// Vercel AI SDK - 简洁优雅
const { messages, input, handleSubmit, isLoading } = useChat();

// LLM Connector - 当前
const { states, handlers, llmClient } = useLlmConnector();
const { messages, sendMessage, isStreaming } = useChatManager();

// 建议：合并为单一 Hook
const { 
  messages, 
  input, 
  setInput,
  submit,
  isLoading,
  error 
} = useLlmChat({ clientName: 'my-chat' });
```

##### 2. 流式响应 API
```typescript
// Vercel AI SDK - 统一格式
const stream = await streamText({
  model: openai('gpt-4'),
  messages,
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// LLM Connector - 可改进
// 统一所有 Provider 的流式响应格式
```

##### 3. 错误处理
```typescript
// Vercel AI SDK - 结构化错误
try {
  await generateText();
} catch (error) {
  if (error instanceof APIError) {
    console.log(error.statusCode, error.message);
  }
}

// 建议：创建统一的错误类型
```

##### 4. 工具调用（Function Calling）
```typescript
// Vercel AI SDK - 优雅的工具定义
const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    weather: {
      description: 'Get the weather',
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => getWeather(location),
    },
  },
});

// 建议：未来可添加此功能
```

#### 不适合借鉴的设计

1. ❌ **后端依赖** - 我们是前端直连
2. ❌ **Route Handler** - 我们不需要 API 路由
3. ❌ **Edge Runtime** - 我们在浏览器运行

---

### 方案 D：混合架构（推荐 ✅）

**做法**：保持现有架构，按需添加 Vercel AI SDK 兼容层

#### 实施步骤

##### Phase 1：API 优化（立即）
```typescript
// 创建简化版 Hook
export const useLlmChat = (config?: {
  clientName?: string;
  systemPrompt?: string;
}) => {
  const { llmClient } = useLlmConnector(config?.clientName);
  const { messages, sendMessage, isStreaming, error } = useChatManager(config);
  
  const [input, setInput] = useState('');
  
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  }, [input, sendMessage]);
  
  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading: isStreaming,
    error,
  };
};
```

##### Phase 2：Backend Proxy 增强（中期）
```typescript
// 在 backend-proxy 中添加 Vercel AI SDK 兼容
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

app.post('/api/chat', async (req, res) => {
  const { messages, provider } = req.body;
  
  // 支持 Vercel AI SDK 格式
  if (provider === 'vercel-compatible') {
    const result = await streamText({
      model: openai('gpt-4'),
      messages,
    });
    
    return result.toAIStreamResponse();
  }
  
  // 保留现有逻辑...
});
```

##### Phase 3：插件系统（长期）
```typescript
// 允许用户选择底层引擎
const connector = new LlmConnector({
  engine: 'tokenjs', // 或 'vercel-ai-sdk'
  provider: 'openai',
});
```

---

## 4. 具体建议

### 立即执行（高优先级）

#### 4.1 优化 Hook API
- 创建 `useLlmChat` - 简化的聊天 Hook
- 合并 `useLlmConnector` 和 `useChatManager`
- 提供类似 Vercel AI SDK 的简洁 API

```typescript
// 新增文件：src/hooks/useLlmChat.ts
// 重新导出：src/index.tsx 添加 useLlmChat
```

#### 4.2 统一错误处理
- 创建 `LlmError` 基类
- 区分不同类型错误（网络、API、配置）

```typescript
// 新增文件：src/utils/LlmError.ts
export class LlmError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
  }
}

export class ApiKeyError extends LlmError {}
export class NetworkError extends LlmError {}
export class StreamError extends LlmError {}
```

### 中期优化（中优先级）

#### 4.3 流式响应标准化
- 统一所有 Provider 的流式格式
- 学习 Vercel AI SDK 的 Stream 类

#### 4.4 Backend Proxy 兼容
- 支持 Vercel AI SDK 的请求格式
- 提供双向兼容

### 长期规划（低优先级）

#### 4.5 工具调用支持
- 参考 Vercel AI SDK 的 Function Calling
- 添加 tools 参数支持

#### 4.6 多模态支持
- 图片输入输出
- 音频支持

---

## 5. 不建议做的事

### ❌ 完全重写
- 现有架构是优势，不是劣势
- BYOK 模式有市场需求
- 浏览器 AI 是差异化特性

### ❌ 强行兼容后端模式
- 会破坏前端直连的简洁性
- 增加用户配置负担

### ❌ 盲目追随
- Vercel AI SDK 针对 SaaS 场景
- 我们的场景不同

---

## 6. 实施路线图

### Q1 2025（立即）
- ✅ 创建 `useLlmChat` Hook
- ✅ 统一错误处理
- ✅ 优化文档

### Q2 2025（3个月）
- ⏳ Backend Proxy 增强
- ⏳ 流式响应标准化
- ⏳ 添加更多测试

### Q3 2025（6个月）
- ⏳ 工具调用支持
- ⏳ 插件系统
- ⏳ 多模态探索

---

## 7. 总结

### 核心观点
1. **不要完全集成** - 架构差异太大
2. **借鉴优秀设计** - API 设计、错误处理
3. **保持差异化** - BYOK、浏览器 AI 是优势
4. **渐进式改进** - 不破坏现有功能

### 推荐方案
**方案 C + 方案 D 混合**
- 学习 Vercel AI SDK 的 API 设计
- 保持现有架构和优势
- 提供更简洁的 Hook API
- Backend Proxy 可选兼容

### 优先级
1. **P0** - 创建 `useLlmChat`（简化 API）
2. **P1** - 统一错误处理
3. **P2** - Backend Proxy 增强
4. **P3** - 工具调用支持

---

## 8. 代码示例

### 新 Hook 示例
```typescript
// src/hooks/useLlmChat.ts
import { useState, useCallback, FormEvent } from 'react';
import { useLlmConnector } from './useLlmConnector';
import { useChatManager } from './useChatManager';

export interface UseLlmChatConfig {
  clientName?: string;
  systemPrompt?: string;
  initialMessages?: ChatMessage[];
}

export const useLlmChat = (config: UseLlmChatConfig = {}) => {
  const { llmClient, states } = useLlmConnector(config.clientName);
  const { 
    messages, 
    sendMessage, 
    isStreaming, 
    error,
    clearMessages,
  } = useChatManager({
    clientName: config.clientName,
  });
  
  const [input, setInput] = useState('');
  
  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input);
      setInput('');
    }
  }, [input, isStreaming, sendMessage]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);
  
  return {
    // Messages
    messages,
    
    // Input
    input,
    setInput,
    handleInputChange,
    
    // Actions
    handleSubmit,
    reload: () => {}, // TODO
    stop: () => {}, // TODO
    append: sendMessage,
    
    // Status
    isLoading: isStreaming,
    error,
    
    // Utilities
    data: states,
  };
};
```

### 使用示例
```typescript
// 简单用法 - 类似 Vercel AI SDK
function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useLlmChat();
  
  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.role}: {msg.content}</div>
      ))}
      
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} disabled={isLoading} />
        <button type="submit" disabled={isLoading}>
          {isLoading ? '发送中...' : '发送'}
        </button>
      </form>
    </div>
  );
}
```

---

**结论**：借鉴优秀设计，保持核心优势，渐进式改进。✅
