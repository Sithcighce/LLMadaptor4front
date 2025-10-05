import React, { useState } from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { useLlmConnector } from '../hooks/useLlmConnector';
import { ConnectionFormZh } from '../components/ConnectionForm/index.zh';
import { ModelSelectZh } from '../components/ModelSelect/index.zh';
import { ClientRegistry } from '../registry/ClientRegistry';

// Context模式测试组件
const ContextModeTest: React.FC<{ title: string }> = ({ title }) => {
  const { llmClient, states } = useLlmConnector();
  const [testResult, setTestResult] = useState<string>('');

  const testConnection = async () => {
    if (!llmClient) {
      setTestResult('❌ 客户端未连接，请先配置并连接');
      return;
    }

    try {
      const result = await llmClient.chat({
        messages: [{ role: 'user', content: '请回复"Context模式测试成功"' }]
      });

      if ('text' in result) {
        setTestResult(`✅ Context模式成功！响应: ${result.text}`);
      } else {
        setTestResult('✅ Context模式连接成功！（流式响应）');
      }
    } catch (error) {
      setTestResult(`❌ Context模式失败: ${(error as Error).message}`);
    }
  };

  return (
    <div style={{ 
      border: '2px solid #2196F3', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#f0f8ff'
    }}>
      <h3>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: '20px', alignItems: 'start' }}>
        <div>
          <h4>连接配置</h4>
          <ConnectionFormZh />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <strong>模式:</strong> React Context 查找
          </div>
        </div>
        <div>
          <h4>模型选择</h4>
          <ModelSelectZh />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <strong>状态:</strong> {states.status === 'connected' ? '已连接' : '未连接'}
          </div>
        </div>
        <div>
          <h4>连接测试</h4>
          <button
            onClick={testConnection}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧪 测试Context模式
          </button>
          {testResult && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: testResult.startsWith('✅') ? '#e8f5e8' : '#ffe6e6',
              borderRadius: '4px',
              fontSize: '12px',
              wordBreak: 'break-all'
            }}>
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 显式名称模式测试组件
const ExplicitNameTest: React.FC<{ clientName: string; title: string }> = ({ clientName, title }) => {
  const [testResult, setTestResult] = useState<string>('');
  const [registeredClients, setRegisteredClients] = useState<string[]>([]);

  const refreshRegisteredClients = () => {
    setRegisteredClients(ClientRegistry.getRegisteredNames());
  };

  const testExplicitConnection = async () => {
    try {
      refreshRegisteredClients();
      
      // 使用显式名称查找Client
      const { llmClient } = useLlmConnector(clientName);
      
      if (!llmClient) {
        setTestResult('❌ 客户端未连接，请先配置并连接');
        return;
      }

      const result = await llmClient.chat({
        messages: [{ role: 'user', content: `请回复"显式名称 ${clientName} 测试成功"` }]
      });

      if ('text' in result) {
        setTestResult(`✅ 显式名称成功！响应: ${result.text}`);
      } else {
        setTestResult('✅ 显式名称连接成功！（流式响应）');
      }
    } catch (error) {
      setTestResult(`❌ 显式名称失败: ${(error as Error).message}`);
      refreshRegisteredClients();
    }
  };

  React.useEffect(() => {
    refreshRegisteredClients();
  }, []);

  return (
    <div style={{ 
      border: '2px solid #FF9800', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#fff8e1'
    }}>
      <h3>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: '20px', alignItems: 'start' }}>
        <div>
          <h4>连接配置</h4>
          <ConnectionFormZh />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <strong>模式:</strong> 显式名称查找 ({clientName})
          </div>
        </div>
        <div>
          <h4>模型选择</h4>
          <ModelSelectZh />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <strong>已注册客户端:</strong> [{registeredClients.join(', ') || 'none'}]
          </div>
        </div>
        <div>
          <h4>连接测试</h4>
          <button
            onClick={testExplicitConnection}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '5px'
            }}
          >
            🧪 测试显式名称
          </button>
          <button
            onClick={refreshRegisteredClients}
            style={{
              width: '100%',
              padding: '5px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            🔄 刷新注册列表
          </button>
          {testResult && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: testResult.startsWith('✅') ? '#e8f5e8' : '#ffe6e6',
              borderRadius: '4px',
              fontSize: '12px',
              wordBreak: 'break-all'
            }}>
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 客户端命名测试页面
export const ClientNamingTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎯 显式Client名称 vs Context模式 对比测试</h1>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>🧪 测试对比说明</h3>
        <ul>
          <li><strong>Context模式</strong>：传统的React Context Provider/Consumer模式，依赖组件树层次</li>
          <li><strong>显式名称模式</strong>：通过ClientRegistry直接按名称查找，不依赖组件树层次</li>
          <li>两种模式可以同时使用，显式名称模式解决了"最近的上级"可靠性问题</li>
          <li>请在两个实例中分别配置不同的API和模型，验证隔离效果</li>
        </ul>
      </div>

      {/* Context模式实例 */}
      <LlmConnectorProvider name="context-test" storageKey="context-test-config">
        <ContextModeTest title="🔵 Context模式测试 - 传统React Context查找" />
      </LlmConnectorProvider>

      {/* 显式名称模式实例 - 这里需要先注册到Registry */}
      <LlmConnectorProvider name="explicit-test" storageKey="explicit-test-config">
        {/* 这个组件将演示显式名称查找 */}
        <ExplicitNameTest 
          clientName="explicit-test" 
          title="🟠 显式名称模式测试 - 直接按名称查找" 
        />
      </LlmConnectorProvider>

      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fff3e0', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>✅ 验证要点</h3>
        <ul>
          <li>□ Context模式在Provider内部正常工作</li>
          <li>□ 显式名称模式可以跨Provider边界查找Client</li>
          <li>□ 两个实例配置完全隔离（不同的storageKey）</li>
          <li>□ 注册列表正确显示已注册的Client名称</li>
          <li>□ API调用在两种模式下都能正常工作</li>
        </ul>
      </div>
    </div>
  );
};