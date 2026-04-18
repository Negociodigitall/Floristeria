

'use strict';


const CONFIG = {
  business: {
    name:      'Floristería Los Ángeles',
    phone:     '50663650665',
    whatsapp:  '50663650665',
    address:   'San Rafael Abajo, Desamparados, San José, Costa Rica',
    hours:     'Abierto desde las 8:00 a.m.',
    email:     'info@floristerialosangeles.cr',
    facebook:  'https://www.facebook.com/floristerialosangeles',
    instagram: 'https://www.instagram.com/floristerialosangeles',
  },
  messages: {
    whatsappDefault:
      'Hola%2C%20me%20interesa%20información%20sobre%20sus%20flores%20y%20arreglos.',
    whatsappOrder:
      'Hola%2C%20quiero%20hacer%20un%20pedido%20de%20flores.',
    whatsappContact:
      'Hola%2C%20los%20contacto%20desde%20su%20página%20web.',
  },
  animation: {
    scrollOffset:    100,
    counterDuration: 2000,
    toastDuration:   4000,
    debounceDelay:   150,
  },
  validation: {
    nameMinLength:    3,
    messageMinLength: 10,
    phoneMinLength:   8,
  },
};


const Utils = {

  /**
   * Selector de elementos del DOM
   * @param {string} selector
   * @param {Element} context
   * @returns {Element|null}
   */
  qs(selector, context = document) {
    return context.querySelector(selector);
  },

  /**
   * Selector múltiple de elementos del DOM
   * @param {string} selector
   * @param {Element} context
   * @returns {NodeList}
   */
  qsa(selector, context = document) {
    return context.querySelectorAll(selector);
  },

  /**
   * Agregar event listener con soporte para múltiples elementos
   * @param {Element|NodeList|string} target
   * @param {string} event
   * @param {Function} handler
   * @param {Object} options
   */
  on(target, event, handler, options = {}) {
    if (typeof target === 'string') {
      target = this.qsa(target);
    }
    if (target instanceof NodeList || Array.isArray(target)) {
      target.forEach(el => el.addEventListener(event, handler, options));
    } else if (target) {
      target.addEventListener(event, handler, options);
    }
  },

  /**
   * Debounce para optimizar eventos frecuentes
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  debounce(fn, delay = CONFIG.animation.debounceDelay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Throttle para limitar ejecuciones
   * @param {Function} fn
   * @param {number} limit
   * @returns {Function}
   */
  throttle(fn, limit = 100) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Verificar si un elemento está en el viewport
   * @param {Element} el
   * @param {number} offset
   * @returns {boolean}
   */
  isInViewport(el, offset = 0) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
      rect.bottom >= 0
    );
  },

  /**
   * Formatear número de teléfono para display
   * @param {string} phone
   * @returns {string}
   */
  formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return phone;
  },

  /**
   * Sanitizar texto para prevenir XSS
   * @param {string} str
   * @returns {string}
   */
  sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Obtener parámetro de URL
   * @param {string} name
   * @returns {string|null}
   */
  getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  /**
   * Scroll suave a elemento
   * @param {string|Element} target
   * @param {number} offset
   */
  scrollTo(target, offset = 0) {
    const el = typeof target === 'string'
      ? document.querySelector(target)
      : target;
    if (!el) return;
    const top = el.getBoundingClientRect().top
      + window.pageYOffset
      - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  },

  /**
   * Guardar en localStorage con manejo de errores
   * @param {string} key
   * @param {*} value
   */
  setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage no disponible:', e);
    }
  },

  /**
   * Leer de localStorage con manejo de errores
   * @param {string} key
   * @param {*} fallback
   * @returns {*}
   */
  getStorage(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  },
};


const Navbar = {

  el: {
    header:   null,
    toggle:   null,
    menu:     null,
    links:    null,
    body:     document.body,
  },

  isOpen: false,
  lastScroll: 0,

  init() {
    this.el.header = Utils.qs('#header');
    this.el.toggle = Utils.qs('#navToggle');
    this.el.menu   = Utils.qs('#navMenu');
    this.el.links  = Utils.qsa('.navbar__link');

    if (!this.el.header) return;

    this.bindEvents();
    this.handleScroll();
    this.setActiveLink();
  },

  bindEvents() {
    
    Utils.on(this.el.toggle, 'click', () => this.toggleMenu());

    
    Utils.on(this.el.links, 'click', (e) => {
      this.closeMenu();
      this.handleNavClick(e);
    });

    
    Utils.on(document, 'click', (e) => {
      if (
        this.isOpen &&
        !this.el.menu.contains(e.target) &&
        !this.el.toggle.contains(e.target)
      ) {
        this.closeMenu();
      }
    });

    
    Utils.on(
      window,
      'scroll',
      Utils.throttle(() => this.handleScroll(), 50)
    );

    
    Utils.on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.closeMenu();
    });

   
    Utils.on(
      window,
      'resize',
      Utils.debounce(() => this.handleResize(), 200)
    );
  },

  toggleMenu() {
    this.isOpen ? this.closeMenu() : this.openMenu();
  },

  openMenu() {
    this.isOpen = true;
    this.el.menu.classList.add('is-open');
    this.el.toggle.classList.add('is-active');
    this.el.toggle.setAttribute('aria-expanded', 'true');
    this.el.body.style.overflow = 'hidden';
  },

  closeMenu() {
    this.isOpen = false;
    this.el.menu.classList.remove('is-open');
    this.el.toggle.classList.remove('is-active');
    this.el.toggle.setAttribute('aria-expanded', 'false');
    this.el.body.style.overflow = '';
  },

  handleScroll() {
    const currentScroll = window.pageYOffset;
    const header = this.el.header;

    
    if (currentScroll > 50) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }

    
    if (currentScroll > 300) {
      if (currentScroll > this.lastScroll && !this.isOpen) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
    }

    this.lastScroll = currentScroll <= 0 ? 0 : currentScroll;
  },

  handleNavClick(e) {
    const href = e.currentTarget.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const navHeight = this.el.header.offsetHeight
        + parseInt(
            getComputedStyle(document.documentElement)
              .getPropertyValue('--topbar-height') || '40'
          );
      Utils.scrollTo(href, navHeight);
    }
  },

  handleResize() {
    if (window.innerWidth > 768 && this.isOpen) {
      this.closeMenu();
    }
  },

  setActiveLink() {
    const sections = Utils.qsa('section[id]');
    const navHeight = 120;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            this.el.links.forEach((link) => {
              link.classList.remove('active');
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
              }
            });
          }
        });
      },
      {
        rootMargin: `-${navHeight}px 0px -60% 0px`,
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));
  },
};


