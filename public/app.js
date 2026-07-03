const DAY_MS = 86_400_000;

const fonts = {
  sans: 'Inter, Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", system-ui, sans-serif',
  rounded: '"Arial Rounded MT Bold", "NanumSquareRound", Pretendard, system-ui, sans-serif',
  serif: 'Georgia, "Noto Serif KR", "Batang", serif',
  mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
};

const defaultDate = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return toDateInput(date);
})();

const defaults = {
  date: defaultDate,
  title: '',
  prefix: 'D',
  suffix: '일',
  tail: '',
  today: 'DAY',
  font: 'sans',
  size: '64',
  weight: '700',
  spacing: '0',
  align: 'center',
  bg: '#1e1e1e',
  fg: '#e0ffff',
  transparent: '0',
  shadow: '0',
  radius: '24',
};

const legacyKeys = {
  목표일: 'date',
  크기: 'size',
  굵기: 'weight',
  접미사: 'suffix',
  머리말: 'prefix',
  꼬리말: 'tail',
  간격: 'spacing',
  배경색: 'bg',
  글자색: 'fg',
};

const form = document.querySelector('#settingsForm');
const controls = Object.fromEntries(
  [...form.elements]
    .filter((element) => element.name && element.type !== 'radio')
    .map((element) => [element.name, element])
);
const widgetFrames = [document.querySelector('#widgetFrame'), document.querySelector('#embedWidgetFrame')];
const widgetTitles = [document.querySelector('#widgetTitle'), document.querySelector('#embedWidgetTitle')];
const widgetCounts = [document.querySelector('#widgetCount'), document.querySelector('#embedWidgetCount')];
const outputs = {
  size: document.querySelector('#sizeOutput'),
  weight: document.querySelector('#weightOutput'),
  spacing: document.querySelector('#spacingOutput'),
  radius: document.querySelector('#radiusOutput'),
};
const toast = document.querySelector('#toast');
let toastTimer;

const isEmbedded = new URLSearchParams(location.search).get('embed') === '1' || window.self !== window.top;
document.body.classList.toggle('embed-mode', isEmbedded);

const state = readState();
hydrateForm(state);
render(state);

form.addEventListener('input', updateFromForm);
form.addEventListener('change', updateFromForm);

document.querySelector('#copyButton').addEventListener('click', () => copyText(editorUrl(), '편집 가능한 링크를 복사했습니다.'));
document.querySelector('#copyEmbedButton').addEventListener('click', () => copyText(widgetUrl(), '임베드 전용 링크를 복사했습니다.'));
document.querySelector('#openWidgetButton').addEventListener('click', () => window.open(widgetUrl(), '_blank', 'noopener,noreferrer'));
document.querySelector('#resetButton').addEventListener('click', () => {
  hydrateForm(defaults);
  updateFromForm();
  showToast('기본 설정으로 되돌렸습니다.');
});

setInterval(() => render(readForm()), 60_000);

function readState() {
  const params = new URLSearchParams(location.search);
  const next = { ...defaults };

  for (const [key, value] of params) {
    const normalizedKey = legacyKeys[key] || key;
    if (normalizedKey in next) next[normalizedKey] = normalizeParam(normalizedKey, value);
  }

  return sanitize(next);
}

