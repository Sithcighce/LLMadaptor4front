# Hooks 架构设计文档

## ⚠️ 重要：避免状态管理陷阱

### 问题描述
在使用 LLM Connector 时，容易出现状态实例分裂的问题，导致组件间状态不同步。

### ❌ 错误用法 - 会导致状态分裂
```tsx
// 危险：直接使用内部 Hook
import { useLlmConnectorLogic } from '../hooks/useLlmConnectorLogic';

const BadComponent = () => {
  const logic = useLlmConnectorLogic(); // 创建独立状态实例！
  // 这会导致状态不同步问题
};
```

### ✅ 正确用法 - 使用公共接口
```tsx
// 方法1：连接管理
import { useConnectionManager } from '../hooks/useConnectionManager';

const ConnectionComponent = () => {
  const { status, apiKey, handleConnect } = useConnectionManager();
  return <button onClick={handleConnect}>连接</button>;
};

// 方法2：完整功能访问
import { useLlmConnector } from '../hooks/useLlmConnector';

const FullFeaturedComponent = () => {
  const { llmClient, states, handlers } = useLlmConnector();
  return <div>完整的功能界面</div>;
};
```

### 🏗️ 状态管理架构说明
```
App.tsx
├── LlmConnectorProvider (状态容器)
│   └── useLlmConnectorLogic() → 唯一状态实例
│
├── 你的组件
│   ├── useConnectionManager() ✅ 通过 Context 访问
│   └── useLlmConnector() ✅ 通过 Context 访问
```

### Hook 职责分工
- **`useLlmConnectorLogic`** ⚠️ 内部实现，仅供 Provider 使用
- **`useLlmConnector`** ✅ 完整功能访问的公共接口
- **`useConnectionManager`** ✅ 连接管理的专用接口

---

## 🎯 设计原则

### 为什么这样划分？

我们将 LLM Connector 的功能按照**关注点分离**的原则进行了模块化设计：

1. **useLlmConnectorLogic** - 核心基础设施
   - 管理 `llmClient` 实例（最重要！）
   - 处理基础配置和状态管理
   - 提供持久化存储功能

2. **useConnectionManager** - 连接管理专用
   - 服务于当前的三个基础组件
   - 只处理 API Key、Provider、Model 选择等连接相关逻辑
   - 不包含聊天、高级配置等业务逻辑

### 📡 使用场景分析

#### 场景1：纯"后端"调用 - 逻辑触发
```typescript
// 直接使用核心基础设施
const { llmClient } = useLlmConnectorLogic();

// 简单 API 调用
const result = await llmClient.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  stream: false
});
```
**特点：**
- ✅ 无需消息历史管理
- ✅ 无需 UI 状态管理  
- ✅ 直接使用 `llmClient.chat()` 即可
- ✅ 可选择性使用工具函数辅助

#### 场景2：聊天界面调用 - UI 交互
```typescript
// 需要完整的聊天管理功能
const {
  messages, isStreaming, sendMessage, 
  clearMessages, abortResponse, error
} = useChatManager(); // 待开发
```
**特点：**
- 🎯 需要消息历史管理
- 🎯 需要流式响应处理
- 🎯 需要错误处理和恢复
- 🎯 需要 UI 状态同步
- 🎯 需要用户交互支持

## 🏗️ 当前架构

```
🔥 useLlmConnectorLogic (核心)
├── 管理 llmClient 实例
├── 基础状态管理
└── 配置持久化

🎯 useConnectionManager (功能层)
├── 连接状态管理
├── 模型获取和选择
└── 为基础 UI 组件服务
```

## 🚀 扩展计划 (TODO)

当需要添加新功能时，请创建对应的专用 Hook：

### 🎯 高优先级 - 即将开发：

1. **useChatManager** - 聊天功能管理 ⭐⭐⭐⭐⭐
   ```typescript
   // 用于聊天界面组件
   // 整合已提取的工具函数：messageFormatter, streamProcessor, abortController 等
   const { 
     messages, sendMessage, isStreaming,
     clearMessages, retryLastMessage, abortResponse,
     error, tokenUsage 
   } = useChatManager();
   ```
   **基于现有工具函数构建：**
   - ✅ `messageFormatter` - 消息格式转换
   - ✅ `streamProcessor` - 流式响应处理
   - ✅ `abortController` - 中断控制
   - ✅ `errorHandler` - 错误处理
   - ✅ `keyboardShortcuts` - 快捷键支持

