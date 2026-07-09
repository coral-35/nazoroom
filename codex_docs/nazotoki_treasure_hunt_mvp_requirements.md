# 謎解き宝探し用 部屋探索&解答アプリ MVP要件定義書

- 作成日: 2026-07-09
- 対象: MVP版
- 想定読者: Codex / 実装担当エンジニア / プロジェクト管理者
- 目的: Codex にこの Markdown をそのまま渡し、長時間・断続的に実装、改善、テストを進められる状態にする

---

## 1. アプリ概要

本アプリは、実際のイベント会場や部屋の中で行う「謎解き宝探し」を支援する Web アプリである。

プレイヤーは現実空間で部屋番号を探索し、見つけた部屋番号をアプリに入力して「探索」する。探索結果として、その部屋番号に紐づく謎、または謎の存在をほのめかすログ、または存在しない部屋としてのログが表示される。

プレイヤーは部屋番号と解答を入力し、「解錠」する。正解した場合、その部屋に紐づく仮想的な宝を入手する。制限時間終了後、各宝の希少性に応じて得点を計算し、各プレイヤーのスコアとランキングを表示する。

---

## 2. MVPのゴール

MVPでは、次の状態を完成とする。

1. 管理者が事前に部屋番号、探索タイプ、謎、解答、宝を登録できる。
2. プレイヤーがニックネーム等で参加できる。
3. プレイヤーが部屋番号を入力して探索できる。
4. 探索結果が以下の3パターンに分岐する。
   - 部屋が存在しない
   - 謎は画面表示されないが、実在部屋に謎が存在することをほのめかす
   - 謎が画面に表示される
5. プレイヤーが部屋番号と解答を入力して解錠できる。
6. 正解時に宝を入手済みにできる。
7. 一度探索した部屋と謎、ログをストックして見返せる。
8. 残り時間が表示され、制限時間終了後は解答を締め切る。
9. 制限時間終了後、得点を計算してランキングを表示できる。
10. Codex が実装を進めやすいよう、テストケース、DB設計、API設計、実装順序が明確である。

---

## 3. MVPで扱わない範囲

以下は MVP では必須にしない。

- 決済機能
- 複数イベントの同時本番運用に耐える高度なマルチテナント管理
- GPS / BLE / QRコード等による実在部屋到達判定
- 不正検知の高度化
- リアルタイム同期の完全対応
- 管理画面の高度なドラッグ&ドロップ編集
- 画像アップロード機能の完全実装
- SNS共有
- 多言語対応

ただし、DB設計やコード構成は将来拡張できるようにする。

---

## 4. 想定技術スタック

過去プロジェクトの構成に合わせ、以下を前提とする。

| 項目 | 採用技術 |
|---|---|
| フロントエンド | Next.js App Router |
| 言語 | TypeScript |
| UI | React / グローバルCSS |
| バックエンド | Next.js Route Handlers |
| DB / Auth | Supabase |
| ORM | 原則 Supabase client。必要な場合のみ型補助を追加 |
| テスト | Vitest / React Testing Library / Playwright |
| Lint / Format | ESLint |
| デプロイ想定 | Vercel + Supabase |
| ローカルDB | Supabase CLI / Docker ベースのローカルSupabase |

### 4.1 実装方針

- MVPでは Next.js + Supabase のシンプルな構成を優先する。
- 業務ロジックは API Route または server action 相当のサーバー側に寄せる。
- 解答判定、宝の付与、スコア計算はクライアントで完結させない。
- フロントエンドは状態管理ライブラリを増やさず、React hooks と server response を中心に構成する。
- DB変更は Supabase migration SQL として管理する。

---

## 5. 用語定義

| 用語 | 意味 |
|---|---|
| イベント | 1回の謎解き宝探し全体 |
| プレイヤー | イベントに参加するユーザー |
| 部屋番号 | 現実空間で見つける識別子。例: `101`, `A-3`, `7B` |
| 部屋 | 部屋番号に紐づく仮想または実在の探索対象 |
| 仮想部屋 | 実在しないが、番号入力で謎が表示される部屋 |
| 実在部屋 | 実際の部屋や場所に謎が置かれている部屋 |
| 探索 | 部屋番号を入力し、その部屋の情報を取得する操作 |
| 謎 | 解答が必要な問題。テキスト、画像URL、補足説明を含む |
| 解錠 | 部屋番号と解答を送信して正誤判定する操作 |
| 宝 | 正解時に入手する仮想アイテム |
| 得点 | 制限時間終了後に計算されるプレイヤーの点数 |
| ログ | 探索や解錠の結果として画面に表示されるメッセージ |

---

## 6. ユーザー種別

### 6.1 プレイヤー

