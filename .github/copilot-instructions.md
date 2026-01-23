# custom-instructions.md — Copilot Coding Agent Instructions

このリポジトリは **GitHub Pages で公開できる、軽量なゲームハブ（Game Hub）** を作るためのものです。
Copilot Coding Agent は、Issue の指示を実装しつつ、必ずこの標準に従ってください。

## 目的（プロダクト要件）
- 静的サイト（GitHub Pages）として動作
- 常時表示の **App Bar**（上部）
- App Bar から開閉できる **Side Bar**（左）
- Side Bar から **Home（Dashboard）** と各ゲームを開ける
- **ゲームの追加が簡単**（原則、データ1箇所 + ゲームフォルダ追加で完結）

## 制約（重要）
- サーバーサイド無し、ビルド無し（最初は依存ゼロで）
- ルーティングは `location.hash` ベース（例: `#/`, `#/game/<slug>`）
- ゲームは原則 `iframe` で表示（ハブとゲームを疎結合にする）
- エラーでも壊れないUI（空状態/読み込み失敗/404相当を考慮）

## 推奨ディレクトリ構成
- `index.html` … 入口
- `assets/css/` … スタイル
- `assets/js/` … アプリ（ES Modules）
- `assets/data/games.json` … ゲーム一覧（単一ソース）
- `games/<slug>/index.html` … 各ゲーム本体（単体で動く）

## 実装ガイド
- UIは最小コンポーネントで構成（App Bar / Side Bar / Main View）
- Home はゲームカード一覧（タイトル/説明/タグ/起動ボタン）
- Side Bar は Home + ゲーム一覧リンク
- 主要操作:
  - メニューボタンでサイドバー開閉
  - `Escape` でサイドバーを閉じる
  - キーボード操作でフォーカスできる（ボタン/リンク）

## データモデル（games.json の例）
- `slug`（必須）: `games/<slug>/index.html` の `<slug>` と一致
- `title`（必須）
- `description`（任意）
- `tags`（任意）: 配列

## 受け入れ基準（最低ライン）
- `index.html` を開くと `#/` が表示される
- App Bar が常時表示される
- Side Bar が開閉できる（ボタン + Escape）
- `assets/data/games.json` に1件追加すると、Home と Side Bar に反映される
- `#/game/<slug>` でゲームを iframe 起動できる
- ゲームが見つからない/読めない場合、エラー表示してアプリは継続

## 注意
- フレームワーク導入（React/Vue等）やビルドツール導入は、Issueで明示された場合のみ
- 既存仕様を壊すリファクタは避け、必要なら小さく段階的に