function normalizeParam(key, value) {
  if (key === 'date' && /^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
}

function sanitize(value) {
  const safe = { ...defaults, ...value };
  safe.size = clampNumber(safe.size, 16, 160, defaults.size);
  safe.weight = clampStep(safe.weight, 100, 900, 100, defaults.weight);
  safe.spacing = clampNumber(safe.spacing, -3, 20, defaults.spacing);
  safe.radius = clampNumber(safe.radius, 0, 48, defaults.radius);
  safe.font = fonts[safe.font] ? safe.font : defaults.font;
  safe.align = ['left', 'center', 'right'].includes(safe.align) ? safe.align : defaults.align;
  safe.bg = validCssColor(safe.bg) ? toHexColor(safe.bg) : defaults.bg;
  safe.fg = validCssColor(safe.fg) ? toHexColor(safe.fg) : defaults.fg;
  safe.transparent = safe.transparent === '1' ? '1' : '0';
  safe.shadow = safe.shadow === '1' ? '1' : '0';
  safe.date = /^\d{4}-\d{2}-\d{2}$/.test(safe.date) ? safe.date : defaultDate;
  return safe;
}

function hydrateForm(value) {
  const safe = sanitize(value);
  for (const [name, input] of Object.entries(controls)) {
    if (input.type === 'checkbox') input.checked = safe[name] === '1';
    else input.value = safe[name];
  }
  const alignInput = form.querySelector(`input[name="align"][value="${safe.align}"]`);
  if (alignInput) alignInput.checked = true;
}

function readForm() {
  const data = new FormData(form);
  const value = { ...defaults };
  for (const [key, entry] of data) value[key] = String(entry);
  value.transparent = document.querySelector('#transparent').checked ? '1' : '0';
  value.shadow = document.querySelector('#textShadow').checked ? '1' : '0';
  return sanitize(value);
}

function updateFromForm() {
  const value = readForm();
  render(value);
  updateEditorUrl(value);
}

function render(value) {
  const count = countdownText(value);
  widgetTitles.forEach((element) => { element.textContent = value.title; });
  widgetCounts.forEach((element) => { element.textContent = count; });

  widgetFrames.forEach((frame) => {
    frame.style.setProperty('--widget-bg', value.bg);
    frame.style.setProperty('--widget-fg', value.fg);
    frame.style.setProperty('--widget-size', `${value.size}px`);
    frame.style.setProperty('--widget-weight', value.weight);
    frame.style.setProperty('--widget-spacing', `${value.spacing}px`);
    frame.style.setProperty('--widget-radius', `${value.radius}px`);
    frame.style.setProperty('--widget-align', value.align);
    frame.style.setProperty('--widget-font', fonts[value.font]);
    frame.classList.toggle('is-transparent', value.transparent === '1');
    frame.classList.toggle('has-shadow', value.shadow === '1');
  });

  outputs.size.textContent = `${value.size}px`;
  outputs.weight.textContent = value.weight;
  outputs.spacing.textContent = `${value.spacing}px`;
  outputs.radius.textContent = `${value.radius}px`;
  document.querySelector('#bgValue').textContent = value.bg;
  document.querySelector('#fgValue').textContent = value.fg;
}

function countdownText(value) {
  const [year, month, day] = value.date.split('-').map(Number);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(year, month - 1, day);
  const difference = Math.round((targetUtc - todayUtc) / DAY_MS);

  if (difference === 0) return `${value.prefix}-${value.today}${value.tail}`;
  const sign = difference > 0 ? '-' : '+';
  return `${value.prefix}${sign}${Math.abs(difference)}${value.suffix}${value.tail}`;
}

function updateEditorUrl(value) {
  if (isEmbedded) return;
  const url = new URL(location.href);
  url.search = makeParams(value).toString();
  history.replaceState(null, '', url);
}

function makeParams(value) {
  const params = new URLSearchParams();
  for (const [key, item] of Object.entries(value)) {
    if (item !== defaults[key] || ['date', 'prefix', 'suffix', 'bg', 'fg'].includes(key)) params.set(key, item);
  }
  return params;
}

function widgetUrl() {
  const url = new URL(editorUrl());
  const params = makeParams(readForm());
  params.set('embed', '1');
  url.search = params.toString();
  url.hash = '';
  return url.toString();
}

function editorUrl() {
  const url = new URL(location.href);
  url.search = makeParams(readForm()).toString();
  url.hash = '';
  return url.toString();
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  showToast(successMessage);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function validCssColor(value) {
  const element = document.createElement('span');
  element.style.color = '';
  element.style.color = value;
  return element.style.color !== '';
}

function toHexColor(value) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.fillStyle = value;
  const normalized = context.fillStyle;
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(normalized)) {
    return `#${[...normalized.slice(1)].map((char) => char + char).join('')}`.toLowerCase();
  }
  return value;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.min(max, Math.max(min, number))) : fallback;
}

function clampStep(value, min, max, step, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return String(Math.min(max, Math.max(min, Math.round(number / step) * step)));
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
