/* Chancenbucht: Station Fühlkiste (Etappe 2c).
   Klassisches Skript, trägt sich in CB.stationen.fuehlkiste ein. Braucht CB.config, CB.zufall, CB.einordnung,
   CB.kiste, CB.saeulen, CB.fuehlkisteAufgaben, CB.stand, CB.teile (js/station-teile.js). Die App ruft oeffnen(ctx) und bedienen(e).

   Fachliche Regeln (CLAUDE.md, „Fachliche Regeln“):
   - Bewertet wird die Einordnung oder Vermutung, nie ein einzelner Zufallsausgang.
   - Ziehen immer mit Zurücklegen. Der Ausgang steht vor der Animation fest (CB.zufall.ziehe).
   - Gespeichert werden nur runden und stempel (cb_stand). Vermutungen, Züge und Strichlisten nicht.
   Barrierefreiheit: alles über echte Knöpfe, Ergebnis jedes Zugs sichtbar und im aria-live-Bereich,
   Diagramm mit Tabelle, Dialoge mit Fokus hinein, Escape und Fokus zurück, ein h1 je Ansicht.
   Sicherheit: Texte kommen nur aus eigenen Daten und laufen trotzdem durch esc(). Keine style-Attribute. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  CB.stationen = CB.stationen || {};
  const ID = 'fuehlkiste';
  const C = () => CB.config;
  const E = () => CB.einordnung;
  const A = () => CB.fuehlkisteAufgaben;
  const ST = () => CB.stand;
  const F = id => C().farben.find(f => f.id === id);
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };

  let ctx = null;
  let z = null;   /* Zustand der laufenden Runde */
  let hilfeStufe = 0;
  const esc = s => ctx.esc(s);

  /* ---------- kleine Bausteine (gemeinsam in js/station-teile.js, seit Etappe 3c) ---------- */
  const T = () => CB.teile;
  const kugelSymbol = id => T().kugelSymbol(id);
  const kopf = unterzeile => T().kopf(ctx, { titel: 'Fühlkiste', unterzeile, praefix: 'fk' });
  const SO_GEHTS = offen => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: [
    'Schau dir die Kugeln in der Kiste an. Zähl sie.', 'Lies den Satz unter der Kiste.', 'Tippe an, wie wahrscheinlich das ist.'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Deine eigene Fühlkiste', offen, schritte: [
    'Nimm eine Socke oder einen Stoffbeutel und 6 Steckwürfel: 4 in einer Farbe, 2 in einer anderen.',
    'Vermute zuerst: Welche Farbe ziehst du öfter?',
    'Zieh 20-mal, ohne hineinzusehen. Leg den Würfel jedes Mal zurück und schüttle.',
    'Mach bei jedem Zug einen Strich in die Strichliste.',
    'Tauscht die Beutel. Kann dein Partner herausfinden, was in deinem Beutel ist, ohne hineinzusehen?'],
    notiz: 'Statt Steckwürfeln gehen auch Knöpfe oder Murmeln in zwei Farben.' });

  /* ---------- Stufenwahl (Einstieg der Station) ---------- */
  function ansichtStufen() {
    z = null;
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Kugeln ziehen')}
      ${erstesMal ? `<p class="wuerfi-satz">In meine Fühlkiste kann man nicht hineinsehen. Ich verrate dir, was drin ist. Du sagst, was beim Ziehen passieren kann.</p>` : ''}
      ${SO_GEHTS(erstesMal)}
      ${T().stufenListe(ctx, ID, 'fk')}
      ${AM_TISCH(false)}`, 'Fühlkiste');
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
    a.zustand = { versuche: 0, phase: 'start', fertig: false, geschafft: false, kiste: {}, gelegt: [], zaehlung: {}, gezogen: 0, schatten: null, vermutung: null, wahl: null, zahlenAn: false };
    const unter = `Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`;
    ctx.zeigen(`
      ${kopf(unter)}
      <div class="station-flaeche">
        <div class="buehne" id="fk-buehne"></div>
        <section class="papier aufgabe" id="fk-aufgabe" aria-labelledby="fk-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Fühlkiste`);
    zeichneAufgabe();
  }

  /* Bühne: Kiste(n) und Ziehbereich. Wird bei Änderungen neu gezeichnet (keine Animation nötig). */
  function buehne() {
    const a = aufgabe(), s = a.zustand;
    const b = ctx.app.querySelector('#fk-buehne');
    b.textContent = '';
    const mitTitel = (svg, titel) => { const fig = document.createElement('figure'); fig.className = 'kiste-figur'; fig.appendChild(svg); if (titel) { const c = document.createElement('figcaption'); c.textContent = titel; fig.appendChild(c); } return fig; };
    if (a.art === 'fuellen') {
      b.appendChild(mitTitel(CB.kiste.zeichnen(s.kiste, { plaetze: a.plaetze })));
      if (s.beispielZeigen) b.appendChild(mitTitel(CB.kiste.zeichnen(a.beispiel), 'So würde es zum Beispiel passen'));
    } else if (a.art === 'zweiKisten') {
      const reihe = document.createElement('div'); reihe.className = 'kisten-reihe';
      reihe.appendChild(mitTitel(CB.kiste.zeichnen(a.kisten.A, { titel: 'Kiste A: ' + CB.kiste.beschreibung(a.kisten.A).replace('Kiste mit ', '') }), 'Kiste A'));
      reihe.appendChild(mitTitel(CB.kiste.zeichnen(a.kisten.B, { titel: 'Kiste B: ' + CB.kiste.beschreibung(a.kisten.B).replace('Kiste mit ', '') }), 'Kiste B'));
      b.appendChild(reihe);
    } else if (a.art === 'verdeckt') {
      b.appendChild(mitTitel(CB.kiste.zeichnen(s.fertig ? a.kisten[a.wahr] : {}, { verdeckt: !s.fertig }), s.fertig ? `Es war Kiste ${'ABC'[a.wahr]}` : 'Würfis Kiste'));
      const reihe = document.createElement('div'); reihe.className = 'kisten-reihe kisten-reihe--klein';
      a.kisten.forEach((k, i) => reihe.appendChild(mitTitel(CB.kiste.zeichnen(k, { titel: `Kiste ${'ABC'[i]}: ` + CB.kiste.beschreibung(k).replace('Kiste mit ', '') }), `Kiste ${'ABC'[i]}`)));
      b.appendChild(reihe);
    } else {
      const hervor = s.hervorheben || null;
      b.appendChild(mitTitel(CB.kiste.zeichnen(a.kiste, { hervorheben: hervor, zahlen: s.zahlenAn })));
    }
    if (a.art === 'vermuten' || a.art === 'verdeckt') {
      const hand = document.createElement('div');
      hand.className = 'hand'; hand.id = 'fk-hand';
      hand.setAttribute('aria-hidden', 'true');
      b.appendChild(hand);
    }
  }

  /* Rechte Seite: Frage, Antworten, Rückmeldung */
  function zeichneAufgabe() {
    buehne();
    const a = aufgabe(), s = a.zustand;
    const ziel = ctx.app.querySelector('#fk-aufgabe');
    let html = '';
    const rueck = `<p class="rueckmeldung" id="fk-rueck" role="status">${s.rueck ? esc(s.rueck) : ''}</p>`;
    const erkl = s.erklaerung ? `<p class="erklaerung">${esc(s.erklaerung)}</p>` : '';
    const weiter = s.fertig ? `<p class="knopfreihe"><button type="button" class="knopf haupt" data-fk="weiter">${z.i + 1 < z.aufgaben.length ? 'Weiter' : 'Zum Rundenende'}</button></p>` : '';

    if (a.art === 'einordnen') {
      html = `<p class="wuerfi-sagt">Würfi sagt:</p>
        <p class="aussage" id="fk-frage">${esc(a.satz)}</p>
        <h2 class="frage-klein">Wie wahrscheinlich ist das?</h2>
        <div class="skala" role="group" aria-label="Wahrscheinlichkeitsskala">
          ${a.antworten.map(w => `<button type="button" class="knopf skala-knopf skala-knopf--${w}${s.skalaRichtig && w === a.loesung ? ' ist-richtig' : ''}" data-fk="skala" data-wert="${w}"${s.phase !== 'start' ? ' disabled' : ''}>${esc(E().wort(w))}</button>`).join('')}
        </div>
        ${s.phase === 'begr' || s.begrGezeigt ? `
          <h2 class="frage-klein">Warum? Tippe den passenden Satz an.</h2>
          <div class="begruendungen" role="group" aria-label="Begründungen">
            ${a.begruendungen.map((b, i) => `<button type="button" class="knopf begr-knopf${s.begrRichtig && b.richtig ? ' ist-richtig' : ''}" data-fk="begr" data-i="${i}"${s.phase !== 'begr' ? ' disabled' : ''}>${esc(b.text)}</button>`).join('')}
          </div>` : ''}
        ${rueck}${erkl}${weiter}`;
    } else if (a.art === 'fuellen') {
      const voll = Object.values(s.kiste).reduce((x, n) => x + n, 0) >= a.plaetze;
      html = `<p class="wuerfi-sagt">Fülle die Kiste. Es sind immer ${a.plaetze} Kugeln. Dann soll gelten:</p>
        <p class="aussage" id="fk-frage">${esc(a.satz)}</p>
        <div class="farb-knoepfe" role="group" aria-label="Kugeln hineinlegen">
          ${C().farben.map(f => `<button type="button" class="knopf farb-knopf" data-fk="legen" data-farbe="${f.id}" aria-label="Eine ${esc(f.akk)} Kugel hineinlegen"${voll || s.fertig ? ' disabled' : ''}>${kugelSymbol(f.id)}<span>${esc(f.name)}</span></button>`).join('')}
        </div>
        <p class="knopfreihe">
          <button type="button" class="knopf" data-fk="heraus"${!s.gelegt.length || s.fertig ? ' disabled' : ''}>Eine Kugel heraus</button>
          <button type="button" class="knopf haupt" data-fk="pruefen"${!voll || s.fertig ? ' disabled' : ''}>Prüfen</button>
        </p>
        <p class="leise" id="fk-fuellstand">${Object.values(s.kiste).reduce((x, n) => x + n, 0)} von ${a.plaetze} Kugeln in der Kiste</p>
        ${rueck}${erkl}${weiter}`;
    } else if (a.art === 'vermuten') {
      html = `<p class="wuerfi-sagt">Erst vermuten, dann ziehen.</p>
        <p class="aussage" id="fk-frage">Wir ziehen ${a.zuege}-mal. Jede Kugel kommt sofort zurück in die Kiste. Welche Farbe ziehen wir wohl am häufigsten?</p>
        <div class="farb-knoepfe" role="group" aria-label="Deine Vermutung">
          ${a.antworten.map(id => `<button type="button" class="knopf farb-knopf" data-fk="vermuten" data-farbe="${id}" aria-pressed="${s.vermutung === id}"${s.phase !== 'start' ? ' disabled' : ''}>${kugelSymbol(id)}<span>${esc(F(id).name)}</span></button>`).join('')}
        </div>
        ${s.phase === 'start' ? `<p class="knopfreihe"><button type="button" class="knopf haupt" data-fk="vermutung-fest"${s.vermutung ? '' : ' disabled'}>Ich bin fertig mit Vermuten</button></p>` : ''}
        ${s.phase !== 'start' ? ziehBereich(a, s) : ''}
        ${rueck}${erkl}
        ${s.fertig ? `<p class="knopfreihe"><button type="button" class="knopf" data-fk="nochmal">Noch einmal ${a.zuege}</button><button type="button" class="knopf haupt" data-fk="weiter">${z.i + 1 < z.aufgaben.length ? 'Weiter' : 'Zum Rundenende'}</button></p>` : ''}`;
    } else if (a.art === 'vergleichen' || a.art === 'zweiKisten') {
      html = `<p class="aussage" id="fk-frage">${esc(a.satz)}</p>
        <div class="antworten" role="group" aria-label="Antworten">
          ${a.antworten.map(x => `<button type="button" class="knopf antwort-knopf${s.fertig && x.id === a.loesung ? ' ist-richtig' : ''}" data-fk="antwort" data-id="${x.id}"${s.fertig ? ' disabled' : ''}>${esc(x.text)}</button>`).join('')}
        </div>
        ${rueck}${erkl}${weiter}`;
    } else if (a.art === 'verdeckt') {
      const genug = s.gezogen >= a.zuege;
      html = `<p class="aussage" id="fk-frage">${esc(a.satz)}</p>
        ${ziehBereich(a, s)}
        <h2 class="frage-klein">Welche Kiste war es?</h2>
        <div class="antworten antworten--reihe" role="group" aria-label="Kiste wählen">
          ${['A', 'B', 'C'].map((k, i) => `<button type="button" class="knopf antwort-knopf${s.fertig && i === a.wahr ? ' ist-richtig' : ''}" data-fk="kiste" data-i="${i}"${!genug || s.fertig ? ' disabled' : ''}>Kiste ${k}</button>`).join('')}
        </div>
        ${genug ? '' : `<p class="leise">Zieh zuerst ${a.zuege} Kugeln. Dann kannst du wählen.</p>`}
        ${rueck}${erkl}${weiter}`;
    }
    ziel.innerHTML = html;
    if (a.art === 'vermuten' || a.art === 'verdeckt') diagrammEinsetzen(a, s);
  }

  /* Strichliste, Säulendiagramm (mit Tabelle) und Zieh-Knöpfe */
  function ziehBereich(a, s) {
    const offen = s.gezogen < a.zuege;
    const farben = a.art === 'verdeckt' ? a.farben : a.antworten;
    return `
      <div class="ziehen">
        <p class="knopfreihe">
          <button type="button" class="knopf glas-knopf--hell" data-fk="ziehen" data-n="1"${offen && !s.fertig ? '' : ' disabled'}>1 ziehen</button>
          <button type="button" class="knopf glas-knopf--hell" data-fk="ziehen" data-n="10"${offen && !s.fertig && s.gezogen + 10 <= a.zuege ? '' : ' disabled'}>10 ziehen</button>
        </p>
        <p class="leise">${s.gezogen} von ${a.zuege} Kugeln gezogen</p>
        <h3 class="frage-klein">Strichliste</h3>
        ${T().strichliste(ctx, farben, s.zaehlung)}
        <div class="diagramm" id="fk-diagramm"></div>
      </div>`;
  }
  function diagrammEinsetzen(a, s) {
    T().diagramm(ctx.app.querySelector('#fk-diagramm'), a.art === 'verdeckt' ? a.farben : a.antworten, s.zaehlung, s.schatten, 'Gezogene Kugeln');
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

  function skalaGewaehlt(wert) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'start') return;
    s.versuche++;
    if (wert === a.loesung) {
      s.skalaRichtig = true;
      s.phase = 'begr';
      s.rueck = `Das stimmt. Das ist ${E().wort(a.loesung)}.`;
      s.skalaGeschafft = true;
      s.hervorheben = null;
    } else if (s.versuche === 1) {
      const name = a.satzArt === 'oder' ? 'Kugeln aus dem Satz' : `${F(a.ziel[0]).plural} Kugeln`;
      s.rueck = `Noch nicht ganz. Zähl die ${name} noch einmal.`;
      s.hervorheben = a.ziel.slice();
    } else {
      s.skalaRichtig = true;
      s.phase = 'begr';
      s.skalaGeschafft = false;
      s.hervorheben = null;
      s.rueck = `Hier ist die Lösung: Das ist ${E().wort(a.loesung)}. Jetzt such den passenden Satz dazu.`;
    }
    s.begrGezeigt = s.phase === 'begr';
    s.begrVersuche = 0;
    zeichneAufgabe();
    ctx.ansagen(s.rueck);
    fokusAuf(s.phase === 'begr' ? '.begr-knopf' : '.skala-knopf:not([disabled])');
  }

  function begruendungGewaehlt(i) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'begr') return;
    const b = a.begruendungen[i];
    s.begrVersuche++;
    if (b.richtig || s.begrVersuche >= 2) {
      s.begrRichtig = true;
      s.phase = 'ende';
      s.rueck = b.richtig ? 'Genau.' : 'Dieser Satz passt:';
      s.erklaerung = (b.richtig ? '' : a.begruendungen.find(x => x.richtig).text + ' ') + a.erklaerung;
      fertig(a, s.skalaGeschafft);
    } else {
      s.rueck = 'Noch nicht ganz. Lies die Sätze noch einmal und zähl nach.';
    }
    zeichneAufgabe();
    ctx.ansagen(s.rueck + (s.erklaerung ? ' ' + s.erklaerung : ''));
    fokusAuf(s.fertig ? '[data-fk="weiter"]' : '.begr-knopf');
  }

  function legen(farbe) {
    const a = aufgabe(), s = a.zustand;
    const n = Object.values(s.kiste).reduce((x, m) => x + m, 0);
    if (n >= a.plaetze || s.fertig) return;
    s.kiste[farbe] = (s.kiste[farbe] || 0) + 1;
    s.gelegt.push(farbe);
    s.rueck = '';
    zeichneAufgabe();
    ctx.ansagen(`${F(farbe).name} hineingelegt. ${n + 1} von ${a.plaetze} Kugeln.`);
    fokusAuf(n + 1 >= a.plaetze ? '[data-fk="pruefen"]' : `[data-fk="legen"][data-farbe="${farbe}"]`);
  }
  function heraus() {
    const a = aufgabe(), s = a.zustand;
    const f = s.gelegt.pop();
    if (!f || s.fertig) return;
    s.kiste[f]--; if (!s.kiste[f]) delete s.kiste[f];
    zeichneAufgabe();
    ctx.ansagen(`${F(f).name} herausgenommen.`);
    fokusAuf(s.gelegt.length ? '[data-fk="heraus"]' : '[data-fk="legen"]');
  }
  function fuellenPruefen() {
    const a = aufgabe(), s = a.zustand;
    s.versuche++;
    if (a.pruefe(s.kiste)) {
      const b = a.bedingungen[0];
      let erkl = 'Es gibt auch andere Kisten, die passen.';
      if (b.typ === 'stufe' && a.bedingungen.length === 1) {
        const zz = E().zaehleKiste(s.kiste, b.farben);
        erkl = `${zz.treffer} von ${zz.gesamt} Kugeln ${zz.treffer === 1 ? 'ist' : 'sind'} ${b.farben.map(f => F(f).adj).join(' oder ')}. Das ist ${E().wort(b.soll)}. ` + erkl;
      }
      s.rueck = 'Das passt.';
      s.erklaerung = erkl;
      fertig(a, s.versuche <= 2);
    } else if (s.versuche < 2) {
      s.rueck = fuellenHinweis(a, s.kiste);
    } else {
      s.rueck = 'Das passt noch nicht. Schau dir die Beispielkiste an.';
      s.erklaerung = 'Das ist nur ein Beispiel. Es gibt oft mehrere Kisten, die passen.';
      s.beispielZeigen = true;
      fertig(a, false);
    }
    zeichneAufgabe();
    ctx.ansagen(s.rueck + (s.erklaerung ? ' ' + s.erklaerung : ''));
    fokusAuf(s.fertig ? '[data-fk="weiter"]' : '[data-fk="heraus"]');
  }
  function fuellenHinweis(a, kiste) {
    for (const b of a.bedingungen) {
      if (CB.fuehlkisteAufgaben.bedingungErfuellt(b, kiste)) continue;
      if (b.typ === 'stufe') {
        const ist = E().ausKiste(kiste, b.farben);
        return `Das passt noch nicht. In deiner Kiste ist ${F(b.farben[0]).name} ${E().wort(ist)}. Es soll ${E().wort(b.soll)} sein.`;
      }
      if (b.soll === 'gleich') return `Das passt noch nicht. Es sollen gleich viele ${F(b.a).plural} wie ${F(b.b).plural} Kugeln drin sein, und von beiden mindestens eine.`;
      return `Das passt noch nicht. Es sollen mehr ${F(b.a).plural} als ${F(b.b).plural} Kugeln drin sein, aber mindestens eine ${F(b.b).akk}.`;
    }
    return 'Das passt noch nicht. Lies den Satz noch einmal.';
  }

  function vermutungWaehlen(farbe) {
    const s = aufgabe().zustand;
    if (s.phase !== 'start') return;
    s.vermutung = farbe;
    zeichneAufgabe();
    fokusAuf('[data-fk="vermutung-fest"]');
  }
  function vermutungFest() {
    const a = aufgabe(), s = a.zustand;
    if (!s.vermutung) return;
    s.phase = 'ziehen';
    s.rueck = `Deine Vermutung: ${F(s.vermutung).name}. Jetzt zieh die Kugeln.`;
    zeichneAufgabe();
    fokusAuf('[data-fk="ziehen"]');
  }

  /* Ziehen: Ausgang zuerst bestimmen (CB.zufall), dann zeigen */
  function ziehen(n) {
    const a = aufgabe(), s = a.zustand;
    const kiste = a.art === 'verdeckt' ? a.kisten[a.wahr] : a.kiste;
    const rest = a.zuege - s.gezogen;
    const anzahl = Math.min(n, rest);
    if (anzahl < 1 || s.fertig) return;
    const zuege = CB.zufall.oft(anzahl, () => CB.zufall.ziehe(kiste));
    for (const f of zuege) s.zaehlung[f] = (s.zaehlung[f] || 0) + 1;
    s.gezogen += anzahl;
    const letzte = zuege[zuege.length - 1];
    let ansage = anzahl === 1 ? `Gezogen: ${F(letzte).akk} Kugel.` : `${anzahl} Kugeln gezogen: ` + Object.entries(CB.zufall.zaehle(zuege)).map(([f, m]) => `${m} ${F(f).adj}`).join(', ') + '.';
    if (a.art === 'vermuten' && s.gezogen >= a.zuege) {
      vermutenAuswerten(a, s);
      ansage += ' ' + s.rueck + ' ' + (s.erklaerung || '');
    } else s.rueck = anzahl === 1 ? `Gezogen: ${F(letzte).akk} Kugel.` : `${anzahl} Kugeln gezogen.`;
    zeichneAufgabe();
    handZeigen(letzte);
    ctx.ansagen(ansage);
    fokusAuf(s.fertig ? '[data-fk="weiter"]' : (a.art === 'verdeckt' && s.gezogen >= a.zuege ? '[data-fk="kiste"]' : `[data-fk="ziehen"][data-n="${n}"]:not([disabled]), [data-fk="ziehen"]:not([disabled])`));
  }
  function handZeigen(farbe) {
    const hand = ctx.app.querySelector('#fk-hand');
    if (!hand) return;
    hand.innerHTML = kugelSymbol(farbe);
    hand.classList.remove('hand--neu');
    void hand.offsetWidth;   /* Animation neu starten (nur transform und opacity, siehe CSS) */
    hand.classList.add('hand--neu');
  }
  function vermutenAuswerten(a, s) {
    const max = Math.max(...Object.values(s.zaehlung));
    const oben = Object.keys(s.zaehlung).filter(f => s.zaehlung[f] === max);
    const passt = CB.fuehlkisteAufgaben.vermutungPasst(a, s.vermutung);
    const kam = oben.length === 1 ? F(oben[0]).name : oben.map(f => F(f).name).join(' und ');
    const ergebnis = 'Das ist passiert: ' + a.antworten.map(f => `${F(f).name} ${s.zaehlung[f] || 0}`).join(' · ');
    if (passt && oben.length === 1 && oben[0] === a.loesung) {
      s.rueck = `Deine Vermutung passt zur Kiste. Es sind die meisten Kugeln ${F(a.loesung).adj}. Heute kam ${kam} auch am häufigsten.`;
    } else if (passt) {
      s.rueck = `Deine Vermutung passt zur Kiste. Es sind die meisten Kugeln ${F(a.loesung).adj}. Heute kam trotzdem ${kam} am häufigsten. So ist Zufall. Probier noch einmal ${a.zuege} Züge.`;
    } else {
      s.rueck = `In der Kiste sind die meisten Kugeln ${F(a.loesung).adj}. Darum ist ${F(a.loesung).name} am wahrscheinlichsten. ${F(s.vermutung).name} kann auch oft kommen, aber eher seltener.`;
    }
    s.erklaerung = `Das hast du vermutet: ${F(s.vermutung).name}. ${ergebnis}.`;
    if (!s.fertig) fertig(a, passt);
    s.fertig = true;
  }
  function nochmal() {
    const a = aufgabe(), s = a.zustand;
    s.schatten = { ...s.zaehlung };
    s.zaehlung = {};
    s.gezogen = 0;
    s.fertig = false;
    s.phase = 'ziehen';
    s.rueck = `Noch einmal ${a.zuege} Züge. Die blassen Säulen zeigen das letzte Mal. Vergleich die beiden Male. Sind sie gleich?`;
    s.erklaerung = '';
    s.nochmalLauf = true;
    zeichneAufgabe();
    fokusAuf('[data-fk="ziehen"]');
  }

  function antwortGewaehlt(id) {
    const a = aufgabe(), s = a.zustand;
    if (s.fertig) return;
    s.versuche++;
    if (id === a.loesung) {
      s.rueck = 'Das stimmt.';
      s.erklaerung = a.erklaerung;
      fertig(a, s.versuche <= 2);
    } else if (s.versuche < 2) {
      s.rueck = a.art === 'zweiKisten' ? `Noch nicht ganz. Zähl in beiden Kisten die ${F(a.ziel).plural} Kugeln.` : `Noch nicht ganz. Zähl die ${F(a.a).plural} und die ${F(a.b).plural} Kugeln.`;
    } else {
      s.rueck = 'Hier ist die Lösung:';
      s.erklaerung = a.erklaerung;
      fertig(a, false);
    }
    zeichneAufgabe();
    ctx.ansagen(s.rueck + (s.erklaerung ? ' ' + s.erklaerung : ''));
    fokusAuf(s.fertig ? '[data-fk="weiter"]' : '.antwort-knopf');
  }

  function kisteGewaehlt(i) {
    const a = aufgabe(), s = a.zustand;
    if (s.fertig || s.gezogen < a.zuege) return;
    s.versuche++;
    const passend = CB.fuehlkisteAufgaben.passendeKisten(a.kisten, s.zaehlung);
    const viel = Object.keys(s.zaehlung).sort((x, y) => s.zaehlung[y] - s.zaehlung[x])[0];
    if (passend.includes(i)) {
      s.rueck = i === a.wahr
        ? `Gut beobachtet. Es kam viel ${F(viel).name}, das passt zu Kiste ${'ABC'[i]}. Es war Kiste ${'ABC'[i]}.`
        : `Deine Wahl passt gut zu den Zügen. Diesmal war es trotzdem Kiste ${'ABC'[a.wahr]}. Das kann bei Zufall passieren. Mit mehr Zügen wird man sicherer.`;
      fertig(a, true);
    } else if (s.versuche < 2) {
      s.rueck = `Schau auf die Strichliste. Es kam viel ${F(viel).name}. Welche Kiste hat die meisten ${F(viel).plural} Kugeln?`;
    } else {
      s.rueck = `Es war Kiste ${'ABC'[a.wahr]}. Zu den Zügen passt Kiste ${passend.map(p => 'ABC'[p]).join(' oder ')} am besten.`;
      fertig(a, false);
    }
    zeichneAufgabe();
    ctx.ansagen(s.rueck);
    fokusAuf(s.fertig ? '[data-fk="weiter"]' : '[data-fk="kiste"]');
  }

  function weiter() {
    if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); return; }
    rundenende();
  }

  /* Stempel der Fühlkiste: kleine Kiste mit drei Kugeln im Stempelrahmen (Code-Grafik, kein Bild) */
  const stempelSvg = () => T().stempel('<path class="stempel__welle" d="M28 48h44v22H28z"/><path class="stempel__welle" d="M28 48l7-8h30l7 8"/><circle class="stempel__kugel" cx="40" cy="34" r="5"/><circle class="stempel__kugel" cx="50" cy="30" r="5"/><circle class="stempel__kugel" cx="60" cy="34" r="5"/>');

  /* ---------- Rundenende ---------- */
  function rundenende() {
    const r = T().rundenende(ctx, { id: ID, praefix: 'fk', stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}
      ${r.html}
      ${AM_TISCH(true)}`, 'Rundenende – Fühlkiste');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  /* ---------- Dialoge: Hilfe von Würfi, Wörter ---------- */
  const TIPPS = {
    einordnen: ['Zähl zuerst die Kugeln in der Farbe aus dem Satz.', 'Sind es alle, mehr als die Hälfte, weniger als die Hälfte oder keine?', 'Schau in den Wortspeicher. Dort steht, was die Wörter bedeuten. Ich schreibe dir jetzt Zahlen auf die Kugeln.'],
    fuellen: ['Lies den Satz noch einmal. Welche Farbe ist wichtig?', 'Unmöglich heißt: Diese Farbe darf gar nicht in die Kiste. Wahrscheinlich heißt: mehr als die Hälfte, aber nicht alle.', 'Die Hälfte von {p} Kugeln sind {h} Kugeln.'],
    vermuten: ['Von welcher Farbe sind die meisten Kugeln in der Kiste?', 'Eine Farbe mit vielen Kugeln kommt meistens öfter. Aber nicht immer.'],
    vergleichen: ['Zähl die Kugeln der beiden Farben.', 'Von welcher Farbe sind mehr Kugeln in der Kiste?'],
    zweiKisten: ['Zähl in jeder Kiste die Kugeln in der Farbe, die du möchtest.', 'Beide Kisten haben gleich viele Kugeln. Wo sind mehr von deiner Farbe?'],
    verdeckt: ['Welche Farbe kam am häufigsten?', 'Welche Kiste hat von dieser Farbe die meisten Kugeln?']
  };
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) {
      T().dialog(ctx, { titel: 'Tipp von Würfi', inhalt: `<div class="tipp">${ctx.wuerfiKlein}<p>Wähle eine Stufe. Ich empfehle dir die Stufe mit dem Wort „empfohlen“.</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' });
      return;
    }
    const s = a.zustand;
    const liste = TIPPS[a.art].map(t => t.replace('{p}', a.plaetze).replace('{h}', a.plaetze / 2));
    /* Bei drei Tipps kommt der letzte erst nach einem Versuch */
    const erlaubt = liste.length >= 3 && !s.versuche ? liste.length - 1 : liste.length;
    const bis = Math.min(hilfeStufe, erlaubt - 1);
    if (a.art === 'einordnen' && bis >= 2 && !s.zahlenAn && !s.fertig) { s.zahlenAn = true; buehne(); }
    T().tippDialog(ctx, { liste, bis, erlaubt, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }
  const woerterZeigen = () => T().woerter(ctx);

  /* ---------- Fokus ---------- */
  const fokusAuf = sel => T().fokus(ctx, sel);

  /* ---------- Bedienung (von der App weitergereicht) ---------- */
  function bedienen(e) {
    const b = e.target.closest('[data-fk]');
    if (!b || b.disabled) return false;
    const was = b.dataset.fk;
    if (was === 'stufe') rundeStarten(b.dataset.stufe);
    else if (was === 'stufen') ansichtStufen();
    else if (was === 'hilfe') hilfeZeigen();
    else if (was === 'woerter') woerterZeigen();
    else if (was === 'skala') skalaGewaehlt(b.dataset.wert);
    else if (was === 'begr') begruendungGewaehlt(Number(b.dataset.i));
    else if (was === 'legen') legen(b.dataset.farbe);
    else if (was === 'heraus') heraus();
    else if (was === 'pruefen') fuellenPruefen();
    else if (was === 'vermuten') vermutungWaehlen(b.dataset.farbe);
    else if (was === 'vermutung-fest') vermutungFest();
    else if (was === 'ziehen') ziehen(Number(b.dataset.n));
    else if (was === 'nochmal') nochmal();
    else if (was === 'antwort') antwortGewaehlt(b.dataset.id);
    else if (was === 'kiste') kisteGewaehlt(Number(b.dataset.i));
    else if (was === 'weiter') weiter();
    else return false;
    return true;
  }

  CB.stationen[ID] = { stempelSvg,
    id: ID,
    oeffnen(c) { ctx = c; ansichtStufen(); },
    bedienen,
    /* für Rauchtest und Vorschau */
    aufgabe, zustand: () => z,
    /* nur für den Test der Fachregel „Bewertet wird die Vermutung, nie der Ausgang“: wertet einen gegebenen Stand aus, ohne zu speichern */
    _vermutungBewerten(kiste, vermutung, zaehlung) {
      const a = { art: 'vermuten', kiste, loesung: Object.keys(kiste).sort((x, y) => kiste[y] - kiste[x])[0], antworten: Object.keys(kiste), zuege: 20 };
      const s = { vermutung, zaehlung, fertig: true, geschafft: false };
      vermutenAuswerten(a, s);
      return { rueck: s.rueck, passt: CB.fuehlkisteAufgaben.vermutungPasst(a, vermutung) };
    }
  };
})();
