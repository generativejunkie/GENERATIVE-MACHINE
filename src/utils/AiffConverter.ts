/**
 * AIFF to WAV converter for Chrome compatibility
 * Converts AIFF files to WAV format in the browser
 * @module utils/AiffConverter
 */

/**
 * Parse 80-bit extended precision float (IEEE 754) to sample rate
 */
function parseExtended80(buffer: DataView, offset: number): number {
  const exponent = buffer.getUint16(offset, false);
  const mantissaHi = buffer.getUint32(offset + 2, false);
  const mantissaLo = buffer.getUint32(offset + 6, false);

  // Check for common sample rates first (more reliable)
  const commonRates = [8000, 11025, 16000, 22050, 32000, 44100, 48000, 88200, 96000, 176400, 192000];

  // Simple heuristic: if exponent is in reasonable range for audio
  if (exponent >= 0x400D && exponent <= 0x400F) {
    const exp = (exponent & 0x7FFF) - 16383;
    const mantissa = (mantissaHi >>> 0) / 0x100000000 + (mantissaLo >>> 0) / 0x100000000 / 0x100000000;
    // The mantissa in 80-bit float includes the explicit integer bit.
    // Our calculation treats it as 0.1xxxx (0.5-1.0), but it should be 1.xxxx (1.0-2.0).
    // So we need to multiply by 2 to get the correct value.
    const value = mantissa * 2 * Math.pow(2, exp);

    // Round to nearest common sample rate
    for (const rate of commonRates) {
      if (Math.abs(value - rate) < 100) {
        console.log(`   Detected common sample rate: ${rate}Hz (calculated: ${value.toFixed(2)}Hz)`);
        return rate;
      }
    }

    return Math.round(value);
  }

  // Fallback to 44100Hz if parsing fails
  console.warn('   Could not parse sample rate, defaulting to 44100Hz');
  return 44100;
}

/**
 * Get sample rate from AIFF file without full conversion
 */
export function getAiffSampleRate(aiffBuffer: ArrayBuffer): number {
  const view = new DataView(aiffBuffer);

  // Verify AIFF format
  const formChunk = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  if (formChunk !== 'FORM') {
    throw new Error('Not a valid AIFF file');
  }

  // Find COMM chunk to get sample rate
  let offset = 12; // Skip FORM header

  while (offset < view.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );

    const chunkSize = view.getUint32(offset + 4, false); // Big-endian

    if (chunkId === 'COMM') {
      const commOffset = offset + 8;
      // Parse 80-bit extended precision sample rate
      return parseExtended80(view, commOffset + 8);
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 === 1) offset++; // Align to even byte
  }

  // No COMM chunk found, default to 44100Hz
  return 44100;
}

/**
 * Convert AIFF file to WAV format
 * AIFF and WAV are both PCM formats, just with different headers
 * @param aiffBuffer - Original AIFF file buffer
 * @param targetSampleRate - Optional target sample rate (to override original)
 */
