# 🔄 MANDALA-MACHINE ハンドオフドキュメント

**最終更新**: 2026-01-16T18:30 JST  
**プロジェクトパス**: `/Users/takayukimatsushima/Documents/GitHub/MANDALA-MACHINE`

---

## 📋 プロジェクト概要

**MANDALA-MACHINE** は、Three.js と TypeScript で構築されたプロフェッショナルグレードの **3Dオーディオビジュアライザー** です。リアルタイムの音声入力に反応し、曼荼羅パターンやジェネラティブアートを生成します。

### 主要技術スタック
- **Frontend**: TypeScript, Three.js, p5.js
- **Build Tool**: Vite
- **Testing**: Vitest

---

## 🏗️ アーキテクチャ

```
src/
├── core/
│   └── Application.ts      # メインオーケストレーター（全マネージャーを統合）
├── managers/
│   ├── AudioManager.ts     # オーディオ入力・周波数分析・BPM検出
│   ├── SceneManager.ts     # Three.js シーン・カメラ・レンダラー管理
│   ├── InstanceManager.ts  # オブジェクトインスタンス管理
│   ├── MixerManager.ts     # ミキサー機能
│   ├── MidiManager.ts      # MIDI入力対応
│   └── AccessibilityManager.ts # アクセシビリティ
├── features/
│   ├── NeuralPatternLearner.ts # AIパターン学習
│   └── ProcessingLayer.ts      # p5.js レイヤー
├── ui/
│   └── UIController.ts     # UIイベント制御
├── materials/
│   └── geometries.ts       # 23種類のジオメトリ定義
├── utils/                  # ヘルパー関数群
├── types/                  # TypeScript型定義
├── constants/              # 設定定数
├── locales/                # 多言語対応 (ja/en)
├── main.ts                 # エントリーポイント
└── style.css               # スタイル
```

---

## 🎮 主要モード

| モード | 説明 | 制御方法 |
|--------|------|----------|
| **Mandala** | 対称パターン生成（4/6/8/12-way） | `app.toggleMandalaMode()` |
| **Space (宇宙)** | AIが音に合わせてパラメータ自動制御 | `app.setSpaceMode(true)` |
| **AUTO** | 自動オブジェクト生成 + モードサイクル | `app.setAutoMode(true)` |
| **Zero Gravity** | オブジェクトが無重力浮遊 | `app.toggleAntigravityMode(true)` |
| **Mirror Ball** | ミラーボール効果 | `app.setMirrorBallMode(true)` |
| **Frequency Spawn** | 周波数帯に応じてオブジェクト生成 | `app.setFrequencySpawn(true)` |

---

## 🚀 起動方法

```bash
cd /Users/takayukimatsushima/Documents/GitHub/MANDALA-MACHINE
npm run dev
# → http://localhost:3000/
```

**現在のサーバー状態**: ✅ 稼働中（48時間以上連続稼働）

---

## 📡 関連プロジェクト

### Bridge Server（iOSアプリ連携用）
- **場所**: `/Users/takayukimatsushima/Documents/GitHub/GENERATIVE-MACHINE/bridge-server.js`
- **用途**: iOSアプリ「Antigravity」からのリモート制御
- **起動**: `npm start` (GENERATIVE-MACHINEディレクトリで)
- **注意**: MANDALA-MACHINEとは別ワークスペースのため、アクセスにはユーザー許可が必要

### iOS App
- **場所**: `/Users/takayukimatsushima/Documents/GitHub/Antigravity/`
- **用途**: リモートコントロール用iOSアプリ

---

## 🔧 最近の開発履歴（会話サマリーより）

1. **AUTO / Gravity モードの改良** - オブジェクトの分散配置、AUTOモードで全機能サイクル
2. **Power機能の調査** - 電力/パワー関連機能の探索
3. **UI修正** - Singularityメニューの削除、AutoPilotモードのUI調整
4. **iOS連携** - Bridge Serverを介したリモートコマンド（NEXT IMAGE, GLITCH BURST, VOID MODE）
5. **USB Audio入力対応** - DDJ-FLX2などの外部デバイス認識

---

## 🎛️ 主要API（window.mandalaMachine）

