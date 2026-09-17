import { DemoTimeline, RevealCycle, scrambleText } from './motion.mjs';

const preference = matchMedia('(prefers-reduced-motion: reduce)');
const demo = document.querySelector('.demo');
const timeline = new DemoTimeline({ reducedMotion: preference.matches });
const cursor = document.querySelector('.demo-cursor');
const caption = document.querySelector('.demo-caption');
const captions = {
  launch: 'Launch VeDock. Make yourself at home.',
  'launch-open': 'Your accounts, data, and work — in one place.',
  'd1-select': 'D1 / Open a table. See your data in context.',
  'd1-edit': 'D1 / Edit a value. Your change is staged, not yet written.',
  'd1-review': 'D1 / Review the change and check original values before committing.',
  'd1-done': 'D1 / Change applied. Back to your work.',
  'r2-drop': 'R2 / Drop your files into the right bucket and folder.',
  'r2-upload': 'R2 / Watch the progress. Keep track of every upload in Jobs.',
  'r2-done': 'R2 / Upload complete. Recorded in your job history.',
  'logs-connect': 'Workers / Open a live log stream for your Worker.',
  'logs-live': 'Workers / Follow requests and console logs as they arrive.',
};
let animation = null;
let lastTime = null;
let previousPhase = '';
let visible = false;

function render() {
  const frame = timeline.frame;
  demo.dataset.playing = String(timeline.playing);
  demo.dataset.chapter = frame.chapter;
  if (frame.phase !== previousPhase) {
    demo.dataset.phase = frame.phase;
    caption.textContent = captions[frame.phase];
    previousPhase = frame.phase;
  }
  demo.style.setProperty('--upload', `${frame.upload * 100}%`);
  cursor.style.left = `${frame.cursor.x}%`;
  cursor.style.top = `${frame.cursor.y}%`;
  cursor.classList.toggle('is-clicking', frame.click);
  document.querySelector('.upload-percent').textContent = `${Math.round(frame.upload * 100)}%`;
  document.querySelector('.file-status').textContent = frame.upload >= 1 ? '✓ Done' : 'Uploading';
  document.querySelectorAll('.log-lines > div').forEach((row, i) => {
    row.style.opacity = frame.logCount > i ? '1' : '0';
    row.style.transform = frame.logCount > i ? 'none' : 'translateY(7px)';
  });
}
function loop(now) {
  animation = null;
  if (lastTime !== null) timeline.tick(Math.min(now - lastTime, 100));
  lastTime = now;
  render();
  if (timeline.playing) animation = requestAnimationFrame(loop);
}
function sync() {
  timeline.setVisibility(visible, document.hidden);
  if (animation !== null) cancelAnimationFrame(animation);
  animation = null;
  lastTime = null;
  render();
  if (timeline.playing) animation = requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', sync);
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .15 }).observe(demo);
preference.addEventListener('change', () => {
  timeline.setReducedMotion(preference.matches);
  sync();
});

const headingRuns = new Map();
function resetHeading(element) {
  const run = headingRuns.get(element);
  if (!run) return;
  headingRuns.delete(element);
  if (run.raf !== null) cancelAnimationFrame(run.raf);
  element.replaceChildren(...run.source.childNodes);
  element.classList.remove('scrambling');
}
function resolveHeading(element, cycle, revision) {
  resetHeading(element);
  if (preference.matches) return;
  const original = element.innerText;
  const source = document.createElement('span');
  source.className = 'scramble-source';
  while (element.firstChild) source.append(element.firstChild);
  const visual = document.createElement('span');
  visual.className = 'scramble-visual';
  visual.setAttribute('aria-hidden', 'true');
  element.append(source, visual);
  element.classList.add('scrambling');
  const run = { source, raf: null };
  headingRuns.set(element, run);
  const start = performance.now();
  function update(now) {
    if (headingRuns.get(element) !== run) return;
    run.raf = null;
    if (!cycle.isCurrent(revision) || preference.matches || document.hidden) { resetHeading(element); return; }
    const progress = Math.min((now - start) / 1050, 1);
    visual.textContent = scrambleText(original, progress);
    if (progress < 1) run.raf = requestAnimationFrame(update);
    else resetHeading(element);
  }
  run.raf = requestAnimationFrame(update);
}
const revealCycles = new WeakMap();
const reveal = new IntersectionObserver(entries => {
  for (const { target, intersectionRatio } of entries) {
    const cycle = revealCycles.get(target);
    const state = cycle.update(intersectionRatio);
    target.classList.toggle('is-visible', state.visible);
    if (state.exit) resetHeading(target);
    if (state.enter && target.matches('[data-scramble]')) resolveHeading(target, cycle, state.revision);
  }
}, { threshold: [0, .12] });
document.querySelectorAll('.reveal, [data-scramble]').forEach(element => {
  revealCycles.set(element, new RevealCycle());
  reveal.observe(element);
});
preference.addEventListener('change', () => { if (preference.matches) [...headingRuns.keys()].forEach(resetHeading); });
if (!preference.matches) document.documentElement.classList.add('js-motion');
if (preference.matches) timeline.seek('d1');
demo.classList.add('enhanced');
sync();

// Decorative diagrams suspend offscreen, just like the cinematic walkthrough.
const scenes = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) target.classList.toggle('motion-active', isIntersecting);
}, { threshold: .15 });
document.querySelectorAll('.motion-scene').forEach(scene => scenes.observe(scene));
function suspendDecorations() { document.documentElement.classList.toggle('document-hidden', document.hidden); }
document.addEventListener('visibilitychange', suspendDecorations);
suspendDecorations();
preference.addEventListener('change', () => document.documentElement.classList.toggle('js-motion', !preference.matches));
if (matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('[data-depth]').forEach(scene => {
    let pending = null;
    scene.addEventListener('pointermove', event => {
      if (preference.matches || !scene.classList.contains('motion-active')) return;
      const rect = scene.getBoundingClientRect();
      const x = (event.clientY - rect.top) / rect.height - .5;
      const y = (event.clientX - rect.left) / rect.width - .5;
      if (pending !== null) cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        scene.style.setProperty('--depth-x', `${-x * 4}deg`);
        scene.style.setProperty('--depth-y', `${y * 5}deg`);
        pending = null;
      });
    });
    scene.addEventListener('pointerleave', () => {
      if (pending !== null) cancelAnimationFrame(pending);
      pending = null;
      scene.style.setProperty('--depth-x', '0deg');
      scene.style.setProperty('--depth-y', '0deg');
    });
  });
}