export function convertAiffToWav(aiffBuffer: ArrayBuffer, targetSampleRate?: number): ArrayBuffer {
  const view = new DataView(aiffBuffer);

  // Verify AIFF format
  const formChunk = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  if (formChunk !== 'FORM') {
    throw new Error('Not a valid AIFF file');
  }

  // Parse AIFF chunks
  let commOffset = -1;
  let ssndOffset = -1;
  let channels = 2;
  let originalSampleRate = 44100;
  let bitDepth = 16;
  let audioDataSize = 0;
  let audioDataOffset = 0;

  let offset = 12; // Skip FORM header

  while (offset < view.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );

    const chunkSize = view.getUint32(offset + 4, false); // Big-endian

    if (chunkId === 'COMM') {
      commOffset = offset + 8;
      channels = view.getUint16(commOffset, false);
      bitDepth = view.getUint16(commOffset + 6, false);

      // Parse 80-bit extended precision sample rate
      originalSampleRate = parseExtended80(view, commOffset + 8);
    } else if (chunkId === 'SSND') {
      ssndOffset = offset + 8;
      const ssndBlockOffset = view.getUint32(ssndOffset, false);
      audioDataOffset = ssndOffset + 8 + ssndBlockOffset;
      audioDataSize = chunkSize - 8 - ssndBlockOffset;
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 === 1) offset++; // Align to even byte
  }

  if (commOffset === -1 || ssndOffset === -1) {
    throw new Error('Invalid AIFF file: missing COMM or SSND chunk');
  }

  // Use target sample rate if provided, otherwise use original
  const sampleRate = targetSampleRate || originalSampleRate;

  console.log(`📊 AIFF Info:`);
  console.log(`   Channels: ${channels}`);
  console.log(`   Original Sample Rate: ${originalSampleRate}Hz`);
  if (targetSampleRate) {
    console.log(`   Target Sample Rate: ${targetSampleRate}Hz (doubled)`);
  }
  console.log(`   Bit Depth: ${bitDepth}bit`);
  console.log(`   Audio Data Size: ${audioDataSize} bytes`);
  console.log(`   Duration: ${(audioDataSize / (originalSampleRate * channels * (bitDepth / 8))).toFixed(2)}s`);

  // Create WAV file
  const wavSize = 44 + audioDataSize;
  const wavBuffer = new ArrayBuffer(wavSize);
  const wavView = new DataView(wavBuffer);
  const wavBytes = new Uint8Array(wavBuffer);

  // WAV Header
  let pos = 0;

  // "RIFF" chunk descriptor
  wavView.setUint8(pos++, 'R'.charCodeAt(0));
  wavView.setUint8(pos++, 'I'.charCodeAt(0));
  wavView.setUint8(pos++, 'F'.charCodeAt(0));
  wavView.setUint8(pos++, 'F'.charCodeAt(0));
  wavView.setUint32(pos, wavSize - 8, true); // File size - 8
  pos += 4;

  // "WAVE" format
  wavView.setUint8(pos++, 'W'.charCodeAt(0));
  wavView.setUint8(pos++, 'A'.charCodeAt(0));
  wavView.setUint8(pos++, 'V'.charCodeAt(0));
  wavView.setUint8(pos++, 'E'.charCodeAt(0));

  // "fmt " sub-chunk
  wavView.setUint8(pos++, 'f'.charCodeAt(0));
  wavView.setUint8(pos++, 'm'.charCodeAt(0));
  wavView.setUint8(pos++, 't'.charCodeAt(0));
  wavView.setUint8(pos++, ' '.charCodeAt(0));
  wavView.setUint32(pos, 16, true); // Subchunk size
  pos += 4;
  wavView.setUint16(pos, 1, true); // Audio format (1 = PCM)
  pos += 2;
  wavView.setUint16(pos, channels, true);
  pos += 2;
  wavView.setUint32(pos, sampleRate, true);
  pos += 4;
  wavView.setUint32(pos, sampleRate * channels * (bitDepth / 8), true); // Byte rate
  pos += 4;
  wavView.setUint16(pos, channels * (bitDepth / 8), true); // Block align
  pos += 2;
  wavView.setUint16(pos, bitDepth, true);
  pos += 2;

  // "data" sub-chunk
  wavView.setUint8(pos++, 'd'.charCodeAt(0));
  wavView.setUint8(pos++, 'a'.charCodeAt(0));
  wavView.setUint8(pos++, 't'.charCodeAt(0));
  wavView.setUint8(pos++, 'a'.charCodeAt(0));
  wavView.setUint32(pos, audioDataSize, true);
  pos += 4;

  // Copy audio data (convert from big-endian to little-endian if needed)
  const aiffBytes = new Uint8Array(aiffBuffer);

  if (bitDepth === 16) {
    // 16-bit: swap bytes (AIFF is big-endian, WAV is little-endian)
    for (let i = 0; i < audioDataSize; i += 2) {
      wavBytes[pos + i] = aiffBytes[audioDataOffset + i + 1];
      wavBytes[pos + i + 1] = aiffBytes[audioDataOffset + i];
    }
  } else if (bitDepth === 8) {
    // 8-bit: direct copy (no endianness)
    for (let i = 0; i < audioDataSize; i++) {
      wavBytes[pos + i] = aiffBytes[audioDataOffset + i];
    }
  } else if (bitDepth === 24) {
    // 24-bit: swap 3 bytes
    for (let i = 0; i < audioDataSize; i += 3) {
      wavBytes[pos + i] = aiffBytes[audioDataOffset + i + 2];
      wavBytes[pos + i + 1] = aiffBytes[audioDataOffset + i + 1];
      wavBytes[pos + i + 2] = aiffBytes[audioDataOffset + i];
    }
  } else {
    // Unsupported bit depth - try direct copy
    for (let i = 0; i < audioDataSize; i++) {
      wavBytes[pos + i] = aiffBytes[audioDataOffset + i];
    }
  }

  console.log('✅ AIFF converted to WAV');
  console.log(`📝 WAV Header:`);
  console.log(`   Sample Rate: ${sampleRate}Hz`);
  console.log(`   Channels: ${channels}`);
  console.log(`   Bit Depth: ${bitDepth}bit`);
  console.log(`   Byte Rate: ${sampleRate * channels * (bitDepth / 8)} bytes/sec`);

  return wavBuffer;
}

/**
 * Check if buffer is AIFF format
 */
export function isAiffFormat(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) return false;

  const view = new DataView(buffer);
  const header = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  return header === 'FORM';
}
