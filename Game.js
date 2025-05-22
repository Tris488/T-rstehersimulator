let person = 0;
let counter = 0;
let right = 0;
let event;
let eventcount;
let personenCounter = 0; // Zähler für abgehandelte Personen
let dailyVisitors = []; // Array für Personen, die heute schon da waren
const MAX_PERSONEN = 5; // Maximum 5 Personen pro Tag
let auswahl;
let korrekteantwort;
let todaycoins;
$(document).ready(function() {
    loadGameState(); // Lade gespeicherte Daten
    loadDailyVisitors(); // Lade heutige Besucher
    start();
});

function loadGameState() {
    // Lade gespeicherte Daten aus Local Storage
    const savedDays = localStorage.getItem('days');
    const savedMoney = localStorage.getItem('money');

    if (savedDays) {
        $('#days-count').text(savedDays);
    }
    if (savedMoney) {
        $('#coins-count').text(savedMoney);
    }
}

function loadDailyVisitors() {
    // Lade Liste der heutigen Besucher
    const currentDay = localStorage.getItem('days') || '0';
    const savedVisitors = localStorage.getItem(`dailyVisitors_day_${currentDay}`);

    if (savedVisitors) {
        dailyVisitors = JSON.parse(savedVisitors);
    } else {
        dailyVisitors = [];
    }
}

function saveDailyVisitors() {
    // Speichere Liste der heutigen Besucher
    const currentDay = localStorage.getItem('days') || '0';
    localStorage.setItem(`dailyVisitors_day_${currentDay}`, JSON.stringify(dailyVisitors));
}

function saveGameState() {
    // Speichere aktuelle Daten in Local Storage
    localStorage.setItem('days', $('#days-count').text());
    localStorage.setItem('money', $('#coins-count').text());
}

function start() {
    todaycoins=0;
    $("#dialog").empty();
    takeaperson();
}

function takeaperson() {
    eventcount = 0;
    $("#dialog").empty();

    showKonversation([
        "Hallo, bitte den Ausweis!"
    ]);
    showKonversation([
        "Gerne hier!"
    ]);

    // Wähle eine zufällige Person aus, die heute noch nicht da war
    let attempts = 0;
    do {
        person = Math.floor(Math.random() * 8);
        attempts++;

        // Verhindere Endlosschleife falls alle Personen schon da waren
        if (attempts > 50) {
            console.log("Alle verfügbaren Personen wurden bereits verwendet");
            break;
        }
    } while (dailyVisitors.includes(person));

    // Lade Personendaten
    $.getJSON("game.json", function(data) {
        let selectedPerson = data["personen"][person];
        $("#vorname").text(selectedPerson.vorname);
        $("#nachname").text(selectedPerson.nachname);
        $("#geburtstag").text(selectedPerson.geburtstag);
        $("#geschlecht").text(selectedPerson.geschlecht);
        $("#charakter img").attr("src", selectedPerson.charakter);
        $("#picturefeld img").attr("src", selectedPerson.picturefeld);
        event = selectedPerson.event;
        korrekteantwort = selectedPerson.korrekt;

        // Füge Person zur heutigen Besucherliste hinzu
        if (!dailyVisitors.includes(person)) {
            dailyVisitors.push(person);
            saveDailyVisitors();
        }

        // WICHTIG: click() erst aufrufen NACHDEM die Daten geladen sind
        click();
    });
}

function nextPersonOrEndDay() {
    personenCounter++;
    let currentMoney = parseInt($('#coins-count').text()) || 0;

    // Debug: Zeige was verglichen wird
    console.log("Auswahl:", auswahl, "Korrekte Antwort:", korrekteantwort);

    // Belohnung für korrekte Entscheidung
    if (auswahl === korrekteantwort) {
        currentMoney += 10;
        todaycoins +=10;
        console.log("Richtig! +10€");
    } else {
        console.log("Falsch! Kein Geld.");
    }

    $('#coins-count').text(currentMoney);

    if (personenCounter >= MAX_PERSONEN) {
        // Tag beenden nach 5 Personen
        endDay();
    } else {
        // Nächste Person laden
        setTimeout(() => {
            takeaperson();
        }, 3000);
    }
}

function endDay() {
    // Tag-Counter erhöhen
    let currentDays = parseInt($('#days-count').text()) || 0;
    currentDays++;
    $('#days-count').text(currentDays);

    // Bonus für vollständigen Tag
    let currentMoney = parseInt($('#coins-count').text()) || 0;
    currentMoney += 50; // Tagesbonus
    todaycoins +=50;
    $('#coins-count').text(currentMoney);

    // Spielstand speichern
    saveGameState();

    // Neue Tag beginnt - dailyVisitors zurücksetzen
    dailyVisitors = [];
    personenCounter = 0;

    // Zeige Tagesabschluss-Dialog
    showKonversation([
        "Gut gemacht! Dein Arbeitstag ist beendet.",
        `Du hast ${todaycoins}€ verdient.`,
        "Kehre zum Menü zurück..."
    ]);

    // Nach 4 Sekunden zurück zum Gamemenu
    setTimeout(() => {
        window.location.href = 'Gamemenu.html';
    }, 4000);
}

function click() {
    $('#JA').off('click').on('click', function () {
        auswahl = true; // JA = true

        if (event && eventcount === 1) {
            $.getJSON("events.json", function (data) {
                let eventData = data.events[event];
                if (eventData && eventData.konversationJa && eventcount === 1) {
                    showKonversation(eventData.konversationJa);
                    // Nach 3 Sekunden nächste Person oder Tag beenden
                    setTimeout(() => {
                        nextPersonOrEndDay();
                    }, 2000);
                } else {
                    nextPersonOrEndDay();
                }
            });
        } else {
            nextPersonOrEndDay();
        }
    });

    $('#NEIN').off('click').on('click', function () {
        auswahl = false; // NEIN = false

        if (event) {
            $.getJSON("events.json", function (data) {
                let eventData = data.events[event];

                if (eventData && eventData.konversation && eventcount === 0) {
                    // Erste Ablehnung: Dialog anzeigen, eventcount erhöhen
                    showKonversation(eventData.konversation);
                    eventcount++;
                } else if (eventData && eventData.konversationNein && eventcount === 1) {
                    // Zweite Ablehnung: andere Konversation anzeigen,
                    // danach nächste Person oder Tag beenden
                    showKonversation(eventData.konversationNein);
                    setTimeout(() => {
                        nextPersonOrEndDay();
                    }, 1500);
                }
            });
        } else {
            console.log("Kein Event vorhanden.");
            nextPersonOrEndDay();
        }
    });
}

function showKonversation(konvoArray) {
    let $dialog = $("#dialog");
    $dialog.empty();
    konvoArray.forEach((line, index) => {
        setTimeout(() => {
            $dialog.append("<p>" + line + "</p>");
        }, 1000 * index);
    });
}