const ScrollAnimations = {

  elements: [],
  observer: null,

  init() {
    this.elements = Utils.qsa('[data-aos]');
    if (!this.elements.length) return;

    // Verificar preferencia de movimiento reducido
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced) {
      this.elements.forEach(el => el.classList.add('aos-animate'));
      return;
    }

    this.setupObserver();
    this.observeElements();
  },

  setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.aosDelay || 0;

            setTimeout(() => {
              el.classList.add('aos-animate');
            }, parseInt(delay));

            // Dejar de observar después de animar
            this.observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );
  },

  observeElements() {
    this.elements.forEach((el) => {
      el.classList.add('aos-init');
      this.observer.observe(el);
    });
  },
};


const Counter = {

  elements: [],
  hasAnimated: false,

  init() {
    this.elements = Utils.qsa('[data-counter]');
    if (!this.elements.length) return;
    this.observe();
  },

  observe() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            this.animateAll();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    
    const statsSection = Utils.qs('.hero__stats, .stats-section');
    if (statsSection) observer.observe(statsSection);
  },

  animateAll() {
    this.elements.forEach((el) => {
      const target  = parseInt(el.dataset.counter, 10);
      const suffix  = el.dataset.suffix  || '';
      const prefix  = el.dataset.prefix  || '';
      const duration = parseInt(el.dataset.duration, 10)
        || CONFIG.animation.counterDuration;

      this.animateValue(el, 0, target, duration, prefix, suffix);
    });
  },

  animateValue(el, start, end, duration, prefix, suffix) {
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutExpo
      const eased = progress === 1
        ? 1
        : 1 - Math.pow(2, -10 * progress);

      const current = Math.floor(eased * (end - start) + start);
      el.textContent = `${prefix}${current.toLocaleString('es-CR')}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${prefix}${end.toLocaleString('es-CR')}${suffix}`;
      }
    };

    requestAnimationFrame(update);
  },
};
/* ============================================
   6. MÓDULO: GALERÍA / LIGHTBOX
   ============================================ */
const Gallery = {

  el: {
    items:     null,
    lightbox:  null,
    overlay:   null,
    image:     null,
    caption:   null,
    close:     null,
    prev:      null,
    next:      null,
    counter:   null,
    filters:   null,
  },

  currentIndex: 0,
  images:       [],
  isOpen:       false,
  touchStartX:  0,
  touchEndX:    0,

  init() {
    this.el.items   = Utils.qsa('.gallery__item');
    this.el.filters = Utils.qsa('.gallery__filter-btn');

    if (!this.el.items.length) return;

    this.buildLightbox();
    this.collectImages();
    this.bindEvents();
    this.initFilters();
  },

  /* Construir el lightbox dinámicamente en el DOM */
  buildLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className  = 'lightbox';
    lightbox.id         = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Visor de imágenes');
    lightbox.innerHTML  = `
      <div class="lightbox__overlay" id="lightboxOverlay"></div>
      <div class="lightbox__container">
        <button class="lightbox__close" id="lightboxClose" aria-label="Cerrar visor">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
        <button class="lightbox__nav lightbox__prev" id="lightboxPrev" aria-label="Imagen anterior">
          <i class="fas fa-chevron-left" aria-hidden="true"></i>
        </button>
        <div class="lightbox__image-wrapper">
          <div class="lightbox__loader" id="lightboxLoader" aria-hidden="true">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <img
            class="lightbox__image"
            id="lightboxImage"
            src=""
            alt=""
            loading="lazy"
          />
        </div>
        <button class="lightbox__nav lightbox__next" id="lightboxNext" aria-label="Siguiente imagen">
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
        </button>
        <div class="lightbox__footer">
          <p class="lightbox__caption" id="lightboxCaption"></p>
          <span class="lightbox__counter" id="lightboxCounter"></span>
        </div>
      </div>
    `;
    document.body.appendChild(lightbox);

    /* Guardar referencias */
    this.el.lightbox = lightbox;
    this.el.overlay  = Utils.qs('#lightboxOverlay');
    this.el.image    = Utils.qs('#lightboxImage');
    this.el.loader   = Utils.qs('#lightboxLoader');
    this.el.caption  = Utils.qs('#lightboxCaption');
    this.el.close    = Utils.qs('#lightboxClose');
    this.el.prev     = Utils.qs('#lightboxPrev');
    this.el.next     = Utils.qs('#lightboxNext');
    this.el.counter  = Utils.qs('#lightboxCounter');
  },

  /* Recolectar datos de imágenes de los items */
  collectImages() {
    this.images = Array.from(this.el.items).map((item, index) => ({
      src:      item.dataset.src     || item.querySelector('img')?.src || '',
      alt:      item.dataset.alt     || item.querySelector('img')?.alt || `Imagen ${index + 1}`,
      caption:  item.dataset.caption || '',
      category: item.dataset.category || 'all',
    }));
  },

  bindEvents() {
    /* Abrir lightbox al hacer clic en item */
    Utils.on(this.el.items, 'click', (e) => {
      const item  = e.currentTarget;
      const index = Array.from(this.el.items).indexOf(item);
      this.open(index);
    });

    /* Controles del lightbox */
    Utils.on(this.el.close,   'click', () => this.close());
    Utils.on(this.el.overlay, 'click', () => this.close());
    Utils.on(this.el.prev,    'click', () => this.navigate(-1));
    Utils.on(this.el.next,    'click', () => this.navigate(1));

    /* Teclado */
    Utils.on(document, 'keydown', (e) => {
      if (!this.isOpen) return;
      switch (e.key) {
        case 'Escape':      this.close();         break;
        case 'ArrowLeft':   this.navigate(-1);    break;
        case 'ArrowRight':  this.navigate(1);     break;
        case 'ArrowUp':     this.navigate(-1);    break;
        case 'ArrowDown':   this.navigate(1);     break;
      }
    });

    /* Touch / Swipe en móvil */
    this.el.lightbox.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.el.lightbox.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  },

  handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 50;
    if (Math.abs(diff) < threshold) return;
    diff > 0 ? this.navigate(1) : this.navigate(-1);
  },

  open(index) {
    this.currentIndex = index;
    this.isOpen       = true;
    this.el.lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.loadImage(index);

    /* Focus trap */
    setTimeout(() => this.el.close.focus(), 100);
  },

  close() {
    this.isOpen = false;
    this.el.lightbox.classList.remove('is-open');
    document.body.style.overflow = '';

    /* Limpiar imagen para liberar memoria */
    setTimeout(() => {
      this.el.image.src = '';
    }, 300);
  },

  navigate(direction) {
    const visibleItems = Array.from(this.el.items).filter(
      item => !item.classList.contains('is-hidden')
    );
    const visibleImages = visibleItems.map(item => {
      const index = Array.from(this.el.items).indexOf(item);
      return this.images[index];
    });

    let newIndex = this.currentIndex + direction;
    if (newIndex < 0)                    newIndex = visibleImages.length - 1;
    if (newIndex >= visibleImages.length) newIndex = 0;

    this.currentIndex = newIndex;
    this.loadImage(newIndex, visibleImages);
  },

  loadImage(index, imageSet = null) {
    const images = imageSet || this.images;
    const data   = images[index];
    if (!data) return;

    /* Mostrar loader */
    this.el.loader.style.display = 'flex';
    this.el.image.style.opacity  = '0';

    const img = new Image();
    img.onload = () => {
      this.el.image.src            = data.src;
      this.el.image.alt            = data.alt;
      this.el.caption.textContent  = data.caption || data.alt;
      this.el.counter.textContent  = `${index + 1} / ${images.length}`;
      this.el.loader.style.display = 'none';

      /* Animación de entrada */
      requestAnimationFrame(() => {
        this.el.image.style.transition = 'opacity 0.3s ease';
        this.el.image.style.opacity    = '1';
      });
    };

    img.onerror = () => {
      this.el.loader.style.display = 'none';
      this.el.image.src            = this.getPlaceholder(data.alt);
      this.el.image.style.opacity  = '1';
    };

    img.src = data.src;
  },

  /* Placeholder SVG si la imagen falla */
  getPlaceholder(text = 'Imagen') {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <rect width="400" height="300" fill="#f5f0eb"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#9e9e9e"
              font-family="sans-serif" font-size="16">${Utils.sanitize(text)}</text>
      </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  },

  /* Sistema de filtros por categoría */
  initFilters() {
    if (!this.el.filters.length) return;

    Utils.on(this.el.filters, 'click', (e) => {
      const btn      = e.currentTarget;
      const category = btn.dataset.filter || 'all';

      /* Actualizar botones activos */
      this.el.filters.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      /* Filtrar items con animación */
      this.filterItems(category);
    });
  },

  filterItems(category) {
    this.el.items.forEach((item, index) => {
      const itemCategory = item.dataset.category || 'all';
      const show = category === 'all' || itemCategory === category;

      if (show) {
        item.classList.remove('is-hidden');
        /* Animación escalonada */
        setTimeout(() => {
          item.style.opacity   = '1';
          item.style.transform = 'scale(1)';
        }, index * 50);
      } else {
        item.style.opacity   = '0';
        item.style.transform = 'scale(0.8)';
        setTimeout(() => item.classList.add('is-hidden'), 300);
      }
    });

    /* Recolectar imágenes visibles */
    this.collectImages();
  },
};

