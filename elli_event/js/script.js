document.addEventListener('DOMContentLoaded', function() {
    // Header Scroll-Effekt
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile-Menü-Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
            document.body.classList.toggle('no-scroll');
        });
    }

    // Menü schließen bei Klick außerhalb
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && e.target !== mobileMenuToggle) {
            nav.classList.remove('active');
            if (mobileMenuToggle) {
                const icon = mobileMenuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
            document.body.classList.remove('no-scroll');
        }
    });

    // Kontaktformular-Verarbeitung
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Formularvalidierung
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const eventType = document.getElementById('event-type').value;
            const eventDate = document.getElementById('event-date').value;
            const message = document.getElementById('message').value.trim();
            
            if (!name || !email || !eventType || !eventDate || !message) {
                showConfirmationMessage('Bitte füllen Sie alle Pflichtfelder aus', 'error');
                return;
            }
            
            // Formularübermittlung simulieren
            setTimeout(() => {
                // E-Mail senden (Simulation)
                const phone = document.getElementById('phone').value.trim();
                const emailBody = `Name: ${name}%0D%0AE-Mail: ${email}%0D%0ATelefon: ${phone || 'Nicht angegeben'}%0D%0AVeranstaltungsart: ${eventType}%0D%0ADatum: ${eventDate}%0D%0ANachricht: ${message}`;
                
                // Standard-E-Mail-Client öffnen
                window.open(`mailto:fitahianafenofanomezana@gmail.com?subject=Reservierungsanfrage - ${name}&body=${emailBody}`, '_blank');
                
                // Bestätigungsnachricht anzeigen
                showConfirmationMessage(`Vielen Dank ${name}, Ihre Anfrage wurde erfolgreich versendet. Wir werden uns in Kürze bei Ihnen melden.`, 'success');
                
                // Formular zurücksetzen
                contactForm.reset();
            }, 1000);
        });
    }
    
    // Aktiven Navigationslink markieren
    const currentPage = location.pathname.split('/').pop().replace('.html', '') || 'index';
    document.querySelectorAll('.nav a').forEach(link => {
        const linkPage = link.getAttribute('href').replace('.html', '');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
    
    // Sanftes Scrollen für Ankerlinks
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 90,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Bestätigungsnachricht anzeigen
function showConfirmationMessage(message, type) {
    const confirmationElement = document.getElementById('confirmation-message');
    if (!confirmationElement) return;
    
    confirmationElement.textContent = message;
    confirmationElement.style.display = 'block';
    
    // Stil nach Nachrichtentyp
    if (type === 'success') {
        confirmationElement.style.backgroundColor = '#dff0d8';
        confirmationElement.style.color = '#3c763d';
        confirmationElement.style.border = '1px solid #d6e9c6';
    } else if (type === 'error') {
        confirmationElement.style.backgroundColor = '#f2dede';
        confirmationElement.style.color = '#a94442';
        confirmationElement.style.border = '1px solid #ebccd1';
    }
    
    // Nach 5 Sekunden ausblenden
    setTimeout(() => {
        confirmationElement.style.display = 'none';
    }, 5000);
}
