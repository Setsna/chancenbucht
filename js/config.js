/* Chancenbucht: alle Einstellungen an einer Stelle.
   Klassisches Skript, legt window.CB.config an. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};

  CB.config = {
    name: 'Chancenbucht',
    unterzeile: 'Erst vermuten, dann zählen.',
    maskottchen: 'Würfi',

    /* Speicher im Browser (Baukasten js/konto-speicher.js):
       localStorage   chancenbucht-v1.k<kennung>            Stand samt Vorname (für die Anzeige ohne Netz)
                      chancenbucht-v1.k<kennung>.abgleich   zuletzt abgeglichener Stand
       sessionStorage chancenbucht-v1-wer                   welches Kind in diesem Tab angemeldet ist
       Die Kennung wird aus dem Code errechnet, der Code selbst steht nicht im Namen. */
    speicher: { schluessel: 'chancenbucht', schema: 1 },
    codeLaenge: 8,
    nameMaxLaenge: 20,

    /* Gemeinsames Konto: das Firebase-Projekt des Perlentauchers.
       Diese Angaben sind keine Geheimnisse, sie stehen bei jeder Firebase-Seite im Quelltext.
       Geschützt werden die Daten durch die Regeln in der Firebase-Konsole (Block cb_stand). */
    firebase: {
      apiKey: 'AIzaSyBX3MUJq69uFyejbEiJimGeAtHMER3OCdE',
      authDomain: 'lernplattform-44aa1.firebaseapp.com',
      projectId: 'lernplattform-44aa1',
      storageBucket: 'lernplattform-44aa1.firebasestorage.app',
      messagingSenderId: '213839225177',
      appId: '1:213839225177:web:4cf676269e50c708466c48'
    },
    cloud: {
      kinder: 'kinder',        /* kinder/<code>: Vorname, von der Lehrkraft angelegt (nur lesen) */
      stand: 'cb_stand',       /* cb_stand/<code>: der Stand dieses Kindes in der Chancenbucht */
      schreibPauseMs: 2500,    /* so lange nach der letzten Änderung warten, dann gebündelt schreiben */
      freigabe: 'chancenbucht' /* Schlüssel im Lehrerbereich des Perlentauchers (oeffentlich/plattformen), seit 21.11.2026 */
    },

    /* Stationen und Stufen. Die Ids sind Teil der Firebase-Regeln (feste Schlüssel 'station:stufe').
       Eine neue Station oder Stufe braucht eine Regeländerung (Regel-Block cb_stand und tools/test/cb-gueltig.js). */
    stationen: [
      { id: 'fuehlkiste', name: 'Fühlkiste', kurz: 'Kugeln ziehen', live: true },
      { id: 'gluecksrad', name: 'Glücksrad', kurz: 'Drehen und zählen', live: true },
      { id: 'wuerfeln', name: 'Würfeln', kurz: 'Welche Summe kommt oft?', live: true },
      { id: 'muenze', name: 'Münzwurf', kurz: 'Kopf oder Zahl?', live: true },
      { id: 'denkfehler', name: 'Kann das stimmen?', kurz: 'Behauptungen prüfen', live: true }
    ],
    stufen: ['leicht', 'mittel', 'knifflig'],

    /* Kugel- und Feldfarben: gedämpft (Werte in css/tokens.css), jede mit eigenem Muster.
       Wortformen für die Sätze: „eine blaue Kugel“, „keine blauen Kugeln“, „Kugeln sind blau“. */
    farben: [
      { id: 'blau', name: 'Blau', adj: 'blau', akk: 'blaue', plural: 'blauen', muster: 'streifen', musterName: 'gestreift' },
      { id: 'rot', name: 'Rot', adj: 'rot', akk: 'rote', plural: 'roten', muster: 'punkte', musterName: 'gepunktet' },
      { id: 'gelb', name: 'Gelb', adj: 'gelb', akk: 'gelbe', plural: 'gelben', muster: '', musterName: 'glatt' },
      { id: 'gruen', name: 'Grün', adj: 'grün', akk: 'grüne', plural: 'grünen', muster: 'karo', musterName: 'kariert' }
    ],
    /* Fühlkiste (Mini-Spec Etappe 2, Ingo 15.11.2026) */
    fuehlkiste: {
      aufgabenJeRunde: 6,
      stempelAb: 5,             /* Stempel bei mindestens 5 von 6 geschafften Aufgaben */
      vermutenZuege: 20,
      verdecktZuege: 50
    },

    /* Obergrenze für runden je Schlüssel (wie im Regel-Block) */
    rundenMax: 100000,

    /* Versionsnummer der Bilder, getrennt von ?v=N für js und css */
    bildStand: 3
  };
})();
