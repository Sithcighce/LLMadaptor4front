/**
 * 状态持久化工具函数
 * 
 * 从 useConnectorController 中提取的状态管理和持久化逻辑
 * 用于高级配置的状态持久化
 */

import type { ConnectorState } from '../types/AdvancedConfig';
import { getAllDefaultConfigs } from '../constants/DefaultConfigs';

/**
 * 从 localStorage 加载初始状态
 * @param storageKey - 存储键名
 * @returns 初始连接器状态
 */
export const loadInitialState = (storageKey: string): ConnectorState => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return {
      selectedProviderId: 'openai',
      providerConfigs: getAllDefaultConfigs(),
    };
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return {
        selectedProviderId: 'openai',
        providerConfigs: getAllDefaultConfigs(),
      };
    }

    const parsed = JSON.parse(stored) as ConnectorState;
    const defaultConfigs = getAllDefaultConfigs();
    
    // Merge parsed configs with defaults for all providers to satisfy typing
    return {
      selectedProviderId: parsed.selectedProviderId ?? 'openai',
      providerConfigs: {
        openai: { ...defaultConfigs.openai, ...(parsed.providerConfigs?.openai ?? {}) },
        anthropic: { ...defaultConfigs.anthropic, ...(parsed.providerConfigs?.anthropic ?? {}) },
        gemini: { ...defaultConfigs.gemini, ...(parsed.providerConfigs?.gemini ?? {}) },
        webllm: { ...defaultConfigs.webllm, ...(parsed.providerConfigs?.webllm ?? {}) },
        'chrome-ai': { ...defaultConfigs['chrome-ai'], ...(parsed.providerConfigs?.['chrome-ai'] ?? {}) },
        lmstudio: { ...defaultConfigs.lmstudio, ...(parsed.providerConfigs?.lmstudio ?? {}) },
        siliconflow: { ...defaultConfigs.siliconflow, ...(parsed.providerConfigs?.siliconflow ?? {}) },
        'backend-proxy': { ...defaultConfigs['backend-proxy'], ...(parsed.providerConfigs?.['backend-proxy'] ?? {}) },
      },
    };
  } catch (error) {
    console.warn('[LlmConnector] Failed to load state from localStorage', error);
    return {
      selectedProviderId: 'openai',
      providerConfigs: getAllDefaultConfigs(),
    };
  }
};

/**
 * 将状态持久化到 localStorage
 * @param storageKey - 存储键名
 * @param state - 要持久化的状态
 */
export const persistState = (storageKey: string, state: ConnectorState): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn('[LlmConnector] Failed to persist state to localStorage', error);
  }
};

/**
 * 清除持久化的状态
 * @param storageKey - 存储键名
 */
export const clearPersistedState = (storageKey: string): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn('[LlmConnector] Failed to clear persisted state', error);
  }
};