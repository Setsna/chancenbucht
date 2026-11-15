/* Chancenbucht: Münze als SVG (Code-Grafik) und die Wurf-Animation.
   Klassisches Skript, legt window.CB.muenze an.

   Eigene Münze, kein echtes Geld (CLAUDE.md): kein Wert, keine Währung.
     Kopf: Würfis Kopf als schlichte Prägung (kastenförmiger Kofferfisch von vorn).
     Zahl: eine große 1 über einer Welle.
   Die Seiten unterscheiden sich in Bild und Form, nicht nur in der Farbe.

   CB.muenze.zeichnen(seite, opt) gibt ein <svg> zurück, seite 'kopf' oder 'zahl'.
     opt.klein, opt.blass, opt.titel wie beim Würfel.
   CB.muenze.setzen(svg, seite) ändert die Seite.
   CB.muenze.seiten(passend) zeigt beide Seiten klein nebeneinander, passende hell.
   CB.muenze.werfen(svgs, ergebnisse) dreht die Münzen kurz um die waagerechte Achse und zeigt DANACH die vorher
     bestimmten Seiten (Ausgang zuerst, dann Animation). Nur transform. Bei reduzierter Bewegung, verdecktem Fenster
     oder wenn die Animation hängt (Dauer + 1 s): sofort das Ergebnis.
   Keine style-Attribute (CSP), nur Klassen. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (p) p.appendChild(e); return e; };
  const SEITEN = ['kopf', 'zahl'];
  const NAME = { kopf: 'Kopf', zahl: 'Zahl' };
  const titelVon = seite => `Münze, ${NAME[seite]} liegt oben`;

  function bild(g, seite) {
    g.textContent = '';
    el('circle', { class: 'muenze__rand', cx: 50, cy: 50, r: 47 }, g);
    /* geriffelter Rand: kurze Striche rundum */
    const riffel = el('g', { class: 'muenze__riffel' }, g);
    for (let i = 0; i < 48; i++) {
      const w = (i / 48) * 2 * Math.PI, c = Math.cos(w), s = Math.sin(w);
      el('line', { x1: (50 + 41 * c).toFixed(2), y1: (50 + 41 * s).toFixed(2), x2: (50 + 45 * c).toFixed(2), y2: (50 + 45 * s).toFixed(2) }, riffel);
    }
    el('circle', { class: 'muenze__feld', cx: 50, cy: 50, r: 39 }, g);
    const p = el('g', { class: 'muenze__praegung muenze__praegung--' + seite }, g);
    if (seite === 'kopf') {
      /* Kofferfisch von vorn: kastenförmiger Kopf, zwei Augen, kleiner runder Mund, zwei Flossen */
      el('path', { class: 'muenze__linie', d: 'M27 50 q-7 -6 -9 -1 q2 6 9 4' }, p);
      el('path', { class: 'muenze__linie', d: 'M73 50 q7 -6 9 -1 q-2 6 -9 4' }, p);
      el('rect', { class: 'muenze__linie', x: 28, y: 28, width: 44, height: 44, rx: 12 }, p);
      el('path', { class: 'muenze__linie muenze__linie--fein', d: 'M40 30 l-5 7 l5 7 l10 0 l5 -7 l-5 -7 M60 30 l5 7' }, p);
      el('circle', { class: 'muenze__voll', cx: 41, cy: 50, r: 4.2 }, p);
      el('circle', { class: 'muenze__voll', cx: 59, cy: 50, r: 4.2 }, p);
      el('ellipse', { class: 'muenze__linie', cx: 50, cy: 62, rx: 4, ry: 3.2 }, p);
    } else {
      /* große 1, darunter eine Welle */
      el('path', { class: 'muenze__ziffer', d: 'M44 34 L54 27 L54 62 M45 62 L63 62' }, p);
      el('path', { class: 'muenze__linie', d: 'M28 72 q5.5 -6 11 0 t11 0 t11 0 t11 0' }, p);
    }
  }

  function zeichnen(seite, opt = {}) {
    if (!SEITEN.includes(seite)) throw new Error('Münze braucht kopf oder zahl, bekommen: ' + seite);
    const svg = el('svg', { class: 'muenze' + (opt.klein ? ' muenze--klein' : '') + (opt.blass ? ' muenze--blass' : ''), viewBox: '0 0 100 100', role: 'img', focusable: 'false', 'data-seite': seite });
    el('title', {}, svg).textContent = opt.titel || titelVon(seite);
    bild(el('g', { class: 'muenze__bild' }, svg), seite);
    return svg;
  }
  function setzen(svg, seite) {
    if (!SEITEN.includes(seite)) throw new Error('Münze braucht kopf oder zahl, bekommen: ' + seite);
    bild(svg.querySelector('.muenze__bild'), seite);
    svg.setAttribute('data-seite', seite);
    svg.querySelector('title').textContent = titelVon(seite);
  }

  /* Beide Seiten nebeneinander; passend = Liste der passenden Seiten */
  function seiten(passend = []) {
    const div = document.createElement('div');
    div.className = 'muenze-seiten';
    div.setAttribute('role', 'img');
    div.setAttribute('aria-label', 'Die zwei Seiten der Münze: Kopf und Zahl.' + (passend.length ? ' Passend: ' + passend.map(s => NAME[s]).join(' und ') + '.' : ''));
    for (const s of SEITEN) {
      const m = zeichnen(s, { klein: true, blass: passend.length > 0 && !passend.includes(s) });
      m.setAttribute('aria-hidden', 'true');
      div.appendChild(m);
    }
    return div;
  }

  const ruhig = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function werfen(svgs, ergebnisse, dauerMs = 700) {
    const ende = () => svgs.forEach((s, i) => setzen(s, ergebnisse[i]));
    if (ruhig() || document.hidden || !svgs.length || typeof svgs[0].animate !== 'function') {
      ende();
      if (svgs.length && typeof svgs[0].animate === 'function') svgs.forEach(s => s.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 200 }));
      return Promise.resolve();
    }
    /* Drehen um die waagerechte Achse: scaleY geht durch 0 (Kante), dazu ein kleiner Bogen nach oben */
    const animationen = svgs.map(s => s.animate([
      { transform: 'translateY(0) scaleY(1)' },
      { transform: 'translateY(-12%) scaleY(0.05)' },
      { transform: 'translateY(-18%) scaleY(1)' },
      { transform: 'translateY(-12%) scaleY(0.05)' },
      { transform: 'translateY(0) scaleY(1)' }
    ], { duration: dauerMs, easing: 'ease-in-out' }));
    const notfall = new Promise(r => setTimeout(r, dauerMs + 1000));
    /* Seite erst in der letzten Drehung wechseln: Das Ergebnis steht schon fest, man sieht es nur noch nicht */
    setTimeout(ende, dauerMs * 0.75);
    return Promise.race([Promise.all(animationen.map(a => a.finished)), notfall]).then(() => { ende(); animationen.forEach(a => a.cancel()); }, () => { ende(); });
  }

  CB.muenze = { zeichnen, setzen, seiten, werfen, SEITEN, NAME };
})();
