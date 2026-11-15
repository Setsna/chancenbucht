# Chancenbucht

Lernplattform zu Zufall und Wahrscheinlichkeit für die Klasse 3 (8 bis 9 Jahre), mit einer kniffligen Stufe in Richtung Klasse 4.
Die Kinder ziehen Kugeln aus einer Kiste, drehen ein Glücksrad, würfeln und werfen eine Münze. Sie vermuten zuerst, probieren dann aus und zählen.
Begleiter ist Würfi, ein Kofferfisch. Es gibt keine Punkte, keinen Zeitdruck, keine Ranglisten und kein Glücksspiel: keine Einsätze, kein Geld, keine Gewinne.

**Adresse:** https://setsna.github.io/chancenbucht/

Schwesterseite der [Lernlagune](https://lernlagune.de), zusammen mit Perlentaucher, KI-Korallenriff, Riff-Akten, Flaschenpost, Seesternwerkstatt und Zahlenschwarm.

## Stationen

Jede Station hat drei Stufen (leicht, mittel, knifflig). Eine Runde hat sechs Aufgaben, ab fünf geschafften gibt es einen Stempel.

| Station | Was geübt wird |
|---|---|
| Fühlkiste | Kugeln einordnen von sicher bis unmöglich, eine Kiste passend füllen, vermuten und ziehen, zwei Kisten vergleichen |
| Glücksrad | Chancen über gleich große Felder, ein Rad passend färben, größere und gleiche Chance, Zahlenrad |
| Würfeln | ein Würfel, Augensummen mit zwei Würfeln, alle Würfe je Summe, Strichliste und Säulendiagramm, faire Spiele |
| Münzwurf | Kopf und Zahl, „dreimal Kopf, und jetzt?“, genau die Hälfte?, zwei Münzen, gerechte Verfahren, Vergleich mit echten Würfen |
| Kann das stimmen? | Würfi behauptet etwas über den Zufall, das Kind prüft es mit Kiste, Rad, Würfel oder Münze |

Dazu ein Logbuch mit allen Stempeln und „Das kann ich schon“ und eine Urkunde als PDF, die auf dem Gerät entsteht.

Grundlage ist der Lehrplan Thüringen Mathematik Grundschule (Leitidee Daten und Zufall). Inhaltliche Vorlage für Art und Stufe der Aufgaben ist das Lehrwerk Denken und Rechnen 3 und 4. Alle Texte und Aufgaben sind selbst geschrieben.

## Fachliche Grundsätze

- Bewertet wird die Vermutung oder Einordnung, nie ein einzelner Ausgang.
- Die Einordnung wird aus dem Inhalt (Kiste, Rad, Würfel, Münze) berechnet, nie aus einer Liste gelesen.
- Der Zufall kommt aus `crypto.getRandomValues`. Das Ergebnis steht fest, bevor eine Animation läuft. Nichts wird gelenkt.
- Keine Brüche, keine Prozent.

## Was liegt wo?

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst der Seite (eine Seite für Anmeldung, Startseite, Stationen, Logbuch) |
| `js/config.js` | Alle Einstellungen: Stationen, Stufen, Farben, Aufgaben je Runde |
| `js/zufall.js`, `js/einordnung.js` | Zufall und Einordnung auf der Wahrscheinlichkeitsskala |
| `js/kiste.js`, `js/rad.js`, `js/wuerfel.js`, `js/muenze.js`, `js/saeulen.js` | Code-Grafiken (SVG) |
| `js/stationen/` | je Station ein Aufgabengenerator und die Station selbst |
| `js/station-teile.js` | gemeinsame Teile der Stationen |
| `js/logbuch.js`, `js/urkunde.js` | Logbuch und Urkunde (PDF ohne Bibliothek) |
| `js/cb-stand.js`, `js/konto-*.js` | Stand des Kindes und gemeinsames Konto der Lernlagune |
| `js/app.js`, `js/erwachsene.js` | Ansichten, Bedienung, Erwachsenenbereich |
| `css/` | Farben und Maße (`tokens.css`), Seite, Stationen |
| `bilder/`, `schriften/` | Würfi, Hintergrund, App-Symbole; Andika und Libre Caslon Text (OFL, Lizenztexte liegen bei) |

## Anmeldung und Daten

Die Kinder melden sich mit demselben Zugangscode an wie im Perlentaucher. Gespeichert werden in Firebase (`cb_stand/<code>`) nur Stempel und die Zahl der geschafften Aufgaben je Station und Stufe, kein Vorname, keine Vermutungen, keine Versuchsergebnisse. Die Datenbankregeln erlauben genau die 15 festen Schlüssel. Zurücksetzen und Löschen gehen über den Lehrerbereich des Perlentauchers. Einzelheiten stehen in `datenschutz.html`.

## Veröffentlichen

- Hinter jeder lokalen `js`- und `css`-Datei steht `?v=N`. Bei jeder Änderung wird die Zahl in allen HTML-Dateien hochgezählt, sonst laden Geräte alte Fassungen.
- Die `.gitignore` sperrt alles und gibt nur die fertige Seite frei. Neue Dateien oder Ordner auf oberster Ebene dort eintragen.
- Werkzeuge und Tests liegen außerhalb dieses Repositorys und gehen nicht ins Netz.

## Stand

- 15.11.2026: erste Veröffentlichung, `?v=8`, alle fünf Stationen, Logbuch und Urkunde. GitHub Pages aus `main`.
