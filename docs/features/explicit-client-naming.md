# 显式Client名称传入功能

## 概述

显式Client名称传入功能是LLM Connector的核心创新之一，解决了React Context "最近的上级"机制在复杂多实例场景下的可靠性问题。

## 问题背景

在传统的React Context模式中，组件只能访问组件树中"最近的上级"Provider提供的Context值。这在复杂应用中可能导致：

1. **组件绑定不确定性** - 无法确定组件绑定到哪个Provider实例
2. **跨页面绑定问题** - 不同页面的组件可能意外共享状态
3. **开发调试困难** - 难以追踪组件与Provider的绑定关系

## 解决方案

### 双模式支持

```tsx
// 传统Context模式 - 自动查找最近的Provider
const { llmClient } = useLlmConnector();

// 显式名称模式 - 直接指定Client名称
const { llmClient } = useLlmConnector('my-chat-client');
```

### 架构设计

```
ClientRegistry (全局)
├── "default" → LlmConnectorContextType
├── "chat-client" → LlmConnectorContextType
├── "summary-client" → LlmConnectorContextType
└── "api-test-1" → LlmConnectorContextType
```

## 使用示例

### 基础用法

```tsx
// 1. 创建命名Provider
<LlmConnectorProvider name="chat" storageKey="chat-config">
  <ChatInterface />
</LlmConnectorProvider>

<LlmConnectorProvider name="summary" storageKey="summary-config">
  <SummaryInterface />
</LlmConnectorProvider>

// 2. 在任意位置访问特定Client
function CrossComponentAccess() {
  const { llmClient: chatClient } = useLlmConnector('chat');
  const { llmClient: summaryClient } = useLlmConnector('summary');
  
  // 可以同时访问多个Client实例
}
```

### 组件级别显式绑定

```tsx
// UI组件支持显式绑定
<ConnectionFormZh clientName="chat" />
<ModelSelectZh clientName="chat" />
<TokenUsageZh clientName="chat" />
```

## 核心实现

### ClientRegistry

```typescript
class ClientRegistry {
  private static clients = new Map<string, LlmConnectorContextType>();

  static register(name: string, client: LlmConnectorContextType): void;
  static get(name: string): LlmConnectorContextType | undefined;
  static getOrThrow(name: string): LlmConnectorContextType;
}
```

### 增强的Provider

```tsx
export const LlmConnectorProvider: React.FC<{
  name?: string;           // Client名称
  storageKey?: string;     // 存储键
  children: ReactNode;
}> = ({ name = 'default', storageKey, children }) => {
  // 自动注册到ClientRegistry
  useEffect(() => {
    ClientRegistry.register(name, logic);
    return () => ClientRegistry.unregister(name);
  }, [name, logic]);
}
```

## 优势

### 1. 确定性绑定
- 明确指定组件绑定的Client实例
- 避免Context查找的不确定性

### 2. 跨组件树访问
- 不受React组件树结构限制
- 可以从任意位置访问任意命名Client

### 3. 配置隔离
- 每个实例使用独立的存储键
- 完全隔离的配置和状态

### 4. 开发友好
- 清晰的错误提示
- 调试时可查看所有注册Client

## 测试验证

项目包含完整的测试套件验证此功能：

- **Context模式测试** - 验证传统模式正常工作
- **显式名称测试** - 验证命名Client查找
- **多实例隔离测试** - 验证配置和状态隔离
- **跨组件访问测试** - 验证跨树访问能力

## 最佳实践

### 命名规范
```tsx
// 推荐的命名规范
<LlmConnectorProvider name="chat" />        // 功能描述
<LlmConnectorProvider name="summary" />     // 功能描述
<LlmConnectorProvider name="api-test-1" />  // 测试用例
```

### 存储键管理
```tsx
// 使用描述性的存储键
<LlmConnectorProvider 
  name="chat" 
  storageKey="chat-client-config" 
/>
```

### 错误处理
```tsx
try {
  const { llmClient } = useLlmConnector('non-existent');
} catch (error) {
  // 友好的错误信息：Client "non-existent" not found. Available clients: [chat, summary]
}
```

---

这个功能彻底解决了React Context"最近的上级"可靠性问题，为复杂应用提供了确定性的Client绑定机制。