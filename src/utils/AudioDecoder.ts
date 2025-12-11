/**
 * Universal audio decoder with fallback support
 * Supports: MP3, WAV, OGG, AAC, FLAC, AIFF, M4A, WMA, etc.
 * @module utils/AudioDecoder
 */

import decode from 'audio-decode';
import { convertAiffToWav, isAiffFormat, getAiffSampleRate } from './AiffConverter';

/**
 * Decode audio file with multiple format support
 * First tries native Web Audio API, then falls back to audio-decode library
 */
/**
 * Detect audio file format from file signature (magic bytes)
 */
function detectAudioFormat(arrayBuffer: ArrayBuffer): string {
  // const view = new DataView(arrayBuffer);

  // Check first 12 bytes for common audio formats
  const header = new Uint8Array(arrayBuffer.slice(0, 12));
  const headerStr = String.fromCharCode(...header);

  // AIFF/AIFC
  if (headerStr.startsWith('FORM')) {
    const formType = headerStr.substring(8, 12);
    if (formType === 'AIFF') return 'AIFF';
    if (formType === 'AIFC') return 'AIFF-C (compressed)';
  }

  // WAV/RIFF
  if (headerStr.startsWith('RIFF') && headerStr.includes('WAVE')) return 'WAV';

  // MP3
  if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) return 'MP3';
  if (headerStr.startsWith('ID3')) return 'MP3';

  // OGG
  if (headerStr.startsWith('OggS')) return 'OGG';

  // FLAC
  if (headerStr.startsWith('fLaC')) return 'FLAC';

  // M4A/AAC
  if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) return 'M4A/AAC';

  return 'Unknown';
}

