$(document).ready(function() {
    updateStats();

    // Event Listeners
    $('#reset-button').click(showResetModal);
    $('#confirm-button').click(confirmReset);
    $('#cancel-button').click(closeResetModal);

    // Modal schließen wenn außerhalb geklickt wird
    $(window).click(function(event) {
        if (event.target.id === 'resetModal') {
            closeResetModal();
        }
    });
});

function updateStats() {
    const days = localStorage.getItem('days') || '0';
    const money = localStorage.getItem('money') || '0';

    $('#current-day').text(days);
    $('#current-money').text(money);
    $('#modal-day').text(days);
    $('#modal-money').text(money);
}

function showResetModal() {
    $('#resetModal').fadeIn();
}

function closeResetModal() {
    $('#resetModal').fadeOut();
}

function confirmReset() {
    // Lösche alle Local Storage Einträge für das Spiel
    localStorage.removeItem('days');
    localStorage.removeItem('money');

    // Lösche auch die täglichen Besucher für alle Tage
    for (let i = 0; i <= 100; i++) {
        localStorage.removeItem(`dailyVisitors_day_${i}`);
    }

    // NEU: Lösche alle Event-Entscheidungen
    localStorage.removeItem('frauenschlaegerChoice');
    localStorage.removeItem('frauenschlaegerDay');
    localStorage.removeItem('frauenschlaegerDone');
    localStorage.removeItem('polizistComing');
    localStorage.removeItem('aliEventDone');

    // NEU: Lösche Kosten-Speicherstände
    localStorage.removeItem('moneyBeforeExpenses');
    localStorage.removeItem('dayBeforeExpenses');

    // NEU: Lösche gekaufte Items
    localStorage.removeItem('purchasedItems');
    localStorage.removeItem('itemEffects');

    // Modal schließen
    closeResetModal();

    // Stats aktualisieren
    updateStats();

    // Erfolgsnachricht anzeigen
    $('#success-message').fadeIn().delay(3000).fadeOut();
}