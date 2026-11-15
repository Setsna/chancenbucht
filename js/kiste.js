/* Chancenbucht: die Fühlkiste als SVG (Code-Grafik, exakte Positionen).
   Klassisches Skript, legt window.CB.kiste an.

   CB.kiste.zeichnen(kiste, optionen) gibt ein <svg> zurück.
     kiste       { blau: 3, rot: 2, … }  (Farben aus CB.config.farben, andere Schlüssel werden ignoriert)
     optionen    plaetze      Gesamtzahl der Plätze (leere Plätze gestrichelt, für „Kiste füllen“)
                 verdeckt     true: geschlossene Kiste mit Fühlloch, keine Kugeln sichtbar
                 hervorheben  [farbIds]: andere Kugeln werden blass
                 zahlen       true: laufende Nummer je Farbe in jeder Kugel (Hilfe zum Zählen)
                 mischen      Zufallsquelle (CB.zufall): Kugeln gemischt statt nach Farben geordnet
                 titel        eigener Text für die Bildbeschreibung
   Kugeln haben Farbe UND Muster (nie nur Farbe). Keine style-Attribute (CSP style-src 'self'), nur Klassen.
   Barrierefreiheit: role="img" und eine Bildbeschreibung mit allen Anzahlen („Kiste mit 4 blauen und 2 roten Kugeln“). */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const NS = 'http://www.w3.org/2000/svg';
  const R = 17, ABSTAND = 44, SPALTEN_MAX = 5;

  const farbe = id => CB.config.farben.find(f => f.id === id);
  const reihenfolge = () => CB.config.farben.map(f => f.id);

  function el(name, attrs = {}, eltern) {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (eltern) eltern.appendChild(e);
    return e;
  }

  /* Bildbeschreibung: „Kiste mit 4 blauen Kugeln, 1 roten Kugel und 2 gelben Kugeln“ */
  function beschreibung(kiste, plaetze) {
    const teile = reihenfolge().filter(id => (kiste[id] || 0) > 0)
      .map(id => { const n = kiste[id]; return n === 1 ? `einer ${farbe(id).plural} Kugel` : `${n} ${farbe(id).plural} Kugeln`; });
    const summe = reihenfolge().reduce((s, id) => s + (kiste[id] || 0), 0);
    let text = teile.length ? 'Kiste mit ' + (teile.length > 1 ? teile.slice(0, -1).join(', ') + ' und ' + teile[teile.length - 1] : teile[0]) : 'Leere Kiste';
    if (plaetze && plaetze > summe) text += `, ${plaetze - summe} ${plaetze - summe === 1 ? 'Platz ist' : 'Plätze sind'} noch frei`;
    return text;
  }

  /* Eine Kugel: Farbe, Muster darüber, Glanz, Rand. Gruppe trägt data-farbe. */
  function kugel(eltern, x, y, id, nummer) {
    const f = farbe(id);
    const g = el('g', { class: 'kugel', 'data-farbe': id }, eltern);
    el('circle', { class: 'kugel__grund k-' + id, cx: x, cy: y, r: R }, g);
    if (f.muster) el('circle', { class: 'kugel__muster m-' + f.muster, cx: x, cy: y, r: R }, g);
    el('ellipse', { class: 'kugel__glanz', cx: x - 6, cy: y - 7, rx: 6, ry: 4 }, g);
    el('circle', { class: 'kugel__rand', cx: x, cy: y, r: R }, g);
    if (nummer) { const t = el('text', { class: 'kugel__zahl', x, y: y + 6 }, g); t.textContent = String(nummer); }
    return g;
  }

  function zeichnen(kiste, opt = {}) {
    const k = {};
    for (const id of reihenfolge()) { const n = Number(kiste && kiste[id]) || 0; if (n > 0) k[id] = Math.floor(n); }
    const summe = Object.values(k).reduce((s, n) => s + n, 0);
    const plaetze = Math.max(opt.plaetze || 0, summe);
    const anzahl = Math.max(plaetze, 1);
    const spalten = Math.min(SPALTEN_MAX, Math.max(3, Math.ceil(anzahl / 2)));
    const reihen = Math.max(1, Math.ceil(anzahl / spalten));
    const innenB = spalten * ABSTAND, innenH = reihen * ABSTAND;
    const B = innenB + 56, H = innenH + 70;

    const svg = el('svg', { class: 'kiste' + (opt.verdeckt ? ' kiste--verdeckt' : ''), viewBox: `0 0 ${B} ${H}`, role: 'img', focusable: 'false' });
    const titel = el('title', {}, svg);
    titel.textContent = opt.titel || (opt.verdeckt ? 'Geschlossene Kiste. Man kann nicht hineinsehen.' : beschreibung(k, opt.plaetze));

    /* Holzkiste: Rückwand, Innenraum, Boden, vordere Kante */
    el('rect', { class: 'kiste__rueck', x: 8, y: 14, width: B - 16, height: H - 22, rx: 14 }, svg);
    el('rect', { class: 'kiste__innen', x: 20, y: 26, width: B - 40, height: innenH + 18, rx: 8 }, svg);

    if (opt.verdeckt) {
      el('rect', { class: 'kiste__deckel', x: 8, y: 14, width: B - 16, height: H - 22, rx: 14 }, svg);
      el('ellipse', { class: 'kiste__loch', cx: B / 2, cy: H / 2 - 4, rx: 26, ry: 20 }, svg);
      el('path', { class: 'kiste__tuch', d: `M${B / 2 - 26} ${H / 2 - 4} q13 14 26 4 q13 10 26 -4` }, svg);
    } else {
      const ids = [];
      for (const id of reihenfolge()) for (let i = 0; i < (k[id] || 0); i++) ids.push(id);
      if (opt.mischen && opt.mischen.zahl) {
        for (let i = ids.length - 1; i > 0; i--) { const j = opt.mischen.zahl(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
      }
      const zaehler = {};
      const blass = Array.isArray(opt.hervorheben) && opt.hervorheben.length ? opt.hervorheben : null;
      for (let p = 0; p < anzahl; p++) {
        const sp = p % spalten, re = Math.floor(p / spalten);
        /* letzte Reihe mittig */
        const inReihe = re === reihen - 1 ? anzahl - re * spalten : spalten;
        const x = 28 + (innenB - inReihe * ABSTAND) / 2 + sp * ABSTAND + ABSTAND / 2 - 0;
        const y = 26 + 9 + re * ABSTAND + ABSTAND / 2;
        if (p < ids.length) {
          const id = ids[p];
          zaehler[id] = (zaehler[id] || 0) + 1;
          const g = kugel(svg, x, y, id, opt.zahlen ? zaehler[id] : 0);
          if (blass && !blass.includes(id)) g.classList.add('kugel--blass');
        } else if (p < plaetze) {
          el('circle', { class: 'kugel--leer', cx: x, cy: y, r: R }, svg);
        }
      }
      el('path', { class: 'kiste__kante', d: `M8 ${H - 26} H${B - 8}` }, svg);
    }
    return svg;
  }

  CB.kiste = { zeichnen, beschreibung };
})();
