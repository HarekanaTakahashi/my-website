# GitHub Copilot カスタム指示

このリポジトリは **GitHub Pages で公開できる、軽量なゲームハブ（Game Hub）** を作るためのものです。
GitHub Copilot は、これらの指示に従ってコード提案やレビューを行います。

---

## 📋 プロジェクト概要

### 目的
GitHub Pages でホスティング可能な、シンプルなゲームハブの構築：
- 静的サイトとして動作（サーバーサイド処理なし）
- 上部の **App Bar** を常時表示
- 左側の **Side Bar**（App Barから開閉可能）
- Home（Dashboard）と各ゲームをSide Barから起動
- **ゲームの追加が容易**：`assets/data/games.json` に追加 + ゲームフォルダ配置のみ

### 技術スタック
- **HTML5** + **CSS3** + **Vanilla JavaScript**（ES Modules）
- **GitHub Pages** でのデプロイメント
- ビルドツールなし（最初は依存ゼロ）
- フレームワーク（React/Vue等）は Issue で明示された場合のみ導入

---

## 🏗️ アーキテクチャと構成

### ディレクトリ構造（推奨）
```
/
├── index.html              # エントリーポイント
├── assets/
│   ├── css/               # スタイルシート
│   ├── js/                # JavaScriptモジュール（ES Modules）
│   └── data/
│       └── games.json     # ゲーム一覧（単一ソース）
└── games/
    └── <slug>/
        └── index.html     # 各ゲームの本体（単独動作可能）
```

### ルーティング
- **hash-basedルーティング** を使用：`location.hash`
- ルートパス：`#/`（Home/Dashboard）
- ゲームパス：`#/game/<slug>`
- ページリロードなしでの画面遷移

### データモデル（`games.json` 形式）
```json
{
  "games": [
    {
      "slug": "example-game",     // 必須: games/<slug>/index.html のパス
      "title": "Example Game",    // 必須: 表示タイトル
      "description": "説明文",    // 任意
      "tags": ["action", "2d"]    // 任意: タグの配列
    }
  ]
}
```

---

## 💻 コーディング規約

### HTML
- セマンティックHTMLを使用（`<header>`, `<nav>`, `<main>`, `<section>` 等）
- すべてのボタンに適切な `aria-label` を設定
- インタラクティブ要素にはキーボードアクセス可能にする（`tabindex` 等）

### CSS
- BEM記法またはユーティリティクラス方式を検討
- レスポンシブデザイン（モバイルファーストを推奨）
- CSS変数を使用してテーマカラーを管理
- 例：
  ```css
  :root {
    --primary-color: #0066cc;
    --sidebar-width: 250px;
  }
  ```

### JavaScript
- **厳格モード** を使用：`'use strict';`
- **ES Modules** 形式でモジュール化
- **命名規則**：
  - 関数・変数：`camelCase`
  - クラス：`PascalCase`
  - 定数：`UPPER_SNAKE_CASE`
- **非同期処理**：`async/await` を優先（Promise も可）
- **エラーハンドリング**：必ず try-catch でエラーを捕捉し、ユーザーに適切なフィードバックを表示

**例：ゲームデータの読み込み**
```javascript
async function loadGames() {
  try {
    const response = await fetch('/assets/data/games.json');
    if (!response.ok) throw new Error('Failed to load games');
    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('Error loading games:', error);
    return []; // 空配列を返してアプリを継続
  }
}
```

---

## 🔒 セキュリティガイドライン

### 必須事項
- **入力のサニタイズ**：ユーザー入力や外部データを DOM に挿入する際は必ずエスケープ
- **XSS対策**：`innerHTML` の使用を避け、`textContent` や `createElement` を優先
- **CSP（Content Security Policy）** の設定を検討
- **機密情報の除外**：API キーやトークンをコードに埋め込まない

**例：安全なDOM操作**
```javascript
// ❌ 危険
element.innerHTML = userInput;

// ✅ 安全
element.textContent = userInput;
// または
const textNode = document.createTextNode(userInput);
element.appendChild(textNode);
```

---

## ♿ アクセシビリティ

### WCAG 2.1準拠を目指す
- **キーボードナビゲーション**：すべての機能をキーボードで操作可能に
  - `Tab` でフォーカス移動
  - `Enter` または `Space` で実行
  - `Escape` でモーダル/サイドバーを閉じる
