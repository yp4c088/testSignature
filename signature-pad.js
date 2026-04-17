/**
 * SignaturePad - 通用電子簽名畫板元件
 * 純 JavaScript 實作，可嵌入任何 Web 應用程式
 *
 * 使用方式:
 *   const pad = new SignaturePad({ onComplete: (dataUrl) => { ... } });
 *   pad.open();
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SignaturePad = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── 預設選項 ──────────────────────────────────────────
  var DEFAULTS = {
    penColor: '#000000',
    penSize: 3,
    eraserSize: 20,
    backgroundColor: '#ffffff',
    width: null,   // null = 自動撐滿
    height: null,
    colors: ['#000000', '#ff0000', '#0066ff', '#00aa00', '#ff8800', '#8800cc'],
    sizes: [1, 3, 5, 8, 12],
    title: '請在此處簽名',
    confirmText: '完成',
    cancelText: '取消',
    clearText: '清除',
    undoText: '復原',
    outputType: 'image/png',  // image/png | image/jpeg
    outputQuality: 1.0,
    onComplete: null,  // function(dataUrl)
    onCancel: null,
  };

  // ── CSS 樣式 (自動注入) ─────────────────────────────────
  var CSS_ID = 'signature-pad-styles';

  function injectStyles() {
    if (document.getElementById(CSS_ID)) return;

    var link = document.querySelector('link[href*="signature-pad.css"]');
    if (link) return; // 使用者已自行引入外部 CSS

    var style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = getEmbeddedCSS();
    document.head.appendChild(style);
  }

  function getEmbeddedCSS() {
    return [
      /* Overlay */
      '.sp-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s ease;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}',
      '.sp-overlay.sp-visible{opacity:1}',

      /* Container */
      '.sp-container{background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.25);display:flex;flex-direction:column;width:94vw;max-width:820px;height:88vh;max-height:620px;overflow:hidden;animation:sp-slide-up .3s ease}',
      '@keyframes sp-slide-up{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}',

      /* Header */
      '.sp-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #e5e7eb;flex-shrink:0}',
      '.sp-title{font-size:17px;font-weight:600;color:#1f2937}',

      /* Toolbar */
      '.sp-toolbar{display:flex;align-items:center;gap:10px;padding:10px 20px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;flex-shrink:0}',
      '.sp-tool-group{display:flex;align-items:center;gap:6px}',
      '.sp-tool-group::after{content:"";display:block;width:1px;height:24px;background:#e5e7eb;margin:0 4px}',
      '.sp-tool-group:last-child::after{display:none}',

      /* Buttons — general */
      '.sp-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;font-size:13px;cursor:pointer;transition:all .15s ease;user-select:none}',
      '.sp-btn:hover{background:#f9fafb;border-color:#9ca3af}',
      '.sp-btn.sp-active{background:#eff6ff;border-color:#3b82f6;color:#2563eb}',

      /* Color swatches */
      '.sp-color{width:26px;height:26px;border-radius:50%;border:2px solid #d1d5db;cursor:pointer;transition:all .15s ease;padding:0;background:transparent}',
      '.sp-color:hover{transform:scale(1.15)}',
      '.sp-color.sp-active{border-color:#2563eb;box-shadow:0 0 0 2px #93c5fd}',
      '.sp-color-inner{display:block;width:100%;height:100%;border-radius:50%}',

      /* Size buttons */
      '.sp-size{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;transition:all .15s ease;padding:0}',
      '.sp-size:hover{background:#f0f0f0}',
      '.sp-size.sp-active{border-color:#3b82f6;background:#eff6ff}',
      '.sp-size-dot{display:block;border-radius:50%;background:#374151}',

      /* Eraser */
      '.sp-eraser-icon{width:18px;height:18px}',

      /* Canvas area */
      ".sp-canvas-wrap{flex:1;position:relative;overflow:hidden;cursor:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23222' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'/%3E%3C/svg%3E\") 0 24, auto;background:#fff}",
      '.sp-canvas-wrap canvas{position:absolute;top:0;left:0;touch-action:none}',

      /* Footer */
      '.sp-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 20px;border-top:1px solid #e5e7eb;flex-shrink:0}',
      '.sp-footer .sp-btn-primary{background:#2563eb;color:#fff;border-color:#2563eb;font-weight:500}',
      '.sp-footer .sp-btn-primary:hover{background:#1d4ed8}',
      '.sp-footer .sp-btn-danger{color:#dc2626;border-color:#fca5a5}',
      '.sp-footer .sp-btn-danger:hover{background:#fef2f2}',

      /* Responsive */
      '@media(max-width:600px){.sp-container{width:100vw;height:100vh;max-width:none;max-height:none;border-radius:0}.sp-toolbar{gap:6px;padding:8px 12px}.sp-header,.sp-footer{padding:10px 14px}}',
    ].join('\n');
  }

  // ── SVG Icons ──────────────────────────────────────────
  var ICONS = {
    pen: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    eraser: '<svg class="sp-eraser-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16a1 1 0 010-1.41l9.59-9.59a2 2 0 012.82 0L20 9.59a2 2 0 010 2.82L13 19.5"/></svg>',
    undo: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-11.36L1 10"/></svg>',
  };

  // ── 建構子 ─────────────────────────────────────────────
  function SignaturePad(options) {
    this.opts = assign({}, DEFAULTS, options || {});
    this._overlay = null;
    this._canvas = null;
    this._ctx = null;
    this._drawing = false;
    this._mode = 'pen';           // 'pen' | 'eraser'
    this._currentColor = this.opts.penColor;
    this._currentSize = this.opts.penSize;
    this._history = [];           // undo 歷史 (ImageData[])
    this._bound = {};             // 綁定事件快取
    injectStyles();
  }

  // ── 公開方法 ────────────────────────────────────────────
  SignaturePad.prototype.open = function () {
    if (this._overlay) return;
    this._buildUI();
    // Force reflow then show
    this._overlay.offsetHeight; // eslint-disable-line no-unused-expressions
    this._overlay.classList.add('sp-visible');
    this._resizeCanvas();
    this._saveState();
    this._bindEvents();
  };

  SignaturePad.prototype.close = function () {
    if (!this._overlay) return;
    this._unbindEvents();
    this._overlay.classList.remove('sp-visible');
    var self = this;
    setTimeout(function () {
      if (self._overlay && self._overlay.parentNode) {
        self._overlay.parentNode.removeChild(self._overlay);
      }
      self._overlay = null;
      self._canvas = null;
      self._ctx = null;
      self._history = [];
    }, 260);
  };

  SignaturePad.prototype.toDataURL = function () {
    if (!this._canvas) return null;
    return this._canvas.toDataURL(this.opts.outputType, this.opts.outputQuality);
  };

  SignaturePad.prototype.destroy = function () {
    this.close();
  };

  // ── UI 建構 ─────────────────────────────────────────────
  SignaturePad.prototype._buildUI = function () {
    var o = this.opts;

    // Overlay
    var overlay = el('div', 'sp-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    // Container
    var container = el('div', 'sp-container');

    // Header
    var header = el('div', 'sp-header');
    var title = el('span', 'sp-title');
    title.textContent = o.title;
    header.appendChild(title);

    // Toolbar
    var toolbar = el('div', 'sp-toolbar');

    // — Pen/Eraser toggle
    var modeGroup = el('div', 'sp-tool-group');
    var penBtn = el('button', 'sp-btn sp-active');
    penBtn.innerHTML = ICONS.pen + ' 畫筆';
    penBtn.dataset.mode = 'pen';
    penBtn.type = 'button';
    var eraserBtn = el('button', 'sp-btn');
    eraserBtn.innerHTML = ICONS.eraser + ' 橡皮擦';
    eraserBtn.dataset.mode = 'eraser';
    eraserBtn.type = 'button';
    modeGroup.appendChild(penBtn);
    modeGroup.appendChild(eraserBtn);

    // — Colors
    var colorGroup = el('div', 'sp-tool-group');
    var self = this;
    o.colors.forEach(function (c) {
      var btn = el('button', 'sp-color' + (c === self._currentColor ? ' sp-active' : ''));
      btn.type = 'button';
      btn.dataset.color = c;
      btn.title = c;
      btn.setAttribute('aria-label', '顏色 ' + c);
      var inner = el('span', 'sp-color-inner');
      inner.style.background = c;
      btn.appendChild(inner);
      colorGroup.appendChild(btn);
    });

    // — Sizes
    var sizeGroup = el('div', 'sp-tool-group');
    o.sizes.forEach(function (s) {
      var btn = el('button', 'sp-size' + (s === self._currentSize ? ' sp-active' : ''));
      btn.type = 'button';
      btn.dataset.size = s;
      btn.title = s + 'px';
      btn.setAttribute('aria-label', '筆劃粗細 ' + s + 'px');
      var dot = el('span', 'sp-size-dot');
      var d = Math.max(4, Math.min(s * 2, 20));
      dot.style.width = d + 'px';
      dot.style.height = d + 'px';
      btn.appendChild(dot);
      sizeGroup.appendChild(btn);
    });

    toolbar.appendChild(modeGroup);
    toolbar.appendChild(colorGroup);
    toolbar.appendChild(sizeGroup);

    // Canvas wrapper
    var canvasWrap = el('div', 'sp-canvas-wrap');
    var canvas = document.createElement('canvas');
    canvasWrap.appendChild(canvas);

    // Footer
    var footer = el('div', 'sp-footer');
    var undoBtn = el('button', 'sp-btn');
    undoBtn.innerHTML = ICONS.undo + ' ' + o.undoText;
    undoBtn.type = 'button';
    undoBtn.dataset.action = 'undo';
    var clearBtn = el('button', 'sp-btn sp-btn-danger');
    clearBtn.textContent = o.clearText;
    clearBtn.type = 'button';
    clearBtn.dataset.action = 'clear';
    var cancelBtn = el('button', 'sp-btn');
    cancelBtn.textContent = o.cancelText;
    cancelBtn.type = 'button';
    cancelBtn.dataset.action = 'cancel';
    var confirmBtn = el('button', 'sp-btn sp-btn-primary');
    confirmBtn.textContent = o.confirmText;
    confirmBtn.type = 'button';
    confirmBtn.dataset.action = 'confirm';
    footer.appendChild(undoBtn);
    footer.appendChild(clearBtn);
    var spacer = el('div');
    spacer.style.flex = '1';
    footer.appendChild(spacer);
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    // Assemble
    container.appendChild(header);
    container.appendChild(toolbar);
    container.appendChild(canvasWrap);
    container.appendChild(footer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Keep refs
    this._overlay = overlay;
    this._container = container;
    this._canvas = canvas;
    this._canvasWrap = canvasWrap;
    this._ctx = canvas.getContext('2d');
    this._penBtn = penBtn;
    this._eraserBtn = eraserBtn;
  };

  // ── 畫布尺寸 ─────────────────────────────────────────
  SignaturePad.prototype._resizeCanvas = function () {
    var wrap = this._canvasWrap;
    var canvas = this._canvas;
    var dpr = window.devicePixelRatio || 1;
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._clearCanvas();
  };

  SignaturePad.prototype._clearCanvas = function () {
    var ctx = this._ctx;
    var c = this._canvas;
    var dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.opts.backgroundColor;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.restore();
  };

  // ── 歷史紀錄 (Undo) ──────────────────────────────────
  SignaturePad.prototype._saveState = function () {
    if (this._history.length > 30) this._history.shift();
    this._history.push(this._canvas.toDataURL());
  };

  SignaturePad.prototype._undo = function () {
    if (this._history.length <= 1) return;
    this._history.pop(); // 目前的狀態
    var prev = this._history[this._history.length - 1];
    var img = new Image();
    var self = this;
    img.onload = function () {
      self._ctx.save();
      self._ctx.setTransform(1, 0, 0, 1, 0, 0);
      self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height);
      self._ctx.drawImage(img, 0, 0);
      self._ctx.restore();
    };
    img.src = prev;
  };

  // ── 事件處理 ──────────────────────────────────────────
  SignaturePad.prototype._bindEvents = function () {
    var self = this;

    // Resize
    this._bound.resize = function () { self._resizeCanvas(); self._saveState(); };
    window.addEventListener('resize', this._bound.resize);

    // Pointer events on canvas
    this._bound.pointerDown = function (e) { self._onPointerDown(e); };
    this._bound.pointerMove = function (e) { self._onPointerMove(e); };
    this._bound.pointerUp = function (e) { self._onPointerUp(e); };
    this._canvas.addEventListener('pointerdown', this._bound.pointerDown);
    this._canvas.addEventListener('pointermove', this._bound.pointerMove);
    this._canvas.addEventListener('pointerup', this._bound.pointerUp);
    this._canvas.addEventListener('pointerleave', this._bound.pointerUp);

    // Toolbar clicks (delegate)
    this._bound.toolbarClick = function (e) { self._onToolbarClick(e); };
    this._overlay.addEventListener('click', this._bound.toolbarClick);

    // Prevent scroll on touch
    this._bound.touchPrevent = function (e) { e.preventDefault(); };
    this._canvas.addEventListener('touchstart', this._bound.touchPrevent, { passive: false });
    this._canvas.addEventListener('touchmove', this._bound.touchPrevent, { passive: false });

    // ESC to cancel
    this._bound.keydown = function (e) {
      if (e.key === 'Escape') self._cancel();
    };
    document.addEventListener('keydown', this._bound.keydown);
  };

  SignaturePad.prototype._unbindEvents = function () {
    window.removeEventListener('resize', this._bound.resize);
    if (this._canvas) {
      this._canvas.removeEventListener('pointerdown', this._bound.pointerDown);
      this._canvas.removeEventListener('pointermove', this._bound.pointerMove);
      this._canvas.removeEventListener('pointerup', this._bound.pointerUp);
      this._canvas.removeEventListener('pointerleave', this._bound.pointerUp);
      this._canvas.removeEventListener('touchstart', this._bound.touchPrevent);
      this._canvas.removeEventListener('touchmove', this._bound.touchPrevent);
    }
    if (this._overlay) {
      this._overlay.removeEventListener('click', this._bound.toolbarClick);
    }
    document.removeEventListener('keydown', this._bound.keydown);
  };

  // ── 繪圖核心 ──────────────────────────────────────────
  SignaturePad.prototype._getPos = function (e) {
    var rect = this._canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  SignaturePad.prototype._onPointerDown = function (e) {
    if (e.button !== 0) return;
    this._drawing = true;
    this._canvas.setPointerCapture(e.pointerId);
    var pos = this._getPos(e);
    var ctx = this._ctx;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this._mode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = this.opts.eraserSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this._currentColor;
      ctx.lineWidth = this._currentSize;
    }

    // 畫一個點（避免只點一下沒反應）
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();
  };

  SignaturePad.prototype._onPointerMove = function (e) {
    if (!this._drawing) return;
    var pos = this._getPos(e);
    this._ctx.lineTo(pos.x, pos.y);
    this._ctx.stroke();
  };

  SignaturePad.prototype._onPointerUp = function () {
    if (!this._drawing) return;
    this._drawing = false;
    this._ctx.closePath();
    this._ctx.globalCompositeOperation = 'source-over';
    this._saveState();
  };

  // ── Toolbar 點擊代理 ──────────────────────────────────
  SignaturePad.prototype._onToolbarClick = function (e) {
    var target = e.target;

    // Mode toggle (pen / eraser)
    var modeBtn = target.closest('[data-mode]');
    if (modeBtn) {
      this._mode = modeBtn.dataset.mode;
      toggleActive(this._penBtn, this._mode === 'pen');
      toggleActive(this._eraserBtn, this._mode === 'eraser');
      this._canvasWrap.style.cursor = this._mode === 'eraser' ? 'cell' : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23222' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'/%3E%3C/svg%3E\") 0 24, auto";
      return;
    }

    // Color
    var colorBtn = target.closest('[data-color]');
    if (colorBtn) {
      this._currentColor = colorBtn.dataset.color;
      this._mode = 'pen';
      toggleActive(this._penBtn, true);
      toggleActive(this._eraserBtn, false);
      this._canvasWrap.style.cursor = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23222' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'/%3E%3C/svg%3E\") 0 24, auto";
      var colors = this._overlay.querySelectorAll('.sp-color');
      colors.forEach(function (b) { toggleActive(b, b === colorBtn); });
      return;
    }

    // Size
    var sizeBtn = target.closest('[data-size]');
    if (sizeBtn) {
      this._currentSize = parseInt(sizeBtn.dataset.size, 10);
      var sizes = this._overlay.querySelectorAll('.sp-size');
      sizes.forEach(function (b) { toggleActive(b, b === sizeBtn); });
      return;
    }

    // Actions
    var actionBtn = target.closest('[data-action]');
    if (actionBtn) {
      var action = actionBtn.dataset.action;
      if (action === 'confirm') this._confirm();
      else if (action === 'cancel') this._cancel();
      else if (action === 'clear') this._clear();
      else if (action === 'undo') this._undo();
    }
  };

  // ── 動作 ──────────────────────────────────────────────
  SignaturePad.prototype._confirm = function () {
    // 橡皮擦用了 destination-out，產出前先補白底
    var output = this._buildOutputCanvas();
    var dataUrl = output.toDataURL(this.opts.outputType, this.opts.outputQuality);
    if (typeof this.opts.onComplete === 'function') {
      this.opts.onComplete(dataUrl);
    }
    this.close();
  };

  SignaturePad.prototype._buildOutputCanvas = function () {
    var dpr = window.devicePixelRatio || 1;
    var w = this._canvasWrap.clientWidth;
    var h = this._canvasWrap.clientHeight;
    var out = document.createElement('canvas');
    out.width = w * dpr;
    out.height = h * dpr;
    var ctx = out.getContext('2d');
    ctx.fillStyle = this.opts.backgroundColor;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(this._canvas, 0, 0);
    return out;
  };

  SignaturePad.prototype._cancel = function () {
    if (typeof this.opts.onCancel === 'function') {
      this.opts.onCancel();
    }
    this.close();
  };

  SignaturePad.prototype._clear = function () {
    this._clearCanvas();
    this._history = [];
    this._saveState();
  };

  // ── 工具函式 ──────────────────────────────────────────
  function el(tag, className) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  function toggleActive(element, isActive) {
    if (isActive) element.classList.add('sp-active');
    else element.classList.remove('sp-active');
  }

  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      for (var key in src) {
        if (src.hasOwnProperty(key)) target[key] = src[key];
      }
    }
    return target;
  }

  return SignaturePad;
}));
