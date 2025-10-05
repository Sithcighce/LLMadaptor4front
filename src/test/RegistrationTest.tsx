import React, { useEffect, useState } from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { ClientRegistry } from '../registry/ClientRegistry';

// 最小化测试组件 - 只测试注册功能
export const RegistrationTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(`[RegistrationTest] ${message}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('组件挂载');
    
    // 监听注册状态变化
    const interval = setInterval(() => {
      const clients = ClientRegistry.getRegisteredNames();
      addLog(`当前注册客户端: [${clients.join(', ')}]`);
    }, 500);

    return () => {
      clearInterval(interval);
      addLog('组件卸载');
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 注册功能测试</h1>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '4px',
        marginBottom: '20px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <h3>调试日志:</h3>
        {logs.length === 0 ? (
          <p>等待日志...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>测试A: Provider挂载测试</h3>
        <div style={{ border: '2px solid blue', padding: '10px' }}>
          <LlmConnectorProvider name="test-a">
            <div style={{ padding: '10px', backgroundColor: '#e3f2fd' }}>
              Provider "test-a" 已挂载
            </div>
          </LlmConnectorProvider>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>测试B: 多个Provider</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ border: '2px solid green', padding: '10px', flex: 1 }}>
            <LlmConnectorProvider name="test-b1">
              <div style={{ padding: '10px', backgroundColor: '#e8f5e8' }}>
                Provider "test-b1"
              </div>
            </LlmConnectorProvider>
          </div>
          <div style={{ border: '2px solid orange', padding: '10px', flex: 1 }}>
            <LlmConnectorProvider name="test-b2">
              <div style={{ padding: '10px', backgroundColor: '#fff3e0' }}>
                Provider "test-b2"  
              </div>
            </LlmConnectorProvider>
          </div>
        </div>
      </div>

      <div>
        <h3>测试C: 手动查询</h3>
        <button 
          onClick={() => {
            const clients = ClientRegistry.getRegisteredNames();
            addLog(`手动查询结果: [${clients.join(', ')}]`);
            
            // 尝试访问每个client
            clients.forEach(name => {
              try {
                const client = ClientRegistry.get(name);
                addLog(`${name}: ${client ? '✅ 存在' : '❌ 不存在'}`);
              } catch (error) {
                addLog(`${name}: ❌ 错误 - ${(error as Error).message}`);
              }
            });
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔍 手动检查注册状态
        </button>
      </div>
    </div>
  );
};