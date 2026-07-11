# NazoRoom ローカルSupabase設定

参照元: `C:\Users\coral\hobby_dev\nazoapp\nazotoki_codex_docs\local-supabase-development-guide.md`

## 方針

NazoRoom は NazoApp と同時起動できる2つ目の Next.js + Supabase アプリとして扱う。

- `project_id`: `nazoroom`
- Next.js dev server: `http://localhost:3001`
- Supabase API: `http://127.0.0.1:55321`
- Supabase Studio: `http://127.0.0.1:55323`
- `room/.env.local`: ローカルSupabase用
- `room/.env.remote.local`: リモートSupabase用の退避ファイル

本番で Supabase を使用する前提のため、アプリ実行時は Supabase 接続を必須にする。テストでは `createNazoroomService` にテスト用Repositoryを注入する。

## ポート

| 用途 | ポート |
|---|---:|
| Supabase API | 55321 |
| Postgres DB | 55322 |
| Supabase Studio | 55323 |
| メール確認サーバー | 55324 |
| Analytics | 55327 |
| Shadow DB | 55320 |
| Edge Runtime inspector | 8084 |
| Next.js | 3001 |

## ローカル起動

```powershell
npm install
npx supabase start
npx supabase status
npx supabase db reset
npm run dev
```

`npx supabase status` で表示される `anon key` と `service_role key` を `room/.env.local` に反映する。

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## DB管理

- 差分適用: `supabase/migrations/*.sql`
- 全体像: `supabase/schema.sql`
- 初期データ: `supabase/seed.sql`

`npx supabase db reset` で migration と seed を適用し直す。