- イベントに参加する。
- 部屋番号を入力して探索する。
- 謎を確認し、解答を入力して解錠する。
- 探索済みの部屋、謎、ログを見返す。
- 制限時間終了後に自分と他プレイヤーの得点を見る。

### 6.2 管理者 / 出題者

- イベントを作成する。
- 制限時間を設定する。
- 部屋、謎、宝、正解を登録する。
- イベントを開始 / 終了する。
- 結果を確認する。

MVPでは、管理者認証は簡易でもよいが、本番運用を想定する場合は Supabase Auth のメールアドレス + パスワードを利用する。

---

## 7. イベント進行フロー

### 7.1 事前準備

1. 管理者がイベントを作成する。
2. 管理者が制限時間を設定する。
3. 管理者が部屋情報を登録する。
4. 管理者が各部屋に以下を設定する。
   - 部屋番号
   - 探索タイプ
   - 謎タイトル
   - 謎本文
   - 謎画像URL
   - 解答
   - 宝名
   - 宝説明
   - 表示順
   - 有効 / 無効
5. 管理者がイベントを開始する。

### 7.2 プレイヤー参加

1. プレイヤーが参加URLを開く。
2. ニックネームを入力する。
3. 参加ボタンを押す。
4. プレイヤー用画面に遷移する。
5. 残り時間のカウントダウンが表示される。

### 7.3 探索

1. プレイヤーが部屋番号入力欄に番号を入力する。
2. 「探索」ボタンを押す。
3. サーバー側で部屋番号を検索する。
4. 部屋の探索タイプに応じてレスポンスを返す。
5. フロントエンドは謎表示兼ログ画面に結果を追加する。
6. 探索済みストックに部屋情報を保存する。

### 7.4 解錠

1. プレイヤーが部屋番号と解答を入力する。
2. 「解錠」ボタンを押す。
3. サーバー側で以下を検証する。
   - イベントが開催中か
   - 制限時間内か
   - 部屋が存在するか
   - すでに解錠済みでないか
   - 解答が正しいか
4. 正解なら宝を入手済みにする。
5. 不正解ならログを追加する。
6. 結果を画面に反映する。

### 7.5 終了と得点計算

1. 制限時間が終了する。
2. 新規探索は許可してもよいが、解錠は不可にする。
3. 各宝について、入手したプレイヤー数を集計する。
4. 宝ごとの得点を以下の式で計算する。

```text
宝の得点 = 総プレイヤー数 - その宝を入手したプレイヤー数
```

5. 各プレイヤーの得点は、入手した宝の得点合計とする。
6. ランキングを表示する。

---

## 8. 探索タイプ仕様

探索ボタンを押した際の挙動は、部屋ごとに以下の3種類とする。

| 探索タイプ | 内部値 | 表示内容 | 用途 |
|---|---|---|---|
| 存在しない | `not_found` | 部屋が見つからない旨のログのみ | ダミー番号、誤入力 |
| ほのめかし | `hidden_clue` | 画面に謎を表示せず、実在部屋に何かありそうなログを出す | 実際の部屋に謎を設置する場合 |
| 謎表示 | `show_puzzle` | 謎タイトル、本文、画像等を表示 | 仮想部屋、通常の謎 |

### 8.1 存在しない部屋

DBに部屋番号が存在しない場合は、探索タイプ `not_found` 相当として扱う。

表示例:

```text
部屋 123 を探索した。
しかし、この番号に対応する部屋は見つからなかった。
```

### 8.2 ほのめかし部屋

DBには部屋番号が存在するが、アプリ上には謎を直接表示しない。

表示例:

```text
部屋 204 の扉に近づいた。
画面上にはロックが表示されない。だが、周囲に何か違和感がある。
```

要件:

- 画面には謎本文を表示しない。
- ただし、探索済みストックには「現地探索型」として残す。
- 解答自体はアプリから入力できる。
- 正解すれば宝を入手できる。

### 8.3 謎表示部屋

DBに設定された謎を画面に表示する。

表示例:

```text
部屋 305 のロックを発見した。
謎: 古びた時計の暗号
[謎本文]
[謎画像]
```

要件:

- 謎タイトルを表示する。
- 謎本文を表示する。
- 謎画像URLがあれば表示する。
- 解答欄の位置は謎画像の有無や高さで大きく動かないよう、表示領域を固定する。

---

## 9. 画面要件

## 9.1 プレイヤー画面

プレイヤー画面は以下の要素から構成する。

1. 残り時間
2. 謎表示兼ログ出力画面
3. 部屋番号入力欄
4. 探索ボタン
5. 解答入力欄
6. 解錠ボタン
7. 探索済みストック / スライドUI
8. 入手済み宝一覧
9. 終了後ランキング

