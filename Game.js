let person = 0;
let counter = 0;
let right = 0;
let event;
let eventcount;
let personenCounter = 0;
let dailyVisitors = [];
const MAX_PERSONEN = 5;
let auswahl;
let korrekteantwort;
let todaycoins;
$(document).ready(function() {
    loadGameState();
    loadDailyVisitors();
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

    const currentDay = localStorage.getItem('days') || '0';
    const savedVisitors = localStorage.getItem(`dailyVisitors_day_${currentDay}`);

    if (savedVisitors) {
        dailyVisitors = JSON.parse(savedVisitors);
    } else {
        dailyVisitors = [];
    }
}

function saveDailyVisitors() {
    const currentDay = localStorage.getItem('days') || '0';
    localStorage.setItem(`dailyVisitors_day_${currentDay}`, JSON.stringify(dailyVisitors));
}

function saveGameState() {
    localStorage.setItem('days', $('#days-count').text());
    localStorage.setItem('money', $('#coins-count').text());
}
function openRulebook() {
    $('#book-icon').addClass('hidden');

    $('#rulebook')
        .removeClass('hidden closing')
        .addClass('opening');

    setTimeout(() => {
        $('#rulebook').removeClass('opening');
    }, 500);
}

function closeRulebook() {
    $('#rulebook').addClass('closing');

    setTimeout(() => {
        $('#rulebook')
            .addClass('hidden')
            .removeClass('closing');
        $('#book-icon').removeClass('hidden');
    }, 500);
}

function updateDailyRules() {
    const currentDay =  localStorage.getItem('days');

    $.getJSON("rules.json", function(data) {
        $('#rulebook-day').text(currentDay);

        const tagesregel = data.tagesregeln[currentDay] || data.tagesregeln["1"];

        $('.book-left h2').text(`Tag ${currentDay}: ${tagesregel.titel}`);

        const regelHTML = tagesregel.regeln.map(regel => `<li>${regel}</li>`).join('');
        $('#special-rules').html(regelHTML);

        $('.book-right p strong').eq(0).text(`${tagesregel.bonus.proRichtig}€`);
        $('.book-right p strong').eq(1).text(`${tagesregel.bonus.tagesbonus}€`);

        if (data.warnungen[currentDay]) {
            $('.book-right p[style*="italic"]').text(`"${data.warnungen[currentDay]}"`);
        }



    });
}

function initRulebook() {
    const savedDay = localStorage.getItem('days');
    const currentDay = savedDay ? parseInt(savedDay) : 1;

    $('#rulebook-day').text(currentDay);

    updateDailyRules(currentDay);

    openRulebook();

    setTimeout(() => {
        closeRulebook();
    }, 5000);
}

$(document).ready(function() {
    $('#book-icon').on('click', function() {
        openRulebook();
    });

    $('.close-book').on('click', function() {
        closeRulebook();
    });
});

function start() {
    todaycoins=0;
    $("#dialog").empty();
    takeaperson();
    initRulebook();
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
    let attempts = 0;
    do {
        person = Math.floor(Math.random() * 8);
        attempts++;

        if (attempts > 50) {
            console.log("Alle verfügbaren Personen wurden bereits verwendet");
            break;
        }
    } while (dailyVisitors.includes(person));

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

        if (!dailyVisitors.includes(person)) {
            dailyVisitors.push(person);
            saveDailyVisitors();
        }

        click();
    });
}

function nextPersonOrEndDay() {
    personenCounter++;
    let currentMoney = parseInt($('#coins-count').text()) || 0;

    console.log("Auswahl:", auswahl, "Korrekte Antwort:", korrekteantwort);

    if (auswahl === korrekteantwort) {
        currentMoney += 10;
        todaycoins +=10;
        console.log("Richtig! +10€");
    } else {
        console.log("Falsch! Kein Geld.");
    }

    $('#coins-count').text(currentMoney);

    if (personenCounter >= MAX_PERSONEN) {

        endDay();
    } else {
        setTimeout(() => {
            takeaperson();
        }, 3000);
    }
}

function endDay() {
    let currentDays = parseInt($('#days-count').text()) || 0;
    currentDays++;
    $('#days-count').text(currentDays);


    let currentMoney = parseInt($('#coins-count').text()) || 0;
    currentMoney += 50; // Tagesbonus
    todaycoins +=50;
    $('#coins-count').text(currentMoney);

    saveGameState();

    dailyVisitors = [];
    personenCounter = 0;

    showKonversation([
        "Gut gemacht! Dein Arbeitstag ist beendet.",
        `Du hast ${todaycoins}€ verdient.`,
        "Kehre zum Menü zurück..."
    ]);

    setTimeout(() => {
        window.location.href = 'Gamemenu.html';
    }, 4000);
}

function click() {
    $('#JA').off('click').on('click', function () {
        auswahl = true;

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
        auswahl = false;

        if (event) {
            $.getJSON("events.json", function (data) {
                let eventData = data.events[event];

                if (eventData && eventData.konversation && eventcount === 0) {
                    // Erste Ablehnung: Dialog anzeigen, eventcount erhöhen
                    showKonversation(eventData.konversation);
                    eventcount++;
                } else if (eventData && eventData.konversationNein && eventcount === 1) {

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