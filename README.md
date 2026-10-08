> **About this fork**
>
> This is a fork of [misterm2310/ambient-overlay-card](https://github.com/misterm2310/ambient-overlay-card).
> All credit for Ambient Overlay Card goes to its creator, **[misterm2310](https://github.com/misterm2310)**:
> thank you for a lovely card! 🙏
>
> The fork only adds a [`halloween/`](halloween/) folder with two standalone cards:
> `halloween-bats-card` (bats with adjustable size and speed) and `halloween-figures-card`
> (a skeleton, ghost, skull, zombie, pumpkin, witch, cat, mummy and vampire that cross the
> screen at random intervals). See [halloween/README.md](halloween/README.md).
> The original card and the documentation below are unchanged.

---

# Ambient Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen über dein Dashboard legt – von echtem Wetter (Regen, Schnee, Hagel, Blitz, Nebel, Sturm, Wolken-Drift) über Himmelsphänomene (Sternenhimmel, Sternschnuppen, Wunschstern, Komet, Mond mit echter Mondphase) bis zu Tieren, Deko- und Anlass-Effekten (Herbstlaub, Geburtstags-Modus, Weihnachtsmann, Spinne mit Netz, goldener Labrador, Dampflok mit optionaler Festtags-Beladung, Fledermäuse, Bienenschwarm, Eule und Vogelhäuschen). Inklusive visuellem GUI-Editor mit **Live-Vorschau**, automatischer Theme-Anpassung und Wetter-Automatik mit echten Kombi-Effekten.

---

## 🎨 Features

* **23 einzeln wählbare Effekte** (plus Sternenhimmel, Mond und Sonne automatisch über die Wetter-Automatik, siehe unten) – siehe Tabelle weiter unten, sinnvoll gruppiert im Editor-Dropdown (Wetter → Himmel/Nacht → Deko/Anlass → Tiere).
* **🚂 Dampflok mit variabler Waggon-Anzahl:** Fährt am unteren Bildschirmrand entlang - erkennbare Lok-Silhouette mit Kessel, Schornstein, Kabine mit Fähnchen, Kuhfänger und Rädern, dazu sichtbarer Dampf, der aus dem Schornstein aufsteigt. Alle Waggon-Fenster und das Lok-Kabinenfenster sind dauerhaft warm beleuchtet, vorne an der Lok-Nase sitzt eine kleine Frontlampe. Die vier festen Waggons sind im Alltag mit Obst, Bauklötzen, Postsäcken und Holzscheiten beladen - optional mit zwei Sensoren umschaltbar auf festliche Weihnachts-Ladung (Schneemann, Weihnachtsmann, Geschenke, Geschenke-Sack) oder Abendessen-Ladung (Geschirr, Braten, Nachtisch, Getränke). Der Zug wird dabei automatisch länger, nicht gestaucht. Zwei kleine Überraschungen: bei jeder Durchfahrt hupt die Lok kurz ("TUUT"-Sprechblase), und ganz selten formt sich einer der Dampf-Puffs kurz zu einem Herz.
* **👥 Personen-Waggons:** Für jede im Editor angehakte Person, die laut `person.`-Entity gerade **zuhause** ist, hängt hinten ein eigener Waggon mit großem Profilbild (oder der Namens-Initiale, falls kein Bild hinterlegt ist). Kommt jemand heim oder geht raus, aktualisiert sich der Zug sofort.
* **🎟️ Gäste-Waggons aus einem Sensor:** Optional einen Sensor auswählen (z. B. ein `input_text`), in dem komma-getrennte Namen stehen - für **jeden Namen** wird ein eigener Waggon angehängt. Ideal z. B. für eine Gästeliste zum Abendessen: trägst du "Marcel, Rudolf" ein, rollen zwei zusätzliche Waggons mit. Ändert sich die Liste, reagiert der Zug sofort. Alternativ geht auch ein fest eingetragener Text.
* **🚦 Schlusswagen:** Ganz am Zugende hängt immer ein kleiner Wagen mit nur zwei Rädern, auf dem zwei Lampen abwechselnd rot und grün blinken - wie ein Bahnübergangs-Signal.
* **🎅 Sensor-gesteuerte Festtags-Beladung:** Optional einen `input_boolean`/`binary_sensor` auswählen (z. B. für die Weihnachtszeit) - ist der Sensor "an", werden die vier Waggons stattdessen festlich beladen: ein großer Schneemann mit Zylinder, ein Weihnachtsmann zwischen zwei Geschenken, zwei große Päckchen mit Schleife und ein prall gefüllter Weihnachtsmann-Sack.
* **🌫️ Sanftes Ausblenden statt abruptem Verschwinden:** Ändert sich das Wetter bei aktiver Wetter-Automatik von selbst, verblasst der alte Effekt sanft, während ein manueller Wechsel im Editor weiterhin sofort umschaltet.
* **👁️ Live-Vorschau im Editor:** Direkt beim Einstellen der Regler siehst du oben im Editor eine kleine, verkleinerte Vorschau des Effekts – ganz ohne zu speichern.
* **🌦️ Optionale Wetter-Automatik:** Statt manuell einen Effekt auszuwählen, kann die Karte sich an einer echten `weather.*`-Entity orientieren und automatisch den passenden Effekt zeigen.
* **⛈️ Echte Kombi-Effekte:** Meldet die Wetter-Entity "Schneeregen", laufen Schnee **und** Regen gleichzeitig; bei "Gewitter mit Regen" laufen Blitz **und** Regen gleichzeitig.
* **☃️ Wachsende Schneedecke:** Läuft der Schnee-Effekt eine Weile, sammelt sich unten am Bildschirmrand langsam eine echte kleine Schneeschicht an.
* **🎂 Geburtstags-Modus:** Sammel-Effekt mit vier einzeln an- und abwählbaren Bestandteilen: aufsteigende Luftballons, Konfetti-Regen, ein Wimpelketten-Banner mit frei einstellbarem Text (Standard "Happy Birthday!") und eine blinkende Lichterkette.
* **🎅🐕☄️🚂🐦 Periodisch durchlaufende Figuren:** Weihnachtsmann, Labrador, Komet, Dampflok und der Vogelhäuschen-Besuch ziehen periodisch durchs Bild statt dauerhaft sichtbar zu sein – wie oft, stellst du über "Anzahl/Frequenz" ein. Der Weihnachtsmann verliert dabei gelegentlich (etwa jeder 3. Vorbeiflug) ein Geschenk, das aus dem Schlitten fällt.
* **🕷️ Spinne mit Netz:** Mathematisch berechnetes, symmetrisches Netz oben rechts, eine Spinne mit blinkenden roten Augen seilt sich daran auf und ab - verliert dabei mitten im Abstieg kurz den Halt, seilt sich hektisch wieder hoch, und tut dann so, als wäre nichts gewesen.
* **🐕 Goldener Labrador:** Läuft mit echter Beinbewegung (diagonale Beinpaare schwingen gegenläufig wie im echten Trab), dazu Schwanzwedeln, Kopfnicken, eine kurze Schnüffel-Pause mitten im Lauf und verblassende Pfotenabdrücke. Optional schüttelt er sich kurz, wenn eine angegebene Wetter-Entity gerade Regen meldet.
* **🦇 Fledermäuse:** Mehrere flatternde Silhouetten über den kompletten Bildschirm verteilt, theme-abhängig eingefärbt, damit sie auf **jedem** Theme sichtbar bleiben.
* **🦉🐦 Eule & Vogelhäuschen:** Ein gemeinsamer Effekt oben links, der sich nach Sonnenstand abwechselt – tagsüber das Vogelhäuschen (mit Vogel, der periodisch vorbeifliegt), nachts die Eule auf ihrem Ast (mit Federstruktur, Ohrbüscheln und abwechselndem Blinzeln). Umgeschaltet wird über `sun.sun`, ganz ohne zusätzliche Konfiguration.
* **🐝 Bienenschwarm:** 5-8 Bienen gleichzeitig, jede mit eigenem Zickzack-Pfad über den kompletten Bildschirm.
* **🌤️ Wolken-Drift:** Mehrere weiche, zart verschwommene Wolken ziehen über den kompletten Bildschirm - theme-abhängig eingefärbt und mit gleichmäßig verteiltem Zeitversatz, damit möglichst durchgehend mindestens eine Wolke zu sehen ist.
* **🌠 Nachthimmel:** Sammel-Effekt mit drei einzeln an- und abwählbaren Bestandteilen: Sternschnuppen, Wunschstern-Funkeln (ein einzelner Stern, der aufleuchtet, verschwindet und an neuer Stelle wieder aufblitzt) und ein seltener, dramatischer Komet mit langem Schweif.
* **✨ Sternenhimmel mit Teleport-Effekt:** Jeder einzelne Stern springt zwischen mehreren zufälligen Positionen hin und her - läuft komplett über CSS, ressourcenschonend auch auf schwächeren Geräten. Läuft ausschließlich über die Wetter-Automatik (bei klarer Nacht), nicht mehr als eigenständig wählbarer Effekt - das vermeidet doppelte Sterne, falls man zusätzlich noch eine eigene Sternenhimmel-Karte hätte.
* **🌙 Mond mit echter Mondphase:** Erscheint oben rechts (Spiegelbild der Eulen-/Vogelhäuschen-Position), sobald die Sonne untergegangen ist - unabhängig vom Wetter, läuft also z. B. auch zusammen mit Regen oder Schnee bei Nacht. Die Mondphase (Neumond bis Vollmond) wird direkt aus dem aktuellen Datum berechnet, kein zusätzlicher Sensor nötig. Krater sind nur im jeweils beleuchteten Teil sichtbar. Nur über die Wetter-Automatik, nicht einzeln wählbar.
* **☀️ Sonne bei "sonnig":** Teilt sich denselben Platz wie der Mond (Tag und Nacht schließen sich ja gegenseitig aus), mit warmem, sanft pulsierendem Lichtschein. Nur über die Wetter-Automatik, nicht einzeln wählbar.
* **🌗 Auto-Theme-Modus mit View-Theme-Unterstützung:** Erkennt automatisch Hell-/Dunkelmodus – auch wenn das Theme nur auf einer einzelnen Dashboard-Seite gesetzt ist.
* **✨ Echtes "Kräftig":** Bei maximaler Deckkraft wird jeder Effekt spürbar kräftiger dargestellt.
* **GUI-Editor mit Kontext:** Der Editor blendet nur die Regler ein, die für den aktuell gewählten Effekt auch wirklich etwas tun.
* **🔒 Sicherheit:** Benutzerdefinierte Laub-SVG-Formen werden über eine Whitelist geprüft; der Geburtstags-Banner-Text wird automatisch gegen Schadcode abgesichert.
* **🔋 Akku- und ressourcenschonend:** Animationen pausieren automatisch, sobald das Dashboard-Tab im Hintergrund ist. Fast alle Effekte laufen rein über CSS (GPU-beschleunigt).
* **🎯 Robuste Sichtbarkeit:** Effekte werden in einen unabhängigen Container direkt in `<body>` gerendert, mit einem extrem hohen Stapel-Wert (z-index) - dadurch werden sie zuverlässig als Vollbild-Overlay angezeigt, selbst über anderen Custom Cards mit eigenen Übergangs-Animationen.

---

## 📦 Installation

### Über HACS (Empfohlen)

1. Öffne **HACS** in deiner Home Assistant Seitenleiste.
2. Klicke oben rechts auf die drei Punkte (`⋮`) → **Benutzerdefinierte Repositories**.
3. Füge deine GitHub-Repository-URL ein:
   `https://github.com/misterm2310/ambient-overlay-card`
4. Wähle als Kategorie **Lovelace**.
5. Klicke auf **Hinzufügen** und anschließend auf **Herunterladen**.
6. Lade dein Dashboard neu (`Strg` + `F5`).

---

### Manuelle Installation

1. Lade die Datei `ambient-overlay-card.js` aus dem aktuellen Release herunter.
2. Kopiere die Datei in deinen Home Assistant Ordner: `/config/www/ambient-overlay-card.js`.
3. Gehe in Home Assistant zu **Einstellungen → Dashboards → Drei Punkte oben rechts → Ressourcen**.
4. Füge eine neue Ressource hinzu:
   * **URL:** `/local/ambient-overlay-card.js`
   * **Typ:** JavaScript-Modul
5. Lade dein Dashboard neu.

> 💡 **Tipp bei Update-Problemen:** Falls nach einem Update alles beim Alten bleibt, liegt's fast immer am Browser-Cache. Harten Reload machen (`Strg` + `Shift` + `R`) oder die Ressourcen-URL kurz um `?v=2` (nächste Zahl hochzählen) ergänzen.

---

### 🔄 Umstieg von der Vorgänger-Karte

Diese Karte hieß früher **Weather & Event Overlay Card** (`weather-event-overlay-card`). Wer von dieser Version kommt, muss drei Dinge anpassen:

1. **Ressource:** Alte Ressourcen-URL (`/local/weather-event-overlay-card.js`) entfernen, neue hinzufügen (`/local/ambient-overlay-card.js`). Bei HACS stattdessen das alte Repository entfernen und das neue hinzufügen.
2. **Dashboard-Karten:** In jeder Karte die Zeile `type: custom:weather-event-overlay-card` ändern in `type: custom:ambient-overlay-card`.
3. **Neu laden:** Harten Reload machen (`Strg` + `Shift` + `R`).

Alle Konfigurationsoptionen (`event`, `count_preset`, `person_entities`, ...) bleiben unverändert – du musst also nur den Typ austauschen, sonst nichts.

### ⚠️ Zusammengelegte und entfernte Effekte

Um die Effektliste übersichtlich zu halten, wurden mehrere Effekte zusammengelegt. Die alten `event`-Werte funktionieren **nicht** mehr und müssen ersetzt werden:

| Alt | Neu |
|---|---|
| `owl`, `birdhouse` | `owl_birdhouse` (wechselt selbst nach Sonnenstand) |
| `shooting_stars`, `wishstar`, `comet` | `night_sky` (Bestandteile einzeln abwählbar) |
| `balloons`, `lights` | `birthday` (Bestandteile einzeln abwählbar) |
| `rain`, `snow`, `hail`, `lightning`, `fog`, `storm`, `clouds` | `weather_auto` – diese Effekte laufen nur noch über die Wetter-Automatik |
| `gnome_door` | ersatzlos entfernt |

---

## 🖱️ Einrichtung über den GUI-Editor (empfohlen)

Karte zum Dashboard hinzufügen → **Ambient Overlay Card** auswählen → im Editor:

1. Oben siehst du direkt eine **Live-Vorschau** – die aktualisiert sich automatisch, während du unten Einstellungen änderst.
2. **Effekt** wählen – entweder einen festen Effekt (Nachthimmel, Eule & Vogelhäuschen, Dampflok, Geburtstags-Modus, ...) oder **"🌦️ Automatisch (nach Wetter)"**. Die reinen Wetter-Effekte (Regen, Schnee, Hagel, Blitz, Nebel, Sturm, Wolken) stehen bewusst **nicht** einzeln in der Liste – die laufen ausschließlich über die Wetter-Automatik.
3. Bei "Automatisch": darunter erscheint **Wetter-Sensor** – dort deine `weather.*`-Entity aus der Liste auswählen.
4. Bei "🎂 Geburtstags-Modus": darunter erscheint ein Feld für den **Banner-Text**.
5. Bei "🚂 Dampflok" erscheinen mehrere optionale Felder:
   * **Weihnachtsmann-Sensor** – wählst du hier einen `input_boolean`/`binary_sensor` aus, schaltet der Zug auf die festliche Beladung um, sobald dieser Sensor "an" ist.
   * **Abendessen-Sensor** – dasselbe für die Abendessen-Beladung (Weihnachten hat Vorrang).
   * **Personen-Waggons** – eine Checkbox-Liste aller `person.`-Entities. Jede angehakte Person, die gerade zuhause ist, bekommt einen eigenen Waggon. Die Reihenfolge der Waggons entspricht der Reihenfolge, in der du sie anhakst.
   * **Gäste-Waggons aus Sensor** – ein Dropdown mit allen `input_text.`, `input_select.` und `sensor.`-Entities. Stehen dort komma-getrennte Namen drin, gibt's pro Name einen Waggon.
   * **Freitext-Waggon** – fester Text als Alternative, falls du keinen Sensor nutzen willst.
6. Bei "🐕 Goldener Labrador": darunter erscheint optional **Wetter-Sensor** – wählst du hier deine echte `weather.*`-Entity aus, schüttelt sich der Hund kurz, sobald diese aktuell Regen meldet.
7. **Anzahl / Frequenz**, **Deckkraft / Helligkeit** und ggf. **Farbmodus** nach Geschmack einstellen.

Der Editor blendet dabei automatisch nur die Regler ein, die für den gewählten Effekt auch etwas bewirken:
* Bei **Weihnachtsmann, Hund, Dampflok, Eule & Vogelhäuschen, Laub, Bienen und Geburtstags-Modus** gibt's keinen Farbmodus (feste Farben).
* Bei der **Spinne** gibt's keine Anzahl (es gibt nur die eine).
* Bei **Weihnachtsmann, Hund, Dampflok, Vogelhäuschen, Komet und Laub** steuert "Anzahl/Frequenz" NICHT eine Partikelmenge, sondern wie oft etwas passiert (Vorbeiziehen, Vorbeifliegen, Windstoß).
* Bei **Fledermäuse, Bienen, Wolken-Drift und Geburtstags-Modus** ist "Anzahl" eine ganz normale Partikelmenge.

### 🌦️ Wie die Wetter-Automatik genau funktioniert

Ist "Automatisch" aktiv, schaut die Karte sich den aktuellen Zustand deiner gewählten Wetter-Entity an und übersetzt ihn automatisch in einen (oder bei zwei Zuständen sogar zwei gleichzeitige) Effekt(e):

| HA-Wetterzustand | Effekt(e) |
|---|---|
| `rainy`, `pouring` | 🌧️ Regen |
| `snowy` | ❄️ Schnee |
| `snowy-rainy` | ❄️ Schnee **+** 🌧️ Regen gleichzeitig |
| `hail` | 🧊 Hagel |
| `lightning` | ⚡ Blitz |
| `lightning-rainy` | ⚡ Blitz **+** 🌧️ Regen gleichzeitig |
| `fog` | 🌫️ Nebel |
| `windy`, `windy-variant` | 💨 Sturm |
| `cloudy`, `partlycloudy` | 🌤️ Wolken-Drift |
| `clear-night` | ✨ Sternenhimmel |
| `sunny` | ☀️ Sonne (nur tagsüber) |
| alles andere | Aus |

**Zusätzlich, unabhängig vom Wetter-Zustand:** Sobald die Sonne untergegangen ist (`sun.sun` = `below_horizon`), erscheint automatisch der **🌙 Mond** oben rechts – zusätzlich zu einem eventuell laufenden Wetter-Effekt (z. B. Regen + Mond gleichzeitig bei nächtlichem Regen). Die Mondphase wird direkt aus dem aktuellen Datum berechnet, kein zusätzlicher Sensor nötig. Die Sonne wird dabei ausgeblendet, selbst wenn die Wetter-Entity noch "sunny" meldet – beide sitzen am selben Platz und lägen sonst übereinander.

**Wichtig:** Anzahl, Deckkraft und Farbmodus gelten bei aktiver Automatik als **ein gemeinsamer Wert für alle möglichen Wetter-Effekte**. Alle Tier-, Deko- und Anlass-Effekte (Weihnachtsmann, Hund, Dampflok, Fledermäuse, Bienen, Spinne, Laub, Nachthimmel, Eule & Vogelhäuschen, Geburtstags-Modus) laufen NICHT über die Wetter-Automatik. Wechselt die Wetter-Automatik den Effekt, blendet der alte Effekt sanft aus statt abrupt zu verschwinden - bei einem manuellen Wechsel im Editor passiert das dagegen sofort.

---

## ⚙️ Verwendung (YAML)

### Wetter-Automatik
```yaml
type: custom:ambient-overlay-card
event: weather_auto
weather_entity: weather.home
count_preset: medium
opacity_preset: medium
color_mode: auto
```

### Dampflok mit sensor-gesteuerter Festtags-Beladung
```yaml
type: custom:ambient-overlay-card
event: train
count_preset: medium
opacity_preset: high
santa_sensor: input_boolean.weihnachtszeit
dinner_sensor: input_boolean.schalter_abendessen
person_entities: person.marco, person.sandra
custom_wagon_entity: input_text.gaeste
```

### Dampflok mit fester Gäste-Beschriftung (ohne Sensor)
```yaml
type: custom:ambient-overlay-card
event: train
count_preset: medium
opacity_preset: high
custom_wagon_text: Marcel, Rudolf
```

#### 🚃 Reihenfolge der Waggons

Von der Lok aus gezählt (die Lok fährt vorne):

* **Position 1:** die Lok
* **Position 2–5:** die vier festen Waggons (Alltags-, Weihnachts- oder Abendessen-Ladung)
* **danach:** die Personen-Waggons – in der Reihenfolge, wie du sie im Editor angehakt hast, die zuerst angehakte Person ist am nächsten an der Lok
* **danach:** die Gäste-Waggons – in der Reihenfolge, wie die Namen im Sensor bzw. im Freitext stehen
* **ganz am Ende:** der Schlusswagen mit den blinkenden Lampen – immer das letzte Element

### Goldener Labrador mit Regen-Schütteln (optional)
```yaml
type: custom:ambient-overlay-card
event: dog
count_preset: medium
opacity_preset: high
weather_entity: weather.home
```

### Eule & Vogelhäuschen (wechselt nach Sonnenstand)
```yaml
type: custom:ambient-overlay-card
event: owl_birdhouse
count_preset: medium
opacity_preset: high
```
Tagsüber das Vogelhäuschen, nach Sonnenuntergang die Eule. `count_preset` steuert, wie oft ein Vogel am Häuschen vorbeifliegt.

### Spinne mit Netz (Auto-Farbmodus)
```yaml
type: custom:ambient-overlay-card
event: spider
opacity_preset: medium
color_mode: auto
```

### Geburtstags-Modus mit eigenem Text
```yaml
type: custom:ambient-overlay-card
event: birthday
birthday_text: "Happy Birthday, Max!"
count_preset: medium
opacity_preset: high
```

### Fledermäuse (theme-abhängig)
```yaml
type: custom:ambient-overlay-card
event: bats
count_preset: medium
opacity_preset: high
color_mode: auto
```

### Bienenschwarm
```yaml
type: custom:ambient-overlay-card
event: bee
count_preset: medium
opacity_preset: medium
```

### Nachthimmel (alle Bestandteile)
```yaml
type: custom:ambient-overlay-card
event: night_sky
count_preset: low
opacity_preset: high
color_mode: auto
```

### Nachthimmel – nur der Komet
```yaml
type: custom:ambient-overlay-card
event: night_sky
count_preset: low
opacity_preset: high
night_shooting_stars: false
night_wishstar: false
night_comet: true
```

### Herbstlaub mit eigenem Farbverlauf (nur per YAML einstellbar)
```yaml
type: custom:ambient-overlay-card
event: leaves
count_preset: medium
opacity_preset: medium
leaf_colors:
  - "#c9a227"
  - "#a83232"
  - "#d9812c"
```

---

## 🧩 Verfügbare Effekte

| `event` | Beschreibung |
|---|---|
| `off` | Kein Effekt (Standard) |
| `weather_auto` | 🌦️ Automatisch nach echter Wetter-Entity, inkl. Kombi-Effekten (siehe oben) |
| `night_sky` | 🌠 Nachthimmel – Sammel-Effekt aus Sternschnuppen, Wunschstern und Komet, jedes einzeln abwählbar |
| `owl_birdhouse` | 🦉🐦 Eule & Vogelhäuschen – wechselt automatisch nach Sonnenstand (tags Vogelhäuschen, nachts Eule) |
| `birthday` | 🎂 Geburtstags-Modus – Sammel-Effekt aus Luftballons, Konfetti, Banner mit eigenem Text und Lichterkette, jedes einzeln abwählbar |
| `leaves` | 🍂 Periodischer Herbstwind-Stoß mit 3-Farben-Verlauf |
| `santa` | 🎅 Weihnachtsmann mit Schlitten & 2 Rentieren (periodischer Vorbeiflug, verliert gelegentlich ein Geschenk) |
| `train` | 🚂 Dampflok mit vier Waggons (Obst/Bauklötze/Postsäcke/Holz, optional festliche Sensor-Beladung oder Abendessen-Beladung), beleuchteten Fenstern, Frontlampe, Dampf aus dem Schornstein, Hupen und ganz selten herzförmiger Dampf. Optional erweiterbar um Personen-Waggons, Gäste-Waggons aus einem Sensor und einen blinkenden Schlusswagen |
| `dog` | 🐕 Goldener Labrador mit echter Lauf-Beinbewegung, Schnüffel-Pause und Pfotenabdrücken (optional Schütteln bei Regen) |
| `spider` | 🕷️ Spinnennetz mit auf- und abseilender Spinne (blinkende rote Augen, verliert dabei mal kurz den Halt) |
| `bats` | 🦇 Fledermausschwarm, theme-abhängig eingefärbt |
| `bee` | 🐝 Bienenschwarm (5-8 Stück) im Zickzack-Flug |

### Nur über die Wetter-Automatik

Diese Effekte lassen sich **nicht** einzeln auswählen – sie erscheinen ausschließlich, wenn `event: weather_auto` gesetzt ist und die Wetter-Entity den passenden Zustand meldet:

| Effekt | Wann |
|---|---|
| 🌧️ Regen | `rainy`, `pouring` |
| ❄️ Schnee (mit wachsender Schneedecke) | `snowy`, `snowy-rainy` |
| 🧊 Hagel | `hail` |
| ⚡ Blitz / Gewitter | `lightning`, `lightning-rainy` |
| 🌫️ Nebel | `fog` |
| 💨 Sturm / Windböen | `windy`, `windy-variant` |
| 🌤️ Wolken-Drift | `cloudy`, `partlycloudy` |
| ✨ Sternenhimmel | `clear-night` |
| ☀️ Sonne mit warmem Lichtschein | `sunny`, aber nur solange die Sonne über dem Horizont steht |
| 🌙 Mond mit echter Mondphase | sobald die Sonne untergegangen ist, wetterunabhängig |

---

## 🔧 Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `event` | string | `off` | Welcher Effekt aktiv ist, oder `weather_auto` für die Wetter-Automatik (siehe Tabelle oben) |
| `weather_entity` | string | `""` | HA-Entity-ID einer `weather.*`-Entity, z. B. `weather.home` (bei `event: weather_auto` bestimmt sie den Effekt; bei `event: dog` optional fürs Schütteln bei Regen) |
| `birthday_text` | string | `"Happy Birthday!"` | Text im Banner (nur relevant bei `event: birthday`) - wird automatisch gegen Schadcode abgesichert |
| `birthday_balloons` | bool | `true` | Luftballons im Geburtstags-Modus anzeigen |
| `birthday_confetti` | bool | `true` | Konfetti-Regen im Geburtstags-Modus anzeigen |
| `birthday_banner` | bool | `true` | Wimpelketten-Banner mit Text im Geburtstags-Modus anzeigen |
| `birthday_lights` | bool | `true` | Blinkende Lichterkette im Geburtstags-Modus anzeigen |
| `night_shooting_stars` | bool | `true` | Sternschnuppen im Nachthimmel-Effekt anzeigen |
| `night_wishstar` | bool | `true` | Wunschstern-Funkeln im Nachthimmel-Effekt anzeigen |
| `night_comet` | bool | `true` | Komet im Nachthimmel-Effekt anzeigen |
| `santa_sensor` | string | `""` | HA-Entity-ID eines `input_boolean`/`binary_sensor` (nur relevant bei `event: train`) - ist er "an", tragen die vier Waggons festliche Fracht statt der normalen Alltags-Ladung |
| `dinner_sensor` | string | `""` | HA-Entity-ID eines `input_boolean`/`binary_sensor` (nur relevant bei `event: train`) - ist er "an", tragen die vier Waggons Geschirr, Braten, Nachtisch und Getränke statt der normalen Alltags-Ladung. `santa_sensor` hat Vorrang, falls beide gleichzeitig an wären. |
| `person_entities` | string | `""` | Komma-getrennte Liste von `person.`-Entities (nur relevant bei `event: train`) - für jede Person, die gerade zuhause ist, wird hinten ein Waggon mit Profilbild (falls vorhanden) oder Namens-Initiale angehängt. Im Editor als Checkbox-Liste auswählbar, dieses Feld ist nur für direktes YAML-Schreiben. |
| `custom_wagon_entity` | string | `""` | HA-Entity-ID eines Sensors mit komma-getrennten Namen, z. B. `input_text.gaeste` (nur relevant bei `event: train`) - für **jeden Namen** wird hinten ein eigener Waggon angehängt. Im Editor als Dropdown auswählbar (`input_text.`, `input_select.`, `sensor.`). Hat Vorrang vor `custom_wagon_text`. Ist der Sensor leer oder `unknown`/`unavailable`, entfallen die Waggons. |
| `custom_wagon_text` | string | `""` | Fester Text für zusätzliche Waggons (nur relevant bei `event: train`), falls kein Sensor gewählt ist. Mehrere Namen mit Komma trennen ergibt mehrere Waggons, z. B. `Marcel, Rudolf`. |
| `count_preset` | `low` \| `medium` \| `high` | `medium` | Anzahl bzw. Frequenz – Bedeutung hängt vom Effekt ab (siehe Editor-Hinweistexte oben) |
| `opacity_preset` | `low` \| `medium` \| `high` | `medium` | Deckkraft/Helligkeit des Effekts |
| `color_mode` | `auto` \| `custom` | `auto` | Automatische Theme-Erkennung oder feste Farbe (nur bei Effekten mit Farbmodus) |
| `color` | string (hex) oder `auto` | `auto` | Manuelle Farbe für Effekte mit Farbmodus (Nachthimmel, Fledermäuse, Spinnennetz sowie die Wetter-Effekte der Automatik) |
| `leaf_colors` | Array aus 3 Hex-Farben | `["#c9a227", "#a83232", "#d9812c"]` | Farbverlauf für den Laub-Effekt (nur per YAML editierbar, nicht im GUI-Editor) |
| `leaf_shape` | string (SVG-Pfad) | interne Standardform | Optionale eigene Blattform, nur per YAML (wird sicherheitsgeprüft) |

---

## 📄 Lizenz

MIT
