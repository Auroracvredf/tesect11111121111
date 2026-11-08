/* GPU//RADAR — application */
(function () {
  'use strict';

  const DATA = window.GPU_DATA;
  if (!DATA) return;

  const { products, index: marketIndex, market, brands } = DATA;
  const ALERT_KEY = 'gpu-radar-alerts-v1';

  const state = {
    brand: 'all',
    query: '',
    price: 'all',
    sort: 'featured',
    onlyDrops: false,
    compare: [],
    range: 30
  };

  const refs = {
    cardsGrid: document.getElementById('cards-grid'),
    emptyState: document.getElementById('empty-state'),
    totalCount: document.getElementById('total-count'),
    filterSummary: document.getElementById('filter-summary'),
    search: document.getElementById('search-input'),
    brandTabs: document.getElementById('brand-tabs'),
    priceFilter: document.getElementById('price-filter'),
    sortFilter: document.getElementById('sort-filter'),
    onlyDrops: document.getElementById('only-drops'),
    resetFilters: document.getElementById('reset-filters'),
    emptyReset: document.getElementById('empty-reset'),
    ticker: document.getElementById('ticker-track'),
    marketChart: document.getElementById('market-chart'),
    notesGrid: document.getElementById('notes-grid'),
    detailLayer: document.getElementById('detail-layer'),
    detailContent: document.getElementById('detail-content'),
    compareLayer: document.getElementById('compare-layer'),
    compareContent: document.getElementById('compare-content'),
    alertsLayer: document.getElementById('alerts-layer'),
    alertsContent: document.getElementById('alerts-content'),
    compareTray: document.getElementById('compare-tray'),
    trayItems: document.getElementById('tray-items'),
    trayCount: document.getElementById('tray-count'),
    trayStart: document.getElementById('tray-start'),
    trayClear: document.getElementById('tray-clear'),
    alertCount: document.getElementById('alert-count'),
    alertsOpen: document.getElementById('alerts-open'),
    toast: document.getElementById('toast'),
    mobileMenuButton: document.getElementById('mobile-menu-button'),
    mobileNav: document.getElementById('mobile-nav')
  };

  let detailProduct = null;
  let toastTimer = null;
  let trayTimer = null;
  let lastFocus = null;
  let alertsStore = loadAlerts();

  /* ---------------------------------------------------------
     Small helpers
     --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(value) {
    return '¥' + Math.round(value).toLocaleString('zh-CN');
  }

  function number(value) {
    return Math.round(value).toLocaleString('zh-CN');
  }

  function decimal(value, digits = 1) {
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function signedPercent(value, digits = 1) {
    const sign = value > 0 ? '+' : '';
    return sign + decimal(value, digits) + '%';
  }

  function signedMoney(value) {
    return (value > 0 ? '+' : value < 0 ? '−' : '') + money(Math.abs(value)).replace('¥', '¥ ');
  }

  function deltaClass(value) {
    if (value > 10) return 'is-up';
    if (value < -10) return 'is-down';
    return 'is-flat';
  }

  function deltaArrow(value) {
    if (value > 10) return '↑';
    if (value < -10) return '↓';
    return '—';
  }

  function deltaLabel(product) {
    if (Math.abs(product.dayChange) <= 10 || Math.abs(product.dayPct) < 0.05) return '持平';
    return `${deltaArrow(product.dayChange)} ${decimal(Math.abs(product.dayPct), 1)}%`;
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* Local storage can be unavailable for file:// documents. */
    }
  }

  function loadAlerts() {
    const raw = safeStorageGet(ALERT_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      const valid = {};
      products.forEach((product) => {
        const target = Number(parsed[product.id]);
        if (Number.isFinite(target) && target > 0) valid[product.id] = Math.round(target);
      });
      return valid;
    } catch (error) {
      return {};
    }
  }

  function saveAlerts() {
    safeStorageSet(ALERT_KEY, JSON.stringify(alertsStore));
  }

  function getProduct(productId) {
    return products.find((product) => product.id === productId);
  }

  function updateAlertCount() {
    const count = Object.keys(alertsStore).filter((id) => getProduct(id)).length;
    refs.alertCount.textContent = String(count);
    refs.alertCount.hidden = count === 0;
    refs.alertsOpen.setAttribute('aria-label', count ? `查看 ${count} 个价格提醒` : '查看价格提醒');
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    refs.toast.textContent = message;
    refs.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      refs.toast.classList.remove('is-visible');
    }, 2600);
  }

  function closeMobileNav() {
    refs.mobileNav.hidden = true;
    refs.mobileMenuButton.setAttribute('aria-expanded', 'false');
  }

  /* ---------------------------------------------------------
     SVG helpers
     --------------------------------------------------------- */

  function smoothPath(points) {
    if (!points.length) return '';
    if (points.length === 1) return `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    let path = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return path;
  }

  function makeSparkline(values, color) {
    const width = 100;
    const height = 30;
    const pad = 3;
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const span = max - min || 1;
    const points = values.map((value, index) => ({
      x: pad + (index / (values.length - 1)) * (width - pad * 2),
      y: pad + (1 - (value - min) / span) * (height - pad * 2)
    }));
    const line = smoothPath(points);
    const area = `${line} L${(width - pad).toFixed(2)} ${height - pad} L${pad} ${height - pad} Z`;
    const last = points[points.length - 1];

    return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${area}" fill="${color}" opacity=".08"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="1.25" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="1.7" fill="${color}"/>
    </svg>`;
  }

  function productSVG(product) {
    const uid = product.id.replace(/[^a-z0-9]/g, '');
    const color = product.brandMeta.color;
    const fanPositions = product.fans === 3 ? [127, 231, 335] : [157, 305];
    const fanRadius = product.fans === 3 ? 41 : 44;
    const brandLine = {
      NVIDIA: 'GEFORCE RTX',
      AMD: 'RADEON RX',
      Intel: 'INTEL ARC'
    }[product.brand];
    const fanLabel = product.brand === 'NVIDIA' ? 'RTX' : product.brand === 'AMD' ? 'RX' : 'ARC';

    const fans = fanPositions.map((cx) => {
      const blades = Array.from({ length: 7 }, (_, blade) => {
        const angle = blade * (360 / 7);
        return `<g transform="rotate(${angle.toFixed(2)})">
          <path d="M0 -6C12 -27 31 -22 29 -6C27 6 11 7 0 -6Z" fill="#1b1f21" stroke="#363b3e" stroke-width=".7"/>
          <path d="M4 -9C13 -20 23 -18 24 -8" fill="none" stroke="#4c5356" stroke-width=".55" opacity=".5"/>
        </g>`;
      }).join('');

      return `<g>
        <circle cx="${cx}" cy="99" r="${fanRadius}" fill="#090b0b" stroke="#3b4144" stroke-width="1"/>
        <circle cx="${cx}" cy="99" r="${fanRadius - 5}" fill="url(#fan-${uid})"/>
        <g transform="translate(${cx} 99)"><g class="fan-rotor">${blades}</g></g>
        <circle cx="${cx}" cy="99" r="8.2" fill="#0b0e0f" stroke="#454c4f" stroke-width="1"/>
        <circle cx="${cx}" cy="99" r="2.1" fill="${color}" opacity=".8"/>
      </g>`;
    }).join('');

    const centerMark = product.fans === 2
      ? `<text x="231" y="102" text-anchor="middle" fill="${color}" opacity=".45" font-family="Bahnschrift, sans-serif" font-size="10" letter-spacing="2">${fanLabel}</text>`
      : '';

    return `<svg class="gpu-svg" viewBox="0 0 460 236" role="img" aria-label="${escapeHTML(product.name)} 显卡示意图">
      <defs>
        <linearGradient id="shroud-${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#353a3c"/>
          <stop offset=".28" stop-color="#222729"/>
          <stop offset=".67" stop-color="#15191a"/>
          <stop offset="1" stop-color="#292d2f"/>
        </linearGradient>
        <linearGradient id="metal-${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#b3babc"/>
          <stop offset=".45" stop-color="#62696c"/>
          <stop offset="1" stop-color="#92999c"/>
        </linearGradient>
        <radialGradient id="fan-${uid}" cx=".5" cy=".45" r=".6">
          <stop offset="0" stop-color="#292e30"/>
          <stop offset=".7" stop-color="#111415"/>
          <stop offset="1" stop-color="#080909"/>
        </radialGradient>
        <linearGradient id="accent-${uid}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${color}" stop-opacity=".1"/>
          <stop offset=".5" stop-color="${color}" stop-opacity=".9"/>
          <stop offset="1" stop-color="${color}" stop-opacity=".08"/>
        </linearGradient>
        <filter id="blur-${uid}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="15"/>
        </filter>
      </defs>

      <ellipse cx="232" cy="205" rx="170" ry="19" fill="#000" opacity=".55" filter="url(#blur-${uid})"/>
      <ellipse cx="232" cy="200" rx="152" ry="7" fill="#000" opacity=".55"/>

      <g transform="translate(14 18) rotate(-3 230 100)">
        <g>
          <rect x="2" y="42" width="30" height="130" rx="3" fill="url(#metal-${uid})" stroke="#c9cfd1" stroke-opacity=".25"/>
          <rect x="5" y="48" width="24" height="28" rx="2" fill="#0b0d0e" opacity=".9"/>
          <rect x="5" y="82" width="24" height="28" rx="2" fill="#0b0d0e" opacity=".9"/>
          <rect x="5" y="116" width="24" height="22" rx="2" fill="#0b0d0e" opacity=".9"/>
          <circle cx="17" cy="139" r="2.4" fill="#202426"/>
          <circle cx="17" cy="34" r="2.4" fill="#202426"/>
        </g>

        <rect x="30" y="48" width="395" height="120" rx="10" fill="#070808" stroke="#262a2c"/>
        <rect x="37" y="54" width="382" height="108" rx="8" fill="#0c0e0f"/>
        <rect x="30" y="36" width="395" height="124" rx="9" fill="url(#shroud-${uid})" stroke="#4b5154" stroke-opacity=".55"/>
        <path d="M41 38H414" stroke="#fff" stroke-opacity=".13"/>
        <path d="M34 151H421" stroke="#000" stroke-opacity=".48"/>
        <rect x="48" y="39" width="126" height="2" rx="1" fill="url(#accent-${uid})"/>
        <path d="M42 45h23l-8 97H42Z" fill="${color}" opacity=".1"/>
        <path d="M42 45h2v97h-2Z" fill="${color}" opacity=".55"/>

        ${fans}
        ${centerMark}

        <rect x="43" y="140" width="368" height="12" rx="2" fill="#080a0a" opacity=".48"/>
        <text x="49" y="149" fill="#adb1ad" font-family="Bahnschrift, sans-serif" font-size="6" letter-spacing="1.1">${brandLine}</text>
        <text x="404" y="149" text-anchor="end" fill="${color}" font-family="Bahnschrift, sans-serif" font-size="6" letter-spacing=".7">${product.short.toUpperCase()}</text>

        <rect x="338" y="24" width="52" height="13" rx="2" fill="#0b0d0d" stroke="#3e4447"/>
        <rect x="343" y="27" width="42" height="7" rx="1" fill="#202527"/>
        <path d="M348 30h32M348 34h32" stroke="#3a4144" stroke-width=".7"/>

        <circle cx="45" cy="47" r="2" fill="#080909"/>
        <circle cx="408" cy="47" r="2" fill="#080909"/>
        <circle cx="45" cy="148" r="2" fill="#080909"/>
        <rect x="391" y="141" width="20" height="3" rx="1.5" fill="${color}" opacity=".7"/>
      </g>
    </svg>`;
  }

  /* ---------------------------------------------------------
     Hero market index
     --------------------------------------------------------- */

  function renderMarketChart() {
    const values = marketIndex.history.slice(-30).map((entry) => entry.value);
    const width = 440;
    const height = 155;
    const padding = { left: 2, right: 2, top: 13, bottom: 4 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const spread = Math.max(max - min, 2);
    const low = min - spread * 0.22;
    const high = max + spread * 0.18;

    const points = values.map((value, i) => ({
      x: padding.left + (i / (values.length - 1)) * plotWidth,
      y: padding.top + (1 - (value - low) / (high - low)) * plotHeight
    }));
    const line = smoothPath(points);
    const area = `${line} L${width - padding.right} ${height} L${padding.left} ${height} Z`;
    const last = points[points.length - 1];
    const grids = [0.2, 0.5, 0.8].map((ratio) => {
      const y = padding.top + plotHeight * ratio;
      return `<line x1="${padding.left}" y1="${y.toFixed(2)}" x2="${width - padding.right}" y2="${y.toFixed(2)}" stroke="#f2f1ea" stroke-opacity=".075" stroke-dasharray="2 5"/>`;
    }).join('');

    refs.marketChart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="market-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d8ff47" stop-opacity=".3"/>
          <stop offset="1" stop-color="#d8ff47" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${grids}
      <path d="${area}" fill="url(#market-area)"/>
      <path d="${line}" fill="none" stroke="#d8ff47" stroke-width="1.7" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="8" fill="#d8ff47" opacity=".12"/>
      <circle cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="3.2" fill="#d8ff47"/>
      <circle cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="1.2" fill="#0b0c0c"/>
    </svg>`;
  }

  function renderMarketSummary() {
    document.getElementById('index-value').textContent = decimal(marketIndex.value, 1);
    const indexChange = document.getElementById('index-change');
    const direction = marketIndex.pct30 < 0 ? 'is-down' : 'is-up';
    indexChange.className = `index-change ${direction}`;
    indexChange.innerHTML = `<span>${marketIndex.pct30 < 0 ? '↓' : '↑'}</span>${decimal(Math.abs(marketIndex.pct30), 1)}%`;
    document.getElementById('index-caption').textContent =
      `${marketIndex.change30 < 0 ? '下降' : '上升'} ${decimal(Math.abs(marketIndex.change30), 1)} 点`;
    document.getElementById('market-down').textContent = String(market.down);
    document.getElementById('market-up').textContent = String(market.up);
    document.getElementById('market-flat').textContent = String(market.flat);
    document.getElementById('market-median').textContent = money(market.median);
    const average = products.reduce((sum, product) => sum + Math.abs(product.pct30), 0) / products.length;
    document.getElementById('market-avg').textContent = `±${decimal(average, 1)}%`;
    renderMarketChart();
  }

  /* ---------------------------------------------------------
     Ticker
     --------------------------------------------------------- */

  function renderTicker() {
    const item = (product, hidden) => {
      const cls = product.dayChange > 10 ? 'is-up' : product.dayChange < -10 ? 'is-down' : 'is-flat';
      const text = Math.abs(product.dayChange) <= 10
        ? '持平'
        : `${deltaArrow(product.dayChange)}${decimal(Math.abs(product.dayPct), 1)}%`;
      return `<div class="ticker-item"${hidden ? ' aria-hidden="true"' : ''}>
        <span class="ticker-dot" style="background:${product.brandMeta.color}"></span>
        <span class="ticker-name">${escapeHTML(product.short)}</span>
        <span class="ticker-price">${money(product.current)}</span>
        <span class="ticker-delta ${cls}">${text}</span>
      </div>`;
    };
    const markup = products.map((product) => item(product, false)).join('');
    refs.ticker.innerHTML = markup + products.map((product) => item(product, true)).join('');
  }

  /* ---------------------------------------------------------
     Catalog
     --------------------------------------------------------- */

  function renderBrandCounts() {
    const counts = {
      all: products.length,
      NVIDIA: products.filter((product) => product.brand === 'NVIDIA').length,
      AMD: products.filter((product) => product.brand === 'AMD').length,
      Intel: products.filter((product) => product.brand === 'Intel').length
    };
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-nvidia').textContent = counts.NVIDIA;
    document.getElementById('count-amd').textContent = counts.AMD;
    document.getElementById('count-intel').textContent = counts.Intel;
  }

  function filteredProducts() {
    const query = state.query.trim().toLowerCase();
    let result = products.filter((product) => {
      if (state.brand !== 'all' && product.brand !== state.brand) return false;
      if (query && !`${product.name} ${product.short} ${product.brand} ${product.series} ${product.chip} ${product.vram}`
        .toLowerCase()
        .includes(query)) return false;

      if (state.price !== 'all') {
        const [min, max] = state.price.split('-').map(Number);
        if (product.current < min || product.current > max) return false;
      }
      if (state.onlyDrops && product.dayChange >= 0) return false;
      return true;
    });

    switch (state.sort) {
      case 'price-asc':
        result = result.slice().sort((a, b) => a.current - b.current);
        break;
      case 'drop-desc':
        result = result.slice().sort((a, b) => a.pct30 - b.pct30);
        break;
      case 'perf-desc':
        result = result.slice().sort((a, b) => b.perf - a.perf);
        break;
      case 'new-low':
        result = result.slice().sort((a, b) => (a.current - a.low) - (b.current - b.low));
        break;
      default:
        break;
    }
    return result;
  }

  function cardBadge(product) {
    if (!product.badge) return '';
    const tone = product.badge === '历史新低'
      ? 'low'
      : product.badge === '30 日低价'
        ? 'near'
        : product.badge === '今日涨价'
          ? 'rise'
          : 'drop';
    return `<span class="card-badge ${tone}">${product.badge}</span>`;
  }

  function cardMarkup(product, index) {
    const dayTone = deltaClass(product.dayChange);
    const trendColor = product.pct30 <= 0 ? '#46d7a2' : '#ff6c5e';
    const selected = state.compare.includes(product.id);
    const compareLabel = selected ? '已选' : '对比';
    return `<article class="gpu-card" data-id="${product.id}" tabindex="0" role="button" aria-label="查看 ${escapeHTML(product.name)} 的价格走势" style="--brand:${product.brandMeta.color};--i:${index}">
      <div class="card-top">
        <span class="brand-chip"><i></i>${product.brandMeta.label}</span>
        <button class="compare-card-button${selected ? ' is-selected' : ''}" type="button" data-compare="${product.id}" aria-pressed="${selected}" aria-label="${selected ? '从对比中移除' : '将 ' + escapeHTML(product.name) + ' 加入对比'}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          <span>${compareLabel}</span>
        </button>
      </div>
      <div class="gpu-art">
        <span class="art-index">${String(index + 1).padStart(2, '0')} / ${products.length}</span>
        ${productSVG(product)}
        ${cardBadge(product)}
      </div>
      <div class="card-body">
        <div class="card-kicker">
          <span>${product.series} · ${product.chip}</span>
          <span class="card-open">详情 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </div>
        <h3>${product.name}</h3>
        <div class="spec-line">${product.vram}<i></i>${product.tdp}W<i></i>性能 ${product.perf}</div>
        <div class="price-row">
          <span class="price"><span class="currency">¥</span><span class="amount">${number(product.current)}</span></span>
          <span class="delta ${dayTone}">${deltaLabel(product)}</span>
        </div>
        <div class="card-foot">
          <span class="lowest-info">90 天最低<strong>${money(product.low)}</strong></span>
          <span class="sparkline-wrap"><span>30D</span>${makeSparkline(product.history.slice(-30).map((entry) => entry.price), trendColor)}</span>
        </div>
      </div>
    </article>`;
  }

  function renderCards() {
    const list = filteredProducts();
    refs.cardsGrid.innerHTML = list.map((product, index) => cardMarkup(product, index)).join('');
    refs.emptyState.hidden = list.length !== 0;
    refs.cardsGrid.hidden = list.length === 0;
    refs.totalCount.textContent = String(products.length);

    const parts = [];
    if (state.brand !== 'all') parts.push(state.brand);
    if (state.price !== 'all') {
      const labels = {
        '0-2000': '¥2,000 以下',
        '2000-4000': '¥2,000–4,000',
        '4000-8000': '¥4,000–8,000',
        '8000-99999': '¥8,000 以上'
      };
      parts.push(labels[state.price]);
    }
    if (state.onlyDrops) parts.push('只看降价');
    if (state.query.trim()) parts.push(`搜索“${state.query.trim()}”`);

    let summary = parts.length
      ? `找到 <b>${list.length}</b> 款 · ${parts.map(escapeHTML).join(' · ')}`
      : `显示全部 <b>${list.length}</b> 款显卡`;
    if (state.sort !== 'featured') {
      const sortLabels = {
        'price-asc': '价格从低到高',
        'drop-desc': '近 30 天降幅',
        'perf-desc': '性能从高到低',
        'new-low': '历史低点优先'
      };
      summary += ` · 按${sortLabels[state.sort]}`;
    }
    refs.filterSummary.innerHTML = summary;

    const active = state.brand !== 'all' || state.price !== 'all' || state.onlyDrops || state.query.trim() || state.sort !== 'featured';
    refs.resetFilters.hidden = !active;
    updateCompareButtons();
  }

  function syncControls() {
    refs.brandTabs.querySelectorAll('[data-brand]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.brand === state.brand);
      button.setAttribute('aria-pressed', button.dataset.brand === state.brand);
    });
    refs.priceFilter.value = state.price;
    refs.sortFilter.value = state.sort;
    refs.onlyDrops.checked = state.onlyDrops;
    refs.search.value = state.query;
  }

  function resetFilters({ silent = false } = {}) {
    state.brand = 'all';
    state.query = '';
    state.price = 'all';
    state.sort = 'featured';
    state.onlyDrops = false;
    syncControls();
    renderCards();
    if (!silent) showToast('筛选已重置');
  }

  function scrollToCatalog() {
    const catalog = document.getElementById('catalog');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setDetailHash(productId) {
    try {
      const url = new URL(window.location.href);
      url.hash = `gpu=${productId}`;
      window.history.replaceState(null, '', url);
    } catch (error) {
      /* History is unavailable on some file:// setups. */
    }
  }

  function clearDetailHash() {
    try {
      const url = new URL(window.location.href);
      if (url.hash.startsWith('#gpu=')) {
        url.hash = '';
        window.history.replaceState(null, '', url);
      }
    } catch (error) {
      /* History is unavailable on some file:// setups. */
    }
  }

  function syncDetailRoute() {
    const route = window.location.hash.match(/^#gpu=([^&]+)$/);
    if (!route) {
      if (!refs.detailLayer.hidden) closeLayer(refs.detailLayer);
      return;
    }
    const productId = decodeURIComponent(route[1]);
    if (!getProduct(productId)) return;
    if (refs.detailLayer.hidden || !detailProduct || detailProduct.id !== productId) {
      openDetail(productId, { updateHash: false });
    }
  }

  function actOnDrops() {
    state.onlyDrops = false;
    state.sort = 'drop-desc';
    state.brand = 'all';
    state.price = 'all';
    state.query = '';
    syncControls();
    renderCards();
    closeMobileNav();
    scrollToCatalog();
    showToast('已按近 30 天降幅排序');
  }

  /* ---------------------------------------------------------
     Price notes
     --------------------------------------------------------- */

  function renderNotes() {
    const value = products.reduce((best, product) => {
      const score = product.perf / product.current;
      return score > best.perf / best.current ? product : best;
    }, products[0]);
    const drop = products
      .filter((product) => product.id !== value.id)
      .reduce((best, product) => (product.pct30 < best.pct30 ? product : best), products.find((product) => product.id !== value.id) || products[0]);
    const pricey = products.reduce((best, product) => (product.current > best.current ? product : best), products[0]);
    const valueScore = (value.perf / value.current) * 1000;
    const gapToLow = Math.max(0, drop.current - drop.low);

    const cards = [
      {
        index: '01',
        tag: '30 天降幅',
        title: `${drop.name}，正在领跌`,
        text: gapToLow <= 60
          ? `近 30 天下调 ${decimal(Math.abs(drop.pct30), 1)}%，现价 ${money(drop.current)}。已经贴近 90 天低点，只差 ${money(gapToLow)}。`
          : `近 30 天下调 ${decimal(Math.abs(drop.pct30), 1)}%，现价 ${money(drop.current)}。距离 90 天低点还有 ${money(gapToLow)} 的空间。`,
        footLeft: `现价 ${money(drop.current)}`,
        footValue: signedPercent(drop.pct30),
        footClass: 'is-down'
      },
      {
        index: '02',
        tag: '高位观察',
        title: `${pricey.name}，仍在高位`,
        text: `当前报价 ${money(pricey.current)}，处于 90 天价格区间的 ${Math.round(pricey.rangePosition * 100)}% 位置。旗舰卡的溢价还没完全退。`,
        footLeft: `90 天区间 ${money(pricey.low)} – ${money(pricey.high)}`,
        footValue: signedPercent(pricey.pct30),
        footClass: pricey.pct30 > 0 ? 'is-up' : 'is-down'
      },
      {
        index: '03',
        tag: '每千元性能',
        title: `${value.name}，最会算账`,
        text: `性能指数 ${value.perf}，折合每千元 ${decimal(valueScore, 1)} 分。在 ${money(value.current)} 这个价位，它是更稳的选择。`,
        footLeft: `每千元 ${decimal(valueScore, 1)} 分`,
        footValue: money(value.current),
        footClass: ''
      }
    ];

    refs.notesGrid.innerHTML = cards.map((card) => `<article class="note-card">
      <div class="note-top">
        <span class="note-index">${card.index}</span>
        <span class="note-tag">${card.tag}</span>
      </div>
      <h3>${card.title}</h3>
      <p>${card.text}</p>
      <div class="note-foot">
        <span>${card.footLeft}</span>
        <span><b class="${card.footClass}">${card.footValue}</b> <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>
    </article>`).join('');
  }

  /* ---------------------------------------------------------
     Detail drawer
     --------------------------------------------------------- */

  function rangeValues(product, days) {
    const history = product.history.slice(-days);
    const prices = history.map((entry) => entry.price);
    const low = Math.min.apply(null, prices);
    const high = Math.max.apply(null, prices);
    const avg = Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length);
    const lowEntry = history.find((entry) => entry.price === low);
    return { history, prices, low, high, avg, lowDate: lowEntry.fullLabel };
  }

  function statsMarkup(product, days) {
    const stats = rangeValues(product, days);
    return `<div class="detail-stat"><span>当前报价</span><strong>${money(product.current)}</strong></div>
      <div class="detail-stat"><span>${days} 天最低</span><strong data-stat="low">${money(stats.low)}</strong></div>
      <div class="detail-stat"><span>${days} 天最高</span><strong data-stat="high">${money(stats.high)}</strong></div>
      <div class="detail-stat"><span>${days} 天均价</span><strong data-stat="avg">${money(stats.avg)}</strong></div>`;
  }

  function alertBoxInner(product) {
    const target = alertsStore[product.id];
    const defaultTarget = Math.max(100, Math.floor((product.current - 100) / 10) * 10);
    const status = target
      ? `<div class="alert-status">
          <span>${product.current <= target ? '已触达' : '监测中'} · 目标 <b>${money(target)}</b> · 当前 ${money(product.current)}</span>
          <button class="alert-remove" type="button" data-remove-alert>取消提醒</button>
        </div>`
      : '';

    return `<div class="alert-copy">
      <span class="alert-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <div>
        <h3>降价时通知我</h3>
        <p>设一个心理价位。价格触达后，这里会标记为「已触达」。</p>
      </div>
    </div>
    <form class="alert-form" id="price-alert-form">
      <label class="alert-input-wrap">
        <span>¥</span>
        <input id="price-alert-input" type="number" min="1" step="1" inputmode="numeric" value="${target || defaultTarget}" aria-label="目标提醒价格">
      </label>
      <button class="button button-primary" type="submit">${target ? '更新提醒' : '设置提醒'}</button>
    </form>
    ${status}`;
  }

  function detailMarkup(product) {
    const dayTone = deltaClass(product.dayChange);
    const dayAmount = product.dayChange === 0 ? '持平' : `${deltaArrow(product.dayChange)} ${money(Math.abs(product.dayChange))} · ${decimal(Math.abs(product.dayPct), 1)}%`;
    const offers = product.offers.map((offer) => `<button class="offer-row" type="button" data-offer="${escapeHTML(offer.store)}">
      <span class="offer-logo ${offer.tone}">${offer.short}</span>
      <span class="offer-main">
        <span class="offer-store">${offer.store}${offer.best ? '<span class="best-tag">最低</span>' : ''}</span>
        <span class="offer-note">${offer.note} · ${offer.updated}更新</span>
      </span>
      <span class="offer-stock"><b class="${offer.stockTone === 'warn' ? 'warn' : offer.stockTone === 'muted' ? 'muted' : ''}">${offer.stock}</b><span>含税</span></span>
      <span class="offer-price"><small>¥</small>${number(offer.price)}</span>
    </button>`).join('');

    const events = product.events.map((event) => `<div class="event-row">
      <span class="event-dot ${event.kind}"></span>
      <span class="event-date">${event.date}</span>
      <span class="event-text">${event.store}调价 · 现价 <b>${money(event.price)}</b></span>
      <span class="event-delta ${event.kind}">${event.delta < 0 ? '↓' : '↑'} ${money(Math.abs(event.delta)).replace('¥', '¥ ')}</span>
    </div>`).join('');

    return `<div class="drawer-top">
      <span class="drawer-brand" style="--brand:${product.brandMeta.color}"><i></i>${product.brandMeta.label} / ${product.series}</span>
      <button class="icon-button" type="button" data-close-detail aria-label="关闭详情">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="drawer-title-row">
      <div>
        <p class="drawer-series">${product.chip} · ${product.vram} · ${product.tdp}W</p>
        <h2 id="detail-title">${product.name}</h2>
        <div class="drawer-specs">
          <span class="spec-chip">${product.vram}</span>
          <span class="spec-chip">${product.tdp}W</span>
          <span class="spec-chip">性能指数 ${product.perf}</span>
          <span class="spec-chip">${product.chip}</span>
        </div>
      </div>
      <div class="drawer-price">
        <span class="price"><span class="currency">¥</span><span class="amount">${number(product.current)}</span></span>
        <div class="drawer-delta">较昨日 <span class="delta ${dayTone}">${dayAmount}</span></div>
      </div>
    </div>

    <div class="detail-chart-panel">
      <div class="chart-head">
        <div>
          <h3>PRICE HISTORY / CNY</h3>
          <p class="chart-highlight" id="chart-highlight">近 30 天低点 <b>—</b></p>
        </div>
        <div class="range-tabs" role="group" aria-label="价格走势时间范围">
          <button class="range-tab" type="button" data-range="7">7 天</button>
          <button class="range-tab is-active" type="button" data-range="30">30 天</button>
          <button class="range-tab" type="button" data-range="90">90 天</button>
        </div>
      </div>
      <div class="detail-chart" id="detail-chart" aria-label="${escapeHTML(product.name)} 的价格走势"></div>
    </div>

    <div class="detail-stats">
      ${statsMarkup(product, 30)}
    </div>

    <div class="range-meter">
      <div class="range-meter-head">
        <span>90 天价格位置</span>
        <span>当前处于 <b>${Math.round(product.rangePosition * 100)}%</b></span>
      </div>
      <div class="range-meter-bar" style="--position:${(product.rangePosition * 100).toFixed(1)}%">
        <span class="range-meter-dot"></span>
      </div>
      <div class="range-meter-labels">
        <span>低 ${money(product.low)}</span>
        <span>高 ${money(product.high)}</span>
      </div>
    </div>

    <section class="detail-section">
      <div class="detail-section-head">
        <h3>渠道报价</h3>
        <span>4 个渠道 · 含税价</span>
      </div>
      <div class="offer-list">${offers}</div>
    </section>

    <section class="detail-alert" id="detail-alert">
      ${alertBoxInner(product)}
    </section>

    <section class="detail-section">
      <div class="detail-section-head">
        <h3>价格事件</h3>
        <span>近 90 天 · 自动记录</span>
      </div>
      <div class="event-list">${events}</div>
    </section>

    <p class="drawer-footnote">* 本页为前端演示项目，价格、渠道与更新时间为模拟数据，不构成购买建议。</p>`;
  }

  function chartMarkup(product, days) {
    const stats = rangeValues(product, days);
    const width = 760;
    const height = 304;
    const padding = { left: 7, right: 53, top: 14, bottom: 30 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const spread = Math.max(stats.high - stats.low, 1);
    const low = stats.low - spread * 0.12;
    const high = stats.high + spread * 0.12;

    const points = stats.history.map((entry, index) => ({
      x: padding.left + (index / (stats.history.length - 1)) * plotWidth,
      y: padding.top + (1 - (entry.price - low) / (high - low)) * plotHeight,
      entry,
      index
    }));
    const line = smoothPath(points);
    const area = `${line} L${width - padding.right} ${height - padding.bottom} L${padding.left} ${height - padding.bottom} Z`;
    const last = points[points.length - 1];

    const yTicks = [0, 1, 2, 3].map((tick) => {
      const ratio = tick / 3;
      const value = high - (high - low) * ratio;
      const y = padding.top + plotHeight * ratio;
      return {
        y,
        label: money(value),
        line: `<line x1="${padding.left}" y1="${y.toFixed(2)}" x2="${width - padding.right}" y2="${y.toFixed(2)}" stroke="#f2f1ea" stroke-opacity="${tick === 0 || tick === 3 ? '0.1' : '0.065'}" stroke-dasharray="2 6"/>`,
        text: `<text x="${width - padding.right + 8}" y="${(y + 3).toFixed(2)}" fill="#70746f" font-family="Cascadia Code, monospace" font-size="8">${money(value)}</text>`
      };
    });

    const xTickCount = 4;
    const xTicks = Array.from({ length: xTickCount }, (_, tick) => {
      const index = Math.round((tick / (xTickCount - 1)) * (stats.history.length - 1));
      const point = points[index];
      return `<text x="${point.x.toFixed(2)}" y="${height - 7}" text-anchor="${tick === 0 ? 'start' : tick === xTickCount - 1 ? 'end' : 'middle'}" fill="#70746f" font-family="Cascadia Code, monospace" font-size="8">${stats.history[index].label}</text>`;
    }).join('');

    const result = {
      html: `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${days} 天价格走势">
        <defs>
          <linearGradient id="detail-area-${product.id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#d8ff47" stop-opacity=".22"/>
            <stop offset=".86" stop-color="#d8ff47" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${yTicks.map((tick) => tick.line).join('')}
        ${yTicks.map((tick) => tick.text).join('')}
        <path d="${area}" fill="url(#detail-area-${product.id})"/>
        <path d="${line}" fill="none" stroke="#d8ff47" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="9" fill="#d8ff47" opacity=".1"/>
        <circle cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="3.3" fill="#d8ff47" stroke="#0c0d0d" stroke-width="1.5"/>
        ${xTicks}
        <g class="chart-tip" opacity="0" pointer-events="none">
          <line class="tip-line" x1="0" y1="${padding.top}" x2="0" y2="${height - padding.bottom}" stroke="#f2f1ea" stroke-opacity=".2" stroke-dasharray="2 4"/>
          <circle class="tip-dot" cx="0" cy="0" r="3.6" fill="#d8ff47" stroke="#0c0d0d" stroke-width="1.5"/>
          <g class="tip-box">
            <rect width="132" height="47" rx="5" fill="#1b1e1c" stroke="#41463f"/>
            <text class="tip-date" x="9" y="17" fill="#8f938c" font-family="Cascadia Code, monospace" font-size="8"></text>
            <text class="tip-price" x="9" y="35" fill="#f2f1ea" font-family="Bahnschrift, sans-serif" font-size="14"></text>
          </g>
        </g>
        <rect class="chart-hit" x="${padding.left}" y="${padding.top}" width="${plotWidth}" height="${plotHeight}" fill="transparent"/>
      </svg>`,
      points,
      padding,
      width,
      height,
      plotHeight,
      plotBottom: height - padding.bottom,
      stats
    };
    return result;
  }

  function bindChartHover() {
    const container = document.getElementById('detail-chart');
    if (!container || !detailProduct) return;
    const svg = container.querySelector('svg');
    if (!svg) return;
    const days = state.range;
    const built = chartMarkup(detailProduct, days);
    const points = built.points;
    const tip = svg.querySelector('.chart-tip');
    const tipLine = svg.querySelector('.tip-line');
    const tipDot = svg.querySelector('.tip-dot');
    const tipBox = svg.querySelector('.tip-box');
    const tipDate = svg.querySelector('.tip-date');
    const tipPrice = svg.querySelector('.tip-price');

    const update = (event) => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      const viewX = ((event.clientX - rect.left) / rect.width) * built.width;
      const index = Math.max(0, Math.min(points.length - 1,
        Math.round(((viewX - built.padding.left) / (built.width - built.padding.left - built.padding.right)) * (points.length - 1))));
      const point = points[index];
      const tipWidth = 132;
      const tipX = point.x + 11 + tipWidth > built.width - 6 ? point.x - tipWidth - 11 : point.x + 11;
      const tipY = Math.max(5, Math.min(point.y - 55, built.height - 55));

      tipLine.setAttribute('x1', point.x.toFixed(2));
      tipLine.setAttribute('x2', point.x.toFixed(2));
      tipDot.setAttribute('cx', point.x.toFixed(2));
      tipDot.setAttribute('cy', point.y.toFixed(2));
      tipBox.setAttribute('transform', `translate(${tipX.toFixed(2)} ${tipY.toFixed(2)})`);
      tipDate.textContent = point.entry.fullLabel;
      tipPrice.textContent = money(point.entry.price);
      tip.setAttribute('opacity', '1');
    };

    const hide = () => tip.setAttribute('opacity', '0');
    svg.addEventListener('pointermove', update);
    svg.addEventListener('pointerdown', update);
    svg.addEventListener('pointerleave', hide);
  }

  function drawDetailChart() {
    if (!detailProduct) return;
    const built = chartMarkup(detailProduct, state.range);
    const container = document.getElementById('detail-chart');
    if (!container) return;
    container.innerHTML = built.html;
    bindChartHover();
  }

  function setDetailRange(days) {
    if (!detailProduct) return;
    state.range = days;
    const stats = rangeValues(detailProduct, days);
    document.querySelectorAll('.range-tab').forEach((button) => {
      button.classList.toggle('is-active', Number(button.dataset.range) === days);
      button.setAttribute('aria-pressed', String(Number(button.dataset.range) === days));
    });
    const labels = document.querySelectorAll('.detail-stat span');
    if (labels[1]) labels[1].textContent = `${days} 天最低`;
    if (labels[2]) labels[2].textContent = `${days} 天最高`;
    if (labels[3]) labels[3].textContent = `${days} 天均价`;
    const lowEl = document.querySelector('[data-stat="low"]');
    const highEl = document.querySelector('[data-stat="high"]');
    const avgEl = document.querySelector('[data-stat="avg"]');
    if (lowEl) lowEl.textContent = money(stats.low);
    if (highEl) highEl.textContent = money(stats.high);
    if (avgEl) avgEl.textContent = money(stats.avg);
    const highlight = document.getElementById('chart-highlight');
    if (highlight) highlight.innerHTML = `近 ${days} 天低点 <b>${money(stats.low)}</b> · ${stats.lowDate}`;
    drawDetailChart();
  }

  function refreshAlertBox(product) {
    const box = document.getElementById('detail-alert');
    if (box) box.innerHTML = alertBoxInner(product);
  }

  function openDetail(productId, options = {}) {
    const product = getProduct(productId);
    if (!product) return;
    detailProduct = product;
    state.range = 30;
    closeLayer(refs.compareLayer);
    closeLayer(refs.alertsLayer);
    refs.detailContent.innerHTML = detailMarkup(product);
    refs.detailContent.scrollTop = 0;
    setDetailRange(30);
    if (options.updateHash !== false) setDetailHash(productId);
    openLayer(refs.detailLayer);
  }

  function handleDetailClick(event) {
    if (!detailProduct) return;
    if (event.target.closest('[data-close-detail]')) {
      closeLayer(refs.detailLayer);
      return;
    }

    const rangeButton = event.target.closest('[data-range]');
    if (rangeButton) {
      setDetailRange(Number(rangeButton.dataset.range));
      return;
    }

    const offer = event.target.closest('[data-offer]');
    if (offer) {
      showToast(`演示站点：${offer.dataset.offer} 的购买链接未接入`);
      return;
    }

    const remove = event.target.closest('[data-remove-alert]');
    if (remove) {
      delete alertsStore[detailProduct.id];
      saveAlerts();
      updateAlertCount();
      refreshAlertBox(detailProduct);
      if (!refs.alertsLayer.hidden) renderAlerts();
      showToast('价格提醒已取消');
    }
  }

  function handleDetailSubmit(event) {
    if (event.target.id !== 'price-alert-form' || !detailProduct) return;
    event.preventDefault();
    const input = document.getElementById('price-alert-input');
    const target = Math.round(Number(input.value));
    if (!Number.isFinite(target) || target <= 0) {
      showToast('请输入一个有效的提醒价格');
      input.focus();
      return;
    }
    if (target >= detailProduct.current) {
      showToast(`提醒价需要低于当前价 ${money(detailProduct.current)}`);
      input.focus();
      return;
    }
    alertsStore[detailProduct.id] = target;
    saveAlerts();
    updateAlertCount();
    refreshAlertBox(detailProduct);
    if (!refs.alertsLayer.hidden) renderAlerts();
    showToast(`已设置：${detailProduct.short} 低于 ${money(target)} 时提醒`);
  }

  /* ---------------------------------------------------------
     Compare
     --------------------------------------------------------- */

  function updateCompareButtons() {
    refs.cardsGrid.querySelectorAll('[data-compare]').forEach((button) => {
      const selected = state.compare.includes(button.dataset.compare);
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      const label = button.querySelector('span');
      if (label) label.textContent = selected ? '已选' : '对比';
      button.setAttribute('aria-label', selected ? '从对比中移除' : '加入对比');
    });
  }

  function updateCompareTray() {
    window.clearTimeout(trayTimer);
    refs.trayCount.textContent = String(state.compare.length);
    refs.trayItems.innerHTML = state.compare.map((id) => {
      const product = getProduct(id);
      if (!product) return '';
      return `<span class="tray-item"><span>${escapeHTML(product.short)}</span><button type="button" data-tray-remove="${id}" aria-label="从对比中移除 ${escapeHTML(product.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></span>`;
    }).join('');

    refs.trayStart.disabled = state.compare.length < 2;
    refs.trayStart.textContent = state.compare.length < 2 ? '再选 1 款' : `开始对比 (${state.compare.length})`;
    document.body.classList.toggle('has-tray', state.compare.length > 0);

    if (state.compare.length > 0) {
      refs.compareTray.hidden = false;
      requestAnimationFrame(() => refs.compareTray.classList.add('is-visible'));
    } else {
      refs.compareTray.classList.remove('is-visible');
      trayTimer = window.setTimeout(() => {
        if (!state.compare.length) refs.compareTray.hidden = true;
      }, 350);
    }
    updateCompareButtons();
  }

  function toggleCompare(productId) {
    const index = state.compare.indexOf(productId);
    if (index >= 0) {
      state.compare.splice(index, 1);
    } else {
      if (state.compare.length >= 3) {
        showToast('最多同时对比 3 款显卡');
        return;
      }
      state.compare.push(productId);
      const product = getProduct(productId);
      showToast(`已加入对比：${product.short}（${state.compare.length}/3）`);
    }
    updateCompareTray();
    if (!refs.compareLayer.hidden) {
      if (state.compare.length >= 2) {
        renderCompare();
      } else {
        closeLayer(refs.compareLayer);
      }
    }
  }

  function comparePercent(value, inverse = false) {
    if (Math.abs(value) < 0.05) return '<span class="compare-value muted">持平</span>';
    const cls = value > 0 ? 'is-up' : 'is-down';
    const arrow = value > 0 ? '↑' : '↓';
    return `<span class="compare-value ${cls}">${arrow} ${decimal(Math.abs(value), 1)}%</span>`;
  }

  function renderCompare() {
    const items = state.compare.map(getProduct).filter(Boolean);
    if (items.length < 2) {
      closeLayer(refs.compareLayer);
      return;
    }
    const rows = [
      {
        label: '当前最低价',
        render: (product) => `<span class="compare-value"><strong>${money(product.current)}</strong></span>`
      },
      {
        label: '较昨日',
        render: (product) => comparePercent(product.dayPct)
      },
      {
        label: '近 30 天',
        render: (product) => comparePercent(product.pct30)
      },
      {
        label: '历史最低',
        render: (product) => `<span class="compare-value">${money(product.low)}</span>`
      },
      {
        label: '显存',
        render: (product) => `<span class="compare-value">${product.vram}</span>`
      },
      {
        label: '功耗',
        render: (product) => `<span class="compare-value">${product.tdp}W</span>`
      },
      {
        label: '性能指数',
        render: (product) => `<span class="compare-value">${product.perf} / 100</span>`
      },
      {
        label: '每千元性能',
        render: (product) => `<span class="compare-value">${decimal((product.perf / product.current) * 1000, 1)} 分</span>`
      },
      {
        label: '90 天价格位置',
        render: (product) => `<span class="compare-value">${Math.round(product.rangePosition * 100)}%</span><div class="compare-bar" style="--value:${(product.rangePosition * 100).toFixed(1)}%"><i></i></div>`
      }
    ];

    const headers = items.map((product) => `<div class="compare-cell compare-product" style="--brand:${product.brandMeta.color}">
      <span class="brand-chip"><i></i>${product.brandMeta.label}</span>
      <h3>${escapeHTML(product.short)}</h3>
      <button class="compare-remove" type="button" data-compare-remove="${product.id}" aria-label="从对比中移除 ${escapeHTML(product.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
      <div class="compare-product-price"><strong>${number(product.current)}</strong><span>元</span></div>
      ${makeSparkline(product.history.slice(-30).map((entry) => entry.price), product.pct30 <= 0 ? '#46d7a2' : '#ff6c5e')}
    </div>`).join('');

    const body = rows.map((row) => `<div class="compare-cell label">${row.label}</div>${items.map((product) => `<div class="compare-cell">${row.render(product)}</div>`).join('')}`).join('');

    refs.compareContent.innerHTML = `<div class="compare-scroll">
      <div class="compare-grid" style="--cols:${items.length}">
        <div class="compare-cell label">对比项</div>
        ${headers}
        ${body}
      </div>
    </div>
    <p class="compare-note">绿色代表价格下降，红色代表价格上涨。「每千元性能」以性能指数除以当前价计算，仅用于横向参考。</p>`;

    openLayer(refs.compareLayer);
  }

  function openCompare() {
    if (state.compare.length < 2) return;
    closeLayer(refs.detailLayer);
    closeLayer(refs.alertsLayer);
    renderCompare();
  }

  /* ---------------------------------------------------------
     Alerts modal
     --------------------------------------------------------- */

  function alertEntries() {
    return Object.keys(alertsStore)
      .map((id) => {
        const product = getProduct(id);
        const target = alertsStore[id];
        return product ? { product, target } : null;
      })
      .filter(Boolean);
  }

  function renderAlerts() {
    const entries = alertEntries();
    if (!entries.length) {
      refs.alertsContent.innerHTML = `<div class="alert-empty">
        <span class="alert-empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <h3>还没有价格提醒</h3>
        <p>打开任意一张显卡的详情，设一个心理价位。降到位的时候，这里会替你记着。</p>
        <button class="button button-primary" type="button" data-goto-catalog>去挑一张显卡</button>
      </div>`;
      return;
    }

    refs.alertsContent.innerHTML = `<div class="alert-list">
      ${entries.map(({ product, target }) => {
        const hit = product.current <= target;
        return `<div class="alert-list-row">
          <button class="alert-list-main" type="button" data-alert-open="${product.id}">
            <span class="alert-list-name">${escapeHTML(product.name)}</span>
            <span class="alert-list-store">${product.brandMeta.label} · ${product.series} · 当前 ${money(product.current)}</span>
          </button>
          <div class="alert-list-target"><span>目标价</span><b>${money(target)}</b></div>
          <div class="alert-list-actions">
            <span class="alert-list-status ${hit ? 'hit' : 'watching'}">${hit ? '已触达' : '监测中'}</span>
            <button class="alert-remove-row" type="button" data-alert-remove="${product.id}">删除</button>
          </div>
        </div>`;
      }).join('')}
    </div><p class="compare-note">提醒保存在本机浏览器中，不会发送任何通知。演示数据每次加载一致。</p>`;
  }

  function openAlerts() {
    closeLayer(refs.detailLayer);
    closeLayer(refs.compareLayer);
    renderAlerts();
    openLayer(refs.alertsLayer);
  }

  /* ---------------------------------------------------------
     Overlay behavior
     --------------------------------------------------------- */

  const overlayTimers = new WeakMap();
  const overlayLayers = [refs.detailLayer, refs.compareLayer, refs.alertsLayer];

  function openLayers() {
    return overlayLayers.filter((layer) => !layer.hidden && layer.classList.contains('is-open'));
  }

  function updateScrollLock() {
    const locked = overlayLayers.some((layer) => !layer.hidden);
    document.body.classList.toggle('no-scroll', locked);
  }

  function openLayer(layer) {
    if (openLayers().length === 0) lastFocus = document.activeElement;
    const timer = overlayTimers.get(layer);
    if (timer) window.clearTimeout(timer);
    layer.hidden = false;
    requestAnimationFrame(() => {
      layer.classList.add('is-open');
      updateScrollLock();
      const closeButton = layer.querySelector('.icon-button');
      if (closeButton) closeButton.focus({ preventScroll: true });
    });
  }

  function closeLayer(layer) {
    if (layer.hidden) return;
    if (layer === refs.detailLayer) clearDetailHash();
    layer.classList.remove('is-open');
    const timer = window.setTimeout(() => {
      if (!layer.classList.contains('is-open')) {
        layer.hidden = true;
        updateScrollLock();
        if (openLayers().length === 0 && lastFocus && document.contains(lastFocus)) {
          lastFocus.focus({ preventScroll: true });
        }
      }
    }, 330);
    overlayTimers.set(layer, timer);
    window.setTimeout(updateScrollLock, 0);
  }

  function trapFocus(event) {
    const open = openLayers();
    if (!open.length) return;
    const layer = open[open.length - 1];
    const focusables = Array.from(layer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => element.getClientRects().length > 0);
    if (!focusables.length) return;
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

  /* ---------------------------------------------------------
     Event wiring
     --------------------------------------------------------- */

  function initEvents() {
    refs.brandTabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-brand]');
      if (!button) return;
      state.brand = button.dataset.brand;
      syncControls();
      renderCards();
    });

    refs.search.addEventListener('input', () => {
      state.query = refs.search.value;
      renderCards();
    });

    refs.priceFilter.addEventListener('change', () => {
      state.price = refs.priceFilter.value;
      renderCards();
    });

    refs.sortFilter.addEventListener('change', () => {
      state.sort = refs.sortFilter.value;
      renderCards();
    });

    refs.onlyDrops.addEventListener('change', () => {
      state.onlyDrops = refs.onlyDrops.checked;
      renderCards();
    });

    refs.resetFilters.addEventListener('click', () => resetFilters());
    refs.emptyReset.addEventListener('click', () => resetFilters());

    refs.cardsGrid.addEventListener('click', (event) => {
      const compareButton = event.target.closest('[data-compare]');
      if (compareButton) {
        event.stopPropagation();
        toggleCompare(compareButton.dataset.compare);
        return;
      }
      const card = event.target.closest('.gpu-card');
      if (card) openDetail(card.dataset.id);
    });

    refs.cardsGrid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('button, a, input, select, textarea')) return;
      const card = event.target.closest('.gpu-card');
      if (!card) return;
      event.preventDefault();
      openDetail(card.dataset.id);
    });

    refs.compareTray.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-tray-remove]');
      if (remove) {
        toggleCompare(remove.dataset.trayRemove);
        return;
      }
      if (event.target.closest('#tray-clear')) {
        state.compare = [];
        updateCompareTray();
        showToast('对比列表已清空');
      }
    });

    refs.trayStart.addEventListener('click', openCompare);

    refs.compareContent.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-compare-remove]');
      if (remove) {
        toggleCompare(remove.dataset.compareRemove);
      }
    });

    refs.alertsContent.addEventListener('click', (event) => {
      const open = event.target.closest('[data-alert-open]');
      if (open) {
        closeLayer(refs.alertsLayer);
        openDetail(open.dataset.alertOpen);
        return;
      }
      const remove = event.target.closest('[data-alert-remove]');
      if (remove) {
        delete alertsStore[remove.dataset.alertRemove];
        saveAlerts();
        updateAlertCount();
        renderAlerts();
        if (detailProduct) refreshAlertBox(detailProduct);
        showToast('价格提醒已删除');
        return;
      }
      if (event.target.closest('[data-goto-catalog]')) {
        closeLayer(refs.alertsLayer);
        scrollToCatalog();
      }
    });

    refs.detailContent.addEventListener('click', handleDetailClick);
    refs.detailContent.addEventListener('submit', handleDetailSubmit);

    refs.alertsOpen.addEventListener('click', openAlerts);
    document.getElementById('mobile-alerts-open').addEventListener('click', () => {
      closeMobileNav();
      openAlerts();
    });

    document.querySelectorAll('[data-close-detail]').forEach((element) => {
      element.addEventListener('click', () => closeLayer(refs.detailLayer));
    });
    document.querySelectorAll('[data-close-compare]').forEach((element) => {
      element.addEventListener('click', () => closeLayer(refs.compareLayer));
    });
    document.querySelectorAll('[data-close-alerts]').forEach((element) => {
      element.addEventListener('click', () => closeLayer(refs.alertsLayer));
    });

    document.querySelectorAll('[data-action="drops"]').forEach((button) => {
      button.addEventListener('click', actOnDrops);
    });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', closeMobileNav);
    });

    document.getElementById('back-to-catalog').addEventListener('click', scrollToCatalog);

    refs.mobileMenuButton.addEventListener('click', () => {
      const isOpen = refs.mobileMenuButton.getAttribute('aria-expanded') === 'true';
      refs.mobileMenuButton.setAttribute('aria-expanded', String(!isOpen));
      refs.mobileMenuButton.setAttribute('aria-label', isOpen ? '展开菜单' : '收起菜单');
      refs.mobileNav.hidden = isOpen;
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const open = openLayers();
        if (open.length) {
          event.preventDefault();
          closeLayer(open[open.length - 1]);
          return;
        }
        if (refs.mobileNav.hidden === false) {
          closeMobileNav();
          refs.mobileMenuButton.focus();
          return;
        }
      }

      if (event.key === 'Tab') {
        trapFocus(event);
        return;
      }

      const target = event.target;
      const isTyping = target && (target.matches('input, textarea, select') || target.isContentEditable);
      if (event.key === '/' && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey && openLayers().length === 0) {
        event.preventDefault();
        refs.search.focus();
        refs.search.select();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeMobileNav();
    });

    window.addEventListener('hashchange', syncDetailRoute);
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */

  function init() {
    renderBrandCounts();
    renderMarketSummary();
    renderTicker();
    renderCards();
    renderNotes();
    updateCompareTray();
    updateAlertCount();
    syncControls();
    initEvents();

    if (window.location.hash.startsWith('#gpu=')) syncDetailRoute();
  }

  init();
})();
