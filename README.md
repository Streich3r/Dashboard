IVY Dashboard V41 – Originale HQ-WebGL-Landschaft mit lokalem Animationspuffer.

Alle Dateien aus Dashboard-main gemeinsam auf GitHub Pages hochladen. Ein Update muss vom bisherigen Dashboard bestätigt werden.

Nach dem ersten vollständigen Rendern speichert die App drei komprimierte echte GPU-Bilder der Landschaft im lokalen Browser-Speicher. Beim nächsten Aufruf erscheinen diese als sich bewegender Bildpuffer sofort, danach übernimmt automatisch die live berechnete WebGL-Landschaft. Erstbesuch ohne Puffer: 2D als Fallback bis WebGL bereit ist. Wetterdaten werden im Hintergrund regelmäßig aktualisiert; Offline-First bleibt bestehen.

In Einstellungen > Wetter & Standort bleibt die Option Nur schnell (2D) als Notfallmodus verfügbar.
