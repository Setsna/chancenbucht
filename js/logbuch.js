/* Chancenbucht: Logbuch (Etappe 5e) mit Stempel-Tafel, „Das kann ich schon“ und Urkunde.
   Klassisches Skript, legt window.CB.logbuch an. Braucht CB.config, CB.stand, CB.teile, CB.stationen (stempelSvg), CB.urkunde.
   Texte nach Dateien/Beispiele-Entwuerfe/logbuch-erwachsene-urkunde.md (von Ingo freigegeben am 15.11.2026).
   Gelesen wird nur stempel. Es gibt keine Zahlen (keine Aufgaben, keine Zeit, Ingos Entscheidung).
   Urkunde ab leicht und mittel in allen fünf Stationen (10 Stempel, Ingos Entscheidung).
   Der Vorname kommt nur über textContent auf die Seite und nur in die Urkunde auf dem Gerät. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const C = () => CB.config;
  const ST = () => CB.stand;
  const T = () => CB.teile;
  const URKUNDE_STUFEN = ['leicht', 'mittel'];

  const SAETZE = {
    fuehlkiste: { leicht: 'Ich sehe an der Kiste, ob eine Kugel sicher oder unmöglich ist.', mittel: 'Ich kann sagen, ob eine Kugel wahrscheinlich oder unwahrscheinlich ist. Ich vermute erst und ziehe dann.', knifflig: 'Ich vergleiche zwei Kisten und finde heraus, was in einer verdeckten Kiste ist.' },
    gluecksrad: { leicht: 'Ich sehe am Rad, ob eine Farbe sicher oder unmöglich ist.', mittel: 'Ich kann ein Rad so färben, dass ein Satz stimmt.', knifflig: 'Ich erkenne, welche Farbe die größere Chance hat oder ob die Chancen gleich sind.' },
    wuerfeln: { leicht: 'Ich weiß: Jede Zahl auf dem Würfel hat die gleiche Chance.', mittel: 'Ich finde alle Würfe für eine Augensumme. Die 7 hat die meisten.', knifflig: 'Ich prüfe, ob ein Würfelspiel fair ist.' },
    muenze: { leicht: 'Ich weiß: Kopf und Zahl haben die gleiche Chance.', mittel: 'Ich weiß: Die Münze merkt sich nicht, was vorher kam.', knifflig: 'Ich finde alle Möglichkeiten mit zwei Münzen und prüfe, ob ein Weg gerecht ist.' },
    denkfehler: { leicht: 'Ich weiß: Was dreimal kam, macht nichts anderes „dran“. Selten ist nicht unmöglich.', mittel: 'Ich weiß: Ein einzelner Versuch zeigt nicht, was wahrscheinlich war.', knifflig: 'Ich vergleiche nicht nur die Anzahl, sondern auch alle zusammen.' }
  };

  const anzahlStempel = () => ST().SCHLUESSEL.filter(k => { const [s, st] = k.split(':'); return ST().hatStempel(s, st); }).length;
  const fehlend = () => C().stationen.flatMap(s => URKUNDE_STUFEN.filter(st => !ST().hatStempel(s.id, st)).map(st => `${s.name} (${st})`));
  const urkundeBereit = () => fehlend().length === 0;
  const verdienteSaetze = () => C().stationen.flatMap(s => C().stufen.filter(st => ST().hatStempel(s.id, st)).map(st => ({ station: s.id, stufe: st, satz: SAETZE[s.id][st] })));

  let ctx = null, urkundeUrl = null, urkundeDatei = null;
  function zeigen(c) {
    ctx = c;
    const esc = ctx.esc;
    const stationen = C().stationen;
    const motiv = id => (CB.stationen && CB.stationen[id] && CB.stationen[id].stempelSvg) ? CB.stationen[id].stempelSvg() : T().stempel('');
    const saetze = verdienteSaetze();
    const fehlt = fehlend();
    ctx.zeigen(`
      <header class="kopf kopf--station">
        <div class="kopf__reihe">
          ${T().PFEIL}
          <div class="kopf__mitte">
            <h1>Mein Logbuch</h1>
            <p class="unterzeile">Hier steht, was du schon kannst.</p>
          </div>
          <div class="kopf__werkzeug"></div>
        </div>
      </header>
      <section class="papier logbuch" aria-labelledby="lb-stempel">
        <h2 id="lb-stempel">Meine Stempel</h2>
        <ul class="logbuch__tafel">
          ${stationen.map(s => `
            <li class="logbuch__zeile">
              <h3 class="logbuch__station">${esc(s.name)}</h3>
              <ul class="logbuch__stempel" aria-label="${esc(s.name)}: ${C().stufen.map(st => `${st} ${ST().hatStempel(s.id, st) ? 'geschafft' : 'noch offen'}`).join(', ')}">
                ${C().stufen.map(st => `<li class="logbuch__stufe${ST().hatStempel(s.id, st) ? ' logbuch__stufe--voll' : ''}" aria-hidden="true">
                  <span class="logbuch__bild">${ST().hatStempel(s.id, st) ? motiv(s.id) : ''}</span>
                  <span class="logbuch__wort">${esc(st)}</span>
                  ${ST().hatStempel(s.id, st) ? '' : '<span class="logbuch__offen">noch offen</span>'}
                </li>`).join('')}
              </ul>
              <button type="button" class="knopf logbuch__hin" data-aktion="station" data-id="${esc(s.id)}">Zur Station</button>
            </li>`).join('')}
        </ul>
      </section>
      <section class="papier logbuch" aria-labelledby="lb-kann">
        <h2 id="lb-kann">Das kann ich schon</h2>
        ${saetze.length ? `<ul class="logbuch__kann">${stationen.filter(s => saetze.some(x => x.station === s.id)).map(s => `
          <li><h3>${esc(s.name)}</h3><ul>${saetze.filter(x => x.station === s.id).map(x => `<li>${esc(x.satz)}</li>`).join('')}</ul></li>`).join('')}</ul>`
          : '<p>Hier stehen bald deine ersten Sätze. Such dir eine Station aus.</p>'}
      </section>
      <section class="papier logbuch" aria-labelledby="lb-urkunde">
        <h2 id="lb-urkunde">Urkunde</h2>
        ${fehlt.length ? `<p>Die Urkunde gibt es, wenn du in jeder Station leicht und mittel geschafft hast.</p><p>Dir fehlen noch: ${esc(fehlt.join(', '))}.</p>`
          : `<p>Du hast in jeder Station leicht und mittel geschafft. Du kannst dir eine Urkunde machen.</p>
             <p class="knopfreihe"><button type="button" class="knopf haupt" data-lb="urkunde">Urkunde erstellen</button></p>
             <p id="lb-status" role="status"></p>
             <p class="knopfreihe" id="lb-fertig" hidden>
               <a class="knopf haupt" id="lb-ansehen" href="#" target="_blank" rel="noopener">Urkunde ansehen</a>
               <button type="button" class="knopf" data-lb="teilen" id="lb-teilen" hidden>Teilen</button>
             </p>
             <p class="leise">Die Urkunde macht das Gerät selbst. Sie wird nicht gespeichert und nicht verschickt.</p>`}
      </section>`, 'Mein Logbuch');
  }

  async function urkundeErstellen(knopf) {
    if (!urkundeBereit()) return;
    const status = ctx.app.querySelector('#lb-status'), fertig = ctx.app.querySelector('#lb-fertig');
    const ansehen = ctx.app.querySelector('#lb-ansehen'), teilen = ctx.app.querySelector('#lb-teilen');
    knopf.disabled = true;
    status.textContent = 'Deine Urkunde wird gemacht …';
    try {
      const k = ST().aktiv();
      const r = await CB.urkunde.erstellen({
        name: (k && k.name) || 'Forscherin oder Forscher', datum: new Date(),
        stationen: C().stationen.map(s => ({ id: s.id, name: s.name })), stufen: C().stufen.slice(),
        hat: (id, st) => ST().hatStempel(id, st), saetze: verdienteSaetze(),
        wuerfiSrc: `bilder/wuerfi-512.jpg?b=${C().bildStand}`
      });
      if (urkundeUrl) URL.revokeObjectURL(urkundeUrl);
      urkundeUrl = URL.createObjectURL(r.blob);
      ansehen.href = urkundeUrl;
      ansehen.setAttribute('download', r.dateiname);
      urkundeDatei = typeof File === 'function' ? new File([r.blob], r.dateiname, { type: 'application/pdf' }) : null;
      teilen.hidden = !(urkundeDatei && navigator.canShare && navigator.canShare({ files: [urkundeDatei] }));
      fertig.hidden = false;
      status.textContent = 'Deine Urkunde ist fertig.';
      CB.urkunde.letzte = r;   /* nur für den Rauchtest */
      ansehen.focus();
    } catch (e) {
      status.textContent = 'Die Urkunde konnte gerade nicht gemacht werden. Versuch es noch einmal.';
    }
    knopf.disabled = false;
  }
  async function urkundeTeilen() {
    const status = ctx.app.querySelector('#lb-status');
    if (!urkundeDatei || !navigator.share) return;
    try { await navigator.share({ files: [urkundeDatei], title: 'Meine Urkunde' }); status.textContent = 'Geteilt.'; }
    catch (e) { if (!e || e.name !== 'AbortError') status.textContent = 'Teilen klappt hier gerade nicht. Tippe auf „Urkunde ansehen“.'; }
  }

  function bedienen(e) {
    const b = e.target.closest('[data-lb]');
    if (!b || b.disabled) return false;
    if (b.dataset.lb === 'urkunde') urkundeErstellen(b);
    else if (b.dataset.lb === 'teilen') urkundeTeilen();
    else return false;
    return true;
  }

  CB.logbuch = { SAETZE, URKUNDE_STUFEN, zeigen, bedienen, anzahlStempel, fehlend, urkundeBereit, verdienteSaetze };
})();
