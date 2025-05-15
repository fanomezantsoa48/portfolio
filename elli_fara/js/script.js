document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Sticky header shadow
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.createElement('div');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    const headerContainer = document.querySelector('.header .container');
    
    if (headerContainer) {
        headerContainer.appendChild(mobileMenuToggle);
        
        mobileMenuToggle.addEventListener('click', function() {
            const nav = document.querySelector('.nav');
            nav.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const eventType = document.getElementById('event-type').value;
            const eventDate = document.getElementById('event-date').value;
            const message = document.getElementById('message').value;
            
            // Here you would typically send the data to a server
            console.log('Form submitted:', {
                name,
                email,
                phone,
                eventType,
                eventDate,
                message
            });
            
            // Show success message
            alert('Merci pour votre message, ' + name + '! Nous vous contacterons bientôt.');
            
            // Reset form
            contactForm.reset();
        });
    }

    // Set active link based on current page
    const currentPage = location.pathname.split('/').pop().replace('.html', '');
    if (currentPage === '') currentPage = 'index';
    
    document.querySelectorAll('.nav a').forEach(link => {
        const linkPage = link.getAttribute('href').replace('.html', '');
        if (linkPage === currentPage || 
            (currentPage === 'index' && linkPage === '#about')) {
            link.classList.add('active');
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if(mobileToggle) {
        const icon = mobileToggle.querySelector('i');
        
        mobileToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        // Fermer le menu quand on clique à l'extérieur
        document.addEventListener('click', function(e) {
            if(!nav.contains(e.target) && e.target !== mobileToggle) {
                nav.classList.remove('active');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                document.body.classList.remove('no-scroll');
            }
        });
    }
});
