# LLM Connector 使用场景分析

## 📊 场景分类与路径选择

基于项目的分层架构，我们将使用场景分为两大类，每种场景有不同的推荐使用路径。

### 🎯 场景决策树

```
用户需求
    │
    ├─ 需要UI交互？
    │   ├─ 是 → 场景2：聊天界面调用
    │   └─ 否 → 场景1：纯后端调用
    │
    └─ 需要消息历史管理？
        ├─ 是 → 场景2：聊天界面调用
        └─ 否 → 场景1：纯后端调用
```

---

## 🔧 场景1：纯"后端"调用 - 逻辑触发

### 使用特征
- ✅ 单次或少量 API 调用
- ✅ 无需UI状态同步
- ✅ 无需消息历史管理
- ✅ 程序化触发（定时任务、事件响应等）
- ✅ 服务端集成或批处理场景

### 推荐使用路径

#### 方式1：直接使用核心基础设施（推荐）
```typescript
import { useLlmConnectorLogic } from './hooks/useLlmConnectorLogic';

const MyBackendComponent = () => {
  const { llmClient } = useLlmConnectorLogic();
  
  const handleLogicTrigger = async () => {
    if (!llmClient) {
      console.error('LLM Client not connected');
      return;
    }
    
    // 简单调用
    const result = await llmClient.chat({
      messages: [
        { role: 'system', content: '你是一个helpful assistant' },
        { role: 'user', content: '分析这个数据...' }
      ],
      stream: false
    });
    
    console.log('Response:', result.text);
    return result;
  };
  
  return (
    <button onClick={handleLogicTrigger}>
      Trigger LLM Analysis
    </button>
  );
};
```

#### 方式2：配合工具函数使用（高级）
```typescript
import { useLlmConnectorLogic } from './hooks/useLlmConnectorLogic';
import { useAbortController } from '../utils/abortController';
import { createUserMessage, toChatMessages } from '../utils/messageFormatter';

const AdvancedBackendComponent = () => {
  const { llmClient } = useLlmConnectorLogic();
  const { createController, abort } = useAbortController();
  
  const handleAdvancedLogic = async () => {
    if (!llmClient) return;
    
    // 使用工具函数创建消息
    const userMsg = createUserMessage('处理这个任务...');
    const messages = toChatMessages([userMsg]);
    
    // 支持中断的调用
    const controller = createController();
    
    try {
      const result = await llmClient.chat({
        messages,
        stream: false,
        // 注意：当前 LlmClient 还不支持 AbortSignal，需要扩展
      });
      
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Request failed:', error);
      }
    }
  };
  
  return (
    <div>
      <button onClick={handleAdvancedLogic}>Start</button>
      <button onClick={abort}>Abort</button>
    </div>
  );
};
```

### 使用场景示例
- **数据分析服务**：定期调用LLM分析业务数据
- **自动化工作流**：在特定事件触发时调用LLM处理
- **批处理任务**：批量处理文档、翻译、总结等
- **API 集成**：将LLM功能集成到现有API服务中

---

## 💬 场景2：聊天界面调用 - UI交互

### 使用特征  
- 🎯 需要消息历史管理
- 🎯 需要流式响应显示
- 🎯 需要用户交互界面
- 🎯 需要错误处理和恢复
- 🎯 需要状态同步（输入中、等待响应等）
- 🎯 需要用户体验优化（重试、清空、导出等）

### 推荐使用路径

