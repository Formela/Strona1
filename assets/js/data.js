/* =====================================================================
   data.js — Geräte-, Last- und Vergleichsdaten
   ---------------------------------------------------------------------
   iPad Air 11" (M4)  — vorgestellt 02.03.2026, im Handel seit 11.03.2026
   iPad Pro 11" (M5)  — vorgestellt Oktober 2025, im Handel seit 22.10.2025

   Spezifikationen stammen aus den Herstellerangaben beider Geräte.
   Benchmark-, Laufzeit- und Ladewerte sind Modellrechnungen und als
   solche gekennzeichnet.
   ===================================================================== */

const DEV = {
  air: {
    key:  'air',
    name: 'iPad Air 11″',
    gen:  '2026',
    chip: 'M4',
    accent: '#2997ff',
    battery: { wh: 28.93, maxIn: 20 },   // Wh / Ladeleistung laut Herstellerangabe
    display: { maxNits: 500, hz: 60 },
    socBase: 1.28,                        // W bei Standard-Last
    dispBase: 0.25, dispGain: 3.10,       // W = base + gain * Helligkeit(0..1)
    perf: { st: 3780, mt: 14300, gpu: 48500, bw: 120, ram: 12, sustain: 0.86, ppw: 1286 },
    price: 799, weight: 464, thickness: 6.1
  },
  pro: {
    key:  'pro',
    name: 'iPad Pro 11″',
    gen:  '2025',
    chip: 'M5',
    accent: '#bf5af2',
    battery: { wh: 31.29, maxIn: 38 },
    display: { maxNits: 1000, hz: 120 },
    socBase: 1.63,
    dispBase: 0.10, dispGain: 2.75,
    perf: { st: 4130, mt: 17850, gpu: 75900, bw: 153, ram: 12, sustain: 0.94, ppw: 1373 },
    price: 1099, weight: 444, thickness: 5.3
  }
};

/* ---------------------------------------------------------------------
   Performance-Lasten (Rad Kapitel 02)
   dir:'up'   = höherer Wert ist besser
   dir:'down' = niedrigerer Wert ist besser (Zeiten)
   --------------------------------------------------------------------- */
const PERF_LOADS = [
  {
    id:'web', label:'Web & Multitasking', unit:'Punkte', fmt:'num', dir:'up',
    air:14300, pro:17850,
    note:'Alltagslast: Safari mit vielen Tabs, Mail, Notizen, Split View. Gemessen als Multi-Core-Score.',
    real:'Im Alltag praktisch nicht spürbar — beide iPads laufen hier durchgängig flüssig. Apple beziffert den M4 im Air mit rund 30 % mehr Multi-Core-Leistung gegenüber dem M3-Vorgänger.'
  },
  {
    id:'raw', label:'50 RAW-Fotos exportieren', unit:'s', fmt:'time', dir:'down',
    air:40, pro:31,
    note:'Stapelverarbeitung in Lightroom: 50 RAW-Dateien mit Presets nach JPEG exportieren.',
    real:'Neun Sekunden Differenz pro Stapel — bei zehn Stapeln am Tag anderthalb Minuten.'
  },
  {
    id:'video', label:'4K-ProRes-Export (5 Min.)', unit:'s', fmt:'time', dir:'down',
    air:160, pro:112,
    note:'Fünfminütiger 4K-Schnitt mit drei Spuren, Farbkorrektur und Übergängen, Export in ProRes.',
    real:'Der klassische Pro-Anwendungsfall: Das iPad Pro ist rund ein Drittel früher fertig.'
  },
  {
    id:'game', label:'3D-Gaming mit Raytracing', unit:'fps', fmt:'num', dir:'up',
    air:38, pro:62,
    note:'Aktueller AAA-Titel in hoher Detailstufe mit hardwarebeschleunigtem Raytracing.',
    real:'Der größte Abstand im Test: neun GPU-Kerne gegen zehn mit Neural Accelerators. Erst das 120-Hz-Display des Pro macht die höhere Bildrate auch sichtbar.'
  },
  {
    id:'ai', label:'KI-Bildgenerierung lokal', unit:'s/Bild', fmt:'time', dir:'down',
    air:8.8, pro:3.6,
    note:'Diffusionsmodell vollständig auf dem Gerät, ohne Cloud. Nutzt die Neural Accelerators der M5-GPU.',
    real:'Hier zahlt sich die M5-GPU direkt aus. Beim Arbeitsspeicher gibt es dagegen keinen Unterschied mehr — beide Geräte haben 12 GB.'
  },
  {
    id:'audio', label:'Musikproduktion', unit:'Spuren', fmt:'num', dir:'up',
    air:74, pro:96,
    note:'Maximale Anzahl gleichzeitiger Spuren mit Effekten in einer DAW, bevor Aussetzer auftreten.',
    real:'Seit das Air ebenfalls 12 GB Arbeitsspeicher hat, entscheidet allein die Speicherbandbreite: 120 gegen 153 GB/s.'
  }
];

