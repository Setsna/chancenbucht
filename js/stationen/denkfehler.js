/* Chancenbucht: Station „Kann das stimmen?“ (Etappe 5d).
   Klassisches Skript, trägt sich in CB.stationen.denkfehler ein. Braucht CB.config, CB.zufall, CB.kiste, CB.rad,
   CB.wuerfel, CB.saeulen, CB.denkfehlerAufgaben, CB.teile, CB.stand. Die App ruft oeffnen(ctx) und bedienen(e).

   Ablauf je Szene (Entwurf Dateien/Beispiele-Entwuerfe/denkfehler.md, von Ingo freigegeben am 15.11.2026):
     1. Würfis Behauptung, Antwort „Das stimmt.“ / „Das stimmt nicht.“ (zwei Versuche)
     2. „Probieren wir es aus“ (Pflicht): Versuch mit vielen Wiederholungen. Hinweis, kein Beweis, nie bewertet.
     3. „Warum?“: drei Sätze, genau einer passt (zweiter Fehlversuch zeigt ihn).
     4. Würfis Schluss.
   Geschafft heißt: die Antwort war im ersten oder zweiten Versuch richtig (Ingo, Frage 4).
   Ob die Behauptung stimmt, kommt aus dem Generator (aus dem Material berechnet), nie aus dem Versuch.
   Gespeichert werden nur runden und stempel. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  CB.stationen = CB.stationen || {};
  const ID = 'denkfehler', P = 'df';
  const D = () => CB.denkfehlerAufgaben;
  const ST = () => CB.stand;
  const T = () => CB.teile;
  const Z = () => CB.zufall;
  const F = id => CB.config.farben.find(f => f.id === id);
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };
  const AUGEN = ['1', '2', '3', '4', '5', '6'];
  const SUMMEN = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const MATERIAL_WORT = { kiste: 'die Kiste', rad: 'das Rad', wuerfel: 'den Würfel', zweiKisten: 'die beiden Kisten', zweiWuerfel: 'die zwei Würfel' };

  let ctx = null, z = null, hilfeStufe = 0;
  const esc = s => ctx.esc(s);
  const kopf = unterzeile => T().kopf(ctx, { titel: 'Kann das stimmen?', unterzeile, praefix: P });
  const fokusAuf = sel => T().fokus(ctx, sel);
  const SO_GEHTS = offen => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: ['Lies, was Würfi sagt.', 'Entscheide: Stimmt das?', 'Probier es aus und schau genau hin.'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Würfi prüfen', offen, schritte: [
    'Sucht euch eine Behauptung aus, zum Beispiel: „Nach dreimal Blau kommt sicher Rot.“',
    'Legt zwei rote und zwei blaue Steckwürfel in einen Beutel. Zieht, schreibt auf und legt immer zurück.',
    'Zieht 40-mal. Sucht in eurer Liste alle Stellen mit dreimal Blau. Was kam danach?',
    'Erfindet eine eigene Behauptung über den Zufall. Kann euer Partner sie prüfen?'], notiz: 'Material: Beutel, Steckwürfel in zwei Farben, Stift, Heft.' });
  const WOERTER_EXTRA = [['gleiche Chance', 'Beides kommt gleich leicht dran.'], ['größere Chance', 'Das kommt eher dran.']];
  const stempelSvg = () => T().stempel('<circle class="stempel__welle" cx="45" cy="45" r="13"/><path class="stempel__welle" d="M54 54 L66 66"/><path class="stempel__welle" d="M41 41 q4 -6 8 -1 q2 4 -4 6 l0 3"/><circle class="stempel__kugel" cx="45" cy="53" r="1.8"/>');

  /* ---------- Stufenwahl ---------- */
  function ansichtStufen() {
    z = null;
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Behauptungen prüfen')}
      ${erstesMal ? '<p class="wuerfi-satz">Ich sage manchmal Dinge über den Zufall. Manche stimmen, manche nicht. Prüf mich!</p>' : ''}
      ${SO_GEHTS(erstesMal)}
      ${T().stufenListe(ctx, ID, P)}
      ${AM_TISCH(false)}`, 'Kann das stimmen?');
  }

  /* ---------- Runde ---------- */
  function rundeStarten(stufe) {
    z = { stufe, aufgaben: D().runde(stufe, Z()), i: 0, geschafft: [], gespeichertFehler: false };
    aufgabeZeigen();
  }
  const aufgabe = () => z && z.aufgaben[z.i];
  function aufgabeZeigen() {
    const a = aufgabe();
    hilfeStufe = 0;
    a.zustand = { versuche: 0, phase: 'start', fertig: false, geschafft: false, versuch: null, schatten: null, frueh: false, begrVersuche: 0 };
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`)}
      <div class="station-flaeche">
        <div class="buehne" id="df-buehne"></div>
        <section class="papier aufgabe" id="df-aufgabe" aria-labelledby="df-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Kann das stimmen?`);
    zeichneAufgabe();
  }

  /* ---------- Bühne ---------- */
  const radFelder = rad => rad.flatMap(f => Array(f.felder).fill(f.farbe));
  const figur = (svg, titel) => { const fig = document.createElement('figure'); fig.className = 'kiste-figur'; fig.appendChild(svg); if (titel) { const c = document.createElement('figcaption'); c.textContent = titel; fig.appendChild(c); } return fig; };
  const farbName = id => F(id).name;
  function vorherHtml(a) {
    if (a.gezogen) return `<div class="vorher" role="img" aria-label="Würfi hat gezogen: ${a.gezogen.map(farbName).join(', ')}"><span class="vorher__text" aria-hidden="true">Gezogen:</span>${a.gezogen.map(f => `<span aria-hidden="true">${T().kugelSymbol(f)}</span>`).join('')}</div>`;
    if (a.szene === 'selten') return `<div class="vorher" role="img" aria-label="Die letzten 5 Drehungen: ${a.vorher.map(farbName).join(', ')}"><span class="vorher__text" aria-hidden="true">Die letzten 5:</span>${a.vorher.map(f => `<span aria-hidden="true">${T().kugelSymbol(f)}</span>`).join('')}</div>`;
    if (a.szene === 'dranSein') return `<div class="vorher" role="img" aria-label="Die letzten 10 Würfe: ${a.vorher.join(', ')}. Keine 6."><span class="vorher__text" aria-hidden="true">Die letzten 10:</span>${a.vorher.map(x => `<span aria-hidden="true">${CB.wuerfel.zeichnen(x, { klein: true }).outerHTML}</span>`).join('')}</div>`;
    return '';
  }
  function buehne() {
    const a = aufgabe(), s = a.zustand, m = a.material;
    const b = ctx.app.querySelector('#df-buehne');
    b.textContent = '';
    if (m.typ === 'kiste') b.appendChild(figur(CB.kiste.zeichnen(m.kiste, { mischen: null }), 'Die Kugel kommt nach jedem Zug zurück.'));
    else if (m.typ === 'rad') b.appendChild(figur(CB.rad.zeichnen(radFelder(m.rad))));
    else if (m.typ === 'zweiKisten') {
      const r = document.createElement('div'); r.className = 'kisten-reihe';
      r.appendChild(figur(CB.kiste.zeichnen(m.a, { titel: 'Kiste A: ' + CB.kiste.beschreibung(m.a) }), 'Kiste A'));
      r.appendChild(figur(CB.kiste.zeichnen(m.b, { titel: 'Kiste B: ' + CB.kiste.beschreibung(m.b) }), 'Kiste B'));
      b.appendChild(r);
    } else {
      const r = document.createElement('div'); r.className = 'wuerfel-reihe';
      r.appendChild(CB.wuerfel.zeichnen(6));
      if (m.typ === 'zweiWuerfel') r.appendChild(CB.wuerfel.zeichnen(1));
      b.appendChild(r);
    }
    b.insertAdjacentHTML('beforeend', vorherHtml(a));
    if (s.versuch && s.versuch.feld) { b.appendChild(legende('Blau', 'der Zug danach')); b.appendChild(zugFeld(s.versuch)); }
  }
  /* 100 Züge als kleine Reihe aus Buchstaben (B/R), dreimal Blau umrandet, der Zug danach hervorgehoben */
  /* B15: Legende über dem Feld, damit Rahmen und dunkles Kästchen ohne Erklärung lesbar sind */
  function legende(was, danachWort) {
    const p = document.createElement('p');
    p.className = 'wurf-legende';
    p.innerHTML = '<span class="wurf-legende__teil"><span class="wurf-feld__wurf ist-reihe" aria-hidden="true">&nbsp;</span> umrandet: dreimal ' + was + ' hintereinander</span>'
      + '<span class="wurf-legende__teil"><span class="wurf-feld__wurf ist-danach" aria-hidden="true">&nbsp;</span> dunkel: ' + danachWort + '</span>';
    return p;
  }
  function zugFeld(v) {
    const d = document.createElement('div');
    d.className = 'wurf-feld';
    const markiert = new Set(), danach = new Set();
    for (const i of v.stellen) { markiert.add(i); markiert.add(i + 1); markiert.add(i + 2); danach.add(i + 3); }
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', `${v.zuege.length} Züge. ${v.stellen.length}-mal dreimal Blau hintereinander.`);
    v.zuege.forEach((f, i) => {
      const e = document.createElement('span');
      e.className = 'wurf-feld__wurf wurf-feld__wurf--' + (f === 'blau' ? 'kopf' : 'zahl') + (markiert.has(i) ? ' ist-reihe' : '') + (danach.has(i) ? ' ist-danach' : '');
      e.textContent = F(f).name[0];
      e.setAttribute('aria-hidden', 'true');
      d.appendChild(e);
    });
    return d;
  }

  /* ---------- Versuche (Hinweis, kein Beweis) ---------- */
  function zaehle(liste) { const c = {}; for (const x of liste) c[x] = (c[x] || 0) + 1; return c; }
  function versuchMachen(a) {
    const v = a.versuch, m = a.material;
    if (v.typ === 'kisteAuszaehlen') {
      const zuege = Array.from({ length: v.n }, () => Z().ziehe(m.kiste));
      const stellen = [], danach = {};
      for (let i = 0; i + v.laenge < zuege.length; i++) {
        let ok = true;
        for (let k = 0; k < v.laenge; k++) if (zuege[i + k] !== v.farbe) { ok = false; break; }
        if (ok) { stellen.push(i); danach[zuege[i + v.laenge]] = (danach[zuege[i + v.laenge]] || 0) + 1; }
      }
      return { feld: true, zuege, stellen, danach, zaehlung: zaehle(zuege), farben: Object.keys(m.kiste) };
    }
    if (v.typ === 'kiste') return { zaehlung: zaehle(Array.from({ length: v.n }, () => Z().ziehe(m.kiste))), farben: Object.keys(m.kiste), n: v.n };
    if (v.typ === 'rad') { const liste = CB.rad.radListe(radFelder(m.rad)); return { zaehlung: zaehle(Array.from({ length: v.n }, () => Z().drehe(liste).farbe)), farben: m.rad.map(f => f.farbe), n: v.n }; }
    if (v.typ === 'zweiKisten') return { a: zaehle(Array.from({ length: v.n }, () => Z().ziehe(m.a))), b: zaehle(Array.from({ length: v.n }, () => Z().ziehe(m.b))), farben: ['rot', 'blau'], n: v.n };
    if (v.typ === 'wuerfel') return { zaehlung: zaehle(Array.from({ length: v.n }, () => String(Z().wuerfle(1)[0]))), n: v.n };
    if (v.typ === 'zweiWuerfel') return { zaehlung: zaehle(Array.from({ length: v.n }, () => { const w = Z().wuerfle(2); return String(w[0] + w[1]); })), n: v.n };
    throw new Error('unbekannter Versuch ' + v.typ);
  }
  function versuchText(a, v) {
    const t = a.versuch.typ;
    if (t === 'kisteAuszaehlen') {
      const n = v.stellen.length;
      if (!n) return `Würfi hat ${v.zuege.length}-mal gezogen. Dreimal Blau hintereinander kam diesmal nicht vor.`;
      return `Würfi hat ${v.zuege.length}-mal gezogen. ${n}-mal kam dreimal Blau hintereinander. Danach kam ${v.danach.blau || 0}-mal Blau und ${v.danach.rot || 0}-mal Rot.`;
    }
    if (t === 'zweiKisten') return `Würfi hat aus jeder Kiste ${v.n}-mal gezogen. Aus A kam ${v.a.rot || 0}-mal Rot, aus B ${v.b.rot || 0}-mal Rot.`;
    if (t === 'kiste') return `Würfi hat ${v.n}-mal gezogen: ` + v.farben.map(f => `${F(f).name} ${v.zaehlung[f] || 0}-mal`).join(', ') + '.';
    if (t === 'rad') return `Würfi hat ${v.n}-mal gedreht: ` + v.farben.map(f => `${F(f).name} ${v.zaehlung[f] || 0}-mal`).join(', ') + '.';
    if (t === 'wuerfel') return `Würfi hat ${v.n}-mal gewürfelt: ` + AUGEN.map(x => `${x}: ${v.zaehlung[x] || 0}`).join(' · ') + '.' + (a.versuch.satz ? ' ' + a.versuch.satz : '');
    return `Würfi hat ${v.n}-mal mit zwei Würfeln gewürfelt.` + (a.summen ? ` Die ${a.summen[0]} kam ${v.zaehlung[a.summen[0]] || 0}-mal, die ${a.summen[1]} ${v.zaehlung[a.summen[1]] || 0}-mal.` : ` Die 7 kam ${v.zaehlung[7] || 0}-mal, die anderen Summen ${v.n - (v.zaehlung[7] || 0)}-mal.`);
  }
  function versuchDarstellen(a) {
    const v = a.zustand.versuch, ort = ctx.app.querySelector('#df-versuch');
    if (!v || !ort) return;
    const t = a.versuch.typ;
    const neutral = ids => ids.map(id => ({ id, name: id, farbe: 'neutral' }));
    const saeulen = (kat, werte, schatten, titel) => { const d = CB.saeulen.zeichnen({ kategorien: kat, werte, schatten, titel }); const w = document.createElement('div'); w.className = 'diagramm'; w.appendChild(d.svg); w.appendChild(d.tabelle); return w; };
    ort.textContent = '';
    if (t === 'kisteAuszaehlen' || t === 'kiste' || t === 'rad') {
      ort.insertAdjacentHTML('beforeend', T().strichliste(ctx, v.farben, v.zaehlung));
      const d = document.createElement('div'); d.className = 'diagramm'; ort.appendChild(d);
      T().diagramm(d, v.farben, v.zaehlung, null, t === 'rad' ? 'Gedrehte Farben' : 'Gezogene Kugeln');
    } else if (t === 'zweiKisten') {
      const w = document.createElement('div'); w.className = 'diagramme diagramme--zwei';
      for (const [k, name] of [['a', 'Kiste A'], ['b', 'Kiste B']]) { const d = document.createElement('div'); d.className = 'diagramm'; w.appendChild(d); T().diagramm(d, v.farben, v[k], null, name); }
      ort.appendChild(w);
    } else if (t === 'wuerfel') ort.appendChild(saeulen(neutral(AUGEN), v.zaehlung, a.zustand.schatten, 'Gewürfelte Zahlen'));
    else { const d = saeulen(neutral(SUMMEN), v.zaehlung, null, 'Gewürfelte Summen'); d.classList.add('diagramm--breit'); ort.appendChild(d); }
  }

  /* ---------- Aufgabe ---------- */
  function zeichneAufgabe() { buehne(); panel(); }
  function panel() {
    const a = aufgabe(), s = a.zustand;
    const ziel = ctx.app.querySelector('#df-aufgabe');
    const rueck = `<p class="rueckmeldung" id="df-rueck" role="status">${s.rueck ? esc(s.rueck) : ''}</p>`;
    const weiterKnopf = `<button type="button" class="knopf haupt" data-df="weiter">${z.i + 1 < z.aufgaben.length ? 'Weiter' : 'Zum Rundenende'}</button>`;
    const antwortGesperrt = s.phase !== 'start';
    const versuchFrei = s.phase === 'versuch' || (s.frueh && s.phase === 'start');
    ziel.innerHTML = `<p class="wuerfi-sagt">Würfi sagt:</p>
      <p class="aussage" id="df-frage">„${esc(a.behauptung)}“</p>
      <h2 class="frage-klein">Kann das stimmen?</h2>
      <div class="antworten antworten--zwei" role="group" aria-label="Antworten">
        ${a.antworten.map(x => `<button type="button" class="knopf antwort-knopf${s.antwortRichtig && x.id === a.loesung ? ' ist-richtig' : ''}" data-df="antwort" data-id="${x.id}"${antwortGesperrt ? ' disabled' : ''}>${esc(x.text)}</button>`).join('')}
      </div>
      ${rueck}
      ${versuchFrei && !s.versuch ? `<p class="knopfreihe"><button type="button" class="knopf haupt" data-df="versuch">Probieren wir es aus</button></p>` : ''}
      ${s.versuch ? `<p class="versuch-text">${esc(versuchText(a, s.versuch))}</p><div id="df-versuch"></div>${a.versuch.schatten && !s.schatten && s.phase !== 'start' ? '<p class="knopfreihe"><button type="button" class="knopf" data-df="noch">Noch einmal ' + a.versuch.n + '</button></p>' : ''}${s.schatten ? '<p>Vergleich die beiden Male. Sind sie gleich?</p>' : ''}` : ''}
      ${s.phase === 'begr' || s.phase === 'ende' ? `
        <h2 class="frage-klein">Warum? Tippe den passenden Satz an.</h2>
        <div class="begruendungen" role="group" aria-label="Begründungen">
          ${a.begruendungen.map((b, i) => `<button type="button" class="knopf begr-knopf${s.begrRichtig && b.richtig ? ' ist-richtig' : ''}" data-df="begr" data-i="${i}"${s.phase !== 'begr' ? ' disabled' : ''}>${esc(b.text)}</button>`).join('')}
        </div>` : ''}
      ${s.begrRueck ? `<p class="rueckmeldung">${esc(s.begrRueck)}</p>` : ''}
      ${s.fertig ? `<div class="tipp tipp--schluss">${ctx.wuerfiKlein}<p>${esc(a.schluss)}</p></div><p class="knopfreihe">${weiterKnopf}</p>` : ''}`;
    versuchDarstellen(a);
    T().nachZeichnen(ziel, s, a);
  }

  /* ---------- Bewerten ---------- */
  function zaehlen(a, geschafft) {
    if (!geschafft || a.zustand.geschafft) return;
    a.zustand.geschafft = true; z.geschafft[z.i] = true;
    if (!ST().istVorschau && ST().rundeGeschafft(ID, z.stufe) === false) z.gespeichertFehler = true;
  }
  function antwort(id) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'start') return;
    s.versuche++;
    if (id === a.loesung) { s.phase = 'versuch'; s.antwortRichtig = true; s.rueck = 'Gut geprüft.'; zaehlen(a, true); }
    else if (s.versuche === 1) s.rueck = `Schau noch einmal genau auf ${MATERIAL_WORT[a.material.typ]}.`;
    else { s.phase = 'versuch'; s.antwortRichtig = true; s.rueck = `Hier ist die Lösung: ${a.loesung === 'ja' ? 'Das stimmt.' : 'Das stimmt nicht.'}`; }
    if (s.phase === 'versuch' && s.versuch) s.phase = 'begr';   /* schon früh ausprobiert (Tipp 3) */
    zeichneAufgabe();
    ctx.ansagen(s.rueck + (s.phase === 'versuch' ? ' Probier es jetzt aus.' : ''));
    fokusAuf(s.phase === 'versuch' ? '[data-df="versuch"]' : s.phase === 'begr' ? '.begr-knopf' : '.antwort-knopf:not([disabled])');
  }
  function versuch() {
    const a = aufgabe(), s = a.zustand;
    if (s.versuch || !(s.phase === 'versuch' || (s.frueh && s.phase === 'start'))) return;
    s.versuch = versuchMachen(a);
    if (s.phase === 'versuch') s.phase = 'begr';
    zeichneAufgabe();
    ctx.ansagen(versuchText(a, s.versuch) + (s.phase === 'begr' ? ' Warum? Tippe den passenden Satz an.' : ''));
    fokusAuf(s.phase === 'begr' ? '.begr-knopf' : '.antwort-knopf');
  }
  function noch() {
    const a = aufgabe(), s = a.zustand;
    if (!s.versuch || s.schatten || !a.versuch.schatten) return;
    s.schatten = s.versuch.zaehlung;
    s.versuch = versuchMachen(a);
    zeichneAufgabe();
    ctx.ansagen(versuchText(a, s.versuch) + ' Die alten Säulen sind blass daneben.');
    fokusAuf(s.fertig ? '[data-df="weiter"]' : '.begr-knopf');
  }
  function begruendung(i) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'begr') return;
    const b = a.begruendungen[i];
    s.begrVersuche++;
    if (b.richtig || s.begrVersuche >= 2) {
      s.begrRichtig = true; s.phase = 'ende'; s.fertig = true;
      s.begrRueck = b.richtig ? 'Genau.' : 'Dieser Satz passt: ' + a.begruendungen.find(x => x.richtig).text;
    } else s.begrRueck = `Noch nicht ganz. Schau auf ${MATERIAL_WORT[a.material.typ]}, nicht auf das, was vorher passiert ist.`;
    zeichneAufgabe();
    ctx.ansagen(s.begrRueck + (s.fertig ? ' ' + a.schluss : ''));
    fokusAuf(s.fertig ? '[data-df="weiter"]' : '.begr-knopf');
  }

  function weiter() {
    if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); return; }
    const r = T().rundenende(ctx, { id: ID, praefix: P, stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    ctx.zeigen(`${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}${r.html}${AM_TISCH(false)}`, 'Rundenende – Kann das stimmen?');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  /* ---------- Hilfe ---------- */
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) {
      T().dialog(ctx, { titel: 'Tipp von Würfi', inhalt: `<div class="tipp">${ctx.wuerfiKlein}<p>Wähle eine Stufe. Ich empfehle dir die Stufe mit dem Wort „empfohlen“.</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' });
      return;
    }
    const s = a.zustand;
    const was = { kiste: 'Kugeln', zweiKisten: 'Kugeln', rad: 'Felder', wuerfel: 'Seiten', zweiWuerfel: 'Würfe' }[a.material.typ];
    const liste = [`Schau nicht auf das, was vorher passiert ist. Schau auf ${MATERIAL_WORT[a.material.typ]}.`, `Zähl nach: Wie viele ${was} passen?`, 'Probier es aus und schau, ob es zu meinem Satz passt.'];
    const erlaubt = !s.versuche ? 2 : 3;
    const bis = Math.min(hilfeStufe, erlaubt - 1);
    if (bis >= 2 && !s.frueh && s.phase === 'start') { s.frueh = true; panel(); }
    T().tippDialog(ctx, { liste, bis, erlaubt, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }

  /* ---------- Bedienung ---------- */
  function bedienen(e) {
    const b = e.target.closest('[data-df]');
    if (!b || b.disabled) return false;
    const w = b.dataset.df;
    if (w === 'stufe') rundeStarten(b.dataset.stufe);
    else if (w === 'stufen') ansichtStufen();
    else if (w === 'hilfe') hilfeZeigen();
    else if (w === 'woerter') T().woerter(ctx, WOERTER_EXTRA);
    else if (w === 'antwort') antwort(b.dataset.id);
    else if (w === 'versuch') versuch();
    else if (w === 'noch') noch();
    else if (w === 'begr') begruendung(Number(b.dataset.i));
    else if (w === 'weiter') weiter();
    else return false;
    return true;
  }

  CB.stationen[ID] = { stempelSvg, id: ID, oeffnen(c) { ctx = c; ansichtStufen(); }, bedienen, aufgabe, zustand: () => z };
})();