```javascript
// オブジェクト操作
mandalaMachine.addInstance(materialIndex)  // 特定のマテリアルを追加
mandalaMachine.clearAll()                  // 全クリア

// モード切り替え
mandalaMachine.toggleMandalaMode()
mandalaMachine.setSpaceMode(true/false)
mandalaMachine.setAutoMode(true/false)
mandalaMachine.toggleAntigravityMode(true/false)

// パラメータ調整
mandalaMachine.setSizeMultiplier(1.0)
mandalaMachine.setSpeedMultiplier(1.0)
mandalaMachine.setSpacingMultiplier(10.0)
mandalaMachine.setSymmetryCount(8)

// オーディオ
mandalaMachine.startMicrophone()
mandalaMachine.stopAudio()
```

---

## ⚠️ 既知の課題・注意点

1. **ブラウザ自動化の問題**: 内蔵ブラウザツールでlocalhost接続がタイムアウトすることがある
2. **iOS連携**: Bridge Serverが別リポジトリにあるため、起動には別途作業が必要
3. **USB Audio**: デバイスによっては手動でのデバイス選択が必要

---

## 📝 引き継ぎ時のTips

1. **プロジェクト構造の理解**: `Application.ts` が全体のオーケストレーター。ここを読めば全体像がわかる
2. **UIとロジックの連携**: `UIController.ts` がHTML要素と `Application` を繋いでいる
3. **新機能追加時**: 
   - マネージャークラスを `managers/` に追加
   - `Application.ts` でインスタンス化・イベント接続
   - `UIController.ts` でUI連携
4. **デバッグ**: ブラウザコンソールで `mandalaMachine` オブジェクトを直接操作可能

---

## 🤖 同時進行ガイド（複数AI協調作業）

### 📌 現在の作業状況

| 担当AI | 作業内容 | 担当ファイル | ステータス |
|--------|----------|--------------|------------|
| Claude (Gemini Session) | 待機中 - ユーザー指示待ち | 未定 | 🟡 作業中 |
| _空き_ | - | - | 🟢 利用可能 |


> **使い方**: 作業開始時にこの表を更新し、終了時に「🟢 利用可能」に戻す

---

### 🔒 ファイルロック表

作業中のファイルをここに記載し、他のAIは編集を避ける。

```
現在ロック中のファイル:
（なし）

例:
- src/core/Application.ts (AI-A, 18:30〜)
- src/ui/UIController.ts (AI-B, 18:35〜)
```

---

### 📂 担当領域の分け方（推奨）

| 領域 | ファイル群 | 担当可能な作業 |
|------|-----------|----------------|
| **Core** | `Application.ts`, `main.ts` | 全体ロジック、モード制御 |
| **Audio** | `AudioManager.ts`, `MixerManager.ts`, `MidiManager.ts` | 音声入力、BPM、MIDI |
| **Visual** | `SceneManager.ts`, `geometries.ts`, `ProcessingLayer.ts` | 3D描画、エフェクト |
| **UI** | `UIController.ts`, `index.html`, `style.css` | 画面、スタイル |
| **Features** | `features/` 配下 | AI学習、新機能 |
| **Types/Utils** | `types/`, `utils/`, `constants/` | 型定義、ヘルパー |
| **Locales** | `locales/` | 多言語対応 |

---

### ⚠️ 競合回避ルール

1. **作業開始時**: この HANDOFF.md を更新し、担当ファイルを宣言
2. **同じファイルは同時に触らない**: ロック表を確認
3. **依存関係に注意**: 
   - `types/index.ts` を変更 → 他の全ファイルに影響
   - `Application.ts` を変更 → UI/Manager に影響
4. **作業完了時**: ロックを解除し、変更内容をこのファイルに記録
5. **ビルドエラーが出たら**: 最後に変更した AI が対応

---

### 📝 変更ログ（同時進行時に記録）

```
[2026-01-16 18:32] 初期セットアップ - ハンドオフドキュメント作成
```

---

### 💬 AI間メッセージボード

他のAIへの伝言があればここに記載：

```
（メッセージなし）
```

---

**このドキュメントを新しいAIに読ませれば、プロジェクトの文脈を理解できます。**