### 9.1.1 推奨レイアウト

モバイルファーストで構成する。

```text
┌────────────────────────────┐
│ 残り時間  12:34             │
├────────────────────────────┤
│ 謎表示 / ログ / スライドUI   │
│                            │
│ [←]  部屋305の謎  [→]       │
│                            │
├────────────────────────────┤
│ 部屋番号 [        ] 探索     │
├────────────────────────────┤
│ 解答     [        ] 解錠     │
├────────────────────────────┤
│ 入手した宝 / 結果            │
└────────────────────────────┘
```

### 9.1.2 謎表示兼ログ画面

要件:

- 高さを固定または最小高さを指定し、入力欄が大きく上下しないようにする。
- 探索した部屋ごとにカード化する。
- 左右スワイプ、左右ボタン、またはタブで過去の探索結果を見返せる。
- 最新ログにすぐ戻れる導線を用意する。
- まだ謎画像がない場合でも、画像表示領域はプレースホルダーとして確保する。

### 9.1.3 部屋番号入力欄

要件:

- 英数字、ハイフン、アンダースコア程度を許可する。
- 前後空白は trim する。
- 大文字小文字の扱いは DB 設定に依存せず、MVPでは normalize する。
- 例: `a-01` と `A-01` は同じ部屋番号として扱う。

### 9.1.4 探索ボタン

要件:

- 部屋番号が空の場合は押せない、またはバリデーションエラーを出す。
- 通信中は二重送信を防止する。
- 探索結果をログに追加する。

### 9.1.5 解答入力欄

要件:

- 文字列を入力する。
- 前後空白は trim する。
- 全角 / 半角、ひらがな / カタカナ、大文字 / 小文字の正規化をサーバー側で行う。
- MVPでは複数解答表記に対応できるよう、answers テーブルまたは JSON 配列で管理する。

### 9.1.6 解錠ボタン

要件:

- 部屋番号と解答が空の場合はエラー。
- イベント終了後は押せない。
- 正解時は宝入手ログを表示する。
- 不正解時は不正解ログを表示する。
- すでに入手済みの場合は重複付与しない。

---

## 10. 管理者画面要件

MVPでは最低限、以下の管理操作が可能であればよい。

### 10.1 イベント管理

- イベント名の作成 / 編集
- 開始日時の設定
- 終了日時または制限時間の設定
- イベント状態の変更
  - `draft`
  - `active`
  - `ended`

### 10.2 部屋・謎・宝管理

管理者は以下を登録できる。

| 項目 | 必須 | 説明 |
|---|---:|---|
| 部屋番号 | 必須 | プレイヤーが入力する番号 |
| 探索タイプ | 必須 | `hidden_clue` / `show_puzzle` |
| 謎タイトル | 任意 | 表示用タイトル |
| 謎本文 | 任意 | テキスト謎 |
| 謎画像URL | 任意 | 画像謎のURL |
| 現地ヒント文 | 任意 | `hidden_clue` 用ログ |
| 正解 | 必須 | 1つ以上 |
| 宝名 | 必須 | 正解時に入手する宝 |
| 宝説明 | 任意 | 宝の補足説明 |
| 有効フラグ | 必須 | 無効なら探索対象外 |

### 10.3 結果確認

- プレイヤー一覧
- 各プレイヤーの入手済み宝
- 宝ごとの入手者数
- 得点ランキング

---

## 11. 状態定義

### 11.1 イベント状態

| 状態 | 内部値 | 説明 |
|---|---|---|
| 下書き | `draft` | 管理者が準備中 |
| 開催中 | `active` | プレイヤーが探索・解錠可能 |
| 終了 | `ended` | 解錠不可。得点表示可能 |

### 11.2 部屋状態

| 状態 | 説明 |
|---|---|
| 未探索 | プレイヤーがまだ探索していない |
| 探索済み | 探索済みだが未解錠 |
| 解錠済み | 正解して宝を入手済み |

### 11.3 解答結果

| 結果 | 内部値 | 説明 |
|---|---|---|
| 正解 | `correct` | 宝を付与する |
| 不正解 | `incorrect` | ログのみ追加 |
| 期限切れ | `expired` | 解錠不可 |
| 既に解錠済み | `already_unlocked` | 重複付与しない |
| 部屋なし | `room_not_found` | 解答対象なし |

---

## 12. DB設計

Supabase PostgreSQL を前提とする。

### 12.1 `events`

イベント情報。

