# Hooks API 参考

## useLlmConnector

核心Hook，提供LLM连接器的状态和操作接口。

### 签名

```typescript
function useLlmConnector(clientName?: string): LlmConnectorContextType
```

### 参数

- `clientName` (可选): 指定Client名称，用于显式查找特定实例

### 返回值

```typescript
interface LlmConnectorContextType {
  // 核心状态
  states: {
    providerId: 'openai' | 'anthropic' | 'gemini' | 'webllm';
    apiKey: string;
    baseUrl: string;
    model: string;
    status: ConnectorStatus;
    error: Error | null;
    modelOptions: string[];
    tokenUsage: TokenUsage | null;
    llmClient: LlmClient | null;
  };

  // 操作函数
  handlers: {
    setProviderId: (id: string) => void;
    setApiKey: (key: string) => void;
    setBaseUrl: (url: string) => void;
    setModel: (model: string) => void;
    handleConnect: () => Promise<void>;
    handleDisconnect: () => void;
    resetError: () => void;
  };

  // 便捷访问
  llmClient: LlmClient | null;
}
```

### 使用示例

```tsx
// Context模式 - 自动查找最近Provider
function MyComponent() {
  const { llmClient, states, handlers } = useLlmConnector();
  
  const sendMessage = async () => {
    if (!llmClient) return;
    const result = await llmClient.chat({
      messages: [{ role: 'user', content: 'Hello!' }]
    });
    console.log(result.text);
  };
}

// 显式名称模式 - 指定Client名称
function CrossComponentAccess() {
  const { llmClient } = useLlmConnector('chat-client');
  const { states } = useLlmConnector('summary-client');
}
```

## useLlmConnectorLogic

核心逻辑Hook，通常不直接使用，主要用于Provider内部。

### 签名

```typescript
function useLlmConnectorLogic(storageKey?: string): LlmConnectorContextType
```

### 参数

- `storageKey` (可选): localStorage存储键，默认为'llm-connector-config'

### useConnectionManager

封装连接管理逻辑的Hook，支持显式Client绑定。

### 签名

```typescript
function useConnectionManager(clientName?: string): ConnectionManagerReturn
```

### 返回值

```typescript
interface ConnectionManagerReturn {
  // 连接状态
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  
  // 配置状态  
  providerId: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  modelOptions: string[];
  
  // 操作函数
  connect: () => Promise<void>;
  disconnect: () => void;
  updateConfig: (config: Partial<ProviderConfig>) => void;
  
  // Client实例
  llmClient: LlmClient | null;
}
```

### Hook组合模式

```tsx
function CustomUI() {
  // 组合使用多个Hook
  const { llmClient } = useLlmConnector('main');
  const connectionManager = useConnectionManager('main');
  
  return (
    <div>
      <p>Status: {connectionManager.isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={connectionManager.connect}>Connect</button>
    </div>
  );
}
```

## 错误处理

所有Hook都包含完善的错误处理机制：

```tsx
function ErrorHandlingExample() {
  try {
    const { llmClient } = useLlmConnector('non-existent-client');
  } catch (error) {
    // 错误信息：Client "non-existent-client" not found. Available clients: [default, chat]
    console.error(error.message);
  }
}
```

## TypeScript支持

所有Hook都提供完整的TypeScript类型定义，确保类型安全：

```tsx
import type { 
  LlmConnectorContextType,
  ConnectionManagerReturn,
  ConnectorStatus 
} from 'llm-connector';

const MyComponent: React.FC = () => {
  const context: LlmConnectorContextType = useLlmConnector();
  // 完整的类型提示和检查
};
```