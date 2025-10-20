import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载父目录的 .env 文件
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/api/ai/proxy/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    availableProviders: ['openai', 'siliconflow', 'gemini', 'lmstudio']
  });
});

// 主代理端点 - OpenAI 格式
app.post('/api/ai/proxy', async (req, res) => {
  try {
    const { model, messages, stream = false, provider = 'siliconflow', ...otherParams } = req.body;

    console.log('📨 Proxy request:', {
      provider,
      model,
      messageCount: messages?.length,
      stream
    });

    // 根据 provider 选择对应的 API
    let apiUrl, apiKey, headers, requestBody;

    switch (provider) {
      case 'siliconflow':
        apiUrl = 'https://api.siliconflow.cn/v1/chat/completions';
        apiKey = process.env.SILICONFLOW_API_KEY;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        requestBody = {
          model: model || 'Qwen/Qwen2.5-7B-Instruct',
          messages,
          stream,
          ...otherParams
        };
        break;

      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        apiKey = process.env.OPENAI_API_KEY;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        requestBody = {
          model: model || 'gpt-3.5-turbo',
          messages,
          stream,
          ...otherParams
        };
        break;

      case 'gemini':
        const geminiModel = model || 'gemini-1.5-flash';
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        headers = {
          'Content-Type': 'application/json'
        };
        // Gemini 使用不同的格式，需要转换
        requestBody = {
          contents: messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }))
        };
        break;

      case 'lmstudio':
        apiUrl = 'http://127.0.0.1:1234/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json'
        };
        requestBody = {
          model: model || 'local-model',
          messages,
          stream,
          ...otherParams
        };
        break;

      default:
        return res.status(400).json({
          error: `Unsupported provider: ${provider}`
        });
    }

    if (!apiKey && provider !== 'lmstudio') {
      return res.status(500).json({
        error: `API key not configured for provider: ${provider}`
      });
    }

    console.log('🔄 Forwarding to:', apiUrl);

    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return res.status(response.status).json({
        error: `API Error: ${response.status} - ${errorText}`
      });
    }

    if (stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 处理 Gemini 的特殊情况（Gemini 不支持流式）
      if (provider === 'gemini') {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        res.write(`data: ${JSON.stringify({
          choices: [{
            delta: { content: text },
            index: 0
          }]
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        // OpenAI 兼容格式的流式响应
        for await (const chunk of response.body) {
          res.write(chunk);
        }
        res.end();
      }
    } else {
      // 非流式响应
      const data = await response.json();

      // 处理 Gemini 响应格式转换
      if (provider === 'gemini') {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.json({
          choices: [{
            message: {
              role: 'assistant',
              content: text
            },
            finish_reason: 'stop',
            index: 0
          }],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          },
          model: model || 'gemini-1.5-flash'
        });
      }

      // 直接返回 OpenAI 格式的响应
      res.json(data);
    }

    console.log('✅ Request completed successfully');

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 LLM Backend Proxy Server                             ║
║                                                            ║
║   Status: Running                                          ║
║   Port: ${PORT}                                           ║
║   URL: http://localhost:${PORT}                           ║
║                                                            ║
║   Endpoints:                                               ║
║   - POST /api/ai/proxy (main proxy)                       ║
║   - GET  /api/ai/proxy/health (health check)             ║
║                                                            ║
║   Supported Providers:                                     ║
║   ✅ SiliconFlow (硅基流动)                                ║
║   ✅ OpenAI                                                ║
║   ✅ Google Gemini                                         ║
║   ✅ LM Studio (Local)                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  // 检查 API Keys
  console.log('\n📋 API Keys Status:');
  console.log(`   SiliconFlow: ${process.env.SILICONFLOW_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   OpenAI:      ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Gemini:      ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   LM Studio:   ✅ Local (http://127.0.0.1:1234)`);
  console.log('');
});
