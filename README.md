# 謎解き宝探し MVP

部屋番号を探索し、謎の解答で宝を集める Next.js / TypeScript / Supabase アプリです。

## 技術スタック

- Next.js App Router
- TypeScript / React
- Supabase Postgres / Auth / Storage
- Next.js Route Handlers
- CSSフレームワークなしのグローバルCSS

`../nazoapp` と比較し、アプリ本体のスタックは Next.js / React / TypeScript / Supabase / 通常CSS に寄せています。
Tailwind CSS / PostCSS / Prisma / 独自バックエンドサーバーは使いません。ESLint、Vitest、Playwright は品質確認用の開発ツールとして残しています。

## ローカルSupabase

NazoRoom は2つ目のアプリとして、`../nazoapp` と同時起動できるように Supabase と Next.js のポートを分けています。

| 用途 | ポート | URL |
|---|---:|---|
| Supabase API | 55321 | `http://127.0.0.1:55321` |
| Postgres DB | 55322 | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |
| Supabase Studio | 55323 | `http://127.0.0.1:55323` |
| メール確認サーバー | 55324 | `http://127.0.0.1:55324` |
| Analytics | 55327 | internal/local |
| Shadow DB | 55320 | local migration/diff用 |
| Next.js | 3001 | `http://localhost:3001` |

`room/.env.local` はローカルSupabase用、`room/.env.remote.local` はリモートSupabase用の退避ファイルとして使います。

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<npx supabase status の anon key>
SUPABASE_SERVICE_ROLE_KEY=<npx supabase status の service_role key>
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

`SUPABASE_SERVICE_ROLE_KEY` はサーバー専用です。クライアントコンポーネントや `NEXT_PUBLIC_` 付き変数には出しません。

## 実行

```bash
npm install
npx supabase start
npx supabase status
npx supabase db reset
npm run dev
```

アプリは `http://localhost:3001`、Supabase Studio は `http://127.0.0.1:55323` で開きます。

`npx supabase status` の `anon key` と `service_role key` を `room/.env.local` に反映してから `npm run dev` を起動してください。

開発用のテストイベントは固定の1件です。通常操作ではイベントIDを入力せず、短いURLを使います。

- 謎表示部屋: `305` / 正解 `ひかり`
- 現地探索型部屋: `204` / 正解 `ほし`
- 正規化確認用部屋: `A-01` / 正解 `たいよう`

`db reset` 後のイベントは未開始です。プレイヤーは先に参加して待機画面を開きます。管理ページで `探索を開始` を押すと、各端末が開始合図を受信した瞬間を保存し、そこから指定分数をローカル計測します。

```txt
http://localhost:3001/admin
http://localhost:3001/admin/problems
http://localhost:3001/join
http://localhost:3001/results
```

管理ページでは以下を操作できます。

- `探索を開始`: 開始合図と制限時間を配信。各プレイヤー端末が受信時刻から計測
- `探索を終了`: 解答受付を止める。結果はまだ公開しない
- `結果発表`: ランキングAPIと結果画面を公開
- `リセット`: 参加者、探索履歴、解答履歴、入手宝を消して未開始に戻す
- 進行画面: 参加人数、獲得数、参加者ごとの結果を自動更新で確認する
- 問題編集画面: 部屋番号、表示タイプ、謎文、隠しメッセージ、宝、解答を追加・編集・無効化する

端末計測は通信遅延の差を吸収しますが、端末時計や `localStorage` を利用者が変更できるため、厳密な不正防止には向きません。サーバーは管理者が `探索を終了` するまで受付を継続します。

内部DBではseed用に固定UUIDを使っていますが、単一イベント運用のMVPでは画面URLと通常APIからはイベントIDを隠しています。

## Supabase運用

DB変更は `supabase/migrations/*.sql` に追加し、新規環境の全体像は `supabase/schema.sql` に追従させます。

```bash
npx supabase db reset
```

重要データへのアクセスは Route Handler 側に寄せています。`room_answers` はクライアントに返さず、解答判定もサーバー側で行います。

本番利用を前提にしているため、Supabase 環境変数が未設定の実行時メモリフォールバックは使いません。単体/APIテストではインメモリRepositoryを直接注入します。

## チェック

```bash
npm run typecheck
npm run lint
npm run test
```

E2E はローカルSupabaseを `db reset` 済みの状態にし、起動済み dev server に対して実行します。

```bash
npm run dev
```

別のターミナルで実行します。

```bash
npm run test:e2e
```

## 参照資料

- `C:\Users\coral\hobby_dev\nazoapp\nazotoki_codex_docs\local-supabase-development-guide.md`
- `codex_docs/local-supabase-settings.md`
