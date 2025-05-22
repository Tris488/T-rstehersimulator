$(document).ready(function() {
    loadGameState();
});

function loadGameState() {
    // Lade gespeicherte Daten aus Local Storage
    const savedDays = localStorage.getItem('days');
    const savedMoney = localStorage.getItem('money');

    // Setze Default-Werte falls noch keine Daten gespeichert sind
    if (savedDays) {
        $('#days-count').text(savedDays);
    } else {
        $('#days-count').text('0');
        localStorage.setItem('days', '0');
    }

    if (savedMoney) {
        $('#coins-count').text(savedMoney);
    } else {
        $('#coins-count').text('0');
        localStorage.setItem('money', '0');
    }
}

// Optional: Funktion zum Zurücksetzen des Spiels
function resetGame() {
    localStorage.removeItem('days');
    localStorage.removeItem('money');
    $('#days-count').text('0');
    $('#coins-count').text('0');
}