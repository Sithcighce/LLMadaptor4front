# 部署 Bug 调研与解决方案

## Bug 现象

```
17:00:45.368 Error: Command "npm run build" exited with 1
17:00:45.352 [31merror during build:
17:00:45.353 Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
```

## 问题分析

### 1. 根本原因

**LightningCSS 原生依赖问题**

- **什么是 LightningCSS**: 一个用 Rust 编写的极快的 CSS 解析器、转换器和压缩器
- **依赖关系**: `@tailwindcss/postcss` v4.x 内部依赖 `lightningcss`
- **问题本质**: LightningCSS 使用平台特定的原生二进制文件（.node 文件）
- **部署环境不匹配**: 
  - 本地开发环境: Windows (`lightningcss-win32-x64-msvc`)
  - Vercel 部署环境: Linux x64 GNU (`lightningcss-linux-x64-gnu.node`)

### 2. 为什么会出现这个问题

#### 2.1 Tailwind CSS v4 的架构变化
```json
// package.json 中的依赖
"@tailwindcss/postcss": "^4.1.13"  // v4 版本完全重写，使用原生性能
```

Tailwind CSS v4:
- 使用 Rust 重写核心引擎（通过 LightningCSS）
- 大幅提升性能（10-100x 速度提升）
- **代价**: 引入了平台特定的原生二进制依赖

#### 2.2 npm install 的 optionalDependencies 处理
```json
// lightningcss 的 package.json
"optionalDependencies": {
  "lightningcss-darwin-arm64": "1.30.1",
  "lightningcss-darwin-x64": "1.30.1",
  "lightningcss-linux-arm64-gnu": "1.30.1",
  "lightningcss-linux-x64-gnu": "1.30.1",   // ⚠️ 部署环境需要这个
  "lightningcss-win32-x64-msvc": "1.30.1"   // 本地开发使用这个
}
```

**问题流程**:
1. 本地 Windows 环境 `npm install` → 只下载 `lightningcss-win32-x64-msvc`
2. `package-lock.json` 锁定了依赖树结构
3. Vercel 部署时在 Linux 环境运行 `npm install`
4. 如果 `package-lock.json` 中缺少 Linux 平台的包，或者 npm 缓存问题
5. → 找不到 `lightningcss.linux-x64-gnu.node` → 构建失败

### 3. 其他警告分析

```
npm warn deprecated node-domexception@1.0.0
npm warn deprecated @aws-sdk/signature-v4@3.374.0
npm warn deprecated @aws-sdk/protocol-http@3.374.0
```

这些是**次要问题**，是依赖链中过时包的警告，不影响构建：
- `node-domexception`: 某个依赖使用的旧包
- AWS SDK 警告: 可能来自 `@mlc-ai/web-llm` 的依赖链

## 解决方案

### 方案 1: 确保 optionalDependencies 正确安装（推荐）✅

**原理**: 确保所有平台的原生依赖都被正确解析和缓存

```json
// package.json - 添加到项目中
{
  "optionalDependencies": {
    "lightningcss-linux-x64-gnu": "^1.30.1",
    "lightningcss-win32-x64-msvc": "^1.30.1",
    "lightningcss-darwin-arm64": "^1.30.1"
  }
}
```

**执行步骤**:
```powershell
# 1. 删除现有的 lock 文件和 node_modules
Remove-Item package-lock.json
Remove-Item -Recurse -Force node_modules

# 2. 清除 npm 缓存
npm cache clean --force

# 3. 重新安装
npm install

# 4. 提交新的 package-lock.json
git add package.json package-lock.json
git commit -m "fix: add lightningcss platform-specific dependencies"
git push
```

**优点**:
- ✅ 直接解决问题根源
- ✅ 适用于所有部署平台
- ✅ 不改变技术栈

**缺点**:
- ⚠️ 增加少量依赖体积（~5-10MB）

---

### 方案 2: 降级到 Tailwind CSS v3（备选）

**原理**: 回退到不使用原生依赖的稳定版本

```json
// package.json
{
  "devDependencies": {
    "tailwindcss": "^3.4.1",  // v3 最新版
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.16"
  },
  "dependencies": {
    // 移除 @tailwindcss/postcss
  }
}
```

```javascript
// postcss.config.js - 恢复 v3 配置
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**执行步骤**:
```powershell
# 1. 卸载 v4 相关包
npm uninstall @tailwindcss/postcss tailwindcss

# 2. 安装 v3
npm install -D tailwindcss@^3.4.1

# 3. 更新配置文件
# 修改 postcss.config.js（见上方）

