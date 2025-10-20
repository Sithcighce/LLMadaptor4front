# LM Studio Provider

LM Studio 本地 LLM 服务器支持。

## 概述

LM Studio 是一个桌面应用，可以在本地运行各种开源 LLM 模型。此 Provider 提供与 LM Studio 本地服务器的连接。

## 特性

- ✅ **完全本地** - 数据不离开本机
- ✅ **无需 API Key** - 免费使用
- ✅ **多模型支持** - 支持所有 LM Studio 可用模型
- ✅ **OpenAI 兼容** - 使用标准 OpenAI API 格式
- ✅ **自动发现** - 自动获取可用模型列表

## 前置条件

1. 下载并安装 [LM Studio](https://lmstudio.ai/)
2. 在 LM Studio 中下载至少一个模型
3. 启动 LM Studio 的本地服务器

### 启动 LM Studio 服务器

1. 打开 LM Studio 应用
2. 加载一个模型
3. 点击 "Start Server" 或类似按钮
4. 默认运行在 `http://127.0.0.1:1234`

## 使用方法

### 1. 检查状态

```typescript
import { checkLMStudioStatus } from 'llm-connector';

const status = await checkLMStudioStatus();
console.log('LM Studio 运行中:', status);
```

### 2. 获取模型列表

```typescript
import { fetchLMStudioModels } from 'llm-connector';

const models = await fetchLMStudioModels('http://127.0.0.1:1234/v1');
console.log('可用模型:', models);
```

### 3. 连接

```typescript
import { LlmConnectorProvider, useLlmConnector } from 'llm-connector';

function MyComponent() {
  const { handlers } = useLlmConnector();
  
  const connect = async () => {
    handlers.setProviderId('lmstudio');
    handlers.setBaseUrl('http://127.0.0.1:1234/v1');
    handlers.setModel('your-model-name'); // 从模型列表中选择
    await handlers.handleConnect();
  };
  
  return <button onClick={connect}>连接 LM Studio</button>;
}
```

### 4. 聊天

```typescript
const { llmClient } = useLlmConnector();

const chat = async () => {
  const result = await llmClient.chat({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    stream: false
  });
  console.log(result.text);
};
```

## 配置参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `baseUrl` | string | ✅ | `'http://127.0.0.1:1234/v1'` | LM Studio 服务器地址 |
| `model` | string | ✅ | - | 模型名称（从 LM Studio 获取） |
| `apiKey` | string | ❌ | - | 不需要 |

## 推荐模型

- **Llama 3.1 8B** - 平衡性能和速度
- **Mistral 7B** - 快速响应
- **Qwen 2.5 7B** - 中文支持好
- **Phi-3 Mini** - 轻量级，适合低配置

## 性能优化

### 硬件要求
- **最低**: 8GB RAM
- **推荐**: 16GB+ RAM
- **最佳**: 32GB RAM + GPU

### 模型选择
- 小模型（3B-7B）：更快，适合聊天
- 中模型（13B-30B）：更好的质量
- 大模型（70B+）：需要强大硬件

## 故障排查

### 连接失败
1. 确认 LM Studio 正在运行
2. 检查服务器地址（默认 127.0.0.1:1234）
3. 确认模型已加载
4. 检查防火墙设置

### 响应缓慢
1. 使用更小的模型
2. 减少上下文长度
3. 关闭其他占用资源的程序
4. 考虑使用 GPU 加速

### 模型加载失败
1. 确认模型文件完整
2. 检查磁盘空间
3. 重新下载模型
4. 更新 LM Studio 版本

## 适用场景

- ✅ 隐私敏感应用
- ✅ 离线开发
- ✅ 本地测试
- ✅ 完全控制模型
- ✅ 无 API 成本

## 参考资料

- [LM Studio 官网](https://lmstudio.ai/)
- [LM Studio 文档](https://lmstudio.ai/docs)
- [模型下载](https://huggingface.co/models)
