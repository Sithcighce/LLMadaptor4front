import React, { useState } from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { useLlmConnector } from '../hooks/useLlmConnector';
import { ConnectionFormZh } from '../components/ConnectionForm/index.zh';
import { ModelSelectZh } from '../components/ModelSelect/index.zh';
import { TokenUsageZh } from '../components/TokenUsage/index.zh';
import { ClientRegistry } from '../registry/ClientRegistry';
import { MultiProviderRegistry } from './MultiProviderRegistry';

// 测试组件：显示当前Client状态
const ClientStatusDisplay: React.FC<{ clientName?: string }> = ({ clientName }) => {
  try {
    const { states } = useLlmConnector(clientName);
    return (
      <div style={{ 
        padding: '8px', 
        margin: '4px', 
        border: '1px solid #ccc', 
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      }}>
        <strong>Client: {clientName || 'Context'}</strong>
        <br />
        Status: {states.status}
        <br />
        Provider: {states.providerId}
        <br />
        Model: {states.model}
        <br />
        API Key: {states.apiKey ? '***设置***' : '未设置'}
      </div>
    );
  } catch (error) {
    return (
      <div style={{ 
        padding: '8px', 
        margin: '4px', 
        border: '1px solid red', 
        borderRadius: '4px',
        backgroundColor: '#ffe6e6'
      }}>
        <strong>Client: {clientName || 'Context'}</strong>
        <br />
        Error: {(error as Error).message}
      </div>
    );
  }
};

// 注册中心状态显示
const RegistryStatus: React.FC = () => {
  const [, forceUpdate] = useState({});
  const refresh = () => forceUpdate({});

  return (
    <div style={{ 
      padding: '16px', 
      margin: '8px', 
      border: '2px solid #007acc', 
      borderRadius: '8px',
      backgroundColor: '#f0f8ff'
    }}>
      <h3>🗂️ Client注册中心状态</h3>
      <button onClick={refresh} style={{ marginBottom: '8px' }}>刷新</button>
      <div>
        <strong>已注册的Client：</strong>
        {ClientRegistry.getRegisteredNames().length > 0 ? (
          <ul>
            {ClientRegistry.getRegisteredNames().map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : (
          <span> 无</span>
        )}
      </div>
    </div>
  );
};

// 多实例测试组件
export const MultiInstanceTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 显式Client名称传入 - 功能测试</h1>
      
      <RegistryStatus />

      {/* 测试1：Context模式（传统方式） */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试1：Context模式（传统方式）</h2>
        <LlmConnectorProvider name="context-test">
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <h3>连接配置</h3>
              <ConnectionFormZh />
            </div>
            <div>
              <h3>模型选择</h3>
              <ModelSelectZh />
            </div>
            <div>
              <h3>Token使用</h3>
              <TokenUsageZh />
            </div>
            <div>
              <h3>状态显示</h3>
              <ClientStatusDisplay />
            </div>
          </div>
        </LlmConnectorProvider>
      </div>

      {/* 测试2：显式Client名称模式 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试2：显式Client名称模式</h2>
        
        {/* 注册多个Provider */}
        <MultiProviderRegistry 
          providers={[
            { name: 'chat', storageKey: 'test-chat-config' },
            { name: 'summary', storageKey: 'test-summary-config' },
            { name: 'translate', storageKey: 'test-translate-config' }
          ]}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* Chat实例 */}
          <div style={{ border: '2px solid #ff6b6b', padding: '16px', borderRadius: '8px' }}>
            <h3>💬 Chat实例</h3>
            <ConnectionFormZh clientName="chat" />
            <ModelSelectZh clientName="chat" />
            <TokenUsageZh clientName="chat" />
            <ClientStatusDisplay clientName="chat" />
          </div>

          {/* Summary实例 */}
          <div style={{ border: '2px solid #4ecdc4', padding: '16px', borderRadius: '8px' }}>
            <h3>📄 Summary实例</h3>
            <ConnectionFormZh clientName="summary" />
            <ModelSelectZh clientName="summary" />
            <TokenUsageZh clientName="summary" />
            <ClientStatusDisplay clientName="summary" />
          </div>

          {/* Translate实例 */}
          <div style={{ border: '2px solid #ffe66d', padding: '16px', borderRadius: '8px' }}>
            <h3>🌐 Translate实例</h3>
            <ConnectionFormZh clientName="translate" />
            <ModelSelectZh clientName="translate" />
            <TokenUsageZh clientName="translate" />
            <ClientStatusDisplay clientName="translate" />
          </div>
        </div>
      </div>

      {/* 测试3：错误处理 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试3：错误处理</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <h3>不存在的Client</h3>
            <ClientStatusDisplay clientName="non-existent" />
          </div>
          <div>
            <h3>Context外部组件</h3>
            <ClientStatusDisplay />
          </div>
        </div>
      </div>

      {/* 测试4：跨页面场景模拟 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试4：跨页面场景模拟</h2>
        <p>模拟组件分布在不同页面，但都使用同一个Client实例</p>
        
        <LlmConnectorProvider name="global" storageKey="test-global-config">
          <div /> {/* 确保Provider被渲染 */}
        </LlmConnectorProvider>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div style={{ border: '1px solid #666', padding: '16px' }}>
            <h3>页面A - 配置区域</h3>
            <ConnectionFormZh clientName="global" />
          </div>
          
          <div style={{ border: '1px solid #666', padding: '16px' }}>
            <h3>页面B - 功能区域</h3>
            <ModelSelectZh clientName="global" />
            <TokenUsageZh clientName="global" />
          </div>
        </div>
        
        <div style={{ marginTop: '16px', border: '2px solid #4CAF50', padding: '16px' }}>
          <h4>全局状态监控</h4>
          <ClientStatusDisplay clientName="global" />
        </div>
      </div>
    </div>
  );
};