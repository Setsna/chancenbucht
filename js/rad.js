/* Chancenbucht: das Glücksrad als SVG (Code-Grafik, exakte Winkel).
   Klassisches Skript, legt window.CB.rad an.

   Ein Rad ist eine Liste von Feldern im Uhrzeigersinn, oben (12 Uhr) angefangen:
     felder  ['rot', 'rot', 'blau', …]   Farb-Id je Feld, null = leeres Feld (Rad gestalten)
   Alle Felder sind gleich groß. Der Zeiger steht fest oben.

   Drehen (CLAUDE.md: Ausgang zuerst bestimmen, dann animieren):
     1. CB.zufall.drehe(radListe(felder)) liefert einen gleichverteilten Winkel w (Radkoordinaten, im Uhrzeigersinn ab oben)
        und das Feld, das bei w liegt.
     2. Damit genau dieses Feld unter dem Zeiger landet, wird die Scheibe im Uhrzeigersinn um R = k·360 + (360 − w) gedreht.
     3. feldUnterZeiger(n, R) rechnet das zurück. Der Test prüft beides, auch am gezeichneten Bild (elementFromPoint).
   Keine style-Attribute (CSP): Die Endstellung steht im SVG-Attribut transform, die Animation läuft über die
   Web Animations API (element.animate) und nur über transform. Bei reduzierter Bewegung: keine Drehung, kurzes Überblenden. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (p) p.appendChild(e); return e; };
  const F = id => CB.config.farben.find(f => f.id === id);
  const M = 160, R = 140;   /* Mittelpunkt und Radius im viewBox 320 × 336 */

  /* Liste für CB.zufall.drehe / feldBeiWinkel: jedes Feld einzeln, gleiche Größe */
  const radListe = felder => felder.map(f => ({ farbe: f, felder: 1 }));
  /* Anzahlen je Farbe { rot: 3, blau: 5 } */
  function anzahlen(felder) {
    const a = {};
    for (const f of felder) if (f) a[f] = (a[f] || 0) + 1;
    return a;
  }
  const punkt = (winkel, r) => { const a = winkel * Math.PI / 180; return [M + r * Math.sin(a), M + 16 - r * Math.cos(a)]; };
  const fmt = x => Math.round(x * 1000) / 1000;

  /* Drehung (Grad, im Uhrzeigersinn), nach der der Radwinkel w unter dem Zeiger steht */
  function drehungFuer(w, runden = 3) {
    return runden * 360 + ((360 - (((w % 360) + 360) % 360)) % 360);
  }
  /* Welches Feld steht nach der Drehung R unter dem Zeiger? */
  function feldUnterZeiger(n, drehung) {
    const w = ((360 - (((drehung % 360) + 360) % 360)) % 360);
    return Math.min(n - 1, Math.floor(w * n / 360));
  }

  function beschreibung(felder, zahlen) {
    const n = felder.length;
    if (zahlen) return `Rad mit ${n} Feldern und den Zahlen ${zahlen.join(', ')}`;
    const a = anzahlen(felder);
    const teile = CB.config.farben.filter(f => a[f.id]).map(f => `${a[f.id]} ${a[f.id] === 1 ? f.akk + 's Feld' : f.plural.replace(/n$/, '') + ' Felder'}`);
    const leer = felder.filter(f => !f).length;
    let t = `Rad mit ${n} Feldern` + (teile.length ? ': ' + (teile.length > 1 ? teile.slice(0, -1).join(', ') + ' und ' + teile[teile.length - 1] : teile[0]) : '');
    if (leer) t += `, ${leer} ${leer === 1 ? 'Feld ist' : 'Felder sind'} noch leer`;
    return t;
  }

  /* opt: drehung (Grad), hervorheben [farbIds] oder [Feldindizes bei zahlen], nummern (Zählhilfe je Farbe), zahlen [8 Zahlen], titel, klein */
  function zeichnen(felder, opt = {}) {
    const n = felder.length;
    if (!n) throw new Error('Rad ohne Felder');
    const svg = el('svg', { class: 'rad' + (opt.klein ? ' rad--klein' : '') + (opt.zahlen ? ' rad--zahlen' : ''), viewBox: '0 0 320 336', role: 'img', focusable: 'false' });
    el('title', {}, svg).textContent = opt.titel || beschreibung(felder, opt.zahlen);
    el('circle', { class: 'rad__rand', cx: M, cy: M + 16, r: R + 8 }, svg);
    const scheibe = el('g', { class: 'rad__scheibe', transform: `rotate(${fmt(opt.drehung || 0)} ${M} ${M + 16})` }, svg);
    const s = 360 / n;
    const zaehler = {};
    felder.forEach((f, i) => {
      const [x0, y0] = punkt(i * s, R), [x1, y1] = punkt((i + 1) * s, R);
      const d = `M${M} ${M + 16}L${fmt(x0)} ${fmt(y0)}A${R} ${R} 0 ${s > 180 ? 1 : 0} 1 ${fmt(x1)} ${fmt(y1)}Z`;
      const g = el('g', { class: 'rad__feld' + (f ? '' : ' rad__feld--leer'), 'data-i': i, 'data-farbe': f || '' }, scheibe);
      const farbe = opt.zahlen ? 'zahl' : f;
      el('path', { class: f || opt.zahlen ? `rad__grund k-${farbe}` : 'rad__leer', d, 'data-i': i }, g);
      const fa = f && !opt.zahlen ? F(f) : null;
      if (fa && fa.muster) el('path', { class: 'rad__muster m-' + fa.muster, d, 'data-i': i }, g);
      el('path', { class: 'rad__linie', d }, g);
      const blass = opt.hervorheben && opt.hervorheben.length && !(opt.zahlen ? opt.hervorheben.includes(i) : opt.hervorheben.includes(f));
      if (blass) g.classList.add('rad__feld--blass');
      const [tx, ty] = punkt((i + 0.5) * s, R * 0.64);
      if (opt.zahlen) el('text', { class: 'rad__zahl', x: fmt(tx), y: fmt(ty + 7), transform: `rotate(${fmt(-(opt.drehung || 0))} ${fmt(tx)} ${fmt(ty)})` }, g).textContent = String(opt.zahlen[i]);
      else if (opt.nummern && f) { zaehler[f] = (zaehler[f] || 0) + 1; el('text', { class: 'rad__nummer', x: fmt(tx), y: fmt(ty + 6) }, g).textContent = String(zaehler[f]); }
    });
    el('circle', { class: 'rad__nabe', cx: M, cy: M + 16, r: 12 }, svg);
    /* Zeiger oben, steht fest */
    el('path', { class: 'rad__zeiger', d: `M${M - 14} 2H${M + 14}L${M} 34Z` }, svg);
    return svg;
  }

  const ruhig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Dreht die Scheibe eines gezeichneten Rads von der alten auf die neue Stellung. Gibt ein Promise zurück.
     Die neue Stellung steht schon fest, bevor diese Funktion läuft. */
  function animieren(svg, von, nach, dauerMs = 2600) {
    const g = svg.querySelector('.rad__scheibe');
    const ende = () => { g.setAttribute('transform', `rotate(${fmt(nach % 360)} ${M} ${M + 16})`); svg.querySelectorAll('.rad__zahl').forEach(t => { const x = t.getAttribute('x'), y = Number(t.getAttribute('y')) - 7; t.setAttribute('transform', `rotate(${fmt(-(nach % 360))} ${x} ${y})`); }); };
    /* Verdecktes Fenster: Browser pausieren dort Animationen, das Rad würde hängen. Dann direkt auf die Endstellung. */
    if (ruhig() || document.hidden || typeof g.animate !== 'function') {
      ende();
      if (typeof svg.animate === 'function') svg.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 250 });
      return Promise.resolve();
    }
    g.removeAttribute('transform');
    /* Drehpunkt nur während der Animation (Keyframes), nicht dauerhaft per CSS. transform-box ist bei SVG view-box. */
    const um = `${M}px ${M + 16}px`;
    const a = g.animate([{ transform: `rotate(${von}deg)`, transformOrigin: um }, { transform: `rotate(${nach}deg)`, transformOrigin: um }], { duration: dauerMs, easing: 'cubic-bezier(0.12, 0.6, 0.2, 1)', fill: 'forwards' });
    /* Sicherung: Läuft die Animation nicht zu Ende (Fenster verdeckt, iPad zugeklappt), springt das Rad nach
       Dauer + 1 s auf die Endstellung. Das Ergebnis stand ohnehin schon vorher fest. */
    const notfall = new Promise(r => setTimeout(r, dauerMs + 1000));
    return Promise.race([a.finished, notfall]).then(() => { ende(); a.cancel(); }, () => { ende(); });
  }

  CB.rad = { zeichnen, animieren, drehungFuer, feldUnterZeiger, radListe, anzahlen, beschreibung, MITTE: [M, M + 16], RADIUS: R };
})();
