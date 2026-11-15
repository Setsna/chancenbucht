/* Chancenbucht: Einordnung auf der Wahrscheinlichkeitsskala, BERECHNET aus dem Inhalt von Kiste oder Rad.
   Klassisches Skript, legt window.CB.einordnung an.

   Regel (Mini-Spec Etappe 1, von Ingo freigegeben am 15.11.2026):
     keine passende Kugel / kein passendes Feld     → unmöglich
     weniger als die Hälfte                         → unwahrscheinlich
     genau die Hälfte                               → haelfte („genauso wahrscheinlich wie unwahrscheinlich“,
                                                      kommt in Klasse-3-Aufgaben nicht vor)
     mehr als die Hälfte, aber nicht alle           → wahrscheinlich
     alle                                           → sicher
   „möglich“ ist der Oberbegriff für alles außer unmöglich (Wortspeicher des Lehrwerks).
   Gerechnet wird nur mit ganzen Zahlen (doppelt verglichen statt geteilt), nie mit Brüchen oder Prozent.

   Augensummen werden NICHT absolut eingeordnet, nur verglichen (Entscheidung D): „Die 7 kommt in mehr
   Würfen vor als die 2“. Dafür gibt es anzahlWege und vergleiche.

   Bewertet wird immer die Einordnung oder Vermutung, nie ein einzelner Zufallsausgang. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};

  const STUFEN = ['unmoeglich', 'unwahrscheinlich', 'haelfte', 'wahrscheinlich', 'sicher'];
  const WOERTER = {
    unmoeglich: 'unmöglich',
    unwahrscheinlich: 'unwahrscheinlich',
    haelfte: 'genauso wahrscheinlich wie unwahrscheinlich',
    wahrscheinlich: 'wahrscheinlich',
    sicher: 'sicher'
  };
  /* Erklärung des Wortspeichers, selbst formuliert */
  const BEDEUTUNG = {
    unmoeglich: 'Das passiert nie.',
    unwahrscheinlich: 'Das passiert eher selten.',
    haelfte: 'Das passiert ungefähr genauso oft, wie es nicht passiert.',
    wahrscheinlich: 'Das passiert eher oft.',
    sicher: 'Das passiert auf jeden Fall.'
  };

  function pruefeZahlen(treffer, gesamt) {
    if (!Number.isInteger(treffer) || !Number.isInteger(gesamt) || gesamt < 1 || treffer < 0 || treffer > gesamt) {
      throw new Error(`Einordnung braucht 0 ≤ treffer ≤ gesamt, gesamt ≥ 1 (bekommen: ${treffer} von ${gesamt})`);
    }
  }

  /* treffer von gesamt passen → Stufe */
  function einordnen(treffer, gesamt) {
    pruefeZahlen(treffer, gesamt);
    if (treffer === 0) return 'unmoeglich';
    if (treffer === gesamt) return 'sicher';
    if (2 * treffer < gesamt) return 'unwahrscheinlich';
    if (2 * treffer > gesamt) return 'wahrscheinlich';
    return 'haelfte';
  }

  /* Kiste { rot: 3, blau: 2 }; farben: eine Farbe oder eine Liste („rot oder blau“) */
  function zaehleKiste(kiste, farben) {
    const passt = [].concat(farben);
    let treffer = 0, gesamt = 0;
    for (const [farbe, n] of Object.entries(kiste || {})) {
      if (!Number.isInteger(n) || n < 0) throw new Error('Kiste: Anzahl muss eine ganze Zahl ≥ 0 sein');
      gesamt += n;
      if (passt.includes(farbe)) treffer += n;
    }
    return { treffer, gesamt };
  }
  /* Rad [{ farbe, felder }]; gleich große Felder */
  function zaehleRad(rad, farben) {
    const passt = [].concat(farben);
    let treffer = 0, gesamt = 0;
    for (const f of rad || []) {
      if (!f || !Number.isInteger(f.felder) || f.felder < 0) throw new Error('Rad: felder muss eine ganze Zahl ≥ 0 sein');
      gesamt += f.felder;
      if (passt.includes(f.farbe)) treffer += f.felder;
    }
    return { treffer, gesamt };
  }
  const ausKiste = (kiste, farben) => { const z = zaehleKiste(kiste, farben); return einordnen(z.treffer, z.gesamt); };
  const ausRad = (rad, farben) => { const z = zaehleRad(rad, farben); return einordnen(z.treffer, z.gesamt); };
  const istMoeglich = stufe => stufe !== 'unmoeglich';

  /* Vergleich zweier Chancen a = { treffer, gesamt }, b = { treffer, gesamt }, ohne Brüche:
     'groesser' (a ist wahrscheinlicher als b), 'kleiner', 'gleich' (genauso wahrscheinlich) */
  function vergleiche(a, b) {
    pruefeZahlen(a.treffer, a.gesamt); pruefeZahlen(b.treffer, b.gesamt);
    const l = a.treffer * b.gesamt, r = b.treffer * a.gesamt;
    return l > r ? 'groesser' : l < r ? 'kleiner' : 'gleich';
  }

  /* Zwei Würfel: alle möglichen Würfe zu einer Augensumme, als Paare [erster, zweiter] (3+4 und 4+3 sind zwei Würfe) */
  function moeglicheWuerfe(summe) {
    const aus = [];
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === summe) aus.push([a, b]);
    return aus;
  }
  const anzahlWege = summe => moeglicheWuerfe(summe).length;
  /* Augensumme als Chance (Wege von 36), z. B. für vergleiche() */
  const summenChance = summe => ({ treffer: anzahlWege(summe), gesamt: 36 });

  CB.einordnung = {
    STUFEN, WOERTER, BEDEUTUNG,
    einordnen, ausKiste, ausRad, zaehleKiste, zaehleRad, istMoeglich,
    vergleiche, moeglicheWuerfe, anzahlWege, summenChance,
    wort: stufe => WOERTER[stufe]
  };
})();
