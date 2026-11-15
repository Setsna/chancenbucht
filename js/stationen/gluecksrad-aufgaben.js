/* Chancenbucht: Aufgabengenerator der Station Glücksrad (Etappe 3b).
   Klassisches Skript, legt window.CB.gluecksradAufgaben an.
   Braucht CB.config, CB.einordnung und CB.fuehlkisteAufgaben (gemeinsame Prüfbausteine: bedingungErfuellt, alleKisten, dreiGleich).

   Texte nach Dateien/Beispiele-Entwuerfe/gluecksrad.md (von Ingo freigegeben am 15.11.2026).
   Ein Rad ist eine Liste von Farb-Ids je Feld (im Uhrzeigersinn ab oben), alle Felder gleich groß.
   Alle Lösungen werden aus den Feldern BERECHNET. Regeln, die tools/rad-test.html prüft:
   - genau eine richtige Einordnung, genau eine passende Begründung, nie genau die Hälfte
   - leicht: 4 oder 6 Felder, nur sicher/unmöglich; mittel: 6 oder 8 Felder; keine drei gleich großen Farben in leicht/mittel
   - gestalten: mindestens eine Lösung, Beispielrad passt
   - vermuten: genau eine Farbe mit den meisten Feldern
   - gleiche Chance: drei Räder mit 8 Feldern, genau zwei oder alle drei haben gleich viele Zielfelder (mindestens 1)
   - Zahlenrad: 8 verschiedene Zahlen von 1 bis 100, Merkmal nie bei genau der Hälfte; Reihe = m, 2m … 10m */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const E = () => CB.einordnung;
  const FK = () => CB.fuehlkisteAufgaben;
  const FARBEN = () => CB.config.farben;
  const F = id => FARBEN().find(f => f.id === id);
  const STUFEN4 = ['sicher', 'wahrscheinlich', 'unwahrscheinlich', 'unmoeglich'];
  const UMGEKEHRT = { sicher: 'unmoeglich', wahrscheinlich: 'unwahrscheinlich', unwahrscheinlich: 'wahrscheinlich', unmoeglich: 'sicher' };

  const waehle = (Z, l) => l[Z.zahl(l.length)];
  function mische(Z, l) { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Z.zahl(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const summe = k => Object.values(k).reduce((s, n) => s + n, 0);
  function verteile(Z, farben, gesamt) { const k = {}; farben.forEach(f => { k[f] = 1; }); for (let i = farben.length; i < gesamt; i++) k[waehle(Z, farben)]++; return k; }
  /* Anzahlen → Felder: Farben zusammenhängend (zählbar), Start an zufälliger Stelle */
  function felderAus(Z, k) {
    const liste = [];
    for (const f of mische(Z, Object.keys(k))) for (let i = 0; i < k[f]; i++) liste.push(f);
    const start = Z.zahl(liste.length);
    return liste.slice(start).concat(liste.slice(0, start));
  }
  const satzAdj = ids => ids.map(id => F(id).adj).join(' oder ');
  const satzName = ids => ids.map(id => F(id).name).join(' oder ');

  function begruendung(stufe, wort, nomen = 'Felder', einzahl = 'Feld') {
    return {
      sicher: `Alle ${nomen} sind ${wort}.`,
      wahrscheinlich: `Mehr als die Hälfte der ${nomen} ist ${wort}.`,
      unwahrscheinlich: `Weniger als die Hälfte der ${nomen} ist ${wort}.`,
      unmoeglich: `${einzahl === 'Feld' ? 'Kein' : 'Keine'} ${einzahl} ist ${wort}.`
    }[stufe];
  }
  function begruendungen(Z, richtigeStufe, wort, leicht, nomen, einzahl) {
    const andere = mische(Z, STUFEN4.filter(s => s !== richtigeStufe)).slice(0, leicht ? 1 : 2);
    return mische(Z, [richtigeStufe, ...andere]).map(s => ({ stufe: s, text: begruendung(s, wort, nomen, einzahl), richtig: s === richtigeStufe }));
  }

  /* ---------- A. Einordnen ---------- */
  function einordnen(stufe, Z) {
    const leicht = stufe === 'leicht';
    const soll = waehle(Z, leicht ? ['sicher', 'unmoeglich'] : STUFEN4);
    for (let v = 0; v < 2000; v++) {
      const n = waehle(Z, leicht ? [4, 6] : [6, 8]);
      const nFarben = leicht ? (soll === 'sicher' ? 1 : 2) : (soll === 'sicher' && Z.zahl(2) ? 1 : 2 + Z.zahl(2));
      if (nFarben > n) continue;
      const inRad = mische(Z, FARBEN().map(f => f.id)).slice(0, nFarben);
      const k = verteile(Z, inRad, n);
      if (!leicht && FK().dreiGleich(k)) continue;
      if (leicht && soll === 'unmoeglich' && k[inRad[0]] === k[inRad[1]]) continue;
      const draussen = FARBEN().map(f => f.id).filter(id => !k[id]);
      let art = 'eine';
      if (!leicht) { const r = Z.zahl(10); art = r < 6 ? 'eine' : r < 8 ? 'oder' : 'nicht'; }
      if (art === 'oder' && inRad.length < 3) art = 'eine';
      const ziel = art === 'oder' ? mische(Z, inRad).slice(0, 2) : [waehle(Z, Z.zahl(4) === 0 && draussen.length ? draussen : (soll === 'unmoeglich' && art === 'eine' ? draussen : inRad))];
      const z = E().zaehleKiste(k, ziel);
      const treffer = art === 'nicht' ? z.gesamt - z.treffer : z.treffer;
      const ist = E().einordnen(treffer, z.gesamt);
      if (ist !== soll) continue;
      const wort = satzAdj(ziel);
      const begrStufe = art === 'nicht' ? UMGEKEHRT[soll] : soll;
      const satz = art === 'nicht' ? `Das Rad bleibt nicht auf ${satzName(ziel)} stehen.` : `Das Rad bleibt auf ${satzName(ziel)} stehen.`;
      const erklaerung = soll === 'unmoeglich' && art !== 'nicht'
        ? `Auf dem Rad ist kein ${F(ziel[0]).akk}s Feld. Darum ist das unmöglich.`
        : `${z.treffer} von ${n} Feldern ${z.treffer === 1 ? 'ist' : 'sind'} ${wort}. Darum ist das ${E().wort(soll)}.`;
      return { art: 'einordnen', stufe, felder: felderAus(Z, k), anzahlen: k, satzArt: art, ziel, satz, loesung: soll,
        antworten: leicht ? ['sicher', 'unmoeglich'] : STUFEN4.slice(), begruendungen: begruendungen(Z, begrStufe, wort, leicht), erklaerung };
    }
    throw new Error('Glücksrad einordnen: kein Rad gefunden');
  }

  /* ---------- B. Rad gestalten ---------- */
  function satzBedingung(b) {
    if (b.typ === 'vergleich') return b.soll === 'gleich' ? `${F(b.a).name} und ${F(b.b).name} haben die gleiche Chance.` : `${F(b.a).name} hat eine größere Chance als ${F(b.b).name}, aber ${F(b.b).name} ist möglich.`;
    const n = F(b.farben[0]).name;
    return {
      sicher: `Das Rad bleibt sicher auf ${n} stehen.`,
      unmoeglich: `Es ist unmöglich, dass das Rad auf ${n} stehen bleibt.`,
      wahrscheinlich: `Es ist wahrscheinlich, dass das Rad auf ${n} stehen bleibt.`,
      unwahrscheinlich: `Es ist unwahrscheinlich, dass das Rad auf ${n} stehen bleibt.`
    }[b.soll];
  }
  function gestalten(stufe, Z) {
    const plaetze = stufe === 'leicht' ? 6 : 8;
    const ids = mische(Z, FARBEN().map(f => f.id));
    let bedingungen;
    if (stufe === 'leicht') bedingungen = [{ typ: 'stufe', farben: [ids[0]], soll: waehle(Z, ['sicher', 'unmoeglich']) }];
    else if (stufe === 'mittel') bedingungen = [{ typ: 'stufe', farben: [ids[0]], soll: waehle(Z, ['wahrscheinlich', 'unwahrscheinlich', 'wahrscheinlich', 'unwahrscheinlich', 'unmoeglich', 'sicher']) }];
    else {
      const v = Z.zahl(3);
      if (v === 0) bedingungen = [{ typ: 'stufe', farben: [ids[0]], soll: 'wahrscheinlich' }, { typ: 'stufe', farben: [ids[1]], soll: 'unmoeglich' }];
      else if (v === 1) bedingungen = [{ typ: 'vergleich', a: ids[0], b: ids[1], soll: 'gleich' }];
      else bedingungen = [{ typ: 'vergleich', a: ids[0], b: ids[1], soll: 'groesser' }];
    }
    const satz = bedingungen.length === 2 ? `${F(ids[0]).name} ist wahrscheinlich, und ${F(ids[1]).name} ist unmöglich.` : satzBedingung(bedingungen[0]);
    /* Prüfung über die Anzahlen; die Reihenfolge der Felder spielt keine Rolle */
    const pruefe = felder => felder.length === plaetze && felder.every(Boolean) && bedingungen.every(b => FK().bedingungErfuellt(b, CB.rad.anzahlen(felder)));
    const loesungen = FK().alleKisten(plaetze).filter(k => summe(k) === plaetze && bedingungen.every(b => FK().bedingungErfuellt(b, k)));
    if (!loesungen.length) throw new Error('Glücksrad gestalten: keine Lösung für ' + satz);
    return { art: 'gestalten', stufe, plaetze, bedingungen, satz, pruefe, beispiel: felderAus(Z, waehle(Z, loesungen)), anzahlLoesungen: loesungen.length };
  }

  /* ---------- C. Vermuten, dann drehen ---------- */
  function vermuten(stufe, Z) {
    for (let v = 0; v < 2000; v++) {
      const n = waehle(Z, [6, 8]);
      const inRad = mische(Z, FARBEN().map(f => f.id)).slice(0, 2 + Z.zahl(2));
      const k = verteile(Z, inRad, n);
      const max = Math.max(...Object.values(k));
      const oben = Object.keys(k).filter(f => k[f] === max);
      if (oben.length !== 1) continue;
      return { art: 'vermuten', stufe, felder: felderAus(Z, k), anzahlen: k, loesung: oben[0], zuege: CB.config.fuehlkiste.vermutenZuege, antworten: inRad.slice() };
    }
    throw new Error('Glücksrad vermuten: kein Rad gefunden');
  }
  const vermutungPasst = (a, farbe) => farbe === a.loesung;

  /* ---------- D. Knifflig ---------- */
  function gleicheChance(stufe, Z) {
    for (let v = 0; v < 2000; v++) {
      const ziel = waehle(Z, FARBEN().map(f => f.id));
      const andere = FARBEN().map(f => f.id).filter(id => id !== ziel);
      const zahlen = [1 + Z.zahl(6), 1 + Z.zahl(6), 1 + Z.zahl(6)];   /* 1 bis 6 Zielfelder von 8 */
      const gleich = [0, 1, 2].filter(i => zahlen.filter(z => z === zahlen[i]).length >= 2);
      if (gleich.length < 2) continue;   /* genau zwei oder alle drei gleich */
      const raeder = zahlen.map(t => {
        const k = { [ziel]: t };
        const rest = 8 - t;
        Object.assign(k, verteile(Z, mische(Z, andere).slice(0, rest >= 2 ? 1 + Z.zahl(2) : 1), rest));
        return felderAus(Z, k);
      });
      const namen = gleich.map(i => 'Rad ' + 'ABC'[i]);
      const erklaerung = gleich.length === 3
        ? `Auf allen drei Rädern ${zahlen[0] === 1 ? 'ist' : 'sind'} je ${zahlen[0]} von 8 Feldern ${F(ziel).adj}. Überall hat ${F(ziel).name} die gleiche Chance.`
        : `Auf ${namen.join(' und ')} ${zahlen[gleich[0]] === 1 ? 'ist' : 'sind'} je ${zahlen[gleich[0]]} von 8 Feldern ${F(ziel).adj}. Dort hat ${F(ziel).name} die gleiche Chance. Auf Rad ${'ABC'[[0, 1, 2].find(i => !gleich.includes(i))]} ${zahlen[[0, 1, 2].find(i => !gleich.includes(i))] === 1 ? 'ist es' : 'sind es'} ${zahlen[[0, 1, 2].find(i => !gleich.includes(i))]}.`;
      return { art: 'gleicheChance', stufe, raeder, ziel, zielAnzahlen: zahlen, loesung: gleich,
        satz: `Bei welchen Rädern hat ${F(ziel).name} die gleiche Chance? Tippe alle an, die passen.`, erklaerung };
    }
    throw new Error('gleicheChance: keine Räder gefunden');
  }

  function groessereChance(stufe, Z) {
    const soll = waehle(Z, ['a', 'b', 'gleich']);
    for (let v = 0; v < 2000; v++) {
      const inRad = mische(Z, FARBEN().map(f => f.id)).slice(0, 2 + Z.zahl(2));
      const k = verteile(Z, inRad, 8);
      const [a, b] = mische(Z, inRad);
      const ist = k[a] > k[b] ? 'a' : k[a] < k[b] ? 'b' : 'gleich';
      if (ist !== soll) continue;
      const erklaerung = `${k[a]} ${k[a] === 1 ? 'Feld ist' : 'Felder sind'} ${F(a).adj}, ${k[b]} ${k[b] === 1 ? 'Feld ist' : 'Felder sind'} ${F(b).adj}. ` +
        (ist === 'gleich' ? 'Beide haben die gleiche Chance.' : `${F(ist === 'a' ? a : b).name} hat die größere Chance.`);
      return { art: 'groessereChance', stufe, felder: felderAus(Z, k), anzahlen: k, a, b, loesung: ist,
        satz: `Was ist wahrscheinlicher: ${F(a).name} oder ${F(b).name}?`,
        antworten: [{ id: 'a', text: `${F(a).name} hat die größere Chance.` }, { id: 'b', text: `${F(b).name} hat die größere Chance.` }, { id: 'gleich', text: 'Beide haben die gleiche Chance.' }], erklaerung };
    }
    throw new Error('groessereChance: kein Rad gefunden');
  }

  /* Zahlenrad: Merkmale */
  const REIHEN = { 3: 'Dreier', 4: 'Vierer', 5: 'Fünfer', 6: 'Sechser', 7: 'Siebener', 8: 'Achter', 9: 'Neuner' };
  const reihe = m => Array.from({ length: 10 }, (_, i) => m * (i + 1));
  function merkmalWaehlen(Z) {
    const art = waehle(Z, ['gerade', 'ungerade', 'groesser', 'kleiner', 'reihe', 'reihe']);
    if (art === 'gerade') return { art, text: 'eine gerade Zahl', wort: 'gerade', passt: z => z % 2 === 0 };
    if (art === 'ungerade') return { art, text: 'eine ungerade Zahl', wort: 'ungerade', passt: z => z % 2 === 1 };
    if (art === 'groesser') { const g = waehle(Z, [10, 20, 30, 40, 50, 60, 70]); return { art, g, text: `eine Zahl größer als ${g}`, wort: `größer als ${g}`, passt: z => z > g }; }
    if (art === 'kleiner') { const g = waehle(Z, [20, 30, 40, 50, 60]); return { art, g, text: `eine Zahl kleiner als ${g}`, wort: `kleiner als ${g}`, passt: z => z < g }; }
    const m = waehle(Z, [3, 4, 5, 6, 7, 8, 9]);
    const r = reihe(m);
    return { art, m, text: `eine Zahl aus der ${REIHEN[m]}reihe`, wort: `aus der ${REIHEN[m]}reihe`, reihe: r, passt: z => r.includes(z) };
  }
  function zahlenrad(stufe, Z) {
    const soll = waehle(Z, STUFEN4);
    const bereich = { sicher: [8], wahrscheinlich: [5, 6, 7], unwahrscheinlich: [1, 2, 3], unmoeglich: [0] }[soll];
    for (let v = 0; v < 5000; v++) {
      const mk = merkmalWaehlen(Z);
      const t = waehle(Z, bereich);
      const ja = [], nein = [];
      for (let z = 1; z <= 100; z++) (mk.passt(z) ? ja : nein).push(z);
      if (ja.length < t || nein.length < 8 - t) continue;
      const zahlen = mische(Z, mische(Z, ja).slice(0, t).concat(mische(Z, nein).slice(0, 8 - t)));
      const passend = zahlen.filter(mk.passt);
      const ist = E().einordnen(passend.length, 8);
      if (ist !== soll) continue;
      const richtigeStufe = soll;
      const erklaerung = passend.length
        ? `${passend.length} von 8 Zahlen ${passend.length === 1 ? 'ist' : 'sind'} ${mk.wort}: ${passend.slice().sort((a, b) => a - b).join(', ')}. Darum ist das ${E().wort(soll)}.`
        : `Keine Zahl auf dem Rad ist ${mk.wort}. Darum ist das unmöglich.`;
      return { art: 'zahlenrad', stufe, zahlen, felder: zahlen.map(() => 'zahl'), merkmal: { art: mk.art, g: mk.g, m: mk.m, wort: mk.wort, reihe: mk.reihe },
        passend: zahlen.map((z, i) => (mk.passt(z) ? i : -1)).filter(i => i >= 0),
        satz: `Das Rad zeigt ${mk.text}.`, loesung: soll, antworten: STUFEN4.slice(),
        begruendungen: begruendungen(Z, richtigeStufe, mk.wort, false, 'Zahlen', 'Zahl'), erklaerung };
    }
    throw new Error('zahlenrad: kein Rad gefunden');
  }
  /* Prüft eine Zahl gegen das gespeicherte Merkmal (für den Test, unabhängig von passt()) */
  function merkmalPasst(mk, z) {
    if (mk.art === 'gerade') return z % 2 === 0;
    if (mk.art === 'ungerade') return z % 2 === 1;
    if (mk.art === 'groesser') return z > mk.g;
    if (mk.art === 'kleiner') return z < mk.g;
    return z % mk.m === 0 && z <= 10 * mk.m;
  }

  /* ---------- Runde ---------- */
  const PLAN = {
    leicht: ['einordnen', 'einordnen', 'gestalten', 'einordnen', 'einordnen', 'gestalten'],
    mittel: ['einordnen', 'einordnen', 'gestalten', 'vermuten', 'einordnen', 'gestalten'],
    knifflig: ['gleicheChance', 'groessereChance', 'zahlenrad', 'gestalten', 'zahlenrad', 'einordnen']
  };
  const BAUER = { einordnen, gestalten, vermuten, gleicheChance, groessereChance, zahlenrad };
  function runde(stufe, Z = CB.zufall) {
    if (!PLAN[stufe]) throw new Error('Unbekannte Stufe: ' + stufe);
    return PLAN[stufe].map(art => BAUER[art](art === 'einordnen' && stufe === 'knifflig' ? 'mittel' : stufe, Z));
  }

  CB.gluecksradAufgaben = { runde, einordnen, gestalten, vermuten, gleicheChance, groessereChance, zahlenrad, vermutungPasst, merkmalPasst, PLAN, REIHEN };
})();
