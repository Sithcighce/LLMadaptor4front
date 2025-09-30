
import { useState, useCallback, useEffect, useMemo } from 'react';
import { TokenJS } from 'token.js/dist/index.cjs';
import { LlmClient } from '../client/LlmClient';
import type { ProviderId, ConnectorStatus, TokenUsage } from '../types/index';

const LOCAL_STORAGE_KEY = 'llm-connector-config';

/**
 * ⚠️ INTERNAL: LLM Connector 核心基础设施 Hook
 * 
 * 🚨 WARNING: 此 Hook 创建独立的状态实例，不应直接在组件中使用！
 * 
 * 正确用法：
 * ✅ 使用 useLlmConnector() - 通过 Context 访问共享状态
 * ✅ 使用 useConnectionManager() - 封装的连接管理接口
 * ❌ 直接使用此 Hook - 会创建独立状态实例，导致状态不同步
 * 
 * 此 Hook 的职责：
 * 1. 管理 llmClient 实例（最重要的核心暴露点）
 * 2. 处理基础配置和状态管理
 * 3. 提供持久化存储功能
 * 4. 为所有功能层 Hook 提供基础服务
 * 
 * @internal 仅供 LlmConnectorProvider 内部使用
 * @see useLlmConnector 推荐的公共接口
 * @see useConnectionManager 连接管理专用接口
 */
