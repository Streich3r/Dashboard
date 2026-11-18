/* IVY V40 app – background particles extracted and booted separately. */

;
/* from <script type="text/javascript"> */

// IVY background runs in its own optimized canvas loop.


	// =================================================================
	// HILFSFUNKTIONEN FÜR LOCALSTORAGE & FAVICON
	// =================================================================

// Liest die Quick Dials aus dem LocalStorage
window.getDialsFromLocalStorage = () => {
    try {
        const dialsJson = localStorage.getItem('quickDials');
        return dialsJson ? JSON.parse(dialsJson) : [];
    } catch (e) {
        console.error("Fehler beim Lesen der Dials aus LocalStorage:", e);
        return [];
    }
};

// Speichert die Quick Dials im LocalStorage und rendert sie neu
window.saveDialsToLocalStorage = (dials) => {
    try {
        localStorage.setItem('quickDials', JSON.stringify(dials));
        renderQuickDials(dials); // Ruft die Render-Funktion auf, um die Ansicht zu aktualisieren
    } catch (e) {
        console.error("Fehler beim Speichern der Dials in LocalStorage:", e);
        alert("Speichern fehlgeschlagen. Der Speicher ist möglicherweise voll.");
    }
};

/* IVY V40: fast, local placeholders + bounded, nonblocking real favicon downloads. */
const ivyIconQueue=(()=>{
 const pending=[],visited=new WeakMap();let active=0,armed=false;
 const maxConcurrent=3;
 function svg(title){
  const label=(String(title||'↗').trim().match(/[\p{L}\p{N}]/gu)||['↗']).slice(0,2).join('').toLocaleUpperCase('de');
  const letters=label.replace(/[&<>"']/g,'');
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#142f49"/><stop offset="1" stop-color="#34245e"/></linearGradient></defs><rect width="64" height="64" rx="17" fill="url(#a)"/><rect x="2" y="2" width="60" height="60" rx="15" stroke="#57dce9" stroke-opacity=".5" fill="none"/><text x="32" y="41" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-weight="700" font-size="24" fill="#e6fbff">'+letters+'</text></svg>');
 }
 function pump(){
  while(active<maxConcurrent&&pending.length){
   const task=pending.shift();if(!task.el.isConnected)continue;
   active++;
   const candidate=new Image();let done=false;
   const timer=setTimeout(()=>finish(false),6500);
   function finish(ok){if(done)return;done=true;clearTimeout(timer);candidate.onload=null;candidate.onerror=null;active--;
    if(ok&&task.el.isConnected&&task.el.dataset.ivyIconUrl===task.url){task.el.onload=()=>task.el.classList.add('ivy-icon-loaded');task.el.onerror=()=>{task.el.onerror=null;task.el.src=task.placeholder;task.el.classList.remove('ivy-icon-loaded')};task.el.src=task.url;}
    pump();
   }
   candidate.onload=()=>finish(true);candidate.onerror=()=>finish(false);
   candidate.decoding='async';candidate.fetchPriority='low';candidate.src=task.url;
  }
 }
 function schedule(){if(armed)return;armed=true;
  const run=()=>{armed=false;pump()};
  if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:1100});else setTimeout(run,200);
 }
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const e of entries){if(e.isIntersecting){observer.unobserve(e.target);const t=e.target.__ivyIconPending;if(t){pending.push(t);schedule()}}}
 },{rootMargin:'250px'}):null;
 function attach(el,url,title){
  if(!el)return;
  const placeholder=svg(title);el.src=placeholder;el.decoding='async';el.loading='lazy';el.fetchPriority='low';el.dataset.ivyIconUrl=url||'';
  el.classList.remove('ivy-icon-loaded');
  if(!url||!/^https?:\/\//i.test(url))return;
  if(visited.get(el)===url)return;visited.set(el,url);
  const task={el,url,placeholder};
  if(observer){el.__ivyIconPending=task;observer.observe(el)}else{pending.push(task);schedule()}
 }
 return {attach,svg};
})();

// Hilfsfunktion zum Laden von Favicons
function getFaviconUrl(url) {
    let domain = '';
    try { domain = new URL(url, window.location.href).hostname; } catch(e) { return ''; }
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`; 
}

        // =================================================================
        // GLOBALE VARIABLEN & HILFSFUNKTIONEN
        // =================================================================
        const LOCAL_STORAGE_KEYS = ['profileGifBase64', 'quickDials', 'weatherCity', 'dashboardSettings', 'itemPositions', 'selectedSearchEngineId', 'autofillDisabled', 'ivyWeatherSnapshot', 'ivyV14Workspace_mobile', 'ivyV14Workspace_desktop'];
        const DRAGGABLE_ITEMS = [
            'weather-fixed-container', 
            'profile-fixed-container', 
            'settings-fixed-container', 
            'import-fixed-container', 
            // 'export-fixed-container',
	    // Overlay itself must always cover the entire viewport

	    'light-mode-fixed-container'
        ];
        let isDragging = false;
        let settingsSnapshot = null; 
        
        // =================================================================
        // Suchmaschinen Konfiguration 
        // =================================================================

        const SEARCH_ENGINES = [
            { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
            { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'https://duckduckgo.com/favicon.ico' },
            { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', icon: 'https://www.youtube.com/favicon.ico' },
            { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
            { id: 'wikipedia', name: 'Wikipedia', url: 'https://de.wikipedia.org/wiki/Spezial:Search/', icon: 'https://de.wikipedia.org/favicon.ico' },
            { id: 'startpage', name: 'Startpage', url: 'https://www.startpage.com/sp/search?query=', icon: 'https://www.startpage.com/favicon.ico' },
            { id: 'ecosia', name: 'Ecosia', url: 'https://www.ecosia.org/search?q=', icon: 'https://www.ecosia.org/favicon.ico' },
            { id: 'perplexity', name: 'Perplexity AI', url: 'https://www.perplexity.ai/search?q=', icon: 'https://www.perplexity.ai/favicon.ico' },
            { id: 'chatgpt', name: 'ChatGPT Prompt', url: 'https://chat.openai.com/?q=', icon: 'https://chat.openai.com/favicon.ico' },
            { id: 'deepl', name: 'DeepL Translate', url: 'https://www.deepl.com/translator#de/en/', icon: 'https://www.deepl.com/favicon.ico' }
        ];
        const SEARCH_ENGINE_KEY = 'selectedSearchEngineId';

        // Konvertiert HEX zu RGB für CSS-Variable --bg-color-rgb
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '31, 41, 55';
        }





        // =================================================================
        // EINSTELLUNGEN
        // =================================================================

function ivyRgb(hex) {const v=(hex||'#000000').replace('#','');const n=parseInt(v,16);return `${n>>16&255},${n>>8&255},${n&255}`;}
function applyIvySearchStyle(settings){
    const root=document.documentElement;
    const a=settings.searchFollowTheme?settings.primaryColor:settings.searchColorA;
    const b=settings.searchFollowTheme?settings.secondaryColor:settings.searchColorB;
    const pow=Math.max(0,Math.min(1.5,(Number(settings.searchGlow) || 0)/100));
    const speed=Math.max(25,Math.min(250,Number(settings.searchSpeed)||100));
    root.style.setProperty('--ivy-search-a',a);
    root.style.setProperty('--ivy-search-b',b);
    root.style.setProperty('--ivy-search-bg',`rgba(${ivyRgb(settings.bgColor)},${(Number(settings.searchOpacity)||0)/100})`);
    root.style.setProperty('--ivy-menu-bg',`rgba(${ivyRgb(settings.bgColor)},${(Number(settings.searchMenuOpacity)||0)/100})`);
    root.style.setProperty('--ivy-search-power',pow);
    root.style.setProperty('--ivy-search-radius-a',Math.round(pow*30)+'px');
    root.style.setProperty('--ivy-search-radius-b',Math.round(pow*45)+'px');
    root.style.setProperty('--ivy-search-duration',(7.5*100/speed).toFixed(2)+'s');
    root.style.setProperty('--ivy-search-border-alpha',(Number(settings.searchBorderOpacity)||0)/100);
    document.body.classList.remove('ivy-search-static','ivy-search-pulse','ivy-search-off');
    if(settings.searchEffect==='static')document.body.classList.add('ivy-search-static');
    if(settings.searchEffect==='pulse')document.body.classList.add('ivy-search-pulse');
    if(settings.searchEffect==='off')document.body.classList.add('ivy-search-off');
    const enabled=!settings.searchFollowTheme;
    for(const id of ['setting-search-color-a','setting-search-color-b']){const el=document.getElementById(id);if(el){el.disabled=!enabled;el.style.opacity=enabled?'1':'.45';}}
}
function hydrateIvySearchControls(s){
    const pairs={searchFollowTheme:'setting-search-follow-theme',searchColorA:'setting-search-color-a',searchColorB:'setting-search-color-b',searchEffect:'setting-search-effect',searchGlow:'setting-search-glow',searchSpeed:'setting-search-speed',searchOpacity:'setting-search-opacity',searchMenuOpacity:'setting-search-menu-opacity',searchBorderOpacity:'setting-search-border-opacity'};
    for(const [k,id] of Object.entries(pairs)){const el=document.getElementById(id);if(!el)continue;if(el.type==='checkbox')el.checked=!!s[k];else el.value=s[k];}
    for(const k of ['searchGlow','searchSpeed','searchOpacity','searchMenuOpacity','searchBorderOpacity']){const el=document.getElementById('setting-'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+'-value');if(el)el.textContent=s[k]+'%';}
    applyIvySearchStyle(s);
}
function readIvySearchControls(s){
    const ids={searchFollowTheme:'setting-search-follow-theme',searchColorA:'setting-search-color-a',searchColorB:'setting-search-color-b',searchEffect:'setting-search-effect',searchGlow:'setting-search-glow',searchSpeed:'setting-search-speed',searchOpacity:'setting-search-opacity',searchMenuOpacity:'setting-search-menu-opacity',searchBorderOpacity:'setting-search-border-opacity'};
    for(const [k,id] of Object.entries(ids)){const el=document.getElementById(id);if(!el)continue;s[k]=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;}
    for(const [k,id] of Object.entries(ids)){if(!['searchGlow','searchSpeed','searchOpacity','searchMenuOpacity','searchBorderOpacity'].includes(k))continue;const el=document.getElementById(id+'-value');if(el)el.textContent=s[k]+'%';}
}
        const defaultSettings = {
            primaryColor: '#4f46e5',
            secondaryColor: '#a78bfa',
            bgColor: '#1f2937', // gray-800
            bgOpacity: 0.9,
            manualLayout: false,
            hideBorders: false,
            hideButtonBackgrounds: false,
            hideQuickDialBackgrounds: false,
            hideAddDialButton: false, 
            saveSearchEngineId: true, 
            weatherLocationVisible: true,
            weatherModuleWidth: 'w-56',
            profileModuleSize: 'w-20 h-20',
            quickDialImageSize: 'w-10 h-10',
            searchFollowTheme: true,
            searchColorA: '#25dfff', searchColorB: '#b44bff',
            searchEffect: 'aurora', searchGlow: 75, searchSpeed: 100,
            searchOpacity: 85, searchMenuOpacity: 95, searchBorderOpacity: 65
        };
        let currentSettings = {...defaultSettings};

        function applySettings(settings) {
            document.body.classList.toggle('ivy-hide-weather-location', settings.weatherLocationVisible === false);
            const root = document.documentElement;
            root.style.setProperty('--primary-color', settings.primaryColor);
            root.style.setProperty('--secondary-color', settings.secondaryColor);
            root.style.setProperty('--bg-color-hex', settings.bgColor);
            root.style.setProperty('--bg-color-rgb', hexToRgb(settings.bgColor));
            root.style.setProperty('--bg-opacity', settings.bgOpacity);
            root.classList.toggle('ivy-no-dynamic-borders', !!settings.hideBorders);
            root.style.setProperty('--border-width', settings.hideBorders ? '0px' : '1px');
            root.style.setProperty('--compensation-padding', settings.hideBorders ? '1px' : '0px');
            const primaryColor = settings.primaryColor; 

            // 1. Module (Weather/Profile/Buttons) Styling
            const fixedContainers = [ 
                document.getElementById('weather-card'),
                document.querySelector('#profile-fixed-container > div'),
                document.querySelector('#settings-fixed-container > div'),
                document.querySelector('#import-fixed-container > div'),
                document.querySelector('#export-fixed-container > div'),
		document.querySelector('#light-mode-fixed-container > div'),

            ].filter(el => el);
            fixedContainers.forEach(container => {
                if (settings.hideButtonBackgrounds) {
                    container.classList.remove('dynamic-bg', 'shadow-2xl');
                    container.classList.add('bg-transparent');
                } else {
                    container.classList.add('dynamic-bg', 'shadow-2xl');
                    container.classList.remove('bg-transparent');
                }
                if (container.classList.contains('compensated-p2')) {
                    container.style.borderColor = settings.secondaryColor;
                }
            });


const accentIcons = [
                // Alle Buttons in den festen Containern
                ...document.querySelectorAll('#settings-fixed-container svg, #import-fixed-container svg, #export-fixed-container svg'),
		document.querySelector('#light-mode-close-btn svg'),
                document.querySelector('#light-mode-fixed-container svg'),
                //document.querySelector('#light-mode-overlay svg'),
                // Das 'Link hinzufügen' Icon
               // document.querySelector('#add-dial-container svg')
            ].filter(el => el); // Filtert null-Werte heraus

            accentIcons.forEach(icon => {
                // Stellt sicher, dass alle Icons, die text-indigo-400 verwenden,
                // jetzt die dynamische primaryColor erhalten.
                icon.style.color = primaryColor;
            });

       

        // =================================================================
        // Quick Dials Styling
        // =================================================================

            // 2. Quick Dials Styling
            const allDialContainers = document.querySelectorAll('#quick-dials-grid > div');
            allDialContainers.forEach((el) => {
                // Steuere den "Link hinzufügen"-Button separat
                if (el.id === 'add-dial-container') {
                     if (settings.hideAddDialButton && !window.matchMedia('(max-width:900px)').matches) {
                         el.classList.add('hidden');
                     } else {
                         el.classList.remove('hidden');
                     }
                     return;
                }
                // Reguläre Dials
                if (settings.hideQuickDialBackgrounds) {
                    el.classList.remove('dynamic-bg', 'shadow-xl');
                    el.classList.add('bg-transparent');
                } else {
                    el.classList.add('dynamic-bg', 'shadow-xl');
                    el.classList.remove('bg-transparent');
                }
            });

            // 3. Modul-/Kachelgrößen
            const weatherCard = document.getElementById('weather-card');
            if (weatherCard) {
                weatherCard.classList.remove('w-56', 'w-64', 'w-72', 'w-80', 'w-96');
                const weatherWidths = {'w-56':224,'w-64':256,'w-72':288,'w-80':320,'w-96':384};
                const weatherWidth = weatherWidths[settings.weatherModuleWidth] || 224;
                weatherCard.style.width = `min(${weatherWidth}px, calc(100vw - 24px))`;
            }
            const profileImage = document.getElementById('profile-image');
            if (profileImage) {
                const [profileW, profileH] = settings.profileModuleSize.split(' ');
                profileImage.className = profileImage.className.replace(/\b(w-\w+)\b/g, '').trim();
                profileImage.className = profileImage.className.replace(/\b(h-\w+)\b/g, '').trim();
                profileImage.classList.add(profileW, profileH);
            }
            const quickDialIcons = document.querySelectorAll('.quick-dial-icon');
            if (quickDialIcons) {
                const [qdW, qdH] = settings.quickDialImageSize.split(' ');
                quickDialIcons.forEach(img => {
                    img.className = img.className.replace(/\b(w-\w+)\b/g, '').trim();
                    img.className = img.className.replace(/\b(h-\w+)\b/g, '').trim();
                    img.classList.add(qdW, qdH);
                });
            }

            // 4. Akzentfarben (unabhängig)
            document.getElementById('profile-image').style.borderColor = primaryColor;
            document.getElementById('settings-button').querySelector('svg').style.color = primaryColor;
            const importSvg = document.getElementById('import-button') ? document.getElementById('import-button').querySelector('svg') : null;
            if (importSvg) importSvg.style.color = primaryColor;
            const exportSvg = document.getElementById('export-button') ? document.getElementById('export-button').querySelector('svg') : null;
            if (exportSvg) exportSvg.style.color = primaryColor;
            
            // 5. Layout-Modus
            toggleManualLayout(settings.manualLayout, false); // Stellt den Modus ein, speichert aber nicht erneut
            applyIvySearchStyle(settings);

            // 6. Search Engine State (muss manuell synchronisiert werden, da es eine separate Einstellung hat)
            if (!settings.saveSearchEngineId) {
                localStorage.removeItem(SEARCH_ENGINE_KEY);
                updateSearchEngine(ivySearchSelectedId || 'google', false);
            } else {
                updateSearchEngine(localStorage.getItem(SEARCH_ENGINE_KEY) || 'google', false);
            }
        }

        function loadSettings() {
            try {
                const storedSettings = JSON.parse(localStorage.getItem('dashboardSettings'));
                if (storedSettings) {
                    // Merge stored settings with defaults to ensure new settings are always present
                    currentSettings = { ...defaultSettings, ...storedSettings };
                }
            } catch (e) {
                console.error("Fehler beim Laden der Einstellungen aus LocalStorage. Verwende Standardeinstellungen.", e);
                // Bei Fehler werden Standardeinstellungen verwendet und fehlerhafte Daten gelöscht
                currentSettings = {...defaultSettings};
                localStorage.removeItem('dashboardSettings'); 
            }

            // Apply the loaded (or default) settings
            applySettings(currentSettings);
        }

        // ** KORRIGIERTE UND ROBUSTE FUNKTION FÜR DAS ÖFFNEN DES POPUPS **
        window.showSettingsModal = () => {
            const settingsModal = document.getElementById('settings-modal');
            if (!settingsModal) return; 

            // 1. Snapshot erstellen (für Abbrechen-Funktion)
            settingsSnapshot = { ...currentSettings };

            // 2. MODAL ÖFFNEN: Dies muss zuerst und fehlerfrei geschehen.
            settingsModal.classList.remove('hidden');

            // 3. DATEN LADEN: Die fehleranfällige Logik in einen try...catch-Block einschließen.
            try {
                // --- Farben & Transparenz ---
                document.getElementById('setting-primary-color').value = currentSettings.primaryColor;
                document.getElementById('setting-secondary-color').value = currentSettings.secondaryColor;
                document.getElementById('setting-bg-color').value = currentSettings.bgColor;
                
                document.getElementById('setting-bg-opacity').value = currentSettings.bgOpacity;
                document.getElementById('opacity-value-display').textContent = (currentSettings.bgOpacity * 100).toFixed(0) + '%';
                
                // --- Checkboxen ---
                document.getElementById('setting-hide-button-bg').checked = currentSettings.hideButtonBackgrounds;
                document.getElementById('setting-hide-quickdial-bg').checked = currentSettings.hideQuickDialBackgrounds;
                document.getElementById('setting-hide-borders').checked = currentSettings.hideBorders;
                document.getElementById('setting-hide-add-dial').checked = currentSettings.hideAddDialButton;
                document.getElementById('setting-save-search-engine-id').checked = currentSettings.saveSearchEngineId; 
                document.getElementById('setting-manual-layout').checked = currentSettings.manualLayout; 

                // --- Größen & Layout ---
                document.getElementById('setting-weather-location-visible').checked = currentSettings.weatherLocationVisible !== false;
                document.getElementById('setting-weather-width').value = currentSettings.weatherModuleWidth;
                document.getElementById('setting-profile-size').value = currentSettings.profileModuleSize;
                document.getElementById('setting-quickdial-size').value = currentSettings.quickDialImageSize;
                hydrateIvySearchControls(currentSettings); 
                
                // --- Autofill (separate Logik) ---
                if (typeof initAutofillSetting === 'function') {
                     initAutofillSetting();
                }

            } catch (error) {
                // Der Fehler wird nur protokolliert, das Modal ist aber sichtbar
                console.error("Fehler beim Laden der Einstellungsdaten in das Modal:", error);
            }
        };

        window.liveUpdateSettings = () => {
            // Hole alle Werte aus den Input-Feldern, ohne zu speichern
            currentSettings.primaryColor = document.getElementById('setting-primary-color').value;
            currentSettings.secondaryColor = document.getElementById('setting-secondary-color').value;
            currentSettings.bgColor = document.getElementById('setting-bg-color').value;
            
            currentSettings.bgOpacity = parseFloat(document.getElementById('setting-bg-opacity').value);
            readIvySearchControls(currentSettings);
            document.getElementById('opacity-value-display').textContent = (currentSettings.bgOpacity * 100).toFixed(0) + '%';

            currentSettings.hideButtonBackgrounds = document.getElementById('setting-hide-button-bg').checked;
            currentSettings.hideQuickDialBackgrounds = document.getElementById('setting-hide-quickdial-bg').checked;
            currentSettings.hideBorders = document.getElementById('setting-hide-borders').checked;
            currentSettings.hideAddDialButton = document.getElementById('setting-hide-add-dial').checked;
            currentSettings.saveSearchEngineId = document.getElementById('setting-save-search-engine-id').checked; 
            currentSettings.manualLayout = document.getElementById('setting-manual-layout').checked; 
            
            currentSettings.weatherLocationVisible = document.getElementById('setting-weather-location-visible').checked;
            currentSettings.weatherModuleWidth = document.getElementById('setting-weather-width').value;
            currentSettings.profileModuleSize = document.getElementById('setting-profile-size').value;
            currentSettings.quickDialImageSize = document.getElementById('setting-quickdial-size').value;
            
            // Wende die Änderungen sofort an (ohne Speichern)
            applySettings(currentSettings);
        };

        window.hideSettingsModal = () => {
            document.getElementById('settings-modal').classList.add('hidden');
        };

        window.saveSettings = () => {
            currentSettings.primaryColor = document.getElementById('setting-primary-color').value;
            currentSettings.secondaryColor = document.getElementById('setting-secondary-color').value;
            currentSettings.bgColor = document.getElementById('setting-bg-color').value;
            currentSettings.bgOpacity = parseFloat(document.getElementById('setting-bg-opacity').value);
            readIvySearchControls(currentSettings);

            currentSettings.hideButtonBackgrounds = document.getElementById('setting-hide-button-bg').checked;
            currentSettings.hideQuickDialBackgrounds = document.getElementById('setting-hide-quickdial-bg').checked;
            currentSettings.hideBorders = document.getElementById('setting-hide-borders').checked;
            currentSettings.hideAddDialButton = document.getElementById('setting-hide-add-dial').checked;
            currentSettings.saveSearchEngineId = document.getElementById('setting-save-search-engine-id').checked; 
            
            currentSettings.weatherLocationVisible = document.getElementById('setting-weather-location-visible').checked;
            currentSettings.weatherModuleWidth = document.getElementById('setting-weather-width').value;
            currentSettings.profileModuleSize = document.getElementById('setting-profile-size').value;
            currentSettings.quickDialImageSize = document.getElementById('setting-quickdial-size').value;
            
            const newManualLayout = document.getElementById('setting-manual-layout').checked;
            if (newManualLayout !== currentSettings.manualLayout) {
                toggleManualLayout(newManualLayout, true);
            } else {
                currentSettings.manualLayout = newManualLayout; 
            }
            
            applySettings(currentSettings); 
            localStorage.setItem('dashboardSettings', JSON.stringify(currentSettings));
            document.getElementById('settings-modal').classList.add('hidden');
            settingsSnapshot = null;
            // Save without restarting background animation or resetting the whole page.
        };

        window.cancelSettings = () => {
            if (settingsSnapshot) {
                currentSettings = { ...settingsSnapshot };
                applySettings(currentSettings);
                toggleManualLayout(currentSettings.manualLayout, false);
            }
            document.getElementById('settings-modal').classList.add('hidden');
            settingsSnapshot = null;
        }

        // NEU: Funktion zum Löschen des gesamten Local Storage (für Korrupte Daten)
        window.clearCacheAndReload = () => {
            if (!confirm('IVY-Daten zurücksetzen? Vorher wird automatisch eine Backup-JSON heruntergeladen. Danach werden Links, Profilbild/GIF, Wetter-Ort, Positionen, Effekte und Einstellungen gelöscht.')) return;
            try {ivyDownloadBackup('IVY_Vor_Cache_Reset.json')}catch(err){alert('Backup fehlgeschlagen – Reset abgebrochen: '+err.message);return}
            for (const key of [...LOCAL_STORAGE_KEYS, ...Object.keys(localStorage).filter(k => IVY_POSITION_KEY.test(k))]) {
                localStorage.removeItem(key);
            }
            location.reload();
        };


// =================================================================
// SUCHFUNKTION & SUCHMASCHINEN-AUSWAHL 
// =================================================================
function buildSearchUrl(engineId, query) {
    const q = encodeURIComponent(query);
    switch (engineId) {
        case 'google': return `https://www.google.com/search?q=${q}`;
        case 'duckduckgo': return `https://duckduckgo.com/?q=${q}`;
        case 'youtube': return `https://www.youtube.com/results?search_query=${q}`;
        case 'bing': return `https://www.bing.com/search?q=${q}`;
        case 'wikipedia': return `https://de.wikipedia.org/w/index.php?search=${q}`;
        case 'startpage': return `https://www.startpage.com/sp/search?query=${q}`;
        case 'ecosia': return `https://www.ecosia.org/search?q=${q}`;
        case 'perplexity': return `https://www.perplexity.ai/search?q=${q}`;
        case 'chatgpt': return `https://chatgpt.com/?q=${q}`;
        case 'deepl': return `https://www.deepl.com/translator#de/en/${q}`;
        default: return `https://www.google.com/search?q=${q}`;
    }
}