2. **useAdvancedSettings** - 高级参数配置
   ```typescript
   // 用于设置面板组件  
   // 管理 temperature, topK, topP, systemPrompt 等参数
   const { config, updateConfig } = useAdvancedSettings();
   ```

3. **useToolRegistry** - 工具注册管理
   ```typescript
   // 用于工具管理界面
   // 管理 MCP 工具、自定义工具等
   const { tools, registerTool, unregisterTool } = useToolRegistry();
   ```

4. **useRAGManager** - RAG 功能
   ```typescript
   // 用于 RAG 配置界面
   // 管理向量数据库、检索配置等
   const { ragConfig, updateRAGConfig } = useRAGManager();
   ```

## 📐 设计规范

### 新 Hook 的创建规范：

1. **单一职责** - 一个 Hook 只管一个功能域
2. **依赖核心** - 所有功能 Hook 都从 `useLlmConnectorLogic` 获取 `llmClient`
3. **接口简洁** - 只暴露当前功能域需要的状态和方法
4. **向后兼容** - 不影响现有组件的使用

### 示例模板：
```typescript
export const useNewFeature = () => {
  const { llmClient } = useLlmConnectorLogic(); // 获取核心 client
  
  // 该功能域的独立状态
  const [featureState, setFeatureState] = useState();
  
  // 该功能域的业务逻辑
  const handleFeatureAction = useCallback(() => {
    if (llmClient) {
      // 使用 llmClient 进行操作
    }
  }, [llmClient]);
  
  return { featureState, handleFeatureAction };
};
```

## 🎯 最终目标架构

```
🔥 Core Layer
└── useLlmConnectorLogic (llmClient 管理)

🛠️ Utils Layer (已完成！)
├── messageFormatter - 消息格式转换
├── streamProcessor - 流式响应处理
├── abortController - 中断控制
├── errorHandler - 错误处理
├── keyboardShortcuts - 快捷键支持
└── 其他工具函数...

🎯 Feature Layer  
├── useConnectionManager (✅ 已完成)
├── useChatManager (� 基于工具函数构建)
├── useAdvancedSettings (📋 待开发)  
├── useToolRegistry (📋 待开发)
└── useRAGManager (📋 待开发)

🎨 UI Layer
├── 基础组件: ConnectionForm, ModelSelect, TokenUsage (✅)
├── 聊天组件: ChatInterface, MessageBubble (📋 待开发) 
├── 配置组件: SettingsPanel, ParameterSlider (📋 待开发)
└── 高级组件: ToolManager, RAGConfig (📋 待开发)
```

## 💡 开发者指南

- 开发新功能时，先考虑创建对应的专用 Hook
- 所有 Hook 都应该依赖 `useLlmConnectorLogic` 获取 `llmClient`
- UI 组件只使用对应功能域的 Hook，不直接使用核心 Hook
- 保持接口简洁，避免暴露不必要的内部状态

## 📝 使用示例

### 当前基础组件的使用：
```typescript
// ConnectionForm, ModelSelect, TokenUsage 组件
const MyConnectionComponent = () => {
  const {
    providerId, apiKey, model, status,
    setApiKey, setModel, handleConnect,
    modelOptions, tokenUsage
  } = useConnectionManager(); // 使用专用 Hook
  
  // 只关心连接相关的逻辑
};
```

### 未来功能组件的使用：
```typescript
// 聊天组件
const ChatComponent = () => {
  const { messages, sendMessage } = useChatManager();
  // 聊天逻辑
};

// 设置组件
const SettingsPanel = () => {
  const { config, updateConfig } = useAdvancedSettings();
  // 参数配置逻辑
};
```

## 🔧 核心原则

> **所有功能都围绕 `llmClient` 构建**
> 
> `useLlmConnectorLogic` 提供 `llmClient` 实例，其他所有 Hook 都基于这个实例来实现各自的功能。这确保了架构的一致性和可扩展性。

## 📚 相关文档

- 📋 [开发待办事项](./todo) - 详细的开发计划和优先级
- 🎯 [使用场景分析](./USAGE_SCENARIOS.md) - 不同使用场景的路径选择指南
- 🛠️ [工具函数提取报告](../../CHAT_UTILS_EXTRACTION.md) - 从RCB中提取的核心工具函数

---

*最后更新：2025年9月30日*
*版本：v1.1 - 增加使用场景分析*