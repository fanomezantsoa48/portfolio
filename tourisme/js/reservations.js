document.getElementById('form-reservation').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const destination = document.getElementById('destination').value;
    const dateDepart = document.getElementById('date-depart').value;
    const nombrePersonnes = document.getElementById('nombre-personnes').value;
    const email = document.getElementById('email').value;
    const telephone = document.getElementById('telephone').value;
    
    // Préparer le message pour WhatsApp
    const whatsappMessage = `Bonjour, je souhaite réserver un voyage à ${destination} pour ${nombrePersonnes} personne(s) à partir du ${dateDepart}. Mon email: ${email}.`;
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Préparer le mailto
    const mailSubject = `Réservation voyage à ${destination}`;
    const mailBody = `Bonjour,\n\nJe souhaite réserver un voyage à ${destination} pour ${nombrePersonnes} personne(s) à partir du ${dateDepart}.\n\nMon numéro de téléphone: ${telephone}\n\nCordialement,`;
    
    // Options d'envoi
    const whatsappUrl = `https://wa.me/261341234567?text=${encodedMessage}`;
    const mailtoUrl = `mailto:fitahianafenofanomezana@gmail.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
    
    // Demander à l'utilisateur comment il veut envoyer sa demande
    if(confirm('Voulez-vous envoyer votre demande via WhatsApp?')) {
        window.open(whatsappUrl, '_blank');
    } else {
        window.location.href = mailtoUrl;
    }
    
    // Réinitialiser le formulaire
    this.reset();
});