/* ============================================
   7. MÓDULO: FORMULARIO DE CONTACTO
   ============================================ */
const ContactForm = {

  el: {
    form:     null,
    fields:   {},
    submit:   null,
    success:  null,
    error:    null,
  },

  isSubmitting: false,

  /* Reglas de validación */
  rules: {
    name: {
      required:  true,
      minLength: CONFIG.validation.nameMinLength,
      pattern:   /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/,
      messages: {
        required:  'Por favor ingresa tu nombre completo.',
        minLength: `El nombre debe tener al menos ${CONFIG.validation.nameMinLength} caracteres.`,
        pattern:   'El nombre solo puede contener letras y espacios.',
      },
    },
    phone: {
      required:  true,
      minLength: CONFIG.validation.phoneMinLength,
      pattern:   /^[\d\s\-\+\$\$]+$/,
      messages: {
        required:  'Por favor ingresa tu número de teléfono.',
        minLength: `El teléfono debe tener al menos ${CONFIG.validation.phoneMinLength} dígitos.`,
        pattern:   'Por favor ingresa un número de teléfono válido.',
      },
    },
    email: {
      required: false,
      pattern:  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      messages: {
        pattern: 'Por favor ingresa un correo electrónico válido.',
      },
    },
    message: {
      required:  true,
      minLength: CONFIG.validation.messageMinLength,
      maxLength: 500,
      messages: {
        required:  'Por favor escribe tu mensaje.',
        minLength: `El mensaje debe tener al menos ${CONFIG.validation.messageMinLength} caracteres.`,
        maxLength: 'El mensaje no puede superar los 500 caracteres.',
      },
    },
  },

  init() {
    this.el.form = Utils.qs('#contactForm');
    if (!this.el.form) return;

    this.el.submit  = Utils.qs('[type="submit"]', this.el.form);
    this.el.success = Utils.qs('#formSuccess');
    this.el.error   = Utils.qs('#formError');

    /* Referenciar campos */
    ['name', 'phone', 'email', 'message'].forEach(field => {
      this.el.fields[field] = Utils.qs(`#${field}`, this.el.form);
    });

    this.bindEvents();
    this.initCharCounter();
  },

  bindEvents() {
    /* Submit del formulario */
    Utils.on(this.el.form, 'submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    /* Validación en tiempo real (blur) */
    Object.keys(this.el.fields).forEach(fieldName => {
      const field = this.el.fields[fieldName];
      if (!field) return;

      Utils.on(field, 'blur', () => {
        this.validateField(fieldName);
      });

      Utils.on(field, 'input', () => {
        /* Limpiar error mientras escribe */
        this.clearFieldError(fieldName);

        /* Validar si ya tenía error */
        const wrapper = field.closest('.form__group');
        if (wrapper && wrapper.classList.contains('has-error')) {
          this.validateField(fieldName);
        }
      });
    });

    /* Botón de WhatsApp en el formulario */
    const whatsappBtn = Utils.qs('#formWhatsappBtn');
    if (whatsappBtn) {
      Utils.on(whatsappBtn, 'click', () => this.sendViaWhatsApp());
    }
  },

  /* Validar un campo individual */
  validateField(fieldName) {
    const field = this.el.fields[fieldName];
    const rules = this.rules[fieldName];
    if (!field || !rules) return true;

    const value = field.value.trim();
    let error   = null;

    /* Required */
    if (rules.required && !value) {
      error = rules.messages.required;
    }
    /* MinLength */
    else if (rules.minLength && value && value.length < rules.minLength) {
      error = rules.messages.minLength;
    }
    /* MaxLength */
    else if (rules.maxLength && value.length > rules.maxLength) {
      error = rules.messages.maxLength;
    }
    /* Pattern */
    else if (rules.pattern && value && !rules.pattern.test(value)) {
      error = rules.messages.pattern;
    }

    if (error) {
      this.showFieldError(fieldName, error);
      return false;
    } else {
      this.showFieldSuccess(fieldName);
      return true;
    }
  },

  /* Validar todos los campos */
   /* Validar todos los campos */
  validateAll() {
    const fields  = Object.keys(this.el.fields);
    const results = fields.map(field => this.validateField(field));
    return results.every(Boolean);
  },

  showFieldError(fieldName, message) {
    const field   = this.el.fields[fieldName];
    if (!field) return;
    const wrapper = field.closest('.form__group');
    const errorEl = wrapper ? Utils.qs('.form__error', wrapper) : null;

    field.setAttribute('aria-invalid', 'true');
    wrapper?.classList.add('has-error');
    wrapper?.classList.remove('has-success');

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  },

  showFieldSuccess(fieldName) {
    const field   = this.el.fields[fieldName];
    if (!field) return;
    const wrapper = field.closest('.form__group');

    field.setAttribute('aria-invalid', 'false');
    wrapper?.classList.remove('has-error');
    wrapper?.classList.add('has-success');

    const errorEl = wrapper ? Utils.qs('.form__error', wrapper) : null;
    if (errorEl) {
      errorEl.textContent  = '';
      errorEl.style.display = 'none';
    }
  },

  clearFieldError(fieldName) {
    const field   = this.el.fields[fieldName];
    if (!field) return;
    const wrapper = field.closest('.form__group');
    const errorEl = wrapper ? Utils.qs('.form__error', wrapper) : null;

    wrapper?.classList.remove('has-error');
    if (errorEl) {
      errorEl.textContent   = '';
      errorEl.style.display = 'none';
    }
  },

  /* Contador de caracteres para el textarea */
  initCharCounter() {
    const messageField = this.el.fields.message;
    if (!messageField) return;

    const maxLength = this.rules.message.maxLength || 500;
    const counter   = Utils.qs('#charCounter');
    if (!counter) return;

    counter.textContent = `0 / ${maxLength}`;

    Utils.on(messageField, 'input', () => {
      const length  = messageField.value.length;
      const percent = (length / maxLength) * 100;

      counter.textContent = `${length} / ${maxLength}`;

      /* Cambiar color según límite */
      counter.classList.remove('is-warning', 'is-danger');
      if (percent >= 90)      counter.classList.add('is-danger');
      else if (percent >= 70) counter.classList.add('is-warning');
    });
  },

  /* Manejar envío del formulario */
  async handleSubmit() {
    if (this.isSubmitting) return;

    /* Validar todos los campos */
    const isValid = this.validateAll();
    if (!isValid) {
      /* Hacer scroll al primer error */
      const firstError = Utils.qs('.form__group.has-error');
      if (firstError) {
        Utils.scrollTo(firstError, 120);
        Utils.qs('input, textarea', firstError)?.focus();
      }
      Toast.show('Por favor corrige los errores antes de enviar.', 'error');
      return;
    }

    this.isSubmitting = true;
    this.setLoadingState(true);

    try {
      /* Recopilar datos del formulario */
      const formData = this.getFormData();

      /* Simular envío (reemplazar con fetch real a tu backend) */
      await this.simulateSubmit(formData);

      /* Éxito */
      this.handleSuccess(formData);

    } catch (err) {
      console.error('Error al enviar formulario:', err);
      this.handleError();
    } finally {
      this.isSubmitting = false;
      this.setLoadingState(false);
    }
  },

  getFormData() {
    return {
      name:      Utils.sanitize(this.el.fields.name?.value.trim()    || ''),
      phone:     Utils.sanitize(this.el.fields.phone?.value.trim()   || ''),
      email:     Utils.sanitize(this.el.fields.email?.value.trim()   || ''),
      message:   Utils.sanitize(this.el.fields.message?.value.trim() || ''),
      timestamp: new Date().toISOString(),
      source:    'Página Web - Floristería Los Ángeles',
    };
  },

  /* Simular envío asíncrono (reemplazar con API real) */
  simulateSubmit(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        /* Guardar en localStorage como respaldo */
        const submissions = Utils.getStorage('form_submissions', []);
        submissions.push(data);
        Utils.setStorage('form_submissions', submissions);

        /* Simular éxito (cambiar a reject() para probar error) */
        resolve({ success: true, data });
      }, 1800);
    });
  },

  handleSuccess(formData) {
    /* Mostrar mensaje de éxito */
    if (this.el.success) {
      this.el.success.classList.add('is-visible');
      this.el.success.setAttribute('aria-live', 'polite');
    }

    /* Ocultar mensaje de error si estaba visible */
    if (this.el.error) {
      this.el.error.classList.remove('is-visible');
    }

    /* Toast de confirmación */
    Toast.show(
      `¡Gracias ${formData.name}! Tu mensaje fue enviado. Te contactaremos pronto.`,
      'success',
      6000
    );

    /* Resetear formulario */
    this.el.form.reset();
    Object.keys(this.el.fields).forEach(f => {
      const wrapper = this.el.fields[f]?.closest('.form__group');
      wrapper?.classList.remove('has-success', 'has-error');
    });

    /* Resetear contador de caracteres */
    const counter = Utils.qs('#charCounter');
    if (counter) counter.textContent = `0 / 500`;

    /* Ocultar mensaje de éxito después de 8 segundos */
    setTimeout(() => {
      this.el.success?.classList.remove('is-visible');
    }, 8000);

    /* Analytics event (si tienes GA4) */
    this.trackEvent('form_submit', { form_name: 'contact_form' });
  },

  handleError() {
    if (this.el.error) {
      this.el.error.classList.add('is-visible');
      setTimeout(() => {
        this.el.error?.classList.remove('is-visible');
      }, 6000);
    }
    Toast.show(
      'Hubo un error al enviar tu mensaje. Por favor intenta de nuevo o contáctanos por WhatsApp.',
      'error',
      6000
    );
  },

  setLoadingState(loading) {
    if (!this.el.submit) return;

    if (loading) {
      this.el.submit.disabled         = true;
      this.el.submit.dataset.original = this.el.submit.innerHTML;
      this.el.submit.innerHTML        =
        '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Enviando...';
    } else {
      this.el.submit.disabled   = false;
      this.el.submit.innerHTML  =
        this.el.submit.dataset.original ||
        '<i class="fas fa-paper-plane" aria-hidden="true"></i> Enviar Mensaje';
    }
  },

  /* Enviar datos por WhatsApp como alternativa */
  sendViaWhatsApp() {
    const name    = this.el.fields.name?.value.trim()    || '';
    const phone   = this.el.fields.phone?.value.trim()   || '';
    const message = this.el.fields.message?.value.trim() || '';

    if (!name && !message) {
      Toast.show(
        'Completa al menos tu nombre y mensaje para enviar por WhatsApp.',
        'warning'
      );
      return;
    }

    const text = encodeURIComponent(
      `Hola, soy ${name || 'un cliente'}.\n` +
      `Teléfono: ${phone || 'No indicado'}\n` +
      `Mensaje: ${message || 'Sin mensaje'}`
    );

    window.open(
      `https://wa.me/${CONFIG.business.whatsapp}?text=${text}`,
      '_blank',
      'noopener,noreferrer'
    );
  },

  /* Registrar evento en Google Analytics 4 */
  trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  },
};

