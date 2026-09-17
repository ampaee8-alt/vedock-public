export const CHAPTERS = Object.freeze([
  { id: 'launch', label: 'Launch', start: 0 },
  { id: 'd1', label: 'D1 · Edit & review', start: 6000 },
  { id: 'r2', label: 'R2 · Upload', start: 21000 },
  { id: 'logs', label: 'Workers · Live logs', start: 34000 },
]);
export const DURATION = 46000;
const phases = [
  [0, 'launch', 51, 46], [3400, 'launch-open', 51, 46],
  [6000, 'd1-select', 14, 31], [9000, 'd1-edit', 69, 42],
  [14000, 'd1-review', 85, 19], [19000, 'd1-done', 75, 73],
  [21000, 'r2-drop', 14, 40], [25000, 'r2-upload', 68, 56],
  [31000, 'r2-done', 79, 74], [34000, 'logs-connect', 14, 50],
  [37000, 'logs-live', 79, 22],
];
const ease = value => value * value * (3 - 2 * value);
export class DemoTimeline {
  constructor({ reducedMotion = false } = {}) {
    this.reducedMotion = reducedMotion;
    this.elapsed = 0;
    this.userPaused = reducedMotion;
    this.visible = true;
    this.hidden = false;
  }
  get playing() { return !this.userPaused && !this.reducedMotion && this.visible && !this.hidden; }
  tick(delta) {
    if (this.playing && Number.isFinite(delta) && delta > 0) this.elapsed = (this.elapsed + delta) % DURATION;
    return this.frame;
  }
  pause() { this.userPaused = true; }
  play() { this.userPaused = false; }
  replay() { this.elapsed = 0; this.userPaused = this.reducedMotion; }
  setVisibility(visible, hidden) { this.visible = visible; this.hidden = hidden; }
  seek(id) {
    const chapter = CHAPTERS.find(chapter => chapter.id === id);
    if (!chapter) throw new RangeError('Unknown demo chapter');
    this.elapsed = chapter.start + (this.reducedMotion ? ({ d1: 9000, r2: 7000, logs: 5000 }[id] ?? 0) : 0);
    return this.frame;
  }
  get frame() {
    const chapter = CHAPTERS.findLast(chapter => this.elapsed >= chapter.start);
    const index = phases.findLastIndex(phase => this.elapsed >= phase[0]);
    const [start, phase, x, y] = phases[index];
    const previous = phases[Math.max(index - 1, 0)];
    const progress = ease(Math.min((this.elapsed - start) / 1100, 1));
    return {
      elapsed: this.elapsed, progress: this.elapsed / DURATION,
      chapter: chapter.id, phase, phaseTime: this.elapsed - start,
      cursor: { x: previous[2] + (x - previous[2]) * progress, y: previous[3] + (y - previous[3]) * progress },
      click: this.elapsed - start > 1150 && this.elapsed - start < 1600,
      upload: Math.min(Math.max((this.elapsed - 25000) / 5700, 0), 1),
      logCount: Math.min(Math.max(Math.floor((this.elapsed - 37000) / 650) + 1, 0), 7),
    };
  }
}
const glyphs = '01_<>/{}[]';
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
export function scrambleText(text, progress, { reducedMotion = false } = {}) {
  if (reducedMotion || progress >= 1) return text;
  const characters = [...segmenter.segment(text)].map(item => item.segment);
  const resolved = Math.floor(characters.length * Math.max(progress, 0));
  return characters.map((char, index) => /\s/u.test(char) || index < resolved ? char : glyphs[(index * 7 + Math.floor(progress * 31)) % glyphs.length]).join('');
}
