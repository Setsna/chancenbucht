/* Chancenbucht: Station Münzwurf (Etappe 5c).
   Klassisches Skript, trägt sich in CB.stationen.muenze ein. Braucht CB.config, CB.zufall, CB.muenze, CB.wuerfel,
   CB.saeulen, CB.muenzeAufgaben, CB.teile, CB.stand. Die App ruft oeffnen(ctx) und bedienen(e).

   Fachliche Regeln:
   - Bewertet wird die Einordnung oder Vermutung, nie ein einzelner Wurf.
   - Kein fünftes Skalenwort: „gleiche Chance“ statt „genau die Hälfte“.
   - Kein Ausgleich. Der Wurf steht fest, bevor die Münze sich dreht (CB.zufall.wirf).
   - Gespeichert werden nur runden und stempel. „Mit echtem Wurf vergleichen“ speichert nichts und zählt nicht.
   Texte nach Dateien/Beispiele-Entwuerfe/muenze.md (von Ingo freigegeben am 15.11.2026). */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  CB.stationen = CB.stationen || {};
  const ID = 'muenze', P = 'mu';
  const A = () => CB.muenzeAufgaben;
  const ST = () => CB.stand;
  const T = () => CB.teile;
  const Z = () => CB.zufall;
  const NAME = { kopf: 'Kopf', zahl: 'Zahl' };
  const SEITEN = ['kopf', 'zahl'];
  const KAT = SEITEN.map(id => ({ id, name: NAME[id], farbe: 'neutral' }));
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };
  const TISCH_WUERFE = 20;

  let ctx = null, z = null, tisch = null, hilfeStufe = 0;
  const esc = s => ctx.esc(s);
  const kopf = unterzeile => T().kopf(ctx, { titel: 'Münzwurf', unterzeile, praefix: P });
  const fokusAuf = sel => T().fokus(ctx, sel);
  const SO_GEHTS = offen => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: ['Vermute zuerst.', 'Wirf die Münze und zähle.', 'Vergleiche: Passt deine Vermutung?'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Münzen werfen', offen, schritte: [
    'Nehmt einen Spielchip. Die Seite mit dem Zeichen ist Kopf. Vermutet: Was kommt bei 20 Würfen öfter?',
    'Werft 20-mal und macht eine Strichliste.',
    'Schreibt alle Würfe als Reihe auf, zum Beispiel K Z Z K. Sucht Stellen mit dreimal hintereinander gleich. Was kam danach?',
    'Werft zwei Chips gleichzeitig, 20-mal. Was kommt öfter: zwei gleiche Seiten oder zwei verschiedene?',
    'Erfindet einen gerechten und einen ungerechten Weg, mit Chip oder Würfel zu entscheiden, wer anfängt.'],
    notiz: 'Material: ein Spielchip mit zwei verschiedenen Seiten (eine Seite mit einem Zeichen bemalt), Stift, Heft.' });
  const WOERTER_EXTRA = [['gleiche Chance', 'Keine Seite ist im Vorteil.'], ['fair', 'Beide haben die gleiche Chance.']];
  const TISCH_KNOPF = '<button type="button" class="knopf" data-mu="tisch">Mit echtem Wurf vergleichen</button>';
  const stempelSvg = () => T().stempel('<circle class="stempel__welle" cx="50" cy="50" r="17"/><path class="stempel__welle" d="M38 55 q3 -4 6 0 t6 0 t6 0 t6 0"/><path class="stempel__welle" d="M46 39 L51 35 L51 49"/>');

  /* ---------- Stufenwahl ---------- */
  function ansichtStufen() {
    z = null; tisch = null;
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Kopf oder Zahl?')}
      ${erstesMal ? '<p class="wuerfi-satz">Eine Münze hat zwei Seiten: Kopf und Zahl. Mein Kopf ist auf der einen Seite. Er bringt aber kein Glück. Probier es aus!</p>' : ''}
      ${SO_GEHTS(erstesMal)}
      ${T().stufenListe(ctx, ID, P)}
      <p class="knopfreihe knopfreihe--mitte">${TISCH_KNOPF}</p>
      ${AM_TISCH(false)}`, 'Münzwurf');
  }

  /* ---------- Runde ---------- */
  function rundeStarten(stufe) {
    tisch = null;
    z = { stufe, aufgaben: A().runde(stufe, Z()), i: 0, geschafft: [], gespeichertFehler: false };
    aufgabeZeigen();
  }
  const aufgabe = () => z && z.aufgaben[z.i];
  function aufgabeZeigen() {
    const a = aufgabe();
    hilfeStufe = 0;
    a.zustand = { versuche: 0, phase: 'start', fertig: false, geschafft: false, zaehlung: {}, gezogen: 0, schatten: null, vermutung: null,
      wirft: false, letztes: null, hundert: null, wahl: [], gross: false, versuch: null, spiel: null };
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`)}
      <div class="station-flaeche">
        <div class="buehne" id="mu-buehne"></div>
        <section class="papier aufgabe" id="mu-aufgabe" aria-labelledby="mu-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Münzwurf`);
    zeichneAufgabe();
  }

  /* ---------- Bühne ---------- */
  const reiheHtml = (reihe, frage) => `<div class="muenz-reihe" role="img" aria-label="Würfe: ${reihe.map(s => NAME[s]).join(', ')}${frage ? ', dann ein leerer Platz' : ''}">` +
    reihe.map(s => `<span class="muenz-reihe__platz">${CB.muenze.zeichnen(s, { klein: true }).outerHTML}</span>`).join('') +
    (frage ? '<span class="muenz-reihe__platz muenz-reihe__platz--frage" aria-hidden="true">?</span>' : '') + '</div>';
  function buehne() {
    const a = aufgabe(), s = a.zustand;
    const b = ctx.app.querySelector('#mu-buehne');
    b.textContent = '';
    const p = (text, id) => { const e = document.createElement('p'); e.className = 'rad-ergebnis'; if (id) e.id = id; e.textContent = text; b.appendChild(e); return e; };
    if (a.art === 'einordnen' || a.art === 'vermuten') {
      const reihe = document.createElement('div'); reihe.className = 'muenz-gross';
      reihe.appendChild(CB.muenze.zeichnen(s.letztes || 'kopf'));
      b.appendChild(reihe);
      if (a.art === 'einordnen') {
        const sei = CB.muenze.seiten(s.fertig ? a.passend : []);
        if (s.gross) sei.classList.add('muenze-seiten--gross');
        b.appendChild(sei);
        p('Die zwei Seiten der Münze');
      } else p(s.letztes ? `Geworfen: ${NAME[s.letztes]}.` : '', 'mu-ergebnis');
    } else if (a.art === 'dreimal' || a.art === 'reihe') {
      b.insertAdjacentHTML('beforeend', reiheHtml(a.reihe, a.art === 'dreimal'));
      if (a.art === 'dreimal' && s.versuch) { b.appendChild(legende(NAME[a.seite], 'der Wurf danach')); b.appendChild(wurfFeld(s.versuch, a.seite)); }
    } else if (a.art === 'haelfte') {
      const m = document.createElement('div'); m.className = 'muenz-gross'; m.appendChild(CB.muenze.zeichnen('kopf')); b.appendChild(m);
      if (s.versuch) b.appendChild(serienTabelle(a, s.versuch));
    } else if (a.art === 'zweiMuenzen' || a.art === 'vergleichen') {
      b.insertAdjacentHTML('beforeend', `<div class="muenz-paar" role="img" aria-label="Zwei Münzen, eine kleine und eine große">${CB.muenze.zeichnen('kopf', { klein: true }).outerHTML}${CB.muenze.zeichnen('zahl').outerHTML}</div>`);
      p('kleine Münze und große Münze');
    } else if (a.art === 'gerecht') {
      const m = document.createElement('div'); m.className = 'muenz-gross';
      if (a.verfahren === 'muenze') m.appendChild(CB.muenze.zeichnen('kopf'));
      else if (a.raum.length === 6) m.appendChild(CB.wuerfel.zeichnen(6));
      else { m.appendChild(CB.muenze.zeichnen('kopf', { klein: true })); m.appendChild(CB.muenze.zeichnen('zahl')); }
      b.appendChild(m);
      if (s.spiel) {
        const d = document.createElement('div'); d.className = 'spiel-stand';
        d.innerHTML = `<p><b>Würfi</b> (${esc(a.wuerfi)}): <span class="striche" aria-hidden="true">${T().striche(s.spiel.wuerfi)}</span> ${s.spiel.wuerfi}</p><p><b>Du</b> (${esc(a.kind)}): <span class="striche" aria-hidden="true">${T().striche(s.spiel.kind)}</span> ${s.spiel.kind}</p>`;
        b.appendChild(d);
      }
    }
  }
  /* 100 Würfe als kleine Reihe K/Z; Stellen mit dreimal <seite> umrandet, der Wurf danach hervorgehoben */
  /* B15: Legende über dem Feld, damit Rahmen und dunkles Kästchen ohne Erklärung lesbar sind */
  function legende(was, danachWort) {
    const p = document.createElement('p');
    p.className = 'wurf-legende';
    p.innerHTML = '<span class="wurf-legende__teil"><span class="wurf-feld__wurf ist-reihe" aria-hidden="true">&nbsp;</span> umrandet: dreimal ' + was + ' hintereinander</span>'
      + '<span class="wurf-legende__teil"><span class="wurf-feld__wurf ist-danach" aria-hidden="true">&nbsp;</span> dunkel: ' + danachWort + '</span>';
    return p;
  }
  function wurfFeld(v, seite) {
    const d = document.createElement('div');
    d.className = 'wurf-feld';
    const markiert = new Set(), danach = new Set();
    for (const i of v.aus.stellen) { markiert.add(i); markiert.add(i + 1); markiert.add(i + 2); danach.add(i + 3); }
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', `100 Würfe. ${v.aus.stellen.length}-mal dreimal ${NAME[seite]} hintereinander.`);
    for (let i = 0; i < v.wuerfe.length; i++) {
      const e = document.createElement('span');
      e.className = 'wurf-feld__wurf wurf-feld__wurf--' + v.wuerfe[i] + (markiert.has(i) ? ' ist-reihe' : '') + (danach.has(i) ? ' ist-danach' : '');
      e.textContent = v.wuerfe[i] === 'kopf' ? 'K' : 'Z';
      e.setAttribute('aria-hidden', 'true');
      d.appendChild(e);
    }
    return d;
  }
  function serienTabelle(a, serien) {
    const t = document.createElement('table');
    t.className = 'haeufigkeiten wege-tabelle serien-tabelle';
    t.createCaption().textContent = `5-mal je ${a.wuerfe} Würfe`;
    const k = t.createTHead().insertRow();
    for (const x of ['Mal', 'Kopf', 'genau die Hälfte?']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = x; k.appendChild(th); }
    const r = t.createTBody();
    serien.forEach((n, i) => {
      const z2 = r.insertRow();
      if (n === a.wuerfe / 2) z2.className = 'ist-genau';
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = `${i + 1}.`; z2.appendChild(th);
      z2.insertCell().textContent = `${n}-mal`;
      z2.insertCell().textContent = n === a.wuerfe / 2 ? 'ja' : 'nein';
    });
    return t;
  }

  /* ---------- Aufgabe ---------- */
  function zeichneAufgabe() { buehne(); panel(); }
  function panel() {
    const a = aufgabe(), s = a.zustand;
    const ziel = ctx.app.querySelector('#mu-aufgabe');
    const rueck = `<p class="rueckmeldung" id="mu-rueck" role="status">${s.rueck ? esc(s.rueck) : ''}</p>`;
    const erkl = s.erklaerung ? `<p class="erklaerung">${esc(s.erklaerung)}</p>` : '';
    const weiterKnopf = `<button type="button" class="knopf haupt" data-mu="weiter">${z.i + 1 < z.aufgaben.length ? 'Weiter' : 'Zum Rundenende'}</button>`;
    const weiter = s.fertig ? `<p class="knopfreihe">${weiterKnopf}</p>` : '';
    const knoepfe = (aktion, dis, mark) => a.antworten.map(x => `<button type="button" class="knopf antwort-knopf${mark && x.id === a.loesung ? ' ist-richtig' : ''}" data-mu="${aktion}" data-id="${x.id}"${dis ? ' disabled' : ''}>${esc(x.text)}</button>`).join('');
    let html = '';
    if (a.art === 'einordnen') {
      html = `<div class="wuerfi-aussage">${ctx.wuerfiKlein}<div><p class="nurvorlesen">Würfi sagt:</p><p class="aussage" id="mu-frage">${esc(a.satz)}</p></div></div>
        <h2 class="frage-klein">Wie wahrscheinlich ist das?</h2>
        <div class="skala skala--drei" role="group" aria-label="Antworten">
          ${a.antworten.map(x => `<button type="button" class="knopf skala-knopf skala-knopf--${x.id}${s.skalaRichtig && x.id === a.loesung ? ' ist-richtig' : ''}" data-mu="skala" data-id="${x.id}"${s.phase !== 'start' ? ' disabled' : ''}>${esc(x.text)}</button>`).join('')}
        </div>
        ${s.phase === 'begr' && !s.begrVersuche ? rueck : ''}${s.phase === 'begr' || s.begrGezeigt ? begrHtml(a, s) : ''}
        ${s.phase === 'begr' && !s.begrVersuche ? '' : rueck}${erkl}${weiter}`;
    } else if (a.art === 'vermuten') {
      const rest = a.zuege - s.gezogen;
      html = `<p class="auftrag">Erst vermuten, dann werfen.</p>
        <p class="aussage" id="mu-frage">Wir werfen ${a.zuege}-mal. Was kommt wohl öfter?</p>
        <div class="antworten" role="group" aria-label="Deine Vermutung">
          ${a.antworten.map(x => `<button type="button" class="knopf antwort-knopf" data-mu="vermuten" data-id="${x.id}" aria-pressed="${s.vermutung === x.id}"${s.phase !== 'start' ? ' disabled' : ''}>${esc(x.text)}</button>`).join('')}
        </div>
        ${s.phase === 'start' ? `<p class="knopfreihe"><button type="button" class="knopf haupt" data-mu="vermutung-fest"${s.vermutung ? '' : ' disabled'}>Ich bin fertig mit Vermuten</button></p>` : `
        <div class="ziehen">
          ${s.fertig ? `${rueck}${erkl}<p class="knopfreihe">${s.schatten || s.hundert ? '' : '<button type="button" class="knopf" data-mu="noch20">Noch einmal 20</button>'}${s.hundert ? '' : '<button type="button" class="knopf" data-mu="hundert">Jetzt 100-mal werfen</button>'}${weiterKnopf}</p>` : `<p class="knopfreihe">
            <button type="button" class="knopf haupt dreh-knopf" data-mu="werfen" data-n="1"${rest > 0 && !s.wirft ? '' : ' disabled'}>Werfen</button>
            ${rest === 1 ? '' : `<button type="button" class="knopf" data-mu="werfen" data-n="10"${rest > 0 && !s.wirft ? '' : ' disabled'}>${rest > 0 ? Math.min(10, rest) : 10}-mal werfen</button>`}
          </p>`}
          <p class="leise">${s.gezogen} von ${a.zuege}-mal geworfen</p>
          <h3 class="frage-klein">Strichliste</h3>
          ${strichliste(s.zaehlung)}
          <div class="diagramme${s.hundert ? ' diagramme--zwei' : ''}">
            <div class="diagramm" id="mu-diagramm"></div>
            ${s.hundert ? '<div class="diagramm" id="mu-diagramm-100"></div>' : ''}
          </div>
          ${s.hundert ? '<p>Vergleich die beiden Diagramme.</p>' : s.schatten ? '<p>Vergleich die beiden Male. Sind sie gleich?</p>' : ''}
        </div>`}
        ${s.fertig ? '' : rueck + erkl}`;
    } else if (a.art === 'dreimal') {
      html = `<div class="wuerfi-aussage">${ctx.wuerfiKlein}<div><p class="nurvorlesen">Würfi sagt:</p><p class="aussage" id="mu-frage">${esc(a.satz)}</p></div></div>
        <h2 class="frage-klein">${esc(a.frage)}</h2>
        <div class="antworten" role="group" aria-label="Antworten">${knoepfe('antwort', s.phase !== 'start', s.phase !== 'start')}</div>
        ${rueck}
        ${s.phase !== 'start' ? versuchHtml(a, s) : ''}
        ${erkl}${s.fertig ? `<p class="knopfreihe">${s.versuch ? '<button type="button" class="knopf" data-mu="versuch">Noch einmal 100</button>' : ''}${weiterKnopf}</p>` : ''}`;
    } else if (a.art === 'haelfte' || a.art === 'reihe') {
      html = `<div class="wuerfi-aussage">${ctx.wuerfiKlein}<div><p class="nurvorlesen">Würfi sagt:</p><p class="aussage" id="mu-frage">${esc(a.satz)}</p></div></div>
        <h2 class="frage-klein">${a.art === 'haelfte' ? 'Stimmt das?' : 'Kann das stimmen?'}</h2>
        <div class="antworten${a.art === 'reihe' ? ' antworten--zwei' : ''}" role="group" aria-label="Antworten">${knoepfe('antwort', s.phase !== 'start', s.phase !== 'start')}</div>
        ${rueck}
        ${a.art === 'haelfte' && s.phase !== 'start' ? versuchHtml(a, s) : ''}
        ${erkl}${weiter}`;
    } else if (a.art === 'zweiMuenzen') {
      html = `<p class="aussage" id="mu-frage">${esc(a.satz)}</p>
        <table class="wurf-gitter muenz-gitter">
          <caption class="nurvorlesen">Alle Möglichkeiten mit zwei Münzen. Zeilen: kleine Münze. Spalten: große Münze.</caption>
          <thead><tr><th scope="col"><span class="nurvorlesen">kleine Münze</span></th>${SEITEN.map(x => `<th scope="col">große: ${NAME[x]}</th>`).join('')}</tr></thead>
          <tbody>${SEITEN.map(k => `<tr><th scope="row">kleine: ${NAME[k]}</th>${SEITEN.map(g => { const id = `${k}+${g}`; return `<td><button type="button" class="knopf gitter-knopf muenz-gitter__knopf${s.fertig && a.loesung.includes(id) ? ' ist-richtig' : ''}" data-mu="gitter" data-id="${id}" aria-pressed="${s.wahl.includes(id)}" aria-label="Kleine Münze ${NAME[k]}, große Münze ${NAME[g]}"${s.fertig ? ' disabled' : ''}><span aria-hidden="true">${CB.muenze.zeichnen(k, { klein: true }).outerHTML}${CB.muenze.zeichnen(g, { klein: true }).outerHTML}</span></button></td>`; }).join('')}</tr>`).join('')}</tbody>
        </table>
        ${s.fertig ? '' : `<p class="knopfreihe"><button type="button" class="knopf haupt" data-mu="gitter-pruefen"${s.wahl.length ? '' : ' disabled'}>Prüfen</button></p>`}
        ${rueck}${erkl}${weiter}`;
    } else if (a.art === 'vergleichen') {
      html = `<p class="aussage" id="mu-frage">${esc(a.satz)}</p>
        <div class="antworten" role="group" aria-label="Antworten">${knoepfe('antwort', s.fertig, s.fertig)}</div>
        ${rueck}${erkl}${weiter}`;
    } else if (a.art === 'gerecht') {
      html = `<p class="aussage" id="mu-frage">${esc(a.satz)}</p>
        <div class="antworten" role="group" aria-label="Antworten">${knoepfe('antwort', s.fertig, s.fertig)}</div>
        ${rueck}${erkl}
        ${s.spiel ? `<p class="spiel-text">${esc(s.spiel.text)}</p>` : ''}
        ${s.fertig ? `<p class="knopfreihe">${s.spiel ? '' : `<button type="button" class="knopf" data-mu="spielen">${a.runden}-mal ausprobieren</button>`}${weiterKnopf}</p>` : ''}`;
    }
    ziel.innerHTML = html;
    T().nachZeichnen(ziel, s, a);
    if (a.art === 'vermuten' && s.phase !== 'start') {
      diagramm(ctx.app.querySelector('#mu-diagramm'), s.zaehlung, s.schatten, s.hundert ? `${a.zuege}-mal geworfen` : 'Geworfene Seiten');
      if (s.hundert) diagramm(ctx.app.querySelector('#mu-diagramm-100'), s.hundert, null, '100-mal geworfen');
    }
  }
  function versuchHtml(a, s) {
    if (!s.versuch) return `<p class="knopfreihe"><button type="button" class="knopf haupt" data-mu="versuch">Probieren wir es aus</button></p>`;
    if (a.art === 'dreimal') {
      const v = s.versuch, n = v.aus.stellen.length;
      return n ? `<p class="versuch-text">${n}-mal kam dreimal ${NAME[a.seite]} hintereinander. Danach kam ${v.aus.danach.kopf}-mal Kopf und ${v.aus.danach.zahl}-mal Zahl.</p><p>Mal kommt danach öfter Kopf, mal öfter Zahl. Probier es noch einmal.</p>`
        : `<p class="versuch-text">Diesmal kam dreimal ${NAME[a.seite]} gar nicht vor. Probier es noch einmal.</p>`;
    }
    const genau = s.versuch.filter(n => n === a.wuerfe / 2).length;
    return `<p class="versuch-text">Würfi hat 5-mal je ${a.wuerfe}-mal geworfen. Genau ${a.wuerfe / 2}-mal Kopf kam ${genau === 0 ? 'keinmal' : genau === 1 ? 'einmal' : genau + '-mal'}.</p>`;
  }
  function begrHtml(a, s) {
    return `
          <h2 class="frage-klein">Warum? Tippe den passenden Satz an.</h2>
          <div class="begruendungen" role="group" aria-label="Begründungen">
            ${a.begruendungen.map((b, i) => `<button type="button" class="knopf begr-knopf${s.begrRichtig && b.richtig ? ' ist-richtig' : ''}" data-mu="begr" data-i="${i}"${s.phase !== 'begr' ? ' disabled' : ''}>${esc(b.text)}</button>`).join('')}
          </div>`;
  }
  const strichliste = zaehlung => `<ul class="strichliste">${SEITEN.map(k => `<li><span class="strichliste__farbe strichliste__muenze">${CB.muenze.zeichnen(k, { klein: true }).outerHTML.replace('role="img"', 'aria-hidden="true"')}${NAME[k]}</span><span class="striche" aria-hidden="true">${T().striche(zaehlung[k] || 0)}</span><span class="nurvorlesen">${zaehlung[k] || 0} Striche</span></li>`).join('')}</ul>`;
  function diagramm(ort, werte, schatten, titel) {
    if (!ort) return;
    const d = CB.saeulen.zeichnen({ kategorien: KAT, werte, schatten, titel });
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

  /* Einordnen: Antwort, dann Begründung */
  function skalaGewaehlt(id) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'start') return;
    s.versuche++;
    const wort = id => a.antworten.find(x => x.id === id).text;
    if (id === a.loesung) { s.phase = 'begr'; s.skalaRichtig = true; s.zaehlt = true; s.rueck = `Das stimmt: ${wort(a.loesung)}.`; }
    else if (s.versuche === 1) s.rueck = 'Noch nicht ganz. Schau dir die zwei Seiten an. Wie viele passen zum Satz?';
    else { s.phase = 'begr'; s.skalaRichtig = true; s.zaehlt = false; s.rueck = `Hier ist die Lösung: ${wort(a.loesung)}. Jetzt such den passenden Satz dazu.`; }
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
    } else s.rueck = 'Noch nicht ganz. Zähl die Seiten, die zum Satz passen.';
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-mu="weiter"]' : '.begr-knopf');
  }

  /* Vermuten und Werfen */
  function vermutungWaehlen(id) { const s = aufgabe().zustand; if (s.phase !== 'start') return; s.vermutung = id; panel(); fokusAuf('[data-mu="vermutung-fest"]'); }
  function vermutungFest() {
    const a = aufgabe(), s = a.zustand;
    if (!s.vermutung) return;
    s.phase = 'werfen';
    s.rueck = `Deine Vermutung: ${a.antworten.find(x => x.id === s.vermutung).text.replace(/\.$/, '')}. Jetzt wirf.`;
    zeichneAufgabe(); fokusAuf('[data-mu="werfen"]');
  }
  function werfen(n) {
    const a = aufgabe(), s = a.zustand;
    if (s.wirft || s.gezogen >= a.zuege) return;
    s.letzteN = n;
    const anzahl = Math.min(n, a.zuege - s.gezogen);
    if (anzahl === 1) {
      const w = Z().wirf();   /* Ergebnis steht fest, bevor die Münze sich dreht */
      s.wirft = true; panel();
      const svg = ctx.app.querySelector('#mu-buehne .muenz-gross .muenze');
      CB.muenze.werfen([svg], [w]).then(() => {
        if (aufgabe() !== a) return;
        s.wirft = false; s.letztes = w; s.zaehlung[w] = (s.zaehlung[w] || 0) + 1; s.gezogen++;
        nachWerfen(a, s, `Geworfen: ${NAME[w]}.`);
      });
      return;
    }
    const neu = { kopf: 0, zahl: 0 };
    for (let i = 0; i < anzahl; i++) { const w = Z().wirf(); s.letztes = w; neu[w]++; s.zaehlung[w] = (s.zaehlung[w] || 0) + 1; }
    s.gezogen += anzahl;
    nachWerfen(a, s, `${anzahl}-mal geworfen. ${neu.kopf}-mal Kopf, ${neu.zahl}-mal Zahl.`);
  }
  function nachWerfen(a, s, ansage) {
    if (s.gezogen >= a.zuege && !s.ausgewertet) { vermutenAuswerten(a, s); ansage += ' ' + s.rueck + ' ' + (s.erklaerung || ''); }
    else s.rueck = ansage;
    zeichneAufgabe(); ctx.ansagen(ansage);
    fokusAuf(s.fertig ? '[data-mu="weiter"]' : ctx.app.querySelector(`[data-mu="werfen"][data-n="${s.letzteN}"]:not([disabled])`) ? `[data-mu="werfen"][data-n="${s.letzteN}"]` : '[data-mu="werfen"]:not([disabled])');
  }
  function vermutenAuswerten(a, s) {
    s.ausgewertet = true;
    const k = s.zaehlung.kopf || 0, zz = s.zaehlung.zahl || 0;
    const oben = k > zz ? 'kopf' : zz > k ? 'zahl' : null;
    const heute = oben ? `Heute kam ${NAME[oben]} öfter, ${Math.max(k, zz)}-mal.` : 'Heute kamen beide gleich oft.';
    const passt = A().vermutungPasst(a, s.vermutung);
    if (passt) s.rueck = `Genau. Die Münze hat zwei Seiten. Beide haben die gleiche Chance. ${heute}${oben ? ' Das ist Zufall.' : ''}`;
    else s.rueck = `${NAME[s.vermutung]} ist nur eine von zwei Seiten, genau wie ${NAME[s.vermutung === 'kopf' ? 'zahl' : 'kopf']}. Darum haben beide die gleiche Chance. Mein Kopf auf der Münze bringt kein Glück.` +
      (oben === s.vermutung ? ` Heute kam ${NAME[oben]} öfter. Das war Zufall.` : '');
    s.erklaerung = `Das ist passiert: Kopf ${k}-mal, Zahl ${zz}-mal.`;
    if (!s.fertig) fertig(a, passt);
    s.fertig = true;
  }
  function noch20() {
    const a = aufgabe(), s = a.zustand;
    if (s.schatten) return;
    s.schatten = s.zaehlung;
    s.zaehlung = { kopf: 0, zahl: 0 };
    for (let i = 0; i < a.zuege; i++) { const w = Z().wirf(); s.zaehlung[w]++; s.letztes = w; }
    zeichneAufgabe();
    ctx.ansagen(`Noch einmal 20-mal geworfen: ${s.zaehlung.kopf}-mal Kopf, ${s.zaehlung.zahl}-mal Zahl. Die alten Säulen sind blass daneben.`);
    fokusAuf('[data-mu="weiter"]');
  }
  function hundert() {
    const s = aufgabe().zustand;
    if (s.hundert) return;
    s.hundert = { kopf: 0, zahl: 0 };
    for (let i = 0; i < 100; i++) { const w = Z().wirf(); s.hundert[w]++; s.letztes = w; }
    zeichneAufgabe();
    ctx.ansagen(`100-mal geworfen: ${s.hundert.kopf}-mal Kopf, ${s.hundert.zahl}-mal Zahl. Vergleich die beiden Diagramme.`);
    fokusAuf('[data-mu="weiter"]');
  }

  /* Antworten: dreimal (eine Vermutung, ohne zweiten Versuch), haelfte, reihe, vergleichen, gerecht (zwei Versuche) */
  const RUECK_DREIMAL = {
    gleich: 'Genau. Die Münze weiß nicht, was vorher kam. Bei jedem Wurf haben beide Seiten die gleiche Chance.',
    andere: a => `Das denken viele. Aber die Münze weiß nicht, was vorher kam. ${NAME[a.seite === 'kopf' ? 'zahl' : 'kopf']} ist nicht dran. Beide Seiten haben wieder die gleiche Chance.`,
    gleiche: a => `${NAME[a.seite]} ist nicht stärker geworden. Die Münze weiß nicht, was vorher kam. Beide Seiten haben wieder die gleiche Chance.`
  };
  function antwort(id) {
    const a = aufgabe(), s = a.zustand;
    if (a.art === 'dreimal') {
      if (s.phase !== 'start') return;
      s.phase = 'versuch'; s.wahlId = id;
      s.rueck = typeof RUECK_DREIMAL[id] === 'function' ? RUECK_DREIMAL[id](a) : RUECK_DREIMAL[id];
      s.zaehlt = id === a.loesung;
      zeichneAufgabe(); ctx.ansagen(s.rueck + ' Probier es jetzt aus.');
      fokusAuf('[data-mu="versuch"]');
      return;
    }
    if (a.art === 'haelfte' ? s.phase !== 'start' : s.fertig) return;
    s.versuche++;
    const richtig = id === a.loesung;
    if (richtig || s.versuche >= 2) {
      s.rueck = richtig ? (a.art === 'gerecht' || a.art === 'vergleichen' ? 'Das stimmt.' : 'Gut geprüft.') : a.art === 'haelfte' ? 'Hier ist die Lösung: Das ist nicht sicher.' : 'Hier ist die Lösung:';
      if (a.art === 'haelfte') { s.phase = 'versuch'; s.antwortOk = richtig; }
      else { s.erklaerung = a.erklaerung; fertig(a, richtig); }
    } else s.rueck = a.art === 'gerecht' ? 'Noch nicht ganz. Zähl die Möglichkeiten für Würfi und für dich.'
      : a.art === 'vergleichen' ? 'Noch nicht ganz. Zähl die Möglichkeiten im Kopf: kleine Münze und große Münze.'
      : a.art === 'haelfte' ? 'Noch nicht ganz. Muss es genau so kommen?'
      : 'Noch nicht ganz. Weiß die Münze, was vorher kam?';
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-mu="spielen"], [data-mu="weiter"]' : a.art === 'haelfte' && s.phase === 'versuch' ? '[data-mu="versuch"]' : '.antwort-knopf:not([disabled])');
  }
  /* Probieren wir es aus (dreimal: 100 Würfe auszählen; haelfte: 5 Serien) – Pflicht vor „Weiter“, wird nie bewertet */
  function versuch() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase === 'start') return;
    if (a.art === 'dreimal') {
      const wuerfe = Array.from({ length: a.versuche }, () => Z().wirf());
      s.versuch = { wuerfe, aus: A().auszaehlen(wuerfe, a.seite, a.laenge) };
      if (!s.fertig) { s.erklaerung = ''; fertig(a, s.zaehlt); }
      const n = s.versuch.aus.stellen.length;
      ctx.ansagen(n ? `${n}-mal kam dreimal ${NAME[a.seite]}. Danach ${s.versuch.aus.danach.kopf}-mal Kopf und ${s.versuch.aus.danach.zahl}-mal Zahl.` : `Diesmal kam dreimal ${NAME[a.seite]} gar nicht vor.`);
    } else if (a.art === 'haelfte') {
      if (s.versuch) return;
      s.versuch = Array.from({ length: a.serien }, () => { let k = 0; for (let i = 0; i < a.wuerfe; i++) if (Z().wirf() === 'kopf') k++; return k; });
      s.erklaerung = a.erklaerung;
      fertig(a, s.antwortOk);
      ctx.ansagen(`Würfi hat 5-mal je ${a.wuerfe}-mal geworfen: ${s.versuch.map(n => n + '-mal Kopf').join(', ')}. ${a.erklaerung}`);
    }
    zeichneAufgabe();
    fokusAuf('[data-mu="weiter"]');
  }

  /* Zwei Münzen: Felder antippen */
  function gitterTippen(id) {
    const s = aufgabe().zustand;
    if (s.fertig) return;
    s.wahl = s.wahl.includes(id) ? s.wahl.filter(x => x !== id) : s.wahl.concat(id);
    panel(); fokusAuf(`[data-mu="gitter"][data-id="${id}"]`);
  }
  function gitterPruefen() {
    const a = aufgabe(), s = a.zustand;
    if (!s.wahl.length || s.fertig) return;
    s.versuche++;
    if (a.pruefe(s.wahl)) { s.rueck = 'Genau.'; s.erklaerung = a.erklaerung; fertig(a, s.versuche <= 2); }
    else if (s.versuche < 2) {
      const falsch = s.wahl.find(x => !a.loesung.includes(x));
      s.rueck = falsch ? `Bei ${falsch.split('+').map(x => NAME[x]).join(' und ')} passt es nicht. Schau noch einmal.` : 'Es fehlt noch etwas. Die kleine und die große Münze sind verschieden.';
    } else { s.rueck = 'Hier ist die Lösung:'; s.erklaerung = a.erklaerung; s.wahl = a.loesung.slice(); fertig(a, false); }
    zeichneAufgabe(); melde(s);
    fokusAuf(s.fertig ? '[data-mu="weiter"]' : '[data-mu="gitter-pruefen"]');
  }

  /* Gerecht: freiwillig 20-mal ausprobieren, nur Striche, keine Wertung */
  function spielen() {
    const a = aufgabe(), s = a.zustand;
    if (s.spiel) return;
    const sp = { wuerfi: 0, kind: 0 };
    for (let i = 0; i < a.runden; i++) {
      const x = a.raum.length === 2 ? Z().wirf() : a.raum.length === 6 ? Z().wuerfle(1)[0] : `${Z().wirf()}+${Z().wirf()}`;
      if (a.passtWuerfi(x)) sp.wuerfi++; else if (a.passtKind(x)) sp.kind++;
    }
    sp.text = `Würfi hat ${sp.wuerfi}-mal angefangen, du ${sp.kind}-mal.` +
      (a.loesung === 'wuerfi' && sp.kind > sp.wuerfi ? ' Diesmal hast du öfter einen Strich bekommen. Trotzdem hat Würfi die größere Chance.' : '') +
      (a.loesung === 'kind' && sp.wuerfi > sp.kind ? ' Diesmal hat Würfi öfter einen Strich bekommen. Trotzdem hast du die größere Chance.' : '') +
      (a.loesung === 'fair' ? ' Beide haben die gleiche Chance. Wer öfter einen Strich bekommt, ist Zufall.' : '');
    s.spiel = sp;
    zeichneAufgabe(); ctx.ansagen(sp.text);
    fokusAuf('[data-mu="weiter"]');
  }

  function weiter() {
    if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); return; }
    const r = T().rundenende(ctx, { id: ID, praefix: P, stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    ctx.zeigen(`${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}${r.html}<p class="knopfreihe knopfreihe--mitte">${TISCH_KNOPF}</p>${AM_TISCH(false)}`, 'Rundenende – Münzwurf');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  /* ---------- Mit echtem Wurf vergleichen (nicht gespeichert, zählt nicht) ---------- */
  function tischStarten() {
    z = null;
    tisch = { wuerfe: [], geraet: null };
    tischZeigen();
    fokusAuf('[data-mu="tisch-wurf"][data-seite="kopf"]');
  }
  function tischZeigen() {
    const t = tisch, n = t.wuerfe.length, voll = n >= TISCH_WUERFE;
    const zaehl = l => ({ kopf: l.filter(x => x === 'kopf').length, zahl: l.filter(x => x === 'zahl').length });
    ctx.zeigen(`
      ${kopf('Mit echtem Wurf vergleichen')}
      <section class="papier tisch" aria-labelledby="mu-tisch-frage">
        <div class="wuerfi-aussage">${ctx.wuerfiKlein}<div><p class="nurvorlesen">Würfi sagt:</p><p class="aussage" id="mu-tisch-frage">Nimm einen Spielchip mit zwei Seiten. Wirf ihn ${TISCH_WUERFE}-mal. Tippe nach jedem Wurf, was oben liegt.</p></div></div>
        <p>Die Seite mit dem Zeichen ist Kopf.</p>
        <p class="knopfreihe">
          <button type="button" class="knopf haupt dreh-knopf" data-mu="tisch-wurf" data-seite="kopf"${voll ? ' disabled' : ''}>Kopf</button>
          <button type="button" class="knopf haupt dreh-knopf" data-mu="tisch-wurf" data-seite="zahl"${voll ? ' disabled' : ''}>Zahl</button>
          <button type="button" class="knopf" data-mu="tisch-loeschen"${n && !t.geraet ? '' : ' disabled'}>Letzten Wurf löschen</button>
        </p>
        <p class="leise">${n} von ${TISCH_WUERFE} Würfen eingetippt</p>
        <h2 class="frage-klein">Dein Chip</h2>
        ${strichliste(zaehl(t.wuerfe))}
        ${voll && !t.geraet ? '<p class="knopfreihe"><button type="button" class="knopf haupt" data-mu="tisch-geraet">Jetzt wirft das Gerät 20-mal</button></p>' : ''}
        ${t.geraet ? `<div class="diagramme diagramme--zwei"><div class="diagramm" id="mu-tisch-chip"></div><div class="diagramm" id="mu-tisch-geraet"></div></div>
          <p class="aussage">Sehen die beiden ähnlich aus?</p>
          <p>Beide sind Zufall. Sie sind fast nie genau gleich.</p>` : ''}
        <p class="leise">Deine Würfe werden nicht gespeichert.</p>
        <p class="knopfreihe">${t.geraet ? '<button type="button" class="knopf" data-mu="tisch">Noch einmal</button>' : ''}<button type="button" class="knopf" data-mu="stufen">Zur Stufenwahl</button></p>
      </section>`, 'Mit echtem Wurf vergleichen – Münzwurf');
    if (t.geraet) {
      diagramm(ctx.app.querySelector('#mu-tisch-chip'), zaehl(t.wuerfe), null, 'Dein Chip');
      diagramm(ctx.app.querySelector('#mu-tisch-geraet'), zaehl(t.geraet), null, 'Gerät');
    }
  }
  function tischWurf(seite) {
    if (!tisch || tisch.wuerfe.length >= TISCH_WUERFE) return;
    tisch.wuerfe.push(seite);
    tischZeigen();
    ctx.ansagen(`${NAME[seite]} eingetippt. ${tisch.wuerfe.length} von ${TISCH_WUERFE}.`);
    fokusAuf(tisch.wuerfe.length >= TISCH_WUERFE ? '[data-mu="tisch-geraet"]' : `[data-mu="tisch-wurf"][data-seite="${seite}"]`);
  }
  function tischLoeschen() {
    if (!tisch || !tisch.wuerfe.length || tisch.geraet) return;
    tisch.wuerfe.pop(); tischZeigen();
    ctx.ansagen(`Letzten Wurf gelöscht. ${tisch.wuerfe.length} von ${TISCH_WUERFE}.`);
    fokusAuf('[data-mu="tisch-loeschen"]:not([disabled]), [data-mu="tisch-wurf"]');
  }
  function tischGeraet() {
    if (!tisch || tisch.wuerfe.length < TISCH_WUERFE || tisch.geraet) return;
    tisch.geraet = Array.from({ length: TISCH_WUERFE }, () => Z().wirf());
    tischZeigen();
    const k = tisch.geraet.filter(x => x === 'kopf').length;
    ctx.ansagen(`Das Gerät hat 20-mal geworfen: ${k}-mal Kopf, ${TISCH_WUERFE - k}-mal Zahl. Sehen die beiden ähnlich aus?`);
    fokusAuf('[data-mu="tisch"]');
  }

  /* ---------- Hilfe ---------- */
  const TIPPS = {
    einordnen: ['Wie viele Seiten hat die Münze?', 'Wie viele Seiten passen zum Satz?', 'Ich zeige dir die zwei Seiten größer.'],
    vermuten: ['Wie viele Seiten hat die Münze?', 'Ist eine Seite größer als die andere?'],
    dreimal: ['Weiß die Münze, was vorher kam?', 'Hat sich an der Münze etwas verändert?'],
    haelfte: ['Muss es genau so kommen, oder kann es auch anders kommen?', 'Probier es aus und schau die Zeilen an.'],
    reihe: ['Macht die Münze ein Muster?', 'Weiß die Münze, was vorher kam?'],
    zweiMuenzen: ['Die kleine Münze kann Kopf oder Zahl zeigen. Die große auch.', 'Kopf und Zahl sowie Zahl und Kopf sind zwei Möglichkeiten.'],
    vergleichen: ['Die kleine Münze kann Kopf oder Zahl zeigen. Die große auch.', 'Zähl die Möglichkeiten für beide Antworten.'],
    gerecht: ['Zähl die Seiten oder Möglichkeiten für Würfi.', 'Zähl dann für dich. Gerecht heißt: gleich viele.']
  };
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) {
      const text = tisch ? 'Wirf deinen Chip und tippe, was oben liegt. Am Ende vergleichst du mit dem Gerät.' : 'Wähle eine Stufe. Ich empfehle dir die Stufe mit dem Wort „empfohlen“.';
      T().dialog(ctx, { titel: 'Tipp von Würfi', inhalt: `<div class="tipp">${ctx.wuerfiKlein}<p>${esc(text)}</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' });
      return;
    }
    const s = a.zustand, liste = TIPPS[a.art];
    const erlaubt = liste.length >= 3 && !s.versuche ? liste.length - 1 : liste.length;
    const bis = Math.min(hilfeStufe, erlaubt - 1);
    if (a.art === 'einordnen' && bis >= 2 && !s.gross && !s.fertig) { s.gross = true; buehne(); }
    T().tippDialog(ctx, { liste, bis, erlaubt, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }

  /* ---------- Bedienung ---------- */
  function bedienen(e) {
    const b = e.target.closest('[data-mu]');
    if (!b || b.disabled) return false;
    const w = b.dataset.mu;
    if (w === 'stufe') rundeStarten(b.dataset.stufe);
    else if (w === 'stufen') ansichtStufen();
    else if (w === 'hilfe') hilfeZeigen();
    else if (w === 'woerter') T().woerter(ctx, WOERTER_EXTRA);
    else if (w === 'skala') skalaGewaehlt(b.dataset.id);
    else if (w === 'begr') begruendungGewaehlt(Number(b.dataset.i));
    else if (w === 'vermuten') vermutungWaehlen(b.dataset.id);
    else if (w === 'vermutung-fest') vermutungFest();
    else if (w === 'werfen') werfen(Number(b.dataset.n));
    else if (w === 'noch20') noch20();
    else if (w === 'hundert') hundert();
    else if (w === 'antwort') antwort(b.dataset.id);
    else if (w === 'versuch') versuch();
    else if (w === 'gitter') gitterTippen(b.dataset.id);
    else if (w === 'gitter-pruefen') gitterPruefen();
    else if (w === 'spielen') spielen();
    else if (w === 'tisch') tischStarten();
    else if (w === 'tisch-wurf') tischWurf(b.dataset.seite);
    else if (w === 'tisch-loeschen') tischLoeschen();
    else if (w === 'tisch-geraet') tischGeraet();
    else if (w === 'weiter') weiter();
    else return false;
    return true;
  }

  CB.stationen[ID] = { stempelSvg,
    id: ID,
    oeffnen(c) { ctx = c; ansichtStufen(); },
    bedienen, aufgabe, zustand: () => z, tisch: () => tisch,
    /* nur für den Test der Fachregel „Vermutung, nicht Ausgang“ */
    _vermutungBewerten(vermutung, zaehlung) {
      const a = A().vermuten('leicht');
      const s = { vermutung, zaehlung, fertig: true };
      vermutenAuswerten(a, s);
      return { rueck: s.rueck, passt: A().vermutungPasst(a, vermutung) };
    }
  };
})();