/* ============================================
   8. MÓDULO: TOAST NOTIFICATIONS
   ============================================ */
const Toast = {

  container: null,
  queue:     [],
  isShowing: false,

  init() {
    this.container = document.createElement('div');
    this.container.className  = 'toast-container';
    this.container.id         = 'toastContainer';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Notificaciones');
    this.container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.container);
  },

  /**
   * Mostrar una notificación toast
   * @param {string} message  - Texto del mensaje
   * @param {string} type     - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - Duración en ms
   */
  show(message, type = 'info', duration = CONFIG.animation.toastDuration) {
    const toast = this.create(message, type);
    this.container.appendChild(toast);

    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('is-visible');
      });
    });

    
    const timer = setTimeout(() => this.dismiss(toast), duration);

   
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => {
      setTimeout(() => this.dismiss(toast), 1500);
    });

    
    const closeBtn = Utils.qs('.toast__close', toast);
    if (closeBtn) {
      Utils.on(closeBtn, 'click', () => {
        clearTimeout(timer);
        this.dismiss(toast);
      });
    }

    return toast;
  },

  create(message, type) {
    const icons = {
      success: 'fa-check-circle',
      error:   'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info:    'fa-info-circle',
    };

    const toast       = document.createElement('div');
    toast.className   = `toast toast--${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML   = `
      <div class="toast__icon" aria-hidden="true">
        <i class="fas ${icons[type] || icons.info}"></i>
      </div>
      <p class="toast__message">${Utils.sanitize(message)}</p>
      <button class="toast__close" aria-label="Cerrar notificación">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    `;
    return toast;
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove('is-visible');
    toast.classList.add('is-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  },

  dismissAll() {
    const toasts = Utils.qsa('.toast', this.container);
    toasts.forEach(t => this.dismiss(t));
  },
};


const WhatsAppButton = {

  el:        null,
  tooltip:   null,
  isVisible: false,

  init() {
    this.build();
    this.bindEvents();
    this.showAfterDelay();
  },

  build() {
    const btn       = document.createElement('a');
    btn.className   = 'whatsapp-float';
    btn.id          = 'whatsappFloat';
    btn.href        = `https://wa.me/${CONFIG.business.whatsapp}?text=${CONFIG.messages.whatsappDefault}`;
    btn.target      = '_blank';
    btn.rel         = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'Contactar por WhatsApp');
    btn.innerHTML   = `
      <div class="whatsapp-float__pulse" aria-hidden="true"></div>
      <i class="fab fa-whatsapp whatsapp-float__icon" aria-hidden="true"></i>
      <span class="whatsapp-float__tooltip">¡Escríbenos!</span>
    `;
    document.body.appendChild(btn);
    this.el      = btn;
    this.tooltip = Utils.qs('.whatsapp-float__tooltip', btn);
  },

  bindEvents() {
   
    Utils.on(
      window,
      'scroll',
      Utils.throttle(() => this.handleScroll(), 100)
    );

   
    Utils.on(this.el, 'click', () => {
      ContactForm.trackEvent('whatsapp_click', {
        source: 'floating_button',
      });
    });
  },

  handleScroll() {
    const scrollY = window.pageYOffset;
    if (scrollY > 300 && !this.isVisible) {
      this.show();
    } else if (scrollY <= 300 && this.isVisible) {
      this.hide();
    }
  },

  show() {
    this.isVisible = true;
    this.el.classList.add('is-visible');
  },

  hide() {
    this.isVisible = false;
    this.el.classList.remove('is-visible');
  },

  showAfterDelay() {
    setTimeout(() => {
      if (window.pageYOffset > 300) this.show();
    }, 2000);
  },
};


