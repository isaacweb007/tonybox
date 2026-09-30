// 사이트 공용(랜딩·이용 가이드): 10개 언어 전환 + 메뉴·다운로드·나타나기.
// 한국어는 HTML에 쓰인 글이 원문이고, 나머지 9개 언어는 i18n/<code>.json(키 = data-t).
export const LANGS = [
  ['ko', '한국어'], ['en', 'English'], ['ja', '日本語'], ['zh', '简体中文'], ['vi', 'Tiếng Việt'],
  ['es', 'Español'], ['la', 'Latina'], ['ar', 'العربية'], ['hi', 'हिन्दी'], ['id', 'Bahasa Indonesia'],
];
const V = 10; // 번역 파일을 고치면 올린다(GitHub Pages 캐시)
// 공개 저장소 isaacweb007/tonybox 의 Releases '항상 최신' 설치 파일(이름은 버전 없이 TonyFileBox-Setup.pkg)
export const DOWNLOAD_URL = 'https://github.com/isaacweb007/tonybox/releases/latest/download/TonyFileBox-Setup.pkg';
// Pro 구매: Polar 체크아웃 링크 — 결제를 붙일 때 채운다(docs/…/2026-09-29-monetization-design.md). 비어 있으면 '곧 판매 시작'
export const CHECKOUT_URL = '';
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const KO = {};
document.querySelectorAll('[data-t]').forEach((el) => { KO[el.dataset.t] = el.innerHTML; });
const cache = { ko: KO };
export let lang = 'ko';
let dict = KO;
export const t = (k) => dict[k] ?? KO[k] ?? k;

function pick() {
  let saved = null;
  try { saved = localStorage.getItem('tfb-lang'); } catch (err) { /* 저장 불가 */ }
  const codes = LANGS.map(([c]) => c);
  if (codes.includes(saved)) return saved;
  for (const l of navigator.languages || [navigator.language]) {
    const c = String(l).toLowerCase().split('-')[0];
    if (codes.includes(c)) return c;
  }
  return 'en';
}

export async function setLang(code, save) {
  if (!cache[code]) {
    try { cache[code] = await (await fetch(`i18n/${code}.json?v=${V}`)).json(); } catch (err) { code = 'ko'; }
  }
  lang = code;
  dict = cache[code];
  if (save) { try { localStorage.setItem('tfb-lang', code); } catch (err) { /* 저장 불가 */ } }
  document.documentElement.lang = code;
  document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach((el) => { el.innerHTML = t(el.dataset.t); });
  document.querySelectorAll('select.langpick').forEach((s) => { s.value = code; });
  document.dispatchEvent(new CustomEvent('lang', { detail: code }));
}

// 언어 고르기(메뉴의 지구본)
document.querySelectorAll('select.langpick').forEach((s) => {
  s.innerHTML = LANGS.map(([c, name]) => `<option value="${c}">${name}</option>`).join('');
  s.addEventListener('change', () => setLang(s.value, true));
});
document.addEventListener('click', (e) => {
  const code = e.target.closest('[data-lang]')?.dataset.lang;
  if (code) setLang(code, true);
});

// 메뉴: 스크롤하면 불투명
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('solid', scrollY > 30);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 다운로드 버튼. 아이폰·아이패드면 '맥에서 받도록 링크 복사'
document.querySelectorAll('.download').forEach((a) => { a.href = DOWNLOAD_URL; });
document.querySelectorAll('.buy').forEach((a) => {
  if (!CHECKOUT_URL) return;
  Object.assign(a, { href: CHECKOUT_URL, target: '_blank', rel: 'noopener' });
  a.removeAttribute('aria-disabled');
  a.querySelector('[data-t="pc_buy"]').hidden = false;
  a.querySelector('[data-t="pc_soon"]').hidden = true;
});
if (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) document.body.classList.add('ios');
document.querySelectorAll('.copylink').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); b.querySelector('span').innerHTML = t('cp_done'); } catch (err) { /* 복사 불가 */ }
}));

// 스크롤하면 부드럽게 나타나기
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('on');
  e.target.dispatchEvent(new Event('shown'));
  io.unobserve(e.target);
}), { threshold: .15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// 버전: releases.json 하나가 기준 — 랜딩의 버전 표시·업데이트 소식 페이지·앱의 새 버전 확인이 모두 이 파일을 본다
export const releases = fetch('releases.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => null);
releases.then((r) => {
  const cur = r?.releases.find((x) => x.version === r.latest);
  if (cur) document.querySelectorAll('[data-ver]').forEach((el) => { el.textContent = `v${cur.version} · ${cur.date}`; el.hidden = false; });
});

export const start = () => setLang(pick());
