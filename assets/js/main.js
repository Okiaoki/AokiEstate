/* ============================================================
   Aoki Estate — main.js
   Vanilla JS / IIFE
   ============================================================ */
(function () {
  'use strict';

  /* ── Utility ── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. Scroll Reveal (IntersectionObserver)
     ============================================================ */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;

    if (prefersReducedMotion()) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     2. Header Scroll Effect
     ============================================================ */
  function initHeaderScroll() {
    const header = $('.header');
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     3. Mobile Drawer Menu
     ============================================================ */
  function initDrawer() {
    const hamburger = $('.header__hamburger');
    const drawer = $('.drawer');
    const overlay = $('.drawer-overlay');
    if (!hamburger || !drawer) return;

    function open() {
      hamburger.classList.add('is-active');
      drawer.classList.add('is-open');
      if (overlay) overlay.classList.add('is-visible');
      document.body.classList.add('menu-open');
      hamburger.setAttribute('aria-expanded', 'true');
    }

    function close() {
      hamburger.classList.remove('is-active');
      drawer.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
      document.body.classList.remove('menu-open');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    hamburger.addEventListener('click', () => {
      drawer.classList.contains('is-open') ? close() : open();
    });

    if (overlay) overlay.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });

    /* Close on link click inside drawer */
    $$('a', drawer).forEach((link) => {
      link.addEventListener('click', close);
    });
  }

  /* ============================================================
     4. Navigation Dropdown
     ============================================================ */
  function initDropdown() {
    const items = $$('.header__nav-item--dropdown');
    items.forEach((item) => {
      const link = $('a', item) || $('button', item);
      if (!link) return;

      link.addEventListener('click', (e) => {
        /* Only toggle on mobile or if keyboard */
        if (window.innerWidth < 768) {
          e.preventDefault();
          item.classList.toggle('is-open');
        }
      });

      /* Keyboard */
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.classList.toggle('is-open');
        }
      });

      /* Close when clicking outside */
      document.addEventListener('click', (e) => {
        if (!item.contains(e.target)) {
          item.classList.remove('is-open');
        }
      });
    });
  }

  /* ============================================================
     5. Property Filtering (rent.html / buy.html)
     ============================================================ */
  function initFiltering() {
    const cards = $$('.property-card[data-area]');
    if (!cards.length) return;

    const sidebar = $('.sidebar') || $('.filter-modal');
    if (!sidebar) return;

    const countEl = $('.listing-header__count-num') || $('.listing-header__count strong');
    const emptyMsg = $('.listing-empty');

    function getFilterValues() {
      /* Area */
      const areas = $$('input[name="area"]:checked', sidebar).map((i) => i.value);
      /* Layout */
      const layouts = $$('input[name="layout"]:checked', sidebar).map((i) => i.value);
      /* Price range */
      const priceMin = parseInt($('select[name="price-min"]', sidebar)?.value) || 0;
      const priceMax = parseInt($('select[name="price-max"]', sidebar)?.value) || Infinity;
      /* Feature */
      const features = $$('input[name="feature"]:checked', sidebar).map((i) => i.value);

      return { areas, layouts, priceMin, priceMax, features };
    }

    function filterCards() {
      const f = getFilterValues();
      let visible = 0;

      cards.forEach((card) => {
        const area = card.dataset.area || '';
        const layout = card.dataset.layout || '';
        const price = parseInt(card.dataset.price) || 0;
        const feat = (card.dataset.feature || '').split(',').map((s) => s.trim());

        let show = true;
        if (f.areas.length && !f.areas.includes(area)) show = false;
        if (f.layouts.length && !f.layouts.includes(layout)) show = false;
        if (price < f.priceMin || price > f.priceMax) show = false;
        if (f.features.length && !f.features.every((fv) => feat.includes(fv))) show = false;

        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });

      if (countEl) countEl.textContent = visible;
      if (emptyMsg) {
        emptyMsg.classList.toggle('is-visible', visible === 0);
      }
    }

    /* Listen to changes */
    $$('input, select', sidebar).forEach((el) => {
      el.addEventListener('change', filterCards);
    });

    /* Initial */
    filterCards();
  }

  /* ============================================================
     6. Sorting
     ============================================================ */
  function initSorting() {
    const sortSelect = $('.listing-header__sort select');
    if (!sortSelect) return;

    const grid = $('.property-grid');
    if (!grid) return;

    sortSelect.addEventListener('change', () => {
      const cards = $$('.property-card', grid);
      const val = sortSelect.value;

      cards.sort((a, b) => {
        const pa = parseInt(a.dataset.price) || 0;
        const pb = parseInt(b.dataset.price) || 0;
        const da = parseInt(a.dataset.date) || 0;
        const db = parseInt(b.dataset.date) || 0;
        const sa = parseFloat(a.dataset.size) || 0;
        const sb = parseFloat(b.dataset.size) || 0;

        switch (val) {
          case 'price-asc':  return pa - pb;
          case 'price-desc': return pb - pa;
          case 'date-desc':  return db - da;
          case 'size-desc':  return sb - sa;
          default: return 0;
        }
      });

      cards.forEach((card) => grid.appendChild(card));
    });
  }

  /* ============================================================
     7. Property Gallery — EC風UI
     ============================================================ */
  function initGallery() {
    const mainContainer = $('.gallery__main');
    const mainImg = $('.gallery__main img');
    const thumbs = $$('.gallery__thumb');
    const counter = $('.gallery__counter');
    if (!mainImg || !thumbs.length) return;

    /* メイン画像 + サムネ全画像をひとつの配列にまとめる */
    const allImages = [
      { src: mainImg.src, alt: mainImg.alt }
    ];
    thumbs.forEach((t) => {
      allImages.push({
        src: t.dataset.src || $('img', t)?.src || '',
        alt: t.dataset.alt || $('img', t)?.alt || ''
      });
    });

    const total = allImages.length;
    let currentIndex = 0;

    function updateCounter() {
      if (counter) counter.textContent = (currentIndex + 1) + ' / ' + total;
    }

    function setMain(index) {
      currentIndex = ((index % total) + total) % total;
      mainImg.src = allImages[currentIndex].src;
      mainImg.alt = allImages[currentIndex].alt;

      /* サムネのアクティブ状態 (index 0=メイン写真なのでサムネは index-1) */
      thumbs.forEach((t, i) => t.classList.toggle('is-active', i === currentIndex - 1));

      /* アクティブサムネをスクロールで見える位置に */
      const activeThumb = thumbs[currentIndex - 1];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }

      updateCounter();
    }

    /* サムネクリック */
    thumbs.forEach((t, i) => {
      t.addEventListener('click', (e) => {
        e.stopPropagation();
        setMain(i + 1); /* +1 because index 0 is the original main image */
      });
    });

    /* メイン画像上の前後ナビ */
    const prevNav = $('.gallery__nav--prev', mainContainer);
    const nextNav = $('.gallery__nav--next', mainContainer);

    if (prevNav) {
      prevNav.addEventListener('click', (e) => {
        e.stopPropagation();
        setMain(currentIndex - 1);
      });
    }
    if (nextNav) {
      nextNav.addEventListener('click', (e) => {
        e.stopPropagation();
        setMain(currentIndex + 1);
      });
    }

    /* タッチスワイプ対応 */
    let touchStartX = 0;
    let touchEndX = 0;
    if (mainContainer) {
      mainContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      mainContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) setMain(currentIndex + 1);
          else setMain(currentIndex - 1);
        }
      }, { passive: true });
    }

    /* キーボードナビ（ギャラリーにフォーカス時） */
    document.addEventListener('keydown', (e) => {
      if ($('.gallery-modal.is-open')) return; /* モーダル時はモーダル側で処理 */
      if (e.key === 'ArrowLeft') setMain(currentIndex - 1);
      if (e.key === 'ArrowRight') setMain(currentIndex + 1);
    });

    /* 初期化 */
    updateCounter();

    /* ===== モーダル ===== */
    const modal = $('.gallery-modal');
    if (!modal) return;

    const modalImg = $('.gallery-modal__img', modal);
    const closeBtn = $('.gallery-modal__close', modal);
    const modalPrev = $('.gallery-modal__prev', modal) || $('.gallery-modal__nav--prev', modal);
    const modalNext = $('.gallery-modal__next', modal) || $('.gallery-modal__nav--next', modal);

    function openModal() {
      modal.classList.add('is-open');
      document.body.classList.add('menu-open');
      updateModalImg();
    }
    function closeModal() {
      modal.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    }
    function updateModalImg() {
      if (modalImg) {
        modalImg.src = allImages[currentIndex].src;
        modalImg.alt = allImages[currentIndex].alt;
      }
    }

    /* メイン画像クリックでモーダル（ナビボタン以外） */
    if (mainContainer) {
      mainContainer.addEventListener('click', (e) => {
        if (e.target.closest('.gallery__nav')) return;
        openModal();
      });
    }

    /* 閉じるボタン */
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });

    /* 背景（黒い部分）クリックで閉じる */
    modal.addEventListener('click', (e) => {
      /* 画像・ナビボタンのクリックは無視 */
      if (e.target === modal) closeModal();
    });

    /* モーダル内 前後ナビ */
    if (modalPrev) {
      modalPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        setMain(currentIndex - 1);
        updateModalImg();
      });
    }
    if (modalNext) {
      modalNext.addEventListener('click', (e) => {
        e.stopPropagation();
        setMain(currentIndex + 1);
        updateModalImg();
      });
    }

    /* モーダル内タッチスワイプ */
    let modalTouchStartX = 0;
    modal.addEventListener('touchstart', (e) => {
      modalTouchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    modal.addEventListener('touchend', (e) => {
      const diff = modalTouchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) { setMain(currentIndex + 1); }
        else { setMain(currentIndex - 1); }
        updateModalImg();
      }
    }, { passive: true });

    /* キーボード */
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') { setMain(currentIndex - 1); updateModalImg(); }
      if (e.key === 'ArrowRight') { setMain(currentIndex + 1); updateModalImg(); }
    });
  }

  /* ============================================================
     8. Mobile Filter Modal
     ============================================================ */
  function initFilterModal() {
    const openBtn = $('.mobile-filter-btn');
    const modal = $('.filter-modal');
    if (!openBtn || !modal) return;

    const closeBtn = $('.filter-modal__close', modal);
    const applyBtn = $('.filter-modal__apply', modal);

    openBtn.addEventListener('click', () => {
      modal.classList.add('is-open');
      document.body.classList.add('menu-open');
    });

    function close() {
      modal.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        /* Copy filter values from modal to sidebar (if both exist) */
        close();
        /* Trigger filtering */
        const sidebar = $('.sidebar');
        if (sidebar) {
          $$('input, select', modal).forEach((modalInput) => {
            const name = modalInput.name;
            if (!name) return;
            const sidebarInput = $(`[name="${name}"]`, sidebar);
            if (sidebarInput) {
              if (modalInput.type === 'checkbox' || modalInput.type === 'radio') {
                sidebarInput.checked = modalInput.checked;
              } else {
                sidebarInput.value = modalInput.value;
              }
            }
          });
          /* Trigger change on first input */
          const firstInput = $('input, select', sidebar);
          if (firstInput) firstInput.dispatchEvent(new Event('change'));
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  /* ============================================================
     9. Contact Form
     ============================================================ */
  function initForm() {
    const form = $('#contact-form');
    if (!form) return;

    const inputStep = $('.form-input-step', form);
    const confirmStep = $('.form-confirm', form);
    const completeStep = $('.form-complete');
    const confirmTable = $('.form-confirm__table tbody');
    const backBtn = $('.form-confirm__back');
    const submitBtn = $('.form-confirm__submit');

    /* Auto-fill property name from URL */
    const params = new URLSearchParams(window.location.search);
    const propertyName = params.get('property');
    if (propertyName) {
      const propField = $('input[name="property"]', form);
      if (propField) propField.value = decodeURIComponent(propertyName);
    }

    /* Validation rules */
    function validate() {
      let valid = true;
      const groups = $$('.form-group[data-required]', form);

      groups.forEach((group) => {
        const input = $('input, textarea, select', group);
        if (!input) return;

        let hasError = false;
        const rule = group.dataset.required;

        if (rule === 'true' && !input.value.trim()) {
          hasError = true;
        }
        if (rule === 'email' && input.value.trim()) {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(input.value.trim())) hasError = true;
        }
        if (rule === 'katakana' && input.value.trim()) {
          const kanaRe = /^[\u30A0-\u30FF\u3000\s]+$/;
          if (!kanaRe.test(input.value.trim())) hasError = true;
        }

        group.classList.toggle('has-error', hasError);
        if (hasError) valid = false;
      });

      return valid;
    }

    /* Show confirm step */
    const confirmBtn = $('.form-confirm-btn', form);
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!validate()) return;

        /* Build confirm table */
        if (confirmTable) {
          confirmTable.innerHTML = '';
          const labels = {
            'inquiry-type': 'お問い合わせ種別',
            'property': '物件名',
            'name': 'お名前',
            'furigana': 'フリガナ',
            'email': 'メールアドレス',
            'tel': '電話番号',
            'contact-method': 'ご希望の連絡方法',
            'message': 'メッセージ'
          };

          const data = new FormData(form);
          for (const [key, value] of data.entries()) {
            if (key === 'hp-field') continue; /* honeypot */
            const label = labels[key] || key;
            const tr = document.createElement('tr');
            tr.innerHTML = `<th>${label}</th><td>${escapeHTML(String(value))}</td>`;
            confirmTable.appendChild(tr);
          }
        }

        if (inputStep) inputStep.style.display = 'none';
        if (confirmStep) confirmStep.classList.add('is-active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* Back to edit */
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (inputStep) inputStep.style.display = '';
        if (confirmStep) confirmStep.classList.remove('is-active');
      });
    }

    /* Submit */
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();

        /* Check honeypot */
        const hp = $('input[name="hp-field"]', form);
        if (hp && hp.value) return;

        /* Formspree submit (or simulate) */
        const formData = new FormData(form);
        fetch(form.action || 'https://formspree.io/f/xxxxxx', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
          .then(() => {
            showComplete();
          })
          .catch(() => {
            /* Even on error, show complete for demo */
            showComplete();
          });
      });
    }

    function showComplete() {
      if (confirmStep) confirmStep.classList.remove('is-active');
      if (form) form.style.display = 'none';
      if (completeStep) completeStep.classList.add('is-active');
    }

    /* Real-time validation on blur */
    $$('.form-group[data-required] input, .form-group[data-required] textarea', form).forEach(
      (input) => {
        input.addEventListener('blur', () => {
          const group = input.closest('.form-group');
          if (!group) return;
          const rule = group.dataset.required;
          let hasError = false;

          if (rule === 'true' && !input.value.trim()) hasError = true;
          if (rule === 'email' && input.value.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) hasError = true;
          }
          if (rule === 'katakana' && input.value.trim()) {
            if (!/^[\u30A0-\u30FF\u3000\s]+$/.test(input.value.trim())) hasError = true;
          }

          group.classList.toggle('has-error', hasError);
        });
      }
    );
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ============================================================
     10. Recruit Accordion
     ============================================================ */
  function initAccordion() {
    const triggers = $$('.accordion__trigger');
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!isOpen));

        const body = trigger.nextElementSibling;
        if (body && body.classList.contains('accordion__body')) {
          if (isOpen) {
            body.hidden = true;
          } else {
            body.hidden = false;
          }
        }

        /* Also set on parent for CSS styling */
        const parent = trigger.closest('.accordion__item') || trigger.closest('.accordion');
        if (parent) parent.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }

  /* ============================================================
     11. Top Page Search Shortcut
     ============================================================ */
  function initSearchShortcut() {
    const section = $('.search-bar');
    if (!section) return;

    const tabs = $$('.search-bar__tab', section);
    let type = 'rent';

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        type = tab.dataset.tab || tab.dataset.type || 'rent';
      });
    });

    /* Handle form submit */
    const form = $('form', section);
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const area = $('select[name="area"]', form)?.value || '';
        const plan = $('select[name="plan"]', form)?.value || '';

        let url = type === 'buy' ? 'buy.html' : 'rent.html';
        const params = new URLSearchParams();
        if (area) params.set('area', area);
        if (plan) params.set('layout', plan);

        const qs = params.toString();
        if (qs) url += '?' + qs;
        window.location.href = url;
      });
    }
  }

  /* ============================================================
     Apply URL params to sidebar filters
     ============================================================ */
  function applyURLParams() {
    const params = new URLSearchParams(window.location.search);
    const sidebar = $('.sidebar');
    if (!sidebar) return;

    params.forEach((value, key) => {
      if (key === 'area') {
        const cb = $(`input[name="area"][value="${value}"]`, sidebar);
        if (cb) cb.checked = true;
      }
      if (key === 'layout') {
        const cb = $(`input[name="layout"][value="${value}"]`, sidebar);
        if (cb) cb.checked = true;
      }
    });
  }

  /* ============================================================
     Initialize
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initHeaderScroll();
    initDrawer();
    initDropdown();
    applyURLParams();
    initFiltering();
    initSorting();
    initGallery();
    initFilterModal();
    initForm();
    initAccordion();
    initSearchShortcut();
  });
})();
