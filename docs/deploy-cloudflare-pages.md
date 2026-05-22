# Deploy Edgequity lên Cloudflare Pages (free)

Edgequity là static site: build ra thư mục `dist/` (gồm cả `data/edgequity/` từ `public/`). Không cần Netlify Functions.

## URL sẽ trông như thế nào?

| Loại | Ví dụ |
|------|--------|
| **Production** (nhánh `main`) | `https://edgequity.pages.dev` |
| **Preview** (nhánh khác / PR) | `https://<hash>.edgequity.pages.dev` hoặc `https://<tên-nhánh>.edgequity.pages.dev` |
| **Custom domain** (tùy chọn) | `https://edgequity.tonivest.com` — thêm trong Pages → Custom domains |

`<tên-project>` = tên anh đặt khi tạo project (vd. `edgequity` → `edgequity.pages.dev`). Có thể đổi sau trong Settings.

---

## Cách 1 — Connect GitHub (khuyên dùng, ~5 phút)

### 1. Đẩy code lên GitHub

Repo phải có **`public/data/edgequity/`** (JSON ~500 mã). Cloudflare build `npm run build` sẽ copy sang `dist/`.

### 2. Cloudflare Dashboard

1. Vào [dash.cloudflare.com](https://dash.cloudflare.com) → đăng ký / đăng nhập (free).
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Chọn GitHub → authorize → chọn repo **ValuWise** (hoặc tên repo của anh).
4. **Build settings**:

   | Field | Value |
   |-------|--------|
   | Production branch | `main` (hoặc nhánh chính của anh) |
   | Framework preset | **Vite** (hoặc None) |
   | Build command | `npm run build:cf` |
   | Build output directory | `dist` |
   | Root directory | `/` (để trống nếu app ở root) |

5. **Environment variables** (Settings → Environment variables):

   | Name | Value |
   |------|--------|
   | `NODE_VERSION` | `22` |

6. **Save and Deploy** — lần đầu build ~2–5 phút (repo data lớn có thể lâu hơn).

### 3. Xem site

Sau khi build **Success** → link **Visit site** → URL dạng `https://edgequity.pages.dev`.

Mỗi lần push lên nhánh production → tự deploy lại.

---

## Cách 2 — Deploy bằng Wrangler CLI (không bắt buộc)

Cần [Wrangler](https://developers.cloudflare.com/workers/wrangler/) và API token (Account → API Tokens → **Edit Cloudflare Workers** template).

```bash
npm run build
npx wrangler pages deploy dist --project-name=edgequity
```

URL giống Cách 1: `https://edgequity.pages.dev`.

---

## HTTP 500 sau deploy thành công

Deploy log **Success** nhưng `edgequity.pages.dev` báo **HTTP ERROR 500** thường do **quá nhiều file static** (~5k file, ~470 MB trong `raw/`). Cloudflare build OK nhưng edge không serve được.

**Cách xử lý (đã có trong repo):**

- Đổi **Build command** thành: `npm run build:cf`
- Script này build Vite rồi **xóa** `dist/data/edgequity/raw`, `stocks`, `sec` — giữ screener (`manifest.raw-first.json` + `stocks-raw-first/`).
- Redeploy → site chạy; tab **Statements / Fundamentals** sẽ báo thiếu cache cho đến khi host `raw/` trên R2 hoặc GitHub Pages full build.

## Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|-------------|------------|
| **HTTP 500** mọi URL | Dùng `npm run build:cf`, redeploy; hoặc rollback deployment cũ trong Pages. |
| Build fail `npm ci` / native module | Đặt `NODE_VERSION=22`; nếu vẫn lỗi `better-sqlite3`, báo để tách dependency script-only. |
| Site trắng / 404 asset | Kiểm tra **Build output** = `dist`, không phải `dist/assets` only. |
| Screener trống | Thiếu data trên Git — commit `manifest.raw-first.json` + `stocks-raw-first/`. |
| Build timeout | Data quá lớn — dùng `build:cf` hoặc build local rồi `wrangler pages deploy dist`. |

---

## So với Netlify

- Không dùng credits kiểu Netlify commercial.
- Redirect SEC trong `netlify.toml` **không cần** cho Edgequity runtime (data đã generate sẵn).
