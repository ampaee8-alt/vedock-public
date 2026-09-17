export const CHAPTERS = Object.freeze([
  { id: 'launch', label: 'Launch', start: 0 },
  { id: 'd1', label: 'D1 · Edit & review', start: 800 },
  { id: 'r2', label: 'R2 · Upload', start: 8300 },
  { id: 'logs', label: 'Workers · Live logs', start: 14800 },
]);
export const DURATION = 20800;
const phases = [
  [0, 'launch', 51, 46], [250, 'launch-open', 51, 46],
  [800, 'd1-select', 14, 31], [2300, 'd1-edit', 69, 42],
  [4800, 'd1-review', 85, 19], [7300, 'd1-done', 75, 73],
  [8300, 'r2-drop', 14, 40], [10300, 'r2-upload', 68, 56],
  [13300, 'r2-done', 79, 74], [14800, 'logs-connect', 14, 50],
  [16300, 'logs-live', 79, 22],
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
  setReducedMotion(value) {
    this.reducedMotion = value;
    this.userPaused = false;
    if (value) this.seek('d1');
  }
  pause() { this.userPaused = true; }
  play() { this.userPaused = false; }
  replay() { this.elapsed = 0; this.userPaused = this.reducedMotion; }
  setVisibility(visible, hidden) { this.visible = visible; this.hidden = hidden; }
  seek(id) {
    const chapter = CHAPTERS.find(chapter => chapter.id === id);
    if (!chapter) throw new RangeError('Unknown demo chapter');
    this.elapsed = chapter.start + (this.reducedMotion ? ({ d1: 4500, r2: 3500, logs: 2500 }[id] ?? 0) : 0);
    return this.frame;
  }
  get frame() {
    const chapter = CHAPTERS.findLast(chapter => this.elapsed >= chapter.start);
    const index = phases.findLastIndex(phase => this.elapsed >= phase[0]);
    const [start, phase, x, y] = phases[index];
    const previous = phases[Math.max(index - 1, 0)];
    const progress = ease(Math.min((this.elapsed - start) / 550, 1));
    return {
      elapsed: this.elapsed, progress: this.elapsed / DURATION,
      chapter: chapter.id, phase, phaseTime: this.elapsed - start,
      cursor: { x: previous[2] + (x - previous[2]) * progress, y: previous[3] + (y - previous[3]) * progress },
      click: phase === 'launch' ? this.elapsed > 100 && this.elapsed < 220 : this.elapsed - start > 575 && this.elapsed - start < 800,
      upload: Math.min(Math.max((this.elapsed - 10300) / 2850, 0), 1),
      logCount: Math.min(Math.max(Math.floor((this.elapsed - 16300) / 325) + 1, 0), 7),
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

// Enter at 12%, leave only when fully out: scroll direction does not matter.
export class RevealCycle {
  constructor() { this.visible = false; this.revision = 0; }
  update(ratio) {
    const next = this.visible ? ratio > 0 : ratio >= .12;
    const enter = next && !this.visible;
    const exit = !next && this.visible;
    if (enter || exit) this.revision++;
    this.visible = next;
    return { visible: next, enter, exit, revision: this.revision };
  }
  isCurrent(revision) { return this.visible && this.revision === revision; }
}
