/* Alvor Odonto: interações e animações de scroll */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu mobile ---------- */
  const toggle = $('#menuToggle'), menu = $('#menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  /* ---------- Dúvidas ---------- */
  $$('.faq__item button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      $$('.faq__item button').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      btn.setAttribute('aria-expanded', String(!open));
    });
  });

  /* ---------- Antes e depois ---------- */
  const smile = (after) => {
    const w = [62, 76, 92, 92, 76, 62], h = [150, 172, 192, 192, 172, 150];
    const rot = after ? [0, 0, 0, 0, 0, 0] : [7, -5, 4, -6, 3, -8];
    const dy = after ? [0, 0, 0, 0, 0, 0] : [10, -6, 8, 0, -10, 6];
    const gap = after ? 4 : 9;
    const total = w.reduce((a, b) => a + b, 0) + gap * 5;
    let x = (640 - total) / 2, teeth = '';
    w.forEach((tw, i) => {
      const cx = x + tw / 2, top = 112 + dy[i];
      teeth += `<rect x="${x}" y="${top}" width="${tw}" height="${h[i]}" rx="${tw * 0.32}" fill="url(#${after ? 'tA' : 'tB'})" transform="rotate(${rot[i]} ${cx} ${top + h[i] / 2})"/>`;
      x += tw + gap;
    });
    const stain = after ? '' : '<ellipse cx="300" cy="230" rx="16" ry="22" fill="#c9a968" opacity=".45"/><ellipse cx="392" cy="212" rx="12" ry="18" fill="#c9a968" opacity=".35"/>';
    return `<svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="tA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9eefb"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#f2f5fd"/></linearGradient>
        <linearGradient id="tB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8c189"/><stop offset=".6" stop-color="#efe1b4"/><stop offset="1" stop-color="#e3cf98"/></linearGradient>
        <radialGradient id="mouth" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#3a1a26"/><stop offset="1" stop-color="#12060c"/></radialGradient>
      </defs>
      <rect width="640" height="400" fill="url(#mouth)"/>
      ${teeth}${stain}
      <path d="M0 0h640v118q-320 44-640 0z" fill="#e59aa6"/>
      <path d="M0 118q320 44 640 0v14q-320 40-640 0z" fill="#d07f8e" opacity=".55"/>
      <path d="M0 400h640v-30q-320-56-640 0z" fill="#d98a98"/>
    </svg>`;
  };
  $$('[data-smile]').forEach((el) => { el.innerHTML = smile(el.dataset.smile === 'after'); });
  const compare = $('#compare');
  $('input', compare).addEventListener('input', (e) => compare.style.setProperty('--pos', e.target.value + '%'));

  /* ---------- Formulário (apenas front-end) ---------- */
  const form = $('#form'), status = $('#formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = form.nome, tel = form.telefone;
    const telOk = tel.value.replace(/\D/g, '').length >= 10;
    nome.classList.toggle('is-invalid', !nome.value.trim());
    tel.classList.toggle('is-invalid', !telOk);
    status.className = 'form__status';
    if (!nome.value.trim()) { status.textContent = 'Informe seu nome para pedirmos o agendamento.'; status.classList.add('is-error'); nome.focus(); return; }
    if (!telOk) { status.textContent = 'Informe um telefone com DDD, por exemplo (11) 90000-0000.'; status.classList.add('is-error'); tel.focus(); return; }
    status.textContent = `Agendamento pedido. Ligamos para ${nome.value.trim().split(' ')[0]} em até 1 dia útil.`;
    status.classList.add('is-ok');
    form.reset();
  });

  /* ---------- Inclinação dos cartões com o cursor ---------- */
  if (!reduced && matchMedia('(hover: hover)').matches) {
    $$('[data-card]').forEach((card) => {
      const art = $('svg', card);
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        art.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 22 + 'deg');
        art.style.setProperty('--rx', ((e.clientY - r.top) / r.height - 0.5) * -16 + 'deg');
      });
      card.addEventListener('pointerleave', () => { art.style.setProperty('--ry', '0deg'); art.style.setProperty('--rx', '0deg'); });
    });
  }

  /* ---------- Daqui em diante: GSAP ---------- */
  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Scroll suave
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: a.getAttribute('href') === '#topo' ? 0 : -70 });
    }));
  }

  // Divide textos em letras ou palavras
  const split = (el, by) => {
    const parts = by === 'w' ? el.textContent.trim().split(/\s+/) : [...el.textContent];
    el.innerHTML = parts.map((p) => p === ' ' ? ' ' : `<span class="${by}">${p}</span>`).join(by === 'w' ? ' ' : '');
    return $$('.' + by, el);
  };

  // Hero: sequência de entrada
  const lines = $$('.wordmark [data-split]').map((l) => split(l, 'ch'));
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from(lines[0], { yPercent: 115, duration: 1.3, stagger: 0.06 }, 0.15)
    .from(lines[1], { yPercent: 115, duration: 1.3, stagger: 0.06 }, 0.35)
    .from('.nav > *', { y: -24, opacity: 0, duration: 0.9, stagger: 0.07 }, 0.6)
    .from('.hero__lede, .hero__side > *', { y: 28, opacity: 0, duration: 1, stagger: 0.1 }, 0.9);

  // Hero: as duas linhas se afastam no scroll
  gsap.to('.wordmark__line:first-child', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.wordmark__line--soft', { xPercent: 8, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Contadores
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, delay: 1.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('pt-BR'); } });
  });

  // Navegação: some ao descer, volta ao subir
  const nav = $('#nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      nav.classList.toggle('is-scrolled', self.scroll() > 40);
      nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 300 && !menu.classList.contains('is-open'));
    },
  });

  // Frase que se preenche palavra a palavra
  $$('[data-words]').forEach((el) => {
    gsap.fromTo(split(el, 'w'), { color: '#b9c4d9' }, {
      color: '#0E2240', stagger: 0.12, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'top 22%', scrub: true },
    });
  });

  // Títulos: cada linha sobe de trás de uma máscara
  $$('[data-title]').forEach((el) => {
    gsap.from(el.children, {
      yPercent: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  // Deslocamento horizontal do título de resultados
  gsap.fromTo('.title--offset .soft', { xPercent: -14 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: '.results', start: 'top bottom', end: 'top top', scrub: true } });

  // Revelações em lote
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1, overwrite: true }),
  });
  gsap.set('[data-reveal]', { opacity: 0 });

  // Cartões: entram em cascata com leve rotação
  gsap.set('[data-card]', { opacity: 0, y: 70, rotate: 2.5 });
  ScrollTrigger.batch('[data-card]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, clearProps: 'transform' }),
  });

  // Antes e depois: o divisor desliza sozinho uma vez ao entrar
  const range = $('input', compare), pos = { v: 50 };
  const setPos = () => { compare.style.setProperty('--pos', pos.v + '%'); range.value = pos.v; };
  gsap.timeline({ scrollTrigger: { trigger: compare, start: 'top 65%', once: true } })
    .to(pos, { v: 22, duration: 0.9, ease: 'power2.inOut', onUpdate: setPos })
    .to(pos, { v: 78, duration: 1.2, ease: 'power2.inOut', onUpdate: setPos })
    .to(pos, { v: 50, duration: 0.9, ease: 'power2.inOut', onUpdate: setPos });

  // Primeira consulta: linha desenhada pelo scroll
  gsap.fromTo('.steps__line i', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.steps', start: 'top 62%', end: 'bottom 62%', scrub: 0.4 },
  });
  $$('.steps li').forEach((li) => {
    ScrollTrigger.create({ trigger: li, start: 'top 62%', onEnter: () => li.classList.add('is-on'), onLeaveBack: () => li.classList.remove('is-on') });
    gsap.from($('div', li), { x: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 82%' } });
  });

  // Dúvidas e formulário
  gsap.from('.faq__item', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } });
  gsap.from('.form > *', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: '.form', start: 'top 82%' } });

  // Rodapé
  gsap.from(split($('.footer__mark'), 'ch'), {
    yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.035,
    scrollTrigger: { trigger: '.footer__mark', start: 'top 96%' },
  });

  // Botão magnético
  if (matchMedia('(hover: hover)').matches) {
    $$('[data-magnetic]').forEach((b) => {
      const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35); yTo((e.clientY - r.top - r.height / 2) * 0.45);
      });
      b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