/* ---------------------------------------------------------------------
   Nutzungsszenarien (Rad Kapitel 03)
   soc  = Multiplikator auf die SoC-Grundlast
   oled = Inhalts-Faktor für die OLED-Leistungsaufnahme des iPad Pro
   hz   = Zusatzleistung des iPad Pro durch 120 Hz ProMotion (W)
   --------------------------------------------------------------------- */
const USE_LOADS = [
  { id:'read',  label:'Lesen & Notizen',        soc:0.50, oled:1.05, hz:0.00, note:'Bücher, PDFs, handschriftliche Notizen mit Apple Pencil — überwiegend helle Seiten.' },
  { id:'web',   label:'Web & Mail',             soc:1.00, oled:1.00, hz:0.00, note:'Surfen im WLAN, Mail, Dokumente — Apples Referenzszenario für „bis zu 10 Stunden“.' },
  { id:'video', label:'Video-Streaming 4K HDR', soc:1.15, oled:1.35, hz:0.00, note:'HDR-Inhalte treiben die Spitzenhelligkeit des OLED nach oben.' },
  { id:'edit',  label:'Foto- & Videoschnitt',   soc:3.10, oled:1.10, hz:0.28, note:'Zeitleiste scrubben, Farbkorrektur, Vorschau-Rendering.' },
  { id:'game',  label:'3D-Gaming',              soc:4.40, oled:1.15, hz:0.28, note:'Anspruchsvolle Titel mit hoher Bildrate und aktiver Grafiklast.' },
  { id:'ai',    label:'KI-Modelle lokal',       soc:5.00, oled:0.95, hz:0.28, note:'Sprachmodell oder Bildgenerierung dauerhaft auf dem Gerät.' }
];

/* Watt-Stufen der Ladetabelle */
const WATT_STEPS = [1, 2.5, 5, 7.5, 10, 12, 15, 18, 20, 25, 30, 35, 40, 45, 50, 60];

/* Schnellwahl am Watt-Rad */
const WATT_PRESETS = [
  { w:1,  t:'1 W · USB-Port' },
  { w:5,  t:'5 W · altes Netzteil' },
  { w:12, t:'12 W · Powerbank' },
  { w:20, t:'20 W · Beipack' },
  { w:40, t:'40 W · Dynamic Power' },
  { w:60, t:'60 W · MacBook-Netzteil' }
];

/* ---------------------------------------------------------------------
   Alle Unterschiede
   win: 'air' | 'pro' | 'tie'
   --------------------------------------------------------------------- */
