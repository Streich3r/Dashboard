# IVY Dashboard – bereinigtes Projekt (Build 44)

## Upload (GitHub Pages)
Immer **alle** Dateien und den Ordner `icons/` gemeinsam veröffentlichen.
Ab diesem Build bleiben die Namen dauerhaft unverändert: `index.html`, `app.js`, `app.css`, `weather.js`, `weather-cache.js`, `particles.js`, `sw.js`, `version.json`, `manifest.json`. Neue Versionen überschreiben diese Dateien.

## Darstellung
- Originales HQ-WebGL-Wetter mit Bergen/Tal, Aurora, Regen, Schnee, Glas-Fenstertropfen. Kein sichtbarer 2D-Modus.
- Ein gespeichertes **Standbild der HQ-Landschaft** wird sofort aus dem lokalen Speicher eingeblendet. Danach läuft nur noch die **echte WebGL-Animation**. Dadurch entfällt die zweite 2D-Zeichenschleife samt Bild-Wechselanimationen.
- Falls WebGL auf dem Gerät nicht funktioniert, bleibt die Wetterkarte als CSS-Fallback lesbar.
- Wetter- und Profil-Sichtbarkeit werden unabhängig gespeichert (Desktop/Mobil).
- Wetterdaten und Versionsprüfung laufen im Hintergrund. Der Offline-First-Cache bleibt aktiv; neue App-Versionen werden erst nach Bestätigung übernommen.

## Dateien
- `app.js` Dashboard-Funktionen und Einstellungen
- `app.css` alle Layout- und Designregeln
- `particles.js` Hintergrundanimation
- `weather.js` originaler hochwertiger WebGL-Wetterrenderer
- `weather-cache.js` ruhiges lokales HQ-Startbild, gelegentlich erneuert
- `icons/` sämtliche Browser-, Apple- und PWA-Icons
- `sw.js` atomarer Offline-Cache; `version.json` Datei-Hashes und Build-Nummer

## Upgrade-Hinweis
Die bisherigen `ivy-*-v43.*`-Dateien können nach erfolgreicher Installation und Überprüfung der neuen Version aus GitHub entfernt werden. Vorher NICHT löschen, da offene Tabs und der bisherige Service Worker darauf zugreifen können.
Gespeicherte Links/Einstellungen bleiben im bestehenden Browser. Browser-Cache und LocalStorage nicht pauschal löschen.