#### 使用 useChatManager（待开发）
```typescript
import { useChatManager } from './hooks/useChatManager';

const ChatComponent = () => {
  const {
    // 核心状态
    messages,
    isStreaming,
    error,
    
    // 核心操作
    sendMessage,
    clearMessages,
    retryLastMessage,
    abortResponse,
    
    // 辅助功能
    tokenUsage,
    shortcuts,
  } = useChatManager({
    // 可选配置
    enableAudio: false,
    maxHistorySize: 50,
    streamConfig: {
      outputType: 'chunk',
      outputSpeed: 30,
    },
  });
  
  return (
    <div className="chat-interface">
      {/* 消息历史 */}
      <div className="messages">
        {messages.map((msg, index) => (
          <MessageBubble key={msg.id || index} message={msg} />
        ))}
      </div>
      
      {/* 流式响应指示器 */}
      {isStreaming && <StreamingIndicator />}
      
      {/* 错误显示 */}
      {error && (
        <ErrorBanner 
          error={error} 
          onRetry={retryLastMessage}
        />
      )}
      
      {/* 输入区域 */}
      <ChatInput 
        onSendMessage={sendMessage}
        disabled={isStreaming}
        onAbort={abortResponse}
      />
      
      {/* 操作按钮 */}
      <div className="chat-actions">
        <button onClick={clearMessages}>Clear</button>
        <button onClick={retryLastMessage}>Retry</button>
      </div>
      
      {/* Token使用统计 */}
      {tokenUsage && (
        <TokenUsageDisplay usage={tokenUsage} />
      )}
    </div>
  );
};
```

### UI组件架构（待开发）
```typescript
// 主聊天界面
<ChatInterface />
  ├── <MessageList messages={messages} />
  │   └── <MessageBubble message={msg} />
  ├── <StreamingIndicator isVisible={isStreaming} />
  ├── <ErrorBanner error={error} onRetry={retryLastMessage} />
  ├── <ChatInput onSend={sendMessage} disabled={isStreaming} />
  └── <ChatActions onClear={clearMessages} onRetry={retryLastMessage} />
```

### 功能特性
- **实时流式显示**：基于 `streamProcessor` 工具函数
- **智能错误恢复**：基于 `errorHandler` 工具函数
- **键盘快捷键**：基于 `keyboardShortcuts` 工具函数
- **消息持久化**：自动保存到 localStorage
- **中断控制**：基于 `abortController` 工具函数

---

## 🎯 选择指南

### 何时使用场景1（纯后端调用）？
- ✅ 你只需要调用LLM API获取结果
- ✅ 不需要显示消息历史
- ✅ 不需要流式响应的视觉效果
- ✅ 在后台服务或定时任务中使用
- ✅ 集成到现有的非聊天界面中

### 何时使用场景2（聊天界面）？
- 🎯 你需要构建聊天机器人界面
- 🎯 需要显示完整的对话历史
- 🎯 需要流式响应的打字效果
- 🎯 需要用户友好的错误处理
- 🎯 需要丰富的用户交互功能

---

## 🚀 实现优先级

### 立即可用 ✅
- **场景1**：直接使用 `useLlmConnectorLogic` 
- **场景1**：配合现有工具函数使用

### 下一步开发 🔄
- **场景2**：开发 `useChatManager` Hook
- **场景2**：开发聊天UI组件库

### 核心优势 💪

#### 对于场景1：
- 🔥 **零学习成本**：直接使用 `llmClient.chat()` 
- ⚡ **高性能**：无额外状态管理开销
- 🎯 **精确控制**：完全控制请求参数和响应处理

#### 对于场景2：
- 🛠️ **工具函数就绪**：所有核心逻辑已提取完成
- 🏗️ **架构稳定**：基于验证过的核心基础设施
- 🎨 **用户体验优先**：专注于聊天界面的用户体验
- 🔄 **渐进增强**：可以逐步添加高级功能

---

## 💡 开发建议

1. **先满足场景1**：当前架构已完全支持
2. **重点开发场景2**：基于现有工具函数快速构建
3. **保持架构清晰**：两种场景使用不同的Hook，避免混合
4. **用户选择自由**：用户可以根据需求选择合适的使用方式

---

*文档版本：v1.0*  
*创建时间：2025年9月30日*  
*基于：完整工具函数库 + 稳定核心架构*