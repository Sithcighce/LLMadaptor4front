import React, { useState } from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { useLlmConnector } from '../hooks/useLlmConnector';
import { ConnectionFormZh } from '../components/ConnectionForm/index.zh';
import { ModelSelectZh } from '../components/ModelSelect/index.zh';

// 快速API测试组件
const QuickApiTest: React.FC<{ title: string }> = ({ 
  title 
}) => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 使用hook获取客户端 - 使用Context模式，而不是显式名称
  const { llmClient } = useLlmConnector();

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult('正在测试连接...');
      
      if (!llmClient) {
        setTestResult('❌ 客户端未连接，请先配置并连接');
        return;
      }

      const result = await llmClient.chat({
        messages: [{ role: 'user', content: '你好，请回复"测试成功"' }]
      });

      if ('text' in result) {
        setTestResult(`✅ 连接成功！响应: ${result.text}`);
      } else {
        setTestResult('✅ 连接成功！（流式响应）');
      }
    } catch (error) {
      setTestResult(`❌ 连接失败: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      border: '2px solid #4CAF50', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#f8fff8'
    }}>
      <h3>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: '20px', alignItems: 'start' }}>
        <div>
          <h4>连接配置</h4>
          <ConnectionFormZh />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <strong>提示:</strong> 请手动输入你的API密钥
          </div>
        </div>
        <div>
          <h4>模型选择</h4>
          <ModelSelectZh />
        </div>
        <div>
          <h4>连接测试</h4>
          <button
            onClick={testConnection}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: isLoading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '测试中...' : '🧪 测试连接'}
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

// API测试页面
export const ApiTestPage: React.FC = () => {

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 显式Client名称 - API连接测试</h1>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>📋 测试说明</h3>
        <ol>
          <li>请手动输入你的API Key到连接配置中</li>
          <li>每个实例使用不同的存储配置，验证多实例隔离</li>
          <li>点击"🧪 测试连接"验证API调用是否成功</li>
          <li>尝试在不同实例中选择不同的模型</li>
        </ol>
      </div>

      {/* 实例1 - 在Provider内部使用 */}
      <LlmConnectorProvider name="api-test-1" storageKey="api-test-1-config">
        <QuickApiTest 
          title="🤖 实例1 - GPT模型测试" 
        />
      </LlmConnectorProvider>

      {/* 实例2 - 在Provider内部使用 */}
      <LlmConnectorProvider name="api-test-2" storageKey="api-test-2-config">
        <QuickApiTest 
          title="📝 实例2 - 不同配置测试" 
        />
      </LlmConnectorProvider>

      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fff3e0', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>✅ 验证清单</h3>
        <ul>
          <li>□ 两个实例可以独立配置不同的模型</li>
          <li>□ API Key在实例间正确隔离存储</li>
          <li>□ 连接测试能够成功调用OpenAI API</li>
          <li>□ 错误处理机制工作正常</li>
        </ul>
      </div>
    </div>
  );
};