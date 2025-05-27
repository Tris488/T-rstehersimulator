$(document).ready(function() {
    loadGameState();
});

function loadGameState() {
    // Lade gespeicherte Daten aus Local Storage
    const savedDays = localStorage.getItem('days');
    const savedMoney = localStorage.getItem('money');

    console.log("Loading game state - Days:", savedDays, "Money:", savedMoney);

    // Setze Default-Werte falls noch keine Daten gespeichert sind
    if (savedDays !== null && savedDays !== undefined) {
        $('#days-count').text(savedDays);
    } else {
        $('#days-count').text('1');
        localStorage.setItem('days', '1');
    }

    if (savedMoney !== null && savedMoney !== undefined) {
        $('#coins-count').text(savedMoney);
    } else {
        $('#coins-count').text('0');
        localStorage.setItem('money', '0');
    }

    // NEU: Prüfe auf Endlos-Modus
    if (localStorage.getItem('clubOwner') === 'true') {
        showEndlosModus();
    }
}

// Neue Funktion: Zeigt Endlos-Modus an
function showEndlosModus() {
    // Füge Endlos-Modus Badge hinzu
    if (!$('#endlos-badge').length) {
        $('#header').after(`
            <div id="endlos-badge" style="
                background: linear-gradient(135deg, #ff00de 0%, #8a2be2 100%);
                color: white;
                padding: 10px 30px;
                border-radius: 20px;
                font-family: 'Staatliches', sans-serif;
                font-size: 20px;
                margin: 20px 0;
                box-shadow: 0 0 20px rgba(255, 0, 222, 0.5);
                animation: pulse 2s infinite;
            ">
                🎮 ENDLOS-MODUS - CLUB-BESITZER 🎮
            </div>
        `);

        // Füge CSS Animation hinzu
        if (!$('#endlos-animation').length) {
            $('<style id="endlos-animation">')
                .text(`
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                `)
                .appendTo('head');
        }
    }
}

// Optional: Funktion zum Zurücksetzen des Spiels
function resetGame() {
    localStorage.removeItem('days');
    localStorage.removeItem('money');
    $('#days-count').text('1');
    $('#coins-count').text('0');
}