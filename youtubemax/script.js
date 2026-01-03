// =============================================
// BIBLIOTHÈQUE GLOBALE - Variables et constantes
// =============================================

// Constantes de configuration
const CONFIG = {
    APP_NAME: "YouTube Local",
    MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
    MAX_RECENT_VIDEOS: 20,
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 heures
    SUPPORTED_FORMATS: ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.m4v', '.wmv'],
    THUMBNAIL_COLORS: [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)',
        'linear-gradient(135deg, #fa709a, #fee140)',
        'linear-gradient(135deg, #a8edea, #fed6e3)',
        'linear-gradient(135deg, #d4fc79, #96e6a1)',
        'linear-gradient(135deg, #ffecd2, #fcb69f)'
    ],
    VIDEO_PER_PAGE: 24,
    DEBOUNCE_DELAY: 300
};

// État global de l'application
const AppState = {
    currentSection: 'local',
    currentVideo: null,
    isPlayerVisible: false,
    videos: {
        local: [],
        recent: [],
        favorites: []
    },
    cache: new Map(),
    searchTerm: '',
    isLoading: false,
    videoGridObserver: null,
    lastVideoId: 0,
    displayedCount: 0,
    currentPage: 1,
    hasMoreVideos: true,
    isDragging: false
};

// Cache des éléments DOM
const DOM = {};

// =============================================
// INITIALISATION
// =============================================

/**
 * Initialise l'application
 */
function initApp() {
    console.log(`${CONFIG.APP_NAME} - Initialisation...`);
    
    try {
        // Initialiser le cache DOM
        initDOMElements();
        
        // Initialiser le thème
        initTheme();
        
        // Initialiser les observateurs
        initObservers();
        
        // Charger les données
        loadAppData().then(() => {
            // Configurer les écouteurs d'événements
            setupEventListeners();
            
            // Afficher les vidéos
            displayVideos();
            
            // Mettre à jour l'interface
            updateUI();
            updateStats();
            
            console.log(`${CONFIG.APP_NAME} - Prêt !`);
            console.log(`Vidéos chargées: ${AppState.videos.local.length}`);
        }).catch(error => {
            console.error("Erreur lors du chargement:", error);
            showNotification("Erreur de chargement des données", "error");
        });
        
    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        showNotification("Erreur d'initialisation de l'application", "error");
    }
}

/**
 * Initialise le cache des éléments DOM avec vérification
 */
function initDOMElements() {
    const elements = [
        // Éléments principaux
        'videoGrid', 'emptyState', 'sectionTitle', 'videoPlayerContainer',
        'videoContent', 'videoPlayer', 'videoTitleLarge',
        
        // Informations vidéo
        'videoFileName', 'videoFileSize', 'videoDuration',
        'filePath', 'fileSize', 'fileType', 'fileDate', 'filePlayCount', 'fileDuration',
        
        // Boutons
        'favoriteButton', 'deleteButton', 'backButton', 'uploadButton',
        'uploadVideoBtn', 'fileInput', 'searchButton', 'searchInput',
        'playerTitle', 'clearSearchButton', 'loadMoreButton',
        'playPauseBtn', 'muteBtn', 'volumeSlider', 'downloadButton',
        
        // Conteneurs
        'dropZone', 'loadingOverlay', 'notificationsContainer',
        
        // Statistiques
        'totalVideos', 'favoriteVideos', 'totalStorage', 'displayedCount',
        
        // Player overlay
        'playerOverlay'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            DOM[id] = element;
        } else {
            console.warn(`Élément #${id} non trouvé dans le DOM`);
        }
    });
    
    // Éléments avec sélecteurs
    DOM.sidebarItems = document.querySelectorAll('.sidebar-item[data-section]');
    DOM.themeToggle = document.getElementById('themeToggle');
    DOM.addFolderBtn = document.getElementById('addFolderBtn');
    DOM.refreshButton = document.getElementById('refreshButton');
    DOM.gridInfo = document.getElementById('gridInfo');
    DOM.statsBar = document.getElementById('statsBar');
    DOM.gridFooter = document.getElementById('gridFooter');
    
    console.log("Éléments DOM initialisés:", Object.keys(DOM).length);
}

/**
 * Initialise le thème
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
}

/**
 * Initialise les observateurs
 */
function initObservers() {
    // Observer pour le chargement paresseux des vidéos
    if ('IntersectionObserver' in window) {
        AppState.videoGridObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const videoCard = entry.target;
                    videoCard.classList.add('visible');
                    AppState.videoGridObserver.unobserve(videoCard);
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1
        });
    } else {
        console.warn("IntersectionObserver non supporté");
    }
}

// =============================================
// GESTION DES DONNÉES
// =============================================

/**
 * Charge les données de l'application
 */