const ScrollToTop = {

  el:        null,
  isVisible: false,

  init() {
    this.build();
    this.bindEvents();
  },

  build() {
    const btn       = document.createElement('button');
    btn.className   = 'scroll-top';
    btn.id          = 'scrollTop';
    btn.setAttribute('aria-label', 'Volver al inicio de la página');
    btn.innerHTML   = '<i class="fas fa-chevron-up" aria-hidden="true"></i>';
    document.body.appendChild(btn);
    this.el = btn;
  },

  bindEvents() {
    Utils.on(
      window,
      'scroll',
      Utils.throttle(() => this.handleScroll(), 100)
    );

    Utils.on(this.el, 'click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
            ContactForm.trackEvent('scroll_to_top', {});
    });
  },

  handleScroll() {
    const scrollY = window.pageYOffset;
    if (scrollY > 500 && !this.isVisible) {
      this.isVisible = true;
      this.el.classList.add('is-visible');
    } else if (scrollY <= 500 && this.isVisible) {
      this.isVisible = false;
      this.el.classList.remove('is-visible');
    }
  },
};


const TestimonialsSlider = {

  el: {
    wrapper:  null,
    slides:   null,
    dots:     null,
    prev:     null,
    next:     null,
    track:    null,
  },

  currentIndex:  0,
  totalSlides:   0,
  autoplayTimer: null,
  autoplayDelay: 5000,
  isAnimating:   false,
  touchStartX:   0,
  touchEndX:     0,

  init() {
    this.el.wrapper = Utils.qs('.testimonials__slider');
    if (!this.el.wrapper) return;

    this.el.track  = Utils.qs('.testimonials__track',  this.el.wrapper);
    this.el.slides = Utils.qsa('.testimonial__card',   this.el.wrapper);
    this.el.prev   = Utils.qs('.testimonials__prev',   this.el.wrapper);
    this.el.next   = Utils.qs('.testimonials__next',   this.el.wrapper);

    if (!this.el.slides.length) return;

    this.totalSlides = this.el.slides.length;
    this.buildDots();
    this.bindEvents();
    this.goTo(0);
    this.startAutoplay();
  },

  buildDots() {
    const dotsWrapper       = document.createElement('div');
    dotsWrapper.className   = 'testimonials__dots';
    dotsWrapper.setAttribute('role', 'tablist');
    dotsWrapper.setAttribute('aria-label', 'Navegación de testimonios');

    for (let i = 0; i < this.totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = 'testimonials__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Testimonio ${i + 1}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.dataset.index = i;
      dotsWrapper.appendChild(dot);
    }

    this.el.wrapper.appendChild(dotsWrapper);
    this.el.dots = Utils.qsa('.testimonials__dot', dotsWrapper);
  },

  bindEvents() {
   
    if (this.el.prev) {
      Utils.on(this.el.prev, 'click', () => {
        this.stopAutoplay();
        this.navigate(-1);
        this.startAutoplay();
      });
    }

    if (this.el.next) {
      Utils.on(this.el.next, 'click', () => {
        this.stopAutoplay();
        this.navigate(1);
        this.startAutoplay();
      });
    }

    
    if (this.el.dots) {
      Utils.on(this.el.dots, 'click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index, 10);
        this.stopAutoplay();
        this.goTo(index);
        this.startAutoplay();
      });
    }

    
    if (this.el.wrapper) {
      this.el.wrapper.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
        this.stopAutoplay();
      }, { passive: true });

      this.el.wrapper.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
        this.startAutoplay();
      }, { passive: true });
    }

    
    Utils.on(this.el.wrapper, 'mouseenter', () => this.stopAutoplay());
    Utils.on(this.el.wrapper, 'mouseleave', () => this.startAutoplay());

    
    Utils.on(this.el.wrapper, 'keydown', (e) => {
      if (e.key === 'ArrowLeft')  this.navigate(-1);
      if (e.key === 'ArrowRight') this.navigate(1);
    });
  },

  handleSwipe() {
    const diff      = this.touchStartX - this.touchEndX;
    const threshold = 50;
    if (Math.abs(diff) < threshold) return;
    diff > 0 ? this.navigate(1) : this.navigate(-1);
  },

  navigate(direction) {
    let newIndex = this.currentIndex + direction;
    if (newIndex < 0)                   newIndex = this.totalSlides - 1;
    if (newIndex >= this.totalSlides)   newIndex = 0;
    this.goTo(newIndex);
  },

  goTo(index) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    
    this.el.slides.forEach((slide, i) => {
      slide.classList.remove('is-active', 'is-prev', 'is-next');
      slide.setAttribute('aria-hidden', 'true');

      if (i === index) {
        slide.classList.add('is-active');
        slide.setAttribute('aria-hidden', 'false');
      } else if (i === index - 1 || (index === 0 && i === this.totalSlides - 1)) {
        slide.classList.add('is-prev');
      } else {
        slide.classList.add('is-next');
      }
    });

    
    if (this.el.dots) {
      this.el.dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    }

    
    if (this.el.track) {
      this.el.track.style.transform = `translateX(-${index * 100}%)`;
    }

    this.currentIndex = index;

    setTimeout(() => {
      this.isAnimating = false;
    }, 500);
  },

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      this.navigate(1);
    }, this.autoplayDelay);
  },

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  },
};


