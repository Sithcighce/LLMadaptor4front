# AI API 适配器 - 详细实施指南

**文档版本**：v1.0  
**创建日期**：2025-10-20  
**预计工期**：9个工作日

---

## ⚠️ 重要提醒 - 三种推理模式

**本项目是统一的 LLM 连接器库,支持三种同等重要的推理模式:**

1. **前端 BYOK** - 用户粘贴自己的 API Key,前端直接调用
2. **端侧推理** - Chrome AI、WebLLM 浏览器端本地推理
3. **后端代理** - Backend Proxy、LM Studio 后端统一管理

详见: `docs/项目定位与边界.md`

---

## 📋 实施阶段

### Phase 1: 新增 Provider 实现（3天）
### Phase 2: 调用模式层（2天）
### Phase 3: 后端实现（2天）
### Phase 4: 集成与测试（2天）

---

## 🎯 Phase 1: 新增 Provider 实现（Day 1-3）

### Day 1: Chrome AI Provider + LM Studio Provider

#### 任务 1.1：实现 ChromeAIProvider
**文件**: `src/providers/ChromeAIProvider.ts`

**完整代码**:
```typescript
import { LlmClient } from '../client/LlmClient';

// Chrome AI 类型定义
interface ChromeAICapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

interface ChromeAISession {
  prompt: (text: string) => Promise<string>;
  promptStreaming: (text: string) => AsyncIterable<string>;
  destroy: () => void;
  clone: () => Promise<ChromeAISession>;
}

declare global {
  interface Window {
    ai?: {
      assistant: {
        capabilities: () => Promise<ChromeAICapabilities>;
        create: (options?: {
          temperature?: number;
          topK?: number;
          systemPrompt?: string;
        }) => Promise<ChromeAISession>;
      };
    };
  }
}

/**
 * Chrome AI Provider
 * 使用浏览器内置的 window.ai API
 * 
 * @see https://developer.chrome.com/docs/ai/built-in-apis
 */
export const createChromeAIProvider = async (): Promise<LlmClient> => {
  // 1. 检查 Chrome AI 可用性
  if (!window.ai?.assistant) {
    throw new Error('Chrome AI is not available. Please use Chrome 127+ with AI features enabled.');
  }
  
  // 2. 检查能力
  const capabilities = await window.ai.assistant.capabilities();
  
  if (capabilities.available === 'no') {
    throw new Error('Chrome AI is not supported on this device.');
  }
  
  if (capabilities.available === 'after-download') {
    throw new Error('Chrome AI is downloading. Please wait and try again.');
  }
  
  // 3. 创建会话
  const session = await window.ai.assistant.create({
    temperature: capabilities.defaultTemperature || 0.7,
    topK: capabilities.defaultTopK || 3,
  });
  
  // 4. 创建兼容 TokenJS 接口的包装器
  const chromeAIWrapper = {
    chat: {
      completions: {
        create: async (params: any) => {
          const messages = params.messages || [];
          const stream = params.stream || false;
          
          // Chrome AI 只支持简单的 prompt
          // 将多轮对话转换为单个 prompt
          const prompt = messages
            .map((msg: any) => `${msg.role}: ${msg.content}`)
            .join('\n\n');
          
          if (stream) {
            // 流式响应
            const streamIterator = session.promptStreaming(prompt);
            let fullText = '';
            
            return {
              [Symbol.asyncIterator]: async function* () {
                for await (const chunk of streamIterator) {
                  fullText = chunk;
                  yield {
                    choices: [{
                      delta: { content: chunk },
                      index: 0,
                    }],
                  };
                }
              },
              // 模拟 TokenJS 的流式响应格式
              async *[Symbol.asyncIterator]() {
                for await (const chunk of streamIterator) {
                  fullText = chunk;
                  yield {
                    choices: [{
                      delta: { content: chunk },
                      index: 0,
                    }],
                  };
                }
              },
            };
          } else {
            // 非流式响应
            const response = await session.prompt(prompt);
            
            return {
              choices: [{
                message: {
                  content: response,
                  role: 'assistant',
                },
                finish_reason: 'stop',
                index: 0,
              }],
              usage: {
                prompt_tokens: 0,  // Chrome AI 不提供 token 统计
                completion_tokens: 0,
                total_tokens: 0,
              },
              model: 'chrome-ai',
              object: 'chat.completion',
            };
          }
        },
      },
    },
  };
  
  return new LlmClient(chromeAIWrapper, 'chrome-ai', 'chrome-ai-builtin');
};

/**
 * 检查 Chrome AI 是否可用
 */
export const checkChromeAIAvailability = async (): Promise<{
  available: boolean;
  status: string;
}> => {
  if (!window.ai?.assistant) {
    return { available: false, status: 'not-supported' };
  }
  
  try {
    const capabilities = await window.ai.assistant.capabilities();
    return {
      available: capabilities.available === 'readily',
      status: capabilities.available,
    };
  } catch (error) {
    return { available: false, status: 'error' };
  }
};
```

