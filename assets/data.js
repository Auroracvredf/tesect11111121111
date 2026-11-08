/* GPU//RADAR — deterministic demo market data */
(function () {
  'use strict';

  const DATA_DATE = new Date('2026-11-08T11:32:00+08:00');
  const DAY = 24 * 60 * 60 * 1000;
  const DAYS = 90;

  const BRAND_META = {
    NVIDIA: { label: 'NVIDIA', color: '#8bd300', className: 'nvidia' },
    AMD: { label: 'AMD', color: '#ff5b4d', className: 'amd' },
    Intel: { label: 'INTEL', color: '#58a6ff', className: 'intel' }
  };

  const RAW = [
    {
      id: 'rtx-5080',
      brand: 'NVIDIA',
      name: 'GeForce RTX 5080',
      short: 'RTX 5080',
      chip: 'GB203',
      series: 'RTX 50 系',
      vram: '16GB GDDR7',
      tdp: 360,
      perf: 78,
      price: 8999,
      prev: 9199,
      fans: 3,
      anchors: [[0, 9499], [14, 9299], [26, 9399], [39, 9099], [52, 9299], [65, 8999], [77, 9199], [86, 9099], [89, 8999]]
    },
    {
      id: 'rx-9070-xt',
      brand: 'AMD',
      name: 'Radeon RX 9070 XT',
      short: 'RX 9070 XT',
      chip: 'Navi 48',
      series: 'RX 9000 系',
      vram: '16GB GDDR6',
      tdp: 304,
      perf: 67,
      price: 4999,
      prev: 5199,
      fans: 3,
      anchors: [[0, 5499], [12, 5299], [24, 5399], [37, 5099], [49, 5199], [62, 4999], [74, 5099], [83, 5199], [89, 4999]]
    },
    {
      id: 'rtx-5070',
      brand: 'NVIDIA',
      name: 'GeForce RTX 5070',
      short: 'RTX 5070',
      chip: 'GB205',
      series: 'RTX 50 系',
      vram: '12GB GDDR7',
      tdp: 250,
      perf: 52,
      price: 4299,
      prev: 4399,
      fans: 2,
      anchors: [[0, 4699], [15, 4599], [28, 4399], [41, 4499], [55, 4299], [67, 4399], [78, 4399], [86, 4399], [89, 4299]]
    },
    {
      id: 'arc-b580',
      brand: 'Intel',
      name: 'Arc B580',
      short: 'Arc B580',
      chip: 'BMG-G21',
      series: 'Battlemage',
      vram: '12GB GDDR6',
      tdp: 190,
      perf: 34,
      price: 1899,
      prev: 1949,
      fans: 2,
      anchors: [[0, 2099], [13, 1999], [26, 1949], [39, 1899], [52, 1999], [64, 1949], [76, 1899], [85, 1949], [89, 1899]]
    },
    {
      id: 'rtx-5090',
      brand: 'NVIDIA',
      name: 'GeForce RTX 5090',
      short: 'RTX 5090',
      chip: 'GB202',
      series: 'RTX 50 系',
      vram: '32GB GDDR7',
      tdp: 575,
      perf: 100,
      price: 16499,
      prev: 16799,
      fans: 3,
      anchors: [[0, 16999], [10, 16749], [22, 16999], [35, 17199], [47, 16699], [59, 16849], [71, 16599], [80, 16949], [86, 16799], [89, 16499]]
    },
    {
      id: 'rx-9070',
      brand: 'AMD',
      name: 'Radeon RX 9070',
      short: 'RX 9070',
      chip: 'Navi 48',
      series: 'RX 9000 系',
      vram: '16GB GDDR6',
      tdp: 220,
      perf: 58,
      price: 4299,
      prev: 4299,
      fans: 2,
      anchors: [[0, 4599], [13, 4499], [26, 4399], [40, 4499], [53, 4299], [66, 4399], [77, 4299], [85, 4399], [89, 4299]]
    },
    {
      id: 'rtx-5070-ti',
      brand: 'NVIDIA',
      name: 'GeForce RTX 5070 Ti',
      short: 'RTX 5070 Ti',
      chip: 'GB203',
      series: 'RTX 50 系',
      vram: '16GB GDDR7',
      tdp: 300,
      perf: 64,
      price: 6899,
      prev: 6799,
      fans: 3,
      anchors: [[0, 7299], [12, 7199], [24, 6999], [38, 7099], [50, 6899], [63, 6999], [76, 6799], [84, 6899], [89, 6899]]
    },
    {
      id: 'rtx-5060-ti',
      brand: 'NVIDIA',
      name: 'GeForce RTX 5060 Ti',
      short: 'RTX 5060 Ti',
      chip: 'GB206',
      series: 'RTX 50 系',
      vram: '16GB GDDR7',
      tdp: 180,
      perf: 39,
      price: 3499,
      prev: 3499,
      fans: 2,
      anchors: [[0, 3699], [13, 3599], [27, 3499], [39, 3599], [52, 3499], [66, 3499], [77, 3599], [85, 3499], [89, 3499]]
    },
    {
      id: 'rx-9060-xt',
      brand: 'AMD',
      name: 'Radeon RX 9060 XT',
      short: 'RX 9060 XT',
      chip: 'Navi 44',
      series: 'RX 9000 系',
      vram: '16GB GDDR6',
      tdp: 160,
      perf: 38,
      price: 3199,
      prev: 3099,
      fans: 2,
      anchors: [[0, 3399], [14, 3299], [26, 3099], [38, 3199], [51, 2999], [63, 3099], [75, 3199], [84, 3099], [89, 3199]]
    },
    {
      id: 'rtx-5060',
      brand: 'NVIDIA',
      name: 'GeForce RTX 5060',
      short: 'RTX 5060',
      chip: 'GB206',
      series: 'RTX 50 系',
      vram: '8GB GDDR7',
      tdp: 145,
      perf: 30,
      price: 2399,
      prev: 2449,
      fans: 2,
      anchors: [[0, 2499], [11, 2599], [23, 2499], [36, 2449], [49, 2499], [61, 2399], [73, 2449], [82, 2449], [89, 2399]]
    },
    {
      id: 'arc-b570',
      brand: 'Intel',
      name: 'Arc B570',
      short: 'Arc B570',
      chip: 'BMG-G21',
      series: 'Battlemage',
      vram: '10GB GDDR6',
      tdp: 150,
      perf: 29,
      price: 1699,
      prev: 1699,
      fans: 2,
      anchors: [[0, 1799], [14, 1749], [27, 1699], [40, 1749], [54, 1699], [67, 1749], [78, 1699], [86, 1749], [89, 1699]]
    },
    {
      id: 'rtx-4070-super',
      brand: 'NVIDIA',
      name: 'GeForce RTX 4070 SUPER',
      short: 'RTX 4070 S',
      chip: 'AD104',
      series: 'RTX 40 系',
      vram: '12GB GDDR6X',
      tdp: 220,
      perf: 47,
      price: 3599,
      prev: 3699,
      fans: 2,
      anchors: [[0, 3899], [12, 3799], [25, 3699], [38, 3799], [51, 3599], [63, 3699], [75, 3599], [84, 3699], [89, 3599]]
    }
  ];

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function random() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundTo(value, step) {
    return Math.round(value / step) * step;
  }

  function interpolateAnchors(anchors, day) {
    for (let i = 0; i < anchors.length - 1; i += 1) {
      const start = anchors[i];
      const end = anchors[i + 1];
      if (day >= start[0] && day <= end[0]) {
        const progress = (day - start[0]) / (end[0] - start[0] || 1);
        const eased = progress * progress * (3 - 2 * progress);
        return start[1] + (end[1] - start[1]) * eased;
      }
    }
    return anchors[anchors.length - 1][1];
  }

  function dateFor(dayIndex) {
    return new Date(DATA_DATE.getTime() - (DAYS - 1 - dayIndex) * DAY);
  }

  function shortDate(date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  }

  function eventDate(date) {
    return `${date.getMonth() + 1}月${String(date.getDate()).padStart(2, '0')}日`;
  }

  function makeOffers(product) {
    const base = product.price;
    return [
      {
        store: '京东自营',
        short: 'JD',
        tone: 'jd',
        price: base,
        note: '次日达 · 自营售后',
        stock: '现货',
        stockTone: 'ok',
        updated: '3 分钟前'
      },
      {
        store: '拼多多百亿补贴',
        short: 'PDD',
        tone: 'pdd',
        price: base + 59,
        note: '平台补贴后',
        stock: '少量',
        stockTone: 'warn',
        updated: '8 分钟前'
      },
      {
        store: '天猫旗舰店',
        short: 'TM',
        tone: 'tm',
        price: base + 120,
        note: '支持 12 期免息',
        stock: '现货',
        stockTone: 'ok',
        updated: '12 分钟前'
      },
      {
        store: '线下渠道',
        short: 'LOCAL',
        tone: 'local',
        price: base + 200,
        note: '到店自提 · 可议价',
        stock: '询价',
        stockTone: 'muted',
        updated: '32 分钟前'
      }
    ].map((offer, index) => Object.assign({}, offer, { best: index === 0 }));
  }

  function makeEvents(product) {
    const history = product.history;
    const candidates = [];
    for (let i = 6; i < history.length - 2; i += 1) {
      const delta = history[i].price - history[i - 1].price;
      if (Math.abs(delta) >= 40) {
        candidates.push({ index: i, delta });
      }
    }

    candidates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const picked = [];
    candidates.forEach((candidate) => {
      if (picked.length >= 3) return;
      if (picked.every((other) => Math.abs(other.index - candidate.index) >= 5)) {
        picked.push(candidate);
      }
    });

    if (!picked.length) {
      const lastIndex = history.length - 2;
      picked.push({ index: lastIndex, delta: history[lastIndex].price - history[lastIndex - 1].price });
    }

    const stores = ['京东自营', '天猫旗舰店', '拼多多百亿补贴'];

    return picked
      .sort((a, b) => b.index - a.index)
      .map((candidate, index) => {
        const date = new Date(history[candidate.index].date);
        return {
          date: eventDate(date),
          price: history[candidate.index].price,
          delta: candidate.delta,
          kind: candidate.delta < 0 ? 'drop' : 'rise',
          store: stores[index % stores.length]
        };
      });
  }

  const TRUE_LOWS = new Set(['rtx-5070', 'rx-9070-xt', 'arc-b580', 'rtx-5060']);

  const products = RAW.map((raw) => {
    const random = mulberry32(hashString(raw.id));
    const rough = Array.from({ length: DAYS }, () => random() * 2 - 1);
    const series = [];

    for (let day = 0; day < DAYS; day += 1) {
      const base = interpolateAnchors(raw.anchors, day);
      const previous = rough[Math.max(0, day - 1)];
      const before = rough[Math.max(0, day - 2)];
      const noise = rough[day] * 0.52 + previous * 0.3 + before * 0.18;
      series.push(roundTo(base * (1 + noise * 0.0032), 10));
    }

    series[0] = raw.anchors[0][1];
    series[DAYS - 2] = raw.prev;
    series[DAYS - 1] = raw.price;

    /*
     * Most cards get a short historical flash-sale dip so that the current
     * price is not the absolute 90-day low for every single model. A handful
     * of models are intentionally left at a genuine new low.
     */
    if (!TRUE_LOWS.has(raw.id) && series[DAYS - 1] <= Math.min.apply(null, series)) {
      const seed = hashString(raw.id);
      const dipIndex = 28 + (seed % 32);
      const depth = 0.982 + ((seed >>> 8) % 10) / 1000;
      const dipPrice = roundTo(series[DAYS - 1] * depth, 10);
      series[dipIndex] = dipPrice;
      series[dipIndex - 1] = roundTo(dipPrice * 1.012, 10);
      series[dipIndex + 1] = roundTo(dipPrice * 1.014, 10);
    }

    const history = series.map((price, day) => {
      const date = dateFor(day);
      return {
        price,
        date: date.toISOString(),
        label: shortDate(date),
        fullLabel: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      };
    });

    const current = series[DAYS - 1];
    const previous = series[DAYS - 2];
    const low = Math.min.apply(null, series);
    const high = Math.max.apply(null, series);
    const lowIndex = series.indexOf(low);
    const highIndex = series.indexOf(high);
    const last30 = series.slice(-30);
    const avg30 = Math.round(last30.reduce((sum, value) => sum + value, 0) / last30.length);
    const low30 = Math.min.apply(null, last30);
    const high30 = Math.max.apply(null, last30);
    const thirtyDaysAgo = series[DAYS - 30];
    const dayChange = current - previous;
    const dayPct = previous ? (dayChange / previous) * 100 : 0;
    const change30 = current - thirtyDaysAgo;
    const pct30 = thirtyDaysAgo ? (change30 / thirtyDaysAgo) * 100 : 0;
    const s = BRAND_META[raw.brand];

    let badge = '';
    if (current <= low) badge = '历史新低';
    else if (dayChange <= -150) badge = '今日降价';
    else if (dayChange >= 100) badge = '今日涨价';
    else if (current <= low30 && dayChange < 0) badge = '30 日低价';

    const product = Object.assign({}, raw, {
      current,
      previous,
      low,
      high,
      low30,
      high30,
      avg30,
      dayChange,
      dayPct,
      change30,
      pct30,
      lowDate: history[lowIndex].fullLabel,
      highDate: history[highIndex].fullLabel,
      rangePosition: high === low ? 0 : (current - low) / (high - low),
      history,
      badge,
      brandMeta: s,
      offers: makeOffers({ price: current })
    });

    product.events = makeEvents(product);
    return product;
  });

  const indexHistory = [];
  for (let day = 0; day < DAYS; day += 1) {
    const ratio = products.reduce((sum, product) => {
      return sum + product.history[day].price / product.history[0].price;
    }, 0) / products.length;
    const date = dateFor(day);
    indexHistory.push({
      value: Math.round(ratio * 1000 * 10) / 10,
      date: date.toISOString(),
      label: shortDate(date),
      fullLabel: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    });
  }

  const indexCurrent = indexHistory[indexHistory.length - 1].value;
  const index30 = indexHistory[indexHistory.length - 30].value;
  const index7 = indexHistory[indexHistory.length - 7].value;
  const prices = products.map((product) => product.current).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];

  const up = products.filter((product) => product.dayChange > 10).length;
  const down = products.filter((product) => product.dayChange < -10).length;
  const flat = products.length - up - down;

  window.GPU_DATA = {
    date: DATA_DATE.toISOString(),
    dateLabel: '2026.11.08',
    timeLabel: '11:32',
    products,
    brands: BRAND_META,
    index: {
      value: indexCurrent,
      change30: indexCurrent - index30,
      pct30: ((indexCurrent - index30) / index30) * 100,
      change7: indexCurrent - index7,
      pct7: ((indexCurrent - index7) / index7) * 100,
      history: indexHistory
    },
    market: {
      median,
      up,
      down,
      flat,
      total: products.length,
      avgDayChange: products.reduce((sum, product) => sum + product.pct30, 0) / products.length
    }
  };
})();
