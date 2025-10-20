import React from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { useLlmConnector } from '../hooks/useLlmConnector';
import { useChatManager } from '../hooks/useChatManager';

/**
 * 最小化 useChatManager 测试
 */
const MinimalChatManagerTest: React.FC = () => {
  try {
    const chatManager = useChatManager();
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h4>✅ useChatManager 工作正常</h4>
        <p>消息数量: {chatManager.messages.length}</p>
        <p>是否可发送: {chatManager.canSend ? '是' : '否'}</p>
        <p>是否流式传输: {chatManager.isStreaming ? '是' : '否'}</p>
      </div>
    );
  } catch (error) {
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8d7da', 
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h4>❌ useChatManager 失败</h4>
        <p>错误: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
};

/**
 * 最小测试页面
 */
export const MinimalTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 最小化测试</h1>
      
      <LlmConnectorProvider name="test" storageKey="test-config">
        <MinimalChatManagerTest />
      </LlmConnectorProvider>
    </div>
  );
};