const MapNavigation = {

  coordinates: {
    lat: 9.8765,
    lng: -84.0765,
  },

  address: encodeURIComponent(
    'Floristería Los Ángeles, San Rafael Abajo, Desamparados, San José, Costa Rica'
  ),

  init() {
    this.bindNavigationButtons();
    this.initMapInteraction();
  },

  bindNavigationButtons() {
   
    const wazeBtn = Utils.qs('#btnWaze');
    if (wazeBtn) {
      Utils.on(wazeBtn, 'click', () => {
        const url = `https://waze.com/ul?ll=${this.coordinates.lat},${this.coordinates.lng}&navigate=yes`;
        window.open(url, '_blank', 'noopener,noreferrer');
        ContactForm.trackEvent('navigation_click', { app: 'waze' });
      });
    }

   
    const uberBtn = Utils.qs('#btnUber');
    if (uberBtn) {
      Utils.on(uberBtn, 'click', () => {
        const url = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${this.coordinates.lat}&dropoff[longitude]=${this.coordinates.lng}&dropoff[nickname]=${this.address}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        ContactForm.trackEvent('navigation_click', { app: 'uber' });
      });
    }

    
    const mapsBtn = Utils.qs('#btnGoogleMaps');
    if (mapsBtn) {
      Utils.on(mapsBtn, 'click', () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${this.address}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        ContactForm.trackEvent('navigation_click', { app: 'google_maps' });
      });
    }
  },

  initMapInteraction() {
    
    const mapWrapper = Utils.qs('.map__wrapper');
    const mapIframe  = Utils.qs('.map__iframe');

    if (mapWrapper && mapIframe) {
     
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const src = mapIframe.dataset.src;
              if (src) {
                mapIframe.src = src;
                mapIframe.removeAttribute('data-src');
              }
              observer.unobserve(mapWrapper);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(mapWrapper);
    }
  },
};


