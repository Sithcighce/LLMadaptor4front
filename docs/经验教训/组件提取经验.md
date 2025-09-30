# 从 useConnectorController 提取的组件

## 📋 提取的文件说明

这些文件是从 `useConnectorController.ts` 中提取的有价值组件，避免在删除时丢失重要功能。

### 🛠️ 工具函数

#### `src/utils/configValidation.ts`
- **parseJsonObject** - JSON 解析和验证
- **normalizeHeaders** - 请求头标准化
- **validateRequired** - 必填字段验证
- **validateUrl** - URL 格式验证

#### `src/utils/modelFetcher.ts`
- **fetchOpenAIModels** - 获取 OpenAI 模型列表
- **fetchAnthropicModels** - 获取 Anthropic 模型列表
- **fetchGeminiModels** - 获取 Gemini 模型列表
- **fetchModelsForProvider** - 统一的模型获取接口

#### `src/utils/providerFactory.ts`
- **buildOpenAIProvider** - 构建 OpenAI Provider
- **buildAnthropicProvider** - 构建 Anthropic Provider  
- **buildGeminiProvider** - 构建 Gemini Provider
- **buildWebLLMProvider** - 构建 WebLLM Provider
- **buildProvider** - 统一的 Provider 构建接口

### 📊 配置和类型

#### `src/constants/DefaultConfigs.ts`
- **DEFAULT_PROVIDER_CONFIGS** - 所有 Provider 的默认配置
- **ProviderId** - Provider ID 类型
- **ProviderConfigState** - Provider 配置状态类型
- **getDefaultConfig** - 获取单个 Provider 默认配置
- **getAllDefaultConfigs** - 获取所有默认配置

#### `src/types/AdvancedConfig.ts`
- **ConnectorState** - 连接器状态类型
- **ConnectorStatus** - 连接状态类型
- **TokenUsage** - Token 使用统计类型
- **ConnectionContext** - 连接上下文类型
- **ConnectResult** - 连接结果类型
- **AdvancedConnectorController** - 高级连接器控制器接口

## 🎯 使用场景

### 当前使用
这些组件暂时不会被直接使用，但为未来功能做好了准备。

### 未来使用
- **useAdvancedSettings** - 高级参数配置功能
- **useChatManager** - 可能需要使用配置验证工具
- **模型管理功能** - 使用模型获取工具
- **Provider 切换功能** - 使用 Provider 工厂

## 🔄 迁移说明

原 `useConnectorController.ts` 的主要功能已经分解为：

1. **工具函数** → `utils/` 目录
2. **配置常量** → `constants/` 目录  
3. **类型定义** → `types/` 目录
4. **核心逻辑** → 保留在 `useLlmConnectorLogic.ts` 中

## ⚠️ 注意事项

- 这些文件目前可能存在未解决的依赖关系
- 在使用前需要确保所有导入路径正确
- 类型定义可能需要根据实际使用情况调整
- 建议在实现 `useAdvancedSettings` 时逐步测试这些组件

## 🗑️ 清理完成

✅ 有价值的组件已提取完毕  
✅ 可以安全删除 `useConnectorController.ts`  
✅ 为未来功能开发做好准备