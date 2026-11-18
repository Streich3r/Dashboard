# IVY Dashboard V40 – Sofort-Partikel + automatische HQ-Wetterkarte

## Installation
Alle Dateien des Ordners `Dashboard-main` gemeinsam in dasselbe GitHub-Pages-Verzeichnis hochladen. `index.html`, `ivy-particles-v40.js`, `ivy-app-v40.js`, `ivy-shell-v40.css`, `ivy-weather-hq-v40.js`, `sw.js` und `version.json` müssen zusammen veröffentlicht werden. Offline-First, atomarer Service-Worker-Cache und Bestätigung vor der Installation bleiben aktiv.

## Startreihenfolge
1. Sofort sichtbarer, lokaler CSS-Hintergrund ohne Wetter-/Netzwerkanfrage.
2. Eigenständiges kleines Partikel-Skript zeichnet sein erstes Bild sofort – bisheriger künstlicher 750-ms-Timer entfernt.
3. Haupt-Dashboard lädt Links, Icons und die 2D-Wetterlandschaft. Web-Favicons und Wetterdaten sind nicht start-blockierend.
4. Nach den ersten UI-Frames und in einem freien Zeitfenster wird der bestehende detaillierte WebGL-Wetterrenderer geladen (Aurora, Landschaft, Glas/Wasser, Niederschlag). Bis zum ersten fertigen GPU-Frame läuft 2D unverändert weiter; anschließend weiche Überblendung.
5. Falls WebGL nicht nutzbar ist, bleibt die 2D-Wetteransicht sichtbar. Unter Einstellungen → Wetter & Standort kann „Nur schnell · 2D ohne WebGL“ gewählt werden.

## Einstellungen und Updates
Bestehende manuelle Einstellungen (einschließlich bewusst ausgewähltem 2D-Modus), Links, Profilbild und Offline-Erkennung bleiben erhalten. Wer in V39 nie eine Qualität ausgewählt hat, erhält nun standardmäßig den automatischen HQ-Wechsel. Updates werden weiterhin im Hintergrund erkannt und nur nach Bestätigung installiert. „Lade-Diagnose kopieren“ bleibt vorhanden und enthält zusätzlich den Zeitpunkt der Partikelinitialisierung und den HQ-Zustand.

## Hinweise
WebGL-Shader werden im Browser nach dem ersten Seitenaufbau kompiliert, nicht in einem separaten GPU-Worker; auf langsamer Hardware kann die spätere HQ-Vorbereitung kurzfristig Rechenzeit benötigen. Der schnelle Modus verhindert dies vollständig. Kein künstlicher Ladebalken und kein Blockieren durch externe Icons.