function getSelectedSearchEngineId() {
    const stored = localStorage.getItem(SEARCH_ENGINE_KEY) || 'google';
    const id = ivySearchSelectedId || stored;
    return SEARCH_ENGINES.some(e => e.id === id) ? id : 'google';
}

function handleSearch(event) {
    event.preventDefault();
    const input = document.getElementById('search-input');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;
    const engineId = ivySearchSelectedId || getSelectedSearchEngineId();
    const searchUrl = buildSearchUrl(engineId, query);
    window.location.href = searchUrl;
}

function initSearch() {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    if (!form || !input) return;
    form.addEventListener('submit', handleSearch);
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    renderSearchEngineMenu();
    ivyInitSearchGrayMode();
    updateSearchEngine(getSelectedSearchEngineId(), false); 
}

let ivySearchSelectedId = null;
function placeIvySearchMenu() {
    const menu=document.getElementById('search-engine-menu');
    const trigger=document.getElementById('search-engine-button');
    if (!menu || !trigger || menu.classList.contains('hidden')) return;
    const r=trigger.getBoundingClientRect();
    const width=Math.min(270,Math.max(210,innerWidth-24));
    const below=innerHeight-r.bottom-12;
    const above=r.top-12;
    const opensUp=below<Math.min(300,above) && above>below;
    menu.style.width=width+'px';
    menu.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';
    menu.style.top=opensUp?'auto':Math.max(8,r.bottom+10)+'px';
    menu.style.bottom=opensUp?(innerHeight-r.top+10)+'px':'auto';
    menu.style.maxHeight=Math.max(110,Math.min(340,opensUp?above-18:below-18))+'px';
}
function closeIvySearchMenu() {
    document.getElementById('search-engine-menu')?.classList.add('hidden');
}
function toggleSearchEngineMenu(e) {
    if (e) {e.preventDefault();e.stopPropagation();}
    const menu=document.getElementById('search-engine-menu');
    if(!menu)return;
    const closed=menu.classList.toggle('hidden');
    if(!closed)placeIvySearchMenu();
}
window.updateSearchEngine=(engineId,shouldCloseMenu=true)=>{
    const engine=SEARCH_ENGINES.find(e=>e.id===engineId)||SEARCH_ENGINES[0];
    ivySearchSelectedId=engine.id;
    if (currentSettings.saveSearchEngineId) localStorage.setItem(SEARCH_ENGINE_KEY,engine.id);
    else localStorage.removeItem(SEARCH_ENGINE_KEY);
    const icon=document.getElementById('current-search-icon');
    const button=document.getElementById('search-engine-button');
    if(icon){ivyLoadEngineIcon(icon,engine);document.getElementById('ivy-selected-fallback').textContent=ivyFallbackLetter(engine);}
    if(button)button.title='Suchmaschine: '+engine.name;
    document.querySelectorAll('#search-engine-menu button[data-engine]').forEach(b=>{
        const active=b.dataset.engine===engine.id;
        b.setAttribute('aria-selected',String(active));
        b.classList.toggle('ivy-search-active',active);
    });
    if(shouldCloseMenu)closeIvySearchMenu();
};
function ivyFaviconDomain(engine) {
    try {if(engine.id==='chatgpt')return 'chatgpt.com';return new URL(engine.url).hostname.replace(/^www\./,'')} catch(e){return 'google.com'}
}
function ivyFallbackLetter(engine){
    return ({google:'G',duckduckgo:'D',youtube:'▶',bing:'B',wikipedia:'W',startpage:'S',ecosia:'E',perplexity:'P',chatgpt:'AI',deepl:'D'})[engine.id]||engine.name[0];
}
function ivyLoadEngineIcon(img,engine){
    const domain=ivyFaviconDomain(engine);
    const url='https://www.google.com/s2/favicons?sz=64&domain='+encodeURIComponent(domain);
    img.classList.remove('ivy-icon-missing');
    ivyIconQueue.attach(img,url,ivyFallbackLetter(engine));
}
// IVY V24 – persistent grayscale filter; original favicons and URLs stay untouched.
const IVY_SEARCH_GRAY_KEY = 'ivySearchGrayIcons';
function ivyApplySearchGrayMode(enabled) {
    document.body.classList.toggle('ivy-search-icons-gray', Boolean(enabled));
    const toggle = document.getElementById('ivy-search-gray-toggle');
    if (toggle) toggle.checked = Boolean(enabled);
    try { localStorage.setItem(IVY_SEARCH_GRAY_KEY, enabled ? '1' : '0'); } catch (_) {}
}
function ivyInitSearchGrayMode() {
    const toggle = document.getElementById('ivy-search-gray-toggle');
    if (!toggle) return;
    let enabled = false;
    try { enabled = localStorage.getItem(IVY_SEARCH_GRAY_KEY) === '1'; } catch (_) {}
    ivyApplySearchGrayMode(enabled);
    if (!toggle.dataset.ivyGrayBound) {
        toggle.addEventListener('change', () => ivyApplySearchGrayMode(toggle.checked));
        toggle.dataset.ivyGrayBound = '1';
    }
}
function renderSearchEngineMenu() {
    const menu=document.getElementById('search-engine-menu');
    if(!menu)return;
    if(menu.parentElement!==document.body)document.body.appendChild(menu);
    menu.querySelectorAll('button[data-engine]').forEach(b=>b.remove());
    for(const engine of SEARCH_ENGINES){
        const b=document.createElement('button');
        b.type='button';b.dataset.engine=engine.id;
        b.className='ivy-engine-option flex items-center w-full px-3 py-2.5 text-sm text-white rounded-xl transition duration-150';
        const img=document.createElement('img');img.alt='';img.className='w-6 h-6 mr-3 rounded-full';ivyLoadEngineIcon(img,engine);
        const fallback=document.createElement('span');fallback.className='ivy-icon-fallback';fallback.textContent=ivyFallbackLetter(engine);
        const label=document.createElement('span');label.textContent=engine.name;
        b.append(img,fallback,label);b.addEventListener('click',()=>updateSearchEngine(engine.id));menu.appendChild(b);
    }
    if (!document.__ivySearchMenuBound) {
        document.addEventListener('pointerdown',e=>{
            const menu=document.getElementById('search-engine-menu');
            const button=document.getElementById('search-engine-button');
            if(menu&&!menu.contains(e.target)&&button&&!button.contains(e.target))closeIvySearchMenu();
        });
        document.addEventListener('keydown',e=>{if(e.key==='Escape')closeIvySearchMenu();});
        window.addEventListener('resize',placeIvySearchMenu,{passive:true});
        document.addEventListener('scroll',placeIvySearchMenu,{passive:true,capture:true});
        document.__ivySearchMenuBound=true;
    }
}
        // =================================================================
        // AUTOFILL EINSTELLUNG
        // =================================================================
        function initAutofillSetting() {
            const autofillToggle = document.getElementById('setting-autofill-disable');
            const searchInput = document.getElementById('search-input');
            if (!autofillToggle || !searchInput) return;

            const isAutofillDisabled = localStorage.getItem('autofillDisabled') === 'true';
            autofillToggle.checked = isAutofillDisabled;
            searchInput.setAttribute('autocomplete', isAutofillDisabled ? 'off' : 'on');

            // Stelle sicher, dass der Event-Listener nur einmal hinzugefügt wird
            if (!autofillToggle.hasAttribute('data-listener-added')) {
                 autofillToggle.setAttribute('data-listener-added', 'true');
                 autofillToggle.addEventListener('change', () => {
                     const disable = autofillToggle.checked;
                     searchInput.setAttribute('autocomplete', disable ? 'off' : 'on');
                     localStorage.setItem('autofillDisabled', disable);
                     if (document.activeElement === searchInput && !disable) {
                         searchInput.blur();
                         searchInput.focus();
                     }
                 });
            }
        }

        // =================================================================
        // RESTLICHE FUNKTIONEN (Quick Dial, Wetter, etc.)
        // =================================================================
        window.showAddModal = () => {
            if (isDragging) return;
            document.getElementById('add-modal').classList.remove('hidden');
            document.getElementById('modal-title').value = '';
            document.getElementById('modal-url').value = 'https://';
        };

        window.hideAddModal = () => {
            document.getElementById('add-modal').classList.add('hidden');
        };

        function getDialsFromLocalStorage() {
            try {
                const dials = JSON.parse(localStorage.getItem('quickDials')) || [];
                return Array.isArray(dials) ? dials : [];
            } catch (e) {
                return [];
            }
        }

        function saveDialsToLocalStorage(dials) {
            localStorage.setItem('quickDials', JSON.stringify(dials));
            renderQuickDials(dials);
        }

        window.saveQuickDial = () => {
            const title = document.getElementById('modal-title').value.trim();
            let url = document.getElementById('modal-url').value.trim();
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { if (url && !['http:', 'https:'].includes(new URL(url).protocol)) throw new Error('Invalid protocol'); } catch(e) { alert('Bitte eine gültige HTTP- oder HTTPS-Adresse eingeben.'); return; }
            if (title && url) {
                const dials = getDialsFromLocalStorage();
                dials.push({ id: crypto.randomUUID(), title: title, url: url, createdAt: Date.now() });
                saveDialsToLocalStorage(dials);
                hideAddModal();
            }
        };

        window.deleteQuickDial = (dialId) => {
            const dials = getDialsFromLocalStorage();
            const updatedDials = dials.filter(dial => dial.id !== dialId);
            saveDialsToLocalStorage(updatedDials);
        };


	// =================================================================
	// QUICK DIALS RENDERING 
	// =================================================================