#### 任务 1.2：实现 LMStudioProvider
**文件**: `src/providers/LMStudioProvider.ts`

**完整代码**:
```typescript
import { TokenJS } from 'token.js';
import { LlmClient } from '../client/LlmClient';

/**
 * LM Studio Provider
 * 连接本地运行的 LM Studio 服务器
 * 
 * @see https://lmstudio.ai/docs/api
 */
export const createLMStudioProvider = async (
  baseUrl: string = 'http://localhost:1234/v1',
  model?: string
): Promise<LlmClient> => {
  // 1. 测试服务器连接
  try {
    const modelsResponse = await fetch(`${baseUrl}/models`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),  // 5秒超时
    });
    
    if (!modelsResponse.ok) {
      throw new Error(`LM Studio server returned ${modelsResponse.status}`);
    }
    
    const modelsData = await modelsResponse.json();
    const models = modelsData.data || [];
    
    if (models.length === 0) {
      throw new Error('No models loaded in LM Studio. Please load a model first.');
    }
    
    // 2. 选择模型
    const selectedModel = model || models[0].id;
    
    // 验证模型是否存在
    const modelExists = models.some((m: any) => m.id === selectedModel);
    if (!modelExists && model) {
      console.warn(`Model "${model}" not found. Using "${models[0].id}" instead.`);
    }
    
    // 3. 创建 TokenJS 实例
    // LM Studio 兼容 OpenAI API
    const tokenJs = new TokenJS({
      provider: 'openai',
      apiKey: 'lm-studio',  // LM Studio 不需要真实 API Key
      baseURL: baseUrl,
    });
    
    return new LlmClient(
      tokenJs,
      'lmstudio',
      modelExists && model ? model : models[0].id
    );
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('LM Studio connection timeout. Is the server running?');
    }
    throw new Error(`Failed to connect to LM Studio: ${error.message}`);
  }
};

/**
 * 获取 LM Studio 可用模型列表
 */
export const fetchLMStudioModels = async (
  baseUrl: string = 'http://localhost:1234/v1'
): Promise<string[]> => {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const data = await response.json();
    return (data.data || []).map((m: any) => m.id);
    
  } catch (error: any) {
    throw new Error(`Failed to fetch models: ${error.message}`);
  }
};

/**
 * 检查 LM Studio 服务器状态
 */
export const checkLMStudioStatus = async (
  baseUrl: string = 'http://localhost:1234/v1'
): Promise<{
  online: boolean;
  modelsCount: number;
}> => {
  try {
    const models = await fetchLMStudioModels(baseUrl);
    return {
      online: true,
      modelsCount: models.length,
    };
  } catch (error) {
    return {
      online: false,
      modelsCount: 0,
    };
  }
};
```

#### 任务 1.3：单元测试
**文件**: `src/providers/__tests__/ChromeAIProvider.test.ts`

```typescript
import { createChromeAIProvider, checkChromeAIAvailability } from '../ChromeAIProvider';

describe('ChromeAIProvider', () => {
  beforeEach(() => {
    // Mock window.ai
    (global as any).window = {
      ai: {
        assistant: {
          capabilities: jest.fn().mockResolvedValue({
            available: 'readily',
            defaultTemperature: 0.8,
            defaultTopK: 3,
          }),
          create: jest.fn().mockResolvedValue({
            prompt: jest.fn().mockResolvedValue('Test response'),
            promptStreaming: jest.fn(),
            destroy: jest.fn(),
          }),
        },
      },
    };
  });
  
  it('should create provider successfully', async () => {
    const provider = await createChromeAIProvider();
    expect(provider).toBeDefined();
  });
  
  it('should check availability', async () => {
    const result = await checkChromeAIAvailability();
    expect(result.available).toBe(true);
    expect(result.status).toBe('readily');
  });
});
```

---

