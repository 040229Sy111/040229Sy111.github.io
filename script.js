(() => {
  'use strict';

  const TAB_IDS = ['home', 'about', 'work', 'price'];
  const TAB_TITLES = {
    home: '苏沐秋 · 视觉表现工作室｜室内效果图与空间表现',
    about: '关于我｜苏沐秋 · 室内效果图设计',
    work: '案例展示｜苏沐秋 · 室内效果图与全景',
    price: '接单价格明细｜苏沐秋 · 室内效果图报价'
  };

  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const panels = TAB_IDS.reduce((acc, id) => {
    acc[id] = document.getElementById(id);
    return acc;
  }, {});
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- reveal ---------------- */
  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' })
    : null;

  function observeReveals(scope) {
    const nodes = scope.querySelectorAll('.reveal:not(.is-in)');
    if (!revealObserver) {
      nodes.forEach((node) => node.classList.add('is-in'));
      return;
    }
    nodes.forEach((node) => revealObserver.observe(node));
  }

  /* ---------------- tabs ---------------- */
  function setTab(id, { scroll = true, updateHash = true } = {}) {
    if (!TAB_IDS.includes(id)) id = 'home';

    TAB_IDS.forEach((key) => {
      const panel = panels[key];
      const link = document.querySelector(`.nav-link[data-tab="${key}"]`);
      const active = key === id;

      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
      if (link) {
        link.classList.toggle('is-active', active);
        link.setAttribute('aria-selected', String(active));
        link.tabIndex = active ? 0 : -1;
      }
    });

    if (updateHash && window.location.hash !== `#${id}`) {
      window.history.replaceState(null, '', `#${id}`);
    }
    document.title = TAB_TITLES[id];

    if (scroll) window.scrollTo(0, 0);
    observeReveals(panels[id]);
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => setTab(link.dataset.tab));
  });

  document.querySelectorAll('[data-tab-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      setTab(link.dataset.tabLink);
    });
  });

  document.querySelector('.nav')?.addEventListener('keydown', (event) => {
    const currentIndex = navLinks.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    const keys = {
      ArrowRight: currentIndex + 1,
      ArrowLeft: currentIndex - 1,
      Home: 0,
      End: navLinks.length - 1
    };
    if (!(event.key in keys)) return;

    event.preventDefault();
    const nextIndex = (keys[event.key] + navLinks.length) % navLinks.length;
    navLinks[nextIndex].focus();
    setTab(navLinks[nextIndex].dataset.tab);
  });

  window.addEventListener('hashchange', () => {
    const id = window.location.hash.replace('#', '');
    if (TAB_IDS.includes(id)) setTab(id, { updateHash: false });
  });

  /* ---------------- case modal ---------------- */
  const workCards = Array.from(document.querySelectorAll('.work-card'));
  const modal = document.getElementById('caseModal');
  const modalImg = document.getElementById('modalImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalCat = document.getElementById('modalCat');
  const modalDesc = document.getElementById('modalDesc');
  const modalMeta = document.getElementById('modalMeta');
  const modalClose = modal.querySelector('.modal-close');
  let lastFocused = null;

  function openCase(card) {
    const thumb = card.querySelector('img');
    lastFocused = card;

    modalImg.src = thumb.src;
    modalImg.alt = thumb.alt || '';
    modalTitle.textContent = card.dataset.title || '';
    modalCat.textContent = `${card.dataset.catLabel || ''} / ${card.dataset.year || ''}`;
    modalDesc.textContent = card.dataset.desc || '';

    modalMeta.innerHTML = '';
    (card.dataset.scope || '').split('|').filter(Boolean).forEach((item) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = 'SCOPE';
      dd.textContent = item;
      row.append(dt, dd);
      modalMeta.append(row);
    });

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeCase() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  workCards.forEach((card) => {
    card.addEventListener('click', () => openCase(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCase(card);
      }
    });
  });

  modal.querySelectorAll('[data-close]').forEach((element) => {
    element.addEventListener('click', closeCase);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeCase();
    if (event.key === 'Tab' && modal.classList.contains('is-open')) {
      const focusables = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------------- copy wechat + toast ---------------- */
  const WECHAT_ID = 'Smq4144049320';
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const field = document.createElement('textarea');
      field.value = text;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (error) {
        reject(error);
      } finally {
        field.remove();
      }
    });
  }

  document.querySelectorAll('[data-copy-wechat]').forEach((button) => {
    button.addEventListener('click', () => {
      copyText(WECHAT_ID)
        .then(() => showToast(`微信号已复制：${WECHAT_ID}`))
        .catch(() => showToast(`微信号：${WECHAT_ID}`));
    });
  });

  /* ---------------- scroll state ---------------- */
  const progressBar = document.getElementById('progressBar');
  const header = document.getElementById('siteHeader');
  const toTop = document.getElementById('toTop');

  function onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? Math.min(scrollTop / height, 1) : 0;

    progressBar.style.width = `${progress * 100}%`;
    header.classList.toggle('is-scrolled', scrollTop > 8);
    toTop.hidden = scrollTop < 320;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });

  /* ---------------- init ---------------- */
  const initialTab = TAB_IDS.includes(window.location.hash.replace('#', ''))
    ? window.location.hash.replace('#', '')
    : 'home';
  setTab(initialTab, { scroll: false, updateHash: false });
  document.getElementById('year').textContent = new Date().getFullYear();
  onScroll();

  // 首屏图片加载完成后再检查一次可见性
  window.addEventListener('load', () => {
    observeReveals(panels[initialTab]);
    onScroll();
  });
})();
