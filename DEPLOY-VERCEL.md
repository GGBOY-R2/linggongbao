# 灵工保 Vercel 快速部署

## 本地预览

在项目根目录运行：

```bash
npm run dev
```

默认打开：

- `http://localhost:3000`
- 如果 3000 被占用，会自动顺延到 3001、3002...

## 推荐部署方式（最省事）

直接使用已经准备好的静态目录：

- `deploy-static/`

这个文件夹里已经包含：

- `index.html`：登录入口页
- `app.html`：产品展示主页
- `style.css`
- `1.jpg`

## 方式 1：Vercel Drop（最快）

1. 打开 Vercel
2. 进入 **Add New -> Project**
3. 选择 **Browse** 或 **Drop**
4. 直接上传整个 `deploy-static` 文件夹
5. 部署完成后会得到一个 `xxx.vercel.app`

## 方式 2：GitHub 导入

1. 把当前项目推到 GitHub
2. 在 Vercel 中点击 **Add New -> Project**
3. 导入这个仓库
4. 在 **Root Directory** 中选择：

```text
deploy-static
```

5. 保持其他配置默认，直接 Deploy

## 重要说明

如果你直接把整个仓库根目录导入 Vercel，它可能会识别成原来的 Next.js 项目。

为了确保部署的是这次商业化改造后的静态 Demo，请务必：

- 选择 `deploy-static` 作为 Root Directory，或
- 直接拖拽 `deploy-static` 文件夹到 Vercel Drop
