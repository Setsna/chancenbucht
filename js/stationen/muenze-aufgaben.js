/* Chancenbucht: Aufgabengenerator der Station Münzwurf (Etappe 5b).
   Klassisches Skript, legt window.CB.muenzeAufgaben an. Braucht CB.einordnung.

   Texte nach Dateien/Beispiele-Entwuerfe/muenze.md (von Ingo freigegeben am 15.11.2026).
   Fachlich:
   - Die Münze ist der Fall „genau die Hälfte“. Es gibt kein fünftes Skalenwort, sondern „gleiche Chance“.
     Absolut eingeordnet wird nur sicher und unmöglich.
   - Kein Ausgleich: Was vorher kam, ändert nichts. Passend ist bei Reihen immer „gleiche Chance“.
   - Alle Lösungen werden über die Möglichkeiten gezählt (Münze 2, Würfel 6, zwei Münzen 4), nie aus einer Liste gelesen.
   Regeln, die tools/muenze-test.html prüft:
   - Einordnen: Lösung aus der Zahl passender Seiten (2 sicher, 1 gleich, 0 unmöglich), genau eine passende Begründung
   - Vermuten, dreimal: passend ist nur „gleich“
   - Genau die Hälfte: nie sicher (Lösung „nein“); Reihe: „sicher <Seite>“ stimmt nie, „gleiche Chance“ stimmt immer
   - Zwei Münzen: Lösung = alle Ausgänge (klein, groß), die passen
   - Vergleichen und gerecht: Lösung aus der Zahl der Möglichkeiten */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const waehle = (Z, l) => l[Z.zahl(l.length)];
  function mische(Z, l) { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Z.zahl(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const SEITEN = ['kopf', 'zahl'];
  const NAME = { kopf: 'Kopf', zahl: 'Zahl' };
  const andere = s => (s === 'kopf' ? 'zahl' : 'kopf');
  const moeglichkeitenWort = n => (n === 1 ? '1 Möglichkeit' : `${n} Möglichkeiten`);

  /* ---------- Einordnen ---------- */
  const MERKMALE = [
    { satz: 'Die Münze zeigt Kopf oder Zahl.', passt: s => s === 'kopf' || s === 'zahl' },
    { satz: 'Die Münze zeigt eine Seite.', passt: () => true },
    { satz: 'Die Münze zeigt Kopf.', passt: s => s === 'kopf' },
    { satz: 'Die Münze zeigt Zahl.', passt: s => s === 'zahl' },
    { satz: 'Die Münze zeigt nicht Kopf.', passt: s => s !== 'kopf' },
    { satz: 'Die Münze zeigt nicht Zahl.', passt: s => s !== 'zahl' },
    { satz: 'Die Münze zeigt eine 2.', passt: () => false },
    { satz: 'Die Münze zeigt Kopf und Zahl zugleich.', passt: () => false }
  ];
  const STUFE_AUS = n => (n === 2 ? 'sicher' : n === 1 ? 'gleich' : 'unmoeglich');
  const ANTWORTEN_EIN = ['sicher', 'gleich', 'unmoeglich'];
  const ANTWORT_TEXT = { sicher: 'sicher', gleich: 'gleiche Chance wie die andere Seite', unmoeglich: 'unmöglich' };
  const BEGR_EIN = { sicher: 'Beide Seiten passen.', gleich: 'Eine von zwei Seiten passt.', unmoeglich: 'Keine Seite passt.' };
  function einordnen(stufe, Z, ohne = []) {
    /* Nur Stufen, für die es noch einen unbenutzten Satz gibt (je Stufe nur 2 bis 4 Sätze, je Runde 5 Aufgaben) */
    const frei = MERKMALE.filter(m => !ohne.includes(m.satz));
    const moeglich = ANTWORTEN_EIN.filter(st => frei.some(m => STUFE_AUS(SEITEN.filter(m.passt).length) === st));
    const soll = waehle(Z, moeglich.length ? moeglich : ANTWORTEN_EIN);
    const kandidaten = (moeglich.length ? frei : MERKMALE).filter(m => STUFE_AUS(SEITEN.filter(m.passt).length) === soll);
    const m = waehle(Z, kandidaten);
    const passend = SEITEN.filter(m.passt);
    const loesung = STUFE_AUS(passend.length);
    const erklaerung = loesung === 'sicher' ? 'Beide Seiten passen. Darum ist das sicher.'
      : loesung === 'unmoeglich' ? `Keine Seite passt. Darum ist das unmöglich.`
      : `Eine von 2 Seiten passt. Darum hat ${NAME[passend[0]]} die gleiche Chance wie ${NAME[andere(passend[0])]}.`;
    return { art: 'einordnen', stufe, satz: m.satz, passend, loesung,
      antworten: ANTWORTEN_EIN.map(id => ({ id, text: ANTWORT_TEXT[id] })),
      begruendungen: mische(Z, ANTWORTEN_EIN.map(s => ({ stufe: s, text: BEGR_EIN[s], richtig: s === loesung }))), erklaerung };
  }

  /* ---------- Vermuten (20-mal) ---------- */
  const vermuten = stufe => ({ art: 'vermuten', stufe, zuege: 20,
    antworten: [{ id: 'kopf', text: 'Kopf' }, { id: 'zahl', text: 'Zahl' }, { id: 'gleich', text: 'Kopf und Zahl haben die gleiche Chance.' }], loesung: 'gleich' });
  const vermutungPasst = (a, wahl) => wahl === a.loesung;

  /* ---------- Dreimal Kopf, und jetzt? ---------- */
  function dreimal(stufe, Z) {
    const seite = waehle(Z, SEITEN);
    return { art: 'dreimal', stufe, seite, reihe: [seite, seite, seite], laenge: 3, versuche: 100, loesung: 'gleich',
      satz: `Ich habe dreimal hintereinander ${NAME[seite]} geworfen.`, frage: 'Was kommt beim nächsten Wurf eher?',
      antworten: [{ id: 'gleiche', text: NAME[seite] }, { id: 'andere', text: `${NAME[andere(seite)]}, jetzt ist ${NAME[andere(seite)]} dran.` }, { id: 'gleich', text: 'Kopf und Zahl haben die gleiche Chance.' }] };
  }
  /* In einer Wurfliste alle Stellen mit <laenge>-mal <seite> hintereinander, nach denen noch ein Wurf kommt, und was danach kam.
     Stellen dürfen sich überlappen (viermal Kopf = zwei Stellen). */
  function auszaehlen(wuerfe, seite, laenge = 3) {
    const aus = { stellen: [], danach: { kopf: 0, zahl: 0 } };
    for (let i = 0; i + laenge < wuerfe.length; i++) {
      let ok = true;
      for (let k = 0; k < laenge; k++) if (wuerfe[i + k] !== seite) { ok = false; break; }
      if (!ok) continue;
      aus.stellen.push(i);
      aus.danach[wuerfe[i + laenge]]++;
    }
    return aus;
  }

  /* ---------- Genau die Hälfte? ---------- */
  function haelfte(stufe, Z) {
    const n = waehle(Z, [10, 20]);
    return { art: 'haelfte', stufe, wuerfe: n, serien: 5, loesung: 'nein',
      satz: `Wir werfen ${n}-mal. Dann kommt genau ${n / 2}-mal Kopf. Ganz sicher.`,
      antworten: [{ id: 'ja', text: 'Ja, das ist sicher.' }, { id: 'nein', text: 'Nein, das ist nicht sicher. Es kann auch anders kommen.' }],
      erklaerung: `Bei ${n} Würfen kann ${n / 2}-mal Kopf kommen. Es kann aber auch ${n / 2 - 1}-mal, ${n / 2 + 1}-mal oder ganz anders kommen. Genau ${n / 2}-mal kommt nur manchmal.` };
  }
  /* Ist „genau die Hälfte“ sicher? Gezählt über alle Reihen: nur sicher, wenn alle Reihen genau n/2 Kopf haben (nie für n ≥ 1). */
  function haelfteSicher(n) { let genau = 0; const C = (a, b) => { let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return Math.round(r); }; genau = C(n, n / 2); return genau === 2 ** n; }

  /* ---------- Eine Reihe geht weiter? ---------- */
  const REIHEN = [['kopf', 'zahl', 'kopf', 'zahl'], ['zahl', 'zahl', 'kopf', 'zahl', 'zahl'], ['kopf', 'kopf', 'zahl', 'kopf', 'kopf']];
  function reihe(stufe, Z, wahr) {
    const r = waehle(Z, REIHEN);
    const text = r.map(s => NAME[s]).join(', ');
    /* „Muster“-Vorhersage: was die Reihe „fortsetzen“ würde */
    const muster = r.length === 4 ? r[0] : r[2];
    const istWahr = wahr === undefined ? Z.zahl(3) === 0 : wahr;
    const behauptung = istWahr ? 'Jetzt haben Kopf und Zahl die gleiche Chance.' : `Jetzt kommt sicher ${NAME[muster]}.`;
    /* Wahrheit gezählt: Der nächste Wurf hat 2 Möglichkeiten, eine davon ist <muster>. Sicher wäre 2 von 2. */
    const stimmt = istWahr ? true : STUFE_AUS(1) === 'sicher';
    return { art: 'reihe', stufe, reihe: r, behauptung, stimmt, loesung: stimmt ? 'ja' : 'nein',
      satz: `Ich habe geworfen: ${text}. ${behauptung}`,
      antworten: [{ id: 'ja', text: 'Das stimmt.' }, { id: 'nein', text: 'Das stimmt nicht.' }],
      erklaerung: 'Die Münze macht kein Muster. Bei jedem Wurf haben Kopf und Zahl die gleiche Chance, egal was vorher kam.' };
  }

  /* ---------- Zwei Münzen ---------- */
  /* Ausgänge als 'klein+gross', z. B. 'kopf+zahl' (kleine Münze Kopf, große Münze Zahl) */
  const ZWEI = SEITEN.flatMap(a => SEITEN.map(b => `${a}+${b}`));
  const teile = id => id.split('+');
  const EREIGNIS = {
    einmalJe: { text: 'einmal Kopf und einmal Zahl', passt: id => { const [a, b] = teile(id); return a !== b; } },
    zweimalKopf: { text: 'zweimal Kopf', passt: id => id === 'kopf+kopf' },
    zweimalZahl: { text: 'zweimal Zahl', passt: id => id === 'zahl+zahl' },
    mindZahl: { text: 'mindestens einmal Zahl', passt: id => teile(id).includes('zahl') },
    mindKopf: { text: 'mindestens einmal Kopf', passt: id => teile(id).includes('kopf') },
    gleich: { text: 'zwei gleiche Seiten', passt: id => { const [a, b] = teile(id); return a === b; } },
    verschieden: { text: 'zwei verschiedene Seiten', passt: id => { const [a, b] = teile(id); return a !== b; } }
  };
  const anzahl = e => ZWEI.filter(EREIGNIS[e].passt).length;
  function zweiMuenzen(stufe, Z) {
    const e = waehle(Z, ['einmalJe', 'zweimalKopf', 'mindZahl']);
    const loesung = ZWEI.filter(EREIGNIS[e].passt);
    return { art: 'zweiMuenzen', stufe, ereignis: e, loesung, felder: ZWEI.slice(),
      satz: `Würfi wirft zwei Münzen, eine kleine und eine große. Tippe alle Felder an, bei denen ${EREIGNIS[e].text} kommt.`,
      pruefe: wahl => wahl.length === loesung.length && wahl.every(w => loesung.includes(w)),
      erklaerung: `Es gibt 4 Möglichkeiten. ${EREIGNIS[e].text[0].toUpperCase() + EREIGNIS[e].text.slice(1)} kommt in ${loesung.length === 1 ? 'einer' : loesung.length} davon vor` +
        (e === 'einmalJe' ? ', weil die kleine oder die große Münze Kopf zeigen kann.' : '.') };
  }
  const PAARE = [['zweimalKopf', 'einmalJe'], ['zweimalKopf', 'zweimalZahl'], ['gleich', 'verschieden'], ['mindKopf', 'zweimalZahl']];
  function vergleichen(stufe, Z) {
    let [a, b] = waehle(Z, PAARE);
    if (Z.zahl(2)) [a, b] = [b, a];
    const na = anzahl(a), nb = anzahl(b);
    const loesung = na > nb ? 'a' : na < nb ? 'b' : 'gleich';
    return { art: 'vergleichen', stufe, a, b, loesung,
      satz: 'Würfi wirft zwei Münzen. Was kommt eher?',
      antworten: [{ id: 'a', text: EREIGNIS[a].text[0].toUpperCase() + EREIGNIS[a].text.slice(1) }, { id: 'b', text: EREIGNIS[b].text[0].toUpperCase() + EREIGNIS[b].text.slice(1) }, { id: 'gleich', text: 'Beide haben die gleiche Chance.' }],
      erklaerung: `Für ${EREIGNIS[a].text} gibt es ${moeglichkeitenWort(na)}, für ${EREIGNIS[b].text} gibt es ${moeglichkeitenWort(nb)}.` };
  }

  /* ---------- Ist das gerecht? (Würfi gegen das Kind) ----------
     Die Texte stehen im Dativ, weil sie im Satz „Bei <text> fängt Würfi an“ stehen. */
  const WUERFEL = [1, 2, 3, 4, 5, 6];
  const VERFAHREN = [
    { id: 'muenze', raum: SEITEN, x: { text: 'Kopf', passt: s => s === 'kopf' }, y: { text: 'Zahl', passt: s => s === 'zahl' }, mittel: 'Münze', einheit: 'Seiten' },
    { id: 'haelften', raum: WUERFEL, x: { text: '1, 2 oder 3', passt: z => z <= 3 }, y: { text: '4, 5 oder 6', passt: z => z >= 4 }, mittel: 'Würfel', einheit: 'Seiten' },
    { id: 'sechs', raum: WUERFEL, x: { text: 'einer 6', passt: z => z === 6 }, y: { text: '1 bis 5', passt: z => z <= 5 }, mittel: 'Würfel', einheit: 'Seiten' },
    { id: 'gerade', raum: WUERFEL, x: { text: 'einer geraden Zahl', passt: z => z % 2 === 0 }, y: { text: 'einer ungeraden Zahl', passt: z => z % 2 === 1 }, mittel: 'Würfel', einheit: 'Seiten' },
    { id: 'gleichVerschieden', raum: ZWEI, x: { text: 'zwei gleichen Seiten', passt: EREIGNIS.gleich.passt }, y: { text: 'zwei verschiedenen Seiten', passt: EREIGNIS.verschieden.passt }, mittel: 'zwei Münzen', einheit: 'Möglichkeiten' },
    { id: 'zweimalKopf', raum: ZWEI, x: { text: 'zweimal Kopf', passt: EREIGNIS.zweimalKopf.passt }, y: { text: 'allem anderen', passt: id => !EREIGNIS.zweimalKopf.passt(id) }, mittel: 'zwei Münzen', einheit: 'Möglichkeiten' }
  ];
  function gerecht(stufe, Z, ohne = []) {
    const pool = VERFAHREN.filter(v => !ohne.includes(v.id));
    const v = waehle(Z, pool.length ? pool : VERFAHREN);
    const tausch = Z.zahl(2) === 1;
    const w = tausch ? v.y : v.x, k = tausch ? v.x : v.y;
    const nw = v.raum.filter(w.passt).length, nk = v.raum.filter(k.passt).length;
    const loesung = nw === nk ? 'fair' : nw > nk ? 'wuerfi' : 'kind';
    const n = v.raum.length;
    const erklaerung = loesung === 'fair' ? `Jeder hat ${nw} von ${n} ${v.einheit}. Das ist gerecht.`
      : loesung === 'wuerfi' ? `Würfi hat ${nw} von ${n} ${v.einheit}, du nur ${nk}. Das ist nicht gerecht.`
      : `Du hast ${nk} von ${n} ${v.einheit}, Würfi nur ${nw}. Das ist nicht gerecht.`;
    const mit = v.mittel === 'Münze' ? 'eine Münze' : v.mittel === 'Würfel' ? 'einen Würfel' : 'zwei Münzen';
    return { art: 'gerecht', stufe, verfahren: v.id, raum: v.raum.slice(), wuerfi: w.text, kind: k.text, nWuerfi: nw, nKind: nk, loesung, runden: 20,
      passtWuerfi: w.passt, passtKind: k.passt,
      satz: `Würfi und du wollt entscheiden, wer anfängt. Ihr nehmt ${mit}. Bei ${w.text} fängt Würfi an, bei ${k.text} fängst du an. Ist das gerecht?`,
      antworten: [{ id: 'fair', text: 'Ja, wir haben die gleiche Chance.' }, { id: 'wuerfi', text: 'Nein, Würfi hat die größere Chance.' }, { id: 'kind', text: 'Nein, ich habe die größere Chance.' }],
      erklaerung };
  }

  /* ---------- Runde ---------- */
  const PLAN = {
    leicht: ['einordnen', 'einordnen', 'vermuten', 'einordnen', 'einordnen', 'einordnen'],
    mittel: ['dreimal', 'haelfte', 'reihe', 'dreimal', 'haelfte', 'reihe'],
    knifflig: ['zweiMuenzen', 'vergleichen', 'gerecht', 'vergleichen', 'gerecht', 'gerecht']
  };
  function runde(stufe, Z = CB.zufall) {
    if (!PLAN[stufe]) throw new Error('Unbekannte Stufe: ' + stufe);
    const saetze = [], verfahren = [];
    return PLAN[stufe].map(art => {
      if (art === 'einordnen') { const a = einordnen(stufe, Z, saetze); saetze.push(a.satz); return a; }
      if (art === 'vermuten') return vermuten(stufe);
      if (art === 'dreimal') return dreimal(stufe, Z);
      if (art === 'haelfte') return haelfte(stufe, Z);
      if (art === 'reihe') return reihe(stufe, Z);
      if (art === 'zweiMuenzen') return zweiMuenzen(stufe, Z);
      if (art === 'vergleichen') return vergleichen(stufe, Z);
      const a = gerecht(stufe, Z, verfahren); verfahren.push(a.verfahren); return a;
    });
  }

  CB.muenzeAufgaben = { runde, einordnen, vermuten, vermutungPasst, dreimal, auszaehlen, haelfte, haelfteSicher, reihe, zweiMuenzen, vergleichen, gerecht,
    MERKMALE, ZWEI, EREIGNIS, VERFAHREN, REIHEN, PLAN, NAME };
})();
