import React from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { useLlmConnector } from '../hooks/useLlmConnector';
import { ChatInterface } from '../components/ChatInterface';
import { ConnectionFormZh } from '../components/ConnectionForm/index.zh';
import { ModelSelectZh } from '../components/ModelSelect/index.zh';

/**
 * 测试组件 - 验证Context是否工作
 */
const ContextTester: React.FC = () => {
  try {
    const { llmClient, states } = useLlmConnector();
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h4>✅ Context 连接成功</h4>
        <p>Provider ID: {states.providerId || '未设置'}</p>
        <p>Model: {states.model || '未设置'}</p>
        <p>Client Ready: {llmClient ? '是' : '否'}</p>
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
        <h4>❌ Context 连接失败</h4>
        <p>错误: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
};

/**
 * 简单的聊天测试 - 不使用显式客户端名称
 */
export const SimpleChatTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 简单聊天测试</h1>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>✅ 基础功能测试</h3>
        <p>这个版本先测试基础的聊天功能，不使用显式Client名称。</p>
      </div>

      {/* 单实例测试 */}
      <LlmConnectorProvider name="default" storageKey="default-config">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>🤖 基础聊天功能</h3>
          
          {/* 测试Context是否工作 */}
          <ContextTester />
          
          <div style={{ marginBottom: '20px' }}>
            <ConnectionFormZh />
            <ModelSelectZh />
          </div>
          
          {/* 添加ChatInterface进行测试 */}
          <div style={{ marginTop: '20px' }}>
            <h4>🚀 聊天界面测试</h4>
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <ChatInterface
                storageKey="test-messages"
                placeholder="请输入您的问题..."
                sendButtonText="发送"
                clearButtonText="清空对话"
              />
            </div>
          </div>
        </div>
      </LlmConnectorProvider>
    </div>
  );
};