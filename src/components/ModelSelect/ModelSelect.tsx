
import { useState, useEffect, useCallback } from 'react';
import { useConnectionManager } from '../../hooks/useConnectionManager';
import type { ModelSelectLocale } from './types';

// 内嵌样式，确保开箱即用
const styles = {
  container: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#9CA3AF', /* text-gray-400 */
  },
  card: {
    padding: '1rem',
    backgroundColor: '#111827', /* bg-gray-900 */
    borderRadius: '0.5rem',
  },
  details: {
    position: 'relative' as const,
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '0.5rem',
    backgroundColor: '#1F2937', /* bg-gray-800 */
    borderRadius: '0.375rem',
    transition: 'background-color 0.15s ease-in-out',
    listStyle: 'none',
  },
  summaryHover: {
    backgroundColor: '#374151', /* hover:bg-gray-700 */
  },
  statusDot: {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    marginRight: '0.75rem',
    flexShrink: 0,
  },
  statusDotConnected: {
    backgroundColor: '#10B981', /* bg-green-500 */
  },
  statusDotDisconnected: {
    backgroundColor: '#6B7280', /* bg-gray-500 */
  },
  modelText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#E5E7EB', /* text-gray-200 */
    flexGrow: 1,
  },
  arrow: {
    width: '1rem',
    height: '1rem',
    color: '#6B7280', /* text-gray-500 */
    transition: 'transform 0.15s ease-in-out',
    transform: 'rotate(0deg)',
  },
  arrowOpen: {
    transform: 'rotate(180deg)',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    width: '100%',
    backgroundColor: '#1F2937', /* bg-gray-800 */
    borderRadius: '0.375rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 10,
    border: '1px solid #374151', /* border-gray-700 */
    maxHeight: '15rem',
    overflowY: 'auto' as const,
    /* 隐藏滚动条 */
    msOverflowStyle: 'none' as const,
    scrollbarWidth: 'none' as const,
  },
  dropdownList: {
    padding: '0.25rem',
    margin: 0,
    listStyle: 'none',
  },
  dropdownItem: {
    fontSize: '0.875rem',
    color: '#D1D5DB', /* text-gray-300 */
    borderRadius: '0.25rem',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemHover: {
    backgroundColor: '#374151', /* hover:bg-gray-700 */
  },
  dropdownItemSelected: {
    color: '#818CF8', /* text-indigo-400 */
  },
  checkIcon: {
    width: '1rem',
    height: '1rem',
    color: '#818CF8', /* text-indigo-400 */
  },
  emptyState: {
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
    fontSize: '0.875rem',
    color: '#9CA3AF', /* text-gray-400 */
  },
};

// Redefined props for the new architecture
interface ModelSelectProps {
  className?: string;
  locale?: Partial<ModelSelectLocale>;
  /** 可选的Client名称，用于显式查找Client实例 */
  clientName?: string;
}

