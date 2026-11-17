# IVY Dashboard V37 – hellere Nacht, mobile Wetteroptimierung & Einstellungen

## Installation

- Die `index.html` und `sw.js` aus diesem Paket **gemeinsam** im gleichen Verzeichnis von GitHub Pages ersetzen. Falls du V36 noch geöffnet hast, erscheint bei aktiver Internetverbindung nach der Hintergrundprüfung das Update-Popup.
- Im Dashboard: **Einstellungen → Updates & Offline → Jetzt nach Updates suchen**. Du kannst die Version sofort manuell prüfen und bei einem Fund im Popup bestätigen.
- Der Service Worker startet weiterhin offline-first. Neue HTML- und App-Dateien werden **erst nach Bestätigung** übernommen. Wetterdaten werden aus dem lokalen Snapshot angezeigt und im Hintergrund aktualisiert.
- Wenn die automatische Aktualisierung wegen eines älteren Workers nicht greift: Einmal `index.html?ivy_refresh=37` öffnen (Reparaturweg, kein regulärer Start).

## Änderungen

- Nachthimmel, Horizont, Berge und Talboden in WebGL aufgehellt; Aurora heller. Keine künstlichen Glasreflexionen, Tropfen bleiben bestehen.
- Mobile WebGL-Auflösung und GPU-Arbeit reduziert: weniger Raymarch-/Wolkenschritte, kleinere Tropfen-Uniform-Arrays entsprechend den GPU-Grenzen, 20-FPS-Limit und automatische Fallback-Darstellung bei Renderfehlern.
- Einstellungen in aufklappbare Gruppen aufgeteilt. Suchfunktion, Alle öffnen/schließen, gemerkte Gruppen-Zustände. Vorhandene Steuerelemente, Einstellungs-IDs und gespeicherte Werte bleiben bestehen. Die zuvor schon versteckten doppelten Größenregler bleiben verborgen.
- Manuelle Updateprüfung mit Statusanzeige, außerdem Wetteraktualisierung per Knopfdruck.
- Die Option „Ränder ausblenden“ entfernt nun auch die fest eingebaute Profilbild-Umrandung und Profil-Schatten.

## Hinweise

- Nur die **erste Installation** benötigt Netzwerkzugang. Bereits gespeicherte Dashboard-Dateien starten offline.
- Bei fehlendem WebGL zeigt das Dashboard die vorhandene CSS-Wetterfallback-Darstellung statt einer leeren Wetterkarte.
- Es werden keine vorhandenen Benutzer-Einstellungen, Links oder Profilbilder gelöscht.
- Ein echter grafischer Mobilbrowser-Test wurde durch die Netzwerk-Zugriffssperre des Browser-Testcontainers verhindert; die statischen Prüfungen und Simulationen sind keine Garantie für jedes Gerät.
