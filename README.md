# IVY Dashboard V58 – Codebereinigung

V57 ist die funktionale Grundlage. V58 entfernt nur ungenutzte bzw. nicht erreichbare Programmteile, frühere Wetter-DOM-Animationen, doppelte historische Lichtmodus-Oberflächen und tote CSS-Regeln. Der aktuelle Canvas2D-Wetterrenderer, Drag & Drop, Profil, Uhr, Suchfunktion, Link-Editor, Sprachwahl, Datensicherung und die bestätigungspflichtige Offline-Aktualisierung bleiben erhalten.

**Veröffentlichung:** Den **gesamten Inhalt von `Dashboard-main/`** mit den unveränderten Dateinamen auf GitHub Pages ersetzen. **Niemals** nur `index.html` einzeln aktualisieren: Der Service Worker verifiziert stets das vollständige Paket und aktiviert es erst nach Bestätigung. Keine Nutzerdaten, `localStorage`-Schlüssel oder Favicons löschen.

Die bewusst belassenen `ivyVXX`-Schnittstellen und Legacy-Speicherschlüssel werden weiterhin von aktiven Einstellungs- und Layoutmodulen benötigt und dürfen ohne Migrationsprüfung nicht umbenannt werden. `BEREINIGUNG_V58.md` enthält Details.
