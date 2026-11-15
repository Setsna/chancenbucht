/* Chancenbucht: Würfel als SVG (Code-Grafik) und die Wurf-Animation.
   Klassisches Skript, legt window.CB.wuerfel an.

   CB.wuerfel.zeichnen(augen, opt) gibt ein <svg> mit einem Würfel zurück (1 bis 6 Augen, Standardbild).
     opt.klein       kleiner Würfel (Gitter, Tabelle)
     opt.blass       blass (nicht passend)
     opt.titel       eigene Bildbeschreibung (sonst „Würfel mit 4 Augen“)
   CB.wuerfel.aufgeklappt(passend) gibt die sechs Seiten nebeneinander zurück, passende hell, andere blass.
   CB.wuerfel.werfen(svgs, ergebnisse) kippt die Würfel kurz und zeigt DANACH die vorher bestimmten Ergebnisse
     (CLAUDE.md: Ausgang zuerst, dann Animation). Nur transform. Bei reduzierter Bewegung, verdecktem Fenster oder
     wenn die Animation hängt (Dauer + 1 s): sofort das Ergebnis.
   Keine style-Attribute (CSP), nur Klassen. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (p) p.appendChild(e); return e; };

  /* Augen-Positionen auf einem 100er-Feld (Standardwürfel: gegenüberliegende Seiten ergeben 7, hier nicht nötig) */
  const L = 27, M = 50, R = 73;
  const AUGEN = {
    1: [[M, M]],
    2: [[L, L], [R, R]],
    3: [[L, L], [M, M], [R, R]],
    4: [[L, L], [R, L], [L, R], [R, R]],
    5: [[L, L], [R, L], [M, M], [L, R], [R, R]],
    6: [[L, L], [R, L], [L, M], [R, M], [L, R], [R, R]]
  };
  const titelVon = augen => `Würfel mit ${augen} ${augen === 1 ? 'Auge' : 'Augen'}`;

  function seite(g, augen) {
    g.textContent = '';
    el('rect', { class: 'wuerfel__koerper', x: 4, y: 4, width: 92, height: 92, rx: 18 }, g);
    for (const [x, y] of AUGEN[augen]) el('circle', { class: 'wuerfel__auge', cx: x, cy: y, r: 9 }, g);
  }

  function zeichnen(augen, opt = {}) {
    if (!AUGEN[augen]) throw new Error('Würfel braucht 1 bis 6 Augen, bekommen: ' + augen);
    const svg = el('svg', { class: 'wuerfel' + (opt.klein ? ' wuerfel--klein' : '') + (opt.blass ? ' wuerfel--blass' : ''), viewBox: '0 0 100 100', role: 'img', focusable: 'false', 'data-augen': augen });
    el('title', {}, svg).textContent = opt.titel || titelVon(augen);
    seite(el('g', { class: 'wuerfel__seite' }, svg), augen);
    return svg;
  }
  /* Augen eines gezeichneten Würfels ändern (nach dem Wurf) */
  function setzen(svg, augen) {
    seite(svg.querySelector('.wuerfel__seite'), augen);
    svg.setAttribute('data-augen', augen);
    svg.querySelector('title').textContent = titelVon(augen);
  }

  /* Die sechs Seiten nebeneinander; passend = Liste der passenden Augenzahlen */
  function aufgeklappt(passend = []) {
    const div = document.createElement('div');
    div.className = 'wuerfel-seiten';
    div.setAttribute('role', 'img');
    div.setAttribute('aria-label', `Die sechs Seiten eines Würfels. ${passend.length ? 'Passend: ' + passend.join(', ') + '.' : ''}`);
    for (let a = 1; a <= 6; a++) {
      const w = zeichnen(a, { klein: true, blass: passend.length > 0 && !passend.includes(a) });
      w.setAttribute('aria-hidden', 'true');
      div.appendChild(w);
    }
    return div;
  }

  const ruhig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* svgs: die gezeichneten Würfel, ergebnisse: Augen (schon bestimmt). Gibt ein Promise zurück. */
  function werfen(svgs, ergebnisse, dauerMs = 600) {
    const ende = () => svgs.forEach((s, i) => setzen(s, ergebnisse[i]));
    if (ruhig() || document.hidden || !svgs.length || typeof svgs[0].animate !== 'function') {
      ende();
      if (svgs.length && typeof svgs[0].animate === 'function') svgs.forEach(s => s.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 200 }));
      return Promise.resolve();
    }
    const animationen = svgs.map((s, i) => s.animate([
      { transform: 'translateY(0) rotate(0deg)' },
      { transform: `translateY(-14%) rotate(${i % 2 ? -100 : 110}deg)` },
      { transform: `translateY(0) rotate(${i % 2 ? -200 : 220}deg)` },
      { transform: 'translateY(0) rotate(360deg)' }
    ], { duration: dauerMs, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' }));
    const notfall = new Promise(r => setTimeout(r, dauerMs + 1000));
    /* Augen erst zur Hälfte wechseln: Man sieht nicht vorher, was kommt, aber das Ergebnis steht schon fest */
    setTimeout(ende, dauerMs / 2);
    return Promise.race([Promise.all(animationen.map(a => a.finished)), notfall]).then(() => { ende(); animationen.forEach(a => a.cancel()); }, () => { ende(); });
  }

  CB.wuerfel = { zeichnen, setzen, aufgeklappt, werfen, AUGEN };
})();