const DIFFS = [
  // --- Display ---
  { cat:'Display', k:'Technologie',
    air:'Liquid Retina, IPS-LCD, laminiert', pro:'Ultra Retina XDR, Tandem-OLED', win:'pro',
    note:'Zwei übereinanderliegende OLED-Schichten liefern beim Pro Helligkeit ohne Einbrenn-Kompromiss.' },
  { cat:'Display', k:'Auflösung', air:'2360 × 1640 Pixel', pro:'2420 × 1668 Pixel', win:'pro', note:'Beide 264 ppi — der Unterschied stammt allein aus der Displaygröße.' },
  { cat:'Display', k:'Bildwiederholrate', air:'60 Hz, fest', pro:'ProMotion 10 – 120 Hz, adaptiv', win:'pro', note:'Der sichtbarste Alltagsunterschied überhaupt: Scrollen, Pencil-Latenz, Animationen.' },
  { cat:'Display', k:'Helligkeit', air:'500 Nits (SDR)', pro:'1000 Nits (SDR) · 1600 Nits (HDR-Spitze)', win:'pro', note:'Draußen und bei HDR-Material liegen Welten dazwischen.' },
  { cat:'Display', k:'Kontrast', air:'typisch 1200:1', pro:'2.000.000:1', win:'pro', note:'OLED schaltet schwarze Pixel vollständig ab.' },
  { cat:'Display', k:'Glasoption', air:'Standardglas mit Antireflexbeschichtung', pro:'zusätzlich Nanotexturglas (ab 1 TB)', win:'pro', note:'Nanotextur streut Reflexionen, kostet aber Aufpreis und etwas Schärfe.' },

  // --- Chip & Leistung ---
  { cat:'Leistung', k:'Chip', air:'Apple M4', pro:'Apple M5', win:'pro', note:'Eine Generation Unterschied bei Fertigung und GPU-Architektur.' },
  { cat:'Leistung', k:'CPU', air:'8 Kerne', pro:'10 Kerne', win:'pro' },
  { cat:'Leistung', k:'GPU', air:'9 Kerne', pro:'10 Kerne mit Neural Accelerator je Kern', win:'pro', note:'Der eigentliche Sprung des M5 liegt in der GPU, nicht in der CPU.' },
  { cat:'Leistung', k:'Neural Engine', air:'16 Kerne', pro:'16 Kerne + GPU-Beschleunigung', win:'pro' },
  { cat:'Leistung', k:'Arbeitsspeicher', air:'12 GB', pro:'12 GB (16 GB ab 1 TB)', win:'tie', note:'Seit dem M4-Modell hat auch das Air 12 GB — der frühere Nachteil ist weg. Nur die großen Pro-Modelle bieten 16 GB.' },
  { cat:'Leistung', k:'Speicherbandbreite', air:'120 GB/s', pro:'153 GB/s', win:'pro' },
  { cat:'Leistung', k:'Multi-Core (geschätzt)', air:'≈ 14.300 Punkte', pro:'≈ 17.850 Punkte', win:'pro', note:'Rund 25 % Vorsprung. Apple selbst nennt für den M4 im Air 30 % mehr als beim M3-Vorgänger.' },
  { cat:'Leistung', k:'Grafik (geschätzt)', air:'≈ 48.500 Punkte', pro:'≈ 75.900 Punkte', win:'pro', note:'Der größte Leistungsabstand zwischen beiden Geräten.' },
  { cat:'Leistung', k:'Dauerleistung', air:'≈ 86 % nach 20 Minuten', pro:'≈ 94 % nach 20 Minuten', win:'pro', note:'Graphitschicht mit Kupfereinlage im Pro verteilt die Abwärme besser.' },

  // --- Akku & Laden ---
  { cat:'Akku', k:'Kapazität', air:'28,93 Wh', pro:'31,29 Wh', win:'pro', note:'Rund 8 % mehr Energie im dünneren Gehäuse.' },
  { cat:'Akku', k:'Laufzeit (Web, WLAN)', air:'bis zu 10 Stunden', pro:'bis zu 10 Stunden', win:'tie', note:'Herstellerangabe für beide identisch — im Alltag entscheidet der Bildinhalt.' },
  { cat:'Akku', k:'Laufzeit bei dunklen Inhalten', air:'unverändert', pro:'deutlich länger', win:'pro', note:'Schwarze OLED-Pixel verbrauchen praktisch nichts.' },
  { cat:'Akku', k:'Laufzeit bei hellen Inhalten', air:'stabil', pro:'sinkt schneller', win:'air', note:'Eine weiße Textseite bei voller Helligkeit ist die Paradedisziplin des IPS-Panels.' },
  { cat:'Akku', k:'Ladeleistung', air:'20 W', pro:'bis 60 W (Schnellladen)', win:'pro', note:'Der deutlichste Unterschied beim Laden: Oberhalb von 20 W bringt dem Air ein stärkeres Netzteil nichts mehr.' },
  { cat:'Akku', k:'50 % Ladung', air:'≈ 1 Std. 22 Min.', pro:'≈ 29 Min. (ab 60 W)', win:'pro', note:'Herstellerangabe für das Pro: 50 % in rund 30 Minuten mit einem 60-W-Netzteil.' },
  { cat:'Akku', k:'Volle Ladung', air:'≈ 2 Std. 11 Min.', pro:'≈ 1 Std. 21 Min.', win:'pro' },
  { cat:'Akku', k:'Mitgeliefertes Netzteil', air:'20 W USB-C', pro:'20 W USB-C', win:'tie', note:'Das Schnellladen des Pro erfordert ein separat gekauftes Netzteil.' },

  // --- Kamera & Video ---
  { cat:'Kamera', k:'Rückkamera', air:'12 MP Weitwinkel', pro:'12 MP Weitwinkel', win:'tie' },
  { cat:'Kamera', k:'Frontkamera', air:'12 MP im Querformat, Folgemodus', pro:'12 MP im Querformat, Folgemodus', win:'tie', note:'Beide Geräte haben die Kamera an der Längsseite — ideal für Videocalls.' },
  { cat:'Kamera', k:'LiDAR-Scanner', air:'nicht vorhanden', pro:'vorhanden', win:'pro', note:'Relevant für AR, 3D-Scans und Raumvermessung.' },
  { cat:'Kamera', k:'Blitz', air:'nicht vorhanden', pro:'adaptiver True-Tone-Blitz', win:'pro', note:'Ermöglicht Dokumentenscans ohne Schatten.' },
  { cat:'Kamera', k:'Videoformate', air:'4K, HDR', pro:'zusätzlich ProRes und Log', win:'pro' },
  { cat:'Kamera', k:'Entsperrung', air:'Touch ID in der Ein-/Aus-Taste', pro:'Face ID mit TrueDepth', win:'pro', note:'Face ID funktioniert unabhängig von Halteposition und nassen Fingern.' },

  // --- Audio ---
  { cat:'Audio', k:'Lautsprecher', air:'2 (Stereo im Querformat)', pro:'4 (Stereo im Quer- und Hochformat)', win:'pro', note:'Der deutlichste Unterschied beim Filmschauen ohne Kopfhörer.' },
  { cat:'Audio', k:'Mikrofone', air:'2 Mikrofone', pro:'4 Studiomikrofone', win:'pro' },
  { cat:'Audio', k:'Räumliches Audio', air:'Dolby Atmos', pro:'Dolby Atmos', win:'tie' },

  // --- Anschlüsse & Funk ---
  { cat:'Anschlüsse', k:'Port', air:'USB-C, 10 Gbit/s', pro:'Thunderbolt / USB 4, 40 Gbit/s', win:'pro', note:'Viermal schnellere Übertragung bei externen SSDs — spürbar beim Videoschnitt.' },
  { cat:'Anschlüsse', k:'Externes Display', air:'bis 6K', pro:'bis 6K', win:'tie' },
  { cat:'Anschlüsse', k:'WLAN', air:'Wi-Fi 7 (Apple N1)', pro:'Wi-Fi 7 (Apple N1)', win:'tie', note:'Mit dem M4-Modell hat das Air denselben Funkchip wie das Pro — inklusive Bluetooth 6 und Thread.' },
  { cat:'Anschlüsse', k:'Mobilfunk (optional)', air:'5G mit C1X-Modem', pro:'5G mit C1X-Modem', win:'tie', note:'Auch beim Modem gibt es keinen Unterschied mehr.' },

  // --- Zubehör ---
  { cat:'Zubehör', k:'Apple Pencil Pro', air:'unterstützt', pro:'unterstützt', win:'tie' },
  { cat:'Zubehör', k:'Apple Pencil USB-C', air:'unterstützt', pro:'unterstützt', win:'tie' },
  { cat:'Zubehör', k:'Pencil-Latenz', air:'durch 60 Hz begrenzt', pro:'geringer dank 120 Hz', win:'pro', note:'Beim Zeichnen der spürbarste Vorteil des ProMotion-Displays.' },
  { cat:'Zubehör', k:'Magic Keyboard', air:'ohne Funktionsreihe, Kunststoff-Handballenauflage', pro:'mit Funktionsreihe, Aluminium, größeres Trackpad', win:'pro' },

  // --- Format ---
  { cat:'Format', k:'Dicke', air:'6,1 mm', pro:'5,3 mm', win:'pro', note:'0,8 mm klingt wenig — in der Hand sind es rund 13 % weniger Bauhöhe.' },
  { cat:'Format', k:'Gewicht', air:'464 g (WLAN)', pro:'444 g (WLAN)', win:'pro', note:'20 g Unterschied, spürbar erst beim längeren Halten mit einer Hand.' },
  { cat:'Format', k:'Abmessungen', air:'247,6 × 178,5 mm', pro:'249,7 × 177,5 mm', win:'tie' },
  { cat:'Format', k:'Farben', air:'Blau, Violett, Polarstern, Space Grau', pro:'Space Schwarz, Silber', win:'air', note:'Das Air bietet die größere Auswahl.' },

  // --- Preis ---
  { cat:'Preis', k:'Einstiegspreis', air:'ab 799 €', pro:'ab 1.099 €', win:'air', note:'300 € Unterschied — etwa der Preis eines Magic Keyboard oder eines Speicher-Upgrades.' },
  { cat:'Preis', k:'Basisspeicher', air:'128 GB', pro:'256 GB', win:'pro', note:'Beim Air ist die 128-GB-Version für Videoschnitt zu knapp bemessen.' },
  { cat:'Preis', k:'Maximaler Speicher', air:'1 TB', pro:'2 TB', win:'pro' },
  { cat:'Preis', k:'Preis pro Leistungspunkt', air:'besser', pro:'schlechter', win:'air', note:'Rein rechnerisch liefert das Air deutlich mehr Rechenleistung je Euro.' }
];

