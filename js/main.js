// ---- モバイルメニュー ----
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

const closeNav = () => {
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'メニューを開く');
};

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeNav);
});

// ---- 合格体験記のアコーディオン ----
document.querySelectorAll('.itv-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const article = btn.closest('.itv');
    const open = article.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '閉じる' : '体験記を読む';

    // 閉じたときに証書の先頭が画面外にならないよう戻す
    if (!open) {
      const top = article.getBoundingClientRect().top;
      if (top < 0) article.scrollIntoView({ block: 'start' });
    }
  });
});

// ---- スマホ用 固定CTA（ヒーローを過ぎてから、フッター手前まで表示） ----
const stickyCta = document.getElementById('stickyCta');
const hero = document.querySelector('.hero, .page-head');
const footer = document.querySelector('.site-footer');

if (stickyCta && hero && footer && 'IntersectionObserver' in window) {
  let pastHero = false;
  let atFooter = false;

  const applySticky = () => {
    // フッターには同じ導線があるので、そこまで来たら引っ込める
    const show = pastHero && !atFooter;
    stickyCta.classList.toggle('is-shown', show);
    stickyCta.setAttribute('aria-hidden', String(!show));
  };

  new IntersectionObserver(([entry]) => {
    pastHero = !entry.isIntersecting;
    applySticky();
  }).observe(hero);

  new IntersectionObserver(([entry]) => {
    atFooter = entry.isIntersecting;
    applySticky();
  }).observe(footer);
}

// ---- スクロールで表示 ----
const targets = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  targets.forEach((el) => observer.observe(el));
} else {
  targets.forEach((el) => el.classList.add('is-visible'));
}