async function loadAppData() {
    AppState.isLoading = true;
    showLoading(true);
    
    try {
        // Charger depuis localStorage
        const savedData = localStorage.getItem('youtubeLocalVideos');
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Migration depuis l'ancien format si nécessaire
            if (Array.isArray(parsedData)) {
                // Ancien format : tableau de vidéos
                AppState.videos.local = parsedData;
                AppState.lastVideoId = parsedData.length > 0 ? 
                    Math.max(...parsedData.map(v => v.id || 0)) : 0;
            } else if (parsedData.videos) {
                // Nouveau format : objet avec métadonnées
                AppState.videos.local = parsedData.videos || [];
                AppState.lastVideoId = parsedData.lastVideoId || AppState.videos.local.length;
            } else {
                AppState.videos.local = [];
                AppState.lastVideoId = 0;
            }
            
            // Convertir les chaînes en objets File si nécessaire
            await convertLegacyVideos();
            
            console.log('Vidéos chargées:', AppState.videos.local.length);
        } else {
            AppState.videos.local = [];
            AppState.lastVideoId = 0;
            console.log('Aucune donnée sauvegardée trouvée');
        }
        
        // Mettre à jour les listes dérivées
        updateDerivedLists();
        
    } catch (error) {
        console.error("Erreur de chargement:", error);
        AppState.videos.local = [];
        AppState.lastVideoId = 0;
        showNotification("Erreur de chargement des données", "error");
    } finally {
        AppState.isLoading = false;
        showLoading(false);
    }
}

/**
 * Convertit les vidéos de l'ancien format si nécessaire
 */
async function convertLegacyVideos() {
    // Cette fonction gère la migration depuis d'anciennes versions
    for (let video of AppState.videos.local) {
        // Si le fichier est une chaîne ou un objet sans type File
        if (video.file && typeof video.file === 'object' && !(video.file instanceof File)) {
            try {
                // Reconstruire l'objet File si possible
                if (video.file.data && video.file.name) {
                    const blob = new Blob([new Uint8Array(video.file.data)], { type: video.file.type });
                    video.file = new File([blob], video.file.name, { type: video.file.type });
                }
            } catch (error) {
                console.warn("Échec de conversion de la vidéo:", video.name, error);
            }
        }
    }
}

/**
 * Sauvegarde les données de l'application
 */
async function saveAppData() {
    if (AppState.isLoading) return;
    
    try {
        const dataToSave = {
            videos: AppState.videos.local,
            lastVideoId: AppState.lastVideoId,
            savedAt: new Date().toISOString(),
            version: '2.0'
        };
        
        // Sauvegarder dans localStorage
        localStorage.setItem('youtubeLocalVideos', JSON.stringify(dataToSave));
        
        console.log('Données sauvegardées:', AppState.videos.local.length, 'vidéos');
        
    } catch (error) {
        console.error("Erreur de sauvegarde:", error);
        showNotification("Erreur de sauvegarde des données", "error");
    }
}

/**
 * Met à jour les listes dérivées (récentes, favoris)
 */
function updateDerivedLists() {
    if (!AppState.videos.local || !Array.isArray(AppState.videos.local)) {
        console.error("Videos.local n'est pas un tableau valide");
        AppState.videos.local = [];
    }
    
    // Vidéos récentes (les plus récentes d'abord)
    AppState.videos.recent = [...AppState.videos.local]
        .sort((a, b) => {
            const dateA = a.lastPlayed || a.addedDate || 0;
            const dateB = b.lastPlayed || b.addedDate || 0;
            return new Date(dateB) - new Date(dateA);
        })
        .slice(0, CONFIG.MAX_RECENT_VIDEOS);
    
    // Vidéos favorites
    AppState.videos.favorites = AppState.videos.local.filter(video => 
        video.isFavorite === true
    );
}

// =============================================
// GESTION DES VIDÉOS
// =============================================

/**
 * Ajoute une ou plusieurs vidéos
 */
async function addVideos(files) {
    if (!files || files.length === 0) {
        showNotification("Aucun fichier sélectionné", "warning");
        return;
    }
    
    const validVideos = [];
    const errors = [];
    
    showLoading(true);
    
    // Parcourir tous les fichiers
    for (const file of Array.from(files)) {
        try {
            // Validation du fichier
            const validation = validateVideoFile(file);
            if (!validation.valid) {
                errors.push(`${file.name}: ${validation.error}`);
                continue;
            }
            
            // Créer l'objet vidéo
            const video = await createVideoObject(file);
            
            // Vérifier les doublons
            const isDuplicate = AppState.videos.local.some(v => 
                v.name === video.name && v.size === video.size
            );
            
            if (isDuplicate) {
                errors.push(`${file.name}: Déjà existante`);
                continue;
            }
            
            // Ajouter la vidéo
            AppState.videos.local.push(video);
            validVideos.push(video);
            
            console.log("Vidéo ajoutée:", video.name);
            
        } catch (error) {
            console.error("Erreur avec", file.name, ":", error);
            errors.push(`${file.name}: ${error.message}`);
        }
    }
    
    if (validVideos.length > 0) {
        // Mettre à jour les listes et sauvegarder
        updateDerivedLists();
        await saveAppData();
        
        // Mettre à jour l'affichage
        displayVideos();
        updateUI();
        updateStats();
        
        // Afficher une notification
        showNotification(
            `${validVideos.length} vidéo(s) ajoutée(s) avec succès`,
            "success"
        );
    }
    
    if (errors.length > 0) {
        console.warn("Erreurs lors de l'ajout:", errors);
        showNotification(
            `${errors.length} erreur(s) lors de l'ajout`,
            "warning"
        );
    }
    
    showLoading(false);
    return { success: validVideos, errors };
}

/**
 * Valide un fichier vidéo
 */