### Day 2: Silicon Flow Provider + Backend Proxy Provider

#### 任务 2.1：实现 SiliconFlowProvider
**文件**: `src/providers/SiliconFlowProvider.ts`

```typescript
import { TokenJS } from 'token.js';
import { LlmClient } from '../client/LlmClient';

/**
 * 硅基流动 Provider
 * 支持多个开源模型
 * 
 * @see https://docs.siliconflow.cn/
 */
export const createSiliconFlowProvider = (
  apiKey: string,
  model: string = 'Qwen/Qwen2.5-7B-Instruct'
): LlmClient => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Silicon Flow API key is required');
  }
  
  // 硅基流动使用 OpenAI 兼容接口
  const tokenJs = new TokenJS({
    provider: 'openai',
    apiKey: apiKey,
    baseURL: 'https://api.siliconflow.cn/v1',
  });
  
  return new LlmClient(tokenJs, 'siliconflow', model);
};

/**
 * 硅基流动常用模型
 */
export const SILICONFLOW_MODELS = [
  'Qwen/Qwen2.5-7B-Instruct',
  'Qwen/Qwen2.5-14B-Instruct',
  'Qwen/Qwen2.5-32B-Instruct',
  'Qwen/Qwen2.5-72B-Instruct',
  'THUDM/glm-4-9b-chat',
  'meta-llama/Meta-Llama-3.1-8B-Instruct',
  'meta-llama/Meta-Llama-3.1-70B-Instruct',
  'deepseek-ai/DeepSeek-V2.5',
] as const;

export type SiliconFlowModel = typeof SILICONFLOW_MODELS[number];
```

#### 任务 2.2：实现 BackendProxyProvider
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
  // 1. 健康检查
  try {
    const healthResponse = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (!healthResponse.ok) {
      throw new Error(`Backend proxy returned ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    
    if (!healthData.ok) {
      throw new Error('Backend proxy is not healthy');
    }
    
  } catch (error: any) {
    throw new Error(`Backend proxy not available: ${error.message}`);
  }
  
  // 2. 创建后端调用包装器
  const backendWrapper = {
    chat: {
      completions: {
        create: async (params: any) => {
          const { messages, model, stream, temperature, max_tokens } = params;
          
          const response = await fetch(`${backendUrl}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages,
              model: model || 'default',
              stream: stream || false,
              temperature,
              max_tokens,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Backend error: ${response.status}`);
          }
          
          if (stream) {
            // 流式响应
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            
            return {
              async *[Symbol.asyncIterator]() {
                if (!reader) return;
                
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                          const parsed = JSON.parse(data);
                          yield parsed;
                        } catch (e) {
                          console.error('Failed to parse SSE data:', data);
                        }
                      }
                    }
                  }
                } finally {
                  reader.releaseLock();
                }
              },
            };
          } else {
            // 非流式响应
            return response.json();
          }
        },
      },
    },
  };
  
  return new LlmClient(backendWrapper, 'backend-proxy', 'backend-model');
};

/**
 * 检查后端代理可用性
 */
export const checkBackendProxyAvailability = async (
  backendUrl: string = '/api/ai/proxy'
): Promise<{
  available: boolean;
  models?: string[];
  error?: string;
}> => {
  try {
    const response = await fetch(`${backendUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return {
        available: false,
        error: `Server returned ${response.status}`,
      };
    }
    
    const data = await response.json();
    
    return {
      available: data.ok,
      models: data.models || [],
    };
    
  } catch (error: any) {
    return {
      available: false,
      error: error.message,
    };
  }
};
```

---

### Day 3: 更新 Provider Registry 和类型

#### 任务 3.1：更新类型定义
**文件**: `src/types/index.ts`

```typescript
// === 扩展 Provider ID ===
export type ProviderId = 
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'webllm'
  | 'chrome-ai'      // 🆕
  | 'lmstudio'       // 🆕
  | 'siliconflow'    // 🆕
  | 'backend-proxy'; // 🆕

// === 调用模式 ===
export type CallMode = 'frontend' | 'backend';

// === Provider 配置 ===
export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  supportsFrontend: boolean;
  supportsBackend: boolean;
  defaultModel?: string;
  modelOptions?: readonly string[];
}

