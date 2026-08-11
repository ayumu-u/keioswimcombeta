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

// ---- ファーストビューの固定スクロール演出 ----
const hs = document.getElementById('heroSticky');

if (hs) {
  const track  = hs.querySelector('.hs-track');
  const slides = [...hs.querySelectorAll('.hs-slide')];
  const dots   = [...hs.querySelectorAll('.hs-dots span')];
  const scrollHint = hs.querySelector('.hs-scroll');
  let current = -1;

  const show = (i) => {
    if (i === current) return;
    current = i;
    slides.forEach((s, n) => s.classList.toggle('is-active', n === i));
    dots.forEach((d, n) => d.classList.toggle('is-on', n === i));
    // 最後のステップではスクロール指示を消す
    if (scrollHint) scrollHint.style.opacity = i >= slides.length - 1 ? '0' : '';
  };

  const update = () => {
    const rect = track.getBoundingClientRect();
    // 固定されている間の進捗（0〜1）
    const total = rect.height - window.innerHeight;
    const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
    // 進捗を等分してステップに割り当てる
    show(Math.min(Math.floor(progress * slides.length), slides.length - 1));
  };

  // rAF を挟むと非表示タブで取りこぼすため、軽い処理をそのまま実行する
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
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

// ---- 紹介動画（押されてから YouTube を読み込む） ----
document.querySelectorAll('.vplayer').forEach((btn) => {
  btn.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    // nocookie 版を使い、再生するまでクッキーを置かない
    frame.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.video
      + '?autoplay=1&rel=0&playsinline=1';
    frame.title = btn.querySelector('.vp-title').textContent;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    frame.allowFullscreen = true;
    btn.replaceWith(frame);
    frame.focus();
  });
});