function renderQuickDials(dials) {
    const grid = document.getElementById('quick-dials-grid');
    if (!grid) return;
    
    // Entferne alle aktuellen Dials (außer dem "Link hinzufügen" Button)
    const existingDials = grid.querySelectorAll(':scope > div:not(#add-dial-container)');
    existingDials.forEach(el => el.remove());

    const addButton = document.getElementById('add-dial-container');
    if (!addButton) return;

    dials.forEach(dial => {
        if (!/^https?:\/\//i.test(String(dial.url))) return;
        const safe = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const dialDiv = document.createElement('div');
        
        // WICHTIG: Stellt sicher, dass die Klasse 'group' vorhanden ist
        dialDiv.className = 'flex flex-col items-center justify-center rounded-xl shadow-xl transition duration-300 dynamic-bg compensated-p4 hover:scale-105 group relative';
        dialDiv.setAttribute('data-id', dial.id);
        
        dialDiv.innerHTML = `
            <a href="${safe(dial.url)}" target="_self" class="w-full h-full flex flex-col items-center justify-center p-4">
                <img data-ivy-placeholder="true" alt="${safe(dial.title)}" class="quick-dial-icon rounded-full mb-2 ${currentSettings.quickDialImageSize} shadow-lg transition duration-300">
                <span class="text-white text-sm font-medium text-center w-full px-1">${safe(dial.title)}</span>
            </a>
            
            <button class="edit-button absolute top-1 right-12 opacity-0 group-hover:opacity-100 transition duration-300 p-1 rounded-full bg-gray-900/50 hover:bg-indigo-600/70 z-20" 
                    onclick="editLink(event, '${safe(dial.id)}')"
                    title="Eintrag bearbeiten">
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </button>

            <button class="delete-button absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition duration-300 p-1 rounded-full bg-gray-900/50 hover:bg-red-600/70 z-20" 
                    onclick="deleteLink(event, '${safe(dial.id)}')"
                    title="Eintrag löschen">
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;
        
        const handle = document.createElement('button');
        handle.type = 'button'; handle.className = 'ivy-dial-drag-handle';
        handle.title = 'Link verschieben'; handle.setAttribute('aria-label', `${dial.title} verschieben`);
        handle.textContent = '⠿';
        dialDiv.appendChild(handle);
        ivyBindDialDrag(dialDiv, handle);
        grid.insertBefore(dialDiv, addButton);
        ivyIconQueue.attach(dialDiv.querySelector('.quick-dial-icon'),dial.iconUrl || getFaviconUrl(dial.url),dial.title);
    });

    applySettings(currentSettings);
}

	// =================================================================
        // EDIT/REMOVE DIALS & MODAL-LOGIK (Ersetzt die alte Logik)
        // =================================================================

let isEditingId = null; // Speichert die ID des Links, der gerade bearbeitet wird

// --- FUNKTION ZUM ÖFFNEN DES MODALS (HINZUFÜGEN) ---
window.showAddModal = () => {
    // 1. WICHTIG: Setzt den Bearbeitungsmodus zurück, um "Hinzufügen" zu ermöglichen
    isEditingId = null; 
    
    // 2. Leert die Felder
    document.getElementById('modal-title').value = ''; 
    document.getElementById('modal-url').value = '';
    document.getElementById('modal-icon-url').value = '';
    ivyUpdateIconPreview();
    
    // 3. Setzt den Modal-Titel und Button-Text für den Hinzufügen-Modus
    document.querySelector('#add-modal h3').textContent = 'Schnellwahleintrag hinzufügen';
    document.querySelector('#add-modal button[onclick="saveQuickDial()"]').textContent = 'Speichern';
    
    // 4. Zeigt das Modal an
    document.getElementById('add-modal').classList.remove('hidden');
};

        // =================================================================
	// --- FUNKTION ZUM LÖSCHEN EINES LINKS ---
        // =================================================================
window.deleteLink = (event, id) => {
    event.stopPropagation();
    if (confirm("Soll dieser Schnellwahleintrag wirklich gelöscht werden?")) {
        let dials = getDialsFromLocalStorage();
        dials = dials.filter(dial => dial.id !== id);
        saveDialsToLocalStorage(dials); 
    }
};

        // =================================================================
	// --- FUNKTION ZUM BEARBEITEN EINES LINKS ---
        // =================================================================
window.editLink = (event, id) => {
    event.stopPropagation();
    isEditingId = id;
    
    const dials = getDialsFromLocalStorage();
    const dialToEdit = dials.find(dial => dial.id === id);
    
    if (dialToEdit) {
        document.getElementById('modal-title').value = dialToEdit.title;
        document.getElementById('modal-url').value = dialToEdit.url;
        document.getElementById('modal-icon-url').value = dialToEdit.iconUrl || '';
        ivyUpdateIconPreview();
        
        // UI auf Bearbeiten-Modus setzen
        document.querySelector('#add-modal h3').textContent = 'Schnellwahleintrag bearbeiten';
        document.querySelector('#add-modal button[onclick="saveQuickDial()"]').textContent = 'Speichern';
        
        document.getElementById('add-modal').classList.remove('hidden');
    }
};

        // =================================================================
	// --- SPEICHERFUNKTION ---
        // =================================================================
window.saveQuickDial = () => {
    const title = document.getElementById('modal-title').value.trim();
    let url = document.getElementById('modal-url').value.trim();
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { if (url && !['http:', 'https:'].includes(new URL(url).protocol)) throw new Error('Invalid protocol'); } catch(e) { alert('Bitte eine gültige HTTP- oder HTTPS-Adresse eingeben.'); return; }

    const iconRaw = document.getElementById('modal-icon-url')?.value.trim() || '';
    let iconUrl = '';
    if (iconRaw) {
        try { iconUrl = new URL(/^https?:\/\//i.test(iconRaw) ? iconRaw : 'https://' + iconRaw).href;
          if (!/^https?:$/i.test(new URL(iconUrl).protocol)) throw new Error('Invalid icon protocol');
        } catch { alert('Icon-URL muss eine gültige HTTP-/HTTPS-Adresse sein.'); return; }
    }
    if (title && url) {
        let dials = getDialsFromLocalStorage();

        if (isEditingId) {
            // BEARBEITEN-MODUS
            dials = dials.map(dial => {
                if (dial.id === isEditingId) {
                    return { ...dial, title: title, url: url, iconUrl };
                }
                return dial;
            });
        } else {
            // HINZUFÜGEN-MODUS (isEditingId ist null)
            dials.push({ 
                id: crypto.randomUUID(), 
                title: title, 
                url: url,
                iconUrl,
                createdAt: Date.now() 
            });
        }
        
        // Speichert die Dials und rendert neu
        saveDialsToLocalStorage(dials); 
        hideAddModal(); // Schließt das Modal und setzt den Status zurück

    } else {
        alert("Bitte geben Sie einen Titel und eine URL ein.");
    }
};

        // =================================================================
	// --- FUNKTION ZUM SCHLIESSEN DES MODALS ---
        // =================================================================
window.hideAddModal = () => {
    document.getElementById('add-modal').classList.add('hidden');
    
    // Setzt den Bearbeitungsstatus zurück
    isEditingId = null; 
    
    // Setzt Eingabefelder und UI auf den Hinzufügen-Modus zurück
    document.getElementById('modal-title').value = ''; 
    document.getElementById('modal-url').value = '';
    document.querySelector('#add-modal h3').textContent = 'Schnellwahleintrag hinzufügen';
    document.querySelector('#add-modal button[onclick="saveQuickDial()"]').textContent = 'Speichern'; 
};
        // =================================================================
        // PROFILBILD & WETTER
        // =================================================================
        function handleProfileImageUpload(event) {
            const file=event.target.files?.[0];
            if(!file)return;
            if(!file.type.startsWith('image/')){alert('Bitte ein Bild oder GIF auswählen.');return;}
            const reader=new FileReader();
            reader.onload=()=>{
                try {
                    localStorage.setItem('profileGifBase64',reader.result);
                    const img=document.getElementById('profile-image');
                    if(img)img.src=reader.result;
                } catch(err) {
                    alert('Bild zu groß für den Browserspeicher. Bitte eine kleinere Datei verwenden (z. B. unter 2 MB).');
                    console.error(err);
                }
            };
            reader.readAsDataURL(file);
            event.target.value='';
        }

        const weatherCityInput = document.getElementById('weather-city-input');
        let weatherTimeout;
        let ivyWeatherRequest = 0;
        const weatherTexts = {
            clear: 'Klarer Himmel', partly: 'Leicht bewölkt', cloudy: 'Bewölkt', fog: 'Nebel',
            rain: 'Regen', snow: 'Schneefall', storm: 'Gewitter'
        };
        function ivyWeatherMode(code, isDay) {
            if ([95,96,99].includes(code)) return 'storm';
            if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return 'rain';
            if ([71,73,75,77,85,86].includes(code)) return 'snow';
            if ([45,48].includes(code)) return 'fog';
            if ([2,3].includes(code)) return 'cloudy';
            if (code===1) return 'partly';
            return isDay ? 'clear' : 'night';
        }
        function showIvyWeather(snapshot, cached=false) {
            if (!snapshot) return;
            if (window.ivyV27Weather?.renderSnapshot){window.ivyV27Weather.renderSnapshot(snapshot,!cached);return;}
            const scene=document.getElementById('ivy-weather-scene');
            if (!scene) return;
            const c=snapshot.current||{};
            const mode=ivyWeatherMode(Number(c.weather_code),Number(c.is_day)===1);
            const desc=mode==='night'?'Klare Nacht':weatherTexts[mode]||'Wetter';
            scene.dataset.mode=mode;
            document.getElementById('ivy-weather-city').textContent=snapshot.city||'Wetter';
            document.getElementById('ivy-weather-temp').textContent=Number.isFinite(c.temperature_2m)?Math.round(c.temperature_2m)+'°':'--°';
            document.getElementById('ivy-weather-condition').textContent=desc;
            const humidity=Number.isFinite(c.relative_humidity_2m)?Math.round(c.relative_humidity_2m)+'%':'--';
            const wind=Number.isFinite(c.wind_speed_10m)?Math.round(c.wind_speed_10m)+' km/h':'--';
            document.getElementById('ivy-weather-stats').textContent='Feuchte '+humidity+'  ·  Wind '+wind;
            document.getElementById('ivy-weather-status').textContent='';
        }
        async function updateWeatherIframe(city) {
            city=String(city||'').trim();
            if (!city) return;
            localStorage.setItem('weatherCity',city);
            const request=++ivyWeatherRequest;
            const status=document.getElementById('ivy-weather-status');
            if (status) status.textContent='Wird geladen…';
            try {
                const controller=new AbortController();
                const t=setTimeout(()=>controller.abort(),10000);
                let geo;
                try {
                    // A saved coordinate avoids repeating the geocoder on every refresh.
                    let previous=null;
                    try{previous=JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){}
                    if(previous?.searchQuery===city && Number.isFinite(+previous.latitude) && Number.isFinite(+previous.longitude))
                        geo={name:previous.city||city,country_code:'',latitude:+previous.latitude,longitude:+previous.longitude};
                    if(!geo){
                        const geoRes=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(city)+'&count=1&language=de&format=json',{signal:controller.signal,cache:'no-store'});
                        if(!geoRes.ok)throw new Error('Standortabfrage '+geoRes.status);
                        const geoData=await geoRes.json();
                        geo=geoData.results?.[0];
                        if(!geo)throw new Error('Ort nicht gefunden');
                    }
                    const url='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(geo.latitude)+'&longitude='+encodeURIComponent(geo.longitude)+'&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&daily=sunrise,sunset&forecast_days=1&timezone=auto';
                    const res=await fetch(url,{signal:controller.signal,cache:'no-store'});
                    if (!res.ok) throw new Error('Wetterabfrage '+res.status);
                    const data=await res.json();
                    if (!data.current) throw new Error('Keine Wetterdaten');
                    if (request!==ivyWeatherRequest) return;
                    const snapshot={searchQuery:city,city:geo.name+(geo.country_code?', '+geo.country_code:''),latitude:geo.latitude,longitude:geo.longitude,current:data.current,daily:data.daily,utc_offset_seconds:data.utc_offset_seconds,timezone:data.timezone,savedAt:Date.now()};
                    try{localStorage.setItem('ivyWeatherSnapshot',JSON.stringify(snapshot))}catch(_){}
                    showIvyWeather(snapshot,false);
                }finally{clearTimeout(t)}
            }catch(err){
                if(request!==ivyWeatherRequest)return;
                if(status)status.textContent='Verbindung prüfen';
                let cached=null;try{cached=JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){}
                if(cached){showIvyWeather(cached,true)}
                else document.getElementById('ivy-weather-condition').textContent=err.message||'Keine Wetterdaten';
            }
        }
        window.ivyRefreshWeather = updateWeatherIframe;
        if(weatherCityInput){
            weatherCityInput.addEventListener('input',e=>{
                clearTimeout(weatherTimeout);
                const city=e.target.value.trim();
                if(city.length>=2)weatherTimeout=setTimeout(()=>updateWeatherIframe(city),650);
            });
            weatherCityInput.addEventListener('keydown',e=>{
                if(e.key==='Enter'){e.preventDefault();clearTimeout(weatherTimeout);updateWeatherIframe(weatherCityInput.value)}
            });
        }

        // =================================================================
        // IMPORT / EXPORT FUNKTIONEN
        // =================================================================

        const IVY_POSITION_KEY=/(?:_(?:desktop|mobile))?_(?:top|left)_rel$|^ivyV14Workspace_(?:mobile|desktop)$|^ivyV15MobileWidgets$|^ivyV18MobileLayout$|^ivyV20DeviceSizes$|^ivyV20DisplayPrefs$/;
        function ivyBackupData(){
            const data={};
            const keys=[...new Set([...LOCAL_STORAGE_KEYS,...Object.keys(localStorage).filter(k=>IVY_POSITION_KEY.test(k))])];
            for(const key of keys){const v=localStorage.getItem(key);if(v!==null)data[key]=v}
            return data;
        }
        function ivyDownloadBackup(name='IVY_Dashboard_Backup.json'){
            const data={format:'ivy-dashboard-backup',version:20,createdAt:new Date().toISOString(),data:ivyBackupData()};
            const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
            setTimeout(()=>URL.revokeObjectURL(url),15000);
        }
        window.exportSettings=()=>ivyDownloadBackup();
        window.importSettings=event=>{
            const file=event.target.files?.[0];if(!file)return;
            const reader=new FileReader();
            reader.onload=()=>{
                try{
                    const parsed=JSON.parse(reader.result);
                    const data=parsed?.format==='ivy-dashboard-backup'?parsed.data:parsed;
                    if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Ungültiges Datenformat');
                    const entries=Object.entries(data).filter(([key,value])=>
                        (LOCAL_STORAGE_KEYS.includes(key)||IVY_POSITION_KEY.test(key))&&typeof value==='string');
                    if(!entries.length)throw Error('Keine IVY-Einstellungen im Backup');
                    if(!confirm('IVY-Backup importieren? Deine aktuellen Links, Positionen und Einstellungen werden durch die Werte in dieser Datei ersetzt.'))return;
                    for(const [key,value] of entries)localStorage.setItem(key,value);
                    location.reload();
                }catch(err){console.error(err);alert('Import fehlgeschlagen: '+err.message)}
                finally{event.target.value=''}
            };
            reader.readAsText(file);
        };

        // =================================================================
        // LIGHT MODE (TASCHENLAMPE) LOGIK
        // =================================================================
        
        // IVY V10: isolated fullscreen light overlay, independent of dashboard position/scroll.
        function toggleLightMode(force) {
            const overlay = document.getElementById('light-mode-overlay');
            if (!overlay) return;
            const active = !overlay.classList.contains('hidden');
            const open = typeof force === 'boolean' ? force : !active;
            overlay.classList.toggle('hidden', !open);
            overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
            document.body.classList.toggle('ivy-light-active', open);
            if (open) {
                updateLightSource();
                syncLightButtonPosition();
                // Make the exit button available to keyboard users as well.
                requestAnimationFrame(() => overlay.querySelector('#light-mode-close-btn button')?.focus({preventScroll:true}));
            } else {
                document.getElementById('light-mode-fixed-container')?.querySelector('button')?.focus({preventScroll:true});
            }
        }
        function updateLightSource() {
            const overlay = document.getElementById('light-mode-overlay');
            if (!overlay) return;
            const brightness = Math.max(0, Math.min(100, Number(document.getElementById('light-brightness')?.value ?? 100)));
            const warmth = Math.max(0, Math.min(100, Number(document.getElementById('light-warmth')?.value ?? 0))) / 100;
            const intensity = brightness / 100;
            // Endpoints: 0 black; 100 white (or warm white). Intermediates monotonic.
            const channels = [255, 255 - 95 * warmth, 255 - 195 * warmth];
            const rgb = channels.map(v => Math.round(v * intensity));
            overlay.style.setProperty('background', `rgb(${rgb.join(',')})`, 'important');
            overlay.style.setProperty('background-color', `rgb(${rgb.join(',')})`, 'important');
            overlay.dataset.brightness = String(brightness);
            const controls = overlay.querySelector('.ivy-light-controls');
            if (controls) controls.classList.toggle('ivy-light-dark', brightness < 38);
        }
        function syncLightButtonPosition() {
            // The close button is always fixed in the safe area on mobile and desktop.
            const close = document.getElementById('light-mode-close-btn');
            if (!close) return;
            close.style.left = 'auto'; close.style.bottom = 'auto';
            close.style.top = 'max(14px, env(safe-area-inset-top))';
            close.style.right = 'max(14px, env(safe-area-inset-right))';
        }

// =================================================================
// DRAG & DROP HELPER
// =================================================================

// IVY: robust pointer drag for mouse, touch and stylus
const DEFAULT_FIXED_POSITIONS = {
    'weather-fixed-container': { top: '2rem', left: '2rem', right: 'auto', bottom: 'auto' },
    'profile-fixed-container': { top: '2rem', right: '2rem', left: 'auto', bottom: 'auto' },
    'settings-fixed-container': { bottom: '2rem', right: '2rem', left: 'auto', top: 'auto' },
    'import-fixed-container': { bottom: '2rem', right: '6rem', left: 'auto', top: 'auto' },
    'light-mode-fixed-container': { bottom: '2rem', left: '2rem', right: 'auto', top: 'auto' }
};
function positionKey(id) { return id + (window.matchMedia('(max-width: 767px)').matches ? '_mobile' : '_desktop'); }
function removeDraggable(element) {
    if (element.__ivyDragCleanup) { element.__ivyDragCleanup(); element.__ivyDragCleanup = null; }
    element.onmousedown = null;
}
function applyDefaultItemPosition(element) {
    const pos = DEFAULT_FIXED_POSITIONS[element.id];
    if (!pos) return false;
    element.style.position = 'fixed';
    element.style.top = pos.top;
    element.style.left = pos.left;
    element.style.right = pos.right;
    element.style.bottom = pos.bottom;
    element.classList.remove('draggable-positioning');
    return true;
}
function loadItemPositionsForElement(element) {
    const key = positionKey(element.id);
    let x = localStorage.getItem(key + '_left_rel');
    let y = localStorage.getItem(key + '_top_rel');
    if (x === null && !key.endsWith('_mobile')) x = localStorage.getItem(element.id + '_left_rel');
    if (y === null && !key.endsWith('_mobile')) y = localStorage.getItem(element.id + '_top_rel');
    if (x === null || y === null) return applyDefaultItemPosition(element);
    const rx = parseFloat(x), ry = parseFloat(y);
    if (!Number.isFinite(rx) || !Number.isFinite(ry)) return applyDefaultItemPosition(element);
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    element.style.position = 'fixed';
    element.style.right = 'auto'; element.style.bottom = 'auto';
    element.style.left = Math.round(Math.max(0, Math.min(vw - element.offsetWidth, rx * vw))) + 'px';
    element.style.top = Math.round(Math.max(0, Math.min(vh - element.offsetHeight, ry * vh))) + 'px';
    element.classList.add('draggable-positioning');
    return true;
}
function saveItemPosition(id, top, left) {
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    const px = parseFloat(left), py = parseFloat(top);
    if (!Number.isFinite(px) || !Number.isFinite(py) || !vw || !vh) return;
    const k = positionKey(id);
    localStorage.setItem(k + '_left_rel', String(Math.max(0, Math.min(1, px/vw))));
    localStorage.setItem(k + '_top_rel', String(Math.max(0, Math.min(1, py/vh))));
}
function loadItemPositions() {
    if(window.innerWidth<=900) return;
    DRAGGABLE_ITEMS.forEach(id => {
        const el = document.getElementById(id);
        if (el) loadItemPositionsForElement(el);
    });
}
function stabilizeDashboardLayout() {
    loadItemPositions();
    requestAnimationFrame(() => loadItemPositions());
}
function toggleManualLayout(enable, shouldSave = true) {
    const body = document.getElementById('body-root');
    if (body) body.classList.toggle('manual-layout-mode', !!enable);
    DRAGGABLE_ITEMS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('draggable-container', !!enable);
        if (enable) { if (!el.querySelector(':scope > .ivy-drag-handle')) {const h=document.createElement('span'); h.className='ivy-drag-handle'; h.textContent='⠿'; h.title='Modul ziehen'; h.setAttribute('aria-label','Modul verschieben'); el.appendChild(h);} makeDraggable(el); } else { removeDraggable(el); el.querySelector(':scope > .ivy-drag-handle')?.remove(); el.classList.remove('is-dragging'); }
    });
    if (shouldSave) {
        currentSettings.manualLayout = !!enable;
        localStorage.setItem('dashboardSettings', JSON.stringify(currentSettings));
    }
    if (typeof updateResponsiveMode === 'function') updateResponsiveMode();
}
function makeDraggable(el) {
    removeDraggable(el);
    if(window.innerWidth<=900)return;
    let state = null;
    const excluded = 'input,button,select,textarea,iframe,a,label,[contenteditable="true"]';
    function down(e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (e.target.closest(excluded) && !e.target.closest('.ivy-drag-handle')) return;
        if (!currentSettings.manualLayout) return;
        if (!document.getElementById('light-mode-overlay')?.classList.contains('hidden')) return;
        const rect = el.getBoundingClientRect();
        el.style.position = 'fixed'; el.style.right = 'auto'; el.style.bottom = 'auto';
        el.style.top = rect.top + 'px'; el.style.left = rect.left + 'px';
        el.classList.add('draggable-positioning');
        state = { id:e.pointerId, x:e.clientX, y:e.clientY, left:rect.left, top:rect.top, moved:false };
        try { el.setPointerCapture(e.pointerId); } catch(_) {}
        el.classList.add('is-dragging'); window.isDragging = true;
        e.preventDefault();
    }
    function move(e) {
        if (!state || e.pointerId !== state.id) return;
        const dx=e.clientX-state.x, dy=e.clientY-state.y;
        if (Math.abs(dx)>3 || Math.abs(dy)>3) state.moved=true;
        if (!state.moved) return;
        const vw=document.documentElement.clientWidth || window.innerWidth, vh=window.innerHeight;
        el.style.left=Math.round(Math.max(0,Math.min(vw-el.offsetWidth,state.left+dx)))+'px';
        el.style.top=Math.round(Math.max(0,Math.min(vh-el.offsetHeight,state.top+dy)))+'px';
        e.preventDefault();
    }
    function up(e) {
        if (!state || e.pointerId !== state.id) return;
        if (state.moved) saveItemPosition(el.id,el.style.top,el.style.left);
        state=null; el.classList.remove('is-dragging'); window.isDragging=false;
        try { if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); } catch(_) {}
    }
    el.addEventListener('pointerdown',down);
    el.addEventListener('pointermove',move);
    el.addEventListener('pointerup',up);
    el.addEventListener('pointercancel',up);
    el.__ivyDragCleanup = () => {
        el.removeEventListener('pointerdown',down);
        el.removeEventListener('pointermove',move);
        el.removeEventListener('pointerup',up);
        el.removeEventListener('pointercancel',up);
        state=null;
    };
}

// Responsive detection based on viewport + touch capability, not user-agent strings.
function updateResponsiveMode() {
    const width = Math.round(window.visualViewport?.width || window.innerWidth);
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const compact = width <= 767;
    const tablet = !compact && coarse && width <= 1400;
    const body = document.body;
    body.classList.toggle('ivy-compact-device', compact);
    body.classList.toggle('ivy-tablet-device', tablet);
    body.classList.toggle('ivy-touch-device', coarse);
    body.classList.toggle('ivy-mobile-auto', (compact || tablet) && !currentSettings.manualLayout);
    body.classList.toggle('ivy-responsive-desktop', !(compact || tablet));
}
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.getElementById('light-mode-overlay')?.classList.contains('hidden')) {
        e.preventDefault(); toggleLightMode(false);
    }
});

// =================================================================

// IVY V11 – mobile responsive mode, toggle popovers, and persistent dial sorting
function ivyIsPhoneLayout(){return matchMedia('(max-width:767px)').matches;}
function ivySyncMobileCards(){
  if (!ivyIsPhoneLayout()) {
    ['weather','profile'].forEach(n=>{
      document.getElementById(n+'-fixed-container')?.classList.remove('ivy-card-open');
      document.getElementById('ivy-mobile-'+n)?.setAttribute('aria-expanded','false');
    });
  }
}
function ivyToggleMobileCard(name){ if(window.innerWidth<=900)return;
  for(const n of ['weather','profile']){
    const el=document.getElementById(n+'-fixed-container');
    const btn=document.getElementById('ivy-mobile-'+n);
    const on=(n===name)&&!el.classList.contains('ivy-card-open');
    el.classList.toggle('ivy-card-open',on);btn.setAttribute('aria-expanded',String(on));
  }
}
function ivyUpdateIconPreview(){
  const field=document.getElementById('modal-icon-url'), urlField=document.getElementById('modal-url');
  const img=document.getElementById('modal-icon-preview'),status=document.getElementById('modal-icon-status');
  if (!img || !field || !urlField)return;
  const custom=field.value.trim();
  let src='';try{src=custom ? new URL(/^https?:\/\//i.test(custom)?custom:'https://'+custom).href : getFaviconUrl(/^https?:\/\//i.test(urlField.value)?urlField.value:'https://'+urlField.value)}catch{}
  img.src=src||'';status.textContent=custom?'Eigenes Bild':'Website-Icon automatisch';
}
function ivyFallbackDialIcon(img){
  const fallback=img.dataset.autoIcon;
  if(fallback && img.src!==fallback && img.dataset.fallback!=='1'){
    img.dataset.fallback='1';img.src=fallback;return;
  }
  img.onerror=null;
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#232f55"/><path d="M14 33h36M32 14c-18 12-18 24 0 36M32 14c18 12 18 24 0 36M14 33c0-25 36-25 36 0s-36 25-36 0" fill="none" stroke="#8feaff" stroke-width="3"/></svg>');
}
let ivyDialSortActive=false;
function ivyBindDialDrag(card,handle){
  // V24: neither tapping nor beginning a scroll may reorder a tile.
  // A deliberate hold arms sorting. The dedicated grip supports vertical drag;
  // swiping the tile itself stays native scrolling on mobile.
  const HOLD_MS = 170, CARD_HOLD_MS = 220, SLOP_PX = 9;
  let drag=null, pressTimer=null, suppressUntil=0;
  card.style.webkitTouchCallout='none';
  const grid=()=>document.getElementById('quick-dials-grid');
  const cards=()=>[...(grid()?.querySelectorAll(':scope > [data-id]') || [])];
  function hitTarget(x,y){
    for(const el of cards()){
      if(el===card)continue;
      const r=el.getBoundingClientRect();
      if(x>=r.left-5&&x<=r.right+5&&y>=r.top-5&&y<=r.bottom+5)return el;
    }
    return null;
  }
  function clearTarget(){grid()?.querySelectorAll('.ivy-dial-target').forEach(el=>el.classList.remove('ivy-dial-target'));}
  function clearTimer(){if(pressTimer!==null){clearTimeout(pressTimer);pressTimer=null;}}
  function releaseCapture(d){
    if(!d)return;
    const el=d.fromHandle?handle:card;
    try{if(el.hasPointerCapture(d.id))el.releasePointerCapture(d.id);}catch(_){}
  }
  function activate(){
    if(!drag||drag.active)return;
    drag.active=true;
    card.classList.add('ivy-dial-moving');
    const el=drag.fromHandle?handle:card;
    try{el.setPointerCapture(drag.id);}catch(_){}
  }
  function down(e,fromHandle){
    if((e.button!==undefined&&e.button!==0)||drag||performance.now()<suppressUntil)return;
    if(!fromHandle&&e.target.closest?.('button,input,select,textarea'))return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,active:false,fromHandle,
          target:null,hasMoved:false,latestX:e.clientX,latestY:e.clientY};
    // Do not preventDefault() before the hold: taps and scrolling keep working.
    clearTimer();
    pressTimer=setTimeout(activate,fromHandle?HOLD_MS:CARD_HOLD_MS);
    // Attach window listeners only for this gesture (no leaks on dial re-render).
    window.addEventListener('pointerup',lostUp);
    window.addEventListener('pointercancel',lostCancel);
    if(fromHandle)e.stopPropagation();
  }
  function discard(){
    clearTimer();releaseCapture(drag);drag=null;
    window.removeEventListener('pointerup',lostUp);
    window.removeEventListener('pointercancel',lostCancel);
    clearTarget();card.classList.remove('ivy-dial-moving');
  }
  function move(e){
    if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    drag.latestX=e.clientX;drag.latestY=e.clientY;
    if(!drag.active){
      // Finger movement before 170/220 ms means scroll/gesture, never a sort.
      if(Math.hypot(dx,dy)>SLOP_PX)discard();
      return;
    }
    // On the normal tile (not its grip), downward/upward scroll wins.
    if(!drag.fromHandle&&!drag.hasMoved&&e.pointerType==='touch'&&
       Math.abs(dy)>SLOP_PX&&Math.abs(dy)>Math.abs(dx)*1.2){discard();return;}
    drag.hasMoved=drag.hasMoved||Math.hypot(dx,dy)>SLOP_PX;
    const destination=hitTarget(e.clientX,e.clientY);
    if(destination!==drag.target){
      clearTarget();drag.target=destination;
      destination?.classList.add('ivy-dial-target');
    }
    e.preventDefault();e.stopPropagation();
  }
  function up(e,cancel=false){
    if(!drag||e.pointerId!==drag.id)return;
    const d=drag;
    const destination=(!cancel&&d.active&&d.hasMoved)?(hitTarget(e.clientX,e.clientY)||d.target):null;
    discard();
    if(d.active){
      // Prevent opening the link after a deliberate long press or reorder.
      suppressUntil=performance.now()+650;
      if(destination&&destination!==card){
        const ordered=cards();
        const from=ordered.indexOf(card),to=ordered.indexOf(destination);
        if(from>=0&&to>=0){
          if(from<to)destination.after(card);else destination.before(card);
          ivyPersistDialOrder();
          window.ivyV23Links?.layout?.();
        }
      }
      if(e.cancelable)e.preventDefault();
      e.stopPropagation();
    }
  }
  handle.addEventListener('pointerdown',e=>down(e,true));
  card.addEventListener('pointerdown',e=>{
    if(e.target.closest?.('.ivy-dial-drag-handle'))return;
    down(e,false);
  });
  handle.addEventListener('pointermove',move);
  card.addEventListener('pointermove',move);
  handle.addEventListener('pointerup',e=>up(e));
  card.addEventListener('pointerup',e=>up(e));
  handle.addEventListener('pointercancel',e=>up(e,true));
  card.addEventListener('pointercancel',e=>up(e,true));
  function lostUp(e){up(e)}
  function lostCancel(e){up(e,true)}
  card.addEventListener('contextmenu',e=>{
    if(drag?.active||performance.now()<suppressUntil){e.preventDefault();e.stopPropagation();}
  });
  card.addEventListener('click',e=>{
    if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()});
}

function ivyPersistDialOrder(){
  const ids=[...document.querySelectorAll('#quick-dials-grid > [data-id]')].map(el=>el.dataset.id);
  const byId=new Map(getDialsFromLocalStorage().map(d=>[String(d.id),d]));
  const order=ids.map(id=>byId.get(id)).filter(Boolean);
  const remaining=[...byId.values()].filter(d=>!ids.includes(String(d.id)));
  localStorage.setItem('quickDials',JSON.stringify([...order,...remaining]));
}
function ivyInitV11(){
  document.getElementById('ivy-mobile-weather')?.addEventListener('click',()=>ivyToggleMobileCard('weather'));
  document.getElementById('ivy-mobile-profile')?.addEventListener('click',()=>ivyToggleMobileCard('profile'));
  document.getElementById('modal-icon-url')?.addEventListener('input',ivyUpdateIconPreview);
  document.getElementById('modal-url')?.addEventListener('input',ivyUpdateIconPreview);
  document.addEventListener('pointerdown',e=>{
    if(e.target.closest('#ivy-mobile-toolbar,#weather-fixed-container,#profile-fixed-container'))return;
    for(const name of ['weather','profile']){
      document.getElementById(name+'-fixed-container')?.classList.remove('ivy-card-open');
      document.getElementById('ivy-mobile-'+name)?.setAttribute('aria-expanded','false');
    }
  });
  matchMedia('(max-width:767px)').addEventListener('change',ivySyncMobileCards);
  ivySyncMobileCards();
}
document.addEventListener('DOMContentLoaded',ivyInitV11);

// INITIALISIERUNG - 
// =================================================================
window.addEventListener('orientationchange', () => setTimeout(() => { updateResponsiveMode(); stabilizeDashboardLayout(); }, 280));
document.addEventListener('DOMContentLoaded', async () => {
    const body = document.getElementById('body-root');
    // V39: instant offline shell and no eager WebGL compilation.

    loadSettings();
    updateResponsiveMode();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const currentWidth = window.innerWidth;
            if (Math.abs(currentWidth - (window.__ivyWidth || currentWidth)) > 8) {
                window.__ivyWidth = currentWidth;
            }
            updateResponsiveMode();
            stabilizeDashboardLayout();
        }, 150); 
    });

    renderQuickDials(getDialsFromLocalStorage());
    initSearch();
    initAutofillSetting();

    const profileImageInput = document.getElementById('profile-image-input');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageUpload);
        const base64Data = localStorage.getItem('profileGifBase64');
        if (base64Data) {
            document.getElementById('profile-image').src = base64Data;
        }
    }

    const storedCity = localStorage.getItem('weatherCity');
    if (storedCity) {
        weatherCityInput.value = storedCity;
        // Render the last observation immediately (works offline). Network weather
        // must never compete with the initial layout, scripts and first paint.
        try {
            const previous=JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null');
            if(previous)showIvyWeather(previous,true);
        } catch (_) {}
        const refreshAfterPaint=()=>setTimeout(()=>{
            if(navigator.onLine && weatherCityInput.value.trim()===storedCity)
                updateWeatherIframe(storedCity);
        },900);
        // Never wait for external favicons or the window load event to settle.
        // DOMContentLoaded means saved observations can be refreshed after paint.
        refreshAfterPaint();
        // Offline-first; independent of rendering. No network refresh storms.
        let weatherPollBusy=false, weatherLastPoll=0;
        const backgroundWeather=()=>{
          const city=weatherCityInput?.value?.trim();
          if(!city||!navigator.onLine||document.hidden||weatherPollBusy||Date.now()-weatherLastPoll<8*60*1000)return;
          weatherPollBusy=true;weatherLastPoll=Date.now();
          Promise.resolve(updateWeatherIframe(city)).finally(()=>weatherPollBusy=false);
        };
        setInterval(backgroundWeather,10*60*1000);
        window.addEventListener('online',()=>setTimeout(backgroundWeather,1500));
        document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(backgroundWeather,1200)});
    }

    // No startup opacity gate or two-frame artificial delay.
    stabilizeDashboardLayout();

    window.addEventListener('load', () => setTimeout(stabilizeDashboardLayout, 60), { once: true });
    setTimeout(stabilizeDashboardLayout, 320);

    requestAnimationFrame(() => {
        if (body) {
            body.classList.remove('ivy-booting');
            body.classList.add('ivy-ready');
        }
    });
});

;
/* from <script> */


/* IVY V13 layout, sizes, isolated light renderer */
(function(){
'use strict';
const sizeDefaults={tileSize:160,iconSize:44,buttonSize:44,profileSize:80,weatherSize:224,weatherHeight:284};
const defaultForDevice=mode=>({...sizeDefaults,weatherHeight:mode==='mobile'?178:284});
const byId=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||a));
const V20SIZEKEY='ivyV20DeviceSizes';
const currentDevice=()=>window.matchMedia('(max-width:900px)').matches?'mobile':'desktop';
const selectedDevice=()=>window.ivyV20SelectedMode||currentDevice();
function sizeRecord(mode){try{return JSON.parse(localStorage.getItem(V20SIZEKEY)||'{}')[mode]||{}}catch(e){return {}}}
function sizes(){return {...defaultForDevice(currentDevice()),...(window.currentSettings||{}),...sizeRecord(currentDevice())};}
function applySizes(){
  const s={...defaultForDevice(currentDevice()),...JSON.parse(localStorage.getItem('dashboardSettings')||'{}'),...sizeRecord(currentDevice())};
  const root=document.documentElement;
  root.style.setProperty('--ivy-v13-tile',clamp(s.tileSize,100,260)+'px');
  root.style.setProperty('--ivy-v13-icon',clamp(s.iconSize,20,112)+'px');
  root.style.setProperty('--ivy-v13-btn',clamp(s.buttonSize,36,80)+'px');
  // Profile and weather are independently measured by the V27 layout controller.
  for(const selector of ['#settings-fixed-container button','#import-fixed-container button','#light-mode-fixed-container button']){
    for(const button of document.querySelectorAll(selector)){
      button.style.setProperty('min-width',clamp(s.buttonSize,36,80)+'px','important');
      button.style.setProperty('min-height',clamp(s.buttonSize,36,80)+'px','important');
    }
  }
  window.ivyV18?.refresh?.();
  requestAnimationFrame(()=>{window.ivyV27Layout?.();reflowMobileWeather();layout()});
}
function reflowMobileWeather(){
  const weather=byId('weather-fixed-container');
  const search=byId('dashboard-container')?.firstElementChild?.querySelector(':scope > section:first-child');
  const launcher=byId('ivy-v15-links-launcher');
  if(!weather||!search)return;
  // Undo only offsets introduced by this routine, leaving user positioning intact.
  const restore=el=>{
    if(!el||el.dataset.ivyV25OldTop===undefined)return;
    const old=el.dataset.ivyV25OldTop,priority=el.dataset.ivyV25OldPriority||'';
    if(old)el.style.setProperty('top',old,priority);else el.style.removeProperty('top');
    delete el.dataset.ivyV25OldTop;delete el.dataset.ivyV25OldPriority;
  };
  restore(search);restore(launcher);
  const oldLeft=search.dataset.ivyV25OldLeft;
  if(oldLeft!==undefined){
    if(oldLeft)search.style.setProperty('left',oldLeft,search.dataset.ivyV25OldLeftPriority||'');
    else search.style.removeProperty('left');
    delete search.dataset.ivyV25OldLeft;delete search.dataset.ivyV25OldLeftPriority;
  }
  if(currentDevice()!=='mobile'){
    const wr=weather.getBoundingClientRect(), sr=search.getBoundingClientRect();
    const overlapping=sr.left<wr.right+12&&sr.right>wr.left&&sr.top<wr.bottom&&sr.bottom>wr.top;
    if(overlapping){
      const dx=Math.ceil(wr.right+18-sr.left);
      if(sr.right+dx<window.innerWidth-18){
        search.dataset.ivyV25OldLeft=search.style.getPropertyValue('left');
        search.dataset.ivyV25OldLeftPriority=search.style.getPropertyPriority('left');
        const oldX=parseFloat(getComputedStyle(search).left)||0;
        search.style.setProperty('left',Math.ceil(oldX+dx)+'px','important');
      }else{
        search.dataset.ivyV25OldTop=search.style.getPropertyValue('top');
        search.dataset.ivyV25OldPriority=search.style.getPropertyPriority('top');
        const oldY=parseFloat(getComputedStyle(search).top)||0;
        search.style.setProperty('top',Math.ceil(oldY+wr.bottom+20-sr.top)+'px','important');
      }
    }
    return;
  }
  const weatherBottom=weather.getBoundingClientRect().bottom;
  const searchBox=search.getBoundingClientRect();
  if(searchBox.top>=weatherBottom+20)return;
  const forceTop=(el,top)=>{
    if(!el)return;
    el.dataset.ivyV25OldTop=el.style.getPropertyValue('top');
    el.dataset.ivyV25OldPriority=el.style.getPropertyPriority('top');
    el.style.setProperty('top',Math.ceil(top)+'px','important');
  };
  const top=weatherBottom+25;
  forceTop(search,top);
  if(launcher&&launcher.getBoundingClientRect().height>0)
    forceTop(launcher,top+searchBox.height+20);
}
function layout(){
 const header=byId('ivy-v13-header');if(!header)return;
 // The band occupies precisely the real rendered card height; no fixed mobile offsets.
 const rect=header.getBoundingClientRect();
 document.documentElement.style.setProperty('--ivy-v13-header-h',Math.ceil(rect.height+4)+'px');
}
function saveSizeControls(changedId){
 const mode=selectedDevice();
 const keys=[['ivy-v13-link-size','tileSize'],['ivy-v13-icon-size','iconSize'],['ivy-v13-button-size','buttonSize'],['ivy-v13-profile-size','profileSize'],['ivy-v13-weather-size','weatherSize'],['ivy-v25-weather-height','weatherHeight']];
 let all={};try{all=JSON.parse(localStorage.getItem(V20SIZEKEY)||'{}')||{}}catch(e){}
 const record={...sizeRecord(mode)};
 const accepted=keys.some(([id])=>id===changedId)?changedId:null;
 // Save only the changed control, so changing the profile NEVER mutates weatherSize.
 for(const [id,key] of keys){if(accepted&&accepted!==id)continue;const el=byId(id);if(el)record[key]=Number(el.value)}
 all[mode]=record;localStorage.setItem(V20SIZEKEY,JSON.stringify(all));
 if(mode===currentDevice())applySizes();
 requestAnimationFrame(layout);
}
window.ivyV13UpdateSizeControls=function(event){
 const targetId=event?.target?.id||window.event?.target?.id||'';
 for(const [id] of [['ivy-v13-link-size'],['ivy-v13-icon-size'],['ivy-v13-button-size'],['ivy-v13-profile-size'],['ivy-v13-weather-size'],['ivy-v25-weather-height']]){
  const el=byId(id),lab=byId(id+'-label');if(el&&lab)lab.textContent=el.value+' px';
 }
 saveSizeControls(targetId);
};
function initSizes(){
 const shared=JSON.parse(localStorage.getItem('dashboardSettings')||'{}');
 const d={...defaultForDevice(selectedDevice()),...shared,...sizeRecord(selectedDevice())};
 for(const [id,k] of [['ivy-v13-link-size','tileSize'],['ivy-v13-icon-size','iconSize'],['ivy-v13-button-size','buttonSize'],['ivy-v13-profile-size','profileSize'],['ivy-v13-weather-size','weatherSize'],['ivy-v25-weather-height','weatherHeight']]){
  if(byId(id))byId(id).value=d[k];
  if(byId(id+'-label'))byId(id+'-label').textContent=d[k]+' px';
 }
  const widthControl=byId('ivy-v13-weather-size');if(widthControl)widthControl.max='460';
  const heightControl=byId('ivy-v25-weather-height');if(heightControl)heightControl.max='540';
  const hideAddRow=byId('setting-hide-add-dial')?.closest('div.flex');
  if(hideAddRow)hideAddRow.style.display=selectedDevice()==='mobile'?'none':'';
  applySizes();
  const help=byId('ivy-v22-sizing-notice');
 if(help)help.textContent=selectedDevice()===currentDevice()?'Vorschau: Diese Ansicht wird sofort aktualisiert.':'Du bearbeitest das andere Geräteprofil. Die Änderungen siehst du beim Wechsel in dessen Ansicht.';
}
window.ivyV20RefreshSizes=initSizes;
function initHeader(){
 const header=document.createElement('div');header.id='ivy-v13-header';
 const weather=byId('weather-fixed-container'),profile=byId('profile-fixed-container');
 if(!weather||!profile)return;
 // Move both cards into a shared layout. This prevents overlap across device widths.
 document.body.appendChild(header);header.append(weather,profile);
 const resizeObserver=new ResizeObserver(()=>requestAnimationFrame(layout));
 resizeObserver.observe(header);resizeObserver.observe(weather);resizeObserver.observe(profile);
 window.addEventListener('resize',()=>{requestAnimationFrame(layout);applySizes();},{passive:true});
 window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(layout),{passive:true});
 requestAnimationFrame(layout);
}
function initLight(){
 const old=byId('light-mode-overlay');if(old)old.style.display='none';
 const el=document.createElement('div');el.id='ivy-v13-light';
 el.innerHTML='<button id="ivy-v13-light-close" type="button" aria-label="Lichtmodus schließen">✕ Schließen</button>'+
 '<div id="ivy-v13-light-panel"><h3>IVY LICHTMODUS</h3>'+
 '<label for="ivy-v13-brightness">Helligkeit <output id="ivy-v13-brightness-label">100 %</output></label>'+
 '<input id="ivy-v13-brightness" type="range" min="0" max="100" value="100" step="1">'+
 '<label for="ivy-v13-warmth">Farbtemperatur <output id="ivy-v13-warmth-label">0 %</output></label>'+
 '<input id="ivy-v13-warmth" type="range" min="0" max="100" value="0" step="1">'+
 '<p id="ivy-v13-light-readout">0 % = Schwarz · 100 % = maximale Helligkeit</p></div>';
 document.body.append(el);
 const paint=()=>{
  const b=clamp(byId('ivy-v13-brightness').value,0,100)/100;
  const w=clamp(byId('ivy-v13-warmth').value,0,100)/100;
  const rgb=[255,255-95*w,255-195*w].map(c=>Math.round(b*c));
  el.style.setProperty('background-color',`rgb(${rgb.join(',')})`,'important');
  el.style.setProperty('background',`rgb(${rgb.join(',')})`,'important');
  byId('ivy-v13-brightness-label').value=Math.round(b*100)+' %';
  byId('ivy-v13-warmth-label').value=Math.round(w*100)+' %';
 };
 byId('ivy-v13-brightness').addEventListener('input',paint);
 byId('ivy-v13-warmth').addEventListener('input',paint);
 byId('ivy-v13-light-close').addEventListener('click',()=>window.toggleLightMode(false));
 // Replace legacy implementation, keep existing onclick buttons working.
 window.toggleLightMode=function(force){
  const open=typeof force==='boolean'?force:!el.classList.contains('ivy-open');
  el.classList.toggle('ivy-open',open);
  el.setAttribute('aria-hidden',String(!open));
  document.body.classList.toggle('ivy-light-active',open);
  if(old){old.classList.add('hidden');old.style.display='none';}
  if(open){paint();byId('ivy-v13-light-close').focus({preventScroll:true});}
 };
 window.updateLightSource=paint;
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&el.classList.contains('ivy-open')){e.preventDefault();window.toggleLightMode(false);}
 },true);
 paint();
}
function init(){
 initSizes();
 requestAnimationFrame(()=>requestAnimationFrame(layout));
 // Keep modal scroll usable even when the viewport gets smaller with mobile keyboard.
 document.querySelectorAll('#settings-modal,#add-modal').forEach(modal=>{
  modal.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


;
/* from <script> */


/* IVY V14: independent workspace geometry, touch dragging, and per-device persistence */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const scope=()=>window.innerWidth<=767?'mobile':'desktop';
const names={search:'Suche',links:'Links'};
const limits={searchWidth:[210,1000],linksWidth:[220,1240],linksHeight:[160,1100]};
const presets={searchWidth:620,linksWidth:920,linksHeight:620,searchX:0,searchY:0,linksX:0,linksY:0};
const key=()=>`ivyV14Workspace_${scope()}`;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
let data={...presets},bound=false,oldScope='',resizeToken=0;
function read(){
 let saved={};try{saved=JSON.parse(localStorage.getItem(key())||'{}')||{}}catch(e){}
 return {...presets,...saved};
}
function save(){try{localStorage.setItem(key(),JSON.stringify(data))}catch(e){console.warn('IVY workspace could not save',e)}}
function parts(){const main=$('dashboard-container')?.firstElementChild;
 return {search:main?.querySelector(':scope > section:first-child'),links:main?.querySelector(':scope > section:nth-child(2)')};
}
function visibleArea(){let host=$('dashboard-container')?.firstElementChild;
 if(!host)return {w:innerWidth,h:innerHeight};
 const box=host.getBoundingClientRect();return {w:Math.min(innerWidth,box.width),h:Math.min(innerHeight,box.height)};
}
function constrain(n,v){
 const area=visibleArea();const el=parts()[n];if(!el)return {x:0,y:0};
 const baseX=n==='search'?data.searchX:data.linksX;
 const baseY=n==='search'?data.searchY:data.linksY;
 // Relative displacement is constrained to roughly half the available empty space.
 const xlim=Math.max(0,(area.w-el.offsetWidth)/2);
 const ylim=Math.max(0,(area.h-el.offsetHeight)/2);
 return {x:clamp(Number(v?.x??baseX)||0,-xlim,xlim),y:clamp(Number(v?.y??baseY)||0,-ylim,ylim)};
}
function apply(){
 const root=document.documentElement;
 const w=Math.max(1,innerWidth);
 const maxSearch=clamp(Number(data.searchWidth)||620,limits.searchWidth[0],limits.searchWidth[1]);
 const maxLinks=clamp(Number(data.linksWidth)||920,limits.linksWidth[0],limits.linksWidth[1]);
 const maxHeight=clamp(Number(data.linksHeight)||620,limits.linksHeight[0],limits.linksHeight[1]);
 root.style.setProperty('--ivy-v14-search-width',Math.min(maxSearch,w-20)+'px');
 root.style.setProperty('--ivy-v14-links-width',Math.min(maxLinks,w-20)+'px');
 root.style.setProperty('--ivy-v14-links-height',Math.min(maxHeight,Math.max(140,innerHeight-110))+'px');
 const selections=parts();
 for(const n of ['search','links']) {
  if(!selections[n])continue;
  const pos=constrain(n);
  data[n+'X']=pos.x;data[n+'Y']=pos.y;
  root.style.setProperty('--ivy-v14-'+n+'-x',pos.x+'px');
  root.style.setProperty('--ivy-v14-'+n+'-y',pos.y+'px');
 }
 syncControls();
}
function syncControls(){
 for(const name of Object.keys(limits)){
  const input=$('ivy-v14-'+name),out=$('ivy-v14-'+name+'-out');
  if(input && document.activeElement!==input)input.value=String(data[name]);
  if(out)out.textContent=String(Math.round(Number(data[name])))+' px';
 }
}
function change(name,value){
 data[name]=clamp(Number(value),...limits[name]);
 apply();save();
}
function resetPositions(){
 for(const n of ['search','links']){data[n+'X']=0;data[n+'Y']=0}
 apply();save();
}
function resetSizes(){
 for(const n of Object.keys(limits))data[n]=presets[n];
 apply();save();
}
function mountSettings(){
 const modal=$('settings-modal')?.firstElementChild;
 if(!modal||$('ivy-v14-controls'))return;
 const panel=document.createElement('section');panel.id='ivy-v14-controls';panel.className='ivy-v14-size-section';
 panel.innerHTML=`<h4>Suchfeld & Link-Container · Position / Größe</h4>
 <p>Ziehe im manuellen Layoutmodus die Griffe „Suche ziehen“ und „Links ziehen“. Desktop und Mobil speichern getrennte Einstellungen. Nur die Links werden gescrollt.</p>
 <label for="ivy-v14-searchWidth">Suchfeld-Breite <output id="ivy-v14-searchWidth-out">620 px</output></label>
 <input id="ivy-v14-searchWidth" type="range" min="210" max="1000" step="10"/>
 <label for="ivy-v14-linksWidth">Link-Container-Breite <output id="ivy-v14-linksWidth-out">920 px</output></label>
 <input id="ivy-v14-linksWidth" type="range" min="220" max="1240" step="10"/>
 <label for="ivy-v14-linksHeight">Link-Container-Höhe <output id="ivy-v14-linksHeight-out">620 px</output></label>
 <input id="ivy-v14-linksHeight" type="range" min="160" max="1100" step="10"/>
 <div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" id="ivy-v14-reset-position">Positionen zurücksetzen</button><button type="button" id="ivy-v14-reset-size">Größen zurücksetzen</button></div>`;
 const first=$('ivy-v13-link-size')?.closest('.ivy-v13-section');
 if(first)first.after(panel);else modal.appendChild(panel);
 for(const name of Object.keys(limits)){
  const input=$('ivy-v14-'+name);
  input.addEventListener('input',()=>change(name,input.value));
 }
 $('ivy-v14-reset-position').addEventListener('click',resetPositions);
 $('ivy-v14-reset-size').addEventListener('click',resetSizes);
 syncControls();
}
function installDrag(section,name){
 if(section.querySelector(':scope > .ivy-v14-drag-handle'))return;
 const handle=document.createElement('button');
 handle.type='button';handle.className='ivy-v14-drag-handle';
 handle.textContent=name==='search'?'⠿ Suche ziehen':'⠿ Links ziehen';
 handle.setAttribute('aria-label',name==='search'?'Suchfeld verschieben':'Link-Container verschieben');
 section.appendChild(handle);
 let drag=null;
 handle.addEventListener('pointerdown',event=>{
  if(!document.body.classList.contains('manual-layout-mode'))return;
  if(event.button!==undefined&&event.button!==0)return;
  const modal=$('settings-modal');if(modal&&!modal.classList.contains('hidden'))return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,ox:data[name+'X'],oy:data[name+'Y']};
  handle.setPointerCapture?.(event.pointerId);
  section.classList.add('ivy-v14-being-dragged');
  event.preventDefault();
 });
 handle.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const pos=constrain(name,{x:drag.ox+event.clientX-drag.x,y:drag.oy+event.clientY-drag.y});
  data[name+'X']=pos.x;data[name+'Y']=pos.y;
  document.documentElement.style.setProperty('--ivy-v14-'+name+'-x',pos.x+'px');
  document.documentElement.style.setProperty('--ivy-v14-'+name+'-y',pos.y+'px');
  event.preventDefault();
 });
 const finish=event=>{
  if(!drag||event.pointerId!==drag.id)return;
  drag=null;section.classList.remove('ivy-v14-being-dragged');save();
 };
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
}
function init(){
 const selections=parts();if(!selections.search||!selections.links)return;
 mountSettings();installDrag(selections.search,'search');installDrag(selections.links,'links');
 oldScope=scope();data=read();apply();bound=true;
 window.addEventListener('resize',()=>{
  cancelAnimationFrame(resizeToken);
  resizeToken=requestAnimationFrame(()=>{
   if(scope()!==oldScope){oldScope=scope();data=read()}
   apply();
  });
 },{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.ivyV14Workspace={resetPositions,resetSizes,apply};
})();


;
/* from <script> */


/* IVY V18: one mobile position controller; desktop settings remain untouched */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=document.documentElement;
const MOBILE=()=>window.matchMedia('(max-width:900px)').matches;
const KEY='ivyV18MobileLayout';
const IDS=['weather-fixed-container','profile-fixed-container','settings-fixed-container','import-fixed-container','light-mode-fixed-container','ivy-v15-links-launcher','ivy18-search'];
const clamp=(v,a,b)=>Math.max(a,Math.min(Math.max(a,b),v));
const vp=()=>({w:Math.max(1,window.innerWidth),h:Math.max(1,window.innerHeight)});
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
let active=null,opened=false,busy=false,scheduled=0,priorMobile=null,initialized=false;
const searchSection=()=>$('dashboard-container')?.firstElementChild?.querySelector(':scope > section:first-child');
const linksSection=()=>$('dashboard-container')?.firstElementChild?.querySelector(':scope > section:nth-child(2)');
const elById=id=>id==='ivy18-search'?searchSection():$(id);
function readLegacy(){
 if(Object.keys(saved).length)return;
 for(const key of ['ivyV17MobilePositions','ivyV15MobileWidgets']){
  try{const old=JSON.parse(localStorage.getItem(key)||'{}');
   for(const [id,p] of Object.entries(old||{}))if(IDS.includes(id)&&Number.isFinite(p.x)&&Number.isFinite(p.y))saved[id]={x:p.x,y:p.y};
  }catch(e){}
 }
}
readLegacy();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){console.warn('IVY: Positionsspeicherung fehlgeschlagen',e)}}
function defaults(id,v,box){
 const safe=10,sw=Math.max(0,v.w-box.width-safe),sh=Math.max(0,v.h-box.height-safe);
 const weather=$('weather-fixed-container')?.getBoundingClientRect();
 const defaultCardsBottom=Math.max(92,Math.min(v.h*.44,(weather?.height||152)+32));
 const searchH=searchSection()?.getBoundingClientRect().height||75;
 const mobileLandscape=v.h<520;
 if(id==='weather-fixed-container')return{x:safe,y:safe};
 if(id==='profile-fixed-container')return{x:sw,y:safe};
 if(id==='settings-fixed-container')return{x:sw,y:sh};
 if(id==='import-fixed-container')return{x:clamp(sw-82,safe,sw),y:sh};
 if(id==='light-mode-fixed-container')return{x:safe,y:sh};
 if(id==='ivy18-search')return{x:clamp((v.w-box.width)/2,safe,sw),y:clamp(defaultCardsBottom+8,safe,sh)};
 if(id==='ivy-v15-links-launcher'){
  const sy=saved['ivy18-search']?saved['ivy18-search'].y*v.h:defaultCardsBottom+8;
  const y=clamp(sy+searchH+20,safe,Math.max(safe,sh-(mobileLandscape?42:50)));
  return{x:clamp((v.w-box.width)/2,safe,sw),y};
 }
 return{x:safe,y:safe};
}
function sizeSearch(v){const s=searchSection();if(!s)return;
 const w=Math.min(v.w-20,Math.max(205,Number(getComputedStyle(root).getPropertyValue('--ivy-v14-search-width').replace('px',''))||620));
 root.style.setProperty('--ivy18-search-width',w+'px');
}
function place(id,v){const e=elById(id);if(!e)return;
 if(window.ivyV27Layout && !document.body.classList.contains('manual-layout-mode') && (id==='weather-fixed-container'||id==='profile-fixed-container'))return;
 const b=e.getBoundingClientRect(),w=Math.max(12,b.width),h=Math.max(12,b.height);
 const p=saved[id],d=defaults(id,v,{width:w,height:h});
 const x=clamp(p&&Number.isFinite(p.x)?p.x*v.w:d.x,5,Math.max(5,v.w-w-5));
 const y=clamp(p&&Number.isFinite(p.y)?p.y*v.h:d.y,5,Math.max(5,v.h-h-5));
 if(id==='ivy18-search'){
  root.style.setProperty('--ivy18-search-left',Math.round(x)+'px');root.style.setProperty('--ivy18-search-top',Math.round(y)+'px');
 }else if(id==='ivy-v15-links-launcher'){
  root.style.setProperty('--ivy18-launch-left',Math.round(x)+'px');root.style.setProperty('--ivy18-launch-top',Math.round(y)+'px');
  e.style.setProperty('left',Math.round(x)+'px','important');e.style.setProperty('top',Math.round(y)+'px','important');
 }else{
  e.style.setProperty('position','fixed','important');
  e.style.setProperty('left',Math.round(x)+'px','important');e.style.setProperty('top',Math.round(y)+'px','important');
  e.style.setProperty('right','auto','important');e.style.setProperty('bottom','auto','important');
  e.style.setProperty('translate','none','important');e.style.setProperty('transform','none','important');
 }
}
function relayout(){
 // V19 writes to the same storage key. Refresh the V18 in-memory snapshot
 // before applying positions; otherwise it restores the old coordinates.
 try {
  const latest=JSON.parse(localStorage.getItem(KEY)||'{}');
  if(latest && typeof latest==='object' && !Array.isArray(latest)) saved=latest;
 } catch(e) { console.warn('IVY: Positionsdaten unlesbar',e); }
 const mobile=MOBILE();root.classList.toggle('ivy-v16-mobile-ui',mobile);root.classList.toggle('ivy-v18-mobile',mobile);
 document.body.classList.toggle('ivy-v16-mobile-ui',mobile);
 if(priorMobile!==mobile){priorMobile=mobile;
  if(!mobile){closeLinks(false);for(const id of IDS){if(id==='ivy18-search')continue;const el=elById(id);if(el){for(const k of ['position','left','top','right','bottom','translate','transform'])el.style.removeProperty(k)}}}
 }
 if(!mobile||busy)return;
 const host=$('dashboard-container'),main=host?.firstElementChild;
 for(const el of [host,main])if(el){el.style.setProperty('transform','none','important');el.style.setProperty('translate','none','important');el.style.setProperty('padding','0px','important');}
 const v=vp();sizeSearch(v);
 // Position the cards before deriving the search & launcher fallbacks.
 for(const id of IDS)place(id,v);
}
function schedule(){cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(relayout)}
function openLinks(){if(!MOBILE()||document.body.classList.contains('manual-layout-mode'))return;
 opened=true;document.body.classList.add('ivy-v15-links-open');$('ivy-v15-links-launcher')?.setAttribute('aria-expanded','true');
 const grid=$('quick-dials-grid');if(grid){requestAnimationFrame(()=>{grid.scrollTop=grid.scrollHeight;});}
}
function closeLinks(refocus=true){opened=false;document.body.classList.remove('ivy-v15-links-open');$('ivy-v15-links-launcher')?.setAttribute('aria-expanded','false');if(refocus&&MOBILE())$('ivy-v15-links-launcher')?.focus({preventScroll:true})}
function installGrip(id){const el=elById(id);if(!el)return;
 for(const old of el.querySelectorAll(':scope > .ivy-v15-widget-grip,:scope > .ivy-v17-grip'))old.remove();
 if(el.querySelector(':scope > .ivy18-grip'))return;
 const grip=document.createElement('button');grip.type='button';grip.className='ivy18-grip';grip.textContent='⠿';grip.title='Verschieben';grip.setAttribute('aria-label',id+' verschieben');el.appendChild(grip);
 let state=null;
 grip.addEventListener('pointerdown',ev=>{
  if(!MOBILE()||!document.body.classList.contains('manual-layout-mode')||opened)return;
  if(ev.button!==undefined&&ev.button!==0)return;
  const b=el.getBoundingClientRect();state={id:ev.pointerId,sx:ev.clientX,sy:ev.clientY,x:b.left,y:b.top,w:b.width,h:b.height};
  busy=true;active=id;el.classList.add('ivy18-dragging');
  try{grip.setPointerCapture(ev.pointerId)}catch(e){}ev.preventDefault();ev.stopPropagation();
 });
 grip.addEventListener('pointermove',ev=>{
  if(!state||state.id!==ev.pointerId)return;
  const v=vp(),x=clamp(state.x+ev.clientX-state.sx,5,v.w-state.w-5),y=clamp(state.y+ev.clientY-state.sy,5,v.h-state.h-5);
  if(id==='ivy18-search'){
   root.style.setProperty('--ivy18-search-left',Math.round(x)+'px');root.style.setProperty('--ivy18-search-top',Math.round(y)+'px');
  } else if(id==='ivy-v15-links-launcher'){
   root.style.setProperty('--ivy18-launch-left',Math.round(x)+'px');root.style.setProperty('--ivy18-launch-top',Math.round(y)+'px');
   el.style.setProperty('left',Math.round(x)+'px','important');el.style.setProperty('top',Math.round(y)+'px','important');
  }else {el.style.setProperty('left',Math.round(x)+'px','important');el.style.setProperty('top',Math.round(y)+'px','important')}
  ev.preventDefault();ev.stopPropagation();
 });
 const finish=(ev)=>{if(!state||state.id!==ev.pointerId)return;
  const b=el.getBoundingClientRect(),v=vp();saved[id]={x:clamp(b.left/v.w,0,1),y:clamp(b.top/v.h,0,1)};persist();
  state=null;active=null;busy=false;el.classList.remove('ivy18-dragging');ev.preventDefault();ev.stopPropagation();schedule();
 };
 grip.addEventListener('pointerup',finish);grip.addEventListener('pointercancel',finish);
 grip.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation()});
}
function setup(){
 if(initialized)return;
 const links=linksSection(),search=searchSection(),launch=$('ivy-v15-links-launcher');if(!links||!search||!launch)return;initialized=true;
 links.id='ivy-v15-links-view';
 for(const id of ['settings-fixed-container','import-fixed-container','light-mode-fixed-container']){const e=$(id);if(e&&e.parentElement!==document.body)document.body.appendChild(e)}
 const modalIDs=['settings-modal','add-modal'];
 for(const id of modalIDs){const e=$(id);if(e&&e.parentElement!==document.body)document.body.appendChild(e)}
 const heading=$('ivy-v15-links-head');if(heading){heading.querySelector('.ivy-v15-back')?.addEventListener('click',ev=>{ev.stopPropagation();closeLinks()})}
 const reset=$('ivy-v15-reset-mobile');if(reset)reset.addEventListener('click',()=>{saved={};persist();schedule()});
 // No old linked 'open' method or grip can steal touch interactions.
 launch.addEventListener('click',ev=>{if(document.body.classList.contains('manual-layout-mode')){ev.preventDefault();ev.stopImmediatePropagation()}},true);
 for(const id of IDS)installGrip(id);
 for(const target of [window,window.visualViewport])target?.addEventListener('resize',()=>setTimeout(schedule,30),{passive:true});
 window.addEventListener('orientationchange',()=>setTimeout(schedule,180));
 document.addEventListener('fullscreenchange',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&opened&&$('add-modal')?.classList.contains('hidden')&&$('settings-modal')?.classList.contains('hidden'))closeLinks()});
 // A measured layout pass after all existing scripts and their resize hooks.
 schedule();requestAnimationFrame(()=>requestAnimationFrame(schedule));setTimeout(schedule,240);
}
window.ivyV15Links={open:openLinks,close:closeLinks,refresh:schedule};
window.ivyV18={resetMobilePositions(){saved={};persist();schedule()},getMobilePositions(){return JSON.parse(JSON.stringify(saved))},refresh:schedule,setup,debug(){return {initialized,links:!!linksSection(),search:!!searchSection(),launch:!!$('ivy-v15-links-launcher'),grips:document.querySelectorAll('.ivy18-grip').length}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
setTimeout(setup,0);
})();


