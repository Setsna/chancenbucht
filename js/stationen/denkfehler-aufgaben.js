/* Chancenbucht: Aufgabengenerator der Station „Kann das stimmen?“ (Etappe 5b).
   Klassisches Skript, legt window.CB.denkfehlerAufgaben an. Braucht CB.config (farben), CB.einordnung.

   Texte nach Dateien/Beispiele-Entwuerfe/denkfehler.md (von Ingo freigegeben am 15.11.2026).
   Fachlich:
   - Würfi behauptet etwas. Ob es stimmt, wird aus dem Inhalt (Kiste, Rad, Würfel) BERECHNET, nie aus einem Versuch.
   - Jede Szene hat eine falsche und eine wahre Behauptung. Je Runde stimmen genau 2 von 6.
   - Es wird immer zurückgelegt. Keine Brüche, keine Prozent: Kisten werden über die Hälfte-Regel verglichen.
   Regeln, die tools/muenze-test.html prüft:
   - stimmt = berechneter Wert aus dem Material; loesung passt dazu
   - genau eine passende Begründung, Ablenker sind nicht gleich
   - Szene 7: eine Kiste mehr als die Hälfte rot, die andere weniger; bei „falsch“ hat A mehr rote Kugeln, aber die kleinere Chance
   - Runde: Szenen der Stufe je zweimal, genau 2 wahre Behauptungen */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const E = () => CB.einordnung;
  const waehle = (Z, l) => l[Z.zahl(l.length)];
  const zwischen = (Z, a, b) => a + Z.zahl(b - a + 1);
  function mische(Z, l) { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Z.zahl(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const ANTWORTEN = [{ id: 'ja', text: 'Das stimmt.' }, { id: 'nein', text: 'Das stimmt nicht.' }];
  const felder = n => (n === 1 ? '1 Feld' : `${n} Felder`);
  const W = s => E().anzahlWege(s);
  const wuerfeWort = n => (n === 1 ? '1 Wurf' : `${n} Würfe`);
  const chanceKiste = (k, f) => E().zaehleKiste(k, f);
  const chanceRad = (r, f) => E().zaehleRad(r, f);
  const begr = (Z, richtig, falsche) => mische(Z, [{ text: richtig, richtig: true }, ...falsche.map(text => ({ text, richtig: false }))]);

  /* Jede Szene: (wahr, Z) → { material, behauptung, stimmt, begruendungen, erklaerung, versuch, vorher? } */
  const SZENEN = {
    /* 1. Ausgleich (Kiste, mit Zurücklegen) */
    ausgleich(wahr, Z) {
      const kiste = { blau: zwischen(Z, 2, 6), rot: zwischen(Z, 2, 6) };
      const vorher = { blau: kiste.blau, rot: kiste.rot };   /* gezogene Kugeln kommen zurück: Kiste unverändert */
      const nachher = { blau: kiste.blau, rot: kiste.rot };
      const behauptung = wahr ? 'Ich habe dreimal Blau gezogen. Rot hat jetzt die gleiche Chance wie vorher.' : 'Ich habe dreimal Blau gezogen. Jetzt kommt sicher Rot.';
      const stimmt = wahr ? E().vergleiche(chanceKiste(nachher, 'rot'), chanceKiste(vorher, 'rot')) === 'gleich' : E().ausKiste(nachher, 'rot') === 'sicher';
      return { szene: 'ausgleich', material: { typ: 'kiste', kiste }, gezogen: ['blau', 'blau', 'blau'], behauptung, stimmt,
        begruendungen: begr(Z, 'Die Kugeln kommen zurück. In der Kiste ändert sich nichts.', ['Rot ist jetzt dran.', 'Blau ist leer.']),
        erklaerung: `Die Kugeln kommen immer zurück. In der Kiste sind weiter ${kiste.rot} rote und ${kiste.blau} blaue Kugeln. Rot ist nicht dran.`,
        versuch: { typ: 'kisteAuszaehlen', n: 100, farbe: 'blau', laenge: 3 } };
    },
    /* 2. Lieblingsfarbe (Rad mit gleich vielen Feldern) */
    lieblingsfarbe(wahr, Z) {
      const n = zwischen(Z, 2, 4);
      const rad = [{ farbe: 'rot', felder: n }, { farbe: 'blau', felder: n }];
      const v = E().vergleiche(chanceRad(rad, 'rot'), chanceRad(rad, 'blau'));
      const behauptung = wahr ? 'Rot ist meine Lieblingsfarbe. Trotzdem hat Rot hier die gleiche Chance wie Blau.' : 'Rot ist meine Lieblingsfarbe. Darum kommt Rot öfter.';
      return { szene: 'lieblingsfarbe', material: { typ: 'rad', rad }, behauptung, stimmt: wahr ? v === 'gleich' : v === 'groesser',
        begruendungen: begr(Z, 'Beide Farben haben gleich viele Felder.', ['Würfi mag Rot, darum dreht das Rad zu Rot.', 'Rot ist eine helle Farbe.']),
        erklaerung: `Das Rad weiß nicht, welche Farbe ich mag. Beide Farben haben ${felder(n)}.`,
        versuch: { typ: 'rad', n: 100 } };
    },
    /* 3. Selten heißt nicht unmöglich (Rad) */
    selten(wahr, Z) {
      const gesamt = waehle(Z, [6, 8]);
      const rad = wahr ? [{ farbe: 'blau', felder: gesamt }] : [{ farbe: 'gelb', felder: 1 }, { farbe: 'blau', felder: gesamt - 1 }];
      const stimmt = E().ausRad(rad, 'gelb') === 'unmoeglich';
      return { szene: 'selten', material: { typ: 'rad', rad }, vorher: ['blau', 'blau', 'blau', 'blau', 'blau'],
        behauptung: wahr ? 'Bei diesem Rad ist Gelb unmöglich.' : 'Ich habe 5-mal gedreht und nie Gelb bekommen. Gelb ist unmöglich.', stimmt,
        begruendungen: wahr ? begr(Z, 'Kein Feld ist gelb.', ['Gelb kam 5-mal nicht.', 'Gelb ist selten.'])
          : begr(Z, 'Ein Feld ist gelb. Gelb kann kommen, nur selten.', ['Was 5-mal nicht kam, kommt nie.', 'Gelb ist zu klein.']),
        erklaerung: wahr ? 'Kein Feld ist gelb. Darum kann Gelb nie kommen.' : 'Gelb ist unwahrscheinlich, aber nicht unmöglich. Ein Feld ist gelb.',
        versuch: { typ: 'rad', n: 100 } };
    },
    /* 4. Dran sein (Würfel) */
    dranSein(wahr, Z) {
      const vorher = Array.from({ length: 10 }, () => 1 + Z.zahl(5));   /* nur die Geschichte: zehn Würfe ohne 6 */
      /* Der Würfel hat vorher und nachher dieselben 6 Seiten, eine davon ist die 6 */
      const vorherChance = { treffer: 1, gesamt: 6 }, jetzt = { treffer: 1, gesamt: 6 };
      const v = E().vergleiche(jetzt, vorherChance);
      return { szene: 'dranSein', material: { typ: 'wuerfel' }, vorher,
        behauptung: wahr ? 'Die 6 kam lange nicht. Sie hat trotzdem dieselbe Chance wie immer.' : 'Die 6 kam lange nicht. Jetzt ist sie dran.',
        stimmt: wahr ? v === 'gleich' : v === 'groesser',
        begruendungen: begr(Z, 'Der Würfel weiß nicht, was vorher kam.', ['Die 6 muss mal kommen.', 'Die 6 ist schwerer.']),
        erklaerung: 'Der Würfel weiß nicht, was vorher kam. Die 6 ist eine von 6 Seiten, bei jedem Wurf.',
        versuch: { typ: 'wuerfel', n: 60, satz: 'Die 6 kommt mal öfter, mal seltener. Der Würfel weiß nicht, was vorher kam.' } };
    },
    /* 5. Ein Ausgang beweist nichts (Kiste) */
    ausgang(wahr, Z) {
      const viele = zwischen(Z, 5, 7);
      const kiste = wahr ? { rot: viele, blau: 1 } : { rot: 1, blau: viele };
      const g = viele + 1;
      const stimmt = E().ausKiste(kiste, 'rot') === 'wahrscheinlich';
      return { szene: 'ausgang', material: { typ: 'kiste', kiste }, gezogen: ['rot'],
        behauptung: wahr ? 'Ich habe Rot gezogen. Rot war auch wahrscheinlich, denn fast alle Kugeln sind rot.' : 'Ich habe Rot gezogen. Also war Rot wahrscheinlich.', stimmt,
        begruendungen: wahr ? begr(Z, `${viele} von ${g} Kugeln sind rot.`, ['Würfi hat Rot gezogen.', 'Rot kommt immer.'])
          : begr(Z, `Nur 1 von ${g} Kugeln ist rot. Rot war unwahrscheinlich, es ist trotzdem passiert.`, ['Was passiert ist, war wahrscheinlich.', 'Rot ist heute dran.']),
        erklaerung: wahr ? `${viele} von ${g} Kugeln sind rot. Darum war Rot wahrscheinlich, nicht weil ich Rot gezogen habe.`
          : 'Auch Unwahrscheinliches passiert manchmal. Ob etwas wahrscheinlich war, sieht man an der Kiste, nicht an einem Zug.',
        versuch: { typ: 'kiste', n: 50 } };
    },
    /* 6. Genau gleich oft (Würfel, 60 Würfe) */
    gleichOft(wahr, Z) {
      /* Gezählt: „genau 10-mal jede Zahl“ ist nur EINE von vielen möglichen Verteilungen, also nicht sicher;
         „die 6 öfter als die 1“ ist möglich (z. B. 11 und 9). */
      const genauSicher = false, sechsOefterMoeglich = true;
      return { szene: 'gleichOft', material: { typ: 'wuerfel' },
        behauptung: wahr ? 'Wir würfeln 60-mal. Dann kann es sein, dass die 6 öfter kommt als die 1.' : 'Wir würfeln 60-mal. Dann kommt jede Zahl genau 10-mal.',
        stimmt: wahr ? sechsOefterMoeglich : genauSicher,
        begruendungen: wahr ? begr(Z, 'Zufall schwankt. Die 6 kann öfter kommen, auch wenn sie die gleiche Chance hat.', ['Die 6 kommt immer öfter.', 'Die 1 ist kleiner.'])
          : begr(Z, 'Jede Zahl hat die gleiche Chance. Trotzdem kommen sie fast nie genau gleich oft.', ['Bei 60 Würfen muss jede Zahl genau 10-mal kommen.', 'Die 6 kommt immer am häufigsten.']),
        erklaerung: 'Jede Zahl hat die gleiche Chance. Bei 60 Würfen kommen sie aber fast nie genau gleich oft.',
        versuch: { typ: 'wuerfel', n: 60, schatten: true } };
    },
    /* 7. Mehr Kugeln heißt nicht größere Chance (zwei Kisten) */
    zweiKisten(wahr, Z) {
      for (let v = 0; v < 1000; v++) {
        const A = { rot: zwischen(Z, 1, 4), blau: zwischen(Z, 1, 8) }, B = { rot: zwischen(Z, 1, 4), blau: zwischen(Z, 1, 8) };
        const ea = E().ausKiste(A, 'rot'), eb = E().ausKiste(B, 'rot');
        const eine = (x, y) => x === 'wahrscheinlich' && y === 'unwahrscheinlich';
        if (wahr) { if (!eine(ea, eb)) continue; }
        else { if (!(eine(eb, ea) && A.rot > B.rot)) continue; }
        const v2 = E().vergleiche(chanceKiste(A, 'rot'), chanceKiste(B, 'rot'));
        const mehrA = ea === 'wahrscheinlich';
        return { szene: 'zweiKisten', material: { typ: 'zweiKisten', a: A, b: B },
          behauptung: wahr ? 'Aus Kiste A ziehe ich eher Rot.' : `In Kiste A sind mehr rote Kugeln. Aus A ziehe ich eher Rot.`,
          stimmt: v2 === 'groesser',
          begruendungen: mehrA ? begr(Z, 'In A ist mehr als die Hälfte rot, in B weniger als die Hälfte.', ['A ist kleiner.', 'B hat mehr Kugeln.'])
            : begr(Z, 'In B ist mehr als die Hälfte rot, in A weniger als die Hälfte.', ['In A sind mehr rote Kugeln, das reicht.', 'B ist kleiner.']),
          erklaerung: 'Es kommt nicht darauf an, wie viele rote Kugeln es sind, sondern wie viele im Vergleich zu allen.',
          versuch: { typ: 'zweiKisten', n: 50 } };
      }
      throw new Error('zweiKisten: keine Kisten gefunden');
    },
    /* 8. Großes Feld heißt nicht sicher (Rad) */
    grossesFeld(wahr, Z) {
      const gesamt = waehle(Z, [6, 8]);
      const rot = zwischen(Z, 1, gesamt / 2 - 1);
      const rad = [{ farbe: 'blau', felder: gesamt - rot }, { farbe: 'rot', felder: rot }];
      const stimmt = wahr ? E().vergleiche(chanceRad(rad, 'blau'), chanceRad(rad, 'rot')) === 'groesser' && E().istMoeglich(E().ausRad(rad, 'rot'))
        : E().ausRad(rad, 'blau') === 'sicher';
      return { szene: 'grossesFeld', material: { typ: 'rad', rad },
        behauptung: wahr ? 'Blau hat die größere Chance. Rot kann aber auch kommen.' : 'Blau hat viel mehr Felder. Blau kommt sicher.', stimmt,
        begruendungen: wahr ? begr(Z, `Mehr Felder sind blau, aber ${rot === 1 ? '1 Feld ist' : rot + ' Felder sind'} rot.`, ['Blau kommt immer.', 'Rot kommt nie.'])
          : begr(Z, `Auch ${rot === 1 ? '1 Feld ist' : rot + ' Felder sind'} rot. Rot kann kommen.`, ['Was größer ist, kommt immer.', 'Rot ist zu klein.']),
        erklaerung: 'Blau ist wahrscheinlich, aber nicht sicher. Sicher wäre es nur, wenn alle Felder blau wären.',
        versuch: { typ: 'rad', n: 50 } };
    },
    /* 9. Summe 7 (zwei Würfel) */
    summe7(wahr, Z) {
      if (!wahr) return { szene: 'summe7', material: { typ: 'zweiWuerfel' },
        behauptung: 'Mit zwei Würfeln kommt die Summe 7 sicher.', stimmt: W(7) === 36,
        begruendungen: begr(Z, 'Es gibt auch andere Summen, zum Beispiel 2 oder 12.', ['Die 7 ist die beste Zahl.', 'Die 7 kommt nie.']),
        erklaerung: 'Die 7 kommt am häufigsten, aber nicht sicher.', versuch: { typ: 'zweiWuerfel', n: 50 } };
      const [a, b] = waehle(Z, [[7, 12], [7, 2], [6, 11], [8, 3]]);
      return { szene: 'summe7', material: { typ: 'zweiWuerfel' }, summen: [a, b],
        behauptung: `Mit zwei Würfeln kommt die Summe ${a} öfter als die Summe ${b}.`, stimmt: W(a) > W(b),
        begruendungen: begr(Z, `Für die ${a} gibt es ${wuerfeWort(W(a))}, für die ${b} gibt es ${wuerfeWort(W(b))}.`, [`Die ${b} ist zu groß.`, `Die ${a} kommt immer.`]),
        erklaerung: `Für die ${a} gibt es mehr Würfe als für die ${b}. Darum kommt die ${a} öfter, aber nicht immer.`, versuch: { typ: 'zweiWuerfel', n: 50 } };
    }
  };

  const STUFE_SZENEN = { leicht: ['ausgleich', 'lieblingsfarbe', 'selten'], mittel: ['dranSein', 'ausgang', 'gleichOft'], knifflig: ['zweiKisten', 'grossesFeld', 'summe7'] };

  function szene(stufe, name, wahr, Z) {
    const s = SZENEN[name](wahr, Z);
    return Object.assign(s, { art: 'szene', stufe, wahr, loesung: s.stimmt ? 'ja' : 'nein', antworten: ANTWORTEN.slice(),
      schluss: (s.stimmt ? 'Siehst du, das stimmt. ' : 'Stimmt, da habe ich mich vertan. ') + s.erklaerung });
  }

  function runde(stufe, Z = CB.zufall) {
    if (!STUFE_SZENEN[stufe]) throw new Error('Unbekannte Stufe: ' + stufe);
    const namen = mische(Z, STUFE_SZENEN[stufe].concat(STUFE_SZENEN[stufe]));
    const wahrBei = mische(Z, [0, 1, 2, 3, 4, 5]).slice(0, 2);
    return namen.map((n, i) => szene(stufe, n, wahrBei.includes(i), Z));
  }

  CB.denkfehlerAufgaben = { runde, szene, SZENEN, STUFE_SZENEN };
})();
