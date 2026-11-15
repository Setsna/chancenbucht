/* Chancenbucht: Texte für den Erwachsenenbereich (zwei Aufklapper unter der Startseite).
   Etappe 5e: Texte nach Dateien/Beispiele-Entwuerfe/logbuch-erwachsene-urkunde.md (von Ingo freigegeben am 15.11.2026),
   Seitenzahlen im Lehrkräfte-Teil auf Ingos Wunsch (gedruckte Seiten, Denken und Rechnen 3 und 4).
   Abschnitte: titel, absaetze [Text], liste [[fett, Text]], tabelle { kopf: [..], zeilen: [[..]] }, datenschutzLink.
   Alles läuft in js/app.js durch esc(), es gibt kein HTML in den Texten. */
(() => {
  'use strict';
  const CB = window.CB = window.CB || {};
  const DATEN = 'Die Kinder melden sich mit ihrem Zugangscode an. Es ist derselbe wie beim Perlentaucher. Gespeichert werden unter diesem Code nur die Stempel und die Zahl der geschafften Aufgaben je Station und Stufe. Vermutungen und Versuchsergebnisse werden nicht gespeichert. So ist der Stand auf jedem Gerät da, in der Schule und zu Hause. Der Stand liegt zusätzlich im Browser des Geräts, damit auch ohne Internet gearbeitet werden kann. Andere Kinder sehen ihn nicht, eine Auswertung für die Lehrkraft gibt es nicht. Löschen lassen können Sie den Stand über die Lehrkraft.';
  const DATEN_TISCH = 'Was Ihr Kind in der Münzstation von einem echten Wurf eintippt, wird nicht gespeichert. Die Urkunde entsteht auf dem Gerät und wird weder gespeichert noch verschickt.';

  CB.erwachsene = {
    eltern: {
      titel: 'Für Eltern',
      abschnitte: [
        { titel: 'Worum es geht', absaetze: [
          'In der Chancenbucht üben Kinder der Klasse 3 Zufall und Wahrscheinlichkeit. Sie ziehen Kugeln aus einer Kiste, drehen ein Glücksrad, würfeln und werfen eine Münze.',
          'Dabei vermuten sie zuerst, probieren es dann aus und zählen.',
          'Weil das Gerät in Sekunden 100-mal würfeln kann, sehen die Kinder: Bei wenigen Versuchen schwankt das Ergebnis stark, bei vielen weniger.'
        ] },
        { titel: 'Die fünf Stationen', liste: [
          ['Fühlkiste', 'Kugeln ziehen, einordnen von sicher bis unmöglich, eine Kiste passend füllen.'],
          ['Glücksrad', 'Chancen am Rad erkennen und ein Rad passend färben.'],
          ['Würfeln', 'Strichliste und Säulendiagramm. Warum die Summe 7 bei zwei Würfeln am häufigsten kommt. Ist ein Spiel fair?'],
          ['Münzwurf', 'Kopf und Zahl, und warum nach dreimal Kopf nicht „Zahl dran“ ist.'],
          ['Kann das stimmen?', 'Würfi behauptet etwas über den Zufall, Ihr Kind prüft es.']
        ] },
        { titel: 'Gut zu wissen', absaetze: [
          'Es gibt keinen Zeitdruck und keine Rangliste.',
          'Es gibt kein Glücksspiel: keine Einsätze, kein Geld, keine Gewinne.',
          'Wenn ein Wurf anders ausgeht als vermutet, ist das kein Fehler Ihres Kindes. Bewertet wird nur, ob die Vermutung zum Würfel, zur Kiste oder zum Rad passt.'
        ] },
        { titel: 'Tipp für zu Hause', absaetze: [
          'Machen Sie Versuche mit echten Dingen: zwei Würfel, ein Spielchip mit zwei Seiten oder ein Beutel mit Steckwürfeln in zwei Farben.',
          'Vermuten Sie zusammen, führen Sie eine Strichliste und vergleichen Sie danach.',
          'Fragen Sie: „Kann das stimmen?“, zum Beispiel nach dreimal Kopf.',
          'In der Münzstation kann Ihr Kind echte Würfe eintippen und mit dem Gerät vergleichen.'
        ] },
        { titel: 'Daten', absaetze: [DATEN, DATEN_TISCH], datenschutzLink: true },
        { titel: 'Der Code', absaetze: [
          'Der Code gehört Ihrem Kind. Wer ihn kennt, kann sich damit anmelden. Auf einem fremden Gerät am Ende bitte auf „Abmelden“ tippen.'
        ] }
      ]
    },
    lehrkraefte: {
      titel: 'Für Lehrkräfte',
      abschnitte: [
        { titel: 'Konzept', absaetze: [
          'Leitidee Daten und Zufall: Zufallsexperimente durchführen, Chancen einschätzen und auf der Wahrscheinlichkeitsskala darstellen (sicher, wahrscheinlich, unwahrscheinlich, unmöglich), Häufigkeiten in Strichliste und Säulendiagramm festhalten und Chancen vergleichen.',
          'Die Einordnung wird immer aus dem Inhalt (Kiste, Rad, Würfel, Münze) berechnet, nie aus einem einzelnen Versuch. Wahrscheinlichkeiten als Bruch oder Prozent kommen nicht vor.'
        ] },
        { titel: 'Prinzip und Umsetzung', tabelle: { kopf: ['Prinzip', 'Umsetzung'], zeilen: [
          ['Erst vermuten, dann prüfen', 'Die Vermutung wird festgelegt, bevor gezogen oder gewürfelt wird, und bleibt neben dem Ergebnis stehen.'],
          ['Vermutung statt Ausgang bewerten', 'Rückmeldung nur zur Vermutung im Verhältnis zum Inhalt. Ein unerwarteter Ausgang heißt: „Heute ist etwas anderes passiert.“'],
          ['Viele Versuche', '1, 10 oder 100 Versuche auf einmal, ältere Serien als Schatten. Schwankung und Beruhigung werden sichtbar, ohne Gesetz.'],
          ['Denkfehler erleben', 'Ausgleich, „dran sein“, Glückszahl, „ein Ausgang beweist es“: Würfi behauptet es, das Kind prüft es.'],
          ['Echter Zufall', 'Zufallszahlen aus dem Browser (crypto), Ergebnis vor jeder Animation festgelegt, nichts gelenkt.'],
          ['Mehrere Lösungen', 'Beim Füllen von Kiste und Rad zählt jede passende Lösung, geprüft per Rechnung.'],
          ['Differenzierung', 'Drei Stufen je Station. Die Seite empfiehlt eine, das Kind wählt. Gestufte Tipps ohne Lösung.'],
          ['Kein Glücksspiel', 'Keine Punkte, keine Gewinne. „Einen Strich bekommen“ statt „gewinnen“.'],
          ['Am Tisch', 'Zu jeder Station eine Idee mit echten Würfeln, Spielchips oder Steckwürfeln.']
        ] } },
        { titel: 'Die Stationen und das Heft', absaetze: ['Denken und Rechnen 3 und 4, gedruckte Seiten.'], liste: [
          ['Fühlkiste', 'Wahrscheinlichkeitsskala mit Kugeln aus einer Kiste. Knüpft an Denken und Rechnen 3, S. 102 (Kugeln ziehen) an, „knifflig“ an Denken und Rechnen 4, S. 80 (Chancen vergleichen). Im LP steht das Ziehen aus dem Beutel bei Klassenstufe 4.'],
          ['Glücksrad', 'Chancen über gleich große Felder, ein Rad nach Vorgabe gestalten. Knüpft an Denken und Rechnen 3, S. 103 an. Im LP steht das Glücksrad bei Klassenstufe 4, hier ist es vorgezogen.'],
          ['Würfeln', 'Strichliste, Säulendiagramm, alle Würfe je Augensumme, faire Spiele. Knüpft an Denken und Rechnen 3, S. 104 an.'],
          ['Münzwurf', 'Ein einfaches Zufallsexperiment (Schuleingangsphase im LP). Schwerpunkt ist der Denkfehler „Ausgleich“. „Ist das gerecht?“ knüpft an Denken und Rechnen 4, S. 116 an.'],
          ['Kann das stimmen?', 'Typische Fehlvorstellungen prüfen. Knüpft an Denken und Rechnen 3, S. 102, Aufgabe 4 an.'],
          ['Stufe knifflig', 'Vergleicht Chancen. Das ist im LP Klassenstufe 4.']
        ] },
        { titel: 'Lehrplanbezug', absaetze: [
          'LP Thüringen Mathematik (Erprobungsfassung 2026), Leitidee Daten und Zufall. Klasse 3 legt das Schulcurriculum fest. Der LP nennt nur Schuleingangsphase und Klassenstufe 4.'
        ] },
        { titel: 'Einsatz', absaetze: [
          'Gut als Station im Wochenplan oder nach eigenen Versuchen am Tisch.',
          'Vorher am Tisch ausprobieren, dann am Gerät viele Versuche machen. Beides zusammen wirkt besser als jedes allein.'
        ] },
        { titel: 'Daten', absaetze: [DATEN, DATEN_TISCH], datenschutzLink: true }
      ]
    }
  };
})();
