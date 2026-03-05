/**
 * TimetableManager - DJ Timetable Overlay Engine
 * Handles time-based DJ name display with fade in/out for VJ use
 *
 * Features:
 *  - Automatic DJ name switching based on system time
 *  - Midnight crossover support (e.g. 23:00-01:00)
 *  - Fade in/out transitions
 *  - Manual override (force show/hide)
 *  - CSV import
 *  - Duplicate slot resolution (first match wins)
 *
 * @module features/TimetableManager
 */

export interface TimetableEntry {
  djName: string;
  startTime: string; // "HH:mm" (24h), supports "25:30" for next-day
  endTime: string;   // "HH:mm" or "25:30" style
}

export interface TimetableState {
  entries: TimetableEntry[];
  isEnabled: boolean;
  overrideEntry: TimetableEntry | null;
  currentEntry: TimetableEntry | null;
  nextEntry: TimetableEntry | null;
  fadeOpacity: number; // 0.0 - 1.0
}

type TimetableCallback = (entry: TimetableEntry | null, opacity: number) => void;

/**
 * Convert "HH:mm" or "25:30" style string to minutes-since-midnight.
 * Values >= 24:00 are allowed (next-day times like 25:30 = 1:30 AM + 1440).
 */
function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Get current time as minutes since midnight (0..1439).
 */
function nowInMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

/**
 * Resolve whether now falls within [start, end).
 * Handles:
 *   - Normal range: 22:00 - 23:59
 *   - Crossover range: 23:00 - 01:00 (stored as 23:00-25:00)
 *   - Extended hour notation: 25:30 = 01:30 next day
 */
function isActive(entry: TimetableEntry, nowMin: number): boolean {
  const start = timeStrToMinutes(entry.startTime);
  const end = timeStrToMinutes(entry.endTime);

  if (end > start) {
    // Normal range or extended hour (e.g. 23:00-25:30)
    // Extend "now" for post-midnight: if now < 12h, also check as now+1440
    return (nowMin >= start && nowMin < end) ||
           (nowMin + 1440 >= start && nowMin + 1440 < end);
  } else {
    // Wrap-around without extended notation (e.g. 23:00-01:00)
    return nowMin >= start || nowMin < end;
  }
}

export class TimetableManager {
  private state: TimetableState = {
    entries: [],
    isEnabled: false,
    overrideEntry: null,
    currentEntry: null,
    nextEntry: null,
    fadeOpacity: 0,
  };

  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: TimetableCallback[] = [];

  // Fade config
  private readonly FADE_STEP = 0.05;       // opacity change per frame
  private readonly FADE_INTERVAL_MS = 50;  // ~20fps fade
  private targetOpacity = 0;

  constructor() {}

  // --- Public API ---

  /** Start the timetable engine (poll every 10s) */
  start(): void {
    this.state.isEnabled = true;
    this._tick();
    this.tickInterval = setInterval(() => this._tick(), 10_000);
    this._startFadeLoop();
  }

  /** Stop engine and hide overlay */
  stop(): void {
    this.state.isEnabled = false;
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.targetOpacity = 0;
    this.state.currentEntry = null;
    this._emit();
  }

  /** Enable/disable without destroying entries */
  setEnabled(enabled: boolean): void {
    enabled ? this.start() : this.stop();
  }

  /** Force-show a specific entry regardless of time */
  setOverride(entry: TimetableEntry | null): void {
    this.state.overrideEntry = entry;
    this._updateDisplay();
  }

  /** Load entries (replaces existing) */
  setEntries(entries: TimetableEntry[]): void {
    this.state.entries = [...entries];
    if (this.state.isEnabled) this._tick();
  }

  /** Append a single entry */
  addEntry(entry: TimetableEntry): void {
    this.state.entries.push(entry);
    if (this.state.isEnabled) this._tick();
  }

  /** Remove entry by index */
  removeEntry(index: number): void {
    this.state.entries.splice(index, 1);
    if (this.state.isEnabled) this._tick();
  }

  /** Parse CSV string: "DJ Name,HH:mm,HH:mm" per line */
  importCSV(csvText: string): TimetableEntry[] {
    const entries: TimetableEntry[] = [];
    const lines = csvText.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length >= 3) {
        entries.push({ djName: parts[0], startTime: parts[1], endTime: parts[2] });
      }
    }
    this.setEntries(entries);
    return entries;
  }

  getState(): TimetableState {
    return { ...this.state, entries: [...this.state.entries] };
  }

  /** Register a callback: called whenever display should update */
  onChange(cb: TimetableCallback): void {
    this.callbacks.push(cb);
  }

  // --- Internal ---

  private _tick(): void {
    this._updateDisplay();
    this._updateNext();
  }

  private _updateDisplay(): void {
    if (this.state.overrideEntry) {
      this.state.currentEntry = this.state.overrideEntry;
      this.targetOpacity = 1;
      this._emit();
      return;
    }

    if (!this.state.isEnabled) {
      this.targetOpacity = 0;
      this._emit();
      return;
    }

    const nowMin = nowInMinutes();
    // First matching entry wins (duplicate resolution)
    const active = this.state.entries.find(e => isActive(e, nowMin)) ?? null;

    const changed = active?.djName !== this.state.currentEntry?.djName;
    this.state.currentEntry = active;
    this.targetOpacity = active ? 1 : 0;

    if (changed) this._emit();
  }

  private _updateNext(): void {
    const nowMin = nowInMinutes();
    const future = this.state.entries
      .filter(e => timeStrToMinutes(e.startTime) > nowMin)
      .sort((a, b) => timeStrToMinutes(a.startTime) - timeStrToMinutes(b.startTime));
    this.state.nextEntry = future[0] ?? null;
  }

  private _startFadeLoop(): void {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.fadeInterval = setInterval(() => {
      const diff = this.targetOpacity - this.state.fadeOpacity;
      if (Math.abs(diff) < this.FADE_STEP) {
        this.state.fadeOpacity = this.targetOpacity;
      } else {
        this.state.fadeOpacity += diff > 0 ? this.FADE_STEP : -this.FADE_STEP;
      }
      if (Math.abs(diff) > 0.001) this._emit();
    }, this.FADE_INTERVAL_MS);
  }

  private _emit(): void {
    const entry = this.state.currentEntry;
    const opacity = this.state.fadeOpacity;
    for (const cb of this.callbacks) {
      cb(entry, opacity);
    }
  }
}
