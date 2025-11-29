<!--
---
id: day028
slug: repeatseq-analyzer

title: "RepeatSeq Analyzer"

subtitle_ja: "反復文字列の特定ツール"
subtitle_en: "Repeated Sequence Detection Tool"

description_ja: "暗号文中に繰り返し出現する文字列を検出し、カシスキー法による鍵長推定を支援する暗号解析ツール"
description_en: "Cryptanalysis tool that detects repeated sequences in ciphertext and assists key length estimation using the Kasiski examination method"

category_ja:
  - 暗号解読
  - 古典暗号
category_en:
  - Cryptanalysis
  - Classical Cryptography

difficulty: 4

tags:
  - kasiski
  - vigenere
  - cryptanalysis
  - pattern-detection
  - key-length

repo_url: "https://github.com/ipusiron/repeatseq-analyzer"
demo_url: "https://ipusiron.github.io/repeatseq-analyzer/"

hub: true
---
-->

# RepeatSeq Analyzer - 反復文字列の特定ツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/repeatseq-analyzer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/repeatseq-analyzer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/repeatseq-analyzer)
![GitHub license](https://img.shields.io/github/license/ipusiron/repeatseq-analyzer)

**Day028 - 生成AIで作るセキュリティツール100**

**RepeatSeq Analyzer** は、暗号文中に繰り返し出現する文字列（3文字以上）を検出し、その位置や間隔から暗号の鍵長の推定を支援するツールです。

とくに古典暗号の解読訓練や、カシスキー法の理解促進に役立ちます。

---

## 🔍 デモページ

👉 [https://ipusiron.github.io/repeatseq-analyzer/](https://ipusiron.github.io/repeatseq-analyzer/)

---

## 📸 スクリーンショット

>![ヴィジュネル暗号文の反復文字列を特定する](assets/screenshot.png)
>
>*ヴィジュネル暗号文の反復文字列を特定する*

---

## 🎯 主な機能

### 暗号解析機能
- **暗号種別の事前判定**: 一致指数（IC）による単一換字式/多表式暗号の自動判別
- **反復文字列検出**: 3-25文字の反復パターンを自動検出
- **統計的信頼度スコア**: 文字列長・出現頻度・間隔妥当性・公約数有用性による信頼度計算（0-100%）
- **鍵長候補推定**: 間隔の公約数から鍵長候補を提示（3以下・20以上の非表示機能付き）

### 可視化機能
- **三段階ハイライト**: 黄色（3-4文字）・緑色（5-7文字）・赤色（8文字以上）の重要度別表示
- **優先度システム**: 重複箇所では高重要度色を優先表示
- **個別ハイライト制御**: 各項目のハイライト表示ON/OFF切り替え

### ユーザーインターフェイス
- **ドラッグ&ドロップ対応**: テキストファイルの直感的な読み込み
- **ページネーション**: 20件ごとの結果表示
- **多列ソート機能**: 各列クリックでの昇順/降順並び替え
- **フィルター機能**: 文字列長による絞り込み（全選択・全解除ボタン付き）
- **統計情報ダッシュボード**: 基本統計・信頼度分布・長さ分布・最高信頼度パターン表示
- **ダークモード**: 目の疲れを軽減する暗色テーマ（設定自動保存）

### 教育支援機能
- **包括的ヘルプモーダル**: カシスキー検査法の詳細説明と使用方法
- **ツールチップ**: 各機能の詳細説明表示
- **関連ツール誘導**: 判定結果に応じた適切な解読ツールへの案内

---

## 📚 活用例

- 古典暗号（ヴィジュネル暗号など）の **鍵長推定**
- **カシスキー法（Kasiski Examination）** の可視化体験
- 教育・講義用の補助ツール
- 暗号文の周期性パターンの探索

---

## 🧪 使い方

### 基本的な使用手順
1. **暗号文の入力**
   - テキストエリアに暗号文を直接貼り付け（英字対応）
   - またはテキストファイルをドラッグ&ドロップ
   - ファイル選択ダイアログからも読み込み可能

2. **前処理オプション**
   - 「空白・記号を除去して処理」にチェック（推奨・初期状態でON）

3. **解析実行**
   - 「🔍 解析する」ボタンをクリック

### 解析結果の表示
- **暗号種別の事前判定**: IC値による単一換字式/多表式暗号の自動判別結果
- **ハイライト表示**: 反復パターンを重要度別に色分け表示
- **検出結果テーブル**: 文字列・長さ・信頼度・位置・間隔・公約数を一覧表示
- **統計情報**: 検出パターンの統計的分析結果
- **鍵長候補**: 公約数の出現頻度に基づく推定値

---

## 🛠 技術的ポイント

### アーキテクチャ
- **フロントエンド**: HTML5 / CSS3 / Vanilla JavaScript（ビルドツール不要）
- **レスポンシブデザイン**: モバイル対応レイアウト
- **データ永続化**: LocalStorageによる設定保存
- **テスト環境**: Playwrightによる自動テスト

### アルゴリズム
- **パターン検出**: スライディングウィンドウ法による効率的な反復文字列検出
- **一致指数計算**: 文字頻度の偏りから暗号種別を統計的に判定
- **信頼度スコアリング**: 4要素による総合的な信頼度評価
- **公約数算出**: ユークリッドの互除法による高速計算

### パフォーマンス最適化
- **ページネーション**: 大量データの効率的な表示
- **優先度システム**: 重複ハイライトの効率的な処理
- **フィルタリング**: クライアントサイドでの高速絞り込み

---

## 📂 フォルダー構成

```
repeatseq-analyzer/
├── index.html           # メインHTMLファイル
├── script.js            # JavaScriptロジック
├── style.css            # スタイルシート（ダークモード対応）
├── README.md            # プロジェクト説明書
├── CLAUDE.md            # Claude Code向け開発ガイド
├── LICENSE              # MITライセンス
├── samples/             # テスト用サンプルデータ
│   ├── caesar/          # シーザー暗号サンプル
│   ├── shift/           # シフト暗号サンプル  
│   ├── vigenere1/       # ヴィジュネル暗号サンプル1
│   ├── vigenere2/       # ヴィジュネル暗号サンプル2
│   └── random/          # ランダム文字列サンプル
├── tests/               # Playwrightテストファイル
├── playwright.config.js # テスト設定ファイル
├── package.json         # Node.js依存関係設定
└── assets/              # スクリーンショット等
```

---

## 実験

手元の暗号文から以下の情報を特定する：

- 暗号種別
- 鍵の候補長
- 鍵そのもの（復号へ展開可能）
- 平文の復元

### サンプルファイル対応表

| サンプル | ファイルパス | 種別 | 鍵 | 特徴 |
|---------|-------------|------|-----|------|
| 1 | `samples/caesar/` | シーザー暗号 | シフト量=3 | 単一換字式（IC高値） |
| 2 | `samples/vigenere1/` | ヴィジュネル暗号 | LEMON | 短い鍵で周期パターン明確 |
| 3 | `samples/vigenere2/` | ヴィジュネル暗号 | KNOWLEDGEISKEY | 長い鍵・長文テキスト |
| 4 | `samples/random/` | ランダム文字列 | - | 暗号ではない偽陽性テスト |

### 関連暗号解読ツールの活用

#### 単一換字式暗号（シーザー暗号など）の場合
- [Caesar Cipher Wheel Tool](https://github.com/ipusiron/caesar-cipher-wheel)
- [Caesar Cipher Breaker](https://github.com/ipusiron/caesar-cipher-breaker)
- [Frequency Analyzer](https://github.com/ipusiron/frequency-analyzer)

#### 多表式暗号（ヴィジュネル暗号）の場合
- [Vigenere Cipher Tool](https://github.com/ipusiron/vigenere-cipher-tool)

---

## ❓ なぜ反復文字列を特定するのか

多表式暗号（とくにヴィジュネル暗号）では、同じ鍵長で暗号化された場合、同じ平文部分が同じ暗号文として再現されることがあります。  
この性質により、**同じ文字列が暗号文内で繰り返される（反復文字列）** 現象が起きます。

反復文字列の **間隔** を分析し、その **公約数** を求めることで、鍵長の候補を絞り込むことができます。

こうした一連の手法を、**カシスキー（Kasiski）法** といいます。

### 具体例

たとえば、ヴィジュネル暗号文の中に、同一文字列が見つかり、その間隔が30文字だったとします。
そのとき、30の約数である1, 2, 3, 5, 6, 10, 15, 30が鍵長の候補になります。

ただし、1では鍵のサイズが1文字になってしまいます。
ヴィジュネル表の1行だけが常に使用されることを意味し、単一換字式暗号（それもシフト暗号）に他なりません。
ヴィジュネル暗号でわざわざシフト暗号になるような鍵を選択するはずがないので、1は除外できます。

さらに、別の反復文字列があれば、さらに候補を絞り込める可能性が高まります。
なぜなら、どちらの約数にも登場するような数字こそが、新たな鍵長の候補になるからです。

### 一致指数（IC）による暗号種別判定

本ツールでは、カシスキー検査法を実行する前に、一致指数（Index of Coincidence）を計算して暗号種別を自動判定します。

**一致指数の値と暗号種別：**

- IC > 0.060: 単一換字式暗号（シーザー暗号など）の可能性が高い
- IC < 0.045: 多表式暗号（ヴィジュネル暗号など）の可能性が高い
- 0.045 ≤ IC ≤ 0.060: 判定困難（両方の可能性あり）

この事前判定により、適切な解読手法を選択できます。

### 参考図書・文献（私が関与したもの）

- [『暗号技術のすべて』](https://akademeia.info/?page_id=157) P.75-80
- [『暗号解読 実践ガイド』](https://akademeia.info/?page_id=39995) P.168-171

---

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)をご覧ください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