;
/* from <script> */

/* IVY V19: canonical touch drags for every mobile widget; one shared position store. */
(()=>{
'use strict';
const KEY='ivyV18MobileLayout';
const IDS=['weather-fixed-container','profile-fixed-container','settings-fixed-container','import-fixed-container','light-mode-fixed-container','ivy-v15-links-launcher','ivy19-search'];
const $=id=>document.getElementById(id);
const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const search=()=>$('dashboard-container')?.firstElementChild?.querySelector(':scope > section:first-child');
const target=id=>id==='ivy19-search'?search():$(id);
let layer=null, dragging=null, paintId=0, lastPaint=0;
function enabled(){return isMobile()&&document.body.classList.contains('manual-layout-mode')&&!document.body.classList.contains('ivy-v15-links-open')&&!document.body.classList.contains('ivy-light-active')&&$('settings-modal')?.classList.contains('hidden')&&$('add-modal')?.classList.contains('hidden')}
function viewport(){return {w:Math.max(1,innerWidth),h:Math.max(1,innerHeight)}}
function stored(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){return {}}}
function save(id,box){const v=viewport();const state=stored();const canon=id==='ivy19-search'?'ivy18-search':id;state[canon]={x:clamp(box.left/v.w,0,1),y:clamp(box.top/v.h,0,1)};try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('IVY: Position konnte nicht gespeichert werden',e)}}
function setXY(id,x,y){const t=target(id);if(!t)return;
 if(id==='ivy19-search'){
  document.documentElement.style.setProperty('--ivy18-search-left',Math.round(x)+'px');
  document.documentElement.style.setProperty('--ivy18-search-top',Math.round(y)+'px');
 } else if(id==='ivy-v15-links-launcher'){
  document.documentElement.style.setProperty('--ivy18-launch-left',Math.round(x)+'px');
  document.documentElement.style.setProperty('--ivy18-launch-top',Math.round(y)+'px');
  t.style.setProperty('left',Math.round(x)+'px','important');t.style.setProperty('top',Math.round(y)+'px','important');
 }else{
  t.style.setProperty('position','fixed','important');
  t.style.setProperty('right','auto','important');t.style.setProperty('bottom','auto','important');
  t.style.setProperty('left',Math.round(x)+'px','important');t.style.setProperty('top',Math.round(y)+'px','important');
  t.style.setProperty('transform','none','important');t.style.setProperty('translate','none','important');
 }
}
function attach(){if(layer)return;
 layer=document.createElement('div');layer.className='ivy19-drag-portals';layer.setAttribute('aria-label','Mobiles Layout bearbeiten');document.body.appendChild(layer);
 for(const id of IDS){const t=target(id);if(!t)continue;
 const grip=document.createElement('button');grip.type='button';grip.dataset.ivyTarget=id;grip.textContent='⠿';grip.setAttribute('aria-label',({ 'weather-fixed-container':'Wetterkarte','profile-fixed-container':'Profilkarte','settings-fixed-container':'Einstellungen','import-fixed-container':'Import und Export','light-mode-fixed-container':'Helligkeitsbutton','ivy-v15-links-launcher':'Links-Button','ivy19-search':'Suchfeld'}[id]||'Element')+' verschieben');
 layer.appendChild(grip);
 grip.addEventListener('pointerdown',ev=>{
  if(!enabled()||(ev.button!==undefined&&ev.button!==0))return;
  const box=t.getBoundingClientRect();dragging={id,pointer:ev.pointerId,startX:ev.clientX,startY:ev.clientY,x:box.left,y:box.top,width:box.width,height:box.height};
  grip.setPointerCapture(ev.pointerId);ev.preventDefault();ev.stopPropagation();
 });
 grip.addEventListener('pointermove',ev=>{
  if(!dragging||dragging.id!==id||dragging.pointer!==ev.pointerId)return;
  const v=viewport(),x=clamp(dragging.x+ev.clientX-dragging.startX,4,Math.max(4,v.w-dragging.width-4));
  const y=clamp(dragging.y+ev.clientY-dragging.startY,4,Math.max(4,v.h-dragging.height-4));
  setXY(id,x,y);placeHandles();ev.preventDefault();ev.stopPropagation();
 });
 const done=ev=>{
  if(!dragging||dragging.id!==id||dragging.pointer!==ev.pointerId)return;
  save(id,t.getBoundingClientRect());dragging=null;
  try{if(grip.hasPointerCapture(ev.pointerId))grip.releasePointerCapture(ev.pointerId)}catch(_){}
  window.ivyV18?.refresh?.();placeHandles();ev.preventDefault();ev.stopPropagation();
 };
 grip.addEventListener('pointerup',done);grip.addEventListener('pointercancel',done);
 grip.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()});
 }
}
function placeHandles(){if(!layer)return;const show=enabled();layer.style.display=show?'block':'none';if(!show)return;
 const v=viewport();for(const grip of layer.querySelectorAll('button[data-ivy-target]')){
  const t=target(grip.dataset.ivyTarget),r=t?.getBoundingClientRect();if(!r||r.width<1||r.height<1){grip.style.display='none';continue}
  grip.style.display='flex';
  // Above each toolbar control: avoids stealing its normal click/tap area.
  const control=['settings-fixed-container','import-fixed-container','light-mode-fixed-container'].includes(grip.dataset.ivyTarget);
  const x=clamp(r.right-36,4,Math.max(4,v.w-42));
  const y=clamp(control?r.top-41:r.top+4,4,Math.max(4,v.h-42));
  grip.style.left=Math.round(x)+'px';grip.style.top=Math.round(y)+'px';
 }
}
function loop(){if(document.hidden||!isMobile())return;placeHandles()}
function setup(){attach();if(!paintId){loop();paintId=setInterval(loop,220)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
window.ivyV19={refresh:placeHandles, positions:stored};
})();

