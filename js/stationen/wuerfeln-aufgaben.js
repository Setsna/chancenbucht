/* Chancenbucht: Aufgabengenerator der Station Würfeln (Etappe 4b).
   Klassisches Skript, legt window.CB.wuerfelnAufgaben an. Braucht CB.config, CB.einordnung (anzahlWege, moeglicheWuerfe).

   Texte nach Dateien/Beispiele-Entwuerfe/wuerfeln.md (von Ingo freigegeben am 15.11.2026).
   Fachlich (Entscheidung D, Etappe 1): Augensummen werden NIE absolut eingeordnet („die 7 ist wahrscheinlich“),
   nur verglichen oder in eindeutigen Fällen (unmöglich, sicher). Ein Würfel: Hälfte-Regel, nie genau die Hälfte.
   Alle Lösungen werden berechnet. Regeln, die tools/wuerfel-test.html prüft:
   - Ein Würfel: genau eine richtige Stufe, genau eine passende Begründung, nie 3 von 6
   - Vermuten mit einem Würfel: passend ist nur „gleiche Chance“; mit zwei Würfeln nur die 7
   - Forschen: Lösung = alle Paare (erster, zweiter) mit der Summe, 3 + 4 und 4 + 3 getrennt
   - Stimmt das?: Wahrheit aus den Wegen je Summe, genau eine passende Begründung
   - Fair?: fair genau bei gleich vielen Wegen; faire Summe = 14 − Würfis Summe, nie die 7 */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const E = () => CB.einordnung;
  const STUFEN4 = ['sicher', 'wahrscheinlich', 'unwahrscheinlich', 'unmoeglich'];
  const waehle = (Z, l) => l[Z.zahl(l.length)];
  function mische(Z, l) { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Z.zahl(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const W = s => E().anzahlWege(s);
  const wuerfeWort = n => (n === 1 ? '1 Wurf' : `${n} Würfe`);

  /* ---------- Ein Würfel: Einordnen ---------- */
  /* Merkmale: Satz, Prüfung je Augenzahl. Genau-die-Hälfte-Merkmale gibt es nicht in der Liste. */
  function merkmale() {
    const l = [];
    for (let k = 1; k <= 6; k++) l.push({ art: 'eine', k, satz: `Ich würfle eine ${k}.`, passt: z => z === k });
    for (const k of [1, 2, 4, 5]) l.push({ art: 'groesser', k, satz: `Ich würfle eine Zahl größer als ${k}.`, passt: z => z > k });
    for (const k of [2, 3, 5, 6]) l.push({ art: 'kleiner', k, satz: `Ich würfle eine Zahl kleiner als ${k}.`, passt: z => z < k });
    for (let k = 1; k <= 6; k++) l.push({ art: 'nicht', k, satz: `Ich würfle nicht die ${k}.`, passt: z => z !== k });
    for (const k of [0, 7, 8]) l.push({ art: 'eine', k, satz: `Ich würfle eine ${k}.`, passt: z => z === k });
    l.push({ art: 'bereich', k: 0, satz: 'Ich würfle eine Zahl von 1 bis 6.', passt: z => z >= 1 && z <= 6 });
    l.push({ art: 'groesser', k: 0, satz: 'Ich würfle eine Zahl größer als 0.', passt: z => z > 0 });
    l.push({ art: 'groesser', k: 6, satz: 'Ich würfle eine Zahl größer als 6.', passt: z => z > 6 });
    return l.filter(m => { const n = [1, 2, 3, 4, 5, 6].filter(m.passt).length; return 2 * n !== 6; });
  }
  const BEGR1 = { sicher: 'Alle Seiten passen.', wahrscheinlich: 'Mehr als die Hälfte der Seiten passt.', unwahrscheinlich: 'Weniger als die Hälfte der Seiten passt.', unmoeglich: 'Keine Seite passt.' };
  function einordnen1(stufe, Z) {
    const soll = waehle(Z, STUFEN4);
    const kandidaten = merkmale().filter(m => E().einordnen([1, 2, 3, 4, 5, 6].filter(m.passt).length, 6) === soll);
    const m = waehle(Z, kandidaten);
    const passend = [1, 2, 3, 4, 5, 6].filter(m.passt);
    const andere = mische(Z, STUFEN4.filter(s => s !== soll)).slice(0, 2);
    const begruendungen = mische(Z, [soll, ...andere]).map(s => ({ stufe: s, text: BEGR1[s], richtig: s === soll }));
    const erklaerung = passend.length
      ? `${passend.length} von 6 Seiten ${passend.length === 1 ? 'passt' : 'passen'}: ${passend.join(', ')}. Darum ist das ${E().wort(soll)}.`
      : 'Keine Seite des Würfels passt. Darum ist das unmöglich.';
    return { art: 'einordnen1', stufe, satz: m.satz, merkmal: { art: m.art, k: m.k }, passend, loesung: soll, antworten: STUFEN4.slice(), begruendungen, erklaerung };
  }

  /* ---------- Vermuten ---------- */
  const vermuten1 = stufe => ({ art: 'vermuten1', stufe, zuege: 30, wuerfel: 1, antworten: ['1', '2', '3', '4', '5', '6', 'gleich'], loesung: 'gleich' });
  const vermutenSumme = stufe => ({ art: 'vermutenSumme', stufe, zuege: 50, wuerfel: 2, antworten: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], loesung: '7' });
  const vermutungPasst = (a, wahl) => String(wahl) === a.loesung;

  /* ---------- Forschen: alle Würfe zu einer Summe ---------- */
  const SUMMEN_MITTEL = [3, 4, 5, 6, 8, 9, 10, 11];
  function forschen(stufe, Z, summe) {
    const s = summe || (stufe === 'knifflig' ? 7 : waehle(Z, SUMMEN_MITTEL));
    const loesung = E().moeglicheWuerfe(s).map(([a, b]) => `${a}+${b}`);
    return { art: 'forschen', stufe, summe: s, loesung,
      satz: `Finde alle Würfe mit der Summe ${s}. Tippe sie an.`,
      pruefe: wahl => wahl.length === loesung.length && wahl.every(w => loesung.includes(w)),
      erklaerung: `Für die ${s} gibt es ${wuerfeWort(loesung.length)}: ${loesung.map(x => x.replace('+', ' + ')).join(', ')}.` };
  }

  /* ---------- Stimmt das? ---------- */
  function aussage(Z) {
    const typ = waehle(Z, ['unmoeglich', 'sicherBereich', 'sicherSumme', 'vergleich', 'vergleich', 'gleich', 'gleich']);
    if (typ === 'unmoeglich') {
      const s = waehle(Z, [1, 13, 14]);
      return { typ, satz: `Die Summe ${s} ist unmöglich.`, stimmt: true, begruendung: s < 2 ? 'Mit zwei Würfeln hat man mindestens 1 + 1 = 2.' : 'Mit zwei Würfeln hat man höchstens 6 + 6 = 12.', summen: [s] };
    }
    if (typ === 'sicherBereich') return { typ, satz: 'Die Summe ist sicher eine Zahl von 2 bis 12.', stimmt: true, begruendung: 'Jeder Wurf ergibt eine Summe von 2 bis 12.', summen: [] };
    if (typ === 'sicherSumme') {
      const s = waehle(Z, [2, 3, 7, 11, 12]);
      return { typ, satz: `Die Summe ${s} ist sicher.`, stimmt: false, begruendung: `Für die ${s} gibt es ${W(s) === 1 ? 'nur ' : ''}${wuerfeWort(W(s))}, aber es gibt auch andere Summen.`, summen: [s] };
    }
    /* Zwei verschiedene Summen. Bei „genauso wahrscheinlich“ in der Hälfte der Fälle ein echtes Paar (a und 14 − a),
       damit die Antwort nicht fast immer „stimmt nicht“ ist. */
    const a = 2 + Z.zahl(11);
    let b;
    if (typ === 'gleich' && a !== 7 && Z.zahl(2)) b = 14 - a;
    else do { b = 2 + Z.zahl(11); } while (b === a);
    const wa = W(a), wb = W(b);
    const zaehl = `Für die ${a} gibt es ${wuerfeWort(wa)}, für die ${b} gibt es ${wuerfeWort(wb)}.`;
    if (typ === 'vergleich') return { typ, satz: `Die ${a} ist wahrscheinlicher als die ${b}.`, stimmt: wa > wb, begruendung: zaehl + (wa === wb ? ' Sie sind genauso wahrscheinlich.' : ''), summen: [a, b] };
    return { typ, satz: `Die ${a} und die ${b} sind genauso wahrscheinlich.`, stimmt: wa === wb, begruendung: zaehl, summen: [a, b] };
  }
  /* Ablenker-Begründungen: andere Zählungen derselben Summen (falsche Zahlen) */
  function ablenker(Z, a) {
    const aus = [];
    if (a.summen.length === 2) {
      const [x, y] = a.summen, wx = W(x), wy = W(y);
      const varianten = [[wy, wx], [wx + 1, wy], [wx, wy + 1], [Math.max(0, wx - 1), wy]].filter(([p, q]) => !(p === wx && q === wy));
      for (const [p, q] of mische(Z, varianten)) {
        const t = `Für die ${x} gibt es ${wuerfeWort(p)}, für die ${y} gibt es ${wuerfeWort(q)}.`;
        if (!aus.includes(t)) aus.push(t);
        if (aus.length === 2) break;
      }
    } else {
      const pool = ['Für jede Summe gibt es gleich viele Würfe.', 'Die 7 kommt immer.', 'Mit zwei Würfeln kann man jede Zahl würfeln.', 'Für die 12 gibt es die meisten Würfe.'];
      aus.push(...mische(Z, pool).slice(0, 2));
    }
    return aus;
  }
  function stimmtDas(stufe, Z) {
    const a = aussage(Z);
    const begruendungen = mische(Z, [{ text: a.begruendung, richtig: true }, ...ablenker(Z, a).map(text => ({ text, richtig: false }))]);
    return { art: 'stimmtDas', stufe, satz: `Würfi sagt: „${a.satz}“ Stimmt das?`, aussage: a, loesung: a.stimmt ? 'ja' : 'nein',
      antworten: [{ id: 'ja', text: 'Das stimmt.' }, { id: 'nein', text: 'Das stimmt nicht.' }], begruendungen, erklaerung: a.begruendung };
  }

  /* ---------- Fair? ---------- */
  function fair(stufe, Z) {
    const soll = waehle(Z, ['fair', 'wuerfi', 'kind']);
    for (let v = 0; v < 500; v++) {
      const w = 2 + Z.zahl(11), k = 2 + Z.zahl(11);
      if (w === k) continue;
      const ist = W(w) === W(k) ? 'fair' : W(w) > W(k) ? 'wuerfi' : 'kind';
      if (ist !== soll) continue;
      const erkl = `Für die ${w} gibt es ${wuerfeWort(W(w))}, für die ${k} gibt es ${wuerfeWort(W(k))}. ` +
        (ist === 'fair' ? 'Beide haben die gleiche Chance. Das Spiel ist fair.' : `${ist === 'wuerfi' ? 'Würfi hat' : 'Du hast'} die größere Chance. Das Spiel ist nicht fair.`);
      return { art: 'fair', stufe, wuerfi: w, kind: k, loesung: ist, runden: 20,
        satz: `Würfi und du würfelt mit zwei Würfeln. Bei der Summe ${w} bekommt Würfi einen Strich. Bei der Summe ${k} bekommst du einen Strich. Ist das fair?`,
        antworten: [{ id: 'fair', text: 'Ja, das ist fair.' }, { id: 'wuerfi', text: 'Nein, Würfi hat die größere Chance.' }, { id: 'kind', text: 'Nein, ich habe die größere Chance.' }], erklaerung: erkl };
    }
    throw new Error('fair: kein Paar gefunden');
  }
  function fairMachen(stufe, Z) {
    const w = waehle(Z, [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]);
    const loesung = String(14 - w);
    return { art: 'fairMachen', stufe, wuerfi: w, loesung,
      satz: `Würfi nimmt die Summe ${w}. Welche Summe musst du nehmen, damit das Spiel fair ist?`,
      antworten: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].filter(x => x !== String(w)),
      erklaerung: `Für die ${w} und die ${14 - w} gibt es je ${wuerfeWort(W(w))}. Dann ist das Spiel fair.` };
  }

  /* ---------- Runde ---------- */
  const PLAN = {
    leicht: ['einordnen1', 'einordnen1', 'vermuten1', 'einordnen1', 'einordnen1', 'einordnen1'],
    mittel: ['vermutenSumme', 'forschen', 'stimmtDas', 'forschen', 'stimmtDas', 'stimmtDas'],
    knifflig: ['fair', 'fairMachen', 'stimmtDas', 'forschen', 'fair', 'forschenZwei']
  };
  function runde(stufe, Z = CB.zufall) {
    if (!PLAN[stufe]) throw new Error('Unbekannte Stufe: ' + stufe);
    return PLAN[stufe].map(art => {
      if (art === 'einordnen1') return einordnen1(stufe, Z);
      if (art === 'vermuten1') return vermuten1(stufe);
      if (art === 'vermutenSumme') return vermutenSumme(stufe);
      if (art === 'forschen') return forschen(stufe, Z);
      if (art === 'forschenZwei') return forschen(stufe, Z, waehle(Z, SUMMEN_MITTEL));
      if (art === 'stimmtDas') return stimmtDas(stufe, Z);
      if (art === 'fair') return fair(stufe, Z);
      return fairMachen(stufe, Z);
    });
  }

  CB.wuerfelnAufgaben = { runde, einordnen1, vermuten1, vermutenSumme, vermutungPasst, forschen, stimmtDas, fair, fairMachen, merkmale, PLAN };
})();
