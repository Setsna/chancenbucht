/* Chancenbucht: Aufgabengenerator der Station Fühlkiste (Etappe 2b).
   Klassisches Skript, legt window.CB.fuehlkisteAufgaben an. Braucht CB.config, CB.zufall, CB.einordnung.

   Alle Lösungen werden aus dem Inhalt der Kiste BERECHNET (CB.einordnung), nie aus einer Liste gelesen.
   Texte nach Dateien/Beispiele-Entwuerfe/fuehlkiste.md (von Ingo freigegeben am 15.11.2026).
   Regeln, die der Aufgaben-Test prüft (tools/aufgaben-test.html):
   - jede Einordnungsaufgabe hat genau eine richtige Stufe und genau eine passende Begründung unter den gezeigten
   - nie „genau die Hälfte“, nie eine leere Kiste
   - in leicht und mittel keine Kiste mit drei gleich großen Farben (Ingo, 15.11.2026)
   - leicht: nur sicher und unmöglich
   - zwei Kisten haben immer gleich viele Kugeln (Ingo, 15.11.2026)
   - jede Füll-Aufgabe hat mindestens eine Lösung; die Beispielkiste ist eine davon
   - beim Vermuten gibt es genau eine Farbe mit den meisten Kugeln
   Ziehen immer MIT Zurücklegen. Jede Funktion bekommt die Zufallsquelle Z (CB.zufall oder mitStartwert). */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const E = () => CB.einordnung;
  const FARBEN = () => CB.config.farben;
  const F = id => FARBEN().find(f => f.id === id);
  const STUFEN4 = ['sicher', 'wahrscheinlich', 'unwahrscheinlich', 'unmoeglich'];

  const waehle = (Z, liste) => liste[Z.zahl(liste.length)];
  function mische(Z, liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Z.zahl(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const summe = k => Object.values(k).reduce((s, n) => s + n, 0);
  /* gesamt Kugeln auf die Farben verteilen, jede mindestens 1 */
  function verteile(Z, farben, gesamt) {
    const k = {}; farben.forEach(f => { k[f] = 1; });
    for (let i = farben.length; i < gesamt; i++) k[waehle(Z, farben)]++;
    return k;
  }
  const dreiGleich = k => { const w = Object.values(k).filter(n => n > 0); return w.length >= 3 && w.every(n => n === w[0]); };
  const satzFarben = ids => ids.map(id => F(id).adj).join(' oder ');
  const satzAkk = ids => ids.map(id => F(id).akk).join(' oder ');

  /* ---------- A. Einordnen ---------- */
  /* Begründungen. art 'eine'/'oder': über die Zielfarben; art 'keine': über die genannte Farbe, umgekehrt zugeordnet. */
  function begruendungsText(stufe, wort) {
    return {
      sicher: `Alle Kugeln sind ${wort}.`,
      wahrscheinlich: `Mehr als die Hälfte der Kugeln ist ${wort}.`,
      unwahrscheinlich: `Weniger als die Hälfte der Kugeln ist ${wort}.`,
      unmoeglich: `Keine Kugel ist ${wort}.`
    }[stufe];
  }
  const UMGEKEHRT = { sicher: 'unmoeglich', wahrscheinlich: 'unwahrscheinlich', unwahrscheinlich: 'wahrscheinlich', unmoeglich: 'sicher' };

  function einordnen(stufe, Z) {
    const leicht = stufe === 'leicht';
    const soll = waehle(Z, leicht ? ['sicher', 'unmoeglich'] : STUFEN4);
    for (let versuch = 0; versuch < 2000; versuch++) {
      const gesamt = leicht ? 6 : 6 + Z.zahl(5);                 /* 6 bis 10 */
      const nFarben = leicht ? (soll === 'sicher' ? 1 : 2) : (soll === 'sicher' && Z.zahl(2) ? 1 : 2 + Z.zahl(2));
      const inKiste = mische(Z, FARBEN().map(f => f.id)).slice(0, nFarben);
      const kiste = verteile(Z, inKiste, gesamt);
      if (!leicht && dreiGleich(kiste)) continue;
      if (leicht && soll === 'unmoeglich' && kiste[inKiste[0]] === kiste[inKiste[1]]) continue;   /* leicht: klare Kisten, kein 3 zu 3 */
      const draussen = FARBEN().map(f => f.id).filter(id => !kiste[id]);
      /* Art des Satzes */
      let art = 'eine';
      if (!leicht) { const r = Z.zahl(10); art = r < 6 ? 'eine' : r < 8 ? 'oder' : 'keine'; }
      if (art === 'oder' && inKiste.length < 3) art = 'eine';
      let ziel;
      if (art === 'oder') ziel = mische(Z, inKiste).slice(0, 2);
      else ziel = [waehle(Z, Z.zahl(4) === 0 && draussen.length ? draussen : (soll === 'unmoeglich' && art === 'eine' ? draussen : inKiste))];
      const z = E().zaehleKiste(kiste, ziel);
      const treffer = art === 'keine' ? z.gesamt - z.treffer : z.treffer;
      const stufeIst = E().einordnen(treffer, z.gesamt);
      if (stufeIst !== soll || stufeIst === 'haelfte') continue;
      /* Begründungen: richtige plus andere (leicht: eine, sonst zwei) */
      const wort = satzFarben(ziel);
      const begrStufe = art === 'keine' ? UMGEKEHRT[soll] : soll;
      const andere = mische(Z, STUFEN4.filter(s => s !== begrStufe)).slice(0, leicht ? 1 : 2);
      const begruendungen = mische(Z, [begrStufe, ...andere]).map(s => ({ stufe: s, text: begruendungsText(s, wort), richtig: s === begrStufe }));
      const satz = art === 'keine' ? `Ich ziehe keine ${satzAkk(ziel)} Kugel.` : `Ich ziehe eine ${satzAkk(ziel)} Kugel.`;
      const anzahlZiel = z.treffer;
      const erklaerung = soll === 'unmoeglich' && art !== 'keine'
        ? `In der Kiste ist keine ${satzAkk(ziel)} Kugel. Darum ist das unmöglich.`
        : `${anzahlZiel} von ${z.gesamt} Kugeln ${anzahlZiel === 1 ? 'ist' : 'sind'} ${wort}. Darum ist das ${E().wort(soll)}.`;
      return { art: 'einordnen', stufe, kiste, satzArt: art, ziel, satz, loesung: soll, antworten: leicht ? ['sicher', 'unmoeglich'] : STUFEN4.slice(), begruendungen, erklaerung };
    }
    throw new Error('einordnen: keine passende Kiste gefunden');
  }

  /* ---------- B. Kiste füllen ---------- */
  function alleKisten(plaetze) {
    const ids = FARBEN().map(f => f.id), aus = [];
    (function rek(i, rest, k) {
      if (i === ids.length - 1) { aus.push({ ...k, [ids[i]]: rest }); return; }
      for (let n = 0; n <= rest; n++) rek(i + 1, rest - n, { ...k, [ids[i]]: n });
    })(0, plaetze, {});
    return aus.map(k => Object.fromEntries(Object.entries(k).filter(([, n]) => n > 0)));
  }
  function bedingungErfuellt(b, kiste) {
    const s = summe(kiste);
    if (s < 1) return false;
    if (b.typ === 'stufe') return E().ausKiste(kiste, b.farben) === b.soll;
    if (b.typ === 'vergleich') {
      const za = E().zaehleKiste(kiste, b.a), zb = E().zaehleKiste(kiste, b.b);
      if (za.treffer < 1 || zb.treffer < 1) return false;   /* beide müssen möglich sein */
      return E().vergleiche(za, zb) === b.soll;
    }
    return false;
  }
  function bedingungsSatz(b) {
    if (b.typ === 'vergleich') {
      return b.soll === 'gleich' ? `${F(b.a).name} und ${F(b.b).name} sind genauso wahrscheinlich.` : `${F(b.a).name} ist wahrscheinlicher als ${F(b.b).name}, aber ${F(b.b).name} ist möglich.`;
    }
    const akk = satzAkk(b.farben);
    return {
      sicher: `Ich ziehe sicher eine ${akk} Kugel.`,
      unmoeglich: `Es ist unmöglich, eine ${akk} Kugel zu ziehen.`,
      wahrscheinlich: `Es ist wahrscheinlich, eine ${akk} Kugel zu ziehen.`,
      unwahrscheinlich: `Es ist unwahrscheinlich, eine ${akk} Kugel zu ziehen.`
    }[b.soll];
  }

  function fuellen(stufe, Z) {
    const plaetze = stufe === 'leicht' ? 6 : 8;
    const ids = mische(Z, FARBEN().map(f => f.id));
    let bedingungen, satz;
    if (stufe === 'leicht') {
      bedingungen = [{ typ: 'stufe', farben: [ids[0]], soll: waehle(Z, ['sicher', 'unmoeglich']) }];
    } else if (stufe === 'mittel') {
      bedingungen = [{ typ: 'stufe', farben: [ids[0]], soll: waehle(Z, ['wahrscheinlich', 'unwahrscheinlich', 'wahrscheinlich', 'unwahrscheinlich', 'unmoeglich', 'sicher']) }];
    } else {
      const v = Z.zahl(3);
      if (v === 0) bedingungen = [{ typ: 'stufe', farben: [ids[0]], soll: 'wahrscheinlich' }, { typ: 'stufe', farben: [ids[1]], soll: 'unmoeglich' }];
      else if (v === 1) bedingungen = [{ typ: 'vergleich', a: ids[0], b: ids[1], soll: 'gleich' }];
      else bedingungen = [{ typ: 'vergleich', a: ids[0], b: ids[1], soll: 'groesser' }];
    }
    if (bedingungen.length === 2) satz = `${F(ids[0]).name} ist wahrscheinlich, und ${F(ids[1]).name} ist unmöglich.`;
    else satz = bedingungsSatz(bedingungen[0]);
    const pruefe = kiste => summe(kiste) === plaetze && bedingungen.every(b => bedingungErfuellt(b, kiste));
    const loesungen = alleKisten(plaetze).filter(pruefe);
    if (!loesungen.length) throw new Error('fuellen: keine Lösung für ' + satz);
    return { art: 'fuellen', stufe, plaetze, bedingungen, satz, pruefe, beispiel: waehle(Z, loesungen), anzahlLoesungen: loesungen.length };
  }

  /* ---------- C. Vermuten, dann ziehen ---------- */
  function vermuten(stufe, Z) {
    for (let versuch = 0; versuch < 2000; versuch++) {
      const gesamt = 6 + Z.zahl(5);
      const inKiste = mische(Z, FARBEN().map(f => f.id)).slice(0, 2 + Z.zahl(2));
      const kiste = verteile(Z, inKiste, gesamt);
      const max = Math.max(...Object.values(kiste));
      const oben = Object.keys(kiste).filter(id => kiste[id] === max);
      if (oben.length !== 1) continue;
      return { art: 'vermuten', stufe, kiste, loesung: oben[0], zuege: CB.config.fuehlkiste.vermutenZuege, antworten: inKiste.slice() };
    }
    throw new Error('vermuten: keine Kiste gefunden');
  }
  /* Bewertet nur die Vermutung im Verhältnis zur Kiste, nie den Ausgang */
  const vermutungPasst = (aufgabe, farbe) => farbe === aufgabe.loesung;

  /* ---------- Knifflig: Vergleichen, zwei Kisten, verdeckte Kiste ---------- */
  function vergleichen(stufe, Z) {
    const gesamt = 6 + Z.zahl(3);                  /* 6 bis 8 */
    const soll = waehle(Z, ['a', 'b', 'gleich']);
    for (let versuch = 0; versuch < 2000; versuch++) {
      const inKiste = mische(Z, FARBEN().map(f => f.id)).slice(0, 2 + Z.zahl(2));
      const kiste = verteile(Z, inKiste, gesamt);
      const [a, b] = mische(Z, inKiste);
      const v = E().vergleiche(E().zaehleKiste(kiste, a), E().zaehleKiste(kiste, b));
      const ist = v === 'groesser' ? 'a' : v === 'kleiner' ? 'b' : 'gleich';
      if (ist !== soll) continue;
      const na = kiste[a], nb = kiste[b];
      const erklaerung = ist === 'gleich'
        ? `Es sind ${na} ${F(a).plural} und ${nb} ${F(b).plural} Kugeln drin, gleich viele. ${F(a).name} ist genauso wahrscheinlich wie ${F(b).name}.`
        : `Es sind ${na} ${F(a).plural} und ${nb} ${F(b).plural} Kugeln drin. ${F(ist === 'a' ? a : b).name} ist wahrscheinlicher als ${F(ist === 'a' ? b : a).name}.`;
      return { art: 'vergleichen', stufe, kiste, a, b, satz: `Was ziehst du eher: eine ${F(a).akk} oder eine ${F(b).akk} Kugel?`, loesung: ist,
        antworten: [{ id: 'a', text: `Eher ${F(a).adj}.` }, { id: 'b', text: `Eher ${F(b).adj}.` }, { id: 'gleich', text: 'Beides ist genauso wahrscheinlich.' }], erklaerung };
    }
    throw new Error('vergleichen: keine Kiste gefunden');
  }

  function zweiKisten(stufe, Z) {
    const gesamt = waehle(Z, [6, 8]);
    const soll = waehle(Z, ['A', 'B', 'gleich']);
    for (let versuch = 0; versuch < 2000; versuch++) {
      const ziel = waehle(Z, FARBEN().map(f => f.id));
      const andere = FARBEN().map(f => f.id).filter(id => id !== ziel);
      const baue = () => {
        const n = Z.zahl(gesamt + 1);   /* 0 bis gesamt Zielkugeln */
        const k = n ? { [ziel]: n } : {};
        const rest = gesamt - n;
        if (rest) Object.assign(k, verteile(Z, mische(Z, andere).slice(0, rest >= 2 ? 1 + Z.zahl(2) : 1), rest));
        return k;
      };
      const A = baue(), B = baue();
      if (summe(A) !== gesamt || summe(B) !== gesamt) continue;
      const v = E().vergleiche(E().zaehleKiste(A, ziel), E().zaehleKiste(B, ziel));
      const ist = v === 'groesser' ? 'A' : v === 'kleiner' ? 'B' : 'gleich';
      if (ist !== soll) continue;
      if (ist === 'gleich' && !A[ziel]) continue;   /* „gleich“ nicht als „bei beiden unmöglich“ */
      const erklaerung = `In Kiste A sind ${A[ziel] || 0} ${F(ziel).plural} von ${gesamt} Kugeln, in Kiste B ${B[ziel] || 0} von ${gesamt}. ` +
        (ist === 'gleich' ? `Bei beiden ist ${F(ziel).name} genauso wahrscheinlich.` : `Aus Kiste ${ist} ziehst du eher ${F(ziel).name}.`);
      return { art: 'zweiKisten', stufe, kisten: { A, B }, ziel, gesamt, loesung: ist,
        satz: `Du darfst aus einer Kiste ziehen. Du möchtest eine ${F(ziel).akk} Kugel. Welche Kiste nimmst du?`,
        antworten: [{ id: 'A', text: 'Kiste A' }, { id: 'B', text: 'Kiste B' }, { id: 'gleich', text: 'Das ist bei beiden gleich.' }], erklaerung };
    }
    throw new Error('zweiKisten: keine Kisten gefunden');
  }

  /* Verdeckte Kiste: drei Kisten zur Wahl, eine wird heimlich genommen.
     Bewertet wird, ob die Wahl zu den gezogenen Kugeln passt (größte Wahrscheinlichkeit der Beobachtung),
     nicht, ob richtig geraten wurde. */
  function verdeckt(stufe, Z) {
    const [x, y] = mische(Z, FARBEN().map(f => f.id));
    const kisten = [{ [x]: 5, [y]: 1 }, { [x]: 3, [y]: 3 }, { [x]: 1, [y]: 5 }];
    return { art: 'verdeckt', stufe, kisten, wahr: Z.zahl(3), farben: [x, y], zuege: CB.config.fuehlkiste.verdecktZuege,
      satz: 'Ich habe heimlich eine dieser drei Kisten genommen. Zieh Kugeln und schau auf die Strichliste. Welche Kiste war es?' };
  }
  /* Indizes der Kisten, zu denen die Zählung am besten passt. zaehlung { farbe: anzahl } */
  function passendeKisten(kisten, zaehlung) {
    const lw = kisten.map(k => {
      const g = summe(k); let l = 0;
      for (const [farbe, n] of Object.entries(zaehlung)) {
        if (!n) continue;
        const p = (k[farbe] || 0) / g;
        if (p === 0) return -Infinity;
        l += n * Math.log(p);
      }
      return l;
    });
    const best = Math.max(...lw);
    return lw.map((l, i) => (Math.abs(l - best) < 1e-9 ? i : -1)).filter(i => i >= 0);
  }

  /* ---------- Eine Runde ---------- */
  const PLAN = {
    leicht: ['einordnen', 'einordnen', 'fuellen', 'einordnen', 'einordnen', 'fuellen'],
    mittel: ['einordnen', 'einordnen', 'fuellen', 'vermuten', 'einordnen', 'fuellen'],
    knifflig: ['vergleichen', 'zweiKisten', 'fuellen', 'einordnen', 'vergleichen', 'verdeckt']
  };
  const BAUER = { einordnen, fuellen, vermuten, vergleichen, zweiKisten, verdeckt };
  function runde(stufe, Z = CB.zufall) {
    if (!PLAN[stufe]) throw new Error('Unbekannte Stufe: ' + stufe);
    /* In knifflig ist die eine Einordnungsaufgabe auf mittlerem Niveau (Wiederholung) */
    return PLAN[stufe].map(art => BAUER[art](art === 'einordnen' && stufe === 'knifflig' ? 'mittel' : stufe, Z));
  }

  CB.fuehlkisteAufgaben = { runde, einordnen, fuellen, vermuten, vergleichen, zweiKisten, verdeckt,
    vermutungPasst, passendeKisten, bedingungErfuellt, alleKisten, PLAN, dreiGleich };
})();
