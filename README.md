# 謎解き宝探し MVP

部屋番号を探索し、謎の解答で宝を集める Next.js / TypeScript / Supabase アプリです。

## 実行

```bash
npm install
npm run dev
```

Supabase 環境変数が未設定の場合は、seed 相当のメモリデータで動作します。
テストイベントは以下です。

- イベントID: `00000000-0000-0000-0000-000000000001`
- 謎表示部屋: `305` / 正解 `ひかり`
- 現地探索型部屋: `204` / 正解 `ほし`
- 正規化確認用部屋: `A-01` / 正解 `たいよう`

## Supabase

Supabase を使う場合は `.env.example` を参考に環境変数を設定し、migration と seed を適用します。

```bash
supabase db reset
```

重要データへのアクセスは Route Handler 側に寄せています。`room_answers` はクライアントに返さず、解答判定もサーバー側で行います。

## チェック

```bash
npm run typecheck
npm run lint
npm run test
```

E2E は Playwright のブラウザと起動済み dev server が必要です。

```bash
npm run dev
```

別のターミナルで実行します。

```bash
npm run test:e2e
```
