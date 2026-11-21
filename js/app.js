/* Chancenbucht: Ansichten und Bedienung.
   Etappe 1a: Anmeldung mit dem Code, Startseite mit den Stationen (alle „bald“), Abmelden, Erwachsenenbereich.
   Vorbild für die Anmeldung: Flaschenpost js/app.js (Konto-Umbau, 14.11.2026).
   Sicherheit: Fremde Werte (Vorname, Stand, Adresse) kommen nie ungeprüft in innerHTML.
   Feste Texte laufen durch esc(), der Vorname wird mit textContent gesetzt. */
(() => {
  'use strict';
  const CB = window.CB;
  const C = CB.config;
  const ST = CB.stand;
  const S = ST.S;
  const cloud = ST.cloud;

  const app = document.getElementById('app');
  const meldung = document.getElementById('meldung');
  const live = document.getElementById('live');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  CB.esc = esc;

  /* Sichtbare Meldung unten, wird von Screenreadern angesagt (role=status). */
  let meldungUhr = 0;
  function melden(text) {
    clearTimeout(meldungUhr);
    meldung.textContent = '';
    if (!text) return;
    setTimeout(() => { meldung.textContent = text; }, 30);
    if (text.length < 80) meldungUhr = setTimeout(() => { meldung.textContent = ''; }, 9000);
  }
  /* Nur für Screenreader: Ergebnis jedes Versuchs („Gezogen: blaue Kugel“) */
  function ansagen(text) {
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 30);
  }
  CB.melden = melden;
  CB.ansagen = ansagen;

  const SPEICHER_FEHLT = 'Dein Stand konnte gerade nicht gespeichert werden. Vielleicht ist der Speicher voll oder ausgeschaltet. Bitte sag deiner Lehrkraft Bescheid.';
  const LADEN_FEHLT = 'Der gespeicherte Stand auf diesem Gerät konnte nicht gelesen werden. Damit nichts verloren geht, speichert die Seite gerade nichts. Bitte sag deiner Lehrkraft Bescheid.';
  const MOMENT = 'Einen Moment …';

  /* ---------- Ansichten ---------- */
  let ersterAufruf = true;
  let ansicht = '';
  function zeigen(html, titel) {
    melden('');
    app.innerHTML = html;
    document.title = titel ? `${titel} – ${C.name}` : C.name;
    const h1 = app.querySelector('h1');
    if (h1 && !ersterAufruf) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
    ersterAufruf = false;
    window.scrollTo(0, 0);
  }

  const WELLE = '<svg class="welle" viewBox="0 0 62 14" aria-hidden="true" focusable="false"><path d="M2 5c5-4 9-4 14 0s9 4 14 0 9-4 14 0 9 4 14 0M10 11c4-3 8-3 12 0s8 3 12 0 8-3 12 0" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const WUERFI = `<picture><source srcset="bilder/wuerfi-512.webp?b=${C.bildStand}" type="image/webp"><img class="wuerfi" src="bilder/wuerfi-512.jpg?b=${C.bildStand}" alt="Würfi, ein blauer Kofferfisch mit hellem Wabenmuster, schwimmt über dem Sand. Vor ihm liegen vier Murmeln." width="512" height="512"></picture>`;
  function kopf(titel, mitWuerfi = false) {
    return `<header class="kopf">
        <p class="wortmarke">${esc(C.name)}${WELLE}</p>
        <h1>${titel}</h1>
        ${mitWuerfi ? WUERFI : ''}
      </header>`;
  }

  /* Ergebnis von cloud.anmelden() oder cloud.start() anzeigen */
  function nachAnmelden(r) {
    if (!r.ok && r.zu) { ansichtZu(); return; }
    if (!r.ok) {
      if (ansicht === 'code' && app.querySelector('#code')) {
        app.querySelector('#code-form button[type="submit"]').disabled = false;
        app.querySelector('#code-hinweis').textContent = r.grund || '';
        app.querySelector('#code').focus();
      } else ansichtCode(r.grund);
      return;
    }
    ansichtStart();
    if (r.gespeichert === false) melden(SPEICHER_FEHLT);
  }

  function ansichtCode(hinweis = '') {
    zeigen(`
      ${kopf(esc(C.unterzeile), true)}
      <section class="papier" aria-labelledby="h-code">
        <p>Ich bin ${esc(C.maskottchen)}, ein Kofferfisch. Hier ziehen wir Kugeln, drehen Räder, würfeln und werfen Münzen. Du vermutest zuerst, dann probierst du es aus.</p>
        <h2 id="h-code">Wie lautet dein Code?</h2>
        <form id="code-form" novalidate>
          <label for="code">Dein Code</label>
          <input type="text" id="code" name="code" class="code-feld" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="${C.codeLaenge + 4}" aria-describedby="code-hinweis code-info">
          <p id="code-hinweis" class="hinweis-feld" aria-live="polite"></p>
          <p class="knopfreihe"><button type="submit" class="knopf haupt">Weiter</button></p>
        </form>
        <p id="code-info" class="leise">Dein Code hat ${C.codeLaenge} Zeichen: Buchstaben und Zahlen. Es ist derselbe Code wie beim Perlentaucher.</p>
      </section>
      ${erwachsene()}`, '');
    ansicht = 'code';
    app.querySelector('#code-hinweis').textContent = hinweis || '';
    app.querySelector('#code-form').addEventListener('submit', e => {
      e.preventDefault();
      const knopf = e.target.querySelector('button[type="submit"]');
      if (knopf.disabled) return;
      knopf.disabled = true;
      app.querySelector('#code-hinweis').textContent = MOMENT;
      cloud.anmelden(app.querySelector('#code').value).then(nachAnmelden, () => nachAnmelden({ ok: false, grund: cloud.TEXT.sonst }));
    });
  }

  /* Die Lehrkraft hat die Chancenbucht im Lehrerbereich gesperrt (oeffentlich/plattformen, js/konto-cloud.js).
     Das Kind ist schon wieder abgemeldet, sein Stand bleibt auf dem Gerät und in der Datenbank.
     Text von Ingo gewählt am 21.11.2026 (cloud.TEXT.zu): „Bald offen!“ als Überschrift, der Rest darunter.
     Gebaut wie in der Kieselwaage (v=7). */
  function ansichtZu() {
    const text = cloud.TEXT.zu;
    const i = text.indexOf('! ');
    const titel = i > 0 ? text.slice(0, i + 1) : '';
    const rest = i > 0 ? text.slice(i + 2) : text;
    zeigen(`
      ${kopf(esc(C.unterzeile), true)}
      <section class="papier zu" aria-labelledby="h-zu">
        <h2 id="h-zu">${titel ? SCHLOSS + esc(titel) : '<span class="nurvorlesen">Bald offen</span>'}</h2>
        <p>${esc(rest)}</p>
        <p class="knopfreihe"><button type="button" class="knopf glas-knopf" data-aktion="abmelden">Abmelden</button></p>
      </section>
      ${erwachsene()}`, 'Bald offen');
    ansicht = 'zu';
    aktiveStation = null;
    adresse('');
  }

  /* Zeile auf der Startseite, wenn der Stand gerade nicht in der Datenbank ankommt */
  function netzText() {
    const z = cloud.zustand().art;
    if (z === 'lokal') return 'Gerade ohne Internet. Dein Stand bleibt auf diesem Gerät und wird später abgeglichen.';
    if (z === 'fehler') return 'Dein Stand konnte gerade nicht im Internet gespeichert werden. Er bleibt auf diesem Gerät. Bitte sag deiner Lehrkraft Bescheid.';
    return '';
  }
  cloud.beiZustand(() => {
    const p = app.querySelector('#netz-zeile');
    if (p) { p.textContent = netzText(); p.hidden = !p.textContent; }
  });

  /* Kleine Stationsbilder als Code-Grafik (Zierde, aria-hidden). Kugeln und Felder tragen Farbe UND Muster.
     Die Münze hat ein eigenes Bild (Welle), keine echte Währung. */
  const SVG = inhalt => `<svg class="station__bild sym" viewBox="0 0 96 72" aria-hidden="true" focusable="false">${inhalt}</svg>`;
  const kugel = (x, y, r, farbe, muster) => `<circle class="k-${farbe}" cx="${x}" cy="${y}" r="${r}"/>${muster ? `<circle class="m-${muster}" cx="${x}" cy="${y}" r="${r}"/>` : ''}<circle class="sym-voll" cx="${x}" cy="${y}" r="${r}"/>`;
  /* Farbige Stationsbilder in den Farben der Stationen selbst (Holz der Kiste, Elfenbein der Würfel, Bronze der Münze),
     mit heller Kontur, damit sie auf dem dunklen Glas stehen. Kugelfarben immer mit Muster. */
  const STATIONSBILD = {
    fuehlkiste: SVG(`${kugel(32, 14, 6.5, 'blau', 'streifen')}${kugel(48, 9, 6.5, 'rot', 'punkte')}${kugel(64, 14, 6.5, 'gelb', '')}<path class="sym-deckel" d="M12 32l11-11h50l11 11z"/><rect class="sym-holz" x="12" y="32" width="72" height="34" rx="3"/><path class="sym-kante" d="M16 37h64"/><ellipse class="sym-loch" cx="48" cy="49" rx="13" ry="7"/>`),
    gluecksrad: SVG(`<circle class="sym-rand" cx="48" cy="38" r="31.5"/><path class="k-blau" d="M48 38V8a30 30 0 0 1 30 30z"/><path class="m-streifen" d="M48 38V8a30 30 0 0 1 30 30z"/><path class="k-gelb" d="M48 38h30a30 30 0 0 1-30 30z"/><path class="k-gruen" d="M48 38v30a30 30 0 0 1-30-30z"/><path class="m-karo" d="M48 38v30a30 30 0 0 1-30-30z"/><path class="k-rot" d="M48 38H18a30 30 0 0 1 30-30z"/><path class="m-punkte" d="M48 38H18a30 30 0 0 1 30-30z"/><path class="sym-duenn" d="M48 8v60M18 38h60"/><circle class="sym-nabe" cx="48" cy="38" r="4"/><path class="sym-zeiger" d="M48 3l-6 9h12z"/>`),
    wuerfeln: SVG(`<rect class="sym-elfenbein" x="10" y="22" width="32" height="32" rx="7"/><circle class="sym-auge" cx="19" cy="31" r="3.2"/><circle class="sym-auge" cx="26" cy="38" r="3.2"/><circle class="sym-auge" cx="33" cy="45" r="3.2"/><g transform="rotate(14 68 32)"><rect class="sym-elfenbein" x="52" y="16" width="32" height="32" rx="7"/><circle class="sym-auge" cx="61" cy="25" r="3.2"/><circle class="sym-auge" cx="75" cy="25" r="3.2"/><circle class="sym-auge" cx="68" cy="32" r="3.2"/><circle class="sym-auge" cx="61" cy="39" r="3.2"/><circle class="sym-auge" cx="75" cy="39" r="3.2"/></g>`),
    muenze: SVG(`<circle class="sym-bronze" cx="64" cy="28" r="20"/><circle class="sym-gold sym-gold--hinten" cx="64" cy="28" r="15"/><circle class="sym-bronze" cx="40" cy="40" r="26"/><circle class="sym-riffel" cx="40" cy="40" r="23"/><circle class="sym-gold" cx="40" cy="40" r="19"/><path class="sym-praegung" d="M35 31l7-5v21M34 47h13"/><path class="sym-praegung sym-praegung--fein" d="M27 53c3-3 6-3 9 0s6 3 9 0s6-3 9 0"/>`),
    denkfehler: SVG(`<path class="sym-griff" d="M57 47l16 16"/><circle class="sym-glas" cx="42" cy="32" r="20"/>${kugel(35, 41, 5, 'blau', 'streifen')}${kugel(49, 41, 5, 'rot', 'punkte')}<path class="sym-frage" d="M37 21a5 5 0 1 1 7.5 4.3c-1.7.9-2.5 2.2-2.5 3.9"/><circle class="weiss" cx="42" cy="33.3" r="1.9"/><circle class="sym-glasrand" cx="42" cy="32" r="20"/>`)
  };
  const BUCH = '<svg class="buch" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5c3-1.5 5.5-1.5 8 0v14c-2.5-1.5-5-1.5-8 0z"/><path d="M12 5c2.5-1.5 5-1.5 8 0v14c-3-1.5-5.5-1.5-8 0"/></svg>';
  const SCHLOSS = '<svg class="schloss" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  /* Live ist eine Station, wenn config.js es sagt und ihr Modul geladen ist (CB.stationen[id]) */
  const istLive = s => !!(s.live && CB.stationen && CB.stationen[s.id]);
  /* Stempel als Form (gefüllter oder gestrichelter Kreis je Stufe), nicht als Zahl */
  function stempelPunkte(id) {
    return `<span class="stempel-punkte" aria-hidden="true">${C.stufen.map(st => `<span class="stempel-punkt${ST.hatStempel(id, st) ? ' stempel-punkt--voll' : ''}"></span>`).join('')}</span>`;
  }
  function stempelText(id) {
    const n = C.stufen.filter(st => ST.hatStempel(id, st)).length;
    return n ? `${n} von ${C.stufen.length} Stempeln.` : 'Noch kein Stempel.';
  }

  /* Startseite: Begrüßung, Stationen, Abmelden */
  function ansichtStart() {
    const k = ST.aktiv();
    if (!k) { ansichtCode(); return; }
    zeigen(`
      ${kopf('Hallo, <span id="vorname"></span>!')}
      <p id="netz-zeile" class="netz-zeile" role="status" hidden></p>
      <section aria-labelledby="h-stationen">
        <h2 id="h-stationen" class="nurvorlesen">Stationen</h2>
        <ul class="stationen">
          ${C.stationen.map(s => istLive(s) ? `
            <li>
              <button type="button" class="station station--live" data-aktion="station" data-id="${esc(s.id)}" aria-label="${esc(s.name)}: ${esc(s.kurz)}. ${stempelText(s.id)}">
                <span class="station__name">${esc(s.name)}</span>
                <span class="station__linie" aria-hidden="true"></span>
                <span class="station__kurz">${esc(s.kurz)}</span>
                ${STATIONSBILD[s.id] || ''}
                ${stempelPunkte(s.id)}
              </button>
            </li>` : `
            <li>
              <div class="station station--bald">
                <h3 class="station__name">${esc(s.name)}</h3>
                <span class="station__linie" aria-hidden="true"></span>
                <p class="station__kurz">${esc(s.kurz)}</p>
                ${STATIONSBILD[s.id] || ''}
                <p class="station__bald">${SCHLOSS}Kommt bald</p>
              </div>
            </li>`).join('')}
        </ul>
      </section>
      <p class="knopfreihe knopfreihe--mitte"><button type="button" class="knopf glas-knopf logbuch-knopf" data-aktion="logbuch">${BUCH}<span>Mein Logbuch</span><span class="logbuch-knopf__zahl">${CB.logbuch.anzahlStempel()} von ${ST.SCHLUESSEL.length} Stempeln</span></button></p>
      ${ST.istVorschau ? '' : '<p class="knopfreihe knopfreihe--mitte"><button type="button" class="knopf glas-knopf" data-aktion="abmelden">Abmelden</button></p>'}
      ${erwachsene()}`, '');
    app.querySelector('#vorname').textContent = k.name || 'du';
    const n = app.querySelector('#netz-zeile');
    n.textContent = netzText(); n.hidden = !n.textContent;
    ansicht = 'start';
    aktiveStation = null;
    adresse('');
  }

  /* ---------- Stationen ---------- */
  /* Adresse mitführen (#fuehlkiste), damit Neuladen dort bleibt */
  function adresse(h) {
    try { history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : '')); } catch (e) { /* egal */ }
  }
  let aktiveStation = null;
  const SPEICHER_FEHLT_KURZ = SPEICHER_FEHLT;
  /* Was eine Station von der App braucht */
  const ctx = {
    app, esc, zeigen: (h, t) => zeigen(h, t), melden: t => melden(t), ansagen: t => ansagen(t), adresse,
    zurueck: () => ansichtStart(),
    speicherFehlt: SPEICHER_FEHLT_KURZ,
    wuerfiKlein: `<picture><source srcset="bilder/wuerfi-160.webp?b=${C.bildStand}" type="image/webp"><img class="wuerfi-klein" src="bilder/wuerfi-160.jpg?b=${C.bildStand}" alt="" width="160" height="160"></picture>`,
    welle: WELLE
  };
  function stationOeffnen(id) {
    const s = CB.stationen && CB.stationen[id];
    if (!s || !ST.aktiv()) { ansichtStart(); return; }
    aktiveStation = s;
    ansicht = 'station';
    adresse(id);
    s.oeffnen(ctx);
  }

  /* Logbuch: eigene Ansicht #logbuch, Klicks gehen an CB.logbuch (Urkunde) */
  function logbuchOeffnen() {
    if (!ST.aktiv()) { ansichtStart(); return; }
    aktiveStation = CB.logbuch;
    ansicht = 'logbuch';
    adresse('logbuch');
    CB.logbuch.zeigen(ctx);
  }

  function abmelden(knopf) {
    knopf.disabled = true;
    cloud.abmelden().then(() => { ansichtCode(); }, () => { ansichtCode(); });
  }

  /* ---------- Erwachsenenbereich: zwei Aufklapper (Texte in js/erwachsene.js) ---------- */
  function erwachsenenTeil(bereich, klasse) {
    const abschnitt = x => `
        <h3>${esc(x.titel)}</h3>
        ${(x.absaetze || []).map(t => `<p>${esc(t)}</p>`).join('')}
        ${x.liste ? `<ul class="erwachsene__liste">${x.liste.map(([f, t]) => `<li><b>${esc(f)}:</b> ${esc(t)}</li>`).join('')}</ul>` : ''}
        ${x.tabelle ? `<div class="erwachsene__tabelle"><table><thead><tr>${x.tabelle.kopf.map(k => `<th scope="col">${esc(k)}</th>`).join('')}</tr></thead><tbody>${x.tabelle.zeilen.map(([p, u]) => `<tr><th scope="row">${esc(p)}</th><td>${esc(u)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${x.datenschutzLink ? '<p>Mehr steht unter <a href="datenschutz.html">Datenschutz</a>.</p>' : ''}`;
    return `
      <details class="papier erwachsene ${klasse}">
        <summary><h2>${esc(bereich.titel)}</h2></summary>
        ${bereich.abschnitte.map(abschnitt).join('')}
      </details>`;
  }
  function erwachsene() {
    const E = CB.erwachsene;
    return erwachsenenTeil(E.eltern, 'erwachsene--eltern') + erwachsenenTeil(E.lehrkraefte, 'erwachsene--lehrkraefte');
  }

  /* ---------- Bedienung ---------- */
  app.addEventListener('click', e => {
    if (aktiveStation && aktiveStation.bedienen && aktiveStation.bedienen(e)) return;
    const b = e.target.closest('[data-aktion]');
    if (!b || b.disabled) return;
    const a = b.dataset.aktion;
    if (a === 'abmelden') abmelden(b);
    else if (a === 'start') ansichtStart();
    else if (a === 'station') stationOeffnen(b.dataset.id);
    else if (a === 'logbuch') logbuchOeffnen();
  });

  /* ---------- Start ---------- */
  if (ST.istVorschau) {
    const h = document.getElementById('vorschau-hinweis');
    h.textContent = 'Vorschau: Hier wird nichts gespeichert.';
    h.hidden = false;
  }

  /* Die Lehrkraft hat den Stand zurückgesetzt: Das Gerät hat seinen Stand verworfen (js/konto-cloud.js). */
  cloud.beiNeustart(() => {
    if (ansicht === 'start') ansichtStart();
    melden('Deine Lehrkraft hat deine Chancenbucht neu gestartet. Du fängst von vorn an.');
  });

  /* Was das Gerät schon weiß, steht sofort da. Die Antwort aus dem Netz kommt nach.
     Gewechselt wird nur auf der Code- oder Startseite, nie mitten in einer Aufgabe. */
  const darfWechseln = () => ['code', 'start'].includes(ansicht);
  function anzeigen() {
    const ziel = location.hash.slice(1);
    if (ST.aktiv()) {
      if (CB.stationen && CB.stationen[ziel] && C.stationen.some(s => s.id === ziel && s.live)) stationOeffnen(ziel);
      else if (ziel === 'logbuch') logbuchOeffnen();
      else ansichtStart();
    } else ansichtCode();
    if (ST.zustand.ladeFehler) melden(LADEN_FEHLT);
  }
  function starten() {
    if (ST.istVorschau) { anzeigen(); return; }
    const LA = window.LagunenKonto.adresse;
    const qr = LA.code(), spur = LA.spur();
    LA.saeubern();
    if (qr) {
      /* Ein gescannter Code hat Vorrang vor dem Kind, das auf dem Gerät noch angemeldet ist. */
      if (ST.aktiv() && ST.code() !== qr) S.abmelden();
      if (ST.aktiv()) ansichtStart(); else ansichtCode(MOMENT);
      cloud.anmelden(qr).then(r => { if (r.zu) ansichtZu(); else if (darfWechseln()) { if (!r.ok) ansichtCode(r.grund); else nachAnmelden(r); } }, () => {});
      return;
    }
    anzeigen();
    if (spur && ansicht === 'code') app.querySelector('#code-hinweis').textContent = 'Der Code wurde nicht ganz gelesen. Tippe ihn bitte ein.';
    const gemerkt = ST.code();
    cloud.start().then(r => {
      if (r.ok) { if (darfWechseln()) nachAnmelden(r); return null; }
      /* Gesperrt: auch mitten in einer Station wechseln, denn das Kind ist schon abgemeldet */
      if (r.zu) { ansichtZu(); return null; }
      if (r.grund) return r;
      /* Firebase kennt niemanden, der Tab aber schon: mit dem gemerkten Code anmelden */
      return gemerkt && ST.code() === gemerkt ? cloud.anmelden(gemerkt) : null;
    }).then(r => {
      if (!r) return;
      if (r.zu) { ansichtZu(); return; }
      if (r.ok) { if (ansicht === 'start' && darfWechseln()) ansichtStart(); return; }
      /* Die Lehrkraft hat den Code gesperrt: nicht auf dem Gerät weiterarbeiten lassen */
      if (r.grund === cloud.TEXT.gesperrt && ST.aktiv()) { S.abmelden(); if (darfWechseln()) ansichtCode(r.grund); }
    }, () => {});
  }
  starten();

  /* Für Rauchtest und Vorschau */
  window.CB.bereit = true;
})();
