import React, { useEffect, useState } from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { useLlmConnector } from '../hooks/useLlmConnector';
import { ConnectionFormZh } from '../components/ConnectionForm/index.zh';
import { ModelSelectZh } from '../components/ModelSelect/index.zh';
import { TokenUsageZh } from '../components/TokenUsage/index.zh';
import { ClientRegistry } from '../registry/ClientRegistry';

// 简单的测试组件
export const SimpleTest: React.FC = () => {
  const [registeredClients, setRegisteredClients] = useState<string[]>([]);

  useEffect(() => {
    // 定期更新注册的客户端列表（减少频率）
    const interval = setInterval(() => {
      const clients = ClientRegistry.getRegisteredNames();
      setRegisteredClients(clients);
    }, 2000); // 改为2秒一次，减少刷新

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 简单功能测试</h1>
      
      <div style={{ 
        padding: '16px', 
        margin: '16px 0', 
        border: '2px solid #007acc', 
        borderRadius: '8px',
        backgroundColor: '#f0f8ff'
      }}>
        <h3>📊 注册状态</h3>
        <p><strong>已注册的客户端：</strong> 
          {registeredClients.length > 0 ? registeredClients.join(', ') : '无'}
        </p>
      </div>

      {/* 测试1：基本Context模式 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试1：基本Context模式</h2>
        <LlmConnectorProvider name="basic-test">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '20px',
            border: '1px solid #ddd',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div>
              <h3>连接表单</h3>
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
          </div>
        </LlmConnectorProvider>
      </div>

      {/* 测试2：显式Client名称 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试2：显式Client名称</h2>
        
        {/* 将组件放在Provider内部 */}
        <LlmConnectorProvider name="explicit-test">
          <div style={{ 
            border: '2px solid #ff6b6b', 
            padding: '20px', 
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <h3>🎯 使用clientName="explicit-test"</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div>
                <ConnectionFormZh clientName="explicit-test" />
              </div>
              <div>
                <ModelSelectZh clientName="explicit-test" />
              </div>
              <div>
                <TokenUsageZh clientName="explicit-test" />
              </div>
            </div>
          </div>
        </LlmConnectorProvider>
      </div>

      {/* 测试3：错误情况 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>测试3：错误处理</h2>
        <div style={{ 
          border: '2px solid #ff9800', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h3>⚠️ 使用不存在的clientName="non-existent"</h3>
          <p>这应该会显示错误信息：</p>
          <div style={{ 
            backgroundColor: '#ffe6e6', 
            padding: '10px', 
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            <ErrorBoundary>
              <ConnectionFormZh clientName="non-existent" />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

// 简单的错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red' }}>
          <strong>错误：</strong> {this.state.error?.message}
        </div>
      );
    }

    return this.props.children;
  }
}