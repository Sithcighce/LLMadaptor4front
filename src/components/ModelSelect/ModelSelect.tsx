
import { useState } from 'react';
import clsx from 'clsx';
import { useLlmConnector } from '../../hooks/useLlmConnector';
import type { ModelSelectLocale } from './types';

// Redefined props for the new architecture
interface ModelSelectProps {
  className?: string;
  locale?: Partial<ModelSelectLocale>;
}

const ModelSelect: React.FC<ModelSelectProps> = ({ className, locale: localeOverride }) => {
  const { states, handlers } = useLlmConnector();
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
    // The logic to fetch models will be implemented in the hook later
    // if (states.modelOptions.length === 0 && !states.isFetchingModels) {
    //   handlers.fetchModels();
    // }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (model: string) => {
    handlers.setModel(model);
    setIsOpen(false);
  };

  return (
    <div className={`mb-8 ${className || ''}`}>
      <h2 className="text-lg font-semibold mb-3 text-gray-400">{locale.title}</h2>
      <div className="p-4 bg-gray-900 rounded-lg">
        <details className="relative group" open={isOpen} onToggle={(e) => {
          e.preventDefault();
          handleToggle();
        }}>
          <summary className="flex items-center cursor-pointer p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-3 flex-shrink-0" title="Available"></div>
            <span className="text-sm font-medium text-gray-200 flex-grow">{states.model || locale.placeholder}</span>
            <svg className={clsx("w-4 h-4 text-gray-500 transition-transform", isOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          {isOpen && (
            <div className="dropdown-content absolute top-full left-0 mt-2 w-full bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700 max-h-60 overflow-y-auto">
               {states.modelOptions.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-400">{/*isFetching ? locale.fetching :*/ locale.empty}</div>
              ) : (
                <ul className="p-1">
                  {states.modelOptions.map((model) => (
                    <li 
                      key={model} 
                      className={clsx("text-sm text-gray-300 hover:bg-gray-700 rounded px-3 py-2 cursor-pointer flex justify-between items-center", {
                        'text-indigo-400': states.model === model
                      })}
                      onClick={() => handleSelect(model)}
                    >
                      {model}
                      {states.model === model && (
                        <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
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
