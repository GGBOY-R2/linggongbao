# 灵工保 Vercel 部署说明

## 当前部署方式

本项目默认提供一套可直接上线的静态演示目录：

- `deploy-static/`

该目录已同步包含：
- `index.html`：登录/入口页
- `app.html`：劳务报酬代开 + 以票扣保主页面
- `style.css`：静态样式文件
- `1.jpg`：品牌图片资源

## 本地预览

在项目根目录运行：

```bash
npm run dev
```

默认访问：
- `http://localhost:3000`

如果 3000 被占用，会自动顺延到 3001、3002 等端口。

## Vercel 部署方式

### 方式一：Vercel Drop（最快）
1. 打开 Vercel
2. 选择 **Add New -> Project**
3. 选择 **Browse** 或直接拖拽上传
4. 上传整个 `deploy-static/` 文件夹
5. 等待部署完成

### 方式二：GitHub 导入
1. 将当前仓库推送到 GitHub
2. 在 Vercel 中选择 **Add New -> Project**
3. 导入该仓库
4. 将 **Root Directory** 设置为：

```text
deploy-static
```

5. 其余配置保持默认，直接部署

## 注意事项

- 如果你部署的是静态演示页，请优先使用 `deploy-static/`
- 根目录下的 `app.html / index.html / style.css` 也已同步更新，便于继续开发
- 若后续继续修改静态页面，请记得同步更新 `deploy-static/` 中对应文件
- Next.js 源码版本位于 `app/`，用于组件化开发与后续迭代
