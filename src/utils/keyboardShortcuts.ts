/**
 * 键盘快捷键处理工具
 * 
 * 从 useMessageHandler 中提取的键盘事件处理逻辑
 * 支持自定义快捷键和中断操作
 */

import { useEffect, useCallback } from 'react';

/**
 * 快捷键配置
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void | Promise<void>;
  description?: string;
}

/**
 * 键盘事件处理器 Hook
 * @param shortcuts - 快捷键配置数组
 * @param enabled - 是否启用快捷键
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[], 
  enabled: boolean = true
) => {
  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (!enabled) return;

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const metaMatch = !!shortcut.metaKey === event.metaKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        event.preventDefault();
        await shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return { handleKeyDown };
};

/**
 * 聊天相关的快捷键配置创建器
 */
export class ChatKeyboardShortcuts {
  /**
   * 创建发送消息快捷键（Enter 或 Ctrl+Enter）
   * @param onSend - 发送消息的回调
   * @param requireCtrl - 是否需要按住 Ctrl 键
   * @returns 快捷键配置
   */
  static createSendShortcut(onSend: () => void, requireCtrl: boolean = false): KeyboardShortcut {
    return {
      key: 'Enter',
      ctrlKey: requireCtrl,
      action: onSend,
      description: requireCtrl ? 'Ctrl+Enter to send' : 'Enter to send',
    };
  }

  /**
   * 创建中断响应快捷键（Escape）
   * @param onAbort - 中断响应的回调
   * @returns 快捷键配置
   */
  static createAbortShortcut(onAbort: () => void): KeyboardShortcut {
    return {
      key: 'Escape',
      action: onAbort,
      description: 'Escape to stop response',
    };
  }

  /**
   * 创建清空聊天快捷键（Ctrl+K）
   * @param onClear - 清空聊天的回调
   * @returns 快捷键配置
   */
  static createClearShortcut(onClear: () => void): KeyboardShortcut {
    return {
      key: 'k',
      ctrlKey: true,
      action: onClear,
      description: 'Ctrl+K to clear chat',
    };
  }

  /**
   * 创建聚焦输入框快捷键（Ctrl+L）
   * @param onFocus - 聚焦输入框的回调
   * @returns 快捷键配置
   */
  static createFocusShortcut(onFocus: () => void): KeyboardShortcut {
    return {
      key: 'l',
      ctrlKey: true,
      action: onFocus,
      description: 'Ctrl+L to focus input',
    };
  }

  /**
   * 创建重新生成响应快捷键（Ctrl+R）
   * @param onRegenerate - 重新生成响应的回调
   * @returns 快捷键配置
   */
  static createRegenerateShortcut(onRegenerate: () => void): KeyboardShortcut {
    return {
      key: 'r',
      ctrlKey: true,
      action: onRegenerate,
      description: 'Ctrl+R to regenerate response',
    };
  }

  /**
   * 创建默认的聊天快捷键集合
   * @param callbacks - 回调函数集合
   * @returns 快捷键配置数组
   */
  static createDefaultShortcuts(callbacks: {
    onSend?: () => void;
    onAbort?: () => void;
    onClear?: () => void;
    onFocus?: () => void;
    onRegenerate?: () => void;
  }): KeyboardShortcut[] {
    const shortcuts: KeyboardShortcut[] = [];

    if (callbacks.onSend) {
      shortcuts.push(ChatKeyboardShortcuts.createSendShortcut(callbacks.onSend, true));
    }

    if (callbacks.onAbort) {
      shortcuts.push(ChatKeyboardShortcuts.createAbortShortcut(callbacks.onAbort));
    }

    if (callbacks.onClear) {
      shortcuts.push(ChatKeyboardShortcuts.createClearShortcut(callbacks.onClear));
    }

    if (callbacks.onFocus) {
      shortcuts.push(ChatKeyboardShortcuts.createFocusShortcut(callbacks.onFocus));
    }

    if (callbacks.onRegenerate) {
      shortcuts.push(ChatKeyboardShortcuts.createRegenerateShortcut(callbacks.onRegenerate));
    }

    return shortcuts;
  }
}

/**
 * 聊天快捷键 Hook
 * @param callbacks - 回调函数集合
 * @param enabled - 是否启用快捷键
 * @returns 快捷键处理相关的函数和状态
 */
export const useChatKeyboardShortcuts = (
  callbacks: {
    onSend?: () => void;
    onAbort?: () => void;
    onClear?: () => void;
    onFocus?: () => void;
    onRegenerate?: () => void;
  },
  enabled: boolean = true
) => {
  const shortcuts = ChatKeyboardShortcuts.createDefaultShortcuts(callbacks);
  const { handleKeyDown } = useKeyboardShortcuts(shortcuts, enabled);

  /**
   * 获取快捷键帮助信息
   * @returns 快捷键描述数组
   */
  const getShortcutHelp = useCallback(() => {
    return shortcuts
      .filter(shortcut => shortcut.description)
      .map(shortcut => shortcut.description!);
  }, [shortcuts]);

  return {
    shortcuts,
    handleKeyDown,
    getShortcutHelp,
  };
};