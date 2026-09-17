import { DemoTimeline, DURATION, scrambleText } from './motion.mjs';

const preference = matchMedia('(prefers-reduced-motion: reduce)');
const demo = document.querySelector('.demo');
const timeline = new DemoTimeline({ reducedMotion: preference.matches });
const play = document.querySelector('[data-play]');
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
  demo.style.setProperty('--progress', `${frame.progress * 100}%`);
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
  document.querySelector('.demo-time').textContent = `00:${String(Math.floor(frame.elapsed / 1000)).padStart(2, '0')} / 00:${DURATION / 1000}`;
  document.querySelectorAll('[data-seek]').forEach(button => button.setAttribute('aria-current', String(button.dataset.seek === frame.chapter)));
  play.textContent = timeline.userPaused ? '▷' : 'Ⅱ';
  play.setAttribute('aria-label', timeline.userPaused ? 'Resume demo' : 'Pause demo');
  play.setAttribute('aria-pressed', String(timeline.userPaused));
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
play.addEventListener('click', () => { timeline.userPaused ? timeline.play() : timeline.pause(); sync(); });
document.querySelector('[data-replay]').addEventListener('click', () => { timeline.replay(); sync(); });
document.querySelectorAll('[data-seek]').forEach(button => button.addEventListener('click', () => { timeline.seek(button.dataset.seek); sync(); }));
document.querySelectorAll('[data-jump]').forEach(link => link.addEventListener('click', () => { timeline.seek(link.dataset.jump); sync(); }));
document.addEventListener('visibilitychange', sync);
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .15 }).observe(demo);
preference.addEventListener('change', () => {
  timeline.reducedMotion = preference.matches;
  if (preference.matches) { timeline.pause(); timeline.seek('d1'); }
  play.hidden = preference.matches;
  sync();
});

function resolveHeading(element) {
  if (preference.matches || element.dataset.resolved) return;
  element.dataset.resolved = 'true';
  const original = element.innerText;
  const source = document.createElement('span');
  source.className = 'scramble-source';
  while (element.firstChild) source.append(element.firstChild);
  const visual = document.createElement('span');
  visual.className = 'scramble-visual';
  visual.setAttribute('aria-hidden', 'true');
  element.append(source, visual);
  element.classList.add('scrambling');
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / 1050, 1);
    visual.textContent = scrambleText(original, progress);
    if (progress < 1 && !preference.matches && !document.hidden) requestAnimationFrame(update);
    else { element.replaceChildren(...source.childNodes); element.classList.remove('scrambling'); }
  }
  requestAnimationFrame(update);
}
const reveal = new IntersectionObserver(entries => {
  entries.filter(entry => entry.isIntersecting).forEach(({ target }) => {
    target.classList.add('is-visible');
    if (target.matches('[data-scramble]')) resolveHeading(target);
    target.querySelectorAll('[data-scramble]').forEach(resolveHeading);
    reveal.unobserve(target);
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal, [data-scramble]').forEach(element => reveal.observe(element));
if (!preference.matches) document.documentElement.classList.add('js-motion');
if (preference.matches) timeline.seek('d1');
play.hidden = preference.matches;
demo.classList.add('enhanced');
document.querySelector('.demo-controls').hidden = false;
sync();