export async function decodeAudioFile(
  audioContext: AudioContext,
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<AudioBuffer> {
  console.log(`🔊 Decoding ${fileName}...`);
  console.log(`   Size: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

  const detectedFormat = detectAudioFormat(arrayBuffer);
  console.log(`   Detected format: ${detectedFormat}`);

  let nativeError: Error | null = null;

  // Try 1: Native Web Audio API (fastest, supports MP3, WAV, OGG, AAC)
  try {
    console.log('   Trying native decodeAudioData...');
    const bufferCopy = arrayBuffer.slice(0);
    const audioBuffer = await audioContext.decodeAudioData(bufferCopy);
    console.log('✅ Decoded with native API');
    console.log(`   Duration: ${audioBuffer.duration.toFixed(2)}s`);
    console.log(`   Sample Rate: ${audioBuffer.sampleRate} Hz`);
    console.log(`   Channels: ${audioBuffer.numberOfChannels}`);
    return audioBuffer;
  } catch (error) {
    nativeError = error as Error;
    console.warn('⚠️ Native decoding failed, trying fallback decoder...');
    console.warn('   Error:', nativeError.message);
  }

  // Try 2: audio-decode library (supports AIFF, FLAC, and more formats)
  try {
    console.log('   Trying audio-decode library...');
    const bufferCopy = arrayBuffer.slice(0);

    // audio-decode returns AudioBuffer-like object, need to convert to Web Audio API AudioBuffer
    const decodedData = await decode(bufferCopy);

    // Create Web Audio API AudioBuffer from decoded data
    const audioBuffer = audioContext.createBuffer(
      decodedData.numberOfChannels || 2,
      decodedData.length,
      decodedData.sampleRate || 44100
    );

    // Copy channel data
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const sourceData = decodedData.getChannelData(channel);
      channelData.set(sourceData);
    }

    console.log('✅ Decoded with audio-decode library');
    console.log(`   Format: Advanced decoder`);
    console.log(`   Duration: ${audioBuffer.duration.toFixed(2)}s`);
    console.log(`   Sample Rate: ${audioBuffer.sampleRate} Hz`);
    console.log(`   Channels: ${audioBuffer.numberOfChannels}`);

    return audioBuffer;
  } catch (fallbackError) {
    console.warn('⚠️ Fallback decoder failed, trying AIFF conversion...');
    console.warn('   Error:', (fallbackError as Error).message);
  }

  // Try 3: AIFF to WAV conversion (for Chrome compatibility)
  if (isAiffFormat(arrayBuffer)) {
    try {
      console.log('   Trying AIFF to WAV conversion...');

      // Get original sample rate from AIFF file
      const originalSampleRate = getAiffSampleRate(arrayBuffer);
      console.log(`   Original AIFF sample rate: ${originalSampleRate}Hz`);

      let targetSampleRate = originalSampleRate;

      // Check if sample rate seems incorrect (common issue with AIFF files)
      // If sample rate is 22050Hz or 11025Hz, it might be half of the actual rate
      if (originalSampleRate === 22050 || originalSampleRate === 11025) {
        console.warn(`⚠️ Detected low sample rate: ${originalSampleRate}Hz`);
        console.warn('   This might be half the actual rate. The audio may play slowly.');
        console.warn('   💡 To fix: Re-export your AIFF file at 44100Hz or 48000Hz');

        // Ask user if they want to double the sample rate
        const shouldDouble = confirm(
          `検出されたサンプルレート: ${originalSampleRate}Hz\n` +
          `このファイルは通常の半分の速度で再生される可能性があります。\n\n` +
          `サンプルレートを2倍(${originalSampleRate * 2}Hz)にして再生しますか？\n` +
          `(元ファイルを44100Hzで再エクスポートすることをお勧めします)`
        );

        if (shouldDouble) {
          targetSampleRate = originalSampleRate * 2;
          console.log(`🔄 Converting with doubled sample rate: ${targetSampleRate}Hz`);
        }
      }

      // Convert AIFF to WAV with target sample rate
      const wavBuffer = convertAiffToWav(arrayBuffer, targetSampleRate);
      const audioBuffer = await audioContext.decodeAudioData(wavBuffer);

      console.log('✅ Decoded via AIFF→WAV conversion');
      console.log(`   Duration: ${audioBuffer.duration.toFixed(2)}s`);
      console.log(`   Sample Rate: ${audioBuffer.sampleRate} Hz`);
      console.log(`   Channels: ${audioBuffer.numberOfChannels}`);

      return audioBuffer;
    } catch (conversionError) {
      console.error('❌ AIFF conversion failed:', (conversionError as Error).message);
    }
  }

  // All methods failed
  console.error('❌ All decoders failed');
  if (nativeError) {
    console.error('   Native error:', nativeError.message);
  }

  const format = detectAudioFormat(arrayBuffer);
  let helpMessage = '';

  if (format.includes('AIFF')) {
    helpMessage = '\n\n💡 AIFF ファイルの対処法:\n' +
      '1. Audacityなどのソフトで WAV または MP3 に変換してください\n' +
      '2. 非圧縮AIFF形式で再保存してみてください\n' +
      '3. このファイルが破損している可能性があります';
  } else if (format === 'Unknown') {
    helpMessage = '\n\n💡 ファイル形式を確認してください。対応形式: MP3, WAV, OGG, AAC, M4A';
  }

  throw new Error(
    `音声ファイル "${fileName}" を読み込めませんでした。\n` +
    `検出された形式: ${format}\n` +
    `ネイティブデコーダー: ${nativeError?.message || 'unknown'}${helpMessage}`
  );
}

/**
  const resampledBuffer = audioContext.createBuffer(
    sourceBuffer.numberOfChannels,
    newLength,
    targetSampleRate
  );

  // Resample each channel using linear interpolation
  for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
    const sourceData = sourceBuffer.getChannelData(channel);
    const targetData = resampledBuffer.getChannelData(channel);

    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i / ratio;
      const index0 = Math.floor(sourceIndex);
      const index1 = Math.min(index0 + 1, sourceData.length - 1);
      const fraction = sourceIndex - index0;

      // Linear interpolation
      targetData[i] = sourceData[index0] * (1 - fraction) + sourceData[index1] * fraction;
    }
  }

  return resampledBuffer;
}

/**
 * Get list of supported audio formats
 */
export function getSupportedFormats(): string[] {
  return [
    'MP3 (.mp3)',
    'WAV (.wav)',
    'OGG (.ogg)',
    'AAC (.aac, .m4a)',
    'FLAC (.flac)',
    'AIFF (.aiff, .aif)',
    'WMA (.wma)',
    'OPUS (.opus)',
    'WebM Audio (.webm)'
  ];
}
