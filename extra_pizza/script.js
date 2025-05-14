document.addEventListener('DOMContentLoaded', function() {
    // Initialisation EmailJS
    emailjs.init("YOUR_USER_ID"); // Remplacez par votre User ID
    
    // Menu Mobile
    const navbarToggle = document.getElementById('mobile-menu');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    navbarToggle.addEventListener('click', function() {
        navbarToggle.classList.toggle('active');
        navbarMenu.classList.toggle('active');
    });
    
    // Fermer le menu mobile quand on clique sur un lien
    const navbarLinks = document.querySelectorAll('.navbar-link');
    navbarLinks.forEach(link => {
        link.addEventListener('click', function() {
            navbarToggle.classList.remove('active');
            navbarMenu.classList.remove('active');
        });
    });
    
    // Changement de la navbar au scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Animation des éléments au scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.about-content, .menu-item, .chef-container, .gallery-item, .testimonial, .reservation-container, .contact-container');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Pour les éléments déjà visibles au chargement
    
    // Gestion du formulaire de réservation
    const reservationForm = document.getElementById('reservationForm');
    
    reservationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        // Afficher le statut d'envoi
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        
        // Récupérer les données du formulaire
        const formData = {
            name: document.getElementById('reservation-name').value,
            email: document.getElementById('reservation-email').value,
            phone: document.getElementById('reservation-phone').value,
            date: document.getElementById('reservation-date').value,
            time: document.getElementById('reservation-time').value,
            guests: document.getElementById('reservation-guests').value,
            notes: document.getElementById('reservation-notes').value
        };
        
        // Envoyer l'email via EmailJS
        emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
            to_email: "fitahianafenofanomezana@gmail.com",
            from_name: formData.name,
            from_email: formData.email,
            from_phone: formData.phone,
            reservation_date: formData.date,
            reservation_time: formData.time,
            guests_number: formData.guests,
            special_requests: formData.notes || 'Aucune demande particulière'
        })
        .then(function(response) {
            // Afficher une notification de succès
            showNotification('Votre réservation a bien été envoyée ! Nous vous contacterons pour confirmation.', 'success');
            
            // Réinitialiser le formulaire
            reservationForm.reset();
        }, function(error) {
            // Afficher une notification d'erreur
            showNotification('Une erreur est survenue. Veuillez réessayer ou nous contacter directement.', 'error');
            console.error('EmailJS Error:', error);
        })
        .finally(function() {
            // Réinitialiser le bouton
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        });
    });
    
    // Fonction pour afficher les notifications
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <p>${message}</p>
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Fermer la notification après 5s
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Fermer la notification manuellement
        notification.querySelector('.close-notification').addEventListener('click', function() {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Ajouter du style pour les notifications
    const notificationStyle = document.createElement('style');
    notificationStyle.innerHTML = `
        .notification {
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 20px;
            border-radius: 5px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 400px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            transform: translateY(100px);
            opacity: 0;
            animation: slideIn 0.5s forwards;
        }
        
        .notification.success {
            background-color: #28a745;
        }
        
        .notification.error {
            background-color: #dc3545;
        }
        
        .notification p {
            margin: 0;
            margin-right: 20px;
        }
        
        .close-notification {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 16px;
        }
        
        .fade-out {
            animation: fadeOut 0.3s forwards;
        }
        
        @keyframes slideIn {
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: translateY(100px);
            }
        }
    `;
    document.head.appendChild(notificationStyle);
});