const ModelSelect: React.FC<ModelSelectProps> = ({ className, locale: localeOverride, clientName }) => {
  const {
    model, modelOptions, apiKey, status,
    setModel, fetchModels
  } = useConnectionManager(clientName);
  
  // 🔥 关键修复：使用本地状态管理选择，延迟提交到全局状态
  const [selectedModel, setSelectedModel] = useState(model); // 本地选择状态
  const [isOpen, setIsOpen] = useState(false);
  
  // 当全局模型变化时，同步到本地状态（比如连接后设置默认模型）
  useEffect(() => {
    if (model && model !== selectedModel) {
      setSelectedModel(model);
    }
  }, [model]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        const target = event.target as Element;
        const dropdown = document.querySelector('[data-modelselect-dropdown]');
        const summary = document.querySelector('[data-modelselect-summary]');
        
        if (dropdown && summary && 
            !dropdown.contains(target) && 
            !summary.contains(target)) {
          // 点击外部时，如果有未保存的更改则提交
          if (selectedModel !== model) {
            setModel(selectedModel);
          }
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectedModel, model, setModel]);

  // 监听连接状态变化，确保组件及时更新
  useEffect(() => {
    console.log('ModelSelect status changed:', { status, modelOptionsCount: modelOptions.length });
  }, [status, modelOptions.length]);

  // Default locale setup
  const defaultLocale: ModelSelectLocale = {
    title: '1. Model Selector',
    placeholder: 'Select a model',
    fetchButton: 'Refresh',
    fetching: 'Fetching...',
    empty: 'No models available',
  };

  const locale = { ...defaultLocale, ...localeOverride };

  const handleToggle = useCallback(() => {
    // 只要连接成功就允许操作
    if (status !== 'connected') {
      return;
    }
    
    // 如果要打开下拉且没有模型列表，尝试获取
    if (!isOpen && modelOptions.length === 0) {
      fetchModels();
    }
    
    // 如果要关闭下拉，且本地选择与全局不同，则提交更改
    if (isOpen && selectedModel !== model) {
      setModel(selectedModel); // 🔥 延迼提交：关闭时才提交到全局状态
    }
    
    setIsOpen((prev) => !prev);
  }, [status, isOpen, modelOptions.length, selectedModel, model, fetchModels, setModel]);

  const handleSelect = useCallback((modelName: string) => {
    // 只有在连接成功时才允许选择模型
    if (status !== 'connected') {
      return;
    }
    // 🔥 关键修复：只更新本地状态，不立即提交到全局
    setSelectedModel(modelName);
    // 注意：不关闭下拉，让用户可以继续选择或点击外部关闭
  }, [status]);

  // 简化逻辑：只要连接成功就可用
  const isConnected = status === 'connected';
  const hasModels = modelOptions.length > 0;
  const isAvailable = isConnected; // 连接成功就可用，不管模型列表
  
  // 状态计算完成，准备渲染
  
  const getDisplayText = () => {
    if (status === 'connecting') return '连接中...';
    if (!isConnected) return '请先连接';
    if (isConnected && !hasModels) return '加载模型中...'; // 连接成功但模型还没加载完
    // 显示本地选择的模型
    return selectedModel || model || locale.placeholder;
  };
  
  const displayText = getDisplayText();

  return (
    <div style={{ ...styles.container }} className={className}>
      <h2 style={styles.title}>{locale.title}</h2>
      
      {/* 🐛 调试界面 - 已注释，如需调试请取消注释 */}
      {/* <div style={{
        padding: '0.5rem',
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        color: '#94A3B8',
        marginBottom: '0.5rem'
      }}>
        <div><strong>🐛 ModelSelect Debug:</strong></div>
        <div>status: <span style={{color: status === 'connected' ? '#10B981' : '#EF4444'}}>{status}</span></div>
        <div>apiKey: {apiKey ? `${apiKey.slice(0, 10)}...` : 'null'}</div>
        <div>model: <span style={{color: '#60A5FA'}}>{model || 'null'}</span></div>
        <div>modelOptions.length: <span style={{color: '#F59E0B'}}>{modelOptions.length}</span></div>
        <div>isAvailable: <span style={{color: isAvailable ? '#10B981' : '#EF4444'}}>{isAvailable.toString()}</span></div>
        <div>displayText: "{displayText}"</div>
        {modelOptions.length > 0 && (
          <div>models: {modelOptions.slice(0, 3).join(', ')}{modelOptions.length > 3 ? '...' : ''}</div>
        )}
      </div> */}




      <div style={styles.card}>
        <details style={styles.details} open={isOpen}>
          <summary 
            data-modelselect-summary
            style={{
              ...styles.summary,
              cursor: isAvailable ? 'pointer' : 'not-allowed',
              opacity: isAvailable ? 1 : 0.6
            }}
            onClick={(e) => {
              e.preventDefault(); // 阻止原生 details 行为
              e.stopPropagation(); // 阻止事件冒泡
              handleToggle();
            }}
            onMouseOver={(e) => {
              if (isAvailable) {
                e.currentTarget.style.backgroundColor = styles.summaryHover.backgroundColor;
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = styles.summary.backgroundColor;
            }}
          >
            <div 
              style={{
                ...styles.statusDot,
                ...(isAvailable ? styles.statusDotConnected : styles.statusDotDisconnected)
              }} 
              title={isAvailable ? '可用' : (
                status === 'connecting' ? '连接中' : 
                !isConnected ? '未连接' : '没有模型'
              )}
            ></div>
            <span style={{
              ...styles.modelText,
              color: isAvailable ? '#E5E7EB' : '#9CA3AF'
            }}>{displayText}</span>
            <svg 
              style={{
                ...styles.arrow,
                ...(isOpen ? styles.arrowOpen : {})
              }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          {isOpen && isAvailable && (
            <div 
              data-modelselect-dropdown
              style={styles.dropdown}
              onLoad={(e) => {
                // 隐藏滚动条的额外样式
                const element = e.currentTarget;
                element.style.setProperty('-webkit-scrollbar', 'none');
              }}
            >
               {!hasModels ? (
                <div style={styles.emptyState}>
                  <div>{locale.empty}</div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fetchModels();
                    }}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#374151',
                      color: '#D1D5DB',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    {locale.fetchButton}
                  </button>
                </div>
              ) : (
                <ul style={styles.dropdownList}>
                  {modelOptions.map((modelName) => (
                    <li 
                      key={modelName} 
                      style={{
                        ...styles.dropdownItem,
                        // 🔥 基于本地选择状态来显示选中状态
                        ...(selectedModel === modelName ? styles.dropdownItemSelected : {})
                      }}
                      onClick={() => handleSelect(modelName)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = styles.dropdownItemHover.backgroundColor;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {modelName}
                      {/* 显示两种状态：本地选中 (蓝色勾) 和全局生效 (绿色勾) */}
                      {selectedModel === modelName && (
                        <svg style={{
                          ...styles.checkIcon,
                          color: selectedModel === model ? '#10B981' : '#818CF8' // 已生效：绿色，待提交：蓝色
                        }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </details>
      </div>
    </div>
  );
};

export default ModelSelect;