function validateVideoFile(file) {
    // Vérifier si c'est un fichier valide
    if (!(file instanceof File)) {
        return { valid: false, error: "Type de fichier invalide" };
    }
    
    // Vérifier la taille
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        return { 
            valid: false, 
            error: `Trop volumineux (${formatFileSize(file.size)} > ${formatFileSize(CONFIG.MAX_FILE_SIZE)})` 
        };
    }
    
    // Vérifier l'extension
    const fileName = file.name.toLowerCase();
    const isValidFormat = CONFIG.SUPPORTED_FORMATS.some(format => 
        fileName.endsWith(format)
    );
    
    if (!isValidFormat) {
        return { 
            valid: false, 
            error: `Format non supporté (${CONFIG.SUPPORTED_FORMATS.join(', ')})` 
        };
    }
    
    return { valid: true };
}

/**
 * Crée un objet vidéo à partir d'un fichier
 */
async function createVideoObject(file) {
    const videoId = ++AppState.lastVideoId;
    
    try {
        // Générer une miniature et la durée
        const [thumbnail, duration] = await Promise.all([
            generateThumbnail(file).catch(() => null),
            getVideoDuration(file).catch(() => null)
        ]);
        
        return {
            id: videoId,
            name: file.name,
            file: file,
            size: file.size,
            type: file.type,
            addedDate: new Date().toISOString(),
            isFavorite: false,
            lastPlayed: null,
            playCount: 0,
            duration: duration,
            thumbnail: thumbnail,
            color: CONFIG.THUMBNAIL_COLORS[videoId % CONFIG.THUMBNAIL_COLORS.length],
            tags: [],
            metadata: {
                lastModified: file.lastModified,
                webkitRelativePath: file.webkitRelativePath || '',
                lastAccessed: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error("Erreur création vidéo:", error);
        // Retourner un objet de base si les opérations asynchrones échouent
        return {
            id: videoId,
            name: file.name,
            file: file,
            size: file.size,
            type: file.type,
            addedDate: new Date().toISOString(),
            isFavorite: false,
            lastPlayed: null,
            playCount: 0,
            duration: null,
            thumbnail: null,
            color: CONFIG.THUMBNAIL_COLORS[videoId % CONFIG.THUMBNAIL_COLORS.length],
            tags: [],
            metadata: {
                lastModified: file.lastModified,
                webkitRelativePath: file.webkitRelativePath || '',
                lastAccessed: new Date().toISOString()
            }
        };
    }
}

/**
 * Génère une miniature pour une vidéo
 */
async function generateThumbnail(file) {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.URL || !window.URL.createObjectURL) {
            reject(new Error('Navigateur non supporté'));
            return;
        }
        
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';
        
        video.onloadedmetadata = () => {
            // Prendre une frame à 25% de la vidéo
            video.currentTime = Math.min(video.duration * 0.25, 10);
        };
        
        video.onseeked = () => {
            try {
                canvas.width = video.videoWidth || 320;
                canvas.height = video.videoHeight || 180;
                
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Créer une miniature de qualité moyenne
                const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                
                // Nettoyer
                URL.revokeObjectURL(video.src);
                video.remove();
                canvas.remove();
                
                resolve(thumbnail);
            } catch (error) {
                reject(error);
            }
        };
        
        video.onerror = (error) => {
            URL.revokeObjectURL(video.src);
            video.remove();
            canvas.remove();
            reject(new Error('Erreur de chargement de la vidéo'));
        };
        
        // Timeout de sécurité
        const timeout = setTimeout(() => {
            if (video.src) {
                URL.revokeObjectURL(video.src);
            }
            video.remove();
            canvas.remove();
            reject(new Error('Timeout génération miniature'));
        }, 10000);
        
        try {
            video.src = URL.createObjectURL(file);
            video.load();
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}

/**
 * Récupère la durée d'une vidéo
 */
async function getVideoDuration(file) {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.URL || !window.URL.createObjectURL) {
            reject(new Error('Navigateur non supporté'));
            return;
        }
        
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';
        
        video.onloadedmetadata = () => {
            const duration = video.duration;
            URL.revokeObjectURL(video.src);
            video.remove();
            resolve(duration);
        };
        
        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            video.remove();
            reject(new Error('Impossible de lire la durée'));
        };
        
        // Timeout
        const timeout = setTimeout(() => {
            if (video.src) {
                URL.revokeObjectURL(video.src);
            }
            video.remove();
            resolve(null);
        }, 5000);
        
        try {
            video.src = URL.createObjectURL(file);
            video.load();
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}

// =============================================
// AFFICHAGE DES VIDÉOS
// =============================================

/**
 * Affiche les vidéos dans la grille
 */
function displayVideos() {
    if (!DOM.videoGrid) {
        console.error("Élément videoGrid non trouvé");
        return;
    }
    
    const videos = getCurrentVideos();
    const filteredVideos = AppState.searchTerm ? 
        filterVideosBySearch(videos, AppState.searchTerm) : 
        videos;
    
    AppState.displayedCount = filteredVideos.length;
    
    // Réinitialiser la pagination
    AppState.currentPage = 1;
    AppState.hasMoreVideos = filteredVideos.length > CONFIG.VIDEO_PER_PAGE;
    
    // Vider la grille
    DOM.videoGrid.innerHTML = '';
    
    // Afficher l'état vide si nécessaire
    if (filteredVideos.length === 0) {
        showEmptyState();
        return;
    }
    
    // Cacher l'état vide
    if (DOM.emptyState) {
        DOM.emptyState.style.display = 'none';
    }
    
    // Afficher les premières vidéos
    const videosToShow = filteredVideos.slice(0, CONFIG.VIDEO_PER_PAGE);
    
    // Créer des fragments pour une meilleure performance
    const fragment = document.createDocumentFragment();
    
    videosToShow.forEach((video, index) => {
        const videoCard = createVideoCard(video, index);
        fragment.appendChild(videoCard);
    });
    
    DOM.videoGrid.appendChild(fragment);
    
    // Mettre à jour le bouton "Charger plus"
    updateLoadMoreButton();
    
    // Mettre à jour les infos
    updateGridInfo();
    
    // Observer les cartes pour les animations
    observeVideoCards();
}

/**
 * Charge plus de vidéos
 */
function loadMoreVideos() {
    if (AppState.isLoading || !AppState.hasMoreVideos) return;
    
    const videos = getCurrentVideos();
    const filteredVideos = AppState.searchTerm ? 
        filterVideosBySearch(videos, AppState.searchTerm) : 
        videos;
    
    const startIndex = AppState.currentPage * CONFIG.VIDEO_PER_PAGE;
    const endIndex = startIndex + CONFIG.VIDEO_PER_PAGE;
    const videosToLoad = filteredVideos.slice(startIndex, endIndex);
    
    if (videosToLoad.length === 0) {
        AppState.hasMoreVideos = false;
        updateLoadMoreButton();
        return;
    }
    
    AppState.isLoading = true;
    if (DOM.loadMoreButton) {
        DOM.loadMoreButton.classList.add('loading');
    }
    
    // Simuler un délai pour l'effet de chargement
    setTimeout(() => {
        const fragment = document.createDocumentFragment();
        
        videosToLoad.forEach((video, index) => {
            const videoCard = createVideoCard(video, startIndex + index);
            fragment.appendChild(videoCard);
        });
        
        DOM.videoGrid.appendChild(fragment);
        
        AppState.currentPage++;
        AppState.hasMoreVideos = filteredVideos.length > (AppState.currentPage * CONFIG.VIDEO_PER_PAGE);
        
        // Observer les nouvelles cartes
        observeVideoCards();
        
        // Mettre à jour le bouton et les infos
        updateLoadMoreButton();
        updateGridInfo();
        
        AppState.isLoading = false;
        
    }, 300);
}

/**
 * Crée une carte vidéo
 */
function createVideoCard(video, index) {
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card';
    videoCard.setAttribute('data-video-id', video.id);
    videoCard.setAttribute('data-index', index);
    
    // Animation delay
    videoCard.style.animationDelay = `${index * 0.05}s`;
    
    // Créer le contenu de la carte
    videoCard.innerHTML = `
        <div class="thumbnail-container">
            ${video.thumbnail ? 
                `<img src="${video.thumbnail}" alt="${video.name}" class="thumbnail" loading="lazy">` :
                `<div class="thumbnail" style="background: ${video.color || CONFIG.THUMBNAIL_COLORS[0]}">
                    <div class="thumbnail-content">
                        <div class="thumbnail-icon">🎬</div>
                        <div class="thumbnail-text">${escapeHtml(video.name.substring(0, 20))}${video.name.length > 20 ? '...' : ''}</div>
                    </div>
                </div>`
            }
            ${video.duration ? 
                `<div class="video-duration">${formatDuration(video.duration)}</div>` : ''
            }
            ${video.isFavorite ? 
                `<div class="favorite-badge" title="Favori">⭐</div>` : ''
            }
        </div>
        <div class="video-info">
            <div class="channel-avatar" title="YouTube Local">YL</div>
            <div class="video-details">
                <div class="video-title" title="${escapeHtml(video.name)}">${escapeHtml(video.name)}</div>
                <div class="channel-name">Vidéo Locale</div>
                <div class="video-meta">
                    <span>${formatFileSize(video.size)}</span>
                    <span>${formatDate(video.addedDate)}</span>
                </div>
            </div>
        </div>
    `;
    
    return videoCard;
}

/**
 * Affiche l'état vide
 */
function showEmptyState() {
    if (!DOM.emptyState) return;
    
    DOM.emptyState.style.display = 'flex';
    DOM.videoGrid.innerHTML = '';
    DOM.videoGrid.appendChild(DOM.emptyState);
    
    // Cacher le bouton "Charger plus"
    if (DOM.loadMoreButton) {
        DOM.loadMoreButton.style.display = 'none';
    }
    
    // Mettre à jour les infos
    updateGridInfo();
}

/**
 * Observe les cartes vidéo pour les animations
 */
function observeVideoCards() {
    if (!AppState.videoGridObserver || !DOM.videoGrid) return;
    
    const videoCards = DOM.videoGrid.querySelectorAll('.video-card:not(.visible)');
    videoCards.forEach(card => {
        AppState.videoGridObserver.observe(card);
    });
}

/**
 * Met à jour le bouton "Charger plus"
 */
function updateLoadMoreButton() {
    if (!DOM.loadMoreButton) return;
    
    if (AppState.hasMoreVideos && AppState.displayedCount > CONFIG.VIDEO_PER_PAGE) {
        DOM.loadMoreButton.style.display = 'flex';
        DOM.loadMoreButton.classList.remove('loading');
    } else {
        DOM.loadMoreButton.style.display = 'none';
    }
}

/**
 * Met à jour les informations de la grille
 */
function updateGridInfo() {
    if (!DOM.gridInfo || !DOM.displayedCount) return;
    
    const videos = getCurrentVideos();
    const totalCount = AppState.searchTerm ? 
        filterVideosBySearch(videos, AppState.searchTerm).length : 
        videos.length;
    
    const displayed = Math.min(AppState.currentPage * CONFIG.VIDEO_PER_PAGE, totalCount);
    
    DOM.displayedCount.textContent = displayed;
    DOM.gridInfo.innerHTML = `
        Affichage de <strong>${displayed}</strong> sur <strong>${totalCount}</strong> vidéos
    `;
    
    // Afficher/masquer le footer
    if (DOM.gridFooter) {
        DOM.gridFooter.style.display = totalCount > 0 ? 'flex' : 'none';
    }
}

/**
 * Récupère les vidéos de la section courante
 */
function getCurrentVideos() {
    switch (AppState.currentSection) {
        case 'local': return AppState.videos.local;
        case 'recent': return AppState.videos.recent;
        case 'favorites': return AppState.videos.favorites;
        default: return AppState.videos.local;
    }
}

/**
 * Filtre les vidéos par recherche
 */
function filterVideosBySearch(videos, searchTerm) {
    if (!searchTerm.trim()) return videos;
    
    const term = searchTerm.toLowerCase().trim();
    return videos.filter(video => 
        video.name.toLowerCase().includes(term) ||
        (video.tags && video.tags.some(tag => 
            tag.toLowerCase().includes(term)
        ))
    );
}

// =============================================
// GESTION DU LECTEUR VIDÉO
// =============================================

/**
 * Affiche le lecteur vidéo
 */
function showVideoPlayer(videoId) {
    const videoIdNum = parseInt(videoId, 10);
    const video = AppState.videos.local.find(v => v.id === videoIdNum);
    
    if (!video) {
        console.error("Vidéo non trouvée:", videoId);
        showNotification("Vidéo non trouvée", "error");
        return;
    }
    
    AppState.currentVideo = video;
    AppState.isPlayerVisible = true;
    
    // Mettre à jour les statistiques
    video.playCount = (video.playCount || 0) + 1;
    video.lastPlayed = new Date().toISOString();
    
    // Mettre à jour l'interface
    if (DOM.videoContent) DOM.videoContent.style.display = 'none';
    if (DOM.videoPlayerContainer) DOM.videoPlayerContainer.style.display = 'block';
    
    // Mettre à jour les informations du lecteur
    updateVideoPlayer(video);
    
    // Jouer la vidéo
    playVideo(video);
    
    // Sauvegarder
    saveAppData();
    
    // Mettre à jour les listes
    updateDerivedLists();
    updateStats();
    
    // Historique de navigation
    history.pushState({ videoId, section: AppState.currentSection }, '', `#video-${videoId}`);
}

/**
 * Met à jour le lecteur vidéo
 */
function updateVideoPlayer(video) {
    if (!video) return;
    
    // Informations principales
    setTextContent('videoTitleLarge', video.name);
    setTextContent('videoFileName', video.name);
    setTextContent('videoFileSize', formatFileSize(video.size));
    setTextContent('videoDuration', video.duration ? formatDuration(video.duration) : '--:--');
    setTextContent('playerTitle', truncateText(video.name, 40));
    
    // Informations détaillées
    setTextContent('filePath', video.metadata?.webkitRelativePath || video.name);
    setTextContent('fileSize', formatFileSize(video.size));
    setTextContent('fileType', video.type || 'Inconnu');
    setTextContent('fileDate', formatDate(video.addedDate));
    setTextContent('fileDuration', video.duration ? formatDuration(video.duration) : 'Non disponible');
    setTextContent('filePlayCount', video.playCount || 0);
    
    // Bouton favori
    updateFavoriteButton(video.isFavorite);
    
    // Préparer le lecteur
    if (DOM.videoPlayer) {
        const videoPlayer = DOM.videoPlayer;
        
        // Libérer l'ancienne URL si elle existe
        if (videoPlayer.src && videoPlayer.src.startsWith('blob:')) {
            URL.revokeObjectURL(videoPlayer.src);
        }
        
        // Charger la nouvelle vidéo
        try {
            const videoURL = URL.createObjectURL(video.file);
            videoPlayer.src = videoURL;
            videoPlayer.load();
            
            // Configurer les événements
            setupPlayerEvents(videoPlayer);
            
        } catch (error) {
            console.error("Erreur chargement vidéo:", error);
            showNotification("Erreur de chargement de la vidéo", "error");
        }
    }
}

/**
 * Configure les événements du lecteur
 */
function setupPlayerEvents(videoPlayer) {
    if (!videoPlayer) return;
    
    // Sauvegarder la position de lecture
    videoPlayer.addEventListener('timeupdate', () => {
        if (AppState.currentVideo && videoPlayer.currentTime > 0) {
            AppState.currentVideo.lastPosition = videoPlayer.currentTime;
            AppState.currentVideo.lastPlayed = new Date().toISOString();
        }
    });
    
    // Gérer la fin de la vidéo
    videoPlayer.addEventListener('ended', () => {
        showNotification("Vidéo terminée", "info");
        
        // Sauvegarder la position
        if (AppState.currentVideo) {
            AppState.currentVideo.lastPosition = 0;
            saveAppData();
        }
    });
    
    // Gérer les erreurs
    videoPlayer.addEventListener('error', (e) => {
        console.error("Erreur de lecture:", e);
        showNotification("Erreur de lecture de la vidéo", "error");
    });
    
    // Gérer les contrôles personnalisés
    setupCustomControls();
}

/**
 * Configure les contrôles personnalisés
 */
function setupCustomControls() {
    if (!DOM.playPauseBtn || !DOM.muteBtn || !DOM.volumeSlider || !DOM.videoPlayer) return;
    
    const videoPlayer = DOM.videoPlayer;
    
    // Play/Pause
    DOM.playPauseBtn.addEventListener('click', () => {
        if (videoPlayer.paused) {
            videoPlayer.play();
            DOM.playPauseBtn.innerHTML = '⏸️';
        } else {
            videoPlayer.pause();
            DOM.playPauseBtn.innerHTML = '▶️';
        }
    });
    
    // Mute/Unmute
    DOM.muteBtn.addEventListener('click', () => {
        videoPlayer.muted = !videoPlayer.muted;
        DOM.muteBtn.innerHTML = videoPlayer.muted ? '🔇' : '🔊';
    });
    
    // Volume
    DOM.volumeSlider.addEventListener('input', (e) => {
        videoPlayer.volume = e.target.value;
    });
    
    // Mettre à jour le volume slider
    videoPlayer.addEventListener('volumechange', () => {
        if (DOM.volumeSlider) {
            DOM.volumeSlider.value = videoPlayer.volume;
        }
    });
    
    // Mettre à jour le bouton play/pause
    videoPlayer.addEventListener('play', () => {
        if (DOM.playPauseBtn) DOM.playPauseBtn.innerHTML = '⏸️';
    });
    
    videoPlayer.addEventListener('pause', () => {
        if (DOM.playPauseBtn) DOM.playPauseBtn.innerHTML = '▶️';
    });
}

/**
 * Joue une vidéo
 */
async function playVideo(video) {
    if (!DOM.videoPlayer) return;
    
    try {
        await DOM.videoPlayer.play();
        console.log("Lecture démarrée");
    } catch (error) {
        console.log("Lecture automatique bloquée:", error);
        showNotification("Cliquez sur la vidéo pour démarrer la lecture", "info");
    }
}

/**
 * Met à jour le bouton favori
 */
function updateFavoriteButton(isFavorite) {
    if (!DOM.favoriteButton) return;
    
    const button = DOM.favoriteButton;
    
    if (isFavorite) {
        button.innerHTML = '<span class="action-icon">⭐</span><span class="action-text">Retirer des favoris</span>';
        button.classList.add('active');
        button.title = "Retirer des favoris";
    } else {
        button.innerHTML = '<span class="action-icon">☆</span><span class="action-text">Ajouter aux favoris</span>';
        button.classList.remove('active');
        button.title = "Ajouter aux favoris";
    }
}

/**
 * Retourne à la liste des vidéos
 */
function backToVideoList() {
    // Arrêter la vidéo
    if (DOM.videoPlayer) {
        DOM.videoPlayer.pause();
        
        // Libérer l'URL
        if (DOM.videoPlayer.src && DOM.videoPlayer.src.startsWith('blob:')) {
            URL.revokeObjectURL(DOM.videoPlayer.src);
            DOM.videoPlayer.src = '';
        }
    }
    
    // Réinitialiser l'état
    AppState.currentVideo = null;
    AppState.isPlayerVisible = false;
    
    // Mettre à jour l'interface
    if (DOM.videoContent) DOM.videoContent.style.display = 'block';
    if (DOM.videoPlayerContainer) DOM.videoPlayerContainer.style.display = 'none';
    
    // Mettre à jour l'affichage
    displayVideos();
    updateUI();
    
    // Historique de navigation
    history.back();
}

// =============================================
// ACTIONS SUR LES VIDÉOS
// =============================================

/**
 * Bascule le statut favori
 */
function toggleFavorite() {
    if (!AppState.currentVideo) return;
    
    AppState.currentVideo.isFavorite = !AppState.currentVideo.isFavorite;
    updateFavoriteButton(AppState.currentVideo.isFavorite);
    
    // Mettre à jour l'affichage
    updateDerivedLists();
    saveAppData();
    updateStats();
    
    // Feedback utilisateur
    const message = AppState.currentVideo.isFavorite ? 
        "Ajouté aux favoris" : "Retiré des favoris";
    showNotification(message, "success");
}

/**
 * Supprime la vidéo courante
 */
async function deleteVideo() {
    if (!AppState.currentVideo) return;
    
    const confirmDelete = confirm(
        `Êtes-vous sûr de vouloir supprimer "${AppState.currentVideo.name}" ?\n\nCette action est irréversible.`
    );
    
    if (!confirmDelete) return;
    
    try {
        // Retirer la vidéo
        AppState.videos.local = AppState.videos.local.filter(
            v => v.id !== AppState.currentVideo.id
        );
        
        // Mettre à jour les listes
        updateDerivedLists();
        
        // Sauvegarder
        await saveAppData();
        
        // Retourner à la liste
        backToVideoList();
        
        // Notification
        showNotification("Vidéo supprimée avec succès", "success");
        updateStats();
        
    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        showNotification("Erreur lors de la suppression", "error");
    }
}

/**
 * Télécharge la vidéo courante
 */
function downloadVideo() {
    if (!AppState.currentVideo || !AppState.currentVideo.file) return;
    
    try {
        const url = URL.createObjectURL(AppState.currentVideo.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = AppState.currentVideo.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Libérer l'URL après le téléchargement
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        showNotification("Téléchargement démarré", "success");
        
    } catch (error) {
        console.error("Erreur téléchargement:", error);
        showNotification("Erreur lors du téléchargement", "error");
    }
}

/**
 * Gère la recherche
 */
function handleSearch() {
    if (!DOM.searchInput) return;
    
    const searchTerm = DOM.searchInput.value.trim();
    AppState.searchTerm = searchTerm;
    
    // Afficher/masquer le bouton de nettoyage
    if (DOM.clearSearchButton) {
        DOM.clearSearchButton.style.display = searchTerm ? 'block' : 'none';
    }
    
    // Délai pour éviter trop de recherches
    clearTimeout(AppState.searchTimeout);
    AppState.searchTimeout = setTimeout(() => {
        displayVideos();
        updateUI();
    }, CONFIG.DEBOUNCE_DELAY);
}

/**
 * Efface la recherche
 */
function clearSearch() {
    if (!DOM.searchInput) return;
    
    DOM.searchInput.value = '';
    AppState.searchTerm = '';
    
    if (DOM.clearSearchButton) {
        DOM.clearSearchButton.style.display = 'none';
    }
    
    displayVideos();
    updateUI();
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

/**
 * Formate la taille d'un fichier
 */
function formatFileSize(bytes) {
    if (bytes === 0 || !bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formate une durée
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formate une date
 */
function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        // Format relatif pour les dates récentes
        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        
        // Format complet pour les dates plus anciennes
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return 'Date inconnue';
    }
}

/**
 * Échappe les caractères HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Tronque un texte
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Définit le contenu textuel d'un élément
 */
function setTextContent(elementId, text) {
    const element = DOM[elementId];
    if (element) {
        element.textContent = text;
    }
}

/**
 * Affiche une notification
 */
function showNotification(message, type = 'info') {
    if (!DOM.notificationsContainer) return;
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">${escapeHtml(message)}</div>
        <button class="notification-close">×</button>
    `;
    
    // Ajouter au conteneur
    DOM.notificationsContainer.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Fermeture automatique
    const autoClose = setTimeout(() => {
        closeNotification(notification);
    }, 5000);
    
    // Fermeture manuelle
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoClose);
            closeNotification(notification);
        });
    }
    
    // Fonction de fermeture
    function closeNotification(notif) {
        notif.classList.remove('show');
        setTimeout(() => {
            if (notif.parentNode) {
                notif.parentNode.removeChild(notif);
            }
        }, 300);
    }
}

/**
 * Affiche/masque l'indicateur de chargement
 */
function showLoading(show) {
    if (!DOM.loadingOverlay) return;
    
    if (show) {
        DOM.loadingOverlay.classList.add('active');
    } else {
        DOM.loadingOverlay.classList.remove('active');
    }
}

/**
 * Met à jour l'interface utilisateur
 */
function updateUI() {
    // Titre de section
    const videos = getCurrentVideos();
    const count = AppState.searchTerm ? 
        filterVideosBySearch(videos, AppState.searchTerm).length : 
        videos.length;
    
    let sectionText = '';
    switch (AppState.currentSection) {
        case 'local':
            sectionText = `Vidéos Locales (${count})`;
            break;
        case 'recent':
            sectionText = `Vidéos Récentes (${count})`;
            break;
        case 'favorites':
            sectionText = `Vidéos Favorites (${count})`;
            break;
    }
    
    if (DOM.sectionTitle) {
        DOM.sectionTitle.textContent = sectionText;
    }
    
    // État du bouton d'upload
    if (DOM.uploadVideoBtn) {
        DOM.uploadVideoBtn.disabled = AppState.isLoading;
    }
    if (DOM.uploadButton) {
        DOM.uploadButton.disabled = AppState.isLoading;
    }
    
    // Afficher/masquer la barre de stats
    if (DOM.statsBar) {
        DOM.statsBar.style.display = videos.length > 0 ? 'flex' : 'none';
    }
}

/**
 * Met à jour les statistiques
 */
function updateStats() {
    const totalVideos = AppState.videos.local.length;
    const favoriteVideos = AppState.videos.favorites.length;
    const totalSize = AppState.videos.local.reduce((sum, video) => sum + (video.size || 0), 0);
    
    if (DOM.totalVideos) DOM.totalVideos.textContent = totalVideos;
    if (DOM.favoriteVideos) DOM.favoriteVideos.textContent = favoriteVideos;
    if (DOM.totalStorage) DOM.totalStorage.textContent = formatFileSize(totalSize);
}

/**
 * Bascule le thème
 */
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    showNotification(`Thème ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, "info");
}

// =============================================
// GESTION DES ÉVÉNEMENTS
// =============================================

/**
 * Configure tous les écouteurs d'événements
 */
function setupEventListeners() {
    console.log("Configuration des écouteurs d'événements...");
    
    // Upload de fichiers
    if (DOM.uploadButton && DOM.fileInput) {
        DOM.uploadButton.addEventListener('click', () => DOM.fileInput.click());
    }
    
    if (DOM.uploadVideoBtn && DOM.fileInput) {
        DOM.uploadVideoBtn.addEventListener('click', () => DOM.fileInput.click());
    }
    
    if (DOM.fileInput) {
        DOM.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                addVideos(e.target.files);
                e.target.value = '';
            }
        });
    }
    
    // Recherche
    if (DOM.searchButton) {
        DOM.searchButton.addEventListener('click', handleSearch);
    }
    
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', handleSearch);
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    if (DOM.clearSearchButton) {
        DOM.clearSearchButton.addEventListener('click', clearSearch);
    }
    
    // Navigation sidebar
    if (DOM.sidebarItems && DOM.sidebarItems.length > 0) {
        DOM.sidebarItems.forEach(item => {
            item.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                if (!section) return;
                
                // Mettre à jour la section active
                AppState.currentSection = section;
                AppState.searchTerm = '';
                if (DOM.searchInput) DOM.searchInput.value = '';
                if (DOM.clearSearchButton) DOM.clearSearchButton.style.display = 'none';
                
                // Mettre à jour les styles
                DOM.sidebarItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // Mettre à jour l'affichage
                displayVideos();
                updateUI();
            });
        });
    }
    
    // Clic sur les cartes vidéo (délégation d'événements)
    if (DOM.videoGrid) {
        DOM.videoGrid.addEventListener('click', (e) => {
            const videoCard = e.target.closest('.video-card');
            if (videoCard) {
                const videoId = videoCard.getAttribute('data-video-id');
                if (videoId) {
                    showVideoPlayer(videoId);
                }
            }
        });
    }
    
    // Boutons du lecteur
    if (DOM.backButton) {
        DOM.backButton.addEventListener('click', backToVideoList);
    }
    
    if (DOM.favoriteButton) {
        DOM.favoriteButton.addEventListener('click', toggleFavorite);
    }
    
    if (DOM.deleteButton) {
        DOM.deleteButton.addEventListener('click', deleteVideo);
    }
    
    if (DOM.downloadButton) {
        DOM.downloadButton.addEventListener('click', downloadVideo);
    }
    
    // Bouton "Charger plus"
    if (DOM.loadMoreButton) {
        DOM.loadMoreButton.addEventListener('click', loadMoreVideos);
    }
    
    // Bouton de rafraîchissement
    if (DOM.refreshButton) {
        DOM.refreshButton.addEventListener('click', () => {
            displayVideos();
            showNotification("Liste actualisée", "info");
        });
    }
    
    // Bouton d'ajout de dossier
    if (DOM.addFolderBtn) {
        DOM.addFolderBtn.addEventListener('click', () => {
            showNotification("Fonctionnalité à venir", "info");
        });
    }
    
    // Bouton de thème
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Gestion du clavier
    document.addEventListener('keydown', (e) => {
        // Échap pour quitter le lecteur
        if (e.key === 'Escape' && AppState.isPlayerVisible) {
            backToVideoList();
        }
        
        // Espace pour play/pause dans le lecteur
        if (e.key === ' ' && AppState.isPlayerVisible && DOM.videoPlayer) {
            e.preventDefault();
            if (DOM.videoPlayer.paused) {
                DOM.videoPlayer.play();
            } else {
                DOM.videoPlayer.pause();
            }
        }
        
        // Ctrl+F pour la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (DOM.searchInput) DOM.searchInput.focus();
        }
    });
    
    // Gestion de l'historique navigateur
    window.addEventListener('popstate', (e) => {
        if (AppState.isPlayerVisible) {
            backToVideoList();
        }
    });
    
    // Drag and drop
    setupDragAndDrop();
    
    // Gestion de la déconnexion
    window.addEventListener('beforeunload', () => {
        if (AppState.currentVideo && DOM.videoPlayer && DOM.videoPlayer.src) {
            URL.revokeObjectURL(DOM.videoPlayer.src);
        }
    });
    
    console.log("Écouteurs d'événements configurés");
}

