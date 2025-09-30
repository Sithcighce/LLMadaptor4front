
import { useState, useCallback, useEffect } from 'react';
import { TokenJS } from 'token.js/dist/index.cjs';
import { LlmClient } from '../client/LlmClient';
import type { ProviderId, ConnectorStatus, TokenUsage } from '../types';

const LOCAL_STORAGE_KEY = 'llm-connector-config';

/**
 * 🔥 LLM Connector 核心基础设施 Hook
 * 
 * 这是整个 LLM 生态系统的核心基础设施，负责：
 * 1. 管理 llmClient 实例（最重要的核心暴露点）
 * 2. 处理基础配置和状态管理
 * 3. 提供持久化存储功能
 * 4. 为所有功能层 Hook 提供基础服务
 * 
 * 🎯 设计原则：
 * - 专注于核心基础设施，不包含具体的 UI 业务逻辑
 * - 为扩展功能预留接口（llmClient 是核心）
 * - 其他功能 Hook 都应该基于这个核心来构建
 * 
 * 🚀 扩展说明：
 * - 未来的聊天、参数配置、工具注册等功能都会基于 llmClient 来实现
 * - 请参考 hooks/README.md 了解完整的架构设计
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

  // --- Handlers ---
  const handleConnect = useCallback(async () => {
    if (!apiKey) {
      setError(new Error('API Key is required.'));
      return;
    }
    setStatus('connecting');
    setError(null);

    try {
      const config = {
        apiKey,
        baseURL: baseUrl || undefined,
      };
      const tokenJsClient = new TokenJS(config);
      
      // For now, we can't fetch models from token.js, so we'll use a default
      // In the future, we could try a test call or use a method if token.js provides one.
      setModelOptions([model]);

      const client = new LlmClient(tokenJsClient, providerId, model);
      setLlmClient(client);
      setStatus('connected');
    } catch (e) {
      const connectError = e instanceof Error ? e : new Error('Failed to connect');
      setError(connectError);
      setStatus('disconnected');
      setLlmClient(null);
    }
  }, [apiKey, baseUrl, providerId, model]);

  const handleDisconnect = useCallback(() => {
    setLlmClient(null);
    setApiKey(''); // Clear API key on disconnect for security
    setStatus('disconnected');
    setError(null);
  }, []);

  const states = {
    providerId,
    apiKey,
    baseUrl,
    model,
    status,
    error,
    modelOptions,
    tokenUsage,
    llmClient,
  };

  // --- Fetch Models Handler ---
  const fetchModels = useCallback(async () => {
    if (!apiKey) {
      console.warn('API Key is required to fetch models');
      return;
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
          throw new Error(`Failed to fetch models (${response.status})`);
        }
        
        const payload = await response.json();
        models = (payload.data ?? []).map((item: { id: string }) => item.id);
        
      } else if (providerId === 'anthropic') {
        const headers: Record<string, string> = {
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
        };
        
        const apiRoot = (baseUrl || 'https://api.anthropic.com/v1/messages').replace(/\/messages?$/, '');
        const response = await fetch(`${apiRoot}/models`, { headers });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch models (${response.status})`);
        }
        
        const payload = await response.json();
        models = (payload.data ?? []).map((item: { id?: string; name?: string }) => item.id ?? item.name).filter(Boolean) as string[];
        
      } else if (providerId === 'google') {
        const apiRoot = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
        const url = `${apiRoot}/models?key=${encodeURIComponent(apiKey.trim())}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch models (${response.status})`);
        }
        
        const payload = await response.json();
        models = (payload.models ?? [])
          .filter((item: { name: string }) => item.name.includes('generateContent'))
          .map((item: { name: string }) => item.name.replace('models/', ''));
      }

      setModelOptions(models);
      
      // 如果当前模型不在列表中，设置第一个模型为默认
      if (models.length > 0 && !models.includes(model)) {
        setModel(models[0]);
      }
      
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // 发生错误时清空模型列表
      setModelOptions([]);
    }
  }, [apiKey, providerId, model, baseUrl]);

  // --- Fetch models when provider or apiKey changes ---
  useEffect(() => {
    if (apiKey && providerId) {
      fetchModels();
    }
  }, [fetchModels]);

  const handlers = {
    setProviderId,
    setApiKey,
    setBaseUrl,
    setModel,
    handleConnect,
    handleDisconnect,
    fetchModels,
    setTokenUsage, // Will be used by the LlmClient wrapper later
  };

  return { 
    states, 
    handlers, 
    llmClient // 🎯 核心暴露点：所有功能都基于这个 client 实例
  };
};
