/* Chancenbucht: Station Würfeln und Häufigkeit (Etappe 4c).
   Klassisches Skript, trägt sich in CB.stationen.wuerfeln ein. Braucht CB.config, CB.zufall, CB.einordnung, CB.wuerfel,
   CB.saeulen, CB.wuerfelnAufgaben, CB.teile, CB.stand. Die App ruft oeffnen(ctx) und bedienen(e).

   Fachliche Regeln (CLAUDE.md, Entscheidung D):
   - Bewertet wird die Einordnung oder Vermutung, nie ein einzelner Wurf.
   - Augensummen werden nie absolut als „wahrscheinlich“ eingeordnet, nur verglichen oder eindeutig (unmöglich, sicher).
   - Der Wurf steht fest, bevor der Würfel kippt (CB.zufall.wuerfle).
   - Kein Glücksspiel: „einen Strich bekommen“, keine Punkte, kein Sieger.
   - Gespeichert werden nur runden und stempel.
   Texte nach Dateien/Beispiele-Entwuerfe/wuerfeln.md (von Ingo freigegeben am 15.11.2026). */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  CB.stationen = CB.stationen || {};
  const ID = 'wuerfeln', P = 'wu';
  const C = () => CB.config;
  const E = () => CB.einordnung;
  const A = () => CB.wuerfelnAufgaben;
  const ST = () => CB.stand;
  const T = () => CB.teile;
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };
  const SUMMEN = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const AUGEN = ['1', '2', '3', '4', '5', '6'];
  const wuerfeWort = n => (n === 1 ? '1 Wurf' : `${n} Würfe`);

  let ctx = null, z = null, hilfeStufe = 0;
  const esc = s => ctx.esc(s);
  const kopf = unterzeile => T().kopf(ctx, { titel: 'Würfeln', unterzeile, praefix: P });
  const fokusAuf = sel => T().fokus(ctx, sel);
  const SO_GEHTS = offen => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: ['Vermute zuerst.', 'Würfle und schau auf die Strichliste.', 'Vergleiche: Passt deine Vermutung?'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Würfeln zu zweit', offen, schritte: [
    'Nehmt zwei Würfel. Vermutet zuerst: Welche Summe kommt am häufigsten?',
    'Würfelt 36-mal. Zählt jedes Mal die Augen zusammen und macht einen Strich bei der Summe.',
    'Malt ein Säulendiagramm ins Heft.',
    'Spielt dann: Einer bekommt bei der Summe 6 einen Strich, der andere bei der Summe 8. Ist das fair? Probiert es aus.',
    'Erfindet ein Spiel, das nicht fair ist. Merkt euer Partner, warum?'], notiz: 'Material: zwei Würfel, Stift, Heft.' });
  const WOERTER_EXTRA = [['Augensumme', 'Die Augen beider Würfel zusammengezählt.'], ['fair', 'Beide haben die gleiche Chance.']];
  const stempelSvg = () => T().stempel('<rect class="stempel__welle" x="27" y="38" width="20" height="20" rx="4"/><rect class="stempel__welle" x="53" y="44" width="20" height="20" rx="4"/><circle class="stempel__kugel" cx="37" cy="48" r="2.5"/><circle class="stempel__kugel" cx="58" cy="49" r="2.5"/><circle class="stempel__kugel" cx="68" cy="59" r="2.5"/>');

  /* ---------- Stufenwahl ---------- */
  function ansichtStufen() {
    z = null;
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Welche Summe kommt oft?')}
      ${erstesMal ? '<p class="wuerfi-satz">Ein Würfel hat sechs Seiten mit 1 bis 6 Augen. Mit zwei Würfeln zählen wir die Augen zusammen. Welche Summe kommt oft? Das finden wir heraus.</p>' : ''}
      ${SO_GEHTS(erstesMal)}
      ${T().stufenListe(ctx, ID, P)}
      ${AM_TISCH(false)}`, 'Würfeln');
  }

  /* ---------- Runde ---------- */
  function rundeStarten(stufe) {
    z = { stufe, aufgaben: A().runde(stufe, CB.zufall), i: 0, geschafft: [], gespeichertFehler: false, gefunden: {} };
    aufgabeZeigen();
  }
  const aufgabe = () => z && z.aufgaben[z.i];
  function aufgabeZeigen() {
    const a = aufgabe();
    hilfeStufe = 0;
    a.zustand = { versuche: 0, phase: 'start', fertig: false, geschafft: false, zaehlung: {}, gezogen: 0, schatten: null, vermutung: null,
      wuerfelt: false, letztes: null, hundert: null, wahl: [], seitenAn: false, spiel: null };
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`)}
      <div class="station-flaeche">
        <div class="buehne" id="wu-buehne"></div>
        <section class="papier aufgabe" id="wu-aufgabe" aria-labelledby="wu-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Würfeln`);
    zeichneAufgabe();
  }
  const anzahlWuerfel = a => (a.art === 'vermuten1' || a.art === 'einordnen1' ? 1 : 2);

  /* ---------- Bühne ---------- */
  function buehne() {
    const a = aufgabe(), s = a.zustand;
    const b = ctx.app.querySelector('#wu-buehne');
    b.textContent = '';
    const reihe = document.createElement('div'); reihe.className = 'wuerfel-reihe';
    const letzte = s.letztes || (anzahlWuerfel(a) === 1 ? [6] : [3, 4]);
    letzte.forEach(x => reihe.appendChild(CB.wuerfel.zeichnen(x)));
    if (a.art !== 'forschen') b.appendChild(reihe);
    if (a.art === 'einordnen1') {
      b.appendChild(CB.wuerfel.aufgeklappt(s.fertig || s.seitenAn ? (s.fertig ? a.passend : []) : []));
      const p = document.createElement('p'); p.className = 'rad-ergebnis'; p.textContent = 'Die sechs Seiten des Würfels'; b.appendChild(p);
    }
    if (a.art === 'vermuten1' || a.art === 'vermutenSumme') {
      const p = document.createElement('p'); p.className = 'rad-ergebnis'; p.id = 'wu-ergebnis';
      p.textContent = s.letztes ? ergebnisText(s.letztes) : '';
      b.appendChild(p);
    }
    if (a.art === 'forschen' || (a.art === 'stimmtDas' && s.fertig)) b.appendChild(wegeTabelle(a));
    if (a.art === 'fair' && s.spiel) {
      const p = document.createElement('div'); p.className = 'spiel-stand';
      p.innerHTML = `<p><b>Würfi</b> (Summe ${a.wuerfi}): <span class="striche" aria-hidden="true">${T().striche(s.spiel.wuerfi)}</span> ${s.spiel.wuerfi}</p><p><b>Du</b> (Summe ${a.kind}): <span class="striche" aria-hidden="true">${T().striche(s.spiel.kind)}</span> ${s.spiel.kind}</p>`;
      b.appendChild(p);
    }
  }
  const ergebnisText = w => (w.length === 1 ? `Gewürfelt: ${w[0]}.` : `Gewürfelt: ${w[0]} und ${w[1]}. Summe ${w[0] + w[1]}.`);
  /* Tabelle „Summe → Würfe“ (gefundene Summen dieser Runde, bei „Stimmt das?“ die genannten Summen) */
  function wegeTabelle(a) {
    const summen = a.art === 'forschen' ? Object.keys(z.gefunden).map(Number).sort((x, y) => x - y) : a.aussage.summen.filter(x => x >= 2 && x <= 12);
    const t = document.createElement('table');
    t.className = 'haeufigkeiten wege-tabelle';
    t.createCaption().textContent = a.art === 'forschen' ? 'Gefundene Würfe' : 'Würfe je Summe';
    const kopfz = t.createTHead().insertRow();
    for (const x of ['Summe', 'Würfe', 'Anzahl']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = x; kopfz.appendChild(th); }
    const rumpf = t.createTBody();
    if (!summen.length) { const r = rumpf.insertRow(); const c = r.insertCell(); c.colSpan = 3; c.textContent = 'Noch keine'; }
    for (const s of summen) {
      const wuerfe = E().moeglicheWuerfe(s).map(([x, y]) => `${x} + ${y}`);
      const r = rumpf.insertRow();
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = String(s); r.appendChild(th);
      r.insertCell().textContent = wuerfe.join(', ');
      r.insertCell().textContent = String(wuerfe.length);
    }
    return t;
  }

  /* ---------- Aufgabe ---------- */
  function zeichneAufgabe() { buehne(); panel(); }
  function panel() {
    const a = aufgabe(), s = a.zustand;
    const ziel = ctx.app.querySelector('#wu-aufgabe');
    const rueck = `<p class="rueckmeldung" id="wu-rueck" role="status">${s.rueck ? esc(s.rueck) : ''}</p>`;
    const erkl = s.erklaerung ? `<p class="erklaerung">${esc(s.erklaerung)}</p>` : '';
    const weiterKnopf = `<button type="button" class="knopf haupt" data-wu="weiter">${z.i + 1 < z.aufgaben.length ? 'Weiter' : 'Zum Rundenende'}</button>`;
    const weiter = s.fertig ? `<p class="knopfreihe">${weiterKnopf}</p>` : '';
    let html = '';
    if (a.art === 'einordnen1') {
      html = `<p class="wuerfi-sagt">Würfi sagt:</p>
        <p class="aussage" id="wu-frage">${esc(a.satz)}</p>
        <h2 class="frage-klein">Wie wahrscheinlich ist das?</h2>
        <div class="skala" role="group" aria-label="Wahrscheinlichkeitsskala">
          ${a.antworten.map(w => `<button type="button" class="knopf skala-knopf skala-knopf--${w}${s.skalaRichtig && w === a.loesung ? ' ist-richtig' : ''}" data-wu="skala" data-wert="${w}"${s.phase !== 'start' ? ' disabled' : ''}>${esc(E().wort(w))}</button>`).join('')}
        </div>
        ${s.phase === 'begr' && !s.begrVersuche ? rueck : ''}${s.phase === 'begr' || s.begrGezeigt ? begrHtml(a, s) : ''}
        ${s.phase === 'begr' && !s.begrVersuche ? '' : rueck}${erkl}${weiter}`;
    } else if (a.art === 'vermuten1' || a.art === 'vermutenSumme') {
      const eins = a.art === 'vermuten1';
      const rest = a.zuege - s.gezogen;
      html = `<p class="wuerfi-sagt">Erst vermuten, dann würfeln.</p>
        <p class="aussage" id="wu-frage">${eins ? `Wir würfeln ${a.zuege}-mal. Welche Zahl kommt wohl am häufigsten?` : `Wir würfeln ${a.zuege}-mal mit zwei Würfeln und zählen die Augen zusammen. Welche Summe kommt wohl am häufigsten?`}</p>
        <div class="${eins ? 'zahl-knoepfe' : 'zahl-knoepfe zahl-knoepfe--summen'}" role="group" aria-label="Deine Vermutung">
          ${a.antworten.map(x => `<button type="button" class="knopf zahl-knopf${x === 'gleich' ? ' zahl-knopf--breit' : ''}" data-wu="vermuten" data-wert="${x}" aria-pressed="${s.vermutung === x}"${s.phase !== 'start' ? ' disabled' : ''}>${x === 'gleich' ? 'Alle Zahlen haben die gleiche Chance.' : esc(x)}</button>`).join('')}
        </div>
        ${s.phase === 'start' ? `<p class="knopfreihe"><button type="button" class="knopf haupt" data-wu="vermutung-fest"${s.vermutung ? '' : ' disabled'}>Ich bin fertig mit Vermuten</button></p>` : `
        <div class="ziehen">
          <p class="knopfreihe">
            <button type="button" class="knopf haupt dreh-knopf" data-wu="wuerfeln" data-n="1"${rest > 0 && !s.wuerfelt ? '' : ' disabled'}>Würfeln</button>
            ${rest === 1 ? '' : `<button type="button" class="knopf" data-wu="wuerfeln" data-n="10"${rest > 0 && !s.wuerfelt ? '' : ' disabled'}>${rest > 0 ? Math.min(10, rest) : 10}-mal würfeln</button>`}
          </p>
          <p class="leise">${s.gezogen} von ${a.zuege}-mal gewürfelt</p>
          <h3 class="frage-klein">Strichliste</h3>
          ${strichliste(eins ? AUGEN : SUMMEN, s.zaehlung)}
          <div class="diagramme${s.hundert && eins ? ' diagramme--zwei' : ''}">
            <div class="diagramm${eins ? '' : ' diagramm--breit'}" id="wu-diagramm"></div>
            ${s.hundert ? `<div class="diagramm${eins ? '' : ' diagramm--breit'}" id="wu-diagramm-100"></div>` : ''}
          </div>
          ${s.hundert ? '<p>Vergleich die beiden Diagramme.</p>' : ''}
        </div>`}
        ${rueck}${erkl}
        ${s.fertig ? `<p class="knopfreihe">${s.hundert ? '' : '<button type="button" class="knopf" data-wu="hundert">Jetzt 100-mal würfeln</button>'}${weiterKnopf}</p>` : ''}`;
    } else if (a.art === 'forschen') {
      html = `<p class="aussage" id="wu-frage">${esc(a.satz)}</p>
        <table class="wurf-gitter">
          <caption class="nurvorlesen">Alle Würfe mit zwei Würfeln. Zeilen: erster Würfel. Spalten: zweiter Würfel.</caption>
          <thead><tr><th scope="col"><span class="nurvorlesen">erster Würfel</span></th>${AUGEN.map(x => `<th scope="col">${x}</th>`).join('')}</tr></thead>
          <tbody>${AUGEN.map(x => `<tr><th scope="row">${x}</th>${AUGEN.map(y => { const id = `${x}+${y}`; const an = s.wahl.includes(id); const richtig = s.fertig && a.loesung.includes(id); return `<td><button type="button" class="knopf gitter-knopf${richtig ? ' ist-richtig' : ''}" data-wu="gitter" data-id="${id}" aria-pressed="${an}" aria-label="Erster Würfel ${x}, zweiter Würfel ${y}"${s.fertig ? ' disabled' : ''}>${x} + ${y}</button></td>`; }).join('')}</tr>`).join('')}</tbody>
        </table>
        <p class="leise">Zeilen: erster Würfel · Spalten: zweiter Würfel</p>
        ${s.fertig ? '' : `<p class="knopfreihe"><button type="button" class="knopf haupt" data-wu="gitter-pruefen"${s.wahl.length ? '' : ' disabled'}>Prüfen</button></p>`}
        ${rueck}${erkl}${weiter}`;
    } else if (a.art === 'stimmtDas') {
      html = `<p class="aussage" id="wu-frage">${esc(a.satz)}</p>
        <div class="antworten antworten--zwei" role="group" aria-label="Antworten">
          ${a.antworten.map(x => `<button type="button" class="knopf antwort-knopf${s.antwortRichtig && x.id === a.loesung ? ' ist-richtig' : ''}" data-wu="antwort" data-id="${x.id}"${s.phase !== 'start' ? ' disabled' : ''}>${esc(x.text)}</button>`).join('')}
        </div>
        ${s.phase === 'begr' && !s.begrVersuche ? rueck : ''}${s.phase === 'begr' || s.begrGezeigt ? begrHtml(a, s) : ''}
        ${s.phase === 'begr' && !s.begrVersuche ? '' : rueck}${erkl}${weiter}`;
    } else if (a.art === 'fair') {
      html = `<p class="aussage" id="wu-frage">${esc(a.satz)}</p>
        <div class="antworten" role="group" aria-label="Antworten">
          ${a.antworten.map(x => `<button type="button" class="knopf antwort-knopf${s.fertig && x.id === a.loesung ? ' ist-richtig' : ''}" data-wu="antwort" data-id="${x.id}"${s.fertig ? ' disabled' : ''}>${esc(x.text)}</button>`).join('')}
        </div>
        ${rueck}${erkl}
        ${s.spiel ? `<p class="spiel-text">${esc(s.spiel.text)}</p>` : ''}
        ${s.fertig ? `<p class="knopfreihe">${s.spiel ? '' : `<button type="button" class="knopf" data-wu="spielen">${a.runden} Runden spielen</button>`}${weiterKnopf}</p>` : ''}`;
    } else if (a.art === 'fairMachen') {
      html = `<p class="aussage" id="wu-frage">${esc(a.satz)}</p>
        <div class="zahl-knoepfe zahl-knoepfe--summen" role="group" aria-label="Summen">
          ${a.antworten.map(x => `<button type="button" class="knopf zahl-knopf${s.fertig && x === a.loesung ? ' ist-richtig' : ''}" data-wu="fair-summe" data-wert="${x}"${s.fertig ? ' disabled' : ''}>${esc(x)}</button>`).join('')}
        </div>
        ${rueck}${erkl}${weiter}`;
    }
    ziel.innerHTML = html;
    T().nachZeichnen(ziel, s, a);
    if ((a.art === 'vermuten1' || a.art === 'vermutenSumme') && s.phase !== 'start') {
      const kat = (a.art === 'vermuten1' ? AUGEN : SUMMEN).map(id => ({ id, name: id, farbe: 'neutral' }));
      diagramm(ctx.app.querySelector('#wu-diagramm'), kat, s.zaehlung, s.schatten, s.hundert ? `${a.zuege}-mal gewürfelt` : (a.art === 'vermuten1' ? 'Gewürfelte Zahlen' : 'Gewürfelte Summen'));
      if (s.hundert) diagramm(ctx.app.querySelector('#wu-diagramm-100'), kat, s.hundert, null, '100-mal gewürfelt');
    }
  }
  function begrHtml(a, s) {
    return `
          <h2 class="frage-klein">Warum? Tippe den passenden Satz an.</h2>
          <div class="begruendungen" role="group" aria-label="Begründungen">
            ${a.begruendungen.map((b, i) => `<button type="button" class="knopf begr-knopf${s.begrRichtig && b.richtig ? ' ist-richtig' : ''}" data-wu="begr" data-i="${i}"${s.phase !== 'begr' ? ' disabled' : ''}>${esc(b.text)}</button>`).join('')}
          </div>`;
  }
  /* Strichliste für Zahlen (zwei Spalten bei 11 Summen) */
  function strichliste(kat, zaehlung) {
    return `<ul class="strichliste${kat.length > 6 ? ' strichliste--zwei' : ''}">${kat.map(k => `<li><span class="strichliste__farbe strichliste__zahl">${esc(k)}</span><span class="striche" aria-hidden="true">${T().striche(zaehlung[k] || 0)}</span><span class="nurvorlesen">${zaehlung[k] || 0} Striche</span></li>`).join('')}</ul>`;
  }
  function diagramm(ort, kategorien, werte, schatten, titel) {
    if (!ort) return;
    const d = CB.saeulen.zeichnen({ kategorien, werte, schatten, titel });
    ort.textContent = ''; ort.appendChild(d.svg); ort.appendChild(d.tabelle);
  }

  /* ---------- Bewerten ---------- */
  function fertig(a, geschafft) {
    const s = a.zustand;
    s.fertig = true;
    if (s.geschafft || !geschafft) return;
    s.geschafft = true; z.geschafft[z.i] = true;
    if (!ST().istVorschau && ST().rundeGeschafft(ID, z.stufe) === false) z.gespeichertFehler = true;
  }
  const melde = s => ctx.ansagen(s.rueck + (s.erklaerung ? ' ' + s.erklaerung : ''));

  /* Einordnen (ein Würfel) */
  function skalaGewaehlt(wert) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'start') return;
    s.versuche++;
    if (wert === a.loesung) { s.phase = 'begr'; s.skalaRichtig = true; s.zaehlt = true; s.rueck = `Das stimmt. Das ist ${E().wort(a.loesung)}.`; }
    else if (s.versuche === 1) s.rueck = 'Noch nicht ganz. Schau dir alle sechs Seiten an. Wie viele passen zum Satz?';
    else { s.phase = 'begr'; s.skalaRichtig = true; s.zaehlt = false; s.rueck = `Hier ist die Lösung: Das ist ${E().wort(a.loesung)}. Jetzt such den passenden Satz dazu.`; }
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
      fertig(a, s.zaehlt);
    } else s.rueck = a.art === 'stimmtDas' ? 'Noch nicht ganz. Zähl die Würfe für die Summen noch einmal.' : 'Noch nicht ganz. Lies die Sätze noch einmal und zähl nach.';
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-wu="weiter"]' : '.begr-knopf');
  }

  /* Vermuten und Würfeln */
  function vermutungWaehlen(w) { const s = aufgabe().zustand; if (s.phase !== 'start') return; s.vermutung = w; panel(); fokusAuf('[data-wu="vermutung-fest"]'); }
  function vermutungFest() {
    const a = aufgabe(), s = a.zustand;
    if (!s.vermutung) return;
    s.phase = 'wuerfeln';
    s.rueck = `Deine Vermutung: ${s.vermutung === 'gleich' ? 'Alle Zahlen haben die gleiche Chance' : s.vermutung}. Jetzt würfle.`;
    zeichneAufgabe(); fokusAuf('[data-wu="wuerfeln"]');
  }
  const wurfWert = (a, w) => String(a.art === 'vermuten1' ? w[0] : w[0] + w[1]);
  function wuerfeln(n) {
    const a = aufgabe(), s = a.zustand;
    if (s.wuerfelt || s.gezogen >= a.zuege) return;
    s.letzteN = n;
    const anzahl = Math.min(n, a.zuege - s.gezogen);
    const k = anzahlWuerfel(a);
    if (anzahl === 1) {
      const w = CB.zufall.wuerfle(k);   /* Ergebnis steht fest, bevor der Würfel kippt */
      s.wuerfelt = true; panel();
      const svgs = [...ctx.app.querySelectorAll('#wu-buehne .wuerfel-reihe .wuerfel')];
      CB.wuerfel.werfen(svgs, w).then(() => {
        if (aufgabe() !== a) return;
        s.wuerfelt = false; s.letztes = w;
        const v = wurfWert(a, w); s.zaehlung[v] = (s.zaehlung[v] || 0) + 1; s.gezogen++;
        nachWuerfeln(a, s, ergebnisText(w));
      });
      return;
    }
    const neu = {};
    for (let i = 0; i < anzahl; i++) { const w = CB.zufall.wuerfle(k); s.letztes = w; const v = wurfWert(a, w); neu[v] = (neu[v] || 0) + 1; s.zaehlung[v] = (s.zaehlung[v] || 0) + 1; }
    s.gezogen += anzahl;
    const max = Math.max(...Object.values(neu));
    nachWuerfeln(a, s, `${anzahl}-mal gewürfelt. Am häufigsten kam ${Object.keys(neu).filter(x => neu[x] === max).join(' und ')}.`);
  }
  function nachWuerfeln(a, s, ansage) {
    if (s.gezogen >= a.zuege && !s.ausgewertet) { vermutenAuswerten(a, s); ansage += ' ' + s.rueck + ' ' + (s.erklaerung || ''); }
    else s.rueck = ansage;
    zeichneAufgabe(); ctx.ansagen(ansage);
    fokusAuf(s.fertig ? '[data-wu="weiter"]' : ctx.app.querySelector(`[data-wu="wuerfeln"][data-n="${s.letzteN}"]:not([disabled])`) ? `[data-wu="wuerfeln"][data-n="${s.letzteN}"]` : '[data-wu="wuerfeln"]:not([disabled])');
  }
  function vermutenAuswerten(a, s) {
    s.ausgewertet = true;
    const max = Math.max(...Object.values(s.zaehlung));
    const oben = Object.keys(s.zaehlung).filter(x => s.zaehlung[x] === max);
    const kam = oben.join(' und ');
    const passt = A().vermutungPasst(a, s.vermutung);
    if (a.art === 'vermuten1') {
      if (passt) s.rueck = `Genau. Jede Zahl ist einmal auf dem Würfel. Jede hat die gleiche Chance. Heute kam ${oben.length === 1 ? 'die ' + kam : kam} am häufigsten. Das ist Zufall. Beim nächsten Mal kann es eine andere Zahl sein.`;
      else s.rueck = `Die ${s.vermutung} ist nur einmal auf dem Würfel, wie jede andere Zahl. Darum hat die ${s.vermutung} die gleiche Chance wie die anderen. Eine Glückszahl gibt es beim Würfeln nicht.` + (oben.includes(s.vermutung) ? ` Heute kam die ${s.vermutung} am häufigsten. Das war Zufall, nicht Glück.` : '');
      s.erklaerung = 'Das ist passiert: ' + AUGEN.map(x => `${x}: ${s.zaehlung[x] || 0}`).join(' · ') + '.';
    } else {
      if (passt) s.rueck = `Deine Vermutung passt. Für die 7 gibt es die meisten Würfe: 6 Stück. ` + (oben.length === 1 && oben[0] === '7' ? 'Heute kam die 7 auch am häufigsten.' : `Heute kam trotzdem ${oben.length === 1 ? 'die ' + kam : kam} am häufigsten. So ist Zufall.`);
      else s.rueck = `Für die ${s.vermutung} gibt es ${wuerfeWort(E().anzahlWege(Number(s.vermutung)))}, für die 7 gibt es 6. Darum kommt die 7 meistens am häufigsten. Aber nicht immer.`;
      s.erklaerung = `Das hast du vermutet: ${s.vermutung}. Am häufigsten kam: ${kam}.`;
    }
    if (!s.fertig) fertig(a, passt);
    s.fertig = true;
  }
  function hundert() {
    const a = aufgabe(), s = a.zustand;
    if (s.hundert) return;
    s.hundert = {};
    for (let i = 0; i < 100; i++) { const w = CB.zufall.wuerfle(anzahlWuerfel(a)); s.letztes = w; const v = wurfWert(a, w); s.hundert[v] = (s.hundert[v] || 0) + 1; }
    zeichneAufgabe();
    ctx.ansagen('100-mal gewürfelt. Vergleich die beiden Diagramme.');
    fokusAuf('[data-wu="weiter"]');
  }

  /* Forschen */
  function gitterTippen(id) {
    const s = aufgabe().zustand;
    if (s.fertig) return;
    s.wahl = s.wahl.includes(id) ? s.wahl.filter(x => x !== id) : s.wahl.concat(id);
    panel(); fokusAuf(`[data-wu="gitter"][data-id="${id}"]`);
  }
  function gitterPruefen() {
    const a = aufgabe(), s = a.zustand;
    if (!s.wahl.length || s.fertig) return;
    s.versuche++;
    const falsch = s.wahl.find(x => !a.loesung.includes(x));
    const fehlt = a.loesung.filter(x => !s.wahl.includes(x));
    if (!falsch && !fehlt.length) {
      s.rueck = 'Genau.'; s.erklaerung = a.erklaerung + (a.summe === 7 ? ' Sie liegen auf der schrägen Reihe (Diagonale). Die 7 hat die meisten Würfe.' : '');
      z.gefunden[a.summe] = true; fertig(a, s.versuche <= 2);
    } else if (s.versuche < 2) {
      if (falsch) { const [x, y] = falsch.split('+').map(Number); s.rueck = `${x} + ${y} ergibt ${x + y}, nicht ${a.summe}.`; }
      else s.rueck = `Es ${fehlt.length === 1 ? 'fehlt noch ein Wurf' : `fehlen noch ${fehlt.length} Würfe`}. Denk daran: 1 + 4 und 4 + 1 sind zwei verschiedene Würfe, weil es zwei Würfel sind.`;
    } else {
      s.rueck = 'Hier ist die Lösung:'; s.erklaerung = a.erklaerung; s.wahl = a.loesung.slice();
      z.gefunden[a.summe] = true; fertig(a, false);
    }
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-wu="weiter"]' : '[data-wu="gitter-pruefen"]');
  }

  /* Stimmt das? (Antwort, dann Begründung) */
  function stimmtAntwort(id) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'start') return;
    s.versuche++;
    if (id === a.loesung) { s.phase = 'begr'; s.antwortRichtig = true; s.zaehlt = true; s.rueck = 'Das stimmt. Warum?'; }
    else if (s.versuche === 1) s.rueck = 'Noch nicht ganz. Zähl die Würfe für die Summen.';
    else { s.phase = 'begr'; s.antwortRichtig = true; s.zaehlt = false; s.rueck = `Hier ist die Lösung: ${a.loesung === 'ja' ? 'Das stimmt.' : 'Das stimmt nicht.'} Such den passenden Satz dazu.`; }
    s.begrGezeigt = s.phase === 'begr'; s.begrVersuche = 0;
    zeichneAufgabe(); ctx.ansagen(s.rueck);
    fokusAuf(s.phase === 'begr' ? '.begr-knopf' : '.antwort-knopf:not([disabled])');
  }

  /* Fair? */
  function fairAntwort(id) {
    const a = aufgabe(), s = a.zustand;
    if (s.fertig) return;
    s.versuche++;
    if (id === a.loesung) { s.rueck = 'Das stimmt.'; s.erklaerung = a.erklaerung; fertig(a, s.versuche <= 2); }
    else if (s.versuche < 2) s.rueck = `Noch nicht ganz. Zähl die Würfe für die ${a.wuerfi} und für die ${a.kind}.`;
    else { s.rueck = 'Hier ist die Lösung:'; s.erklaerung = a.erklaerung; fertig(a, false); }
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-wu="spielen"], [data-wu="weiter"]' : '.antwort-knopf');
  }
  /* Freiwillig spielen: nur Striche, keine Wertung */
  function spielen() {
    const a = aufgabe(), s = a.zustand;
    if (s.spiel) return;
    const sp = { wuerfi: 0, kind: 0 };
    let w = null;
    for (let i = 0; i < a.runden; i++) { w = CB.zufall.wuerfle(2); const summe = w[0] + w[1]; if (summe === a.wuerfi) sp.wuerfi++; if (summe === a.kind) sp.kind++; }
    s.letztes = w;
    const gleich = E().anzahlWege(a.wuerfi) === E().anzahlWege(a.kind);
    sp.text = `Würfi hat ${sp.wuerfi} ${sp.wuerfi === 1 ? 'Strich' : 'Striche'}, du hast ${sp.kind}.` +
      (a.loesung === 'wuerfi' && sp.kind > sp.wuerfi ? ' Diesmal hattest du mehr Striche. Trotzdem hat Würfi die größere Chance. Probier es noch einmal.' : '') +
      (a.loesung === 'kind' && sp.wuerfi > sp.kind ? ' Diesmal hatte Würfi mehr Striche. Trotzdem hast du die größere Chance.' : '') +
      (gleich ? ' Beide haben die gleiche Chance. Wer mehr Striche hat, ist Zufall.' : '');
    s.spiel = sp;
    zeichneAufgabe(); ctx.ansagen(sp.text);
    fokusAuf('[data-wu="weiter"]');
  }
  function fairSumme(wert) {
    const a = aufgabe(), s = a.zustand;
    if (s.fertig) return;
    s.versuche++;
    if (wert === a.loesung) { s.rueck = 'Das stimmt.'; s.erklaerung = a.erklaerung; fertig(a, s.versuche <= 2); }
    else if (s.versuche < 2) s.rueck = `Für die ${wert} gibt es ${wuerfeWort(E().anzahlWege(Number(wert)))}, für die ${a.wuerfi} gibt es ${wuerfeWort(E().anzahlWege(a.wuerfi))}. Fair heißt: gleich viele Würfe.`;
    else { s.rueck = 'Hier ist die Lösung:'; s.erklaerung = a.erklaerung; fertig(a, false); }
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-wu="weiter"]' : '[data-wu="fair-summe"]');
  }

  function weiter() {
    if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); return; }
    const r = T().rundenende(ctx, { id: ID, praefix: P, stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    ctx.zeigen(`${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}${r.html}${AM_TISCH(false)}`, 'Rundenende – Würfeln');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  /* ---------- Hilfe ---------- */
  const TIPPS = {
    einordnen1: ['Schau dir alle sechs Seiten an.', 'Wie viele Seiten passen zum Satz? Sind es mehr oder weniger als drei?', 'Ich zeige dir die sechs Seiten. Zähl, welche passen.'],
    vermuten1: ['Wie oft ist jede Zahl auf dem Würfel?', 'Hat eine Zahl mehr Seiten als die anderen?'],
    vermutenSumme: ['Wie viele Würfe gibt es für die 2? Und für die 7?', 'Schau im Gitter auf die schräge Reihe (Diagonale): Dort liegen alle Würfe mit der 7.'],
    forschen: ['Fang beim ersten Würfel mit 1 an. Was muss der zweite zeigen?', 'Geh dann zum ersten Würfel mit 2, 3 und so weiter.', '1 + 4 und 4 + 1 sind zwei Würfe.'],
    stimmtDas: ['Zähl die Würfe für beide Summen.', 'Mehr Würfe heißt: wahrscheinlicher.'],
    fair: ['Zähl die Würfe für Würfis Summe und für deine.', 'Fair heißt: gleich viele Würfe.'],
    fairMachen: ['Zähl die Würfe für Würfis Summe.', 'Welche andere Summe hat genauso viele Würfe?']
  };
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) {
      T().dialog(ctx, { titel: 'Tipp von Würfi', inhalt: `<div class="tipp">${ctx.wuerfiKlein}<p>Wähle eine Stufe. Ich empfehle dir die Stufe mit dem Wort „empfohlen“.</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' });
      return;
    }
    const s = a.zustand, liste = TIPPS[a.art];
    const erlaubt = liste.length >= 3 && !s.versuche ? liste.length - 1 : liste.length;
    const bis = Math.min(hilfeStufe, erlaubt - 1);
    if (a.art === 'einordnen1' && bis >= 2 && !s.seitenAn && !s.fertig) { s.seitenAn = true; buehne(); }
    T().tippDialog(ctx, { liste, bis, erlaubt, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }

  /* ---------- Bedienung ---------- */
  function bedienen(e) {
    const b = e.target.closest('[data-wu]');
    if (!b || b.disabled) return false;
    const w = b.dataset.wu, a = aufgabe();
    if (w === 'stufe') rundeStarten(b.dataset.stufe);
    else if (w === 'stufen') ansichtStufen();
    else if (w === 'hilfe') hilfeZeigen();
    else if (w === 'woerter') T().woerter(ctx, WOERTER_EXTRA);
    else if (w === 'skala') skalaGewaehlt(b.dataset.wert);
    else if (w === 'begr') begruendungGewaehlt(Number(b.dataset.i));
    else if (w === 'vermuten') vermutungWaehlen(b.dataset.wert);
    else if (w === 'vermutung-fest') vermutungFest();
    else if (w === 'wuerfeln') wuerfeln(Number(b.dataset.n));
    else if (w === 'hundert') hundert();
    else if (w === 'gitter') gitterTippen(b.dataset.id);
    else if (w === 'gitter-pruefen') gitterPruefen();
    else if (w === 'antwort') (a && a.art === 'stimmtDas' ? stimmtAntwort : fairAntwort)(b.dataset.id);
    else if (w === 'spielen') spielen();
    else if (w === 'fair-summe') fairSumme(b.dataset.wert);
    else if (w === 'weiter') weiter();
    else return false;
    return true;
  }

  CB.stationen[ID] = { stempelSvg,
    id: ID,
    oeffnen(c) { ctx = c; ansichtStufen(); },
    bedienen, aufgabe, zustand: () => z,
    /* nur für den Test der Fachregel „Vermutung, nicht Ausgang“ */
    _vermutungBewerten(art, vermutung, zaehlung) {
      const a = art === 'vermuten1' ? A().vermuten1('leicht') : A().vermutenSumme('mittel');
      const s = { vermutung, zaehlung, fertig: true };
      vermutenAuswerten(a, s);
      return { rueck: s.rueck, passt: A().vermutungPasst(a, vermutung) };
    }
  };
})();
