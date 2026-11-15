/* Chancenbucht: der Zufallsbaustein (Ziehen, Drehen, Würfeln, Münze).
   Klassisches Skript, legt window.CB.zufall an.

   Regeln (CLAUDE.md, „Fachliche Regeln“ und „Technik“):
   - Zufall kommt aus crypto.getRandomValues. Math.random nur als Notlösung, wenn der Browser crypto nicht kennt;
     dann steht in CB.zufall.quelle 'Math.random' (die Tests verlangen 'crypto').
   - Ganze Zahlen ohne Schieflage: Statt Rest-Rechnung (x % n) wird verworfen und neu gezogen, wenn x im
     unvollständigen letzten Block liegt. Sonst kämen kleine Zahlen minimal häufiger.
   - Der Ausgang steht fest, BEVOR etwas animiert wird. Jede Funktion gibt das Ergebnis zurück;
     die Station animiert danach nur noch dorthin.
   - Nichts wird gelenkt: keine „schöne Verteilung“, kein Ausgleich nach Pech. Das Schwanken ist der Lerninhalt.
   - Fester Startwert (mulberry32) nur für Tests und die lokale Vorschau: mitStartwert(n) oder auf localhost
     ?startwert=N. Auf der echten Seite gibt es keinen Weg dorthin.

   Datenformen:
     kiste  { farbe: anzahl, … }   z. B. { rot: 3, blau: 2 }; Ziehen immer MIT Zurücklegen
     rad    [ { farbe, felder }, … ] gleich große Felder, z. B. [{ farbe: 'rot', felder: 3 }, { farbe: 'blau', felder: 5 }]
            Der Winkel ist gleichverteilt auf [0, 360), die Feldgröße entscheidet. Grenze gehört zum nächsten Feld. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const ZWEI32 = 4294967296;

  /* Quelle: liefert gleichverteilte 32-Bit-Zahlen (0 … 2^32-1) */
  function cryptoQuelle() {
    const puffer = new Uint32Array(256);
    let i = puffer.length;
    return () => {
      if (i >= puffer.length) { crypto.getRandomValues(puffer); i = 0; }
      return puffer[i++];
    };
  }
  /* mulberry32: kleiner Generator mit festem Startwert, nur für Tests und Vorschau */
  function startwertQuelle(startwert) {
    let a = (Number(startwert) >>> 0) || 1;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0);
    };
  }
  function notQuelle() { return () => Math.floor(Math.random() * ZWEI32) >>> 0; }

  function baue(quelle, name) {
    /* Ganze Zahl in [0, n), ohne Schieflage (Verwerfen statt Rest) */
    function zahl(n) {
      if (!Number.isInteger(n) || n < 1 || n > ZWEI32) throw new Error('zahl(n): n muss eine ganze Zahl von 1 bis 2^32 sein');
      const grenze = ZWEI32 - (ZWEI32 % n);   /* alles ab hier wird verworfen */
      let x;
      do { x = quelle(); } while (x >= grenze);
      return x % n;
    }
    /* Kommazahl in [0, 1) */
    const anteil = () => quelle() / ZWEI32;

    function kisteListe(kiste) {
      const liste = Object.entries(kiste || {}).filter(([, n]) => Number.isInteger(n) && n > 0);
      if (!liste.length) throw new Error('Die Kiste ist leer');
      return liste;
    }
    /* Eine Kugel ziehen, mit Zurücklegen: jede Kugel gleich wahrscheinlich */
    function ziehe(kiste) {
      const liste = kisteListe(kiste);
      let k = zahl(liste.reduce((s, [, n]) => s + n, 0));
      for (const [farbe, n] of liste) { if (k < n) return farbe; k -= n; }
      throw new Error('unerreichbar');
    }

    function radPruefen(rad) {
      if (!Array.isArray(rad) || !rad.length || !rad.every(f => f && Number.isInteger(f.felder) && f.felder > 0)) throw new Error('Das Rad braucht Felder');
      return rad.reduce((s, f) => s + f.felder, 0);
    }
    /* Welches Feld liegt bei diesem Winkel unter dem Zeiger? Felder im Uhrzeigersinn ab 0°, Grenze gehört zum nächsten Feld. */
    function feldBeiWinkel(rad, winkel) {
      const gesamt = radPruefen(rad);
      const w = ((winkel % 360) + 360) % 360;
      /* in Feld-Einheiten rechnen, damit Grenzen exakt sind */
      const pos = w * gesamt / 360;
      let bis = 0;
      for (let i = 0; i < rad.length; i++) { bis += rad[i].felder; if (pos < bis) return i; }
      return rad.length - 1;
    }
    /* Drehen: erst den Winkel bestimmen (gleichverteilt), daraus das Feld. Ergebnis { winkel, index, farbe }. */
    function drehe(rad) {
      radPruefen(rad);
      const winkel = anteil() * 360;
      const index = feldBeiWinkel(rad, winkel);
      return { winkel, index, farbe: rad[index].farbe };
    }

    /* Würfeln: Liste der Augenzahlen, z. B. [3, 5] bei zwei Würfeln */
    function wuerfle(anzahl = 1) {
      if (!Number.isInteger(anzahl) || anzahl < 1 || anzahl > 3) throw new Error('1 bis 3 Würfel');
      return Array.from({ length: anzahl }, () => zahl(6) + 1);
    }
    /* Münze */
    const wirf = () => (zahl(2) === 0 ? 'kopf' : 'zahl');

    /* Viele Versuche auf einmal (1, 10, 100 …): Liste der Ergebnisse, jedes für sich zufällig */
    function oft(n, versuch) {
      if (!Number.isInteger(n) || n < 1 || n > 100000) throw new Error('oft(n): 1 bis 100 000');
      return Array.from({ length: n }, versuch);
    }

    return { quelle: name, zahl, anteil, ziehe, drehe, feldBeiWinkel, wuerfle, wirf, oft };
  }

  /* Häufigkeiten einer Ergebnisliste zählen: { ergebnis: anzahl } (Reihenfolge der ersten Vorkommen) */
  function zaehle(liste, schluessel = x => x) {
    const aus = {};
    for (const x of liste) { const k = schluessel(x); aus[k] = (aus[k] || 0) + 1; }
    return aus;
  }

  const hatCrypto = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';
  let standard = hatCrypto ? baue(cryptoQuelle(), 'crypto') : baue(notQuelle(), 'Math.random');

  /* Nur auf dem eigenen Rechner: ?startwert=N macht Versuche wiederholbar (Vorschau, Fehlersuche) */
  const LOKAL = typeof location !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const sw = LOKAL ? new URLSearchParams(location.search).get('startwert') : null;
  if (sw !== null && /^\d{1,9}$/.test(sw)) standard = baue(startwertQuelle(Number(sw)), 'startwert');

  CB.zufall = Object.assign({}, standard, {
    mitStartwert: n => baue(startwertQuelle(n), 'startwert'),
    zaehle,
    /* nur für die Testseite: eine eigene Quelle einsetzen (Gegenprobe mit absichtlich schiefem Zufall) */
    _mitQuelle: (q, name) => baue(q, name)
  });
})();
