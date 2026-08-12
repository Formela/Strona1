# iPad Air 11″ (2026) vs. iPad Pro 11″ (2025)

Ein interaktiver Direktvergleich im Apple-Stil — als statische Website, ohne Build-Schritt
und ohne externe Abhängigkeiten.

## Öffnen

`index.html` im Browser öffnen. Mehr ist nicht nötig — kein npm, kein Bundler, keine CDN-Requests.

Für einen lokalen Server (optional):

```bash
python3 -m http.server 8000
```

## Aufbau

```
index.html
assets/css/styles.css     Design, 3D-Geometrie der Geräte, Responsive-Layout
assets/js/data.js         Geräte-, Last- und Vergleichsdaten (alles Inhaltliche)
assets/js/app.js          Rad-Komponente, Scroll-Choreografie, Rechenmodelle
```

Inhalte ändert man in `data.js`, ohne die Logik anzufassen.

## Kapitel

1. **Hero** — beide iPads in CSS-3D nebeneinander. Beim Scrollen drehen sie sich durch eine
   feste Choreografie: Front → Kante (Dickenvergleich) → Rückseite → Front. Der Text wechselt
   in vier Phasen mit.
2. **Performance** — Rad zur Auswahl von sechs Aufgaben, Balkenvergleich, Dauerlastdiagramm,
   Leistung pro Watt.
3. **Laufzeit** — zwei Räder (Helligkeit, Szenario) plus Schalter für dunkle Inhalte.
   Ergebnis in Stunden und Minuten, dazu eine Tabelle über alle Szenarien.
4. **Laden** — Watt-Rad von 1 W bis 60 W, Ladekurve, vollständige Tabelle mit 16 Watt-Stufen,
   Schalter für „während des Ladens benutzen“.
5. **Unterschiede** — 46 Merkmale, filterbar nach Kategorie, Gemeinsamkeiten ausblendbar.
6. **Empfehlung** — neun Gewichtungsregler ergeben eine personalisierte Kaufempfehlung.

## Bedienung der Räder

Ziehen mit Maus oder Finger, Mausrad bei Fokus, sowie Tastatur: Pfeiltasten, `Bild ↑/↓`,
`Pos1`, `Ende`. Die Räder sind als `role="slider"` mit `aria-valuetext` ausgezeichnet.
Die Mitte des Rades ist bewusst nicht ziehbar, damit der Messwert lesbar bleibt.

## Rechenmodelle

Die Zahlen werden nicht aus einer Tabelle abgelesen, sondern gerechnet.

**Laufzeit** — Leistungsaufnahme = Display + SoC + Grundlast.
Das Display des Air skaliert linear mit der Helligkeit (IPS-Hintergrundbeleuchtung,
inhaltsunabhängig). Beim Pro geht zusätzlich ein Inhaltsfaktor ein, weil ein OLED bei
dunklen Bildinhalten deutlich weniger zieht — daher der Schalter für dunkle Inhalte.
Kalibriert ist das Modell auf Apples Referenzwert von 10 Stunden Websurfen bei 40 % Helligkeit.

**Laden** — die zugeführte Leistung wird auf die maximale Aufnahme des Geräts begrenzt
(≈ 30 W beim Air, ≈ 38 W beim Pro), um Wandlerverluste (15 %) und Standby-Verbrauch
reduziert und in zwei Phasen umgesetzt: konstante Leistung bis 80 %, danach ein exponentiell
auslaufender Ladeschluss. Deshalb bringt oberhalb von 38 W kein Netzteil mehr etwas, und
deshalb lädt bei 1 W mit gleichzeitiger Nutzung gar nichts mehr.

## Datengrundlage

Das **iPad Pro 11″ (2025)** ist mit M5 und Tandem-OLED dokumentiert.

Zum **iPad Air 11″ (2026)** liegen keine offiziellen Spezifikationen vor. Alle Air-Werte sind
Prognosen auf Basis der M4-Generation und in der Vergleichstabelle mit dem Kennzeichen
*Prognose* markiert. Benchmark-, Laufzeit- und Ladewerte sind repräsentative Modellrechnungen,
keine Labormessungen. Preise sind Richtwerte.

Apple, iPad, iPad Air und iPad Pro sind Marken von Apple Inc. Dieses Projekt steht in keiner
Verbindung zu Apple Inc.

## Barrierefreiheit & Kompatibilität

- Vollständig per Tastatur bedienbar, sichtbarer Fokusring, Sprungmarke zum Inhalt.
- `prefers-reduced-motion` schaltet die Scroll-Choreografie und alle Übergänge ab.
- Kein horizontaler Überlauf ab 320 px Breite.
- Benötigt einen Browser mit CSS-3D-Transforms, `IntersectionObserver` und Pointer Events.
