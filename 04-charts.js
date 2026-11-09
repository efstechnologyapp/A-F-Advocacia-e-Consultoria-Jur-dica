/* =====================================================================
   Gráficos em SVG — leves, sem dependências, com dica ao passar o mouse
   ===================================================================== */
const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
function niceScale(min, max, ticks = 4) {
  if (min === max) { max = min + 1; }
  const span = max - min, raw = span / ticks, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out = []; for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
  return { lo, hi, ticks: out };
}
function roundTop(x, y, w, h, r) {
  if (h <= 0) return '';
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
/** spec: {labels, series:[{name, values, color?}], kind:'line'|'bar'|'stack', fmt, axisFmt} */
function svgChart(spec, W = 640, H = 240) {
  const { labels, series } = spec, kind = spec.kind || 'line';
  const fmtAx = spec.axisFmt || fmtMoneyShort;
  const n = labels.length, padL = 64, padR = 14, padT = 12, padB = 28;
  const pw = Math.max(40, W - padL - padR), ph = H - padT - padB;
  let vals = [];
  if (kind === 'stack') for (let i = 0; i < n; i++) vals.push(series.reduce((s, se) => s + Math.max(0, num(se.values[i]) || 0), 0));
  else series.forEach(se => se.values.forEach(v => { if (num(v) !== null) vals.push(num(v)); }));
  const sc = niceScale(Math.min(0, ...vals, 0), Math.max(0, ...vals, 1));
  const y = v => padT + ph - ((v - sc.lo) / (sc.hi - sc.lo)) * ph;
  const band = pw / Math.max(1, n);
  const xc = i => padL + band * i + band / 2;
  let g = '';
  sc.ticks.forEach(t => { g += `<line x1="${padL}" x2="${W - padR}" y1="${y(t)}" y2="${y(t)}" class="${t === 0 ? 'axis0' : 'grid'}"/><text x="${padL - 8}" y="${y(t) + 4}" class="tick" text-anchor="end">${esc(fmtAx(t))}</text>`; });
  const every = Math.max(1, Math.ceil(n * 46 / pw));
  labels.forEach((l, i) => { if (i % every === 0 || i === n - 1 && n < 6) g += `<text x="${xc(i)}" y="${H - 8}" class="tick" text-anchor="middle">${esc(l)}</text>`; });
  let marks = '';
  if (kind === 'line') {
    series.forEach((se, si) => {
      const col = se.color || SERIES[si]; let d = '', pen = false;
      se.values.forEach((v, i) => { const nv = num(v); if (nv === null) { pen = false; return; } d += (pen ? 'L' : 'M') + xc(i).toFixed(1) + ',' + y(nv).toFixed(1); pen = true; });
      marks += `<path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (n <= 24) se.values.forEach((v, i) => { const nv = num(v); if (nv !== null) marks += `<circle cx="${xc(i)}" cy="${y(nv)}" r="4" fill="${col}" stroke="var(--chart-bg)" stroke-width="2"/>`; });
    });
    marks += `<line class="xhair" x1="0" x2="0" y1="${padT}" y2="${padT + ph}" style="display:none"/>`;
  } else if (kind === 'bar') {
    const ns = series.length, gw = Math.min(band * 0.72, ns * 26), bw = Math.max(3, gw / ns - 2);
    series.forEach((se, si) => se.values.forEach((v, i) => {
      const nv = num(v); if (nv === null) return;
      const x0 = xc(i) - gw / 2 + si * (bw + 2), top = y(Math.max(0, nv)), h = Math.abs(y(nv) - y(0));
      marks += nv >= 0 ? `<path d="${roundTop(x0, top, bw, h, 4)}" fill="${se.color || SERIES[si]}"/>` : `<rect x="${x0}" y="${y(0)}" width="${bw}" height="${h}" fill="${se.color || SERIES[si]}"/>`;
    }));
  } else if (kind === 'stack') {
    const bw = Math.min(band * 0.6, 34);
    for (let i = 0; i < n; i++) {
      let acc = 0; const segs = series.map((se, si) => ({ v: Math.max(0, num(se.values[i]) || 0), si })).filter(s => s.v > 0);
      segs.forEach((s, k) => {
        const yTop = y(acc + s.v), yBot = y(acc); acc += s.v;
        const h = Math.max(0, yBot - yTop - (k ? 2 : 0));
        const col = series[s.si].color || SERIES[s.si];
        marks += k === segs.length - 1 ? `<path d="${roundTop(xc(i) - bw / 2, yTop, bw, h, 4)}" fill="${col}"/>` : `<rect x="${xc(i) - bw / 2}" y="${yTop}" width="${bw}" height="${h}" fill="${col}"/>`;
      });
    }
  }
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(spec.title || 'Gráfico')}">${g}${marks}<rect class="hit" x="${padL}" y="${padT}" width="${pw}" height="${ph}" fill="transparent"/></svg>`;
  return { svg, geom: { padL, band, n, xc } };
}
const Tip = {
  el: null,
  show(html, x, y) {
    if (!this.el) { this.el = document.createElement('div'); this.el.className = 'tip'; document.body.appendChild(this.el); }
    this.el.innerHTML = html; this.el.style.display = 'block';
    const r = this.el.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > innerHeight - 8) top = y - r.height - 14;
    this.el.style.left = left + 'px'; this.el.style.top = top + 'px';
  },
  hide() { if (this.el) this.el.style.display = 'none'; }
};
function legendHtml(series) {
  if (series.length < 2) return '';
  return `<div class="legend">${series.map((s, i) => `<span><i style="background:${s.color || SERIES[i]}"></i>${esc(s.name)}</span>`).join('')}</div>`;
}
/** monta gráfico interativo num elemento */
function mountChart(el, spec) {
  const fmt = spec.fmt || fmtMoney;
  const has = spec.series.some(s => s.values.some(v => num(v) !== null));
  if (!spec.labels.length || !has) { el.innerHTML = `<div class="chart-empty">${spec.empty || 'Sem dados para o período.'}</div>`; return; }
  const W = Math.max(280, el.clientWidth || 600), H = spec.height || 240;
  const { svg, geom } = svgChart(spec, W, H);
  el.innerHTML = legendHtml(spec.series) + svg + `<button class="link small tbl-toggle" type="button">Ver tabela</button><div class="chart-table" hidden></div>`;
  const s = $('svg', el), hit = $('.hit', s), xh = $('.xhair', s);
  const onMove = ev => {
    const pt = s.getBoundingClientRect(); const sx = (ev.clientX - pt.left) * (W / pt.width);
    const i = Math.max(0, Math.min(geom.n - 1, Math.floor((sx - geom.padL) / geom.band)));
    if (xh) { xh.setAttribute('x1', geom.xc(i)); xh.setAttribute('x2', geom.xc(i)); xh.style.display = ''; }
    const rows = spec.series.map((se, si) => `<div class="tip-row"><i style="background:${se.color || SERIES[si]}"></i><span>${esc(se.name)}</span><b>${num(se.values[i]) === null ? '—' : esc(fmt(se.values[i]))}</b></div>`).join('');
    const total = spec.kind === 'stack' ? `<div class="tip-row total"><span>Total</span><b>${esc(fmt(spec.series.reduce((a, se) => a + (num(se.values[i]) || 0), 0)))}</b></div>` : '';
    Tip.show(`<div class="tip-h">${esc(spec.fullLabels?.[i] || spec.labels[i])}</div>${rows}${total}`, ev.clientX, ev.clientY);
  };
  hit.addEventListener('mousemove', onMove);
  hit.addEventListener('mouseleave', () => { Tip.hide(); if (xh) xh.style.display = 'none'; });
  hit.addEventListener('touchstart', e => onMove(e.touches[0]), { passive: true });
  $('.tbl-toggle', el).onclick = e => {
    const t = $('.chart-table', el); t.hidden = !t.hidden; e.target.textContent = t.hidden ? 'Ver tabela' : 'Ocultar tabela';
    if (!t.hidden && !t.innerHTML) t.innerHTML = `<table class="mini"><thead><tr><th></th>${spec.series.map(se => `<th>${esc(se.name)}</th>`).join('')}</tr></thead><tbody>${spec.labels.map((l, i) => `<tr><td>${esc(spec.fullLabels?.[i] || l)}</td>${spec.series.map(se => `<td class="r">${num(se.values[i]) === null ? '—' : esc(fmt(se.values[i]))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };
}
/** barras horizontais (ranking) em HTML */
function hbarHtml(items, fmt = fmtMoney, max = 8) {
  if (!items.length) return '<div class="chart-empty">Sem dados.</div>';
  const top = items.slice(0, max), m = Math.max(...top.map(i => i.value), 1);
  return `<div class="hbars">${top.map(i => `<div class="hbar" title="${esc(i.label)}: ${esc(fmt(i.value))}"><span class="hbar-l">${esc(i.label)}</span><span class="hbar-t"><span style="width:${Math.max(1.5, i.value / m * 100)}%;background:${i.color || 'var(--s1)'}"></span></span><span class="hbar-v">${esc(fmt(i.value))}</span></div>`).join('')}${items.length > max ? `<div class="muted small">+ ${items.length - max} outros</div>` : ''}</div>`;
}
/** barra segmentada (distribuição por status) */
function segBar(parts) {
  const tot = parts.reduce((s, p) => s + p.value, 0);
  if (!tot) return '<div class="chart-empty">Sem registros.</div>';
  return `<div class="segbar">${parts.filter(p => p.value).map(p => `<span style="flex:${p.value};background:${p.color}" title="${esc(p.label)}: ${p.value}"></span>`).join('')}</div>
  <div class="seglegend">${parts.filter(p => p.value).map(p => `<span><i style="background:${p.color}"></i>${esc(p.label)} <b>${p.value}</b> <em>${fmtPct(p.value / tot)}</em></span>`).join('')}</div>`;
}