;
/* from <script> */

// Register the IVY app shell cache only on secure origins (GitHub Pages/localhost).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(err => console.warn('IVY offline cache:', err));
  });
}

;
/* from <script> */

/* IVY V20: shared design, per-mode layout, bidirectional link ordering. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const K='ivyV20DisplayPrefs', SIZEK='ivyV20DeviceSizes';
 const modeNow=()=>matchMedia('(max-width:900px)').matches?'mobile':'desktop';
 const defaults={weather:true,profile:true,search:true};
 const prefs=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return {}}};
 const get=m=>({...defaults,...(prefs()[m]||{})});
 const getEditMode=()=>window.ivyV20SelectedMode||modeNow();
 const applyVisibility=()=>{
  const d=get(modeNow());
  for(const name of ['weather','profile','search'])document.body.classList.toggle('ivy-v20-hide-'+name,!d[name]);
 };
 function updateUI(){
  const m=getEditMode(),d=get(m);
  if($('ivy-v20-editmode'))$('ivy-v20-editmode').value=m;
  for(const name of ['weather','profile','search'])if($('ivy-v20-visible-'+name))$('ivy-v20-visible-'+name).checked=d[name];
  window.ivyV20RefreshSizes?.();
 }
 function saveCheckbox(){
  const m=getEditMode(),all=prefs(),d=get(m);
  for(const name of ['weather','profile','search'])d[name]=!!$('ivy-v20-visible-'+name)?.checked;
  all[m]=d;localStorage.setItem(K,JSON.stringify(all));applyVisibility();
 }
 function mountSettings(){
  const settings=$('settings-modal')?.firstElementChild;
  if(!settings||$('ivy-v20-device-settings'))return;
  // Keep old inputs in DOM for previous versions' save routines, but do not expose duplicate sizing controls.
  for(const id of ['setting-weather-width','setting-profile-size','setting-quickdial-size']){
   const input=$(id);if(input){const row=input.closest('div.flex')||input.parentElement;if(row)row.style.display='none';}
  }
  const box=document.createElement('section');box.id='ivy-v20-device-settings';box.className='ivy-v20-settings';
  box.innerHTML=`<h4>Geräteprofile & Sichtbarkeit</h4>
   <p>Farben und Glow bleiben gemeinsam. Positionen, Größen und sichtbare Widgets sind pro Ansichtsmodus getrennt.</p>
   <label for="ivy-v20-editmode">Einstellungen bearbeiten für</label>
   <select id="ivy-v20-editmode"><option value="desktop">Desktop-Ansicht</option><option value="mobile">Mobil-Ansicht</option></select>
   <label class="ivy-v20-line" for="ivy-v20-visible-weather">Wetter anzeigen <input type="checkbox" id="ivy-v20-visible-weather" checked></label>
   <label class="ivy-v20-line" for="ivy-v20-visible-profile">Profil anzeigen <input type="checkbox" id="ivy-v20-visible-profile" checked></label>
   <label class="ivy-v20-line" for="ivy-v20-visible-search">Schnellsuche anzeigen <input type="checkbox" id="ivy-v20-visible-search" checked></label>
   <p>Die fünf Größenregler weiter unten speichern automatisch für den hier gewählten Modus. Die Größe des Suchfelds und des Link-Bereichs bleibt separat einstellbar.</p>
   <button class="ivy-v20-reset" type="button" id="ivy-v20-reset-device">Sichtbarkeit dieses Profils zurücksetzen</button>`;
  const size=$('ivy-v13-link-size')?.closest('.ivy-v13-section');
  if(size)size.before(box);else settings.appendChild(box);
  $('ivy-v20-editmode').addEventListener('change',e=>{window.ivyV20SelectedMode=e.target.value;updateUI();});
  for(const name of ['weather','profile','search'])$('ivy-v20-visible-'+name).addEventListener('change',saveCheckbox);
  $('ivy-v20-reset-device').addEventListener('click',()=>{
   const m=getEditMode(),all=prefs();delete all[m];localStorage.setItem(K,JSON.stringify(all));
   updateUI();applyVisibility();
  });
  window.ivyV20SelectedMode=modeNow();updateUI();
 }
 // Smooth bidirectional move controls as alternative to pointer sorting.
 function reorder(id,dir){
  const ds=window.getDialsFromLocalStorage?.()||JSON.parse(localStorage.getItem('quickDials')||'[]');
  const i=ds.findIndex(d=>String(d.id)===String(id));
  const j=i+dir;
  if(i<0||j<0||j>=ds.length)return;
  [ds[i],ds[j]]=[ds[j],ds[i]];
  localStorage.setItem('quickDials',JSON.stringify(ds));
  window.renderQuickDials?.(ds);
  decorateDials();
 }
 function decorateDials(){
  // V21: drag handles provide the only ordering control.
  // Also clean up any V20 arrow controls after a redraw.
  document.querySelectorAll('#quick-dials-grid .ivy-v20-order').forEach(el=>el.remove());
 }
 const start=()=>{
  // Move dialogs directly under <body>, outside the link view's stacking context.
  for(const id of ['add-modal','settings-modal']){
   const modal=$(id);
   if(modal && modal.parentElement!==document.body)document.body.appendChild(modal);
  }
  mountSettings();applyVisibility();decorateDials();
  const grid=$('quick-dials-grid');
  if(grid){
   let pending=false;
   new MutationObserver(()=>{
    if(pending)return;pending=true;
    requestAnimationFrame(()=>{pending=false;decorateDials();});
   }).observe(grid,{childList:true});
  }
  const mql=matchMedia('(max-width:900px)');
  mql.addEventListener?.('change',()=>{
   applyVisibility();window.ivyV20SelectedMode=modeNow();updateUI();
  });
  // Recalculate after link full-screen opens; short lists start at the bottom.
  $('ivy-v15-links-launcher')?.addEventListener('click',()=>{
   requestAnimationFrame(()=>{const g=$('quick-dials-grid');if(g)g.scrollTop=g.scrollHeight;});
  });
  // Back button stays in the lower control dock; add link directly beside it.
  $('ivy-v20-add-link')?.addEventListener('click',e=>{
   e.stopPropagation();
   requestAnimationFrame(()=>$('modal-title')?.focus({preventScroll:true}));
  });
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

;
/* from <script> */