/* ---------------------------------------------------------------------
   Empfehlungsrechner
   bias gewichtet nicht, wer gewinnt, sondern wie stark der Vorsprung eine
   Kaufentscheidung tatsächlich verschiebt. Der Preis ist das stärkste
   Gegengewicht — sonst gewänne das Pro jede Kategorie automatisch.
   --------------------------------------------------------------------- */
const WEIGHTS = [
  { id:'display', label:'Display & Bildqualität', bias:+0.85, def:2, why:'ProMotion mit 120 Hz, OLED-Kontrast und 1600 Nits HDR' },
  { id:'perf',    label:'Rechenleistung',         bias:+0.50, def:2, why:'M5 mit zehn GPU-Kernen gegenüber M4 mit neun — beim Arbeitsspeicher sind beide gleichauf' },
  { id:'battery', label:'Akkulaufzeit',           bias:-0.05, def:2, why:'praktisch gleichauf — unter Volllast liegt das Air sogar leicht vorn' },
  { id:'charge',  label:'Ladetempo',              bias:+0.70, def:1, why:'Schnellladen bis 60 W statt fester 20 W' },
  { id:'camera',  label:'Kamera & AR',            bias:+0.60, def:0, why:'LiDAR, Blitz und ProRes-Aufnahme gibt es nur im Pro' },
  { id:'audio',   label:'Klang',                  bias:+0.55, def:0, why:'vier statt zwei Lautsprecher' },
  { id:'draw',    label:'Zeichnen & Notizen',     bias:+0.50, def:1, why:'spürbar geringere Pencil-Latenz durch 120 Hz' },
  { id:'weight',  label:'Gewicht & Bauform',      bias:+0.30, def:0, why:'5,3 mm und 444 g statt 6,1 mm und 464 g' },
  { id:'price',   label:'Preis-Leistung',         bias:-1.15, def:2, why:'300 € Ersparnis — der größte Einzelfaktor im Vergleich' }
];
