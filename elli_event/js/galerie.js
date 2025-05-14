document.addEventListener('DOMContentLoaded', function() {
    // Verbesserte Lightbox
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.close-lightbox');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Geordnetes Array der Bilder erstellen
    const images = Array.from(galleryItems).map(item => ({
        src: item.querySelector('img').src,
        alt: item.querySelector('img').alt,
        index: parseInt(item.getAttribute('data-index'))
    })).sort((a, b) => a.index - b.index);

    let currentIndex = 0;

    // Lightbox öffnen
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            currentIndex = parseInt(this.getAttribute('data-index'));
            updateLightbox();
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    });

    // Lightbox schließen
    closeBtn.addEventListener('click', function() {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Navigation
    prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightbox();
    });

    nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        updateLightbox();
    });

    // Tastatur-Navigation
    document.addEventListener('keydown', function(e) {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'ArrowLeft') prevBtn.click();
            else if (e.key === 'ArrowRight') nextBtn.click();
            else if (e.key === 'Escape') closeBtn.click();
        }
    });

    // Lightbox aktualisieren
    function updateLightbox() {
        const currentImage = images.find(img => img.index === currentIndex) || images[0];
        lightboxImg.src = currentImage.src;
        lightboxImg.alt = currentImage.alt;
        lightboxCaption.textContent = currentImage.alt;
        
        // Vorladen der nächsten und vorherigen Bilder
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        const nextIndex = (currentIndex + 1) % images.length;
        
        const preloadPrev = new Image();
        preloadPrev.src = images[prevIndex].src;
        
        const preloadNext = new Image();
        preloadNext.src = images[nextIndex].src;
    }
    
    // Lazy Loading für Bilder
    const imagesToLoad = document.querySelectorAll('img[data-src]');
    
    const imgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.onload = () => {
                    img.classList.add('loaded');
                };
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '200px 0px'
    });
    
    imagesToLoad.forEach(img => {
        imgObserver.observe(img);
    });
});