/* IVY V22: visibility and profile reliability audit. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const KEY='ivyV20DisplayPrefs';
const mode=()=>matchMedia('(max-width:900px)').matches?'mobile':'desktop';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
function visible(){
 const flags={weather:true,profile:true,search:true,...(read()[mode()]||{})};
 for(const [name,id] of [['weather','weather-fixed-container'],['profile','profile-fixed-container']]){
  const el=$(id);if(!el)continue;
  if(flags[name]){
   // Do not force display:block: fullscreen mode controls visibility too.
   el.style.removeProperty('display');el.style.removeProperty('visibility');
   el.style.removeProperty('pointer-events');el.removeAttribute('aria-hidden');
  }else{
   el.style.setProperty('display','none','important');
   el.style.setProperty('visibility','hidden','important');
   el.style.setProperty('pointer-events','none','important');
   el.setAttribute('aria-hidden','true');
  }
 }
 const search=$('dashboard-container')?.firstElementChild?.querySelector(':scope > section:first-child');
 if(search){
  if(flags.search){search.style.removeProperty('display');search.style.removeProperty('visibility');search.style.removeProperty('pointer-events');}
  else{search.style.setProperty('display','none','important');search.style.setProperty('visibility','hidden','important');search.style.setProperty('pointer-events','none','important');}
 }
 document.body.classList.toggle('ivy-v20-hide-weather',!flags.weather);
 document.body.classList.toggle('ivy-v20-hide-profile',!flags.profile);
 document.body.classList.toggle('ivy-v20-hide-search',!flags.search);
 window.ivyV18?.refresh?.();
}
function init(){
 const section=$('ivy-v20-device-settings');
 if(section && !$('ivy-v22-sizing-notice')){
  const msg=document.createElement('div');msg.id='ivy-v22-sizing-notice';
  msg.textContent='Die Größen werden getrennt für Desktop und Mobil gespeichert.';
  section.appendChild(msg);
 }
 const controls=['weather','profile','search'].map(x=>$('ivy-v20-visible-'+x)).filter(Boolean);
 for(const ctrl of controls)ctrl.addEventListener('change',()=>requestAnimationFrame(visible));
 $('ivy-v20-reset-device')?.addEventListener('click',()=>requestAnimationFrame(visible));
 $('ivy-v20-editmode')?.addEventListener('change',()=>requestAnimationFrame(()=>window.ivyV20RefreshSizes?.()));
 // Keep active device profile after switching modes or resizing the viewport.
 const mq=matchMedia('(max-width:900px)');mq.addEventListener?.('change',()=>{visible();window.ivyV20RefreshSizes?.()});
 const oldShow=window.showSettingsModal;
 if(typeof oldShow==='function')window.showSettingsModal=function(...args){const result=oldShow.apply(this,args);window.ivyV20RefreshSizes?.();visible();return result};
 visible();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

;
/* from <script id="ivy-v23-runtime"> */

/* IVY V23 fixes: small, isolated final layer. Original storage & dashboard logic intact. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const mobile=()=>matchMedia('(max-width:900px)').matches;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));

 // --- 1. One genuine light mode. Both endpoints are explicitly RGB-bound. ---
 function installLight(){
   if($('ivy-v23-light'))return;
   const legacy=$('ivy-v13-light');
   if(legacy)legacy.classList.remove('ivy-open');
   const el=document.createElement('div');
   el.id='ivy-v23-light';el.setAttribute('aria-hidden','true');
   el.innerHTML='<button type="button" id="ivy-v23-light-close">✕ Schließen</button><div id="ivy-v23-light-panel"><h3>IVY · LICHTMODUS</h3><label for="ivy-v23-brightness">Helligkeit <output id="ivy-v23-brightness-value">100 %</output></label><input id="ivy-v23-brightness" type="range" min="0" max="100" step="1" value="100"><label for="ivy-v23-warmth">Farbtemperatur <output id="ivy-v23-warmth-value">0 %</output></label><input id="ivy-v23-warmth" type="range" min="0" max="100" step="1" value="0"><small>0 % Schwarz · 100 % Weiß (bei neutraler Farbtemperatur)</small></div>';
   document.body.append(el);
   const bright=$('ivy-v23-brightness'),warm=$('ivy-v23-warmth');
   function paint(){
     const b=clamp(bright.value,0,100),w=clamp(warm.value,0,100)/100;
     const c=[255,255-95*w,255-195*w].map(x=>Math.round(x*b/100));
     const color=`rgb(${c.join(', ')})`;
     el.style.setProperty('background',color,'important');
     el.style.setProperty('background-color',color,'important');
     el.dataset.brightness=String(b);
     $('ivy-v23-brightness-value').textContent=b+' %';
     $('ivy-v23-warmth-value').textContent=Math.round(w*100)+' %';
   }
   bright.addEventListener('input',paint,{passive:true});warm.addEventListener('input',paint,{passive:true});
   function toggle(force){
     const open=typeof force==='boolean'?force:!el.classList.contains('ivy-open');
     legacy?.classList.remove('ivy-open');
     $('light-mode-overlay')?.classList.add('hidden');
     el.classList.toggle('ivy-open',open);el.setAttribute('aria-hidden',String(!open));
     document.body.classList.toggle('ivy-light-active',open);
     if(open){paint();$('ivy-v23-light-close').focus({preventScroll:true});}
     return open;
   }
   $('ivy-v23-light-close').addEventListener('click',()=>toggle(false));
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&el.classList.contains('ivy-open')){e.preventDefault();toggle(false)}},true);
   // Keep every existing light button wired up to the single implementation.
   window.toggleLightMode=toggle;window.updateLightSource=paint;
   window.ivyV23Light={paint,toggle,getColor:()=>getComputedStyle(el).backgroundColor};
   paint();
 }

 // Weather is owned by V27, while V23 retains the WetterOnline link and mobile link grid.
 const scene=$('ivy-weather-scene'), card=$('weather-card'), cityInput=$('weather-city-input');
 // WetterOnline deep link derived from the city the user actually typed.
 // Its website may normalize city slugs or resolve ambiguous names itself.
 function citySlug(city){return String(city||'').split(',')[0].trim().toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
 function weatherURL(){
   const city=cityInput?.value.trim()||localStorage.getItem('weatherCity')||'';
   const slug=citySlug(city);
   return slug?'https://www.wetteronline.ch/wetter/'+encodeURIComponent(slug):'https://www.wetteronline.ch/';
 }
 // Native anchor allows browser/PWA to open the page and use the back action.
 if(scene){
   const a=document.createElement('a');a.id='ivy-v23-weather-link';a.textContent='WetterOnline öffnen';
   a.setAttribute('aria-label','WetterOnline für die eingetragene Stadt öffnen');a.href=weatherURL();
   a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');
   a.style.cssText='position:absolute;inset:0;z-index:3;font-size:0;cursor:pointer';
   scene.insertBefore(a,scene.querySelector('.ivy-weather-data'));
   const sync=()=>{a.href=weatherURL();a.title='WetterOnline: '+(cityInput?.value.trim()||'Startseite')};
   cityInput?.addEventListener('input',sync,{passive:true});
   a.addEventListener('pointerdown',sync,{passive:true});a.addEventListener('focus',sync);
   sync();
 }

 // --- 3. Mobile grid: always three or more columns, row order rises upwards. ---
 const grid=$('quick-dials-grid');
 function columns(){const w=window.innerWidth;return w<440?3:w<600?4:w<750?5:6}
 let layoutPending=false,lastCount=-1,lastCols=0;
 function layoutLinks(forceBottom=false){
   if(!grid||!mobile())return;
   const visible=document.body.classList.contains('ivy-v15-links-open');
   const cols=columns(),tiles=[...grid.querySelectorAll(':scope > [data-id]')];
   const rows=Math.ceil(tiles.length/cols);
   grid.style.setProperty('--ivy-v23-columns',cols);
   // Spacer above newest row allows the topmost links to be pulled all the way
   // down to the same thumb-reachable area as the lowest row.
   const rowHeight=tiles[0]?.getBoundingClientRect().height||110;
   const height=grid.clientHeight||Math.max(220,window.innerHeight-115);
   const space=Math.max(60,Math.round(height-rowHeight-25));
   grid.style.setProperty('--ivy-v23-topspace',space+'px');
   tiles.forEach((tile,i)=>{
     const row=rows-1-Math.floor(i/cols);
     tile.style.setProperty('grid-row',String(row+2),'important');
     tile.style.setProperty('grid-column',String(i%cols+1),'important');
   });
   const add=$('add-dial-container');if(add){add.style.removeProperty('grid-row');add.style.removeProperty('grid-column')}
   // On each opening/reordering/resize return to the lowest row by default.
   if(visible&&(forceBottom||lastCount!==tiles.length||lastCols!==cols))
     requestAnimationFrame(()=>{grid.scrollTop=grid.scrollHeight-grid.clientHeight});
   lastCount=tiles.length;lastCols=cols;
 }
 function scheduleLinks(forceBottom=false){
   if(layoutPending)return;layoutPending=true;
   requestAnimationFrame(()=>{layoutPending=false;layoutLinks(forceBottom)});
 }
 if(grid){
   new MutationObserver(()=>scheduleLinks(true)).observe(grid,{childList:true});
   $('ivy-v15-links-launcher')?.addEventListener('click',()=>requestAnimationFrame(()=>scheduleLinks(true)));
   window.addEventListener('resize',()=>scheduleLinks(false),{passive:true});
   window.addEventListener('orientationchange',()=>setTimeout(()=>scheduleLinks(true),250),{passive:true});
   const originalOpen=window.ivyV15Links?.open;
   if(originalOpen){window.ivyV15Links.open=function(...args){const r=originalOpen.apply(this,args);requestAnimationFrame(()=>scheduleLinks(true));return r}}
   window.ivyV23Links={layout:()=>layoutLinks(true),columns};
 }
 function toggleMobileSettings(){
   const panel=$('ivy-v14-controls');if(!panel)return;
   for(const id of ['ivy-v14-linksWidth','ivy-v14-linksHeight']){
     const input=$(id);const label=panel.querySelector(`label[for="${id}"]`);
     for(const el of [input,label])if(el)el.classList.toggle('ivy-v23-mobile-hide',mobile());
   }
 }
 function begin(){scheduleLinks(true);toggleMobileSettings()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
 window.addEventListener('resize',toggleMobileSettings,{passive:true});
})();


;
/* from <script id="ivy-v27-runtime"> */

/* IVY V27: canonical responsive sizing, real sunrise/sunset, solar position, a single light surface. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+n)?+n:a));
const device=()=>matchMedia('(max-width:900px)').matches?'mobile':'desktop';
const selectedDevice=()=>window.ivyV20SelectedMode||device();
const SZ='ivyV20DeviceSizes';
let lastMode='', lastCity='', inLayout=false;
const defaults={profileSize:80,weatherSize:224,weatherHeight:284};
function getRecord(mode){try{return JSON.parse(localStorage.getItem(SZ)||'{}')[mode]||{}}catch(_){return {}}}
function dashboardSaved(){try{return JSON.parse(localStorage.getItem('dashboardSettings')||'{}')||{}}catch(_){return {}}}
function getSizes(mode){return {...defaults,weatherHeight:mode==='mobile'?178:284,...dashboardSaved(),...getRecord(mode)}}
function ensureHeader(){
 let header=$('ivy-v13-header');
 if(!header){header=document.createElement('div');header.id='ivy-v13-header';document.body.appendChild(header)}
 for(const id of ['weather-fixed-container','profile-fixed-container']){const el=$(id);if(el&&el.parentElement!==header)header.appendChild(el)}
 return header;
}
function layout(){
 if(inLayout)return;
 inLayout=true;
 try{
 const header=ensureHeader(),s=getSizes(device()),mobile=device()==='mobile';
 const width=innerWidth||document.documentElement.clientWidth;
 const height=innerHeight||document.documentElement.clientHeight;
 const pw=clamp(s.profileSize,44,144),ww=clamp(s.weatherSize,160,460);
 const wh=clamp(s.weatherHeight,175,540);
 const realW=Math.min(ww,Math.max(160,width-24));
 const profileReal=Math.min(pw,Math.max(44,width-24));
 const stacked=mobile&&realW+profileReal+60>width;
 const realH=mobile?Math.min(wh,Math.max(175,height-280-(stacked?profileReal+22:0))):wh;
 header.dataset.ivyStack=stacked?'yes':'no';
 if(mobile){
   header.style.setProperty('display','grid','important');
   header.style.setProperty('position','fixed','important');
   header.style.setProperty('inset','0px 0px auto 0px','important');
   header.style.setProperty('grid-template-columns',stacked?'minmax(0,1fr)':'minmax(0,1fr) auto','important');
   header.style.setProperty('grid-template-rows','auto','important');
   header.style.setProperty('gap','6px','important');
   header.style.setProperty('pointer-events','none','important');
 }else{for(const p of ['display','position','inset','grid-template-columns','grid-template-rows','gap'])header.style.removeProperty(p);}
 const manual=mobile&&document.body.classList.contains('manual-layout-mode');
 const holder=$('weather-fixed-container'), card=$('weather-card'), scene=$('ivy-weather-scene'), img=$('profile-image'), prof=$('profile-fixed-container');
 document.documentElement.style.setProperty('--ivy-v13-profile',pw+'px');
 document.documentElement.style.setProperty('--ivy-v13-weather',ww+'px');
 if(img){img.style.setProperty('width',profileReal+'px','important');img.style.setProperty('height',profileReal+'px','important');img.style.setProperty('max-width','none','important');img.style.setProperty('max-height','none','important')}
 if(prof){prof.style.setProperty('width',(profileReal+16)+'px','important');prof.style.setProperty('max-width','none','important');if(!manual){prof.style.setProperty('position','relative','important');prof.style.setProperty('inset','auto','important');prof.style.setProperty('transform','none','important')}}
 if(holder){holder.style.setProperty('width',realW+'px','important');holder.style.setProperty('max-width','none','important');holder.style.setProperty('flex','0 0 '+realW+'px','important');if(!manual){holder.style.setProperty('position','relative','important');holder.style.setProperty('inset','auto','important');holder.style.setProperty('transform','none','important')}}
 if(card){card.style.setProperty('width',realW+'px','important');card.style.setProperty('max-width','none','important');card.style.setProperty('height',realH+'px','important');card.style.setProperty('min-height','0','important');card.style.setProperty('box-sizing','border-box','important');card.style.setProperty('display','flex','important');card.style.setProperty('flex-direction','column','important');card.dataset.ivyCompact=realH<=209?'true':'false'}
 if(scene){scene.style.setProperty('flex','1 1 auto','important');scene.style.setProperty('height',Math.max(85,realH-49)+'px','important');scene.style.setProperty('min-height','0','important');scene.dataset.ivyCompact=realH<=209?'true':'false'}
 const city=$('weather-city-input');if(city)city.style.setProperty('flex','0 0 auto','important');
 // The band itself is measured; neither widget is reduced based on the other.
 requestAnimationFrame(()=>{
   const bottom=header.getBoundingClientRect().height;
   document.documentElement.style.setProperty('--ivy-v13-header-h',Math.ceil(bottom+4)+'px');
   requestAnimationFrame(repairMobileCollisions);
   window.ivyV27Light?.layoutCheck?.();
 });
 const controls=[['ivy-v13-profile-size','profileSize',pw],['ivy-v13-weather-size','weatherSize',ww],['ivy-v25-weather-height','weatherHeight',wh]];
 if(selectedDevice()===device())for(const [id,key,n] of controls){const el=$(id),lbl=$(id+'-label');if(el){el.min=id==='ivy-v13-profile-size'?'44':id==='ivy-v13-weather-size'?'160':'175';el.max=id==='ivy-v13-profile-size'?'144':id==='ivy-v13-weather-size'?'460':'540';if(document.activeElement!==el)el.value=String(n)}if(lbl)lbl.textContent=n+' px'}
 if(lastMode!==device())lastMode=device();
 }finally{inLayout=false;}
}
window.ivyV27Layout=layout;
const deg=Math.PI/180;
function normalize(v){return ((v%360)+360)%360;}
function repairMobileCollisions(){
 if(device()!=='mobile'||document.body.classList.contains('manual-layout-mode'))return;
 const header=$('ivy-v13-header'), weather=$('weather-fixed-container');
 const search=$('dashboard-container')?.firstElementChild?.querySelector(':scope > section:first-child');
 const launcher=$('ivy-v15-links-launcher');
 if(!search||!launcher||!weather||!header)return;
 let sr=search.getBoundingClientRect(); const headerBottom=header.getBoundingClientRect().bottom;
 if(sr.top<headerBottom+12){
   const top=Math.ceil(headerBottom+12);
   search.style.setProperty('top',top+'px','important');
   sr=search.getBoundingClientRect();
 }
 const lr=launcher.getBoundingClientRect(), gap=14;
 if(lr.top<sr.bottom+gap && !document.body.classList.contains('ivy-v15-links-open')){
   const desired=Math.max(sr.bottom+gap,lr.top);
   const limit=Math.max(12,innerHeight-lr.height-83);
   const next=Math.ceil(Math.min(desired,limit));
   launcher.style.setProperty('top',next+'px','important');
   document.documentElement.style.setProperty('--ivy18-launch-top',next+'px','important');
 }
}
window.ivyV27RepairMobile=repairMobileCollisions;
function solarPosition(lat,lon,nowMs){
 if(!Number.isFinite(+lat)||!Number.isFinite(+lon))return null;
 const jd=nowMs/86400000+2440587.5,n=jd-2451545;
 const M=normalize(357.528+.9856003*n)*deg;
 const L=normalize(280.46+.9856474*n)*deg;
 const ecl=L+(1.915*Math.sin(M)+.02*Math.sin(2*M))*deg;
 const eps=(23.439-.0000004*n)*deg;
 const ra=Math.atan2(Math.cos(eps)*Math.sin(ecl),Math.cos(ecl));
 const dec=Math.asin(Math.sin(eps)*Math.sin(ecl));
 const gmst=normalize(280.46061837+360.98564736629*(jd-2451545));
 const ha=normalize(gmst+(+lon)-ra/deg)*deg;
 const phi=(+lat)*deg;
 const altitude=Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(ha))/deg;
 const azimuth=normalize(Math.atan2(Math.sin(ha),Math.cos(ha)*Math.sin(phi)-Math.tan(dec)*Math.cos(phi))/deg+180);
 return {altitude,azimuth};
}
// Open-Meteo's sunrise/sunset ISO strings have local clock time without UTC offset.
function weatherEpoch(iso,utcOffsetSeconds){
 if(!iso||!/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(iso))return NaN;
 const [date,time]=iso.split('T'); const d=date.split('-').map(Number),t=time.split(':').map(Number);
 return Date.UTC(d[0],d[1]-1,d[2],t[0],t[1],t[2]||0)-Number(utcOffsetSeconds||0)*1000;
}
function readableTime(iso){return typeof iso==='string'&&iso.includes('T')?iso.split('T')[1].slice(0,5):'--:--'}
function conditions(code,isDay,wind){
 code=Number(code);wind=Number(wind)||0;
 if([95,96,99].includes(code))return ['storm','Gewitter'];
 if([56,57,66,67].includes(code))return ['sleet','Gefrierender Regen'];
 if([71,73,75,77,85,86].includes(code))return ['snow','Schneefall'];
 if([80,81,82].includes(code))return ['showers','Regenschauer'];
 if([61,63,65].includes(code))return ['rain','Regen'];
 if([51,53,55].includes(code))return ['drizzle','Nieselregen'];
 if([45,48].includes(code))return ['fog','Nebel'];
 if(code===3)return ['cloudy','Bedeckt'];
 if(code===1||code===2)return ['partly','Teilweise bewölkt'];
 if(code===0&&wind>=30)return ['wind','Windig'];
 return ['clear',isDay?'Klarer Himmel':'Klare Nacht'];
}
function moonPhase(nowMs){ // visual approximation of lunar phase, not exact moon ephemerides
 const ref=Date.UTC(2000,0,6,18,14),synodic=29.530588853;
 return (((nowMs-ref)/86400000)/synodic%1+1)%1;
}
function getCachedSnapshot(){try{return JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){return null}}
function makeLayers(){
 const scene=$('ivy-weather-scene');if(!scene)return;
 const data=scene.querySelector('.ivy-weather-data');if(!data)return;
 ['ivy-weather-grid','ivy-weather-aurora','ivy-weather-haze','ivy-weather-snow','ivy-weather-lightning','ivy-v27-wind','ivy-v27-moonshade','ivy-v27-sunrays'].forEach(cls=>{
  if(scene.querySelector('.'+cls))return;
  const el=document.createElement('div');el.className=cls;el.setAttribute('aria-hidden','true');scene.insertBefore(el,data)
 });
 if(!$('ivy-v27-sun-times')){
  const el=document.createElement('div');el.id='ivy-v27-sun-times';el.innerHTML='<span id="ivy-v27-sunrise">↑ --:--</span><span id="ivy-v27-sunset">↓ --:--</span>';
  data.appendChild(el);
 }
 const status=$('ivy-weather-status');if(status){status.textContent='';status.style.display='none'}
}
let snapshot=null;
function render(snapshotInput,live=false){
 const scene=$('ivy-weather-scene');if(!scene)return;
 makeLayers();
 if(snapshotInput)snapshot=snapshotInput;
 const s=snapshot||getCachedSnapshot();if(!s||!s.current)return;
 const c=s.current;
 const now=Date.now(), sunrise=s.daily?.sunrise?.[0],sunset=s.daily?.sunset?.[0];
 const sunriseMs=weatherEpoch(sunrise,s.utc_offset_seconds),sunsetMs=weatherEpoch(sunset,s.utc_offset_seconds);
 const sun=solarPosition(s.latitude,s.longitude,now);
 const dayFlag=Number(c.is_day)===1;
 const solarAlt=sun?.altitude;
 let phase='night';
 if(Number.isFinite(solarAlt)){
   if(solarAlt>=8)phase='day';
   else if(solarAlt>=-6){const midday=(sunriseMs+sunsetMs)/2;phase=now<midday?'dawn':'dusk'}
 }else if(Number.isFinite(sunriseMs)&&Number.isFinite(sunsetMs)){
   if(now>=sunriseMs&&now<=sunsetMs){const ratio=(now-sunriseMs)/(sunsetMs-sunriseMs);phase=ratio<.12?'dawn':ratio>.88?'dusk':'day'}
 }else{phase=dayFlag?'day':'night'}
 // Provider's current is_day can correct a twilight classification when solar inputs are unavailable.
 const [mode,description]=conditions(c.weather_code,phase!=='night',c.wind_speed_10m);
 scene.dataset.phase=phase;scene.dataset.weather=mode;scene.dataset.mode=mode;
 const windy=Number(c.wind_speed_10m)>=25||mode==='wind';
 scene.dataset.windy=windy?'true':'false';
 const windSpeed=clamp(c.wind_speed_10m,0,115);
 scene.style.setProperty('--ivy-weather-wind-speed',(Math.max(2,13-windSpeed*.12)).toFixed(1)+'s');
 let progress=.5;
 if(Number.isFinite(sunriseMs)&&Number.isFinite(sunsetMs)&&sunsetMs>sunriseMs){progress=clamp((now-sunriseMs)/(sunsetMs-sunriseMs),0,1)}
 const x=12+76*progress;
 const y=phase==='night'?22:clamp(78-(sun?.altitude??40)*1.08,13,77);
 scene.style.setProperty('--ivy-sun-x',x.toFixed(2)+'%');
 scene.style.setProperty('--ivy-sun-y',y.toFixed(2)+'%');
 const moonShade=scene.querySelector('.ivy-v27-moonshade');if(moonShade){const moon=moonPhase(now);moonShade.style.setProperty('--ivy-moon-shift',(Math.cos(moon*Math.PI*2)*30).toFixed(0)+'px')}
 const city=$('ivy-weather-city'),temp=$('ivy-weather-temp'),cond=$('ivy-weather-condition'),stats=$('ivy-weather-stats');
 if(city)city.textContent=s.city||'Wetter';
 if(temp)temp.textContent=Number.isFinite(+c.temperature_2m)?Math.round(c.temperature_2m)+'°':'--°';
 if(cond)cond.textContent=description;
 const humidity=Number.isFinite(+c.relative_humidity_2m)?Math.round(c.relative_humidity_2m)+'%':'--';
 const wind=Number.isFinite(+c.wind_speed_10m)?Math.round(c.wind_speed_10m)+' km/h':'--';
 const bearing=Number(c.wind_direction_10m), dir=Number.isFinite(bearing)?' '+['N','NO','O','SO','S','SW','W','NW'][Math.round(normalize(bearing)/45)%8]:'';
 if(stats)stats.textContent='Feuchte '+humidity+'  ·  Wind '+wind+dir;
 const sr=$('ivy-v27-sunrise'),ss=$('ivy-v27-sunset');if(sr)sr.textContent='↑ '+readableTime(sunrise);if(ss)ss.textContent='↓ '+readableTime(sunset);
 const status=$('ivy-weather-status');if(status){status.textContent='';status.style.display='none'}
 window.dispatchEvent(new CustomEvent('ivy-weather-snapshot',{detail:s}));
}
window.ivyV27Weather={renderSnapshot:render,refresh:()=>render(null,true),solarPosition,weatherEpoch,conditions};
function installLight(){
 let el=$('ivy-v27-light');if(el)return;
 el=document.createElement('div');el.id='ivy-v27-light';el.setAttribute('aria-hidden','true');
 el.innerHTML=`<button id="ivy-v27-light-close" type="button">✕ Schließen</button>
 <div id="ivy-v27-light-panel"><h3>IVY · LICHTMODUS</h3>
 <label for="ivy-v27-brightness">Helligkeit <output id="ivy-v27-brightness-value">100 %</output></label>
 <input id="ivy-v27-brightness" type="range" min="0" max="100" step="1" value="100" />
 <label for="ivy-v27-warmth">Farbtemperatur <output id="ivy-v27-warmth-value">0 %</output></label>
 <input id="ivy-v27-warmth" type="range" min="0" max="100" step="1" value="0" />
 <small>0 % = Schwarz · 50 % = Grau · 100 % = Weiß (bei neutraler Farbtemperatur)</small></div>`;
 document.body.appendChild(el);
 const brightness=$('ivy-v27-brightness'),warmth=$('ivy-v27-warmth');
 function paint(){
  const b=clamp(brightness.value,0,100)/100,w=clamp(warmth.value,0,100)/100;
  const rgb=[255,255-75*w,255-165*w].map(n=>Math.round(b*n));
  const color=`rgb(${rgb.join(', ')})`;
  el.style.setProperty('background',color,'important');el.style.setProperty('background-color',color,'important');
  el.dataset.brightness=String(Math.round(b*100));
  $('ivy-v27-brightness-value').textContent=Math.round(b*100)+' %';
  $('ivy-v27-warmth-value').textContent=Math.round(w*100)+' %';
 }
 function touchRange(range){
  // Pointer capture works around mobile WebView range-gesture / scroll hijacking.
  const applyPointer=e=>{
   const rect=range.getBoundingClientRect();if(rect.width<=0)return;
   const thumbPad=Math.min(16,Math.max(9,rect.height*.28));
   const fraction=(e.clientX-rect.left-thumbPad)/Math.max(1,rect.width-thumbPad*2);
   range.value=String(Math.round(clamp(fraction,0,1)*100));
   range.dispatchEvent(new Event('input',{bubbles:true}));
  };
  range.addEventListener('pointerdown',e=>{if(e.isPrimary===false)return;range.setPointerCapture?.(e.pointerId);applyPointer(e);},{passive:true});
  range.addEventListener('pointermove',e=>{if(range.hasPointerCapture?.(e.pointerId))applyPointer(e)},{passive:true});
 }
 for(const input of [brightness,warmth]){input.addEventListener('input',paint,{passive:true});input.addEventListener('change',paint,{passive:true});touchRange(input)}
 function toggle(force){
  const open=typeof force==='boolean'?force:!el.classList.contains('ivy-open');
  $('ivy-v23-light')?.classList.remove('ivy-open');$('ivy-v13-light')?.classList.remove('ivy-open');$('light-mode-overlay')?.classList.add('hidden');
  el.classList.toggle('ivy-open',open);el.setAttribute('aria-hidden',String(!open));
  document.body.classList.toggle('ivy-light-active',open);
  if(open){paint(); $('ivy-v27-light-close').focus({preventScroll:true})}
  return open;
 }
 $('ivy-v27-light-close').addEventListener('click',()=>toggle(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&el.classList.contains('ivy-open')){e.preventDefault();toggle(false)}},true);
 window.toggleLightMode=toggle;window.updateLightSource=paint;
 window.ivyV27Light={toggle,paint,layoutCheck:()=>null,getColor:()=>getComputedStyle(el).backgroundColor};
 paint();
}
function updateWeather(){const city=$('weather-city-input')?.value.trim()||localStorage.getItem('weatherCity')||'';if(city&&typeof window.ivyRefreshWeather==='function')window.ivyRefreshWeather(city)}
function boot(){
 ensureHeader();makeLayers();installLight();layout();
 const old=getCachedSnapshot();if(old)render(old);
 let raf=0;
 const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(layout)};
 window.addEventListener('resize',schedule,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(schedule,250),{passive:true});
 document.addEventListener('input',e=>{if(['ivy-v13-weather-size','ivy-v13-profile-size','ivy-v25-weather-height'].includes(e.target?.id))schedule()},true);
 for(const id of ['ivy-v13-profile-size','ivy-v13-weather-size','ivy-v25-weather-height']){
  const input=$(id);if(input)input.addEventListener('input',()=>schedule(),{passive:true});
 }
 const city=$('weather-city-input');city?.addEventListener('change',()=>setTimeout(schedule,0));
 const searchNode=$('dashboard-container')?.firstElementChild?.querySelector(':scope > section:first-child');
 const launcherNode=$('ivy-v15-links-launcher');
 if(searchNode&&launcherNode){
   let collisionFrame=0;
   const observer=new MutationObserver(()=>{cancelAnimationFrame(collisionFrame);collisionFrame=requestAnimationFrame(repairMobileCollisions)});
   observer.observe(searchNode,{attributes:true,attributeFilter:['style']});
   observer.observe(launcherNode,{attributes:true,attributeFilter:['style']});
 }
 setTimeout(repairMobileCollisions,300);
 setTimeout(repairMobileCollisions,850);
 const oldV18Refresh=window.ivyV18?.refresh;
 if(typeof oldV18Refresh==='function'){window.ivyV18.refresh=function(...args){const r=oldV18Refresh.apply(this,args);setTimeout(repairMobileCollisions,60);return r};}
 const prevRefresh=window.ivyV20RefreshSizes; if(typeof prevRefresh==='function')window.ivyV20RefreshSizes=function(...args){const ret=prevRefresh.apply(this,args);schedule();return ret};
 const prevSizeUpdate=window.ivyV13UpdateSizeControls;if(typeof prevSizeUpdate==='function')window.ivyV13UpdateSizeControls=function(...args){const ret=prevSizeUpdate.apply(this,args);schedule();return ret};
 // Refresh solar location/time every minute without extra network calls.
 setInterval(()=>{render();schedule()},60000);
 // Cache remains usable offline; while online, data refreshes at a reasonable cadence.
 setInterval(()=>{if(navigator.onLine)updateWeather()},15*60*1000);
 window.addEventListener('online',()=>updateWeather(),{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();if(Date.now()-(getCachedSnapshot()?.savedAt||0)>10*60*1000)updateWeather()}},{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


;
/* from <script id="ivy-sci-fi-weather-v28-script"> */