// === 连接器状态（扩展）===
export interface ConnectorState {
  // 原有状态
  providerId: ProviderId;
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

// === 连接器处理器（扩展）===
export interface ConnectorHandlers {
  // 原有处理器
  setProviderId: (id: ProviderId) => void;
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

#### 任务 3.2：创建 Provider Registry
**文件**: `src/registry/providers.ts`

```typescript
import type { ProviderId, ProviderConfig } from '../types';
import { SILICONFLOW_MODELS } from '../providers/SiliconFlowProvider';

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 等模型',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: true,
    defaultModel: 'gpt-4o',
    modelOptions: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  },
  
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 系列模型',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: true,
    defaultModel: 'claude-3-5-sonnet-20241022',
    modelOptions: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  },
  
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro, Flash 等模型',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: true,
    defaultModel: 'gemini-pro',
    modelOptions: ['gemini-pro', 'gemini-pro-vision'],
  },
  
  webllm: {
    id: 'webllm',
    name: 'WebLLM',
    description: '浏览器内运行的 WASM 模型',
    requiresApiKey: false,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: false,
    defaultModel: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
  },
  
  'chrome-ai': {
    id: 'chrome-ai',
    name: 'Chrome AI',
    description: '浏览器内置 AI（Chrome 127+）',
    requiresApiKey: false,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: false,
    defaultModel: 'chrome-ai-builtin',
  },
  
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    description: '本地运行的模型服务器',
    requiresApiKey: false,
    requiresBaseUrl: true,
    supportsFrontend: true,
    supportsBackend: false,
    defaultModel: 'auto',
  },
  
  siliconflow: {
    id: 'siliconflow',
    name: '硅基流动',
    description: '国内 API 服务商',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsFrontend: true,
    supportsBackend: true,
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    modelOptions: [...SILICONFLOW_MODELS],
  },
  
  'backend-proxy': {
    id: 'backend-proxy',
    name: 'Backend Proxy',
    description: '通过后端代理调用',
    requiresApiKey: false,
    requiresBaseUrl: true,
    supportsFrontend: false,
    supportsBackend: true,
    defaultModel: 'backend-default',
  },
};

/**
 * 根据调用模式过滤可用 Provider
 */
export const getAvailableProviders = (
  callMode: 'frontend' | 'backend'
): ProviderConfig[] => {
  return Object.values(PROVIDER_REGISTRY).filter(provider =>
    callMode === 'frontend' ? provider.supportsFrontend : provider.supportsBackend
  );
};
```

---

## 🔄 Phase 2: 调用模式层（Day 4-5）

### Day 4: 扩展 useLlmConnectorLogic

#### 任务 4.1：添加新状态和持久化
**文件**: `src/hooks/useLlmConnectorLogic.ts`

**修改部分**:
```typescript
export const useLlmConnectorLogic = (storageKey: string = 'llm-connector-config') => {
  // === 原有状态 ===
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [status, setStatus] = useState<ConnectorStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [llmClient, setLlmClient] = useState<LlmClient | null>(null);
  
  // === 新增状态 ===
  const [callMode, setCallMode] = useState<CallMode>('frontend');
  const [backendUrl, setBackendUrl] = useState('/api/ai/proxy');
  const [backendAvailable, setBackendAvailable] = useState(false);
  
  // === 加载配置 ===
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(storageKey);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        
        if (config.providerId) setProviderId(config.providerId);
        if (config.baseUrl) setBaseUrl(config.baseUrl);
        if (config.model) setModel(config.model);
        if (config.callMode) setCallMode(config.callMode);         // 🆕
        if (config.backendUrl) setBackendUrl(config.backendUrl);   // 🆕
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }, [storageKey]);
  
  // === 保存配置 ===
  useEffect(() => {
    try {
      const configToSave = {
        providerId,
        baseUrl,
        model,
        callMode,    // 🆕
        backendUrl,  // 🆕
      };
      localStorage.setItem(storageKey, JSON.stringify(configToSave));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }, [providerId, baseUrl, model, callMode, backendUrl, storageKey]);
  
  // === 检查后端可用性 ===
  const checkBackendAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const result = await checkBackendProxyAvailability(backendUrl);
      setBackendAvailable(result.available);
      return result.available;
    } catch (e) {
      setBackendAvailable(false);
      return false;
    }
  }, [backendUrl]);
  
  // 返回扩展后的状态和处理器
  return {
    states: {
      // 原有
      providerId,
      apiKey,
      baseUrl,
      model,
      status,
      error,
      modelOptions,
      tokenUsage,
      // 新增
      callMode,
      backendUrl,
      backendAvailable,
    },
    handlers: {
      // 原有
      setProviderId,
      setApiKey,
      setBaseUrl,
      setModel,
      handleConnect,  // 稍后修改
      handleDisconnect,
      fetchModels,
      // 新增
      setCallMode,
      setBackendUrl,
      checkBackendAvailability,
    },
    llmClient,
  };
};
```

#### 任务 4.2：修改连接逻辑
**继续修改**: `src/hooks/useLlmConnectorLogic.ts`

```typescript
const handleConnect = useCallback(async () => {
  setStatus('connecting');
  setError(null);
  
  try {
    let client: LlmClient;
    
    // === 根据调用模式选择 Provider ===
    if (callMode === 'backend') {
      // 后端代理模式
      client = await createBackendProxyProvider(backendUrl);
      
    } else {
      // 前端直调模式
      switch (providerId) {
        case 'openai':
          if (!apiKey) throw new Error('OpenAI API key is required');
          client = createOpenaiProvider(apiKey, baseUrl);
          break;
          
        case 'anthropic':
          if (!apiKey) throw new Error('Anthropic API key is required');
          client = createAnthropicProvider(apiKey);
          break;
          
        case 'gemini':
          if (!apiKey) throw new Error('Gemini API key is required');
          client = createGeminiProvider(apiKey);
          break;
          
        case 'webllm':
          client = await createWebLlmProvider(model);
          break;
          
        case 'chrome-ai':  // 🆕
          client = await createChromeAIProvider();
          break;
          
        case 'lmstudio':   // 🆕
          if (!baseUrl) throw new Error('LM Studio base URL is required');
          client = await createLMStudioProvider(baseUrl, model);
          break;
          
        case 'siliconflow': // 🆕
          if (!apiKey) throw new Error('Silicon Flow API key is required');
          client = createSiliconFlowProvider(apiKey, model);
          break;
          
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }
    }
    
    setLlmClient(client);
    setStatus('connected');
    
  } catch (err) {
    const error = err as Error;
    setError(error);
    setStatus('error');
    console.error('Connection failed:', error);
  }
}, [callMode, providerId, apiKey, baseUrl, model, backendUrl]);
```

---

### Day 5: 更新 UI 组件

#### 任务 5.1：扩展配置面板
**创建新文件**: `src/components/CallModeSelector.tsx`

```typescript
import React from 'react';
import type { CallMode } from '../types';

interface CallModeSelectorProps {
  callMode: CallMode;
  onChange: (mode: CallMode) => void;
  disabled?: boolean;
}

export const CallModeSelector: React.FC<CallModeSelectorProps> = ({
  callMode,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="call-mode-selector">
      <label>调用模式</label>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            value="frontend"
            checked={callMode === 'frontend'}
            onChange={(e) => onChange(e.target.value as CallMode)}
            disabled={disabled}
          />
          <span>前端直调</span>
          <small>（API Key 在浏览器）</small>
        </label>
        
        <label>
          <input
            type="radio"
            value="backend"
            checked={callMode === 'backend'}
            onChange={(e) => onChange(e.target.value as CallMode)}
            disabled={disabled}
          />
          <span>后端代理</span>
          <small>（API Key 在服务器）</small>
        </label>
      </div>
    </div>
  );
};
```

#### 任务 5.2：条件显示配置项
**修改**: `src/components/ConfigPanel.tsx` (示例)

```typescript
import { useLlmConnector } from '../hooks/useLlmConnector';
import { CallModeSelector } from './CallModeSelector';
import { PROVIDER_REGISTRY, getAvailableProviders } from '../registry/providers';

export const ConfigPanel: React.FC = () => {
  const { states, handlers } = useLlmConnector('my-chat');
  
  const { 
    callMode, 
    providerId, 
    apiKey, 
    baseUrl, 
    backendUrl,
    backendAvailable,
  } = states;
  
  const {
    setCallMode,
    setProviderId,
    setApiKey,
    setBaseUrl,
    setBackendUrl,
    checkBackendAvailability,
    handleConnect,
  } = handlers;
  
  const availableProviders = getAvailableProviders(callMode);
  const currentProvider = PROVIDER_REGISTRY[providerId];
  
  return (
    <div className="config-panel">
      {/* 调用模式选择 */}
      <CallModeSelector
        callMode={callMode}
        onChange={setCallMode}
        disabled={states.status === 'connected'}
      />
      
      {/* Provider 选择 */}
      {callMode === 'frontend' && (
        <div>
          <label>AI Provider</label>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value as ProviderId)}
          >
            {availableProviders.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name} - {provider.description}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* API Key（需要的话）*/}
      {callMode === 'frontend' && currentProvider.requiresApiKey && (
        <div>
          <label>API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入 API Key"
          />
        </div>
      )}
      
      {/* Base URL（需要的话）*/}
      {callMode === 'frontend' && currentProvider.requiresBaseUrl && (
        <div>
          <label>Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="例如: http://localhost:1234/v1"
          />
        </div>
      )}
      
      {/* 后端 URL */}
      {callMode === 'backend' && (
        <div>
          <label>Backend URL</label>
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="/api/ai/proxy"
          />
          <button onClick={checkBackendAvailability}>
            测试连接
          </button>
          {backendAvailable && <span>✅ 后端可用</span>}
        </div>
      )}
      
      {/* 连接按钮 */}
      <button onClick={handleConnect}>
        {states.status === 'connecting' ? '连接中...' : '连接'}
      </button>
    </div>
  );
};
```

---

## 🖥️ Phase 3: 后端实现（Day 6-7）

### Day 6: Next.js API Routes

#### 任务 6.1：健康检查接口
**文件**: `src/app/api/ai/proxy/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // 检查必要的环境变量
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    // 或其他 Provider 的 Key
  ];
  
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );
  
  if (missing.length > 0) {
    return NextResponse.json({
      ok: false,
      error: `Missing environment variables: ${missing.join(', ')}`,
    }, { status: 500 });
  }
  
  return NextResponse.json({
    ok: true,
    models: ['gpt-4o', 'gpt-3.5-turbo'],  // 可配置
    timestamp: new Date().toISOString(),
  });
}
```

#### 任务 6.2：聊天接口（非流式）
**文件**: `src/app/api/ai/proxy/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TokenJS } from 'token.js';

// 类型定义
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求
    const body: ChatRequest = await request.json();
    const { messages, model = 'gpt-4o', temperature, max_tokens, stream = false } = body;
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        error: 'Messages are required',
      }, { status: 400 });
    }
    
    // 2. 创建 TokenJS 实例（使用服务器环境变量中的 API Key）
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'Server configuration error',
      }, { status: 500 });
    }
    
    const tokenJs = new TokenJS({
      provider: 'openai',
      apiKey: apiKey,
    });
    
    // 3. 调用 LLM
    if (stream) {
      // 流式响应
      const response = await tokenJs.chat.completions.create({
        provider: 'openai',
        model,
        messages,
        temperature,
        max_tokens,
        stream: true,
      });
      
      // 创建 SSE 流
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const data = JSON.stringify(chunk);
              controller.enqueue(
                encoder.encode(`data: ${data}\n\n`)
              );
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });
      
      return new NextResponse(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
      
    } else {
      // 非流式响应
      const response = await tokenJs.chat.completions.create({
        provider: 'openai',
        model,
        messages,
        temperature,
        max_tokens,
        stream: false,
      });
      
      return NextResponse.json({
        choices: response.choices,
        usage: response.usage,
        model: response.model,
      });
    }
    
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
```

---

### Day 7: 后端配置和环境变量

#### 任务 7.1：创建环境变量模板
**文件**: `.env.example`

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GEMINI_API_KEY=...

# 硅基流动
SILICONFLOW_API_KEY=...

# 默认 Provider（可选）
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4o
```

#### 任务 7.2：多 Provider 支持
**修改**: `src/app/api/ai/proxy/chat/route.ts`

```typescript
// 在 POST 函数开头添加
const providerId = process.env.DEFAULT_AI_PROVIDER || 'openai';

let tokenJs: TokenJS;

switch (providerId) {
  case 'openai':
    tokenJs = new TokenJS({
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!,
    });
    break;
    
  case 'anthropic':
    tokenJs = new TokenJS({
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    break;
    
  case 'siliconflow':
    tokenJs = new TokenJS({
      provider: 'openai',
      apiKey: process.env.SILICONFLOW_API_KEY!,
      baseURL: 'https://api.siliconflow.cn/v1',
    });
    break;
    
  default:
    return NextResponse.json({
      error: `Unsupported provider: ${providerId}`,
    }, { status: 400 });
}
```

---

## 🧪 Phase 4: 集成与测试（Day 8-9）

### Day 8: 集成到 Google Audio

#### 任务 8.1：安装 llm-connector 包
```bash
npm install llm-connector
# 或
pnpm add llm-connector
```

#### 任务 8.2：修改 useChat Hook
**文件**: `src/hooks/useChat.ts`

**原有实现** (简化):
```typescript
export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const sendMessage = async (content: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [...] }),
    });
    // ...
  };
  
  return { messages, sendMessage };
};
```

**新实现** (使用 LlmConnector):
```typescript
import { useLlmConnector } from 'llm-connector';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { llmClient, states } = useLlmConnector('google-audio-chat');
  
  const sendMessage = async (content: string) => {
    if (!llmClient) {
      throw new Error('LLM client not connected');
    }
    
    const newMessages = [
      ...messages,
      { role: 'user', content },
    ];
    
    setMessages(newMessages);
    
    try {
      const result = await llmClient.chat({
        messages: newMessages,
        stream: true,
      });
      
      let assistantMessage = '';
      
      for await (const chunk of result) {
        const delta = chunk.choices[0].delta.content || '';
        assistantMessage += delta;
        
        setMessages([
          ...newMessages,
          { role: 'assistant', content: assistantMessage },
        ]);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
    }
  };
  
  return { messages, sendMessage, llmStatus: states.status };
};
```

#### 任务 8.3：添加 Provider
**文件**: `src/app/layout.tsx`

```typescript
import { LlmConnectorProvider } from 'llm-connector';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <LlmConnectorProvider
          name="google-audio-chat"
          storageKey="google-audio-llm-config"
        >
          {children}
        </LlmConnectorProvider>
      </body>
    </html>
  );
}
```

---

### Day 9: 测试和文档

#### 任务 9.1：功能测试清单

**测试用例**:
```markdown
## Provider 测试