```sql
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 12.2 `players`

プレイヤー情報。

```sql
create table public.players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  unique (event_id, nickname)
);
```

### 12.3 `rooms`

部屋・謎・宝をまとめて管理する MVP 用テーブル。

```sql
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  room_code text not null,
  normalized_room_code text not null,
  explore_type text not null check (explore_type in ('hidden_clue', 'show_puzzle')),
  title text,
  puzzle_text text,
  puzzle_image_url text,
  hidden_message text,
  treasure_name text not null,
  treasure_description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, normalized_room_code)
);
```

補足:

- DBに存在しない部屋番号は API 側で `not_found` として扱う。
- `not_found` は DB の探索タイプとして保存しない。
- `normalized_room_code` には正規化済み部屋番号を保存する。

### 12.4 `room_answers`

正解表記を複数管理する。

```sql
create table public.room_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  answer_text text not null,
  normalized_answer text not null,
  created_at timestamptz not null default now(),
  unique (room_id, normalized_answer)
);
```

### 12.5 `exploration_logs`

プレイヤーの探索ログ。

```sql
create table public.exploration_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  input_room_code text not null,
  normalized_room_code text not null,
  result_type text not null check (result_type in ('not_found', 'hidden_clue', 'show_puzzle')),
  message text not null,
  created_at timestamptz not null default now()
);
```

### 12.6 `player_treasures`

プレイヤーが入手した宝。

```sql
create table public.player_treasures (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  treasure_name text not null,
  unlocked_at timestamptz not null default now(),
  unique (player_id, room_id)
);
```

### 12.7 `unlock_attempts`

解答履歴。

```sql
create table public.unlock_attempts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  input_room_code text not null,
  normalized_room_code text not null,
  input_answer text not null,
  normalized_answer text not null,
  result text not null check (result in ('correct', 'incorrect', 'expired', 'already_unlocked', 'room_not_found')),
  created_at timestamptz not null default now()
);
```

---

## 13. RLS / 権限方針

MVPでは実装負荷を抑えるため、以下のどちらかを選ぶ。

### 推奨: サーバー側 API 経由に寄せる

- クライアントから Supabase に直接重要データを書き込まない。
- Next.js Route Handlers で service role key を使用する。
- service role key はサーバー環境変数にのみ置く。
- クライアントには anon key のみ公開する。

### 必須注意

- 正解データ `room_answers` はクライアントに返さない。
- `rooms` の正解に相当する情報は絶対にフロントに渡さない。
- Supabase の `service_role` に必要な table privilege が不足しないよう、migration で GRANT を明示する。

例:

```sql
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
```

本番では最小権限化を検討する。

---

## 14. API設計

### 14.1 `POST /api/events/:eventId/join`

プレイヤー参加。

#### Request

```json
{
  "nickname": "たろう"
}
```

#### Response

```json
{
  "player": {
    "id": "uuid",
    "nickname": "たろう"
  },
  "event": {
    "id": "uuid",
    "title": "宝探しイベント",
    "status": "active",
    "startsAt": "2026-07-09T10:00:00Z",
    "endsAt": "2026-07-09T11:00:00Z"
  }
}
```

### 14.2 `GET /api/events/:eventId/state?playerId=...`

初期表示・再読み込み用。

#### Response

```json
{
  "event": {
    "id": "uuid",
    "title": "宝探しイベント",
    "status": "active",
    "startsAt": "2026-07-09T10:00:00Z",
    "endsAt": "2026-07-09T11:00:00Z",
    "serverNow": "2026-07-09T10:20:00Z"
  },
  "explorationLogs": [],
  "treasures": [],
  "ranking": null
}
```

### 14.3 `POST /api/events/:eventId/explore`

探索。

#### Request

```json
{
  "playerId": "uuid",
  "roomCode": "305"
}
```

#### Response: not_found

```json
{
  "resultType": "not_found",
  "message": "部屋 305 を探索した。しかし、この番号に対応する部屋は見つからなかった。",
  "room": null
}
```

#### Response: hidden_clue

```json
{
  "resultType": "hidden_clue",
  "message": "部屋 204 の扉に近づいた。画面上にはロックが表示されない。だが、周囲に何か違和感がある。",
  "room": {
    "roomCode": "204",
    "title": "現地探索型の謎",
    "displayMode": "hidden"
  }
}
```

#### Response: show_puzzle

```json
{
  "resultType": "show_puzzle",
  "message": "部屋 305 のロックを発見した。",
  "room": {
    "roomCode": "305",
    "title": "古びた時計の暗号",
    "puzzleText": "時計の針が示す言葉を読め。",
    "puzzleImageUrl": "https://example.com/puzzle.png",
    "displayMode": "visible"
  }
}
```

### 14.4 `POST /api/events/:eventId/unlock`

解錠。

#### Request

```json
{
  "playerId": "uuid",
  "roomCode": "305",
  "answer": "ひかり"
}
```

#### Response: correct

```json
{
  "result": "correct",
  "message": "解錠成功。宝『月の鍵』を入手した。",
  "treasure": {
    "roomCode": "305",
    "name": "月の鍵",
    "description": "淡く光る銀色の鍵。"
  }
}
```

#### Response: incorrect

```json
{
  "result": "incorrect",
  "message": "解錠に失敗した。答えが違うようだ。"
}
```

#### Response: expired

```json
{
  "result": "expired",
  "message": "制限時間が終了したため、解錠できない。"
}
```

### 14.5 `GET /api/events/:eventId/ranking`

ランキング取得。

#### Response

```json
{
  "totalPlayers": 5,
  "treasureScores": [
    {
      "roomCode": "305",
      "treasureName": "月の鍵",
      "ownerCount": 2,
      "score": 3
    }
  ],
  "ranking": [
    {
      "playerId": "uuid",
      "nickname": "たろう",
      "score": 7,
      "treasures": ["月の鍵", "星の鍵"]
    }
  ]
}
```

---

## 15. 正規化仕様

### 15.1 部屋番号正規化

関数名例: `normalizeRoomCode(input: string): string`

仕様:

1. 前後空白を削除する。
2. Unicode 正規化 `NFKC` を行う。
3. 英字を大文字化する。
4. 連続空白を削除する。

例:

| 入力 | 正規化後 |
|---|---|
| ` a-01 ` | `A-01` |
| `Ａ－０１` | `A-01` |
| `room 1` | `ROOM1` |

### 15.2 解答正規化

関数名例: `normalizeAnswer(input: string): string`

仕様:

1. 前後空白を削除する。
2. Unicode 正規化 `NFKC` を行う。
3. 英字を小文字化する。
4. 全角カタカナをひらがなに寄せる、またはその逆に統一する。
5. 空白を削除する。
6. 記号の扱いは MVP では必要最小限に留める。

例:

| 入力 | 正規化後 |
|---|---|
| ` ヒカリ ` | `ひかり` |
| `ひかり` | `ひかり` |
| `HIKARI` | `hikari` |
| `ｈｉｋａｒｉ` | `hikari` |

---

## 16. スコア計算仕様

### 16.1 基本式

```text
宝の得点 = 総プレイヤー数 - その宝を入手したプレイヤー数
プレイヤー得点 = 入手した宝の得点合計
```

### 16.2 例

総プレイヤー数が5人の場合:

| 宝 | 入手者数 | 宝の得点 |
|---|---:|---:|
| 月の鍵 | 1 | 4 |
| 星の鍵 | 2 | 3 |
| 太陽の鍵 | 5 | 0 |

プレイヤーAが「月の鍵」と「星の鍵」を入手した場合:

```text
4 + 3 = 7点
```

### 16.3 注意点

- 全員が入手した宝は0点になる。
- 誰も入手していない宝は誰の得点にも加算されない。
- 同じ部屋の宝は1プレイヤーにつき1回だけ入手可能。
- 同点の場合は以下の順で並べる。
  1. 得点が高い順
  2. 入手宝数が多い順
  3. 最後の宝入手時刻が早い順
  4. ニックネーム昇順

---

## 17. UI詳細仕様

### 17.1 謎カード

探索済みストックはカードとして保持する。

```ts
type ExploredRoomCard = {
  logId: string;
  roomCode: string;
  resultType: 'not_found' | 'hidden_clue' | 'show_puzzle';
  title?: string;
  message: string;
  puzzleText?: string;
  puzzleImageUrl?: string;
  createdAt: string;
  unlocked?: boolean;
};
```

### 17.2 スライドUI

MVPでは以下のいずれかで実装する。

優先順:

1. CSS scroll snap による横スクロール
2. 左右ボタンによる index 切り替え
3. タブ形式

推奨実装:

- `overflow-x-auto`
- `scroll-snap-type: x mandatory`
- 各カードに `scroll-snap-align: start`
- 最新カードへ移動するボタンを配置

### 17.3 入力欄固定

- 謎表示領域には `min-height` を指定する。
- 画像表示枠にも固定高さまたは aspect ratio を指定する。
- 謎画像が存在しない場合でも点線枠を表示する。
- 入力欄は画面下部付近に固定し、探索結果表示によって極端に移動しない。

### 17.4 イベント終了時UI

制限時間終了後:

- 残り時間表示を `終了` にする。
- 解錠ボタンを disabled にする。
- 探索ボタンは以下のどちらかを選択する。
  - MVP推奨: disabled
  - 代替: ログ閲覧目的で探索のみ許可
- ランキングを表示する。

MVPでは、終了後の混乱を防ぐため探索・解錠ともに disabled を推奨する。

---

## 18. セキュリティ要件

### 18.1 正解漏洩防止

- 正解は API レスポンスに含めない。
- クライアントコードに正解を埋め込まない。
- Supabase anon key で `room_answers` を直接読めないようにする。

### 18.2 二重送信対策

- フロントエンドで通信中はボタンを disabled にする。
- DB 側で `unique (player_id, room_id)` を設定する。
- 正解処理はサーバー側で冪等にする。

### 18.3 不正プレイヤーID対策

MVPでは厳密なログイン認証なしでもよいが、最低限以下を実装する。

- `playerId` が対象イベントに属しているか API 側で検証する。
- 存在しない `playerId` で探索・解錠できないようにする。

将来的には、プレイヤー用セッショントークンを発行し、localStorage または cookie に保存する。

---

## 19. エラーハンドリング

| ケース | 表示 |
|---|---|
| 部屋番号未入力 | `部屋番号を入力してください。` |
| 解答未入力 | `解答を入力してください。` |
| 通信失敗 | `通信に失敗しました。時間をおいて再試行してください。` |
| イベント未開始 | `イベントはまだ開始されていません。` |
| イベント終了 | `イベントは終了しました。` |
| プレイヤー不明 | `参加情報が確認できません。再参加してください。` |
| 既に解錠済み | `この部屋の宝はすでに入手済みです。` |

---

## 20. テスト方針

テストケースを軸に開発する。

### 20.1 単体テスト

対象:

- `normalizeRoomCode`
- `normalizeAnswer`
- `calculateRanking`
- `isEventActive`
- `isEventExpired`

### 20.2 APIテスト

対象:

- 参加 API
- 探索 API
- 解錠 API
- ランキング API

### 20.3 UIテスト

対象:

- プレイヤー参加
- 部屋探索
- 謎カードの追加
- スライドUIで過去の謎を見返せること
- 正解時に宝が増えること
- 制限時間終了後に解錠不可になること

### 20.4 E2Eテスト

Playwright で以下のシナリオを実装する。

1. プレイヤーが参加する。
2. 存在しない部屋を探索する。
3. 謎表示部屋を探索する。
4. 不正解を送信する。
5. 正解を送信する。
6. 宝が表示される。
7. 同じ部屋を再度解錠しても重複付与されない。
8. 制限時間終了後にランキングが表示される。

---

## 21. 受け入れテストケース

### TC-001: プレイヤー参加

前提:

- イベントが `active` である。

手順:

1. 参加画面を開く。
2. ニックネーム `テスト太郎` を入力する。
3. 参加ボタンを押す。

期待結果:

- プレイヤーが作成される。
- プレイヤー画面に遷移する。
- 残り時間が表示される。

---

### TC-002: 存在しない部屋の探索

前提:

- `999` という部屋番号は DB に存在しない。

手順:

1. 部屋番号に `999` を入力する。
2. 探索ボタンを押す。

期待結果:

- `部屋が見つからなかった` 趣旨のログが表示される。
- 探索済みストックに not_found カードが追加される。
- 解答欄はそのまま利用可能である。

---

### TC-003: ほのめかし部屋の探索

前提:

- 部屋番号 `204` が `hidden_clue` として登録されている。

手順:

1. 部屋番号に `204` を入力する。
2. 探索ボタンを押す。

期待結果:

- 謎本文は表示されない。
- `周囲に違和感がある` 等のログが表示される。
- 探索済みストックに現地探索型カードが追加される。
- 解答欄から解錠できる。

---

### TC-004: 謎表示部屋の探索

前提:

- 部屋番号 `305` が `show_puzzle` として登録されている。

手順:

1. 部屋番号に `305` を入力する。
2. 探索ボタンを押す。

期待結果:

- 謎タイトルが表示される。
- 謎本文が表示される。
- 謎画像URLがある場合は画像が表示される。
- 謎画像がない場合でも点線枠が表示される。
- 解答欄の位置が大きく変化しない。

---

### TC-005: 不正解

前提:

- 部屋番号 `305` の正解が `ひかり` である。

手順:

1. 部屋番号に `305` を入力する。
2. 解答に `やみ` を入力する。
3. 解錠ボタンを押す。

期待結果:

- 不正解ログが表示される。
- 宝は付与されない。
- 解答履歴が `incorrect` として保存される。

---

### TC-006: 正解

前提:

- 部屋番号 `305` の正解が `ひかり` である。

手順:

1. 部屋番号に `305` を入力する。
2. 解答に `ヒカリ` を入力する。
3. 解錠ボタンを押す。

期待結果:

- 正規化により正解扱いになる。
- 宝が付与される。
- 入手済み宝一覧に表示される。
- 解答履歴が `correct` として保存される。

---

### TC-007: 重複解錠

前提:

- プレイヤーは部屋番号 `305` の宝をすでに入手済みである。

手順:

1. 同じ部屋番号と正解を再度送信する。

期待結果:

- 宝は重複付与されない。
- `すでに入手済み` のログが表示される。
- `player_treasures` に重複行が作られない。

---

### TC-008: 制限時間終了後の解錠

前提:

- イベントの `ends_at` が過去である。

手順:

1. 部屋番号と正解を入力する。
2. 解錠ボタンを押す。

期待結果:

- 解錠不可になる。
- 宝は付与されない。
- 解答履歴が `expired` として保存される。

---

### TC-009: スコア計算

前提:

- 総プレイヤー数は3人。
- 宝Aは1人が入手。
- 宝Bは2人が入手。
- 宝Cは3人が入手。

期待結果:

- 宝Aは2点。
- 宝Bは1点。
- 宝Cは0点。
- 各プレイヤー得点が入手宝の合計で算出される。

---

### TC-010: スライドUI

前提:

- プレイヤーが3つ以上の部屋を探索済みである。

手順:

1. 謎表示兼ログ画面を左右にスライドする。

期待結果:

- 過去の探索結果を見返せる。
- 最新ログに戻れる。
- 入力欄の表示が崩れない。

---

## 22. 推奨ディレクトリ構成

```text
app/
  page.tsx
  events/
    [eventId]/
      join/
        page.tsx
      play/
        page.tsx
      results/
        page.tsx
  admin/
    page.tsx
    events/
      [eventId]/
        page.tsx
  api/
    events/
      [eventId]/
        join/
          route.ts
        state/
          route.ts
        explore/
          route.ts
        unlock/
          route.ts
        ranking/
          route.ts