const LazyImages = {

  images:   null,
  observer: null,

  init() {
    this.images = Utils.qsa('img[data-src], img[loading="lazy"]');
    if (!this.images.length) return;

   
    if ('IntersectionObserver' in window) {
      this.setupObserver();
    } else {
     
      this.loadAll();
    }
  },

  setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px 0px',
        threshold:  0.01,
      }
    );

    this.images.forEach(img => {
      img.classList.add('lazy');
      this.observer.observe(img);
    });
  },

  loadImage(img) {
    const src    = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (!src && !srcset) return;

    
    const tempImg = new Image();

    tempImg.onload = () => {
      if (src)    img.src    = src;
      if (srcset) img.srcset = srcset;

      img.classList.remove('lazy');
      img.classList.add('lazy--loaded');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    };

    tempImg.onerror = () => {
      img.classList.add('lazy--error');
    };

    tempImg.src = src || srcset;
  },

  loadAll() {
    this.images.forEach(img => this.loadImage(img));
  },
};


const StickyHeader = {

  init() {
    const header = Utils.qs('#header');
    if (!header) return;

    
    Utils.on(
      window,
      'scroll',
      Utils.throttle(() => {
        const scrollY = window.pageYOffset;

        
        const logo = Utils.qs('.navbar__logo');
        if (logo) {
          logo.style.opacity = scrollY > 200 ? '1' : '1';
        }

        
        const navCta = Utils.qs('.navbar__cta');
        if (navCta) {
          navCta.style.opacity   = scrollY > 100 ? '1' : '0.9';
          navCta.style.transform = scrollY > 100
            ? 'scale(1)'
            : 'scale(0.95)';
        }
      }, 50)
    );
  },
};


const HeroParticles = {

  particles: null,

  init() {
    this.particles = Utils.qsa('.particle');
    if (!this.particles.length) return;

    
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced) return;

    this.animateParticles();
  },

  animateParticles() {
    this.particles.forEach((particle, index) => {
      
      const randomX = Math.random() * 100;
      const randomY = Math.random() * 100;
      const randomDelay    = Math.random() * 5;
      const randomDuration = 8 + Math.random() * 10;
      const randomSize     = 0.8 + Math.random() * 0.8;

      particle.style.cssText += `
        left: ${randomX}%;
        top:  ${randomY}%;
        animation-delay:    ${randomDelay}s;
        animation-duration: ${randomDuration}s;
        font-size: ${randomSize}rem;
        opacity: ${0.3 + Math.random() * 0.5};
      `;
    });
  },
};


const SocialShare = {

  init() {
    const shareButtons = Utils.qsa('[data-share]');
    if (!shareButtons.length) return;

    Utils.on(shareButtons, 'click', (e) => {
      const network = e.currentTarget.dataset.share;
      this.share(network);
    });
  },

  share(network) {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(
      'Floristería Los Ángeles - Flores en Desamparados, Costa Rica'
    );

    const urls = {
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter:   `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      whatsapp:  `https://wa.me/?text=${title}%20${url}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`,
    };

    if (urls[network]) {
      window.open(urls[network], '_blank', 'noopener,noreferrer,width=600,height=400');
      ContactForm.trackEvent('social_share', { network });
    }
  },
};


const CookieConsent = {

  el:          null,
  storageKey:  'cookie_consent_accepted',

  init() {
   
    if (Utils.getStorage(this.storageKey)) return;

   
    setTimeout(() => this.build(), 2000);
  },

  build() {
    const banner       = document.createElement('div');
    banner.className   = 'cookie-banner';
    banner.id          = 'cookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML   = `
      <div class="cookie-banner__content">
        <div class="cookie-banner__icon" aria-hidden="true">🍪</div>
        <div class="cookie-banner__text">
          <p>
            Usamos cookies para mejorar tu experiencia en nuestra página web.
            Al continuar navegando, aceptas nuestra
            <a href="#" class="cookie-banner__link">política de privacidad</a>.
          </p>
        </div>
        <div class="cookie-banner__actions">
          <button class="btn btn--primary btn--small" id="cookieAccept">
            Aceptar
          </button>
          <button class="btn btn--outline-green btn--small" id="cookieDecline">
            Rechazar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    this.el = banner;

   
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        banner.classList.add('is-visible');
      });
    });

    /* Eventos */
    Utils.on(Utils.qs('#cookieAccept'),  'click', () => this.accept());
    Utils.on(Utils.qs('#cookieDecline'), 'click', () => this.decline());
  },

  accept() {
    Utils.setStorage(this.storageKey, true);
    this.dismiss();
    Toast.show('¡Gracias! Preferencias guardadas.', 'success', 3000);

    /* Inicializar analytics si se aceptan cookies */
    this.initAnalytics();
  },

  decline() {
    this.dismiss();
  },

  dismiss() {
    if (!this.el) return;
    this.el.classList.remove('is-visible');
    this.el.classList.add('is-hiding');
    setTimeout(() => {
      if (this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    }, 400);
  },

  initAnalytics() {
   
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
    
    console.info('Analytics inicializado con consentimiento del usuario.');
  },
};