/**
 * Configure le drag and drop
 */
function setupDragAndDrop() {
    const dropZone = DOM.dropZone;
    if (!dropZone) return;
    
    // Prévenir les comportements par défaut
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    // Gérer le drag over
    document.addEventListener('dragover', (e) => {
        AppState.isDragging = true;
        dropZone.classList.add('active');
        document.body.classList.add('drag-over');
    });
    
    // Gérer le drag leave
    document.addEventListener('dragleave', (e) => {
        // Ne retirer que si on quitte vraiment la fenêtre
        if (e.clientX <= 0 || e.clientY <= 0 || 
            e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
            AppState.isDragging = false;
            dropZone.classList.remove('active');
            document.body.classList.remove('drag-over');
        }
    });
    
    // Gérer le drop
    document.addEventListener('drop', (e) => {
        AppState.isDragging = false;
        dropZone.classList.remove('active');
        document.body.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            addVideos(e.dataTransfer.files);
        }
    });
}

// =============================================
// INITIALISATION
// =============================================

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM déjà chargé
    initApp();
}

// Exposer l'API globale
window.YouTubeLocal = {
    initApp,
    addVideos,
    showVideoPlayer,
    backToVideoList,
    toggleFavorite,
    deleteVideo,
    downloadVideo,
    handleSearch,
    clearSearch,
    toggleTheme,
    getStats: () => ({
        totalVideos: AppState.videos.local.length,
        favorites: AppState.videos.favorites.length,
        recent: AppState.videos.recent.length,
        storage: AppState.videos.local.reduce((sum, v) => sum + (v.size || 0), 0)
    }),
    getState: () => ({ ...AppState })
};

console.log(`${CONFIG.APP_NAME} - Script chargé`);
