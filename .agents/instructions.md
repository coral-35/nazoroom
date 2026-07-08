# Agent Instructions

このリポジトリで作業するエージェントは、以下の方針に従うこと。

## Project

* MVP完成を優先する。
* 既存のディレクトリ構成、命名規則、実装パターンを尊重する。
* 大規模な設計変更やライブラリ追加は、必要性が明確な場合のみ行う。
* 要件定義書がある場合は、それを一次情報として扱う。
* 不明点は既存コードから合理的に補完し、作業を止めすぎない。

## Implementation

* TypeScript の型安全性を維持する。
* 正解判定などの秘匿すべきロジックはクライアントに置かない。
* 正解文字列や service_role key をブラウザに露出しない。
* Supabase の server-side client / browser client の使い分けを守る。
* DB変更は migration または schema 更新として残す。
* UIはスマートフォン利用を優先し、操作しやすさと視認性を重視する。

## Git

* 作業内容のまとまりごとに小さくコミットする。
* 1コミット1目的を原則とする。
* DB、API、UI、テスト、ドキュメント変更は可能な範囲で分ける。
* コミット前に可能な範囲で `typecheck`、`lint`、`test` を実行する。
* WIPコミットを作ってもよいが、最終的には整理する。

## Commit Message

```txt
<type>: <summary>
```

Examples:

```txt
feat: add room exploration API
fix: prevent duplicate treasure acquisition
test: add scoring calculation tests
docs: update requirements notes
chore: add seed puzzle data
```

Allowed types:

* `feat`
* `fix`
* `test`
* `refactor`
* `docs`
* `chore`

## Testing

* 既存テストを壊さない。
* 仕様追加時は、可能な範囲でテストを追加する。
* テストが難しい場合は、理由と手動確認手順を残す。
* 重要ロジック、特に探索分岐・解錠判定・重複獲得防止・スコア計算は優先してテストする。

## Supabase

* migration、schema、seed の整合性を保つ。
* RLS、GRANT、service_role、anon role の扱いに注意する。
* server-side API でのみ service_role を使用する。
* クライアントには公開可能な情報だけを返す。
* 正解データは直接返さない。
* 解答ハッシュ化は直接露出防止のための措置であり、総当たり耐性を保証するものではない。

## Work Report

まとまった作業後は、以下を報告する。

```md
## 作業結果

### 実装したこと
- ...

### 変更ファイル
- `path/to/file`

### 確認したこと
- `npm run typecheck`
- `npm run lint`
- `npm run test`

### Git
- `feat: ...`

### 未完了・次にやること
- ...
```
