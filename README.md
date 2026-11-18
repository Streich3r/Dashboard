IVY Dashboard V45 – bereinigte Offline-Cache-Strategie

Bei bestätigtem Update wird zuerst das neue Komplettpaket aus HTML, CSS, JS, Manifest und Icons heruntergeladen und anhand der Prüfsummen geprüft. Erst nach Aktivierung des neuen Service Workers werden alle bisherigen ivy-dashboard-shell-* Caches gelöscht. Nur ein Shell-Cache bleibt.

Bewusst erhalten bleiben: localStorage und sessionStorage (Einstellungen, Links, Orte, Wetterdaten, gespeicherte HQ-Wetterbilder), IndexedDB, sowie der separate ivy-dashboard-favicons-v1 Cache für Website-Icons.

Wichtig: Alle Dateien aus Dashboard-main gemeinsam auf GitHub Pages ersetzen. Feste Dateinamen bleiben erhalten. Bei bereits installierter V44 das Update-Popup bestätigen. Bei Offline-Nutzung wird kein Cache gelöscht.
