
import { useState } from 'react';
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
}

const ModelSelect: React.FC<ModelSelectProps> = ({ className, locale: localeOverride }) => {
  const {
    model, modelOptions, apiKey, status,
    setModel, fetchModels
  } = useConnectionManager();
  const [isOpen, setIsOpen] = useState(false);

  // Default locale setup
  const defaultLocale: ModelSelectLocale = {
    title: '1. Model Selector',
    placeholder: 'Select a model',
    fetchButton: 'Refresh',
    fetching: 'Fetching...',
    empty: 'No models available',
  };

  const locale = { ...defaultLocale, ...localeOverride };

  const handleToggle = () => {
    // 只要有 API Key 就允许操作
    if (!apiKey) {
      return;
    }
    
    // 如果模型列表为空且有API密钥，则获取模型列表
    if (modelOptions.length === 0 && apiKey) {
      fetchModels();
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (modelName: string) => {
    // 只要有 API Key 就允许选择模型
    if (!apiKey) {
      return;
    }
    setModel(modelName);
    setIsOpen(false);
  };

  // 根据 API Key 状态确定显示内容
  const hasApiKey = !!apiKey;
  const hasModels = modelOptions.length > 0;
  const displayText = hasApiKey 
    ? (model || locale.placeholder)
    : '请先输入 API Key';

  return (
    <div style={{ ...styles.container }} className={className}>
      <h2 style={styles.title}>{locale.title}</h2>
      <div style={styles.card}>
        <details style={styles.details} open={isOpen} onToggle={(e) => {
          e.preventDefault();
          handleToggle();
        }}>
          <summary 
            style={{
              ...styles.summary,
              cursor: hasApiKey ? 'pointer' : 'not-allowed',
              opacity: hasApiKey ? 1 : 0.6
            }}
            onMouseOver={(e) => {
              if (hasApiKey) {
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
                ...(hasApiKey ? styles.statusDotConnected : styles.statusDotDisconnected)
              }} 
              title={hasApiKey ? '可用' : '需要 API Key'}
            ></div>
            <span style={{
              ...styles.modelText,
              color: hasApiKey ? '#E5E7EB' : '#9CA3AF'
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
          {isOpen && hasApiKey && (
            <div 
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
                        ...(model === modelName ? styles.dropdownItemSelected : {})
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
                      {model === modelName && (
                        <svg style={styles.checkIcon} fill="currentColor" viewBox="0 0 20 20">
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