components/
  player/
    CountdownTimer.tsx
    ExplorePanel.tsx
    PuzzleCarousel.tsx
    PuzzleCard.tsx
    TreasureList.tsx
    RankingTable.tsx
  admin/
    EventForm.tsx
    RoomForm.tsx
lib/
  supabase/
    server.ts
    client.ts
  domain/
    normalize.ts
    scoring.ts
    eventStatus.ts
  validations/
    schemas.ts
  types/
    app.ts
supabase/
  config.toml
  migrations/
    0001_initial_schema.sql
  seed.sql
  schema.sql
tests/
  unit/
    normalize.test.ts
    scoring.test.ts
  api/
    explore.test.ts
    unlock.test.ts
  e2e/
    player-flow.spec.ts
```

---

## 23. 実装順序

Codex は以下の順で実装する。

### Phase 1: 土台

1. 既存プロジェクト構成を確認する。
2. Next.js / TypeScript / グローバルCSS / Supabase の設定を確認する。
3. 必要な環境変数を整理する。
4. DB migration を作成する。
5. seed データを作成する。

### Phase 2: ドメインロジック

1. `normalizeRoomCode` を実装する。
2. `normalizeAnswer` を実装する。
3. `calculateRanking` を実装する。
4. イベント状態判定関数を実装する。
5. 単体テストを追加する。

### Phase 3: API

1. 参加 API を実装する。
2. state API を実装する。
3. 探索 API を実装する。
4. 解錠 API を実装する。
5. ランキング API を実装する。
6. API テストを追加する。

### Phase 4: プレイヤーUI

1. 参加画面を実装する。
2. プレイヤー画面を実装する。
3. カウントダウンを実装する。
4. 探索フォームを実装する。
5. 解答フォームを実装する。
6. 謎カード / スライドUI を実装する。
7. 宝一覧を実装する。
8. 終了後ランキングを実装する。

### Phase 5: 管理UI

1. 簡易イベント管理画面を実装する。
2. 部屋・謎・宝の登録画面を実装する。
3. 結果確認画面を実装する。

### Phase 6: E2E / 仕上げ

1. Playwright テストを実装する。
2. モバイル表示を確認する。
3. 通信中 / エラー時 UI を調整する。
4. 実運用用の seed を整理する。
5. README を更新する。

---

## 24. Codexへの実装指示プロンプト

以下を Codex に渡す。

```md
あなたは Next.js / TypeScript / Supabase に精通したシニアエンジニアです。
このリポジトリに、謎解き宝探し用の部屋探索&解答アプリ MVP を実装してください。

