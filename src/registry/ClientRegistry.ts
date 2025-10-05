/**
 * Client Registry - 管理命名的LLM Client实例
 */

import type { LlmConnectorContextType } from '../contexts/LlmConnectorContext';

class ClientRegistry {
  private static clients = new Map<string, LlmConnectorContextType>();

  /**
   * 注册一个命名的Client实例
   */
  static register(name: string, client: LlmConnectorContextType): void {
    this.clients.set(name, client);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ClientRegistry] Registered client: "${name}"`);
    }
  }

  /**
   * 获取指定名称的Client实例
   */
  static get(name: string): LlmConnectorContextType | undefined {
    return this.clients.get(name);
  }

  /**
   * 获取指定名称的Client实例，找不到时抛出错误
   */
  static getOrThrow(name: string): LlmConnectorContextType {
    const client = this.get(name);
    if (!client) {
      const availableClients = Array.from(this.clients.keys());
      throw new Error(
        `Client "${name}" not found. Available clients: ${
          availableClients.length > 0 ? availableClients.join(', ') : 'none'
        }`
      );
    }
    return client;
  }

  /**
   * 注销指定名称的Client实例
   */
  static unregister(name: string): boolean {
    const existed = this.clients.has(name);
    this.clients.delete(name);
    
    if (process.env.NODE_ENV === 'development' && existed) {
      console.log(`[ClientRegistry] Unregistered client: "${name}"`);
    }
    
    return existed;
  }

  /**
   * 获取所有已注册的Client名称
   */
  static getRegisteredNames(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 检查指定名称的Client是否存在
   */
  static has(name: string): boolean {
    return this.clients.has(name);
  }

  /**
   * 清空所有注册的Client（主要用于测试）
   */
  static clear(): void {
    this.clients.clear();
  }
}

export { ClientRegistry };