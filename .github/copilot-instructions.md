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
│   ├── css/               # 共通スタイルシート（ゲームハブアプリ用）
│   │   └── styles.css     # ハブアプリのスタイル
│   ├── js/                # 共通JavaScriptモジュール（ゲームハブアプリ用）
│   │   ├── app.js         # メインアプリケーションロジック
│   │   ├── store.js       # ゲームデータ管理
│   │   ├── utils.js       # ユーティリティ関数
│   │   └── views/         # ビューモジュール
│   │       ├── home.js    # ホーム画面
│   │       └── game.js    # ゲーム画面
│   └── data/
│       └── games.json     # ゲーム一覧（単一ソース）
└── games/
    └── <slug>/
        ├── index.html     # ゲームのHTML
        ├── <slug>.css     # ゲーム専用スタイル
        ├── <slug>.js      # ゲーム専用ロジック
        ├── data/          # ゲーム固有のデータ（オプション）
        │   └── *-presets.js  # プリセット/パズルデータ等
        └── config/        # ゲーム固有の設定（オプション）
            └── *-config.js   # 設定値/定数/UI文言等
```

**ファイル分離の原則**:
- 各ゲームは `games/<slug>/` ディレクトリに配置
- ゲーム内では **HTML、CSS、JavaScript を必ず分離** すること
- ゲーム固有のスタイルは `<slug>.css` に記述
- ゲーム固有のロジックは `<slug>.js` に記述
- **定数データとロジックの分離**：presets、設定値、UI文言などは別ファイルに分離
  - プリセットデータ（パズル、レベルデータ等）: `data/` ディレクトリ
  - 設定値・定数・UI文言: `config/` ディレクトリ
- 共通のスタイルやロジックは `assets/` ディレクトリに配置

### ファイル構成の詳細

**ゲームハブアプリ（共通）**:
- `index.html`: エントリーポイント。App Bar、Side Bar、Main Content を含む
- `assets/css/styles.css`: ハブアプリの共通スタイル
- `assets/js/app.js`: ルーティング、UI制御
- `assets/js/store.js`: ゲームデータの読み込みと管理
- `assets/js/utils.js`: HTML エスケープなどのユーティリティ
- `assets/js/views/home.js`: ホーム画面のレンダリング
- `assets/js/views/game.js`: ゲーム画面のレンダリング
- `assets/data/games.json`: ゲーム一覧のメタデータ

**個別ゲーム（ゲーム固有）**:
- `games/<slug>/index.html`: ゲームの HTML 構造のみを記述
- `games/<slug>/<slug>.css`: ゲーム専用のスタイル定義
- `games/<slug>/<slug>.js`: ゲームロジックとインタラクション
- `games/<slug>/data/`: ゲーム固有のデータファイル（オプション）
  - プリセットデータ、パズル、レベルデータなど
  - 例: `sudoku-presets.js` (Sudoku のパズルと解答)
- `games/<slug>/config/`: ゲーム固有の設定ファイル（オプション）
  - 設定値、定数、UI文言など
  - 例: `2048-config.js` (2048 のボードサイズ、確率、メッセージ)

**新しいゲームを追加する際の手順**:
1. `games/<slug>/` ディレクトリを作成
2. `index.html`、`<slug>.css`、`<slug>.js` ファイルを作成（HTML、CSS、JSを分離）
3. 必要に応じて `data/` や `config/` ディレクトリを作成し、定数データを分離
4. `assets/data/games.json` に新しいゲームのエントリを追加
5. 各ファイルは独立して管理し、他のゲームに影響を与えないようにする


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
      "slug": "example-game",
      "title": "Example Game",
      "description": "説明文",
      "tags": ["action", "2d"]
    }
  ]
}
```

**フィールド説明**:
- `slug`（必須）: `games/<slug>/index.html` のパスと一致する識別子
- `title`（必須）: ゲームの表示タイトル
- `description`（任意）: ゲームの説明文
- `tags`（任意）: タグの配列

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
    const response = await fetch('assets/data/games.json');
    if (!response.ok) throw new Error('Failed to load games');
    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('Error loading games:', error);
    return []; // 空配列を返してアプリを継続
  }
}
```

### データとロジックの分離

**原則**:
- **定数データとゲームロジックを分離**して保守性と再利用性を向上
- プリセット、設定値、UI文言などはメインロジックから切り出す
- ES Modules の `export`/`import` を使用

**データ分離の指針**:
1. **プリセットデータ** (`games/<slug>/data/` に配置)
   - パズルのプリセット（Sudoku の問題と解答など）
   - レベルデータ、マップデータ
   - 静的なゲームコンテンツ
   
2. **設定値・定数** (`games/<slug>/config/` に配置)
   - ゲームパラメータ（ボードサイズ、制限時間など）
   - 確率・閾値（タイル生成確率、難易度設定など）
   - UI文言・メッセージ（勝利/敗北メッセージなど）
   - LocalStorage キーなどの定数

**実装例**:
```javascript
// games/sudoku/data/sudoku-presets.js
export const puzzles = [ /* パズルデータ */ ];
export const solutions = [ /* 解答データ */ ];

// games/sudoku/sudoku.js
import { puzzles, solutions } from './data/sudoku-presets.js';
```

```javascript
// games/2048/config/2048-config.js
export const GAME_CONFIG = {
    BOARD_SIZE: 4,
    TILE_SPAWN: { VALUE_2_PROBABILITY: 0.9 },
    WIN_TILE: 2048
};

// games/2048/2048.js
import { GAME_CONFIG } from './config/2048-config.js';
```

**注意事項**:
- データファイルを使用する場合、HTML で `<script type="module">` を指定
- ファイル名は役割を明確に（例: `<slug>-presets.js`, `<slug>-config.js`）
- 既存の動作を維持することを最優先

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
- **注意**: `allow-same-origin` と `allow-scripts` の組み合わせは、同一オリジンのゲームに限定して使用すること
  ```html
  <iframe src="games/example-game/index.html" 
          sandbox="allow-scripts allow-same-origin"
          title="Example Game"></iframe>
  ```
- より制限的な設定が必要な場合は `allow-scripts` のみを使用し、`allow-same-origin` を除外することを検討

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
