# Deploy Edgequity on Vercel

## Dashboard (đã add project)

| Setting | Value |
|---------|--------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | 22.x |

Repo: https://github.com/tonynguyen22/EdgeQuity

## URL

- Production: `https://<project-name>.vercel.app` (vd. `edgequity.vercel.app`)
- Mỗi push `main` → auto deploy

## Build variants

| Command | Khi nào |
|---------|---------|
| `npm run build` | Đủ Statements + Fundamentals (~476 MB output) |
| `npm run build:cf` | Chỉ screener (slim, cho Cloudflare) |

**Lưu ý:** Nếu Vercel dashboard để `npm run build` nhưng deploy cũ dùng script có prune → tab Fundamentals/Statements 404. Redeploy sau khi push `vercel.json`.

## Hobby limits

- Bandwidth ~100 GB/tháng
- Build tối đa 45 phút
- Full data build có thể 10–20 phút

## Cursor plugin

```bash
npx plugins add vercel/vercel-plugin --target cursor --scope project -y
```

Plugin giúp agent deploy / xem logs qua Vercel MCP (cần login Vercel trong Cursor).

## CLI deploy (tùy chọn)

```bash
npm i -g vercel
vercel login
vercel link
npm run build:full
vercel --prod
```
