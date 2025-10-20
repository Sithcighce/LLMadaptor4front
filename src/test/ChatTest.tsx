import React from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { ChatInterface } from '../components/ChatInterface';
import { ConnectionFormZh } from '../components/ConnectionForm/index.zh';
import { ModelSelectZh } from '../components/ModelSelect/index.zh';

/**
 * 聊天功能测试页面
 */
export const ChatTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 ChatManager + ChatInterface 功能测试</h1>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>✅ 新功能介绍</h3>
        <ul>
          <li><strong>useChatManager Hook</strong> - 完整的聊天状态管理</li>
          <li><strong>ChatInterface 组件</strong> - 即用即得的聊天界面</li>
          <li><strong>流式响应支持</strong> - 实时显示AI回复过程</li>
          <li><strong>消息持久化</strong> - 自动保存聊天历史</li>
          <li><strong>多实例支持</strong> - 每个ChatInterface独立管理</li>
        </ul>
      </div>

      {/* 双实例测试 - 展示显式Client名称功能 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 聊天实例1 */}
        <LlmConnectorProvider name="chat-1" storageKey="chat-1-config">
          <div>
            <h3>🤖 聊天实例1 - 对话模式</h3>
            <div style={{ marginBottom: '20px' }}>
              <ConnectionFormZh />
              <ModelSelectZh />
            </div>
            <ChatInterface
              clientName="chat-1"
              storageKey="chat-1-messages"
              placeholder="问点什么吧..."
              sendButtonText="发送"
              clearButtonText="清空对话"
            />
          </div>
        </LlmConnectorProvider>

        {/* 聊天实例2 */}
        <LlmConnectorProvider name="chat-2" storageKey="chat-2-config">
          <div>
            <h3>📝 聊天实例2 - 总结模式</h3>
            <div style={{ marginBottom: '20px' }}>
              <ConnectionFormZh />
              <ModelSelectZh />
            </div>
            <ChatInterface
              clientName="chat-2"
              storageKey="chat-2-messages"
              placeholder="请输入需要总结的内容..."
              sendButtonText="总结"
              clearButtonText="清空"
            />
          </div>
        </LlmConnectorProvider>
      </div>

      {/* 功能说明 */}
      <div style={{ 
        marginTop: '30px',
        padding: '16px', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '8px'
      }}>
        <h3>🧪 测试要点</h3>
        <ol>
          <li><strong>独立配置</strong>: 两个实例可以连接不同的API和模型</li>
          <li><strong>消息隔离</strong>: 聊天历史完全分离，互不影响</li>
          <li><strong>流式响应</strong>: 观察AI回复的实时生成过程</li>
          <li><strong>状态管理</strong>: 刷新页面后消息历史自动恢复</li>
          <li><strong>错误处理</strong>: 网络错误或API错误的友好提示</li>
          <li><strong>中断功能</strong>: 在流式响应过程中可以随时停止</li>
        </ol>
      </div>

      {/* 使用代码示例 */}
      <div style={{ 
        marginTop: '30px',
        padding: '16px', 
        backgroundColor: '#fff3e0', 
        borderRadius: '8px'
      }}>
        <h3>💻 使用示例</h3>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
{`// 1. 基础聊天界面
<LlmConnectorProvider>
  <ChatInterface />
</LlmConnectorProvider>

// 2. 多实例聊天（显式命名）
<LlmConnectorProvider name="main-chat">
  <ChatInterface clientName="main-chat" />
</LlmConnectorProvider>

<LlmConnectorProvider name="summary-chat">
  <ChatInterface 
    clientName="summary-chat"
    placeholder="输入需要总结的内容..."
  />
</LlmConnectorProvider>

// 3. 自定义Hook使用
const {
  messages, sendMessage, isStreaming,
  clearMessages, abortResponse
} = useChatManager({
  clientName: 'custom-chat',
  storageKey: 'my-chat-history'
});`}
        </pre>
      </div>
    </div>
  );
};