export const useLlmConnectorLogic = () => {
  // --- UI & Form State ---
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o'); // Default model

  // --- Connection State ---
  const [status, setStatus] = useState<ConnectorStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [llmClient, setLlmClient] = useState<LlmClient | null>(null);

  // --- Data State ---
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);

  // --- Load config from localStorage on initial mount ---
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedConfig) {
        const { providerId, baseUrl, model } = JSON.parse(savedConfig);
        if (providerId) setProviderId(providerId);
        if (baseUrl) setBaseUrl(baseUrl);
        if (model) setModel(model);
      }
    } catch (e) {
      console.error('Failed to load config from localStorage', e);
    }
  }, []);

  // --- Save config to localStorage on change ---
  useEffect(() => {
    try {
      const configToSave = { providerId, baseUrl, model };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configToSave));
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
    }
  }, [providerId, baseUrl, model]);

  // --- Fetch Models Handler (defined first to avoid circular dependency) ---
  const fetchModels = useCallback(async () => {
    if (!apiKey) {
      throw new Error('API Key is required to fetch models');
    }

    try {
      let models: string[] = [];

      if (providerId === 'openai') {
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${apiKey.trim()}`,
        };
        
        const apiRoot = baseUrl || 'https://api.openai.com/v1';
        const response = await fetch(`${apiRoot}/models`, { headers });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Invalid OpenAI API Key (${response.status})`);
        }
        
        const payload = await response.json();
        models = (payload.data ?? [])
          .filter((item: { id: string }) => item.id.includes('gpt')) // 只显示 GPT 模型
          .map((item: { id: string }) => item.id)
          .sort();
          
        if (models.length === 0) {
          throw new Error('No GPT models found in your OpenAI account');
        }
        
      } else if (providerId === 'anthropic') {
        // 对 Anthropic 进行简单验证：发送一个最小的测试请求
        const testHeaders = {
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        };
        
        const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: testHeaders,
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }]
          })
        });
        
        if (!testResponse.ok) {
          const errorData = await testResponse.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Invalid Anthropic API Key (${testResponse.status})`);
        }
        
        // API Key 有效，返回硬编码模型列表
        models = [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022', 
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ];
        
      } else if (providerId === 'gemini') {
        const apiRoot = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
        const url = `${apiRoot}/models?key=${encodeURIComponent(apiKey.trim())}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Invalid Gemini API Key (${response.status})`);
        }
        
        const payload = await response.json();
        models = (payload.models ?? [])
          .filter((item: { name: string; supportedGenerationMethods?: string[] }) => 
            item.name.includes('gemini') && 
            item.supportedGenerationMethods?.includes('generateContent')
          )
          .map((item: { name: string }) => item.name.replace('models/', ''))
          .sort();
          
        if (models.length === 0) {
          throw new Error('No Gemini models found for your API Key');
        }
      } else {
        throw new Error(`Unsupported provider: ${providerId}`);
      }

      setModelOptions(models);
      
      console.log('fetchModels success:', { 
        providerId, 
        modelsCount: models.length, 
        models: models.slice(0, 3),
        currentModel: model 
      });
      
      return models;
      
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setModelOptions([]);
      throw error; // 重新抛出错误给 handleConnect
    }
  }, [apiKey, providerId, baseUrl]); // 移除 model 和 setModel 依赖以避免循环

  // --- 默认模型设置逻辑 ---
  useEffect(() => {
    // 当模型列表变化且当前模型不在列表中时，设置第一个模型为默认
    if (modelOptions.length > 0 && !modelOptions.includes(model)) {
      setModel(modelOptions[0]);
    }
  }, [modelOptions, model, setModel]);

  // --- 模型变化时重新创建 Client ---
  // 🚫 暂时注释：这个 useEffect 导致无限循环，因为 setLlmClient 会触发整个状态树重建
  // useEffect(() => {
  //   // 当模型变化且已连接时，重新创建 client 以确保使用正确的模型
  //   if (status === 'connected' && model && apiKey && providerId) {
  //     console.log('Model changed, recreating client:', { model, providerId });
  //     const config = {
  //       apiKey,
  //       baseURL: baseUrl || undefined,
  //     };
  //     const tokenJsClient = new TokenJS(config);
  //     const newClient = new LlmClient(tokenJsClient, providerId, model);
  //     setLlmClient(newClient);
  //   }
  // }, [model, status, apiKey, providerId, baseUrl]);

  // --- Handlers ---
  const handleConnect = useCallback(async () => {
    if (!apiKey) {
      setError(new Error('API Key is required.'));
      return;
    }
    setStatus('connecting');
    setError(null);

    try {
      // 直接通过获取模型来验证连接
      const fetchedModels = await fetchModels();
      
      // 检查是否获取到模型
      if (fetchedModels.length === 0) {
        throw new Error('No models found for this provider');
      }
      
      // 如果模型获取成功，创建 client 并设置为已连接
      const config = {
        apiKey,
        baseURL: baseUrl || undefined,
      };
      const tokenJsClient = new TokenJS(config);
      const client = new LlmClient(tokenJsClient, providerId, model);
      setLlmClient(client);
      setStatus('connected');
      
      console.log('handleConnect success:', { 
        status: 'connected', 
        providerId, 
        model,
        fetchedModelsCount: fetchedModels.length
      });
    } catch (e) {
      const connectError = e instanceof Error ? e : new Error('Connection failed: ' + String(e));
      setError(connectError);
      setStatus('disconnected');
      setLlmClient(null);
      setModelOptions([]); // 清空模型列表
    }
  }, [apiKey, baseUrl, providerId, model, fetchModels]);

  const handleDisconnect = useCallback(() => {
    setLlmClient(null);
    setApiKey(''); // Clear API key on disconnect for security
    setStatus('disconnected');
    setError(null);
    setModelOptions([]); // Clear model list on disconnect
  }, []);

  // 🔥 核心修复：用 useMemo 稳定所有返回对象的引用，避免无限重渲染
  const states = useMemo(() => ({
    providerId,
    apiKey,
    baseUrl,
    model,
    status,
    error,
    modelOptions,
    tokenUsage,
    llmClient,
  }), [providerId, apiKey, baseUrl, model, status, error, modelOptions, tokenUsage, llmClient]);

  // --- 不自动获取模型，由用户手动触发或在连接时获取 ---
  // useEffect(() => {
  //   if (apiKey && providerId) {
  //     fetchModels();
  //   }
  // }, [fetchModels]);

  const handlers = useMemo(() => ({
    setProviderId,
    setApiKey,
    setBaseUrl,
    setModel,
    handleConnect,
    handleDisconnect,
    fetchModels,
    setTokenUsage, // Will be used by the LlmClient wrapper later
  }), [setProviderId, setApiKey, setBaseUrl, setModel, handleConnect, handleDisconnect, fetchModels, setTokenUsage]);

  return useMemo(() => ({ 
    states, 
    handlers, 
    llmClient // 🎯 核心暴露点：所有功能都基于这个 client 实例
  }), [states, handlers, llmClient]);
};