### Chrome AI
- [ ] 检测可用性
- [ ] 连接成功
- [ ] 单轮对话
- [ ] 多轮对话
- [ ] 错误处理

### LM Studio
- [ ] 服务器连接
- [ ] 模型列表获取
- [ ] 对话功能
- [ ] 连接超时处理

### Silicon Flow
- [ ] API Key 验证
- [ ] 模型选择
- [ ] 对话功能
- [ ] 流式响应

### Backend Proxy
- [ ] 健康检查
- [ ] 非流式响应
- [ ] 流式响应
- [ ] 错误处理

## 调用模式测试
- [ ] 前端直调 → 后端代理切换
- [ ] 配置持久化
- [ ] 多实例隔离
```

#### 任务 9.2：创建使用文档
**文件**: `docs/AI api开发/使用指南.md`

```markdown
# AI API 适配器使用指南

## 快速开始

### 1. 安装依赖
\`\`\`bash
npm install llm-connector
\`\`\`

### 2. 添加 Provider
\`\`\`typescript
import { LlmConnectorProvider } from 'llm-connector';

<LlmConnectorProvider name="my-chat" storageKey="chat-config">
  <App />
</LlmConnectorProvider>
\`\`\`

### 3. 使用 Hook
\`\`\`typescript
import { useLlmConnector } from 'llm-connector';

const { llmClient, states, handlers } = useLlmConnector('my-chat');

// 配置
handlers.setProviderId('openai');
handlers.setApiKey('sk-...');
await handlers.handleConnect();

// 对话
const result = await llmClient.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
});
\`\`\`

## 各 Provider 配置示例

见完整文档...
```

---

## ✅ 验收标准

### 功能完整性
- [ ] 4个新 Provider 全部实现
- [ ] 前端/后端模式切换正常
- [ ] 配置持久化正常
- [ ] 多实例隔离正常

### 代码质量
- [ ] TypeScript 无类型错误
- [ ] 所有 Provider 有单元测试
- [ ] 代码覆盖率 > 80%
- [ ] ESLint 无错误

### 文档完整性
- [ ] API 文档完整
- [ ] 使用示例清晰
- [ ] 故障排查指南

### 性能
- [ ] 首次连接 < 3秒
- [ ] 对话响应延迟 < 1秒
- [ ] 无内存泄漏

---

## 📚 下一步

完成后继续创建:
1. **AI-Adapter-Integration.md** - 详细集成指南
2. **AI-Adapter-Testing.md** - 测试用例和自动化
3. **AI-Adapter-Deployment.md** - 部署和运维

---

**文档完成** ✅