この要件定義書を正として、以下の方針で作業してください。

1. まず既存リポジトリ構成、package.json、Supabase設定、既存画面、既存APIを確認してください。
2. 既存の設計・命名・スタイルに合わせて実装してください。
3. DB変更が必要な場合は Supabase migration SQL を追加してください。
4. 正解判定、宝の付与、スコア計算は必ずサーバー側で行ってください。
5. 正解データをクライアントに返さないでください。
6. 部屋番号と解答の正規化関数を実装し、単体テストを追加してください。
7. 探索 API、解錠 API、ランキング API を実装し、APIテストを追加してください。
8. プレイヤー画面はモバイルファーストで作成してください。
9. 謎表示兼ログ画面は探索済みカードを左右に見返せる UI にしてください。
10. 謎画像がない場合でも画像表示枠を確保し、解答欄の位置が大きく動かないようにしてください。
11. 制限時間終了後は解錠できないようにしてください。
12. 受け入れテストケース TC-001 から TC-010 を満たすように実装してください。
13. 実装後、lint、typecheck、unit test、可能であれば e2e test を実行し、結果を報告してください。
14. 途中で不明点があっても、MVPとして妥当な仮定を置いて前進してください。ただし、仮定した点は最後に明記してください。
15. 破壊的変更を行う場合は、その理由と影響範囲を明記してください。

