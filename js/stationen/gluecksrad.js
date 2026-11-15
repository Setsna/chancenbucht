/* Chancenbucht: Station Glücksrad (Etappe 3c).
   Klassisches Skript, trägt sich in CB.stationen.gluecksrad ein. Braucht CB.config, CB.zufall, CB.einordnung, CB.rad,
   CB.saeulen, CB.gluecksradAufgaben, CB.teile (js/station-teile.js), CB.stand. Die App ruft oeffnen(ctx) und bedienen(e).

   Fachliche Regeln (CLAUDE.md):
   - Bewertet wird die Einordnung oder Vermutung, nie eine einzelne Drehung.
   - Der Ausgang steht fest, BEVOR das Rad dreht (CB.zufall.drehe). Die Animation dreht nur noch dorthin.
     Bei reduzierter Bewegung (oder verdecktem Fenster) springt das Rad ohne Drehung.
   - Gespeichert werden nur runden und stempel. Vermutungen, Drehungen, Strichlisten nicht.
   - „Glücksrad“ nur als Name. In Aufgaben und Rückmeldungen „das Rad“ und „Chance“, nie „Gewinn“.
   Texte nach Dateien/Beispiele-Entwuerfe/gluecksrad.md (von Ingo freigegeben am 15.11.2026). */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  CB.stationen = CB.stationen || {};
  const ID = 'gluecksrad', P = 'gr';
  const C = () => CB.config;
  const E = () => CB.einordnung;
  const A = () => CB.gluecksradAufgaben;
  const ST = () => CB.stand;
  const T = () => CB.teile;
  const F = id => C().farben.find(f => f.id === id);
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };

  let ctx = null, z = null, hilfeStufe = 0;
  const esc = s => ctx.esc(s);
  const kugelSymbol = id => T().kugelSymbol(id);
  const kopf = unterzeile => T().kopf(ctx, { titel: 'Glücksrad', unterzeile, praefix: P });
  const fokusAuf = sel => T().fokus(ctx, sel);
  const SO_GEHTS = offen => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: [
    'Schau dir das Rad an. Zähl die Felder in jeder Farbe.', 'Lies den Satz unter dem Rad.', 'Tippe an, wie wahrscheinlich das ist.'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Dein eigenes Rad', offen, schritte: [
    'Leg einen Teller auf Papier und fahre den Rand nach. Schneide den Kreis aus.',
    'Falte ihn zweimal und dann noch einmal. Wenn du ihn aufklappst, hat er 8 gleich große Felder.',
    'Male die Felder an, zum Beispiel 5 blau und 3 rot.',
    'Steck einen Bleistift durch eine Büroklammer in die Mitte. Schnipse die Büroklammer an. Wo sie stehen bleibt, das zählt.',
    'Vermute zuerst, dann dreh 20-mal und mach eine Strichliste.',
    'Male ein neues Rad, bei dem Rot und Blau die gleiche Chance haben. Probier es aus.'],
    notiz: 'Material: Teller, Papier, Schere, Stifte, Bleistift, Büroklammer.' });
  const WOERTER_EXTRA = [['hat die größere Chance', 'Das passiert eher als das andere.'], ['hat die gleiche Chance', 'Keins ist im Vorteil.']];
  const stempelSvg = () => T().stempel('<circle class="stempel__welle" cx="50" cy="55" r="17"/><path class="stempel__welle" d="M50 38v34M64.7 46.5L35.3 63.5M64.7 63.5L35.3 46.5"/><path class="stempel__kugel" d="M44 28h12l-6 9z"/>');

  /* ---------- Stufenwahl ---------- */
  function ansichtStufen() {
    z = null;
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Drehen und zählen')}
      ${erstesMal ? '<p class="wuerfi-satz">Mein Rad hat gleich große Felder. Wo der Zeiger oben hinzeigt, bleibt das Rad stehen. Du sagst, was passieren kann.</p>' : ''}
      ${SO_GEHTS(erstesMal)}
      ${T().stufenListe(ctx, ID, P)}
      ${AM_TISCH(false)}`, 'Glücksrad');
  }

  /* ---------- Runde ---------- */
  function rundeStarten(stufe) {
    z = { stufe, aufgaben: A().runde(stufe, CB.zufall), i: 0, geschafft: [], gespeichertFehler: false };
    aufgabeZeigen();
  }
  const aufgabe = () => z && z.aufgaben[z.i];
  function aufgabeZeigen() {
    const a = aufgabe();
    hilfeStufe = 0;
    a.zustand = { versuche: 0, phase: 'start', fertig: false, geschafft: false, felder: [], zaehlung: {}, gezogen: 0, schatten: null,
      vermutung: null, drehung: 0, dreht: false, letztes: null, hundert: null, wahl: [], nummernAn: false, hervorheben: null };
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`)}
      <div class="station-flaeche">
        <div class="buehne" id="gr-buehne"></div>
        <section class="papier aufgabe" id="gr-aufgabe" aria-labelledby="gr-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Glücksrad`);
    zeichneAufgabe();
  }

  /* ---------- Bühne: Rad(er) ---------- */
  function buehne() {
    const a = aufgabe(), s = a.zustand;
    const b = ctx.app.querySelector('#gr-buehne');
    b.textContent = '';
    const figur = (svg, titel) => { const fig = document.createElement('figure'); fig.className = 'kiste-figur'; fig.appendChild(svg); if (titel) { const c = document.createElement('figcaption'); c.textContent = titel; fig.appendChild(c); } return fig; };
    if (a.art === 'gestalten') {
      const felder = Array.from({ length: a.plaetze }, (_, i) => s.felder[i] || null);
      b.appendChild(figur(CB.rad.zeichnen(felder)));
      if (s.beispielZeigen) b.appendChild(figur(CB.rad.zeichnen(a.beispiel, { klein: true }), 'So würde es zum Beispiel passen'));
    } else if (a.art === 'gleicheChance') {
      const reihe = document.createElement('div'); reihe.className = 'kisten-reihe kisten-reihe--klein';
      a.raeder.forEach((r, i) => reihe.appendChild(figur(CB.rad.zeichnen(r, { klein: true, hervorheben: s.fertig ? [a.ziel] : null, titel: `Rad ${'ABC'[i]}: ` + CB.rad.beschreibung(r).replace('Rad mit 8 Feldern: ', '') }), `Rad ${'ABC'[i]}`)));
      b.appendChild(reihe);
    } else if (a.art === 'zahlenrad') {
      b.appendChild(figur(CB.rad.zeichnen(a.felder, { zahlen: a.zahlen, hervorheben: s.fertig ? (a.passend.length ? a.passend : [-1]) : null })));
    } else {
      b.appendChild(figur(CB.rad.zeichnen(a.felder, { drehung: s.drehung % 360, hervorheben: s.hervorheben, nummern: s.nummernAn })));
      if (a.art === 'vermuten') {
        const p = document.createElement('p'); p.className = 'rad-ergebnis'; p.id = 'gr-ergebnis';
        p.textContent = s.letztes ? `Das Rad steht auf ${F(s.letztes).name}.` : '';
        b.appendChild(p);
      }
    }
  }

  /* ---------- Aufgabe (rechte Seite) ---------- */
  function zeichneAufgabe() { buehne(); panel(); }
  function panel() {
    const a = aufgabe(), s = a.zustand;
    const ziel = ctx.app.querySelector('#gr-aufgabe');
    const rueck = `<p class="rueckmeldung" id="gr-rueck" role="status">${s.rueck ? esc(s.rueck) : ''}</p>`;
    const erkl = s.erklaerung ? `<p class="erklaerung">${esc(s.erklaerung)}</p>` : '';
    const weiterKnopf = `<button type="button" class="knopf haupt" data-gr="weiter">${z.i + 1 < z.aufgaben.length ? 'Weiter' : 'Zum Rundenende'}</button>`;
    const weiter = s.fertig ? `<p class="knopfreihe">${weiterKnopf}</p>` : '';
    let html = '';
    if (a.art === 'einordnen' || a.art === 'zahlenrad') {
      html = `<div class="wuerfi-aussage">${ctx.wuerfiKlein}<div><p class="nurvorlesen">Würfi sagt:</p><p class="aussage" id="gr-frage">${esc(a.satz)}</p></div></div>
        <h2 class="frage-klein">Wie wahrscheinlich ist das?</h2>
        <div class="skala" role="group" aria-label="Wahrscheinlichkeitsskala">
          ${a.antworten.map(w => `<button type="button" class="knopf skala-knopf skala-knopf--${w}${s.skalaRichtig && w === a.loesung ? ' ist-richtig' : ''}" data-gr="skala" data-wert="${w}"${s.phase !== 'start' ? ' disabled' : ''}>${esc(E().wort(w))}</button>`).join('')}
        </div>
        ${s.phase === 'begr' && !s.begrVersuche ? rueck : ''}${s.phase === 'begr' || s.begrGezeigt ? `
          <h2 class="frage-klein">Warum? Tippe den passenden Satz an.</h2>
          <div class="begruendungen" role="group" aria-label="Begründungen">
            ${a.begruendungen.map((b, i) => `<button type="button" class="knopf begr-knopf${s.begrRichtig && b.richtig ? ' ist-richtig' : ''}" data-gr="begr" data-i="${i}"${s.phase !== 'begr' ? ' disabled' : ''}>${esc(b.text)}</button>`).join('')}
          </div>` : ''}
        ${s.phase === 'begr' && !s.begrVersuche ? '' : rueck}${erkl}${weiter}`;
    } else if (a.art === 'gestalten') {
      const n = s.felder.length, voll = n >= a.plaetze;
      html = `<p class="auftrag">Färbe das Rad. Es hat ${a.plaetze} Felder. Dann soll gelten:</p>
        <p class="aussage" id="gr-frage">${esc(a.satz)}</p>
        <div class="farb-knoepfe" role="group" aria-label="Felder färben">
          ${C().farben.map(f => `<button type="button" class="knopf farb-knopf" data-gr="faerben" data-farbe="${f.id}" aria-label="Ein Feld ${esc(f.adj)} färben"${voll || s.fertig ? ' disabled' : ''}>${kugelSymbol(f.id)}<span>${esc(f.name)}</span></button>`).join('')}
        </div>
        <p class="knopfreihe">
          <button type="button" class="knopf" data-gr="leeren"${!n || s.fertig ? ' disabled' : ''}>Ein Feld leeren</button>
          <button type="button" class="knopf haupt" data-gr="pruefen"${!voll || s.fertig ? ' disabled' : ''}>Prüfen</button>
        </p>
        <p class="leise">${n} von ${a.plaetze} Feldern gefärbt</p>
        ${rueck}${erkl}${weiter}`;
    } else if (a.art === 'vermuten') {
      const offen = s.gezogen < a.zuege;
      html = `<p class="auftrag">Erst vermuten, dann drehen.</p>
        <p class="aussage" id="gr-frage">Wir drehen ${a.zuege}-mal. Auf welcher Farbe bleibt das Rad wohl am häufigsten stehen?</p>
        <div class="farb-knoepfe" role="group" aria-label="Deine Vermutung">
          ${a.antworten.map(id => `<button type="button" class="knopf farb-knopf" data-gr="vermuten" data-farbe="${id}" aria-pressed="${s.vermutung === id}"${s.phase !== 'start' ? ' disabled' : ''}>${kugelSymbol(id)}<span>${esc(F(id).name)}</span></button>`).join('')}
        </div>
        ${s.phase === 'start' ? `<p class="knopfreihe"><button type="button" class="knopf haupt" data-gr="vermutung-fest"${s.vermutung ? '' : ' disabled'}>Ich bin fertig mit Vermuten</button></p>` : `
        <div class="ziehen">
          ${s.fertig ? `${rueck}${erkl}<p class="knopfreihe">${s.hundert ? '' : '<button type="button" class="knopf" data-gr="hundert">Jetzt 100-mal drehen</button>'}${weiterKnopf}</p>` : `<p class="knopfreihe">
            <button type="button" class="knopf haupt dreh-knopf" data-gr="drehen" data-n="1"${offen && !s.dreht ? '' : ' disabled'}>Drehen</button>
            ${a.zuege - s.gezogen === 1 ? '' : `<button type="button" class="knopf" data-gr="drehen" data-n="10"${offen && !s.dreht ? '' : ' disabled'}>${a.zuege - s.gezogen > 0 ? Math.min(10, a.zuege - s.gezogen) : 10}-mal drehen</button>`}
          </p>`}
          <p class="leise">${s.gezogen} von ${a.zuege}-mal gedreht</p>
          <h3 class="frage-klein">Strichliste</h3>
          ${T().strichliste(ctx, a.antworten, s.zaehlung)}
          <div class="diagramme${s.hundert ? ' diagramme--zwei' : ''}">
            <div class="diagramm" id="gr-diagramm"></div>
            ${s.hundert ? '<div class="diagramm" id="gr-diagramm-100"></div>' : ''}
          </div>
          ${s.hundert ? '<p>Vergleich die beiden Diagramme mit dem Rad.</p>' : ''}
        </div>`}
        ${s.fertig ? '' : rueck + erkl}`;
    } else if (a.art === 'gleicheChance') {
      html = `<p class="aussage" id="gr-frage">${esc(a.satz)}</p>
        <div class="antworten antworten--reihe" role="group" aria-label="Räder wählen">
          ${[0, 1, 2].map(i => `<button type="button" class="knopf antwort-knopf${s.fertig && a.loesung.includes(i) ? ' ist-richtig' : ''}" data-gr="rad-wahl" data-i="${i}" aria-pressed="${s.wahl.includes(i)}"${s.fertig ? ' disabled' : ''}>Rad ${'ABC'[i]}</button>`).join('')}
        </div>
        ${s.fertig ? '' : `<p class="knopfreihe"><button type="button" class="knopf haupt" data-gr="wahl-pruefen"${s.wahl.length ? '' : ' disabled'}>Prüfen</button></p>`}
        ${rueck}${erkl}${weiter}`;
    } else if (a.art === 'groessereChance') {
      html = `<p class="aussage" id="gr-frage">${esc(a.satz)}</p>
        <div class="antworten" role="group" aria-label="Antworten">
          ${a.antworten.map(x => `<button type="button" class="knopf antwort-knopf${s.fertig && x.id === a.loesung ? ' ist-richtig' : ''}" data-gr="antwort" data-id="${x.id}"${s.fertig ? ' disabled' : ''}>${esc(x.text)}</button>`).join('')}
        </div>
        ${rueck}${erkl}${weiter}`;
    }
    ziel.innerHTML = html;
    T().nachZeichnen(ziel, s, a);
    if (a.art === 'vermuten' && s.phase !== 'start') {
      T().diagramm(ctx.app.querySelector('#gr-diagramm'), a.antworten, s.zaehlung, s.schatten, s.hundert ? `${a.zuege}-mal gedreht` : 'Wo das Rad stehen blieb');
      if (s.hundert) T().diagramm(ctx.app.querySelector('#gr-diagramm-100'), a.antworten, s.hundert, null, '100-mal gedreht');
    }
  }

  /* ---------- Bewerten ---------- */
  function fertig(a, geschafft) {
    const s = a.zustand;
    s.fertig = true;
    if (s.geschafft || !geschafft) return;
    s.geschafft = true;
    z.geschafft[z.i] = true;
    if (!ST().istVorschau && ST().rundeGeschafft(ID, z.stufe) === false) z.gespeichertFehler = true;
  }
  const melde = s => ctx.ansagen(s.rueck + (s.erklaerung ? ' ' + s.erklaerung : ''));

  function skalaGewaehlt(wert) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'start') return;
    s.versuche++;
    if (wert === a.loesung) {
      s.phase = 'begr'; s.skalaRichtig = true; s.skalaGeschafft = true; s.hervorheben = null;
      s.rueck = `Das stimmt. Das ist ${E().wort(a.loesung)}.`;
    } else if (s.versuche === 1) {
      if (a.art === 'zahlenrad') s.rueck = 'Noch nicht ganz. Lies jede Zahl und zähl, wie viele zum Satz passen.';
      else { s.rueck = `Noch nicht ganz. Zähl die ${a.satzArt === 'oder' ? 'Felder aus dem Satz' : F(a.ziel[0]).plural + ' Felder'} noch einmal.`; s.hervorheben = a.ziel.slice(); }
    } else {
      s.phase = 'begr'; s.skalaRichtig = true; s.skalaGeschafft = false; s.hervorheben = null;
      s.rueck = `Hier ist die Lösung: Das ist ${E().wort(a.loesung)}. Jetzt such den passenden Satz dazu.`;
    }
    s.begrGezeigt = s.phase === 'begr'; s.begrVersuche = 0;
    zeichneAufgabe(); ctx.ansagen(s.rueck);
    fokusAuf(s.phase === 'begr' ? '.begr-knopf' : '.skala-knopf:not([disabled])');
  }
  function begruendungGewaehlt(i) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'begr') return;
    const b = a.begruendungen[i];
    s.begrVersuche++;
    if (b.richtig || s.begrVersuche >= 2) {
      s.begrRichtig = true; s.phase = 'ende';
      s.rueck = b.richtig ? 'Genau.' : 'Dieser Satz passt:';
      s.erklaerung = (b.richtig ? '' : a.begruendungen.find(x => x.richtig).text + ' ') + a.erklaerung;
      fertig(a, s.skalaGeschafft);
    } else s.rueck = 'Noch nicht ganz. Lies die Sätze noch einmal und zähl nach.';
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-gr="weiter"]' : '.begr-knopf');
  }

  function faerben(farbe) {
    const a = aufgabe(), s = a.zustand;
    if (s.felder.length >= a.plaetze || s.fertig) return;
    s.felder.push(farbe); s.rueck = '';
    zeichneAufgabe();
    ctx.ansagen(`Ein Feld ${F(farbe).adj} gefärbt. ${s.felder.length} von ${a.plaetze} Feldern.`);
    fokusAuf(s.felder.length >= a.plaetze ? '[data-gr="pruefen"]' : `[data-gr="faerben"][data-farbe="${farbe}"]`);
  }
  function leeren() {
    const a = aufgabe(), s = a.zustand;
    const f = s.felder.pop();
    if (!f || s.fertig) return;
    zeichneAufgabe();
    ctx.ansagen(`Ein ${F(f).akk}s Feld geleert.`);
    fokusAuf(s.felder.length ? '[data-gr="leeren"]' : '[data-gr="faerben"]');
  }
  function gestaltenPruefen() {
    const a = aufgabe(), s = a.zustand;
    s.versuche++;
    const k = CB.rad.anzahlen(s.felder);
    if (a.pruefe(s.felder)) {
      const b = a.bedingungen[0];
      let erkl = 'Es gibt auch andere Räder, die passen.';
      if (b.typ === 'stufe' && a.bedingungen.length === 1) {
        const t = k[b.farben[0]] || 0;
        erkl = `${t} von ${a.plaetze} Feldern ${t === 1 ? 'ist' : 'sind'} ${F(b.farben[0]).adj}. Das ist ${E().wort(b.soll)}. ` + erkl;
      }
      s.rueck = 'Das passt.'; s.erklaerung = erkl;
      fertig(a, s.versuche <= 2);
    } else if (s.versuche < 2) {
      s.rueck = hinweisGestalten(a, k);
    } else {
      s.rueck = 'Das passt noch nicht. Schau dir das Beispielrad an.';
      s.erklaerung = 'Das ist nur ein Beispiel. Es gibt oft mehrere Räder, die passen.';
      s.beispielZeigen = true;
      fertig(a, false);
    }
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-gr="weiter"]' : '[data-gr="leeren"]');
  }
  function hinweisGestalten(a, k) {
    for (const b of a.bedingungen) {
      if (CB.fuehlkisteAufgaben.bedingungErfuellt(b, k)) continue;
      if (b.typ === 'stufe') return `Das passt noch nicht. Auf deinem Rad ist ${F(b.farben[0]).name} ${E().wort(E().ausKiste(k, b.farben))}. Es soll ${E().wort(b.soll)} sein.`;
      if (b.soll === 'gleich') return `Das passt noch nicht. Es sollen gleich viele ${F(b.a).plural} wie ${F(b.b).plural} Felder sein, und von beiden mindestens eins.`;
      return `Das passt noch nicht. Es sollen mehr ${F(b.a).plural} als ${F(b.b).plural} Felder sein, aber mindestens ein ${F(b.b).akk}s.`;
    }
    return 'Das passt noch nicht. Lies den Satz noch einmal.';
  }

  /* ---------- Vermuten und Drehen ---------- */
  function vermutungWaehlen(f) { const s = aufgabe().zustand; if (s.phase !== 'start') return; s.vermutung = f; panel(); fokusAuf('[data-gr="vermutung-fest"]'); }
  function vermutungFest() {
    const s = aufgabe().zustand;
    if (!s.vermutung) return;
    s.phase = 'drehen'; s.rueck = `Deine Vermutung: ${F(s.vermutung).name}. Jetzt dreh das Rad.`;
    zeichneAufgabe(); fokusAuf('[data-gr="drehen"]');
  }
  /* Ein Ausgang: zuerst bestimmen, dann die Drehung dorthin berechnen */
  function ausgang(a, von) {
    const d = CB.zufall.drehe(CB.rad.radListe(a.felder));
    const basis = von - (((von % 360) + 360) % 360);
    const nach = basis + 3 * 360 + ((360 - d.winkel) % 360);
    if (CB.rad.feldUnterZeiger(a.felder.length, nach) !== d.index && window.FEHLER) window.FEHLER.push('Glücksrad: Zeiger passt nicht zum Ausgang');
    return { farbe: d.farbe, nach };
  }
  function drehen(n) {
    const a = aufgabe(), s = a.zustand;
    if (s.dreht || s.fertig) return;
    s.letzteN = n;
    const anzahl = Math.min(n, a.zuege - s.gezogen);
    if (anzahl < 1) return;
    if (anzahl === 1) {
      const { farbe, nach } = ausgang(a, s.drehung);
      const von = s.drehung;
      s.dreht = true;
      panel();
      const svg = ctx.app.querySelector('#gr-buehne .rad');
      CB.rad.animieren(svg, von, nach).then(() => {
        if (aufgabe() !== a) return;   /* inzwischen weiter */
        s.drehung = nach; s.dreht = false; s.letztes = farbe;
        s.zaehlung[farbe] = (s.zaehlung[farbe] || 0) + 1; s.gezogen++;
        nachDrehen(a, s, `Das Rad steht auf ${F(farbe).name}.`);
      });
      return;
    }
    const zaehl = {};
    let letzte = null;
    for (let i = 0; i < anzahl; i++) { const o = ausgang(a, s.drehung); s.drehung = o.nach; letzte = o.farbe; zaehl[o.farbe] = (zaehl[o.farbe] || 0) + 1; s.zaehlung[o.farbe] = (s.zaehlung[o.farbe] || 0) + 1; }
    s.gezogen += anzahl; s.letztes = letzte;
    nachDrehen(a, s, `${anzahl}-mal gedreht: ` + Object.entries(zaehl).map(([f, m]) => `${m} ${F(f).name}`).join(', ') + '.');
  }
  function nachDrehen(a, s, ansage) {
    if (s.gezogen >= a.zuege && !s.ausgewertet) { vermutenAuswerten(a, s); ansage += ' ' + s.rueck + ' ' + s.erklaerung; }
    else s.rueck = ansage;
    zeichneAufgabe();
    ctx.ansagen(ansage);
    fokusAuf(s.fertig ? '[data-gr="weiter"]' : ctx.app.querySelector(`[data-gr="drehen"][data-n="${s.letzteN}"]:not([disabled])`) ? `[data-gr="drehen"][data-n="${s.letzteN}"]` : '[data-gr="drehen"]:not([disabled])');
  }
  function vermutenAuswerten(a, s) {
    s.ausgewertet = true;
    const max = Math.max(...Object.values(s.zaehlung));
    const oben = Object.keys(s.zaehlung).filter(f => s.zaehlung[f] === max);
    const passt = A().vermutungPasst(a, s.vermutung);
    const kam = oben.map(f => F(f).name).join(' und ');
    if (passt && oben.length === 1 && oben[0] === a.loesung) s.rueck = `Deine Vermutung passt zum Rad. Die meisten Felder sind ${F(a.loesung).adj}. Heute kam ${kam} auch am häufigsten.`;
    else if (passt) s.rueck = `Deine Vermutung passt zum Rad. Die meisten Felder sind ${F(a.loesung).adj}. Heute kam trotzdem ${kam} am häufigsten. So ist Zufall.`;
    else s.rueck = `Die meisten Felder sind ${F(a.loesung).adj}. Darum hat ${F(a.loesung).name} die größte Chance. ${F(s.vermutung).name} kann auch kommen, nur seltener.`;
    s.erklaerung = `Das hast du vermutet: ${F(s.vermutung).name}. Das ist passiert: ` + a.antworten.map(f => `${F(f).name} ${s.zaehlung[f] || 0}`).join(' · ') + '.';
    if (!s.fertig) fertig(a, passt);
    s.fertig = true;
  }
  /* 100-mal drehen: nur zum Anschauen, zählt nicht für „geschafft“ */
  function hundert() {
    const a = aufgabe(), s = a.zustand;
    if (s.hundert) return;
    s.hundert = {};
    for (let i = 0; i < 100; i++) { const o = ausgang(a, s.drehung); s.drehung = o.nach; s.letztes = o.farbe; s.hundert[o.farbe] = (s.hundert[o.farbe] || 0) + 1; }
    zeichneAufgabe();
    ctx.ansagen('100-mal gedreht: ' + a.antworten.map(f => `${s.hundert[f] || 0} ${F(f).name}`).join(', ') + '. Vergleich die beiden Diagramme mit dem Rad.');
    fokusAuf('[data-gr="weiter"]');
  }

  /* ---------- Knifflig ---------- */
  function radWahl(i) {
    const s = aufgabe().zustand;
    if (s.fertig) return;
    s.wahl = s.wahl.includes(i) ? s.wahl.filter(x => x !== i) : s.wahl.concat(i).sort();
    panel(); fokusAuf(`[data-gr="rad-wahl"][data-i="${i}"]`);
  }
  function wahlPruefen() {
    const a = aufgabe(), s = a.zustand;
    if (!s.wahl.length || s.fertig) return;
    s.versuche++;
    const richtig = s.wahl.length === a.loesung.length && s.wahl.every(i => a.loesung.includes(i));
    if (richtig) { s.rueck = 'Das stimmt.'; s.erklaerung = a.erklaerung; fertig(a, s.versuche <= 2); }
    else if (s.versuche < 2) {
      const falsch = s.wahl.find(i => !a.loesung.includes(i));
      s.rueck = falsch !== undefined ? `Rad ${'ABC'[falsch]} passt nicht. Zähl dort die ${F(a.ziel).plural} Felder.` : `Rad ${'ABC'[s.wahl[0]]} passt. Es fehlt noch ein Rad.`;
    } else { s.rueck = 'Hier ist die Lösung:'; s.erklaerung = a.erklaerung; fertig(a, false); }
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-gr="weiter"]' : '[data-gr="rad-wahl"]');
  }
  function antwortGewaehlt(id) {
    const a = aufgabe(), s = a.zustand;
    if (s.fertig) return;
    s.versuche++;
    if (id === a.loesung) { s.rueck = 'Das stimmt.'; s.erklaerung = a.erklaerung; fertig(a, s.versuche <= 2); }
    else if (s.versuche < 2) s.rueck = `Noch nicht ganz. Zähl die ${F(a.a).plural} und die ${F(a.b).plural} Felder.`;
    else { s.rueck = 'Hier ist die Lösung:'; s.erklaerung = a.erklaerung; fertig(a, false); }
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-gr="weiter"]' : '.antwort-knopf');
  }

  function weiter() {
    if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); return; }
    const r = T().rundenende(ctx, { id: ID, praefix: P, stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    ctx.zeigen(`${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}${r.html}${AM_TISCH(false)}`, 'Rundenende – Glücksrad');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  /* ---------- Hilfe von Würfi ---------- */
  const TIPPS = {
    einordnen: ['Zähl zuerst die Felder in der Farbe aus dem Satz.', 'Sind es alle, mehr als die Hälfte, weniger als die Hälfte oder keine?', 'Schau in den Wortspeicher. Ich schreibe dir jetzt Zahlen auf die Felder.'],
    gestalten: ['Lies den Satz noch einmal. Welche Farbe ist wichtig?', 'Unmöglich heißt: Diese Farbe darf gar nicht aufs Rad. Wahrscheinlich heißt: mehr als die Hälfte, aber nicht alle.', 'Die Hälfte von {p} Feldern sind {h} Felder.'],
    vermuten: ['Welche Farbe hat die meisten Felder?', 'Eine Farbe mit vielen Feldern kommt meistens öfter. Aber nicht immer.'],
    gleicheChance: ['Zähl die {f} Felder auf jedem Rad.', 'Gleiche Chance heißt: gleich viele {f} Felder.'],
    groessereChance: ['Zähl die Felder der beiden Farben.', 'Die Farbe mit mehr Feldern hat die größere Chance.'],
    zahlenrad: ['Lies jede Zahl. Passt sie zum Satz?', 'Zähl, wie viele Zahlen passen. Sind es mehr oder weniger als die Hälfte?']
  };
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) {
      T().dialog(ctx, { titel: 'Tipp von Würfi', inhalt: `<div class="tipp">${ctx.wuerfiKlein}<p>Wähle eine Stufe. Ich empfehle dir die Stufe mit dem Wort „empfohlen“.</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' });
      return;
    }
    const s = a.zustand;
    let liste = TIPPS[a.art].map(t => t.replace('{p}', a.plaetze).replace('{h}', a.plaetze / 2).replace(/\{f\}/g, a.ziel ? F(a.ziel).plural : ''));
    if (a.art === 'zahlenrad' && a.merkmal.art === 'reihe') liste = liste.concat(`Die ${A().REIHEN[a.merkmal.m]}reihe: ${a.merkmal.reihe.join(', ')}.`);
    const erlaubt = liste.length >= 3 && !s.versuche ? liste.length - 1 : liste.length;
    const bis = Math.min(hilfeStufe, erlaubt - 1);
    if (a.art === 'einordnen' && bis >= 2 && !s.nummernAn && !s.fertig) { s.nummernAn = true; buehne(); }
    T().tippDialog(ctx, { liste, bis, erlaubt, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }

  /* ---------- Bedienung ---------- */
  function bedienen(e) {
    const b = e.target.closest('[data-gr]');
    if (!b || b.disabled) return false;
    const w = b.dataset.gr;
    if (w === 'stufe') rundeStarten(b.dataset.stufe);
    else if (w === 'stufen') ansichtStufen();
    else if (w === 'hilfe') hilfeZeigen();
    else if (w === 'woerter') T().woerter(ctx, z && z.stufe === 'knifflig' ? WOERTER_EXTRA : []);
    else if (w === 'skala') skalaGewaehlt(b.dataset.wert);
    else if (w === 'begr') begruendungGewaehlt(Number(b.dataset.i));
    else if (w === 'faerben') faerben(b.dataset.farbe);
    else if (w === 'leeren') leeren();
    else if (w === 'pruefen') gestaltenPruefen();
    else if (w === 'vermuten') vermutungWaehlen(b.dataset.farbe);
    else if (w === 'vermutung-fest') vermutungFest();
    else if (w === 'drehen') drehen(Number(b.dataset.n));
    else if (w === 'hundert') hundert();
    else if (w === 'rad-wahl') radWahl(Number(b.dataset.i));
    else if (w === 'wahl-pruefen') wahlPruefen();
    else if (w === 'antwort') antwortGewaehlt(b.dataset.id);
    else if (w === 'weiter') weiter();
    else return false;
    return true;
  }

  CB.stationen[ID] = { stempelSvg,
    id: ID,
    oeffnen(c) { ctx = c; ansichtStufen(); },
    bedienen, aufgabe, zustand: () => z,
    /* nur für den Test der Fachregel „Vermutung, nicht Ausgang“ */
    _vermutungBewerten(felder, vermutung, zaehlung) {
      const k = CB.rad.anzahlen(felder);
      const a = { art: 'vermuten', felder, loesung: Object.keys(k).sort((x, y) => k[y] - k[x])[0], antworten: Object.keys(k), zuege: 20 };
      const s = { vermutung, zaehlung, fertig: true };
      vermutenAuswerten(a, s);
      return { rueck: s.rueck, passt: A().vermutungPasst(a, vermutung) };
    }
  };
})();
