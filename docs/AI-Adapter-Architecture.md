# AI API 适配器 - 架构设计与改造方案

**文档版本**：v1.0  
**创建日期**：2025-10-20  
**基于**：llm-connector v0.3.2

---

## ⚠️ 核心架构 - 三种推理模式统一

**本项目是统一的 LLM 连接器库,支持三种同等重要的推理模式:**

### 1️⃣ 前端 BYOK (Bring Your Own Key)

```
用户 → 前端 UI → 粘贴自己的 API Key → localStorage → 前端直接调用 AI Provider
```

- ✅ 用户管理自己的密钥
- ✅ 完全在浏览器运行
- ✅ 零后端依赖

### 2️⃣ 端侧推理 (On-Device Inference)

```
用户 → 前端 UI → Chrome AI / WebLLM → 浏览器端本地推理
```

- ✅ 无需 API Key
- ✅ 完全本地运行
- ✅ 隐私保护

### 3️⃣ 后端代理 (Backend Proxy / Local Server)

```
用户 → 前端 UI → 后端服务器 → 统一添加 Key → AI Provider / 本地模型
```

- ✅ 企业统一管理密钥
- ✅ 支持本地模型服务器
- ✅ 集中控制和审计

**三种模式同等重要,用户根据场景选择。**

---

## 📋 目录

