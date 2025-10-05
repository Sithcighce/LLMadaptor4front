import React, { useState, useEffect } from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { useLlmConnector } from '../hooks/useLlmConnector';
import { ConnectionFormZh } from '../components/ConnectionForm/index.zh';
import { ModelSelectZh } from '../components/ModelSelect/index.zh';
import { TokenUsageZh } from '../components/TokenUsage/index.zh';
import { ClientRegistry } from '../registry/ClientRegistry';

// 状态显示组件
const ClientStatusDisplay: React.FC<{ clientName?: string }> = ({ clientName }) => {
  try {
    const { states } = useLlmConnector(clientName);
    return (
      <div style={{ 
        padding: '10px', 
        margin: '5px 0', 
        border: '1px solid #4CAF50', 
        borderRadius: '4px',
        backgroundColor: '#f0fff0',
        fontSize: '12px'
      }}>
        <strong>✅ Client: {clientName || 'Context'}</strong><br />
        Status: {states.status} | Provider: {states.providerId} | Model: {states.model}
      </div>
    );
  } catch (error) {
    return (
      <div style={{ 
        padding: '10px', 
        margin: '5px 0', 
        border: '1px solid #f44336', 
        borderRadius: '4px',
        backgroundColor: '#fff0f0',
        fontSize: '12px'
      }}>
        <strong>❌ Client: {clientName || 'Context'}</strong><br />
        Error: {(error as Error).message}
      </div>
    );
  }
};

// 完整功能测试组件
export const ComprehensiveTest: React.FC = () => {
  const [registeredClients, setRegisteredClients] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRegisteredClients(ClientRegistry.getRegisteredNames());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 显式Client名称传入 - 完整功能测试</h1>
      
      {/* 注册状态显示 */}
      <div style={{ 
        padding: '16px', 
        margin: '16px 0', 
        border: '2px solid #2196F3', 
        borderRadius: '8px',
        backgroundColor: '#f3f9ff'
      }}>
        <h3>📊 Client注册状态</h3>
        <p><strong>已注册：</strong> {registeredClients.join(', ') || '无'}</p>
      </div>

      {/* 注册多个Provider */}
      <div style={{ display: 'none' }}>
        <LlmConnectorProvider name="chat" storageKey="test-chat-config">
          <div />
        </LlmConnectorProvider>
        <LlmConnectorProvider name="summary" storageKey="test-summary-config">
          <div />
        </LlmConnectorProvider>
        <LlmConnectorProvider name="translate" storageKey="test-translate-config">
          <div />
        </LlmConnectorProvider>
      </div>

      {/* 测试1: Context模式 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试1: Context模式（传统方式）</h2>
        <LlmConnectorProvider name="context-mode">
          <div style={{ 
            border: '2px solid #4CAF50', 
            padding: '20px', 
            borderRadius: '8px',
            backgroundColor: '#f8fff8'
          }}>
            <ClientStatusDisplay />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '16px' }}>
              <div>
                <h4>连接配置</h4>
                <ConnectionFormZh />
              </div>
              <div>
                <h4>模型选择</h4>
                <ModelSelectZh />
              </div>
              <div>
                <h4>Token统计</h4>
                <TokenUsageZh />
              </div>
            </div>
          </div>
        </LlmConnectorProvider>
      </div>

      {/* 测试2: 显式客户端名称模式 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试2: 显式Client名称模式</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* Chat实例 */}
          <div style={{ 
            border: '2px solid #ff6b6b', 
            padding: '16px', 
            borderRadius: '8px',
            backgroundColor: '#fff8f8'
          }}>
            <h3>💬 Chat Client</h3>
            <ClientStatusDisplay clientName="chat" />
            <ConnectionFormZh clientName="chat" />
            <ModelSelectZh clientName="chat" />
            <TokenUsageZh clientName="chat" />
          </div>

          {/* Summary实例 */}
          <div style={{ 
            border: '2px solid #4ecdc4', 
            padding: '16px', 
            borderRadius: '8px',
            backgroundColor: '#f8ffff'
          }}>
            <h3>📄 Summary Client</h3>
            <ClientStatusDisplay clientName="summary" />
            <ConnectionFormZh clientName="summary" />
            <ModelSelectZh clientName="summary" />
            <TokenUsageZh clientName="summary" />
          </div>

          {/* Translate实例 */}
          <div style={{ 
            border: '2px solid #ffe66d', 
            padding: '16px', 
            borderRadius: '8px',
            backgroundColor: '#fffef8'
          }}>
            <h3>🌐 Translate Client</h3>
            <ClientStatusDisplay clientName="translate" />
            <ConnectionFormZh clientName="translate" />
            <ModelSelectZh clientName="translate" />
            <TokenUsageZh clientName="translate" />
          </div>
        </div>
      </div>

      {/* 测试3: 错误处理 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试3: 错误处理</h2>
        <div style={{ 
          border: '2px solid #ff9800', 
          padding: '16px', 
          borderRadius: '8px',
          backgroundColor: '#fff9f0'
        }}>
          <h3>⚠️ 不存在的Client</h3>
          <ClientStatusDisplay clientName="non-existent" />
          <p>应该显示错误信息：Client "non-existent" not found</p>
        </div>
      </div>

      {/* 测试4: 跨组件状态共享 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试4: 跨组件状态共享验证</h2>
        <p>在上面的Chat实例中修改配置，下面的组件应该反映相同的状态：</p>
        
        <div style={{ 
          border: '2px solid #9c27b0', 
          padding: '16px', 
          borderRadius: '8px',
          backgroundColor: '#fdf8ff'
        }}>
          <h3>🔗 共享Chat Client状态</h3>
          <ClientStatusDisplay clientName="chat" />
          <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
            <div>
              <h4>另一个ModelSelect</h4>
              <ModelSelectZh clientName="chat" />
            </div>
            <div>
              <h4>另一个TokenUsage</h4>
              <TokenUsageZh clientName="chat" />
            </div>
          </div>
        </div>
      </div>

      {/* 操作说明 */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e8f5e8', 
        border: '1px solid #4CAF50',
        borderRadius: '8px'
      }}>
        <h3>🔧 测试说明</h3>
        <ul style={{ margin: 0 }}>
          <li>✅ 检查所有Client是否正确注册</li>
          <li>✅ 在不同实例中配置不同的API Key和模型</li>
          <li>✅ 验证每个实例的配置是独立的</li>
          <li>✅ 确认跨组件状态共享正常工作</li>
          <li>✅ 测试错误处理机制</li>
        </ul>
      </div>
    </div>
  );
};