(() => {
 function setup(){
   const scene=document.getElementById('ivy-weather-scene');
   if(!scene||scene.dataset.ivy28Ready)return;
   scene.dataset.ivy28Ready='true';
   let snow=scene.querySelector('.ivy-weather-snow');
   if(!snow){snow=document.createElement('div');snow.className='ivy-weather-snow';snow.setAttribute('aria-hidden','true');scene.insertBefore(snow,scene.querySelector('.ivy-weather-data'));}
   // Fixed varied positions make the weather look natural without frequent DOM work.
   for(let i=0;i<19;i++){
     const flake=document.createElement('span');flake.className='ivy28-flake';flake.textContent=i%3===0?'✳':'❄';
     flake.style.setProperty('--fx',(((i*47+13)%97)+1)+'%');
     flake.style.setProperty('--fs',(i%4===0?11:i%3===0?8:6)+'px');
     flake.style.setProperty('--fo',(0.40+(i%5)*.12).toFixed(2));
     flake.style.setProperty('--ft',(6+(i%6)*.83).toFixed(2)+'s');
     flake.style.setProperty('--fd',(-((i*23)%78)/10).toFixed(1)+'s');
     flake.style.setProperty('--drift',((i%2?-1:1)*(12+i%5*7))+'px');
     flake.setAttribute('aria-hidden','true');snow.appendChild(flake);
   }
   let lightning=scene.querySelector('.ivy-weather-lightning');
   if(!lightning){lightning=document.createElement('div');lightning.className='ivy-weather-lightning';lightning.setAttribute('aria-hidden','true');scene.insertBefore(lightning,scene.querySelector('.ivy-weather-data'));}
   if(!lightning.querySelector('.ivy28-bolt')){
     const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
     svg.setAttribute('class','ivy28-bolt');svg.setAttribute('viewBox','0 0 100 160');svg.setAttribute('aria-hidden','true');
     const path=document.createElementNS('http://www.w3.org/2000/svg','path');
     path.setAttribute('d','M64 2 L28 67 L51 66 L20 150 L88 53 L60 57 L82 5 Z');
     path.setAttribute('fill','#e2f8ff');path.setAttribute('stroke','#8bd9ff');path.setAttribute('stroke-width','1.2');
     svg.appendChild(path);lightning.appendChild(svg);
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();

;
/* from <script id="ivy-update-monitor-v37"> */

(()=>{
 'use strict';
 if(!/^https?:$/.test(location.protocol))return;
 const popup=document.getElementById('ivy-update-popup');if(!popup)return;
 // Generate a SHA-256 digest of this packaged HTML with this signature set to zeros.
 // A different deployed HTML version shows a popup but never changes cached content.
 const CLIENT_SIGNATURE='fefc083b1661f26db69efc3fc6b3b2269e0e6332bf60167845714fbaf0122cbf';
 const CURRENT_BUILD=document.querySelector('meta[name="ivy-build"]')?.content||'';
 const later=document.getElementById('ivy-update-later');
 const apply=document.getElementById('ivy-update-apply');
 const description=popup.querySelector('.ivy-update-description');
 const INITIAL_DESCRIPTION=description.textContent;
 const pendingKey='ivy.dashboard.pendingUpdate';
 let busy=false,checking=false,availableHash='',dismissedHash='',lastCheck=0;
 const here=new URL(location.href);
 if(here.searchParams.has('ivy_refresh')){
   here.searchParams.delete('ivy_refresh');
   history.replaceState(history.state,'',here.href);
 }
 try{if(sessionStorage.getItem(pendingKey)===CLIENT_SIGNATURE)sessionStorage.removeItem(pendingKey)}catch(_){}
 function show(hash,remoteBuild){
   if(!hash||hash===CLIENT_SIGNATURE||hash===dismissedHash||busy)return;
   availableHash=hash;
   description.textContent=remoteBuild&&remoteBuild!==CURRENT_BUILD
     ?'Version '+remoteBuild+' ist verfügbar. Jetzt installieren?'
     :INITIAL_DESCRIPTION;
   popup.hidden=false;
 }
 later?.addEventListener('click',()=>{dismissedHash=availableHash;popup.hidden=true});
 async function hashHTML(html){
   const normalized=html.replace(/const CLIENT_SIGNATURE='[a-f0-9]{64}';/,
     "const CLIENT_SIGNATURE='"+'0'.repeat(64)+"';");
   const bytes=new TextEncoder().encode(normalized);
   const digest=await crypto.subtle.digest('SHA-256',bytes);
   return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 }
 function message(worker,data,timeout=6000){
   return new Promise((resolve,reject)=>{
     if(!worker){reject(new Error('Service Worker nicht erreichbar'));return;}
     const channel=new MessageChannel();
     const timer=setTimeout(()=>{channel.port1.close();reject(new Error('Service Worker antwortet nicht'))},timeout);
     channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data)};
     try{worker.postMessage(data,[channel.port2])}
     catch(err){clearTimeout(timer);channel.port1.close();reject(err)}
   });
 }
 async function getRegistration(){
   if(!('serviceWorker' in navigator))throw new Error('Offline-Cache wird hier nicht unterstützt');
   return await navigator.serviceWorker.getRegistration('./')||
     await navigator.serviceWorker.register('./sw.js',{scope:'./'});
 }
 // V35 could have served V36 HTML from the network while its OLD worker is
 // still active. Activate a waiting worker ONLY if its cached HTML has exactly
 // the same fingerprint as the HTML that is already on screen.
 async function adoptMatchingWorker(reg){
   if(!reg?.waiting||busy)return false;
   try{
     const result=await message(reg.waiting,{type:'IVY_DASHBOARD_GET_BUILD'});
     if(result?.hash!==CLIENT_SIGNATURE)return false;
     await message(reg.waiting,{type:'IVY_DASHBOARD_ACTIVATE_UPDATE'});
     return true;
   }catch(_){return false}
 }
 async function watchRegistration(){
   try{
     const reg=await getRegistration();
     await adoptMatchingWorker(reg);
     const observe=installing=>{
       if(!installing)return;
       if(installing.state==='installed'){adoptMatchingWorker(reg);return;}
       installing.addEventListener('statechange',()=>{
         if(installing.state==='installed')adoptMatchingWorker(reg);
       });
     };
     // A registration may already be installing when this listener attaches.
     observe(reg.installing);
     reg.addEventListener('updatefound',()=>observe(reg.installing));
   }catch(_){}
 }
 function controllerChange(timeout=7000){
   return new Promise(resolve=>{
     if(!('serviceWorker' in navigator)){resolve(false);return}
     let done=false;
     const complete=value=>{if(done)return;done=true;clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',listener);resolve(value)};
     const listener=()=>complete(true);
     navigator.serviceWorker.addEventListener('controllerchange',listener);
     const timer=setTimeout(()=>complete(false),timeout);
   });
 }
 async function applyUpdate(){
   if(busy||!availableHash)return;
   busy=true;apply.disabled=true;later.disabled=true;
   description.textContent='Update wird im Offline-Cache installiert …';
   const targetHash=availableHash;
   try{
     const reg=await getRegistration();
     // A new service worker may already have downloaded the new full shell.
     // If not, request a worker update now, without blocking normal visits.
     if(!reg.waiting)try{await reg.update()}catch(_){}
     if(!reg.waiting){
       const deadline=Date.now()+12000;
       while(!reg.waiting&&Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,220));}
     }
     if(reg.waiting){
       const installed=await message(reg.waiting,{type:'IVY_DASHBOARD_GET_BUILD'});
       if(installed?.hash!==targetHash)
         throw new Error('Service Worker und Dashboard-Version stimmen nicht überein; bitte erneut prüfen');
       if(installed?.hash===targetHash){
         const changed=controllerChange();
         const activated=await message(reg.waiting,{type:'IVY_DASHBOARD_ACTIVATE_UPDATE'});
         if(!activated?.ok)throw new Error('Neue Version konnte nicht aktiviert werden');
         if(!await changed && navigator.serviceWorker.controller!==reg.active)
           throw new Error('Service Worker wurde nicht aktiviert');
         try{sessionStorage.setItem(pendingKey,targetHash)}catch(_){}
         location.reload();return;
       }
     }
     // In V38 an update is an all-or-nothing app shell, not an HTML-only hot swap.
     throw new Error('Update-Dateien noch nicht vollständig verfügbar. Bitte erneut prüfen.');
   }catch(err){
     busy=false;apply.disabled=false;later.disabled=false;
     description.textContent='Update nicht übernommen: '+String(err.message||err)+'. Bitte erneut versuchen.';
     popup.hidden=false;
   }
 }
 apply?.addEventListener('click',applyUpdate);
 function status(message){const target=document.getElementById('ivy-v37-update-status');if(target)target.textContent=message;}
 async function check(force=false,manual=false){
   if(manual){dismissedHash='';status('Suche nach Updates …');}
   if(checking||busy){if(manual)status('Eine Prüfung läuft bereits.');return;}
   if(document.hidden){if(manual)status('Bitte das Dashboard im Vordergrund öffnen.');return;}
   if(!navigator.onLine){if(manual)status('Offline – die gespeicherte Version bleibt nutzbar.');return;}
   if(!force&&Date.now()-lastCheck<60000)return;
   checking=true;
   const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
   try{
     // Cache busting is ONLY for this background update probe; page navigation
     // is always cache-first. The old V34/V35 workers cannot intercept this URL.
     const url=new URL('./version.json',location.href);
     url.searchParams.set('ivy_update_probe',String(Date.now()));
     const response=await fetch(url.href,{cache:'no-store',signal:abort.signal});
     if(!response.ok){if(manual)status('Versionsdatei nicht erreichbar.');return;}
     const metadata=await response.json();
     const remoteHash=String(metadata.hash||'');
     const remoteBuild=String(metadata.build||'');
     if(!/^[a-f0-9]{64}$/.test(remoteHash)){if(manual)status('Ungültige Versionsdatei.');return;}
     if(remoteHash===CLIENT_SIGNATURE){popup.hidden=true;availableHash='';if(manual)status('Alles aktuell – Version V41 ist installiert..');return;}
     show(remoteHash,remoteBuild);if(manual)status('Neue Version gefunden – im Popup installieren.');
   }catch(err){if(manual)status('Keine Verbindung zum Updateserver – offline weiter nutzbar.');if(err?.name!=='AbortError')console.debug('IVY Updateprüfung:',err)}
   finally{clearTimeout(timer);lastCheck=Date.now();checking=false}
 }
 window.addEventListener('load',()=>{
   watchRegistration();
   // Allow cached layout and cached weather to render before any update probe.
   setTimeout(()=>check(true),4500);
   setInterval(()=>check(false),5*60*1000);
 });
 window.addEventListener('online',()=>check(true));
 window.addEventListener('pageshow',e=>{if(e.persisted)check(true)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check(false)});
 window.ivyUpdateMonitor={check:()=>check(true),checkManual:()=>check(true,true),version:41};
})();

;
/* from <script id="ivy-weather-v30-astronomy"> */

(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const rad=Math.PI/180;
 function norm(x){return (x%360+360)%360}
 function moonPosition(lat,lon,now){
  // Low-precision lunar ephemeris: ecliptic longitude/latitude -> RA/declination -> horizontal coordinates.
  const jd=now/86400000+2440587.5,d=jd-2451545;
  const L=(218.316+13.176396*d)*rad,M=(134.963+13.064993*d)*rad,F=(93.272+13.229350*d)*rad;
  const l=L+6.289*rad*Math.sin(M),b=5.128*rad*Math.sin(F),e=(23.4397-.0000004*d)*rad;
  const ra=Math.atan2(Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e),Math.cos(l));
  const dec=Math.asin(Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l));
  const gmst=norm(280.46061837+360.98564736629*(jd-2451545));
  const ha=norm(gmst+lon-ra/rad)*rad,phi=lat*rad;
  const alt=Math.asin(Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(ha))/rad;
  const az=norm(Math.atan2(Math.sin(ha),Math.cos(ha)*Math.sin(phi)-Math.tan(dec)*Math.cos(phi))/rad+180);
  return {altitude:alt,azimuth:az};
 }
 function moonPhase(t){return (((t-Date.UTC(2000,0,6,18,14))/(86400000*29.530588853))%1+1)%1}
 function moonLitPath(k){
  const R=21,C=24,n=50,left=[],right=[];
  for(let i=0;i<=n;i++){
   const y=-R+2*R*i/n,edge=Math.sqrt(Math.max(0,R*R-y*y));
   if(k<=.5){left.push([C+(1-4*k)*edge,C+y]);right.push([C+edge,C+y]);}
   else{left.push([C-edge,C+y]);right.push([C+(4*k-3)*edge,C+y]);}
  }
  const ps=[...right,...left.reverse()];
  return 'M'+ps.map(([x,y])=>x.toFixed(2)+' '+y.toFixed(2)).join('L')+'Z';
 }
 const CLOUDS=[
  'M4 70 C8 59 21 55 33 57 C34 43 44 34 56 36 C65 21 78 20 90 28 C99 16 116 22 121 34 C138 28 151 39 153 51 C165 50 177 60 178 70 C176 81 163 84 150 83 L29 82 C15 81 7 79 4 70Z',
  'M6 70 C12 60 23 58 34 59 C35 48 46 43 56 46 C65 29 79 27 91 37 C101 32 113 36 119 45 C128 42 138 48 140 57 C156 52 169 59 172 70 C170 78 160 82 146 82 L30 81 C15 80 7 77 6 70Z',
  'M7 72 C12 63 24 60 36 61 C37 53 47 47 59 48 C70 37 84 39 93 45 C105 38 120 44 125 55 C144 50 158 60 162 69 C165 80 150 84 137 83 L32 82 C19 82 10 78 7 72Z'
 ];
 function cloudSvg(index){
  const id='ivy30cloudgrad'+index;
  return `<svg viewBox="0 0 184 102" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2=".20" y2="1"><stop offset="0" stop-color="#e3f5ff" stop-opacity=".89"/><stop offset=".45" stop-color="#c5dff7" stop-opacity=".74"/><stop offset="1" stop-color="#648caf" stop-opacity=".24"/></linearGradient></defs><path d="${CLOUDS[index]}" fill="url(#${id})"/><path class="c-edge" d="M22 65 Q39 60 52 62 M82 42 Q102 36 117 51 M132 65 Q147 62 158 70" fill="none" stroke="#f1fcff" stroke-opacity=".24" stroke-width="1.2" stroke-linecap="round"/></svg>`;
 }
 function skyCoordinates(pos){
  // 2D southern-sky projection: east on the left, west on the right.
  const a=pos.azimuth*rad,alt=pos.altitude;
  return {x:Math.max(7,Math.min(93,50-43*Math.sin(a))),y:Math.max(10,Math.min(88,85-76*Math.sin(Math.min(90,Math.max(0,alt))*rad)))};
 }
 function init(){
  const scene=$('ivy-weather-scene');if(!scene||scene.dataset.ivy30Ready)return;
  scene.dataset.ivy30Ready='1';
  const data=scene.querySelector('.ivy-weather-data');if(!data)return;
  const bodies=document.createElement('div');bodies.className='ivy30-sky-body';bodies.setAttribute('aria-hidden','true');
  const sun=document.createElement('div');sun.className='ivy30-orb ivy30-sun';sun.setAttribute('aria-hidden','true');
  const moon=document.createElement('div');moon.className='ivy30-orb ivy30-moon';moon.setAttribute('aria-hidden','true');
  moon.innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="ivy30moonlight" x1=".18" y1=".18" x2=".9" y2="1"><stop offset="0" stop-color="#fbfdff"/><stop offset=".52" stop-color="#d5e8ff"/><stop offset="1" stop-color="#94b2e7"/></linearGradient></defs><path class="ivy30-lit" fill="url(#ivy30moonlight)"/></svg>';
  bodies.append(sun,moon);scene.insertBefore(bodies,data);
  const field=document.createElement('div');field.className='ivy30-cloud-field';field.setAttribute('aria-hidden','true');
  CLOUDS.forEach((_,i)=>{const div=document.createElement('div');div.className='ivy30-cloud c'+(i+1);div.innerHTML=cloudSvg(i);field.append(div)});
  scene.insertBefore(field,data);
  function update(){
   let cache=null;try{cache=JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){}
   if(!cache||!Number.isFinite(Number(cache.latitude))||!Number.isFinite(Number(cache.longitude))){sun.style.opacity='0';moon.style.opacity='0';return}
   const now=Date.now(),lat=Number(cache.latitude),lon=Number(cache.longitude);
   const sunPos=window.ivyV27Weather?.solarPosition?.(lat,lon,now),moonPos=moonPosition(lat,lon,now);
   const weather=scene.dataset.weather||'clear';
   const cloudOcclusion={clear:1,partly:.90,cloudy:.27,rain:.13,showers:.13,drizzle:.36,snow:.24,sleet:.20,storm:.08,fog:.14}[weather]??.84;
   function move(el,pos){if(!pos||pos.altitude<=0){el.style.opacity='0';return false}const c=skyCoordinates(pos);el.style.left=c.x+'%';el.style.top=c.y+'%';el.style.opacity=String(cloudOcclusion);return true}
   move(sun,sunPos);
   move(moon,moonPos);
   const k=moonPhase(now);moon.querySelector('.ivy30-lit').setAttribute('d',moonLitPath(k));
  }
  update();setInterval(update,60*1000);
  const old=window.ivyV27Weather?.renderSnapshot;
  if(typeof old==='function')window.ivyV27Weather.renderSnapshot=function(...args){const r=old.apply(this,args);update();return r};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()},{passive:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

;
/* from <script id="ivy-v37-settings"> */

(()=>{
'use strict';
const $=id=>document.getElementById(id);
const key='ivyDashboardSettingsOpenV37';
const labels={'Design & Farben':'Farben & Darstellung','Suchfeld, Glow & Suchmaschinenmenü':'Suchfeld & Effekte','Hintergründe & Ränder':'Hintergründe & Rahmen','Wetter':'Wetter & Standort','Größen & Layout':'Größen & Geräteprofile','Suche & Verhalten':'Suche & Bedienung'};
let groups=[],searching=false,saved={};
function read(){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){return {}}}
function persist(){if(searching)return;try{localStorage.setItem(key,JSON.stringify(saved))}catch(_){}}
function addGroup(parent,id,label){const details=document.createElement('details');details.className='ivy-v37-group';details.id='ivy-v37-group-'+id;const summary=document.createElement('summary');summary.textContent=label;const content=document.createElement('div');content.className='ivy-v37-content';details.append(summary,content);parent.append(details);details.open=saved[id]??(id==='colors');details.addEventListener('toggle',()=>{if(searching)return;saved[id]=details.open;persist()});groups.push(details);return content;}
function setOpen(value){for(const details of groups){details.open=value;saved[details.id.replace('ivy-v37-group-','')]=value}persist();}
function init(){const modal=$('settings-modal');const outer=modal?.firstElementChild,section=outer?.querySelector(':scope > .space-y-4');if(!section||outer.querySelector('.ivy-v37-toolbar'))return;
 saved=read();section.style.display='block';section.classList.remove('space-y-4');
 const title=outer.querySelector(':scope > h3');if(title)title.classList.add('ivy-v37-title');
 const toolbar=document.createElement('div');toolbar.className='ivy-v37-toolbar';toolbar.innerHTML='<div class="ivy-v37-toolbar-header"><strong>IVY · Einstellungen</strong><div class="ivy-v37-tools"><button type="button" id="ivy-v37-open-all">Alle öffnen</button><button type="button" id="ivy-v37-close-all">Alle schließen</button></div></div><input id="ivy-v37-settings-search" type="search" placeholder="Einstellungen suchen …" aria-label="Einstellungen durchsuchen" autocomplete="off"><span class="ivy-v37-update-status" id="ivy-v37-search-result" aria-live="polite"></span>';
 section.before(toolbar);if(title)title.style.display='none';
 let target=null,footer=null,index=0;
 for(const node of [...section.children]){
  if(node.matches('h4')){const original=node.textContent.trim();const label=labels[original]||original;const id=['colors','searchfx','borders','weather','sizes','behavior'][index++]||'section-'+index;target=addGroup(section,id,label);node.remove();continue}
  if(node.classList.contains('mt-6')&&node.classList.contains('border-t')){footer=node;continue}
  if(target)target.append(node);
 }
 // V20 deliberately hid obsolete size controls; keep them in DOM for old save callbacks.
 for(const id of ['setting-weather-width','setting-profile-size','setting-quickdial-size']){
  const el=$(id);if(el){const row=el.closest('div.flex')||el.parentElement;row?.classList.add('ivy-v37-hidden-row')}
 }
 const updates=addGroup(section,'updates','Updates & Offline');
 updates.innerHTML='<p class="ivy-v37-help">Die App startet weiterhin direkt aus dem Offline-Cache. Die Prüfung lädt nur im Hintergrund eine Versionsinformation; erst nach deiner Bestätigung wird der Cache aktualisiert.</p><div style="display:flex;flex-wrap:wrap;align-items:center;gap:9px"><button id="ivy-v37-check-update" type="button" class="ivy-v37-update-button">↻ Jetzt nach Updates suchen</button><small>Installiert: V40</small></div><output id="ivy-v37-update-status" role="status" aria-live="polite" class="ivy-v37-update-status">Automatische Prüfung im Hintergrund aktiviert.</output><button id="ivy-v37-weather-refresh" type="button" class="ivy-v37-update-button">☁ Wetter jetzt aktualisieren</button><p class="ivy-v37-help">Persönliche Daten bleiben im Browser gespeichert. Nur „Alle Daten löschen“ entfernt Einstellungen und Links.</p>';
 $('ivy-v37-check-update')?.addEventListener('click',()=>{const m=window.ivyUpdateMonitor;if(m?.checkManual)m.checkManual();else $('ivy-v37-update-status').textContent='Updateprüfung ist noch nicht bereit.'});
 $('ivy-v37-weather-refresh')?.addEventListener('click',()=>{const city=$('weather-city-input')?.value.trim()||localStorage.getItem('weatherCity');const status=$('ivy-v37-update-status');if(!city){status.textContent='Bitte zuerst einen Wetterstandort festlegen.';return}if(!navigator.onLine){status.textContent='Offline – zuletzt gespeicherte Wetterdaten bleiben sichtbar.';return}if(typeof window.ivyRefreshWeather==='function'){window.ivyRefreshWeather(city);status.textContent='Wetteraktualisierung gestartet.'}});
 if(footer){footer.classList.add('ivy-v37-footer');section.append(footer)}
 $('ivy-v37-open-all').addEventListener('click',()=>setOpen(true));$('ivy-v37-close-all').addEventListener('click',()=>setOpen(false));
 const filter=$('ivy-v37-settings-search'),result=$('ivy-v37-search-result');
 filter.addEventListener('input',()=>{const query=filter.value.trim().toLocaleLowerCase('de');searching=!!query;let visible=0;for(const d of groups){if(!query){d.hidden=false;d.open=saved[d.id.replace('ivy-v37-group-','')]??(d.id==='ivy-v37-group-colors');visible++;continue}const found=d.textContent.toLocaleLowerCase('de').includes(query);d.hidden=!found;if(found){d.open=true;visible++}}result.textContent=query?visible+' passende Bereiche':'';});
 modal.addEventListener('click',e=>{if(e.target===modal)window.cancelSettings?.()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden')&&document.activeElement===filter){filter.value='';filter.dispatchEvent(new Event('input'));e.stopPropagation()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


;

(()=>{'use strict';
 const root=document.getElementById('ivy-weather-scene');if(!root)return;
 let canvas=null,ctx=null,started=false,snapshot=null,raf=0,last=0,resizeW=0,resizeH=0;
 const mq=matchMedia('(prefers-reduced-motion: reduce)');
 const rain=[],snow=[];
 let seed=12345;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
 for(let i=0;i<68;i++){rain.push({x:random(),y:random(),z:random()});snow.push({x:random(),y:random(),z:random()})}
 function snapshotRead(){try{return JSON.parse(localStorage.getItem('ivyWeatherSnapshot')||'null')}catch(_){return null}}
 function hex(r,g,b){return 'rgb('+Math.round(r)+','+Math.round(g)+','+Math.round(b)+')'}
 function skyGradient(c,w,h,night){const g=c.createLinearGradient(0,0,0,h);if(night){g.addColorStop(0,'#182d58');g.addColorStop(.50,'#3f5d7a');g.addColorStop(1,'#91a1a7')}else{g.addColorStop(0,'#3978b1');g.addColorStop(.65,'#93b8cc');g.addColorStop(1,'#e0cead')}return g}
 function mountain(c,w,h,base,amp,color,phase){c.fillStyle=color;c.beginPath();c.moveTo(0,h);for(let x=0;x<=w+4;x+=4){let z=x/w;let y=h*base-h*amp*(.45+.36*Math.sin(z*9.2+phase)+.11*Math.sin(z*21+phase*2)+.08*Math.sin(z*54+phase));c.lineTo(x,y)}c.lineTo(w,h);c.closePath();c.fill()}
 function render(now){if(!started||!root.isConnected)return;
  if(root.dataset.ivyNatural==='webgl'){setTimeout(()=>requestAnimationFrame(render),1000);return;}
  if(document.hidden||root.clientWidth<5||root.clientHeight<5){raf=setTimeout(()=>requestAnimationFrame(render),650);return}
  if(last&&now-last<1000/(mq.matches?5:15)){requestAnimationFrame(render);return}last=now;
  const dpr=Math.min(devicePixelRatio||1,1.1),w=Math.max(2,root.clientWidth),h=Math.max(2,root.clientHeight);
  const pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(pw!==resizeW||ph!==resizeH){resizeW=pw;resizeH=ph;canvas.width=pw;canvas.height=ph;ctx.setTransform(dpr,0,0,dpr,0,0)}
  const c=ctx,t=now/1000,code=Number(snapshot?.current?.weather_code||0),isDay=snapshot?.current?.is_day;
  const night=isDay===undefined||isDay===null?(new Date().getHours()<6||new Date().getHours()>19):Number(isDay)===0;
  const rainMode=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code);
  const snowMode=[71,73,75,77,85,86].includes(code);
  const storm=[95,96,99].includes(code);
  c.fillStyle=skyGradient(c,w,h,night);c.fillRect(0,0,w,h);
  // Multiple soft aurora veils, natural curves, never a visor/glass reflection.
  if(night){for(let k=0;k<3;k++){
    const x0=w*(.09+k*.35),cx=x0+Math.sin(t*.16+k)*w*.09,tw=.15+.06*Math.sin(t*.20+k);
    let g=c.createLinearGradient(cx-45,0,cx+60,h*.65);g.addColorStop(0,'rgba(24,230,166,0)');g.addColorStop(.48,k===1?'rgba(153,124,252,.13)':'rgba(50,242,169,.13)');g.addColorStop(1,'rgba(24,230,166,0)');
    c.fillStyle=g;c.beginPath();c.moveTo(cx-w*tw,-h*.2);c.bezierCurveTo(cx-w*.2,h*.18,cx+w*.03,h*.45,cx-w*.1,h*.65);c.lineTo(cx+w*.2,h*.68);c.bezierCurveTo(cx+w*.1,h*.30,cx+w*.3,0,cx+w*.1,-h*.2);c.fill()}}
  if(night){for(let i=0;i<28;i++){const x=((i*73+19)%307)/307*w,y=((i*97+11)%223)/223*h*.58;c.fillStyle='rgba(232,244,255,'+(.12+.17*(.5+.5*Math.sin(t*.6+i)))+')';c.fillRect(x,y,1.15,1.15)}}
  // Distant valley with three layers, brighter night ground.
  mountain(c,w,h,.65,.22,night?'#667987':'#738b9b',1.1);
  mountain(c,w,h,.78,.17,night?'#4c6876':'#536f69',3.2);
  mountain(c,w,h,.88,.12,night?'#314f51':'#47614b',4.7);
  c.fillStyle=night?'#46636a':'#647f7e';c.beginPath();c.moveTo(w*.43,h*.75);c.bezierCurveTo(w*.65,h*.80,w*.28,h*.93,w*.57,h);c.lineTo(w*.43,h);c.bezierCurveTo(w*.38,h*.89,w*.5,h*.83,w*.43,h*.75);c.fill();
  if(code>1){for(let i=0;i<4;i++){let x=w*(.07+i*.31)-((t*1.7)%(w*.4)),y=h*(.17+i*.11);let g=c.createRadialGradient(x,y,0,x,y,w*.30);g.addColorStop(0,'rgba(228,235,239,.21)');g.addColorStop(1,'rgba(206,220,232,0)');c.fillStyle=g;c.fillRect(x-w*.30,y-w*.25,w*.6,w*.5)}}
  if(rainMode){c.lineWidth=.75;c.strokeStyle=night?'rgba(215,231,246,.32)':'rgba(230,242,248,.39)';c.beginPath();for(const p of rain){const x=((p.x+t*.015*(p.z+.5))%1)*w,y=((p.y+t*(.2+p.z*.7))%1)*h;c.moveTo(x,y);c.lineTo(x-3,y+8+p.z*8)}c.stroke()}
  if(snowMode){c.fillStyle='rgba(250,252,255,.75)';for(const p of snow){const x=((p.x+t*.006*(p.z+.4))%1)*w,y=((p.y+t*(.018+p.z*.06))%1)*h;c.beginPath();c.arc(x,y,.8+p.z*1.6,0,6.283);c.fill()}}
  if(storm&&Math.floor(t*1.1)%11===0){c.fillStyle='rgba(210,227,247,.09)';c.fillRect(0,0,w,h)}
  requestAnimationFrame(render);
 }
 function launch(){if(started||!['fallback','fallback-2d'].includes(root.dataset.ivyNatural))return;started=true;
  canvas=document.createElement('canvas');canvas.className='ivy-v39-lite-canvas';canvas.setAttribute('aria-hidden','true');ctx=canvas.getContext('2d',{alpha:false});if(!ctx){started=false;return}
  root.prepend(canvas);snapshot=snapshotRead();requestAnimationFrame(render);
  root.dataset.ivyNatural='fallback-2d';document.documentElement.classList.remove('ivy-natural-boot');
 }
 const observer=new MutationObserver(()=>{if(root.dataset.ivyNatural==='fallback'){launch();}});
 observer.observe(root,{attributes:true,attributeFilter:['data-ivy-natural']});
 if(root.dataset.ivyNatural==='fallback')launch();
 window.addEventListener('ivy-weather-snapshot',e=>{snapshot=e.detail||snapshot;});
})();

/* IVY V40 – auto-upgrade fast 2D weather to HQ when the shell is idle. */
(()=>{'use strict';
 const KEY='ivyWeatherRenderQualityV39';
 const $=id=>document.getElementById(id);
 const quality=()=>localStorage.getItem(KEY)==='fast'?'fast':'auto';
 function init(){
  const weather=$('ivy-v37-group-weather')?.querySelector('.ivy-v37-content');
  if(weather&&!$('ivy-weather-quality')){
   const row=document.createElement('div');row.className='ivy-v39-weather-quality';
   row.innerHTML='<label for="ivy-weather-quality">Wetter-Grafikqualität</label><select id="ivy-weather-quality"><option value="auto">Originale HQ-Landschaft · gepufferter Sofortstart</option><option value="fast">Nur schnell · 2D ohne WebGL</option></select><small>Standard: Zuletzt gespeicherte Original-WebGL-Bilder erscheinen sofort als animierter Puffer. Der echte Renderer übernimmt im Hintergrund. Ohne gespeicherten Puffer oder ohne WebGL dient die 2D-Karte als Ersatz.</small>';
   weather.append(row);
   const select=$('ivy-weather-quality');select.value=quality();
   select.addEventListener('change',()=>{localStorage.setItem(KEY,select.value);location.reload()});
  }
  const updates=$('ivy-v37-group-updates')?.querySelector('.ivy-v37-content');
  if(updates&&!$('ivy-v39-copy-diagnostics')){
   const btn=document.createElement('button');btn.type='button';btn.className='ivy-v37-update-button';btn.id='ivy-v39-copy-diagnostics';btn.textContent='⧉ Lade-Diagnose kopieren';
   btn.addEventListener('click',async()=>{
    const report=await diagnostics();
    try{await navigator.clipboard.writeText(report);btn.textContent='✓ Diagnose kopiert';setTimeout(()=>btn.textContent='⧉ Lade-Diagnose kopieren',2500)}
    catch(_){window.prompt('Lade-Diagnose kopieren',report)}
   });
   updates.append(btn);
  }
  // Independent of network favicons, window.load and weather API responses.
  // Wait for the UI's first visual frames, then schedule the expensive WebGL shader
  // compilation in an idle period, never on the critical startup path.
  if(quality()==='auto'){
   let queued=false;
   const load=()=>{
    if(queued||document.hidden||!$('ivy-weather-scene')?.isConnected)return;
    queued=true;
    const script=document.createElement('script');script.id='ivy-v41-hq-script';
    script.src='./ivy-weather-hq-v41.js';script.async=true;
    script.onerror=()=>{console.warn('IVY: HQ-Wetter nicht verfügbar; 2D-Wetter bleibt sichtbar.');};
    document.head.append(script);
   };
   const scheduleIdle=()=>{
    const invoke=()=>{if(document.hidden)return;if('requestIdleCallback'in window){
      requestIdleCallback(()=>load(),{timeout:1200});
     }else setTimeout(load,200);};
    // The delay is for HQ only. All 2D weather and particles render immediately.
    setTimeout(invoke,200);
   };
   requestAnimationFrame(()=>requestAnimationFrame(scheduleIdle));
   document.addEventListener('visibilitychange',()=>{
     if(!document.hidden&&!queued&&!$('ivy-v41-hq-script'))scheduleIdle();
   },{passive:true});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 async function diagnostics(){
  const nav=performance.getEntriesByType('navigation')[0],paint=performance.getEntriesByType('paint');
  const summary={build:document.querySelector('meta[name="ivy-build"]')?.content||'?',mode:quality(),weather:$('ivy-weather-scene')?.dataset.ivyNatural,
    backgroundReadyAt:Math.round(window.IVY_PARTICLES?.readyAt||0),hqState:$('ivy-weather-scene')?.dataset.ivyHq||'not-started',
    links:document.querySelectorAll('#quick-dials-grid>[data-id]').length,loadedIcons:document.querySelectorAll('#quick-dials-grid .ivy-icon-loaded').length,
    domMs:Math.round(nav?.domContentLoadedEventEnd||0),loadMs:Math.round(nav?.loadEventEnd||0),firstPaintMs:Math.round(paint.find(e=>e.name==='first-paint')?.startTime||0),
    fcpMs:Math.round(paint.find(e=>e.name==='first-contentful-paint')?.startTime||0),swControlled:!!navigator.serviceWorker?.controller,
    offlineCapable:!!navigator.serviceWorker?.controller,online:navigator.onLine};
  try{summary.cacheNames=(await caches.keys()).filter(x=>x.startsWith('ivy-dashboard-'))}catch(_){}
  const assets=performance.getEntriesByType('resource').filter(r=>/ivy-app|ivy-shell|ivy-weather-hq|version\.json/.test(r.name))
    .map(r=>({asset:r.name.split('/').pop(),durationMs:Math.round(r.duration),transferBytes:r.transferSize||0}));
  return JSON.stringify({...summary,assets},null,2);
 }
 window.ivyV39Performance={weatherQuality:quality,diagnostics,setWeatherQuality(mode){localStorage.setItem(KEY,mode==='fast'?'fast':'auto');location.reload()}};
})();
