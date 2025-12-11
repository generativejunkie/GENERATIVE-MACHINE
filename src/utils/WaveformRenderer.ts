/**
 * Waveform rendering utility
 * Generates and displays audio waveforms on canvas
 * @module utils/WaveformRenderer
 */

export class WaveformRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private waveformData: number[] = [];
  private currentPosition: number = 0;
  private color: string = '#000';

  constructor(canvas: HTMLCanvasElement, color: string = '#000') {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.color = color;
  }

  /**
   * Generate waveform data from audio buffer
   */
  public generateWaveform(audioBuffer: AudioBuffer, samples: number = 500): void {
    const rawData = audioBuffer.getChannelData(0); // Use first channel
    const blockSize = Math.floor(rawData.length / samples);
    const waveformData: number[] = [];

    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      waveformData.push(sum / blockSize);
    }

    this.waveformData = waveformData;
    this.render();
  }

  /**
   * Render waveform on canvas (Pioneer DJ style)
   */
  public render(): void {
    if (this.waveformData.length === 0) {
      this.renderEmpty();
      return;
    }

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Draw background (dark like Pioneer)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, width, height);

    // Draw grid lines (Pioneer style)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Draw center line (brighter)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();

    // Draw waveform bars (Pioneer style - vertical bars)
    const barWidth = Math.max(2, width / this.waveformData.length);
    const barGap = 1;

    for (let i = 0; i < this.waveformData.length; i++) {
      const x = i * barWidth;
      const amplitude = this.waveformData[i];
      const barHeight = amplitude * (height / 2) * 0.9;

      // Draw bar above center
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(x, height / 2 - barHeight, barWidth - barGap, barHeight);

      // Draw bar below center (mirrored)
      this.ctx.fillRect(x, height / 2, barWidth - barGap, barHeight);
    }

    // Draw playback position indicator (Pioneer style - vertical line)
    if (this.currentPosition > 0) {
      const x = this.currentPosition * width;

      // Glow effect
      this.ctx.shadowColor = '#00ff00';
      this.ctx.shadowBlur = 10;

      this.ctx.strokeStyle = '#00ff00';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();

      // Reset shadow
      this.ctx.shadowBlur = 0;
    }
  }

  /**
   * Render empty state (Pioneer DJ style)
   */
  private renderEmpty(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Draw dark background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, width, height);

    // Draw grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Draw center line
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();

    // Draw text
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('NO AUDIO LOADED', width / 2, height / 2);
  }

  /**
   * Update playback position (0 to 1)
   */
  public setPosition(position: number): void {
    this.currentPosition = Math.max(0, Math.min(1, position));
    this.render();
  }

  /**
   * Set waveform color
   */
  public setColor(color: string): void {
    this.color = color;
    this.render();
  }

  /**
   * Clear waveform
   */
  public clear(): void {
    this.waveformData = [];
    this.currentPosition = 0;
    this.renderEmpty();
  }

  /**
   * Resize canvas
   */
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }
}
