/* Chancenbucht: Säulendiagramm als kleiner, getesteter Baustein (SVG plus Tabelle).
   Klassisches Skript, legt window.CB.saeulen an. Wird von Fühlkiste, Glücksrad und Würfeln benutzt.

   CB.saeulen.zeichnen({ kategorien, werte, schatten, titel, einheit }) gibt { svg, tabelle } zurück.
     kategorien  [{ id, name, farbe }]   farbe: Farb-Id aus CB.config.farben (mit Muster) oder 'neutral'
     werte       { id: Anzahl }            ganze Zahlen ≥ 0
     schatten    { id: Anzahl } optional   der vorige Durchgang, als blasse gestrichelte Säule daneben
     titel       Überschrift der Tabelle und Bildbeschreibung, z. B. „Gezogene Kugeln“
   Die Tabelle ist die Textalternative: dieselben Zahlen, auch ohne Grafik lesbar.
   Die Achse geht immer bei 0 los und hat höchstens 5 Teilstriche in Schritten von 1, 2, 5, 10, 20, 50 …
   Keine style-Attribute (CSP), nur Klassen. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (p) p.appendChild(e); return e; };
  const ganz = x => (Number.isInteger(x) && x >= 0 ? x : 0);

  /* Achse: kleinster „schöner“ Schritt, so dass höchstens 5 Teilstriche reichen */
  function skala(max) {
    const m = Math.max(1, Math.ceil(max));
    for (let k = 1; ; k *= 10) {
      for (const s of [1, 2, 5]) {
        const schritt = s * k;
        if (Math.ceil(m / schritt) <= 5) return { schritt, oben: Math.ceil(m / schritt) * schritt };
      }
    }
  }

  function zeichnen({ kategorien, werte = {}, schatten = null, titel = 'Häufigkeiten', einheit = 'Anzahl' }) {
    if (!Array.isArray(kategorien) || !kategorien.length) throw new Error('Säulendiagramm braucht Kategorien');
    const w = kategorien.map(k => ganz(werte[k.id]));
    const s = schatten ? kategorien.map(k => ganz(schatten[k.id])) : null;
    const { schritt, oben } = skala(Math.max(...w, ...(s || [0])));

    const n = kategorien.length;
    const LINKS = 56, UNTEN = 40, OBEN = 28, HOEHE = 200;
    const spalte = Math.max(40, Math.min(72, 560 / n));
    const B = LINKS + n * spalte + 12, H = OBEN + HOEHE + UNTEN;
    const y = v => OBEN + HOEHE - (v / oben) * HOEHE;

    const svg = el('svg', { class: 'saeulen', viewBox: `0 0 ${B} ${H}`, role: 'img', focusable: 'false' });
    el('title', {}, svg).textContent = `${titel}: ` + kategorien.map((k, i) => `${k.name} ${w[i]}`).join(', ');

    for (let v = 0; v <= oben; v += schritt) {
      el('line', { class: 'saeulen__gitter', x1: LINKS, x2: B - 6, y1: y(v), y2: y(v) }, svg);
      el('text', { class: 'saeulen__tick', x: LINKS - 8, y: y(v) + 5 }, svg).textContent = String(v);
    }
    kategorien.forEach((k, i) => {
      const mitte = LINKS + i * spalte + spalte / 2;
      const breite = spalte * (s ? 0.36 : 0.6);
      const xHaupt = s ? mitte : mitte - breite / 2;
      if (s) {
        const hs = HOEHE * s[i] / oben;
        el('rect', { class: 'saeulen__schatten', x: mitte - breite - 2, y: OBEN + HOEHE - hs, width: breite, height: hs, 'data-id': k.id }, svg);
      }
      const h = HOEHE * w[i] / oben;
      const f = k.farbe && k.farbe !== 'neutral' ? CB.config.farben.find(x => x.id === k.farbe) : null;
      el('rect', { class: 'saeulen__balken k-' + (f ? f.id : 'neutral'), x: xHaupt, y: OBEN + HOEHE - h, width: breite, height: h, 'data-id': k.id, 'data-wert': w[i] }, svg);
      if (f && f.muster && h > 0) el('rect', { class: 'saeulen__muster m-' + f.muster, x: xHaupt, y: OBEN + HOEHE - h, width: breite, height: h }, svg);
      el('text', { class: 'saeulen__wert', x: xHaupt + breite / 2, y: OBEN + HOEHE - h - 6 }, svg).textContent = String(w[i]);
      el('text', { class: 'saeulen__name', x: mitte, y: OBEN + HOEHE + 24 }, svg).textContent = k.name;
    });
    el('line', { class: 'saeulen__achse', x1: LINKS, x2: B - 6, y1: OBEN + HOEHE, y2: OBEN + HOEHE }, svg);
    el('line', { class: 'saeulen__achse', x1: LINKS, x2: LINKS, y1: OBEN - 6, y2: OBEN + HOEHE }, svg);

    /* Tabelle als Textalternative */
    const tabelle = document.createElement('table');
    tabelle.className = 'haeufigkeiten';
    tabelle.createCaption().textContent = titel;
    const kopf = tabelle.createTHead().insertRow();
    for (const t of ['', ...kategorien.map(k => k.name)]) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = t; kopf.appendChild(th); }
    const rumpf = tabelle.createTBody();
    const zeile = (name, zahlen) => {
      const r = rumpf.insertRow();
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = name; r.appendChild(th);
      zahlen.forEach(z => { r.insertCell().textContent = String(z); });
    };
    zeile(s ? `${einheit} jetzt` : einheit, w);
    if (s) zeile(`${einheit} vorher`, s);

    /* Schrift gerendert mindestens etwa 14 px, egal wie breit das Diagramm angezeigt wird (Handy bis Tafel).
       Gesetzt als SVG-Attribut font-size (kein style-Attribut, CSP), neu bei jeder Größenänderung. */
    const anpassen = () => {
      const breite = svg.getBoundingClientRect().width;
      if (!breite) return;
      const gr = Math.round(Math.min(26, Math.max(15, 14 * B / breite)) * 10) / 10;
      svg.querySelectorAll('text').forEach(t => t.setAttribute('font-size', gr));
    };
    svg.querySelectorAll('text').forEach(t => t.setAttribute('font-size', 15));
    if (typeof ResizeObserver === 'function') new ResizeObserver(anpassen).observe(svg);

    return { svg, tabelle, skala: { schritt, oben } };
  }

  CB.saeulen = { zeichnen, skala };
})();
