// Menu Toggle for Mobile
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav ul');
    
    menuToggle.addEventListener('click', function() {
        nav.classList.toggle('show');
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const statusElement = document.getElementById('status');
            
            statusElement.innerHTML = "Envoi en cours...";
            statusElement.className = "status loading";
            statusElement.style.display = "block";

            // Using Formspree.io for form submission
            fetch('https://formspree.io/f/YOUR_FORM_ID', {
                method: 'POST',
                body: new FormData(contactForm),
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    statusElement.innerHTML = "Message envoyé avec succès!";
                    statusElement.className = "status success";
                    contactForm.reset();
                } else {
                    throw new Error('Erreur lors de l\'envoi');
                }
            })
            .catch(error => {
                statusElement.innerHTML = "Erreur: " + error.message;
                statusElement.className = "status error";
            });
        });
    }

    // Animation on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.project-card, .skill-category');
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Set initial state for animated elements
    document.querySelectorAll('.project-card, .skill-category').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Run once on load
});

<script>
  document.getElementById('mobile-menu').addEventListener('click', function() {
    document.getElementById('main-menu').classList.toggle('active');
  });
</script>

document.getElementById('mobileToggle').addEventListener('click', function() {
  const menu = document.getElementById('mainMenu');
  this.classList.toggle('active');
  menu.classList.toggle('active');
});

// Animation pour les icônes de navigation
document.querySelectorAll('.bottom-nav a').forEach(link => {
  link.addEventListener('click', function(e) {
    // Retire la classe active de tous les liens
    document.querySelectorAll('.bottom-nav a').forEach(item => {
      item.classList.remove('active');
    });
    // Ajoute la classe active au lien cliqué
    this.classList.add('active');
  });
});