# 4. 测试构建
npm run build
```

**优点**:
- ✅ 稳定性高，生产环境广泛使用
- ✅ 无原生依赖问题

**缺点**:
- ❌ 失去 v4 的性能优势
- ❌ 无法使用 v4 新特性
- ❌ 倒退的技术选择

---

### 方案 3: 使用 Vercel 特定配置

**原理**: 在 Vercel 构建时跳过某些优化

创建 `vercel.json`:
```json
{
  "buildCommand": "npm install --include=optional && npm run build",
  "installCommand": "npm install --include=optional",
  "framework": "vite"
}
```

或使用环境变量强制安装所有依赖：
```json
// vercel.json
{
  "build": {
    "env": {
      "NPM_CONFIG_OPTIONAL": "true"
    }
  }
}
```

**优点**:
- ✅ 不改变本地开发环境
- ✅ 针对性解决部署问题

**缺点**:
- ⚠️ 只适用于 Vercel
- ⚠️ 增加构建时间

---

### 方案 4: 使用 CSS 处理替代方案

**原理**: 完全移除 Tailwind，使用其他方案

```json
// 选项 A: UnoCSS（推荐，性能更好）
{
  "devDependencies": {
    "unocss": "^0.58.0",
    "@unocss/reset": "^0.58.0"
  }
}

// 选项 B: 纯 CSS + CSS Modules
// 无需任何 CSS 框架依赖
```

**优点**:
- ✅ 彻底避免原生依赖
- ✅ 更灵活的选择

**缺点**:
- ❌ 需要大量重构 UI 代码
- ❌ 学习成本高

---

## 推荐实施顺序

### 立即执行（5分钟）
✅ **方案 1**: 添加 optionalDependencies

### 如果方案1失败（15分钟）
🔄 **方案 3**: 添加 Vercel 特定配置

### 如果要长期稳定（30分钟）
⏱️ **方案 2**: 降级到 Tailwind v3

### 如果重构项目（数小时）
🔮 **方案 4**: 切换到其他 CSS 方案

---

## 验证步骤

### 本地验证
```powershell
# 清理环境
Remove-Item -Recurse -Force node_modules, dist, .vite
Remove-Item package-lock.json

# 重新安装和构建
npm install
npm run build

# 检查构建产物
ls dist
```

### 部署前验证
```powershell
# 模拟生产构建
$env:NODE_ENV="production"
npm run build
npm run preview
```

### 部署后验证
1. 查看 Vercel 构建日志是否有错误
2. 检查部署的网站是否正常加载
3. 检查 CSS 样式是否正确应用

---

## 预防措施

### 1. 依赖管理最佳实践
```json
// package.json - 固定关键依赖版本
{
  "devDependencies": {
    "tailwindcss": "4.1.13",  // 不使用 ^ 避免意外升级
    "@tailwindcss/postcss": "4.1.13"
  }
}
```

### 2. CI/CD 检查
```yaml
# .github/workflows/ci.yml
- name: Test build on Linux
  runs-on: ubuntu-latest
  steps:
    - run: npm ci
    - run: npm run build
```

### 3. 文档更新
在 README.md 中添加：
```markdown
## 部署注意事项
本项目使用 Tailwind CSS v4，依赖平台特定的原生二进制文件。
如遇到 `lightningcss` 相关错误，请参考 docs/部署bug调研+解决方案.md
```

---

## 技术背景补充

### LightningCSS vs PostCSS
| 特性 | LightningCSS | PostCSS |
|------|--------------|---------|
| 语言 | Rust (原生) | JavaScript |
| 速度 | 100x 更快 | 基准线 |
| 平台依赖 | ✅ 有（.node文件） | ❌ 无 |
| 生态系统 | 🆕 新兴 | 🎯 成熟 |

### 原生模块工作原理
```
lightningcss (npm 包)
  ├── index.js (JavaScript 接口)
  └── optionalDependencies/
      ├── lightningcss-linux-x64-gnu (Linux)
      │   └── lightningcss.linux-x64-gnu.node  ← 二进制文件
      ├── lightningcss-win32-x64-msvc (Windows)
      │   └── lightningcss.win32-x64-msvc.node
      └── lightningcss-darwin-arm64 (macOS M1/M2)
          └── lightningcss.darwin-arm64.node
```

部署时，Node.js 根据 `process.platform` 和 `process.arch` 动态加载对应的 .node 文件。

---

## 相关资源

- [Tailwind CSS v4 Beta 文档](https://tailwindcss.com/docs/v4-beta)
- [LightningCSS GitHub](https://github.com/parcel-bundler/lightningcss)
- [Vercel 构建配置](https://vercel.com/docs/build-step)
- [npm optionalDependencies 说明](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#optionaldependencies)

---

## 更新日志

- **2025-10-20**: 初始版本，分析 lightningcss 部署问题
