# サポートされているオーディオフォーマット

Mandala Machine は、DTM（デスクトップミュージック）やプロフェッショナルなオーディオ制作で使用される様々なフォーマットに対応しています。

## ✅ サポート済みフォーマット

### ロスレス（非圧縮/可逆圧縮）

| フォーマット | 拡張子 | 説明 | DTM用途 |
|------------|--------|------|---------|
| **WAV** | `.wav` | 非圧縮PCMオーディオ | ⭐⭐⭐ 最も一般的 |
| **AIFF** | `.aiff`, `.aif` | Apple標準の非圧縮フォーマット | ⭐⭐⭐ Mac/Logic Pro |
| **FLAC** | `.flac` | 可逆圧縮（50%程度に圧縮） | ⭐⭐ アーカイブ用 |
| **ALAC** | `.alac`, `.m4a` | Apple Lossless（iTunes互換） | ⭐⭐ Apple製品 |

### 非可逆圧縮

| フォーマット | 拡張子 | 説明 | 品質 |
|------------|--------|------|------|
| **MP3** | `.mp3` | 最も一般的な圧縮形式 | 128-320kbps |
| **AAC** | `.aac`, `.m4a` | MP3より高品質 | 96-256kbps |
| **OGG Vorbis** | `.ogg` | オープンソース高品質 | 可変ビットレート |
| **Opus** | `.opus` | 最新の高効率コーデック | 6-510kbps |

### その他

| フォーマット | 拡張子 | 説明 | 対応状況 |
|------------|--------|------|----------|
| **WMA** | `.wma` | Windows Media Audio | ✅ ブラウザ依存 |
| **MIDI** | `.mid`, `.midi` | 音符データ（オーディオではない） | ⚠️ 未対応 |

## 🎚️ 推奨フォーマット

### DAW（デジタル・オーディオ・ワークステーション）から書き出す場合

1. **最高品質**: WAV 24bit/48kHz 以上
2. **Mac/Logic Pro**: AIFF 24bit/48kHz
3. **ストリーミング用**: AAC 256kbps または MP3 320kbps

### ファイルサイズと品質のバランス

| 用途 | 推奨フォーマット | ビットレート/設定 |
|------|----------------|------------------|
| プロフェッショナル制作 | WAV/AIFF | 24bit/48kHz以上 |
| マスタリング | WAV/AIFF | 24bit/96kHz |
| 一般的な使用 | MP3 | 320kbps CBR |
| ストリーミング配信 | AAC | 256kbps |
| アーカイブ | FLAC | デフォルト設定 |

## 🔧 Web Audio API の対応

Mandala Machine はブラウザの Web Audio API を使用しています。

### ブラウザ対応状況

| フォーマット | Chrome | Firefox | Safari | Edge |
|------------|--------|---------|--------|------|
| WAV | ✅ | ✅ | ✅ | ✅ |
| MP3 | ✅ | ✅ | ✅ | ✅ |
| AAC/M4A | ✅ | ✅ | ✅ | ✅ |
| OGG | ✅ | ✅ | ⚠️ | ✅ |
| FLAC | ✅ | ✅ | ✅ | ✅ |
| AIFF | ✅ | ✅ | ✅ | ✅ |
| ALAC | ✅ | ⚠️ | ✅ | ✅ |
| Opus | ✅ | ✅ | ⚠️ | ✅ |

**凡例**: ✅ = フル対応、⚠️ = 部分的対応または非対応

## 💡 使用のヒント

### 最適な品質を得るために

1. **サンプルレート**: 44.1kHz 以上を推奨
2. **ビット深度**: WAV/AIFF は 16bit 以上
3. **ファイルサイズ**: ブラウザのメモリ制限に注意（目安: 100MB以下）

### DAW 別推奨エクスポート設定

#### Ableton Live
```
File > Export Audio/Video
Format: WAV
Sample Rate: 48000 Hz
Bit Depth: 24 bit
```

#### Logic Pro
```
File > Bounce > Project or Section
Format: AIFF
Resolution: 24 bit
Sample Rate: 48 kHz
```

#### FL Studio
```
File > Export > Wave file
Format: 32Bit float / 24Bit int
Sample rate: 48000 Hz
```

#### Cubase/Nuendo
```
File > Export > Audio Mixdown
Format: Wave File
Bit Depth: 24 Bit
Sample Rate: 48000 Hz
```

## 🚫 現在未対応

- **MIDI ファイル** (.mid, .midi): 将来的に対応予定
- **プロジェクトファイル**: .als, .logic, .flp など
- **ステムファイル**: マルチトラック対応は将来検討

## 📊 ファイルサイズの目安

| フォーマット | 3分の曲 | 5分の曲 |
|------------|---------|---------|
| WAV 16bit/44.1kHz | 約 30MB | 約 50MB |
| WAV 24bit/48kHz | 約 51MB | 約 85MB |
| FLAC | 約 15-25MB | 約 25-42MB |
| MP3 320kbps | 約 7MB | 約 12MB |
| AAC 256kbps | 約 6MB | 約 9MB |

## 🆘 トラブルシューティング

### ファイルが読み込めない場合

1. **ファイル形式を確認**: 拡張子が正しいか確認
2. **ファイルサイズ**: 100MB以下に収める
3. **破損チェック**: 別のプレーヤーで再生できるか確認
4. **ブラウザを変更**: Chrome または Edge を推奨
5. **形式変換**: Audacity などで WAV に変換

### 音質が悪い場合

1. **元ファイルの品質**: 可能な限り高品質な元ファイルを使用
2. **ビットレート**: MP3 なら 256kbps 以上推奨
3. **サンプルレート**: 44.1kHz 以上

---

**最終更新**: 2025年11月
**対応バージョン**: Mandala Machine v2.0+
