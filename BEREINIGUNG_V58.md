# Technische Bereinigung – V58

Ausgangsversion: **V57**. Die Überarbeitung ist bewusst konservativ und verändert keine gespeicherten Datenformate.

## Entfallene Reste

- 198 vollständig verwaiste CSS-Regeln und 319 Selektoren (alte Wolken-/Schnee-/Blitz-/Sterne-DOM-Effekte, frühere Ziehgriffe, historische Overlays).
- 24 nicht mehr referenzierte CSS-Keyframes, 139 Altkommentare.
- Nie aufgerufene Funktionen: `ivyFallbackDialIcon`, `sizes`, `initHeader`, `initLight`, die veraltete V23-Lichtinitialisierung, `moonPhase`, `updateWeather`, `hashHTML`.
- Die alte V10-Lichtoberfläche mit veraltetem Escape-Handler; der einzige produktive Lichtmodus ist V27.
- Ein unerreichbarer Zweig in `reflowMobileWeather`.
- CSS wurde unter Erhalt der Selektor-Reihenfolge und deklarierter Werte kompakt formatiert.

## Größe der Laufzeitquellen

| Datei | V57 | V58 |
|---|---:|---:|
| `app.css` | 186,634 B | 131,472 B |
| `app.js` | 204,249 B | 193,830 B (vor Versionsanpassung) |

## Bewusst erhalten

- Aktive `ivyVXX`-Schnittstellen, auch wenn ihre Namen historisch sind: Sie werden von mehreren aktuellen Modulen verwendet.
- Alle Einstellungen, Wetterdaten, Größen, Positions- und Mobil-/Desktop-Speicherschlüssel, damit alte Profile und Backups weiter funktionieren.
- `weather.js` (Canvas2D), `particles.js`, das Offline-Update mit vollständiger Hash-Prüfung und den unveränderten `icons/`-Pfaden.
- Die Bilddateien verschiedener Auflösungen sind für Manifest, Apple-/Browser-Icons und Offline-Betrieb relevant.

## Prüfungen und Grenzen

JavaScript-Syntax, CSS-Parser, Rendering-Vergleich V57/V58 bei 390 und 1366 px, aktive Settings, Wetter, Uhr, Lichtmodus, Drag-&-Drop und Positionsspeicherung auf Mobil/Desktop sowie Update-Integrität wurden getestet. Ein vollständiger Regressionstest in allen verfügbaren Browsern und auf jeder Hardware ist weiterhin erforderlich, bevor Funktionsgleichheit überall garantiert werden kann.
