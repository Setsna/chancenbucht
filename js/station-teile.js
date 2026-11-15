/* Chancenbucht: gemeinsame Teile der Stationen (Etappe 3c).
   Klassisches Skript, legt window.CB.teile an. Genutzt von Fühlkiste und Glücksrad, später auch Würfeln und Münze.
   Enthält nur Darstellung und Bedienhilfen, keine Fachlogik:
   Kopf, Stufenwahl, Rundenende mit Stempel, Dialog (Hilfe, Wörter), Kugel-Symbol, Strichliste, Säulendiagramm, Fokus.
   Regeln wie in den Stationen: echte Knöpfe, Fokus in Dialoge hinein und zurück, keine style-Attribute, Texte durch esc(). */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const C = () => CB.config;
  const F = id => C().farben.find(f => f.id === id);
  const ST = () => CB.stand;
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };

  const PFEIL = '<button type="button" class="pfeil-knopf" data-aktion="start" aria-label="Zurück zur Startseite"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg></button>';

  /* Kleine Kugel (Farbe und Muster) für Knöpfe und Strichlisten */
  function kugelSymbol(id) {
    const f = F(id);
    return `<svg class="kugel-symbol" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle class="kugel__grund k-${id}" cx="20" cy="20" r="16"/>${f && f.muster ? `<circle class="kugel__muster m-${f.muster}" cx="20" cy="20" r="16"/>` : ''}<ellipse class="kugel__glanz" cx="14" cy="13" rx="5" ry="3.5"/><circle class="kugel__rand" cx="20" cy="20" r="16"/></svg>`;
  }

  /* Kopf einer Station: Zurück, h1, Unterzeile, Wörter, Hilfe. praefix = data-Attribut der Station (fk, gr …) */
  function kopf(ctx, { titel, unterzeile, praefix }) {
    return `<header class="kopf kopf--station">
        <div class="kopf__reihe">
          ${PFEIL}
          <div class="kopf__mitte">
            <h1>${ctx.esc(titel)}</h1>
            ${unterzeile ? `<p class="unterzeile">${ctx.esc(unterzeile).replace(/(Aufgabe \d+ von \d+)/, '<span class="zusammen">$1</span>')}</p>` : ''}
          </div>
          <div class="kopf__werkzeug">
            <button type="button" class="knopf glas-knopf werkzeug-knopf" data-${praefix}="woerter" aria-haspopup="dialog">Wörter</button>
            <button type="button" class="knopf glas-knopf werkzeug-knopf hilfe-knopf" data-${praefix}="hilfe" aria-haspopup="dialog">${ctx.wuerfiKlein}<span>Hilfe</span></button>
          </div>
        </div>
      </header>`;
  }

  /* Aufklapper (So geht's, Am Tisch) */
  function aufklapper(ctx, { klasse, titel, schritte, notiz, offen }) {
    return `
      <details class="papier ${klasse}"${offen ? ' open' : ''}>
        <summary><h2>${ctx.esc(titel)}</h2></summary>
        <ol>${schritte.map(s => `<li>${ctx.esc(s)}</li>`).join('')}</ol>
        ${notiz ? `<p class="leise">${ctx.esc(notiz)}</p>` : ''}
      </details>`;
  }

  /* Stufenwahl: Empfehlung = erste Stufe ohne Stempel */
  const empfohlen = id => C().stufen.find(st => !ST().hatStempel(id, st)) || 'knifflig';
  const erstesMal = id => C().stufen.every(st => !ST().runden(id, st));
  function stufenListe(ctx, id, praefix) {
    const emp = empfohlen(id);
    return `
      <section class="papier" aria-labelledby="h-stufe">
        <h2 id="h-stufe">Wähle eine Stufe</h2>
        <ul class="stufen-liste">
          ${C().stufen.map(st => `
            <li><button type="button" class="knopf stufe-knopf${st === emp ? ' stufe-knopf--empfohlen' : ''}" data-${praefix}="stufe" data-stufe="${st}">
              <span class="stufe-knopf__name">${ctx.esc(STUFENNAME[st])}</span>
              <span class="stufe-knopf__info">${ST().hatStempel(id, st) ? '<span class="stempel-punkt stempel-punkt--voll" aria-hidden="true"></span> Stempel geschafft' : '<span class="stempel-punkt" aria-hidden="true"></span> Noch kein Stempel'}${st === emp ? ' · empfohlen' : ''}</span>
            </button></li>`).join('')}
        </ul>
      </section>`;
  }

  /* Rundenende: Stempel geben (ab stempelAb geschafften), Text, Knöpfe. Gibt { html, text, fehler } zurück. */
  function rundenende(ctx, { id, praefix, stufe, geschafft, anzahl, stempelSvg, gespeichertFehler }) {
    const ab = C().fuehlkiste.stempelAb;
    const hatteSchon = ST().hatStempel(id, stufe);
    let neu = false, fehler = gespeichertFehler;
    if (geschafft >= ab && !hatteSchon) {
      if (!ST().istVorschau && ST().stempelGeben(id, stufe) === false) fehler = true;
      neu = true;
    }
    const naechste = C().stufen[C().stufen.indexOf(stufe) + 1];
    let text;
    if (geschafft >= ab && neu) text = `Runde geschafft. Du bekommst einen Stempel für die Stufe ${STUFENNAME[stufe]}.`;
    else if (geschafft >= ab) text = 'Runde geschafft. Diesen Stempel hast du schon. Jede Runde übt trotzdem.';
    else text = `Du hast ${geschafft} von ${anzahl} geschafft. Für den Stempel brauchst du ${ab}. Probier noch eine Runde, die Aufgaben sind dann neu.`;
    const weiter = naechste && geschafft >= ab;
    /* B13: Das Rundenende ist der Höhepunkt: großer Stempel auf Papier im Glasfeld, Würfi daneben, ein Hauptknopf */
    const haupt = weiter ? { stufe: naechste, text: `Weiter mit ${STUFENNAME[naechste]}` } : { stufe, text: `Noch eine Runde ${STUFENNAME[stufe]}` };
    const html = `
      <section class="rundenende${geschafft >= ab ? ' rundenende--geschafft' : ''}" aria-labelledby="h-ende">
        <h2 id="h-ende" class="nurvorlesen">Rundenende</h2>
        <div class="stempel-gross${geschafft >= ab || hatteSchon ? ' stempel-gross--voll' : ''}${neu ? ' stempel-gross--neu' : ''}" aria-hidden="true">${stempelSvg}</div>
        <div class="rundenende__satz">${ctx.wuerfiKlein}<p class="rundenende__text">${ctx.esc(text)}</p></div>
        <p class="knopfreihe knopfreihe--mitte">
          <button type="button" class="knopf haupt rundenende__haupt" data-${praefix}="stufe" data-stufe="${haupt.stufe}">${ctx.esc(haupt.text)}</button>
        </p>
        <p class="knopfreihe knopfreihe--mitte rundenende__weitere">
          ${weiter ? `<button type="button" class="knopf knopf--klein" data-${praefix}="stufe" data-stufe="${stufe}">Noch eine Runde ${ctx.esc(STUFENNAME[stufe])}</button>` : ''}
          <button type="button" class="knopf knopf--klein" data-${praefix}="stufen">Andere Stufe</button>
          <button type="button" class="knopf knopf--klein" data-aktion="start">Zur Startseite</button>
        </p>
      </section>`;
    return { html, text, fehler };
  }
  /* Stempelrahmen (Doppelkreis) um ein eigenes Motiv */
  const stempel = motiv => `<svg class="stempel-bild" viewBox="0 0 100 100" focusable="false"><circle class="stempel__rand" cx="50" cy="50" r="44"/><circle class="stempel__rand stempel__rand--innen" cx="50" cy="50" r="36"/>${motiv}</svg>`;

  /* ---------- Dialog (ein gemeinsamer <dialog>) ---------- */
  let opener = null, beiTipp = null;
  function dialog(ctx, { titel, inhalt, knoepfe, tipp }) {
    let d = document.getElementById('station-dialog');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'station-dialog';
      d.className = 'dialog';
      d.setAttribute('aria-labelledby', 'station-dialog-titel');
      document.body.appendChild(d);
      d.addEventListener('close', () => { if (opener && document.contains(opener)) opener.focus(); opener = null; });
      d.addEventListener('click', e => {
        const b = e.target.closest('[data-dialog]');
        if (!b) return;
        if (b.dataset.dialog === 'zu') d.close();
        if (b.dataset.dialog === 'tipp' && beiTipp) beiTipp();
      });
    }
    beiTipp = tipp || null;
    d.innerHTML = `<h2 id="station-dialog-titel">${ctx.esc(titel)}</h2>${inhalt}<p class="knopfreihe">${knoepfe}</p>`;
    if (!d.open) { opener = document.activeElement; d.showModal(); }
    const erster = d.querySelector('[data-dialog="tipp"]:not([disabled]), [data-dialog="zu"]');
    if (erster) erster.focus();
    return d;
  }
  /* Gestufte Tipps. liste: alle Tipps, bis: Index des letzten gezeigten, erlaubt: wie viele gerade erlaubt sind */
  function tippDialog(ctx, { liste, bis, erlaubt, fertig, weiter }) {
    const zu = '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>';
    if (fertig) return dialog(ctx, { titel: 'Tipp von Würfi', inhalt: `<div class="tipp">${ctx.wuerfiKlein}<p>Du hast es schon geschafft. Tippe auf Weiter.</p></div>`, knoepfe: zu });
    const mehr = bis < erlaubt - 1;
    const wartet = !mehr && erlaubt < liste.length;
    return dialog(ctx, {
      titel: 'Tipp von Würfi',
      inhalt: `<div class="tipp">${ctx.wuerfiKlein}<ol class="tipp-liste">${liste.slice(0, bis + 1).map(t => `<li>${ctx.esc(t)}</li>`).join('')}</ol></div>${wartet ? '<p class="leise">Probier es einmal. Danach habe ich noch einen Tipp.</p>' : ''}`,
      knoepfe: `${mehr ? '<button type="button" class="knopf" data-dialog="tipp">Noch ein Tipp</button>' : ''}${zu}`,
      tipp: weiter
    });
  }
  /* Wortspeicher mit Füllstand-Zeichen; extra: weitere Zeilen [[Wort, Bedeutung]] (z. B. „hat die größere Chance“) */
  function woerter(ctx, extra = []) {
    const E = CB.einordnung;
    return dialog(ctx, {
      titel: 'Wörter: die Wahrscheinlichkeitsskala',
      inhalt: `
      <div class="wortspeicher">
        <table class="wortspeicher__tabelle">
          <tbody>
            ${['sicher', 'wahrscheinlich', 'unwahrscheinlich', 'unmoeglich'].map(w => `<tr class="ws-${w}"><th scope="row">${ctx.esc(E.wort(w))}</th><td>${ctx.esc(E.BEDEUTUNG[w])}</td></tr>`).join('')}
            ${extra.map(([w, b]) => `<tr class="ws-extra"><th scope="row">${ctx.esc(w)}</th><td>${ctx.esc(b)}</td></tr>`).join('')}
          </tbody>
        </table>
        <p class="wortspeicher__moeglich"><b>möglich</b> heißt: Es kann passieren. Dazu gehören wahrscheinlich und unwahrscheinlich.</p>
      </div>`,
      knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Schließen</button>'
    });
  }

  /* ---------- Strichliste und Diagramm ---------- */
  function striche(n) {
    let html = '';
    for (let i = 0; i < Math.floor(n / 5); i++) html += '<span class="fuenfer">||||</span>';
    return html + (n % 5 ? `<span class="einzel">${'|'.repeat(n % 5)}</span>` : '');
  }
  function strichliste(ctx, farben, zaehlung) {
    return `<ul class="strichliste">
          ${farben.map(id => `<li><span class="strichliste__farbe">${kugelSymbol(id)}${ctx.esc(F(id).name)}</span><span class="striche" aria-hidden="true">${striche(zaehlung[id] || 0)}</span><span class="nurvorlesen">${zaehlung[id] || 0} Striche</span></li>`).join('')}
        </ul>`;
  }
  function diagramm(ort, farben, zaehlung, schatten, titel) {
    if (!ort) return;
    const d = CB.saeulen.zeichnen({ kategorien: farben.map(id => ({ id, name: F(id).name, farbe: id })), werte: zaehlung, schatten, titel });
    ort.textContent = '';
    ort.appendChild(d.svg);
    ort.appendChild(d.tabelle);
  }

  function fokus(ctx, sel) {
    const el = ctx.app.querySelector(sel);
    if (el && !el.disabled) el.focus({ preventScroll: false });
  }

  /* Nach jedem Zeichnen einer Aufgabe (Etappe 6b):
     - „Lösung gezeigt“ sieht anders aus als „richtig gelöst“ (Klasse loesung-gezeigt am Aufgabenblatt, A8).
     - Bei einer richtigen Antwort leuchtet der richtige Knopf einmal ruhig auf (B16): nur transform, kurz,
       nicht bei reduzierter Bewegung, je Rückmeldung nur einmal. */
  const RICHTIG = /^(Das stimmt[.:]|Genau\.|Gut geprüft\.|Deine Vermutung passt)/;
  function nachZeichnen(ziel, s, a) {
    if (!ziel || !s) return;
    /* A6: Während eine Versuchsreihe läuft (Vermuten, verdeckte Kiste), bleibt die Bühne im Hochformat oben stehen */
    const flaeche = ziel.closest('.station-flaeche');
    if (flaeche) flaeche.classList.toggle('flaeche--versuch', !!(a && a.zuege && s.phase && s.phase !== 'start'));
    const loesung = s.skalaGeschafft === false || s.zaehlt === false || s.antwortOk === false
      || (s.fertig && !s.geschafft) || (s.antwortRichtig && !s.geschafft && s.zaehlt !== true);
    ziel.classList.toggle('loesung-gezeigt', !!loesung);
    if (!s.rueck || s.rueck === s._geleuchtet || !RICHTIG.test(s.rueck)) return;
    s._geleuchtet = s.rueck;
    const ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = [...ziel.querySelectorAll('.ist-richtig')].pop() || ziel.querySelector('.rueckmeldung');
    if (el && !ruhig && typeof el.animate === 'function') {
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.045)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' });
    }
  }

  CB.teile = { nachZeichnen, PFEIL, STUFENNAME, kugelSymbol, kopf, aufklapper, empfohlen, erstesMal, stufenListe, rundenende, stempel, dialog, tippDialog, woerter, striche, strichliste, diagramm, fokus };
})();
