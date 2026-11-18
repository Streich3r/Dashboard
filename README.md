IVY Dashboard V43 – HQ-Wetter und dauerhafter Icon-Cache

Installation
Alle Dateien aus Dashboard-main gemeinsam in das bestehende GitHub-Pages-Verzeichnis hochladen. Wichtig: index.html, sw.js, version.json und die fünf ivy-*-v43-Dateien gehören zusammen. Das angebotene Update im bestehenden Dashboard übernehmen. Für den Offline-Cache HTTPS oder localhost verwenden.

Wetter
Die vorhandene hochwertige Gebirgstal-Wetterkarte bleibt Standard: Fenstertropfen und Wasserbrechung, helle Nacht, sanfte Aurora, dynamischer Niederschlag. Glasreflexion bleibt vollständig ausgeschaltet. Es gibt keine sichtbare 2D-/Qualitätsumschaltung; bei fehlendem WebGL bleibt ein interner Notfall-Fallback erhalten.

Behobene Fehler und Cache-Optimierungen
- Wiederholtes Anhängen desselben Icons setzt ein bereits geladenes Bild nicht mehr auf den Platzhalter zurück.
- Bereits gespeicherte Icons umgehen die Download-/Leerlauf-Warteschlange.
- Favicons und eigene HTTP-/HTTPS-Icon-URLs werden separat und versionsübergreifend gespeichert. Ein Cache-Treffer wird ohne erneuten Netzabruf beantwortet.
- Google-URL-Varianten mit domain und domain_url teilen denselben Cache-Schlüssel. Gleichzeitige identische Netzabrufe werden zusammengeführt.
- Kein vorgeschaltetes unsichtbares Probe-Bild mehr: ein Bildabruf statt Probe plus zweitem Abruf.
- Der Service Worker wird früh registriert. Erstmalige Icon-Abrufe warten kurz auf dessen Aktivierung, ohne die Bedienelemente zu blockieren.
- Lokale Data-/Blob-Icons bleiben unterstützt; bei nicht erreichbaren Diensten bleibt ein sofort sichtbarer Platzhalter erhalten.
- Die HQ-Vorschaubilder werden versionsübergreifend wiederverwendet. Frische Bilder werden nicht bei jedem Start neu aus der GPU ausgelesen. Wettercode/Tageszeit verhindern falsche Vorschauen.
- Initialisierungsreihenfolge der defer-Skripte korrigiert, Größenbeobachtungen gebündelt.
- Der Offline-App-Cache bleibt atomar: HTML-Fingerabdruck, App-Signatur und sämtliche Datei-Hashes werden vor der Aktivierung geprüft. Die beiden vorherigen Generationen und der Icon-Cache bleiben für offene Tabs erhalten.
- Browser-Favicons, Apple-Touch-Icons und PWA-Icons sind in den vorhandenen Größen vollständig enthalten und werden vorab gespeichert.

Prüfung
Alle JavaScript-Dateien syntaxgeprüft. Automatisiert geprüft: wiederholtes Icon-Anhängen, direkte Cache-Treffer, Data-/eigene Icons, veraltete Ladeabschlüsse, Offline-Treffer ohne Netzabruf, Google-Alias-Schlüssel, parallele Bildabrufe, vollständige Installation samt Datei-Hashes, Offline-Navigation und Erhalt der vorherigen Cache-Generation. Die HQ-Shader wurden separat kompiliert und gerendert. Bedienung und Icon-Anzeige wurden zusätzlich im Browser geprüft; dort waren Live-WebGL und ein aktiver Offline-Worker nicht verfügbar, deshalb beruhen deren Funktionsprüfungen auf den separaten Grafik-/Cache-Tests. In Einstellungen → Updates & Offline → Lade-Diagnose kopieren stehen nun auch die Icon-Cache-Zähler.

Browser können bei Speichermangel gespeicherte Daten entfernen. Nach einem erstmalig erfolgreichen Abruf beziehungsweise bei erhaltenem Cache ist kein weiterer Netzabruf für dasselbe Icon nötig.
