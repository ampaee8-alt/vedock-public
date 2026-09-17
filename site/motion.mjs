export const CHAPTERS = Object.freeze([
  { id: 'launch', label: 'Launch', start: 0 },
  { id: 'd1', label: 'D1 · Edit & review', start: 2000 },
  { id: 'r2', label: 'R2 · Upload', start: 17000 },
  { id: 'logs', label: 'Workers · Live logs', start: 30000 },
]);
export const DURATION = 42000;
const phases = [
  [0, 'launch', 51, 46], [700, 'launch-open', 51, 46],
  [2000, 'd1-select', 14, 31], [5000, 'd1-edit', 69, 42],
  [10000, 'd1-review', 85, 19], [15000, 'd1-done', 75, 73],
  [17000, 'r2-drop', 14, 40], [21000, 'r2-upload', 68, 56],
  [27000, 'r2-done', 79, 74], [30000, 'logs-connect', 14, 50],
  [33000, 'logs-live', 79, 22],
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
      click: phase === 'launch' ? this.elapsed > 450 && this.elapsed < 650 : this.elapsed - start > 1150 && this.elapsed - start < 1600,
      upload: Math.min(Math.max((this.elapsed - 21000) / 5700, 0), 1),
      logCount: Math.min(Math.max(Math.floor((this.elapsed - 33000) / 650) + 1, 0), 7),
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