1. [现有架构分析](#现有架构分析)
2. [改造需求](#改造需求)
3. [新架构设计](#新架构设计)
4. [核心改造点](#核心改造点)
5. [数据流设计](#数据流设计)
6. [类型系统扩展](#类型系统扩展)

---

## 🔍 现有架构分析

### llm-connector 核心架构

```
┌─────────────────────────────────────────────────────────┐
│  LlmConnectorProvider (Context Provider)                │
│  ├─ 管理全局状态（providerId, apiKey, model等）        │
│  ├─ 持久化到 localStorage                               │
│  └─ 提供 Context 给子组件                               │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  useLlmConnectorLogic (核心逻辑 Hook)                   │
│  ├─ 状态管理（status, error, llmClient等）             │
│  ├─ 连接处理（handleConnect, handleDisconnect）        │
│  ├─ 模型管理（fetchModels, setModel）                   │
│  └─ Token 统计（updateTokenUsage）                      │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  Provider 层 (特定平台实现)                              │
│  ├─ OpenaiProvider.ts  → 创建 TokenJS 实例              │
│  ├─ AnthropicProvider.ts                                │
│  ├─ GeminiProvider.ts                                   │
│  └─ WebLlmProvider.ts  → 使用 @mlc-ai/web-llm          │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  LlmClient (统一客户端接口)                              │
│  └─ chat(request) → 调用 TokenJS 或 WebLLM             │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  底层引擎                                                │
│  ├─ Token.js → 支持 200+ LLM API                       │
│  └─ @mlc-ai/web-llm → 浏览器内 WASM 推理               │
└─────────────────────────────────────────────────────────┘
```

### 关键设计模式

#### 1. Provider 模式
每个 AI 平台实现独立的 Provider：

```typescript
// providers/OpenaiProvider.ts
export const createOpenaiProvider = (apiKey: string, baseUrl?: string) => {
  return new TokenJS({
    provider: 'openai',
    apiKey: apiKey,
    baseURL: baseUrl || 'https://api.openai.com/v1',
  });
};
```

#### 2. 统一客户端接口
所有 Provider 返回的对象被包装成 `LlmClient`：

```typescript
export class LlmClient {
  private tokenJs: TokenJSInterface;
  
  public async chat(request: ChatRequest): Promise<ChatResult> {
    const response = await this.tokenJs.chat.completions.create({
      provider: this.provider,
      model: this.model,
      messages: request.messages,
      stream: request.stream ?? false,
    });
    
    return {
      text: response.choices[0].message.content,
      usage: { input: ..., output: ... },
      stop_reason: response.choices[0].finish_reason,
    };
  }
}
```

#### 3. Context + Hook 模式
通过 React Context 共享状态：

```typescript
// 在 Provider 中注册
<LlmConnectorProvider name="chat" storageKey="chat-config">
  <App />
</LlmConnectorProvider>

// 在组件中使用
const { llmClient, states, handlers } = useLlmConnector('chat');
```

---

## 🎯 改造需求

### 需要新增的功能

#### 1. 新增 Provider 支持
- **Chrome AI API**: 浏览器内置 AI
- **LM Studio**: 本地 OpenAI 兼容服务器
- **硅基流动**: 国内 API 提供商
- **后端代理**: 通过后端转发请求

#### 2. 调用模式扩展
**当前**: 仅前端直调（API Key 在浏览器）
**新增**: 支持后端代理（API Key 在服务器）

```typescript
// 前端直调
setCallMode('frontend');
setApiKey('user-provided-key');

// 后端代理
setCallMode('backend');
setBackendUrl('/api/ai/proxy');
```

#### 3. 配置灵活性
**当前**: 必须通过 UI 组件配置
**新增**: 支持纯代码配置

```typescript
// 程序化配置
const connector = useLlmConnectorLogic('my-config');
connector.setProviderId('chrome-ai');
connector.handleConnect();
```

---

## 🏗️ 新架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│  应用层                                                  │
│  ├─ Google Audio (STT + AI Chat)                       │
│  └─ PDF Reader (逐段讲解 + 文本选择问答)                 │
└──────────────┬──────────────────────────────────────────┘
               │ useLlmConnector('instance-name')
               ↓
┌─────────────────────────────────────────────────────────┐
│  LlmConnectorProvider (扩展)                            │
│  ├─ 新增：callMode ('frontend' | 'backend')            │
│  ├─ 新增：backendUrl (后端代理地址)                     │
│  └─ 保留：原有所有功能                                   │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  useLlmConnectorLogic (扩展核心逻辑)                     │
│  ├─ 原有：providerId, apiKey, model, status            │
│  ├─ 新增：callMode, backendUrl                         │
│  ├─ 新增：Provider 选择逻辑（根据 callMode）            │
│  └─ 新增：后端可用性检测                                 │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  Provider 层 (扩展)                                      │
│  ┌─────────────────────┬─────────────────────────────┐ │
│  │  前端直调 Providers  │  后端代理 Provider          │ │
│  ├─────────────────────┼─────────────────────────────┤ │
│  │ ✅ OpenAI           │ 🆕 BackendProxyProvider    │ │
│  │ ✅ Anthropic        │   (统一后端调用)           │ │
│  │ ✅ Gemini           │                             │ │
│  │ ✅ WebLLM           │                             │ │
│  │ 🆕 ChromeAI         │                             │ │
│  │ 🆕 LMStudio         │                             │ │
│  │ 🆕 SiliconFlow      │                             │ │
│  └─────────────────────┴─────────────────────────────┘ │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  LlmClient (保持不变)                                    │
│  └─ 统一的 chat(request) 接口                           │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  实际 AI 后端                                            │
│  ├─ 浏览器：Chrome AI, WebLLM                          │
│  ├─ 本地：LM Studio (localhost:1234)                   │
│  ├─ 云端：OpenAI, Anthropic, 硅基流动                   │
│  └─ 代理：/api/ai/proxy (Next.js API Route)            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 核心改造点

### 改造点1：扩展状态管理

**文件**: `src/hooks/useLlmConnectorLogic.ts`

**新增状态**:
```typescript
export const useLlmConnectorLogic = (storageKey: string = 'llm-connector-config') => {
  // === 原有状态（保留）===
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [status, setStatus] = useState<ConnectorStatus>('disconnected');
  
  // === 新增状态 ===
  const [callMode, setCallMode] = useState<CallMode>('frontend'); // 🆕
  const [backendUrl, setBackendUrl] = useState('/api/ai/proxy');  // 🆕
  const [backendAvailable, setBackendAvailable] = useState(false); // 🆕
  
  // ... 其他逻辑
};
```

**新增持久化**:
```typescript
// Load config from localStorage
useEffect(() => {
  try {
    const savedConfig = localStorage.getItem(storageKey);
    if (savedConfig) {
      const { 
        providerId, 
        baseUrl, 
        model,
        callMode,    // 🆕
        backendUrl   // 🆕
      } = JSON.parse(savedConfig);
      
      if (providerId) setProviderId(providerId);
      if (baseUrl) setBaseUrl(baseUrl);
      if (model) setModel(model);
      if (callMode) setCallMode(callMode);         // 🆕
      if (backendUrl) setBackendUrl(backendUrl);   // 🆕
    }
  } catch (e) {
    console.error('Failed to load config', e);
  }
}, [storageKey]);

// Save config to localStorage
useEffect(() => {
  try {
    const configToSave = { 
      providerId, 
      baseUrl, 
      model,
      callMode,    // 🆕
      backendUrl   // 🆕
    };
    localStorage.setItem(storageKey, JSON.stringify(configToSave));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}, [providerId, baseUrl, model, callMode, backendUrl, storageKey]);
```

---

### 改造点2：新增 Provider 实现

#### 2.1 ChromeAIProvider

**文件**: `src/providers/ChromeAIProvider.ts`

```typescript
import { LlmClient } from '../client/LlmClient';

/**
 * Chrome AI Provider
 * 使用浏览器内置的 window.ai API
 */
export const createChromeAIProvider = async (): Promise<LlmClient> => {
  // 检查 Chrome AI 可用性
  if (!('ai' in window) || !window.ai || !window.ai.assistant) {
    throw new Error('Chrome AI is not available in this browser');
  }
  
  // 检查能力
  const capabilities = await window.ai.assistant.capabilities();
  if (capabilities.available !== 'readily') {
    throw new Error(`Chrome AI is not ready: ${capabilities.available}`);
  }
  
  // 创建会话
  const session = await window.ai.assistant.create({
    temperature: 0.7,
    topK: 3,
  });
  
  // 创建兼容 TokenJS 接口的包装器
  const chromeAIWrapper = {
    chat: {
      completions: {
        create: async (params: any) => {
          const messages = params.messages;
          const lastMessage = messages[messages.length - 1];
          
          // Chrome AI 当前只支持单轮对话
          const response = await session.prompt(lastMessage.content);
          
          return {
            choices: [{
              message: {
                content: response,
              },
              finish_reason: 'stop',
            }],
            usage: {
              prompt_tokens: 0,  // Chrome AI 不提供 token 统计
              completion_tokens: 0,
            },
          };
        },
      },
    },
  };
  
  return new LlmClient(chromeAIWrapper, 'chrome-ai', 'chrome-ai-model');
};

// 类型扩展
declare global {
  interface Window {
    ai?: {
      assistant: {
        capabilities: () => Promise<{
          available: 'readily' | 'after-download' | 'no';
        }>;
        create: (options?: {
          temperature?: number;
          topK?: number;
        }) => Promise<{
          prompt: (text: string) => Promise<string>;
          promptStreaming: (text: string) => AsyncIterable<string>;
          destroy: () => void;
        }>;
      };
    };
  }
}
```

#### 2.2 LMStudioProvider

**文件**: `src/providers/LMStudioProvider.ts`

```typescript
import { TokenJS } from 'token.js';
import { LlmClient } from '../client/LlmClient';

/**
 * LM Studio Provider
 * 连接本地运行的 LM Studio 服务器
 * 默认端点: http://localhost:1234/v1
 */
export const createLMStudioProvider = async (
  baseUrl: string = 'http://localhost:1234/v1',
  model?: string
): Promise<LlmClient> => {
  // 测试连接
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`LM Studio not responding at ${baseUrl}`);
    }
    
    const data = await response.json();
    const models = data.data || [];
    
    if (models.length === 0) {
      throw new Error('No models loaded in LM Studio');
    }
    
    // 使用第一个可用模型或用户指定的模型
    const selectedModel = model || models[0].id;
    
    // LM Studio 兼容 OpenAI API，使用 TokenJS
    const tokenJs = new TokenJS({
      provider: 'openai',
      apiKey: 'lm-studio',  // LM Studio 不需要真实 API Key
      baseURL: baseUrl,
    });
    
    return new LlmClient(tokenJs, 'lmstudio', selectedModel);
    
  } catch (error) {
    throw new Error(`Failed to connect to LM Studio: ${error.message}`);
  }
};
```

#### 2.3 SiliconFlowProvider

**文件**: `src/providers/SiliconFlowProvider.ts`

```typescript
import { TokenJS } from 'token.js';
import { LlmClient } from '../client/LlmClient';

/**
 * 硅基流动 Provider
 * 基于 OpenAI 兼容接口
 */
export const createSiliconFlowProvider = (
  apiKey: string,
  model: string = 'Qwen/Qwen2.5-7B-Instruct'
): LlmClient => {
  const tokenJs = new TokenJS({
    provider: 'openai',
    apiKey: apiKey,
    baseURL: 'https://api.siliconflow.cn/v1',
  });
  
  return new LlmClient(tokenJs, 'siliconflow', model);
};
```

#### 2.4 BackendProxyProvider

**文件**: `src/providers/BackendProxyProvider.ts`

```typescript
import { LlmClient } from '../client/LlmClient';

/**
 * 后端代理 Provider
 * 通过后端 API 转发请求，API Key 存储在服务器
 */
export const createBackendProxyProvider = async (
  backendUrl: string = '/api/ai/proxy'
): Promise<LlmClient> => {
  // 测试后端可用性
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Backend proxy not available at ${backendUrl}`);
    }
  } catch (error) {
    throw new Error(`Failed to connect to backend proxy: ${error.message}`);
  }
  
  // 创建后端调用包装器
  const backendWrapper = {
    chat: {
      completions: {
        create: async (params: any) => {
          const response = await fetch(`${backendUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: params.messages,
              model: params.model,
              stream: params.stream || false,
              temperature: params.temperature,
              max_tokens: params.max_tokens,
            }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Backend proxy error');
          }
          
          return response.json();
        },
      },
    },
  };
  
  return new LlmClient(backendWrapper, 'backend-proxy', 'backend-model');
};
```

---

### 改造点3：扩展连接逻辑

**文件**: `src/hooks/useLlmConnectorLogic.ts`

**修改 `handleConnect` 函数**:

```typescript
const handleConnect = useCallback(async () => {
  setStatus('connecting');
  setError(null);
  
  try {
    let client: LlmClient;
    
    // 根据 callMode 和 providerId 选择 Provider
    if (callMode === 'backend') {
      // 后端代理模式
      client = await createBackendProxyProvider(backendUrl);
      
    } else {
      // 前端直调模式
      switch (providerId) {
        case 'openai':
          client = createOpenaiProvider(apiKey, baseUrl);
          break;
          
        case 'anthropic':
          client = createAnthropicProvider(apiKey);
          break;
          
        case 'gemini':
          client = createGeminiProvider(apiKey);
          break;
          
        case 'webllm':
          client = await createWebLlmProvider(model);
          break;
          
        case 'chrome-ai':  // 🆕
          client = await createChromeAIProvider();
          break;
          
        case 'lmstudio':   // 🆕
          client = await createLMStudioProvider(baseUrl, model);
          break;
          
        case 'siliconflow': // 🆕
          client = createSiliconFlowProvider(apiKey, model);
          break;
          
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }
    }
    
    setLlmClient(client);
    setStatus('connected');
    
  } catch (err) {
    setError(err as Error);
    setStatus('disconnected');
  }
}, [callMode, providerId, apiKey, baseUrl, model, backendUrl]);
```

---

## 📊 数据流设计

### 前端直调流程

```
用户配置
  ├─ setProviderId('openai')
  ├─ setApiKey('sk-...')
  ├─ setCallMode('frontend')
  └─ handleConnect()
      ↓
Provider 选择
  ├─ createOpenaiProvider(apiKey, baseUrl)
  └─ 返回 TokenJS 实例
      ↓
LlmClient 包装
  └─ new LlmClient(tokenJs, 'openai', 'gpt-4o')
      ↓
应用层调用
  └─ llmClient.chat({ messages: [...] })
      ↓
TokenJS 执行
  └─ 直接调用 OpenAI API
      ↓
返回结果
  └─ { text, usage, stop_reason }
```

### 后端代理流程

```
用户配置
  ├─ setCallMode('backend')
  ├─ setBackendUrl('/api/ai/proxy')
  └─ handleConnect()
      ↓
后端可用性检测
  └─ fetch('/api/ai/proxy/health')
      ↓
BackendProxyProvider
  └─ 创建后端调用包装器
      ↓
LlmClient 包装
  └─ new LlmClient(backendWrapper, 'backend-proxy', 'backend-model')
      ↓
应用层调用
  └─ llmClient.chat({ messages: [...] })
      ↓
发送到后端
  └─ POST /api/ai/proxy/chat
      ↓
后端处理
  ├─ 读取环境变量中的 API Key
  ├─ 调用实际 LLM API
  └─ 返回标准化响应
      ↓
返回结果
  └─ { text, usage, stop_reason }
```

---

## 🎨 类型系统扩展

### 新增类型定义

**文件**: `src/types/index.ts`

```typescript
// === 原有类型（保留）===
export type ProviderId = 
  | 'openai' 
  | 'anthropic' 
  | 'gemini' 
  | 'webllm';

export type ConnectorStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error';

// === 新增类型 ===

/**
 * 调用模式
 * - frontend: 前端直调（API Key 在浏览器）
 * - backend: 后端代理（API Key 在服务器）
 */
export type CallMode = 'frontend' | 'backend';

/**
 * 扩展 Provider ID
 */
export type ExtendedProviderId = ProviderId
  | 'chrome-ai'      // 浏览器内置 AI
  | 'lmstudio'       // 本地 LM Studio
  | 'siliconflow'    // 硅基流动
  | 'backend-proxy'; // 后端代理

/**
 * Provider 配置
 */
export interface ProviderConfig {
  id: ExtendedProviderId;
  name: string;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  supportsFrontend: boolean;
  supportsBackend: boolean;
  defaultModel?: string;
}

/**
 * 连接器状态（扩展）
 */
export interface ConnectorState {
  // 原有状态
  providerId: ExtendedProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  status: ConnectorStatus;
  error: Error | null;
  modelOptions: string[];
  tokenUsage: TokenUsage | null;
  
  // 新增状态
  callMode: CallMode;
  backendUrl: string;
  backendAvailable: boolean;
}

/**
 * 连接器处理器（扩展）
 */
export interface ConnectorHandlers {
  // 原有处理器
  setProviderId: (id: ExtendedProviderId) => void;
  setApiKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setModel: (model: string) => void;
  handleConnect: () => Promise<void>;
  handleDisconnect: () => void;
  fetchModels: () => Promise<void>;
  
  // 新增处理器
  setCallMode: (mode: CallMode) => void;
  setBackendUrl: (url: string) => void;
  checkBackendAvailability: () => Promise<boolean>;
}
```

### Provider 注册表

**文件**: `src/registry/providers.ts`

```typescript
import type { ProviderConfig } from '../types';

export const PROVIDER_REGISTRY: Record<ExtendedProviderId, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: true,
    defaultModel: 'gpt-4o',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: true,
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: true,
    defaultModel: 'gemini-pro',
  },
  webllm: {
    id: 'webllm',
    name: 'WebLLM',
    requiresApiKey: false,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: false,
    defaultModel: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
  },
  'chrome-ai': {
    id: 'chrome-ai',
    name: 'Chrome AI',
    requiresApiKey: false,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: false,
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    requiresApiKey: false,
    requiresBaseUrl: true,
    supportsFrontend: true,
    supportsBackend: false,
    defaultModel: 'auto',
  },
  siliconflow: {
    id: 'siliconflow',
    name: '硅基流动',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: true,
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
  },
  'backend-proxy': {
    id: 'backend-proxy',
    name: 'Backend Proxy',
    requiresApiKey: false,
    requiresBaseUrl: true,
    supportsFrontend: false,
    supportsBackend: true,
  },
};
```

---

## 🔐 安全性考虑

### 前端直调模式
- ⚠️ API Key 存储在 localStorage（明文）
- ⚠️ 网络请求可被拦截
- ✅ 适用于开发/测试环境
- ✅ 用户自己的 API Key，责任自负

### 后端代理模式
- ✅ API Key 存储在服务器环境变量
- ✅ 前端无法访问真实 API Key
- ✅ 可添加速率限制和鉴权
- ✅ 适用于生产环境

### 最佳实践
```typescript
// 生产环境推荐配置
<LlmConnectorProvider
  name="production-chat"
  storageKey="chat-config"
  defaultCallMode="backend"  // 默认使用后端代理
  defaultBackendUrl="/api/ai/proxy"
>
  <App />
</LlmConnectorProvider>
```

---

## ✅ 改造验收标准

### 功能完整性
- [ ] 所有新 Provider 正常工作
- [ ] 前端直调模式正常
- [ ] 后端代理模式正常
- [ ] 配置持久化正常
- [ ] 多实例隔离正常

### 兼容性
- [ ] 不破坏原有 llm-connector 功能
- [ ] 所有原有 Provider 仍然工作
- [ ] API 向后兼容

### 代码质量
- [ ] TypeScript 类型检查通过
- [ ] 代码风格一致
- [ ] 有充分的错误处理
- [ ] 有必要的注释

---

**文档完成** ✅  
**下一步**：详细实施指南（AI-Adapter-Implementation.md）
