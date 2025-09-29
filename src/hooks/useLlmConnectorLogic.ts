
import { useState, useCallback, useEffect } from 'react';
import { TokenJS } from 'token.js/dist/index.cjs';
import { LlmClient } from '../client/LlmClient';
import type { ProviderId, ConnectorStatus, TokenUsage } from '../types';

const LOCAL_STORAGE_KEY = 'llm-connector-config';

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

  const handlers = {
    setProviderId,
    setApiKey,
    setBaseUrl,
    setModel,
    handleConnect,
    handleDisconnect,
    setTokenUsage, // Will be used by the LlmClient wrapper later
  };

  return { states, handlers, llmClient };
};
