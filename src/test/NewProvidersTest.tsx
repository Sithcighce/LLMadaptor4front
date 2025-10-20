import React, { useState } from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';
import { useLlmConnector } from '../hooks/useLlmConnector';
import type { ProviderId } from '../types';

/**
 * 新 Providers 测试页面
 * 测试 Chrome AI, LM Studio, Silicon Flow, Backend Proxy
 */

const TestComponent: React.FC = () => {
  const { states, handlers, llmClient } = useLlmConnector('new-providers-test');
  const [testResult, setTestResult] = useState<string>('');
  const [isTestRunning, setIsTestRunning] = useState(false);

  // 测试连接
  const testConnection = async () => {
    if (!llmClient) {
      setTestResult('❌ No client connected. Please connect first.');
      return;
    }

    setIsTestRunning(true);
    setTestResult('🔄 Testing chat functionality...');

    try {
      const result = await llmClient.chat({
        messages: [
          { role: 'user', content: 'Say "Hello, I am working!" in one short sentence.' }
        ],
        stream: false,
      });

      // 类型守卫：检查是否是 ChatResult
      if ('text' in result) {
        setTestResult(`✅ Success!\n\nResponse: ${result.text}\n\nProvider: ${states.providerId}\nModel: ${states.model}`);
      } else {
        setTestResult(`❌ Unexpected result type`);
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setIsTestRunning(false);
    }
  };

  // Provider 配置模板
  const providerTemplates: Record<ProviderId, {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    description: string;
  }> = {
    'chrome-ai': {
      description: 'Chrome AI - No API key needed, runs in browser',
      model: 'chrome-ai-builtin',
    },
    'lmstudio': {
      baseUrl: 'http://127.0.0.1:1234/v1',
      description: 'LM Studio - Local server (make sure it\'s running on 127.0.0.1:1234)',
    },
    'siliconflow': {
      apiKey: '',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'Qwen/Qwen2.5-7B-Instruct',
      description: 'Silicon Flow - Chinese LLM provider',
    },
    'backend-proxy': {
      baseUrl: 'http://localhost:3003/api/ai/proxy',
      description: 'Backend Proxy - API key managed by backend (running on port 3003)',
    },
    'openai': {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      description: 'OpenAI',
    },
    'anthropic': {
      apiKey: '',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-5-sonnet-20241022',
      description: 'Anthropic Claude',
    },
    'gemini': {
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-1.5-flash',
      description: 'Google Gemini',
    },
    'webllm': {
      model: 'Qwen2-0.5B-Instruct-q4f16_1-MLC',
      description: 'WebLLM - Browser WASM',
    },
  };

  // 应用模板
  const applyTemplate = (providerId: ProviderId) => {
    const template = providerTemplates[providerId];
    handlers.setProviderId(providerId);
    if (template.apiKey !== undefined) handlers.setApiKey(template.apiKey);
    if (template.baseUrl) handlers.setBaseUrl(template.baseUrl);
    if (template.model) handlers.setModel(template.model);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>🧪 New Providers Test Page</h1>
      <p style={{ color: '#666' }}>Test Chrome AI, LM Studio, Silicon Flow, and Backend Proxy</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Left Panel - Configuration */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h2>⚙️ Configuration</h2>

          {/* Provider Selection */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Provider:
            </label>
            <select
              value={states.providerId}
              onChange={(e) => applyTemplate(e.target.value as ProviderId)}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            >
              <optgroup label="New Providers">
                <option value="chrome-ai">Chrome AI (Browser Built-in)</option>
                <option value="lmstudio">LM Studio (Local Server)</option>
                <option value="siliconflow">Silicon Flow (中国)</option>
                <option value="backend-proxy">Backend Proxy</option>
              </optgroup>
              <optgroup label="Existing Providers">
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="webllm">WebLLM</option>
              </optgroup>
            </select>
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              {providerTemplates[states.providerId].description}
            </small>
          </div>

          {/* API Key (conditional) */}
          {!['chrome-ai', 'lmstudio', 'backend-proxy', 'webllm'].includes(states.providerId) && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                API Key:
              </label>
              <input
                type="password"
                value={states.apiKey}
                onChange={(e) => handlers.setApiKey(e.target.value)}
                placeholder="Enter your API key"
                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              />
            </div>
          )}

          {/* Base URL */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Base URL:
            </label>
            <input
              type="text"
              value={states.baseUrl}
              onChange={(e) => handlers.setBaseUrl(e.target.value)}
              placeholder="Optional custom endpoint"
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
          </div>

          {/* Model */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Model:
            </label>
            <input
              type="text"
              value={states.model}
              onChange={(e) => handlers.setModel(e.target.value)}
              placeholder="Model name"
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
          </div>

          {/* Connection Status */}
          <div style={{ marginBottom: '15px' }}>
            <strong>Status:</strong>{' '}
            <span
              style={{
                color:
                  states.status === 'connected'
                    ? 'green'
                    : states.status === 'error'
                    ? 'red'
                    : '#666',
              }}
            >
              {states.status.toUpperCase()}
            </span>
          </div>

          {/* Error Display */}
          {states.error && (
            <div
              style={{
                padding: '10px',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '14px',
              }}
            >
              ❌ {states.error.message}
            </div>
          )}

          {/* Connect/Disconnect Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlers.handleConnect}
              disabled={states.status === 'connecting'}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: states.status === 'connecting' ? 'not-allowed' : 'pointer',
              }}
            >
              {states.status === 'connecting' ? 'Connecting...' : 'Connect'}
            </button>

            <button
              onClick={handlers.handleDisconnect}
              disabled={states.status !== 'connected'}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: states.status !== 'connected' ? 'not-allowed' : 'pointer',
              }}
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Right Panel - Testing */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h2>🧪 Test Chat</h2>

          <button
            onClick={testConnection}
            disabled={!llmClient || isTestRunning}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              backgroundColor: llmClient && !isTestRunning ? '#28a745' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: llmClient && !isTestRunning ? 'pointer' : 'not-allowed',
              marginBottom: '20px',
            }}
          >
            {isTestRunning ? '⏳ Testing...' : '🚀 Send Test Message'}
          </button>

          {testResult && (
            <div
              style={{
                padding: '15px',
                background: testResult.startsWith('✅') ? '#d4edda' : '#f8d7da',
                border: `1px solid ${testResult.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              {testResult}
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
            <h3 style={{ marginTop: 0 }}>📝 Quick Test Guide:</h3>
            <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li><strong>Chrome AI:</strong> Select and click Connect (no setup needed)</li>
              <li><strong>LM Studio:</strong> Make sure LM Studio is running on localhost:1234</li>
              <li><strong>Silicon Flow:</strong> Enter your API key from siliconflow.cn</li>
              <li><strong>Backend Proxy:</strong> Setup your backend endpoint first</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main export with Provider wrapper
export const NewProvidersTest: React.FC = () => {
  return (
    <LlmConnectorProvider name="new-providers-test" storageKey="new-providers-test-config">
      <TestComponent />
    </LlmConnectorProvider>
  );
};

export default NewProvidersTest;