- **スクリーンリーダー対応**：
  - 適切な ARIA 属性（`role`, `aria-label`, `aria-expanded` 等）
  - フォーカス管理（モーダル開閉時など）
- **カラーコントラスト**：最低でも 4.5:1 のコントラスト比
- **フォーカスインジケーター**：現在のフォーカス位置を視覚的に明示

---

## 🎨 UI/UX 実装ガイド

### コンポーネント構成
- **App Bar**（上部、常時表示）
  - メニューボタン（Side Bar トグル）
  - タイトル/ロゴ
- **Side Bar**（左側、開閉可能）
  - Home リンク
  - ゲーム一覧リンク
- **Main View**（メインコンテンツエリア）
  - Home：ゲームカード一覧
  - ゲーム画面：`iframe` で表示

### インタラクション
- **Side Bar の開閉**
  - メニューボタンをクリック
  - `Escape` キーで閉じる
  - オーバーレイクリックで閉じる
- **ゲーム起動**
  - ゲームカードのボタンをクリック → `#/game/<slug>` に遷移
  - Side Bar のゲームリンクをクリック → 同様に遷移

### ゲーム表示
- `iframe` を使用してゲームを表示（疎結合）
- `sandbox` 属性を設定してセキュリティを向上
  ```html
  <iframe src="/games/example-game/index.html" sandbox="allow-scripts allow-same-origin"></iframe>
  ```

---

## ✅ 品質基準

### 受け入れ基準（最低ライン）
- [ ] `index.html` を開くと `#/` が表示される
- [ ] App Bar が常時表示される
- [ ] Side Bar が開閉できる（メニューボタン + `Escape` キー）
- [ ] `assets/data/games.json` に1件追加すると、Home と Side Bar に反映される
- [ ] `#/game/<slug>` でゲームが `iframe` 起動される
- [ ] ゲームが見つからない/読み込み失敗時、エラー表示してアプリは継続動作
- [ ] キーボードで主要機能を操作可能

### エラーハンドリング
- **空状態の対応**：ゲームが0件の場合、適切なメッセージを表示
- **読み込み失敗の対応**：`games.json` が取得できない場合の Fallback
- **404相当の対応**：存在しない `<slug>` にアクセスした場合のエラー画面

### パフォーマンス
- 初期ロード時間を最小化（画像最適化、遅延読み込み等）
- `games.json` のキャッシュを検討
- 不要な再レンダリングを避ける

---

## 🚫 禁止事項

### コード品質
- **グローバル変数の乱用を避ける**：モジュールパターンやクロージャを活用
- **コメントなしの複雑なロジック**：意図が不明瞭なコードには説明コメントを記述
- **未使用コードの放置**：デッドコードは削除

### セキュリティ
- `eval()` の使用禁止
- `innerHTML` への未サニタイズ入力の挿入禁止

### 変更管理
- **大規模リファクタの回避**：既存仕様を壊すリファクタは避け、段階的に実施
- **勝手な依存追加の禁止**：Issue で明示されない限り、新しいライブラリやフレームワークを導入しない

---

## 🧪 テストとバリデーション

### 手動テスト項目
- [ ] すべてのブラウザ（Chrome, Firefox, Safari, Edge）で動作確認
- [ ] モバイル（iOS/Android）での動作確認
- [ ] キーボードのみでの操作確認
- [ ] スクリーンリーダー（NVDA, JAWS, VoiceOver）での確認

### 自動テスト（将来的）
- ユニットテスト（Jest 等）の導入を検討
- E2Eテスト（Playwright, Cypress 等）の導入を検討

---

## 📝 その他の注意事項

### 変更の原則
- **最小限の変更**：Issue で求められている変更のみを実施
- **段階的な改善**：大きな変更は複数の PR に分割
- **後方互換性**：既存のゲームやデータ形式を壊さない

### ドキュメンテーション
- 新しい機能や API を追加した場合、README.md に記載
- 複雑なロジックにはコメントで説明を追加

### コミットメッセージ
- 簡潔で明確なメッセージを記述
- 例：`Add keyboard navigation to sidebar`, `Fix game loading error handling`

---

## 📚 参考リソース

- [GitHub Pages 公式ドキュメント](https://docs.github.com/pages)
- [MDN Web Docs](https://developer.mozilla.org/)
- [WCAG 2.1 ガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