最終的に、実装内容、追加・変更ファイル、実行したテスト、残課題をまとめて報告してください。
```

---

## 25. seed データ例

```sql
insert into public.events (id, title, status, starts_at, ends_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'MVPテスト宝探し',
  'active',
  now(),
  now() + interval '60 minutes'
);

insert into public.rooms (
  id,
  event_id,
  room_code,
  normalized_room_code,
  explore_type,
  title,
  puzzle_text,
  puzzle_image_url,
  hidden_message,
  treasure_name,
  treasure_description,
  sort_order,
  is_active
) values
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '305',
  '305',
  'show_puzzle',
  '古びた時計の暗号',
  '時計の針が示す言葉を読め。',
  null,
  null,
  '月の鍵',
  '淡く光る銀色の鍵。',
  1,
  true
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '204',
  '204',
  'hidden_clue',
  '現地探索型の謎',
  null,
  null,
  '部屋204の周囲に、画面には映らない違和感がある。',
  '星の鍵',
  '小さな星形の鍵。',
  2,
  true
);

insert into public.room_answers (room_id, answer_text, normalized_answer)
values
('10000000-0000-0000-0000-000000000001', 'ひかり', 'ひかり'),
('10000000-0000-0000-0000-000000000001', 'ヒカリ', 'ひかり'),
('10000000-0000-0000-0000-000000000002', 'ほし', 'ほし');
```

---

## 26. 完成条件

MVPの完成条件は以下とする。

- [ ] DB migration が存在する。
- [ ] seed データでローカル動作確認できる。
- [ ] プレイヤーがイベントに参加できる。
- [ ] 部屋番号探索ができる。
- [ ] 探索結果3分岐が実装されている。
- [ ] 謎表示部屋では謎カードが表示される。
- [ ] ほのめかし部屋では謎本文が表示されない。
- [ ] 存在しない部屋では not_found ログが表示される。
- [ ] 部屋番号と解答で解錠できる。
- [ ] 正解時に宝が付与される。
- [ ] 不正解時に宝が付与されない。
- [ ] 同じ宝が重複付与されない。
- [ ] 探索済みの部屋を見返せる。
- [ ] 残り時間が表示される。
- [ ] 制限時間終了後に解錠できない。
- [ ] 得点計算とランキング表示ができる。
- [ ] 正解データがクライアントに露出しない。
- [ ] 単体テストがある。
- [ ] APIテストがある。
- [ ] 主要フローのE2Eテストがある。
- [ ] README または実行手順が更新されている。

---

## 27. 将来拡張案

MVP後に検討する。

- QRコード読み取りによる部屋番号入力
- 管理者用の画像アップロード
- プレイヤー認証 / チーム機能
- ヒント開放機能
- ヒント利用による減点
- 謎ごとの難易度設定
- 宝ごとの固定点 + 希少性点の併用
- リアルタイムランキング
- イベント複製機能
- CSVインポート / エクスポート
- 出題者プレビュー
- 解答ログ分析
- 不正解回数制限
- 実在部屋用の現地確認コード

---

## 28. 実装時の重要注意点

- 正解判定はクライアントで行わない。
- `room_answers` をフロントに返さない。
- `player_treasures` には unique 制約を必ず置く。
- 解錠処理は冪等にする。
- 時刻判定はサーバー時刻を基準にする。
- 入力正規化は DB 登録時と解答時で同じ関数を使う。
- 謎画像の有無で入力欄が大きく動かないようにする。
- `hidden_clue` はアプリ上に謎を表示しないが、解錠対象としては有効にする。
- DBに存在しない部屋番号と、`hidden_clue` の部屋を混同しない。
- 管理画面が未完成でも、seed データでプレイヤーフローを確認できるようにする。
