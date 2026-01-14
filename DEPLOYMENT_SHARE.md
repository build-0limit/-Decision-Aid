# 分享功能部署指南

## 前提条件

1. 已安装 Node.js 和 npm
2. 已安装 Wrangler CLI：`npm install -g wrangler`
3. 拥有 Cloudflare 账户
4. 已登录 Wrangler：`wrangler login`

## 部署步骤

### 1. 创建 KV 命名空间

```bash
# 创建生产环境 KV 命名空间
wrangler kv:namespace create "SHARES"

# 创建预览环境 KV 命名空间
wrangler kv:namespace create "SHARES" --preview
```

命令会返回类似以下的输出：

```
🌀 Creating namespace with title "decision-tree-app-SHARES"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SHARES", id = "abc123def456" }

🌀 Creating namespace with title "decision-tree-app-SHARES_preview"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SHARES", preview_id = "xyz789uvw012" }
```

### 2. 更新 wrangler.toml

将上一步获得的 ID 填入 `wrangler.toml`：

```toml
name = "decision-tree-app"
main = "src/services/llm.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SHARES"
id = "abc123def456"              # 替换为你的生产环境 ID
preview_id = "xyz789uvw012"      # 替换为你的预览环境 ID

[vars]
ENVIRONMENT = "production"
```

### 3. 本地测试

```bash
# 启动本地开发服务器
wrangler dev

# 或使用 Vite 开发服务器（需要配置代理）
npm run dev
```

### 4. 部署到 Cloudflare Workers

```bash
# 部署到生产环境
wrangler deploy

# 或指定配置文件
wrangler deploy --config wrangler.toml
```

部署成功后会显示：

```
✨ Success! Uploaded 1 file (X.XX sec)
✨ Uploaded decision-tree-app (X.XX sec)
✨ Published decision-tree-app (X.XX sec)
  https://decision-tree-app.your-subdomain.workers.dev
```

### 5. 配置自定义域名（可选）

在 Cloudflare Dashboard 中：

1. 进入 Workers & Pages
2. 选择你的 Worker
3. 点击 "Settings" → "Triggers"
4. 添加自定义域名

或使用命令行：

```bash
wrangler domains add your-domain.com
```

### 6. 测试分享功能

1. 访问你的应用
2. 完成一个决策
3. 点击"分享决策树"按钮
4. 复制生成的链接
5. 在新标签页打开链接
6. 验证分享内容正确显示

## 配置 Vite 代理（本地开发）

如果在本地开发时需要测试分享功能，更新 `vite.config.js`：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787', // Wrangler dev 默认端口
        changeOrigin: true
      }
    }
  }
})
```

然后同时运行：

```bash
# 终端 1：启动 Wrangler dev
wrangler dev

# 终端 2：启动 Vite dev
npm run dev
```

## 环境变量配置

如果需要不同环境的配置，可以在 `wrangler.toml` 中添加：

```toml
[env.production]
name = "decision-tree-app"
vars = { ENVIRONMENT = "production" }

[env.staging]
name = "decision-tree-app-staging"
vars = { ENVIRONMENT = "staging" }

[[env.staging.kv_namespaces]]
binding = "SHARES"
id = "staging_kv_id"
```

部署到不同环境：

```bash
# 部署到生产环境
wrangler deploy

# 部署到 staging 环境
wrangler deploy --env staging
```

## 监控和调试

### 查看日志

```bash
# 实时查看日志
wrangler tail

# 查看特定环境的日志
wrangler tail --env production
```

### 查看 KV 数据

```bash
# 列出所有键
wrangler kv:key list --binding SHARES

# 获取特定键的值
wrangler kv:key get "share:abc123" --binding SHARES

# 删除特定键
wrangler kv:key delete "share:abc123" --binding SHARES
```

### 调试技巧

1. 在 `llm.js` 中添加 `console.log`
2. 使用 `wrangler tail` 查看日志
3. 检查 Cloudflare Dashboard 的 Analytics
4. 使用浏览器开发者工具查看网络请求

## 常见问题

### 1. KV 命名空间未找到

**错误**：`KV namespace not configured`

**解决**：
- 确认 `wrangler.toml` 中的 KV 配置正确
- 确认已创建 KV 命名空间
- 重新部署 Worker

### 2. CORS 错误

**错误**：`Access to fetch at ... has been blocked by CORS policy`

**解决**：
- 检查 `llm.js` 中的 CORS 头配置
- 确保所有响应都包含正确的 CORS 头
- 添加 OPTIONS 请求处理

### 3. 分享链接 404

**错误**：分享链接打开显示 404

**解决**：
- 确认 Worker 已正确部署
- 检查路由匹配逻辑
- 验证分享代码格式正确
- 检查 KV 中是否存在该键

### 4. 本地开发无法访问 KV

**解决**：
- 使用 `wrangler dev` 而不是 `npm run dev`
- 或配置 Vite 代理到 Wrangler dev
- 确保 preview_id 已配置

## 性能优化

### 1. 启用缓存

在响应中添加缓存头：

```javascript
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600'
  }
})
```

### 2. 压缩响应

Cloudflare 自动压缩响应，无需额外配置。

### 3. 使用 CDN

Cloudflare Workers 自动在全球边缘节点运行，无需额外配置。

## 成本估算

### Cloudflare Workers 免费套餐
- 每天 100,000 次请求
- 每次请求 10ms CPU 时间
- KV 读取：每天 100,000 次
- KV 写入：每天 1,000 次
- KV 存储：1 GB

### 付费套餐（$5/月）
- 每月 10,000,000 次请求
- 每次请求 50ms CPU 时间
- KV 读取：每月 10,000,000 次
- KV 写入：每月 1,000,000 次
- KV 存储：1 GB（额外存储 $0.50/GB）

对于大多数个人项目，免费套餐已经足够。

## 安全建议

1. **限流**：添加请求频率限制
2. **验证**：严格验证输入数据
3. **清理**：定期清理过期数据
4. **监控**：设置异常告警
5. **备份**：定期备份重要数据

## 下一步

- 添加分享密码保护
- 实现访问统计
- 添加分享管理面板
- 支持自定义过期时间
- 集成社交媒体分享

## 参考资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Workers KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)