const BusinessHours = {

  schedule: {
    0: { open: '08:00', close: '18:00', label: 'Domingo'    }, /* Domingo   */
    1: { open: '08:00', close: '18:00', label: 'Lunes'      }, /* Lunes     */
    2: { open: '08:00', close: '18:00', label: 'Martes'     }, /* Martes    */
    3: { open: '08:00', close: '18:00', label: 'Miércoles'  }, /* Miércoles */
    4: { open: '08:00', close: '18:00', label: 'Jueves'     }, /* Jueves    */
    5: { open: '08:00', close: '18:00', label: 'Viernes'    }, /* Viernes   */
    6: { open: '08:00', close: '18:00', label: 'Sábado'     }, /* Sábado    */
  },

  timezone: 'America/Costa_Rica',

  init() {
    this.updateStatusBadge();
    
    setInterval(() => this.updateStatusBadge(), 60000);
  },

  isOpen() {
    const now     = new Date();
    const day     = now.getDay();
    const hours   = now.getHours();
    const minutes = now.getMinutes();
    const current = hours * 60 + minutes;

    const todaySchedule = this.schedule[day];
    if (!todaySchedule) return false;

    const [openH,  openM]  = todaySchedule.open.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close.split(':').map(Number);

    const openTime  = openH  * 60 + openM;
    const closeTime = closeH * 60 + closeM;

    return current >= openTime && current < closeTime;
  },

  getStatusText() {
    const open = this.isOpen();
    const now  = new Date();
    const day  = now.getDay();
    const todaySchedule = this.schedule[day];

    if (open) {
      return {
        status:  'open',
        text:    `Abierto ahora · Cierra a las ${todaySchedule?.close || '18:00'}`,
        class:   'status--open',
      };
    } else {
      
      const nextDay = this.schedule[(day + 1) % 7];
      return {
        status:  'closed',
        text:    `Cerrado ahora · Abre mañana a las ${nextDay?.open || '08:00'}`,
        class:   'status--closed',
      };
    }
  },

  updateStatusBadge() {
    const badge = Utils.qs('#businessStatus');
    if (!badge) return;

    const { text, class: statusClass } = this.getStatusText();

    badge.textContent = text;
    badge.className   = `business-status ${statusClass}`;
    badge.setAttribute('aria-label', text);
  },
};


const Performance = {

  init() {
    this.preloadCriticalImages();
    this.deferNonCritical();
    this.optimizeFonts();
  },

  preloadCriticalImages() {
    
    const heroSection = Utils.qs('.hero');
    if (!heroSection) return;

    const bgImage = getComputedStyle(heroSection)
      .backgroundImage
      .replace(/url\$['"]?(.*?)['"]?\$/i, '$1');

    if (bgImage && bgImage !== 'none') {
      const link    = document.createElement('link');
      link.rel      = 'preload';
      link.as       = 'image';
      link.href     = bgImage;
      document.head.appendChild(link);
    }
  },

  deferNonCritical() {
    
    window.addEventListener('load', () => {
      
    });
  },

  optimizeFonts() {
    
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.add('fonts-loaded');
      });
    }
  },
};


const Accessibility = {

  init() {
    this.handleFocusVisible();
    this.handleSkipLink();
    this.handleReducedMotion();
    this.addAriaLive();
  },

  
  handleFocusVisible() {
    let usingMouse = false;

    Utils.on(document, 'mousedown', () => {
      usingMouse = true;
      document.body.classList.add('using-mouse');
    });

    Utils.on(document, 'keydown', (e) => {
      if (e.key === 'Tab') {
        usingMouse = false;
        document.body.classList.remove('using-mouse');
      }
    });
  },

  
  handleSkipLink() {
    const skipLink = Utils.qs('.skip-link');
    if (!skipLink) return;

    Utils.on(skipLink, 'click', (e) => {
      e.preventDefault();
      const main = Utils.qs('#main-content, main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus();
        setTimeout(() => main.removeAttribute('tabindex'), 1000);
      }
    });
  },

 
  handleReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
  },

  
  addAriaLive() {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live',   'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id        = 'ariaLiveRegion';
    document.body.appendChild(liveRegion);
  },

  
  announce(message) {
    const region = Utils.qs('#ariaLiveRegion');
    if (!region) return;
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  },
};


const App = {

  
  
  
  init() {
   
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bootstrap());
    } else {
      this.bootstrap();
    }
  },

  bootstrap() {
    try {
      
      Accessibility.init();
      Performance.init();
      Navbar.init();
      Toast.init();

      
      ScrollAnimations.init();
      Counter.init();
      StickyHeader.init();
      HeroParticles.init();
      ScrollToTop.init();
      WhatsAppButton.init();

      
      Gallery.init();
      TestimonialsSlider.init();
      ContactForm.init();
      MapNavigation.init();
      LazyImages.init();
      SocialShare.init();

      
      BusinessHours.init();
      CookieConsent.init();

      
      this.bindGlobalEvents();

      
      document.documentElement.classList.add('app-ready');

      console.info(
        '%c🌸 Floristería Los Ángeles%c\nSitio web cargado correctamente.',
        'color: #2d6a4f; font-size: 16px; font-weight: bold;',
        'color: #555; font-size: 12px;'
      );

    } catch (error) {
      console.error('Error al inicializar la aplicación:', error);
    }
  },

  bindGlobalEvents() {
   
    Utils.on(document, 'error', (e) => {
      if (e.target.tagName === 'IMG') {
        e.target.src = Gallery.getPlaceholder(e.target.alt || 'Imagen');
        e.target.classList.add('img--error');
      }
    }, true);

    
    Utils.on(window, 'offline', () => {
      Toast.show(
        'Sin conexión a internet. Algunas funciones pueden no estar disponibles.',
        'warning',
        0
      );
    });

    Utils.on(window, 'online', () => {
      Toast.dismissAll();
      Toast.show('¡Conexión restaurada!', 'success', 3000);
    });

    
    Utils.on(document, 'visibilitychange', () => {
      if (document.hidden) {
        TestimonialsSlider.stopAutoplay();
      } else {
        TestimonialsSlider.startAutoplay();
      }
    });

    
    Utils.on(
      window,
      'resize',
      Utils.debounce(() => {
        
        this.handleResize();
      }, 250)
    );

    
    Utils.on(document, 'click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = Utils.qs(href);
      if (!target) return;

      e.preventDefault();
      const navHeight = Utils.qs('#header')?.offsetHeight || 80;
      const topbarHeight = 40;
      Utils.scrollTo(target, navHeight + topbarHeight);
    });
  },

  handleResize() {
    /* Actualizar variables CSS con el alto real del viewport en móvil */
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  },
};


App.init();


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.info('Service Worker registrado:', reg.scope);
      })
      .catch(err => {
        
        console.warn('Service Worker no disponible:', err);
      });
      })
    };  
  
  
