# LLM Backend Proxy

后端代理服务器，用于安全地调用各种 LLM API。

## 功能

- ✅ 支持 SiliconFlow（硅基流动）
- ✅ 支持 OpenAI
- ✅ 支持 Google Gemini
- ✅ 支持 LM Studio（本地）
- ✅ 流式和非流式响应
- ✅ API Key 安全管理
- ✅ 统一的 OpenAI 格式接口

## 安装

```bash
cd backend-proxy
npm install
```

## 配置

确保父目录的 `.env` 文件包含必要的 API Keys：

```env
SILICONFLOW_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

## 启动

```bash
npm start
```

服务器将在 `http://localhost:3001` 启动。

## API 端点

### POST /api/ai/proxy

主代理端点，接受 OpenAI 格式的请求。

**请求体**:
```json
{
  "provider": "siliconflow",  // 可选: siliconflow, openai, gemini, lmstudio
  "model": "Qwen/Qwen2.5-7B-Instruct",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "stream": false
}
```

**响应**: OpenAI 格式的响应

### GET /api/ai/proxy/health

健康检查端点。

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T...",
  "availableProviders": ["openai", "siliconflow", "gemini", "lmstudio"]
}
```

## 在前端中使用

在前端项目中，将 Backend Proxy 的 Base URL 设置为：

```
http://localhost:3001/api/ai/proxy
```

然后选择 "Backend Proxy" 作为 Provider 即可。

## 开发模式

```bash
npm run dev
```

使用 Node.js 的 `--watch` 模式，文件修改后自动重启。
