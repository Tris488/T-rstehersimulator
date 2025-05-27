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
let currentRules = null;
let frauenschlaegerEvent = false; // Für das spezielle Event

$(document).ready(function() {
    loadGameState();
    loadDailyVisitors();
    loadTodayRules();
    checkSpecialEvents(); // Neue Funktion
    start();
});

// Neue Funktion: Prüft auf spezielle Events
function checkSpecialEvents() {
    const currentDay = parseInt($('#days-count').text()) || 0;
    const eventChoice = localStorage.getItem('frauenschlaegerChoice');

    console.log("checkSpecialEvents: Tag", currentDay, "Choice:", eventChoice);

    // Prüfe ob Polizist kommen soll (Tag nach dem Event + schlechte Wahl)
    if (eventChoice === 'schlagen' && currentDay === (parseInt(localStorage.getItem('frauenschlaegerDay')) + 1)) {
        // Polizist wird als 2. Gast kommen
        console.log("Polizist wird heute kommen!");
        localStorage.setItem('polizistComing', 'true');
    }
}

// Neue Funktion: Lädt die Regeln für den aktuellen Tag
function loadTodayRules() {
    const currentDay = localStorage.getItem('days') || '1';

    $.getJSON("rules.json", function(data) {
        // Finde die passende Tagesregel
        if (data.tagesregeln[currentDay]) {
            currentRules = data.tagesregeln[currentDay];
        } else {
            // Für Tage über 5: Nutze die höchste verfügbare oder default
            const verfuegbareTage = Object.keys(data.tagesregeln)
                .filter(key => !isNaN(key))
                .map(Number)
                .sort((a, b) => b - a);

            let gefunden = false;
            for (let tag of verfuegbareTage) {
                if (tag <= parseInt(currentDay)) {
                    currentRules = data.tagesregeln[tag];
                    gefunden = true;
                    break;
                }
            }

            // Fallback auf default
            if (!gefunden && data.tagesregeln["default"]) {
                currentRules = data.tagesregeln["default"];
            } else if (!gefunden) {
                currentRules = data.tagesregeln["1"];
            }
        }

        console.log("Geladene Regeln für Tag", currentDay, ":", currentRules);
    }).fail(function() {
        console.error("Fehler beim Laden der rules.json!");
        // Fallback wenn rules.json nicht geladen werden kann
        currentRules = {
            erlaubteStile: ["assi", "normal", "schick"],
            bonus: { proRichtig: 10, tagesbonus: 50 }
        };
    });
}

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
    const currentDay = localStorage.getItem('days') || '1';

    $.getJSON("rules.json", function(data) {
        $('#rulebook-day').text(currentDay);

        // Finde die passende Tagesregel (nutze die höchste verfügbare, wenn der Tag größer ist)
        let tagesregel;
        if (data.tagesregeln[currentDay]) {
            tagesregel = data.tagesregeln[currentDay];
        } else {
            // Finde die höchste verfügbare Regel
            const verfuegbareTage = Object.keys(data.tagesregeln).map(Number).sort((a, b) => b - a);
            for (let tag of verfuegbareTage) {
                if (tag <= currentDay) {
                    tagesregel = data.tagesregeln[tag];
                    break;
                }
            }
            // Fallback auf Tag 1
            if (!tagesregel) {
                tagesregel = data.tagesregeln["1"];
            }
        }

        $('.book-left h2').text(`Tag ${currentDay}: ${tagesregel.titel}`);

        const regelHTML = tagesregel.regeln.map(regel => `<li>${regel}</li>`).join('');
        $('#special-rules').html(regelHTML);

        $('.book-right p strong').eq(0).text(`${tagesregel.bonus.proRichtig}€`);
        $('.book-right p strong').eq(1).text(`${tagesregel.bonus.tagesbonus}€`);

        // Zeige erlaubte Stile
        const erlaubteStileText = `Erlaubte Stile: ${tagesregel.erlaubteStile.join(', ')}`;
        if (!$('#allowed-styles').length) {
            $('.book-left').append(`<p id="allowed-styles" style="color: #ff00de; margin-top: 10px;"><strong>${erlaubteStileText}</strong></p>`);
        } else {
            $('#allowed-styles').html(`<strong>${erlaubteStileText}</strong>`);
        }

        if (data.warnungen && data.warnungen[currentDay]) {
            $('.book-right p[style*="italic"]').text(`"${data.warnungen[currentDay]}"`);
        }
    });
}

function initRulebook() {
    const savedDay = localStorage.getItem('days');
    const currentDay = savedDay ? parseInt(savedDay) : 1;

    $('#rulebook-day').text(currentDay);

    updateDailyRules();

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
    todaycoins = 0;
    personenCounter = 0; // Reset für neuen Tag
    $("#dialog").empty();

    // Debug Info
    const currentDay = parseInt($('#days-count').text()) || 0;
    console.log("Starting day:", currentDay);

    takeaperson();
    initRulebook();
}

// Neue Funktion: Prüft ob Person eingelassen werden darf
function checkPersonRules(personData) {
    if (!currentRules) return { allowed: true, reason: "" }; // Falls Regeln noch nicht geladen

    // Alterscheck
    const age = calculateAge(personData.geburtstag);
    if (age < 18) {
        return { allowed: false, reason: "Minderjährig - kein Einlass unter 18!" };
    }

    // Style-Check mit "assi", "normal", "schick"
    if (personData.stil && currentRules.erlaubteStile) {
        if (!currentRules.erlaubteStile.includes(personData.stil)) {
            return { allowed: false, reason: "Tut mir leid, Sie erfüllen den Dresscode nicht." };
        }
    }

    // Prüfe auf falschen Ausweis (event)
    if (personData.event === "falscherausweis") {
        return { allowed: false, reason: "Der Ausweis ist gefälscht!" };
    }

    return { allowed: true, reason: "" };
}

// Neue Funktion: Berechnet Alter aus Geburtsdatum
function calculateAge(geburtsdatum) {
    const parts = geburtsdatum.split('.');
    const birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

function takeaperson() {
    eventcount = 0;
    $("#dialog").empty();

    showKonversation([
        "Hallo, bitte den Ausweis!"
    ]);

    let attempts = 0;
    do {
        do{person = Math.floor(Math.random() * 17);
        }while(person!=8);


        attempts++;

        if (attempts > 50) {
            console.log("Alle verfügbaren Personen wurden bereits verwendet");
            break;
        }
    } while (dailyVisitors.includes(person));

    $.getJSON("game.json", function(data) {
        // NEU: Prüfe auf Ali-Event (Tag 4, Person 4)
        const currentDay = parseInt($('#days-count').text()) || 0;
        if (currentDay === 4 && personenCounter === 3 && !localStorage.getItem('aliEventDone')) {
            // Erzwinge Ali als 4. Person
            person = 8; // Ali's ID
            dailyVisitors = dailyVisitors.filter(id => id !== 8);
            console.log("Ali-Event: Forciere Ali als 4. Person");
        }

        let selectedPerson = data["personen"][person];
        $("#vorname").text(selectedPerson.vorname);
        $("#nachname").text(selectedPerson.nachname);
        $("#geburtstag").text(selectedPerson.geburtstag);
        $("#geschlecht").text(selectedPerson.geschlecht);
        $("#charakter img").attr("src", selectedPerson.charakter);
        $("#picturefeld img").attr("src", selectedPerson.picturefeld);
        event = selectedPerson.event;

        // NEU: Spezial-Dialog für Ali
        if (selectedPerson.event === 'ali') {
            console.log("Ali-Event: Zeige Start-Dialog");
            setTimeout(() => {
                showKonversation([
                    "Vallah du Pissa, hier mein Ausweis aber lass mich schnell rein!"
                ]);
            }, 1500);
        } else {
            // Normaler Dialog für andere
            setTimeout(() => {
                showKonversation([
                    "Gerne hier!"
                ]);
            }, 1500);
        }

        // NEU: Bestimme korrekte Antwort basierend auf Regeln
        const rulesCheck = checkPersonRules(selectedPerson);
        korrekteantwort = rulesCheck.allowed;

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
        // Richtige Entscheidung - Bonus aus rules.json
        const bonus = currentRules ? currentRules.bonus.proRichtig : 10;
        currentMoney += bonus;
        todaycoins += bonus;
        console.log(`Richtig! +${bonus}€`);
        if (localStorage.getItem('clubOwner') === 'true') {
            // 20% Bonus für Club-Besitzer
            const extraBonus = Math.floor(bonus * 0.2);
            currentMoney += extraBonus;
            todaycoins += extraBonus;
            console.log(`Club-Besitzer Bonus: +${extraBonus}€`);
        }
    } else {
        console.log("Falsch! Kein Geld.");
    }

    $('#coins-count').text(currentMoney);

    // NEU: Prüfe auf Frauenschläger-Event (Tag 2, nach 2. Gast)
    const currentDay = parseInt($('#days-count').text()) || 0;
    console.log("Checking event: Tag", currentDay, "Besucher", personenCounter);

    if (currentDay === 2 && personenCounter === 2 && !localStorage.getItem('frauenschlaegerDone')) {
        console.log("Triggering Frauenschläger Event!");
        setTimeout(() => {
            showFrauenschlaegerEvent();
        }, 2000);
        return;
    }

    // NEU: Prüfe auf Polizist-Event
    if (personenCounter === 2 && localStorage.getItem('polizistComing') === 'true') {
        console.log("Triggering Polizist Event!");
        setTimeout(() => {
            showPolizistEvent();
        }, 2000);
        return;
    }

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
    // Tagesbonus aus rules.json
    const tagesbonus = currentRules ? currentRules.bonus.tagesbonus : 50;
    currentMoney += tagesbonus;
    todaycoins += tagesbonus;
    $('#coins-count').text(currentMoney);

    // WICHTIG: Speichere ZUERST bevor andere Funktionen aufgerufen werden
    localStorage.setItem('days', currentDays);
    localStorage.setItem('money', currentMoney);

    // NEU: Speichere auch den Stand VOR den Kosten für mögliches Zurücksetzen
    localStorage.setItem('moneyBeforeExpenses', currentMoney);
    localStorage.setItem('dayBeforeExpenses', currentDays);

    dailyVisitors = [];
    personenCounter = 0;

    showKonversation([
        "Gut gemacht! Dein Arbeitstag ist beendet.",
        `Du hast ${todaycoins}€ verdient.`,
        "Zeit für die Abrechnung..."
    ]);

    // NEU: Zeige Investment-Event ODER Kosten-Bildschirm
    setTimeout(() => {
        // NEU: Prüfe auf Club-Investment Event (Ende Tag 6)
        const currentDay = parseInt($('#days-count').text()) || 0;
        if (currentDay === 6) {
            showClubInvestmentEvent();
        } else {
            showKostenBildschirm();
        }
    }, 3000);
}


function click() {
    $('#JA').off('click').on('click', function () {
        auswahl = true;

        if (event && eventcount === 1) {
            $.getJSON("events.json", function (data) {
                let eventData = data.events[event];
                if (eventData && eventData.konversationJa && eventcount === 1) {
                    showKonversation(eventData.konversationJa);
                    setTimeout(() => {
                        nextPersonOrEndDay();
                    }, 2000);
                } else {
                    nextPersonOrEndDay();
                }
            });
        } else {
            // NEU: Zeige Grund bei falscher Entscheidung
            if (!korrekteantwort) {
                const rulesCheck = checkPersonRules(getCurrentPerson());
                showKonversation([rulesCheck.reason]);
                setTimeout(() => {
                    nextPersonOrEndDay();
                }, 2000);
            } else {
                nextPersonOrEndDay();
            }
        }
    });

    $('#NEIN').off('click').on('click', function () {
        auswahl = false;

        console.log("NEIN geklickt - Event:", event, "Eventcount:", eventcount);

        if (event) {
            $.getJSON("events.json", function (data) {
                let eventData = data.events[event];
                console.log("Event Data geladen:", eventData);

                if (eventData && eventData.konversation && eventcount === 0) {
                    console.log("Zeige erste Konversation");
                    showKonversation(eventData.konversation);
                    eventcount++;

                    // NEU: Spezieller Check für Ali NACH eventcount++
                    if (event === 'ali') {
                        console.log("Ali-Event erkannt! Starte Eskalation...");
                        setTimeout(() => {
                            showAliEvent();
                        }, 3000);
                        return;
                    }

                } else if (eventData && eventData.konversationNein && eventcount === 1) {
                    showKonversation(eventData.konversationNein);
                    setTimeout(() => {
                        nextPersonOrEndDay();
                    }, 1500);
                } else {
                    console.log("Keine passende Konversation gefunden");
                    nextPersonOrEndDay();
                }
            }).fail(function() {
                console.error("Fehler beim Laden der events.json!");
            });
        } else {
            // NEU: Zeige Grund wenn korrekt abgewiesen
            if (!korrekteantwort) {
                const rulesCheck = checkPersonRules(getCurrentPerson());
                showKonversation([rulesCheck.reason]);
            }
            nextPersonOrEndDay();
        }
    });
}

// Neue Hilfsfunktion
function getCurrentPerson() {
    // Hole die aktuelle Person-Daten
    return {
        geburtstag: $("#geburtstag").text(),
        stil: $("#charakter img").attr("data-stil") || "normal", // Falls Stil im data-Attribut
        event: event
    };
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
// Neue Funktion: Zeigt das Frauenschläger-Event
function showFrauenschlaegerEvent() {
    // Verstecke normale UI
    $('#JA, #NEIN').hide();

    // Zeige Event-Dialog
    $("#dialog").empty().append(`
        <div style="background: rgba(255,0,0,0.1); padding: 20px; border-radius: 10px; border: 2px solid red;">
            <p style="font-size: 24px; color: #ff0000;">⚠️ NOTFALL ⚠️</p>
            <p>Du bekommst den Funkspruch, dass jemand seine Frau im Club schlägt!</p>
            <p>Du gehst rein und stellst ihn.</p>
            <p style="margin-top: 20px;">Was machst du?</p>
        </div>
    `);

    // Zeige spezielle Buttons
    setTimeout(() => {
        $('.button').append(`
            <div id="FESTNAHME" style="background: linear-gradient(to right, #2980b9, #6dd5fa); width: 45%; padding: 15px; border-radius: 10px; color: white; text-align: center; cursor: pointer; display: inline-block; margin: 0 2%;">
                §127 StPO - Festnahme
            </div>
            <div id="RACHE" style="background: linear-gradient(to right, #c62828, #ff8a80); width: 45%; padding: 15px; border-radius: 10px; color: white; text-align: center; cursor: pointer; display: inline-block; margin: 0 2%;">
                Selbstjustiz
            </div>
        `);

        // Event Handler
        $('#FESTNAHME').on('click', function() {
            handleFrauenschlaegerChoice('festnahme');
        });

        $('#RACHE').on('click', function() {
            handleFrauenschlaegerChoice('schlagen');
        });
    }, 1000);
}

// Neue Funktion: Verarbeitet die Wahl beim Frauenschläger
function handleFrauenschlaegerChoice(choice) {
    localStorage.setItem('frauenschlaegerChoice', choice);
    localStorage.setItem('frauenschlaegerDay', $('#days-count').text());
    localStorage.setItem('frauenschlaegerDone', 'true');

    $('#FESTNAHME, #RACHE').remove();

    if (choice === 'festnahme') {
        showKonversation([
            "Du nimmst ihn nach §127 StPO vorläufig fest.",
            "Die Polizei trifft ein und übernimmt.",
            "Gut gemacht! Die Frau bedankt sich bei dir.",
            "+50€ Bonus für professionelles Verhalten!"
        ]);

        let currentMoney = parseInt($('#coins-count').text()) || 0;
        currentMoney += 50;
        todaycoins += 50;
        $('#coins-count').text(currentMoney);
    } else {
        showKonversation([
            "Du bringst ihn aus dem Club in eine dunkle Ecke...",
            "...und schlägst ihn, damit er weiß wie man sich als Schwächerer fühlt.",
            "Er liegt nun blutend da.",
            "Du gehst zurück auf deine Position."
        ]);
    }

    // Zeige normale Buttons wieder
    setTimeout(() => {
        $('#JA, #NEIN').show();
        // Nächster Gast
        setTimeout(() => {
            takeaperson();
        }, 2000);
    }, 4000);
}

// Neue Funktion: Zeigt das Polizist-Event
function showPolizistEvent() {
    localStorage.removeItem('polizistComing');

    // Zeige Polizist
    $("#vorname").text("Klaus");
    $("#nachname").text("Müller");
    $("#geburtstag").text("15.03.1985");
    $("#geschlecht").text("M");
    $("#charakter img").attr("src", "Personen/Männer/Polizei.png");
    $("#picturefeld img").attr("src", "Personen/Männer/Polizeiausweis.png");

    // Dialog
    showKonversation([
        "Schönen guten Tag, wie kann ich Ihnen weiterhelfen?"
    ]);

    setTimeout(() => {
        showKonversation([
            "Schönen guten Abend, Sie waren auch gestern hier, hab ich Recht?",
            "Wir haben ein Video erhalten, wie Sie einen Gast niederschlagen.",
            "Dieser hat Sie nun wegen schwerer Körperverletzung angezeigt.",
            "Ich müsste Sie bitten mitzukommen."
        ]);

        // Game Over nach Dialog
        setTimeout(() => {
            showGameOver();
        }, 5000);
    }, 2000);
}

// Neue Funktion: Game Over Bildschirm
function showGameOver() {
    $('body').html(`
        <div style="background: #000; color: #fff; text-align: center; padding: 50px; min-height: 100vh;">
            <h1 style="color: #ff0000; font-family: 'Black Ops One', sans-serif; font-size: 60px;">GAME OVER</h1>
            <div style="max-width: 600px; margin: 50px auto; background: rgba(255,0,0,0.1); padding: 30px; border-radius: 20px; border: 2px solid #ff0000;">
                <p style="font-size: 20px; line-height: 1.8;">
                    Sie haben zwar dem Mann nur eine Lehre erteilen wollen und selbst Gesetz spielen wollen, 
                    doch das findet der Gesetzgeber nicht so toll.
                </p>
                <p style="font-size: 24px; margin: 30px 0; color: #ff8a80;">
                    Sie wurden verurteilt zu:<br>
                    <strong>4000€ Geldstrafe</strong><br>
                    <strong>2 Jahre auf Bewährung</strong>
                </p>
                <p style="font-size: 20px;">
                    Sie dürfen nun nicht mehr im Sicherheitsdienst arbeiten.
                </p>
                <p style="font-size: 24px; margin-top: 40px; color: #ffd700;">
                    Das Spiel endet hier. Wollen Sie zurück?
                </p>
                <button id="restart" style="background: linear-gradient(to right, #2980b9, #6dd5fa); color: white; padding: 20px 40px; font-size: 24px; border: none; border-radius: 10px; margin-top: 30px; cursor: pointer;">
                    JA - Zurück zum Event
                </button>
            </div>
        </div>
    `);

    $('#restart').on('click', function() {
        // Zurücksetzen zum Event
        localStorage.setItem('days', '2');
        localStorage.removeItem('frauenschlaegerChoice');
        localStorage.removeItem('frauenschlaegerDone');
        localStorage.removeItem('polizistComing');

        // Lade Seite neu
        location.reload();
    });
}

// Neue Funktion: Prüft auf spezielle Events
function checkSpecialEvents() {
    const currentDay = parseInt($('#days-count').text()) || 0;
    const eventChoice = localStorage.getItem('frauenschlaegerChoice');

    console.log("checkSpecialEvents: Tag", currentDay, "Choice:", eventChoice);

    // Prüfe ob Polizist kommen soll (Tag nach dem Event + schlechte Wahl)
    if (eventChoice === 'schlagen' && currentDay === (parseInt(localStorage.getItem('frauenschlaegerDay')) + 1)) {
        console.log("Polizist wird heute kommen!");
        localStorage.setItem('polizistComing', 'true');
    }
}
// Neue Funktion: Zeigt den Kosten-Bildschirm
function showKostenBildschirm() {
    const currentDay = parseInt(localStorage.getItem('days')) || 0;
    const aktuellesGeld = parseInt(localStorage.getItem('money')) || 0; // Aus localStorage!

    $.getJSON("kosten.json", function(data) {
        // Finde die Kosten für den aktuellen Tag
        let tageskosten = data.kosten[currentDay] || data.kosten["default"];
        if (currentDay === 0) {
            tageskosten = data.kosten["0"];
        }

        // Berechne neuen Kontostand
        const neuerKontostand = aktuellesGeld - tageskosten.gesamt;

        // Erstelle den Kosten-Bildschirm
        let kostenHTML = `
            <div style="background: #000; color: #fff; min-height: 100vh; padding: 50px;">
                <h1 style="text-align: center; font-family: 'Black Ops One', sans-serif; font-size: 45px; color: #ffd700;">
                    TAGESABRECHNUNG - TAG ${currentDay}
                </h1>
                <div style="max-width: 600px; margin: 30px auto; background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px;">
                    <h2 style="color: #ff00de; font-size: 30px; margin-bottom: 20px;">${tageskosten.titel}</h2>
                    
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #6dd5fa; font-size: 24px;">Einnahmen:</h3>
                        <p style="font-size: 20px; color: #4CAF50;">Tagesverdienst: +${todaycoins}€</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #ff8a80; font-size: 24px;">Ausgaben:</h3>
        `;

        // Füge alle Kosten-Posten hinzu
        tageskosten.posten.forEach(posten => {
            kostenHTML += `
                <div style="margin: 10px 0; padding: 10px; background: rgba(255, 0, 0, 0.1); border-radius: 10px;">
                    <p style="font-size: 18px; margin: 5px 0;">
                        <strong>${posten.name}:</strong> -${posten.betrag}€
                    </p>
                    <p style="font-size: 14px; color: #999; margin: 5px 0;">${posten.beschreibung}</p>
                </div>
            `;
        });

        kostenHTML += `
                    </div>
                    
                    <div style="border-top: 2px solid #fff; padding-top: 20px; margin-top: 20px;">
                        <p style="font-size: 24px; color: #ff8a80;">Gesamtkosten: -${tageskosten.gesamt}€</p>
                        <p style="font-size: 24px; color: #fff;">Kontostand vorher: ${aktuellesGeld}€</p>
                        <p style="font-size: 28px; color: ${neuerKontostand < 0 ? '#ff0000' : '#ffd700'}; font-weight: bold;">
                            Neuer Kontostand: ${neuerKontostand}€
                        </p>
                    </div>
                    
                    <button id="kosten-bezahlen" style="background: linear-gradient(to right, #2980b9, #6dd5fa); color: white; padding: 15px 40px; font-size: 24px; border: none; border-radius: 10px; margin-top: 30px; cursor: pointer; width: 100%;">
                        KOSTEN BEZAHLEN
                    </button>
                </div>
            </div>
        `;

        $('body').html(kostenHTML);

        // Button Handler
        $('#kosten-bezahlen').on('click', function() {
            bezahleKosten(neuerKontostand, tageskosten.gesamt);
        });
    });
}

function bezahleKosten(neuerKontostand, kosten) {
    if (neuerKontostand < 0) {
        // Game Over - Kein Geld
        showKostenGameOver();
    } else {
        // Erfolgreich bezahlt
        localStorage.setItem('money', neuerKontostand);

        $('body').html(`
            <div style="background: #000; color: #fff; text-align: center; padding: 50px; min-height: 100vh;">
                <h1 style="color: #4CAF50; font-family: 'Black Ops One', sans-serif; font-size: 45px;">
                    KOSTEN BEZAHLT!
                </h1>
                <div style="max-width: 400px; margin: 50px auto;">
                    <p style="font-size: 24px; margin: 20px 0;">
                        Du hast ${kosten}€ für deine Lebenshaltungskosten bezahlt.
                    </p>
                    <p style="font-size: 28px; color: #ffd700; margin: 30px 0;">
                        Verbleibendes Geld: ${neuerKontostand}€
                    </p>
                    <p style="font-size: 20px; color: #999;">
                        Kehre zum Menü zurück...
                    </p>
                </div>
            </div>
        `);

        setTimeout(() => {
            window.location.href = 'Gamemenu.html';
        }, 3000);
    }
}

// Neue Funktion: Game Over wegen Geldmangel
function showKostenGameOver() {
    $('body').html(`
        <div style="background: #000; color: #fff; text-align: center; padding: 50px; min-height: 100vh;">
            <h1 style="color: #ff0000; font-family: 'Black Ops One', sans-serif; font-size: 60px;">GAME OVER</h1>
            <div style="max-width: 600px; margin: 50px auto; background: rgba(255,0,0,0.1); padding: 30px; border-radius: 20px; border: 2px solid #ff0000;">
                <p style="font-size: 20px; line-height: 1.8;">
                    Du konntest deine Rechnungen nicht bezahlen!
                </p>
                <p style="font-size: 20px; line-height: 1.8; margin: 20px 0;">
                    Aufgrund dessen wurdest du vom Ordnungsamt nicht mehr als zuverlässig eingestuft 
                    und dir wurde die Berechtigung zum Arbeiten im Sicherheitsdienst entzogen.
                </p>
                <p style="font-size: 24px; margin-top: 40px; color: #ff8a80;">
                    Das Spiel endet hier.
                </p>
                <button id="restart-day" style="background: linear-gradient(to right, #2980b9, #6dd5fa); color: white; padding: 20px 40px; font-size: 24px; border: none; border-radius: 10px; margin-top: 30px; cursor: pointer;">
                    ZURÜCK ZUM VORHERIGEN TAG
                </button>
            </div>
        </div>
    `);

    $('#restart-day').on('click', function() {
        // Setze auf den Stand VOR den Kosten zurück
        const previousMoney = localStorage.getItem('moneyBeforeExpenses');
        const previousDay = parseInt(localStorage.getItem('dayBeforeExpenses')) - 1; // -1 weil wir VOR dem Tag wollen

        localStorage.setItem('money', previousMoney);
        localStorage.setItem('days', previousDay);

        // Lösche die Speicherstände für diesen Tag
        localStorage.removeItem(`dailyVisitors_day_${previousDay + 1}`);

        // Zurück zum Gamemenu
        window.location.href = 'Gamemenu.html';
    });
}
function showAliEvent() {
    // Verstecke normale UI
    $('#JA, #NEIN').hide();

    // Zeige Event-Dialog
    $("#dialog").empty().append(`
        <div style="background: rgba(255,0,0,0.1); padding: 20px; border-radius: 10px; border: 2px solid red;">
            <p style="font-size: 24px; color: #ff0000;">⚠️ ESKALATION ⚠️</p>
            <p>Ali: "Vallah du Peach, ich hau dich kaputt! Komm komm um die Ecke, ich zeig dir was du bist!"</p>
            <p style="font-style: italic;">*Er spuckt auf den Boden*</p>
            <p style="margin-top: 20px;">Was machst du?</p>
        </div>
    `);

    // Zeige spezielle Buttons
    setTimeout(() => {
        $('.button').append(`
            <div id="MITKOMMEN" style="background: linear-gradient(to right, #c62828, #ff8a80); width: 45%; padding: 15px; border-radius: 10px; color: white; text-align: center; cursor: pointer; display: inline-block; margin: 0 2%;">
                Herausforderung annehmen
            </div>
            <div id="ABLEHNEN" style="background: linear-gradient(to right, #2980b9, #6dd5fa); width: 45%; padding: 15px; border-radius: 10px; color: white; text-align: center; cursor: pointer; display: inline-block; margin: 0 2%;">
                Ignorieren
            </div>
        `);

        // Event Handler
        $('#MITKOMMEN').on('click', function() {
            handleAliChoice('mitkommen');
        });

        $('#ABLEHNEN').on('click', function() {
            handleAliChoice('ablehnen');
        });
    }, 1000);
}

// Neue Funktion: Verarbeitet die Wahl beim Ali-Event
function handleAliChoice(choice) {
    localStorage.setItem('aliEventDone', 'true');

    $('#MITKOMMEN, #ABLEHNEN').remove();

    if (choice === 'mitkommen') {
        // Prüfe ob Schlagstock vorhanden
        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems') || '[]');
        const hasSchlagstock = purchasedItems.includes('schlagstock');

        if (hasSchlagstock) {
            // Mit Schlagstock - Erfolg
            showKonversation([
                "Du gehst mit Ali in die Seitengasse.",
                "Er zieht ein Messer!",
                "Blitzschnell ziehst du deinen neu gekauften Schlagstock.",
                "Du wehrst das Messer ab und setzt ihn fest.",
                "Die Polizei trifft ein und übernimmt.",
                "+100€ Bonus für deine Zivilcourage!"
            ]);

            let currentMoney = parseInt($('#coins-count').text()) || 0;
            currentMoney += 100;
            todaycoins += 100;
            $('#coins-count').text(currentMoney);

            // Tag beenden nach Event
            setTimeout(() => {
                endDay();
            }, 6000);
        } else {
            // Ohne Schlagstock - Game Over
            showAliGameOver();
        }
    } else {
        // Ablehnen - normal weiter
        showKonversation([
            "Du ignorierst Ali's Provokation.",
            "Er flucht noch ein wenig und zieht dann ab.",
            "Kluger Schachzug - Deeskalation ist oft der beste Weg."
        ]);

        // Zeige normale Buttons wieder
        setTimeout(() => {
            $('#JA, #NEIN').show();
            // Nächster Gast
            setTimeout(() => {
                takeaperson();
            }, 2000);
        }, 3000);
    }
}

// Neue Funktion: Game Over durch Ali
function showAliGameOver() {
    $('body').html(`
        <div style="background: #000; color: #fff; text-align: center; padding: 50px; min-height: 100vh;">
            <h1 style="color: #ff0000; font-family: 'Black Ops One', sans-serif; font-size: 60px;">GAME OVER</h1>
            <div style="max-width: 600px; margin: 50px auto; background: rgba(255,0,0,0.1); padding: 30px; border-radius: 20px; border: 2px solid #ff0000;">
                <p style="font-size: 20px; line-height: 1.8;">
                    Dein Gegenüber zieht ein Messer!
                </p>
                <p style="font-size: 20px; line-height: 1.8;">
                    Du versuchst es noch abzuwehren, doch du bist zu langsam...
                </p>
                <p style="font-size: 20px; line-height: 1.8; color: #ff8a80;">
                    Du merkst wie dir am Hals auf einmal ganz warm wird, 
                    bevor dir schwarz vor Augen wird.
                </p>
                <p style="font-size: 24px; margin-top: 40px; color: #ffd700;">
                    Tipp: Ein Schlagstock hätte dir geholfen...
                </p>
                <button id="restart-day" style="background: linear-gradient(to right, #2980b9, #6dd5fa); color: white; padding: 20px 40px; font-size: 24px; border: none; border-radius: 10px; margin-top: 30px; cursor: pointer;">
                    ZURÜCK ZUM TAGESANFANG
                </button>
            </div>
        </div>
    `);

    $('#restart-day').on('click', function() {
        // Zurück zu Tag 4 Anfang
        localStorage.removeItem('aliEventDone');
        localStorage.removeItem(`dailyVisitors_day_4`);

        // Lade Seite neu
        location.reload();
    });
}
function showClubInvestmentEvent() {
    const currentMoney = parseInt(localStorage.getItem('money')) || 0;
    const canAfford = currentMoney >= 300;

    $('body').html(`
        <div style="background: #000; color: #fff; min-height: 100vh; padding: 50px;">
            <h1 style="text-align: center; font-family: 'Black Ops One', sans-serif; font-size: 45px; color: #ff00de;">
                WICHTIGE ENTSCHEIDUNG
            </h1>
            <div style="max-width: 700px; margin: 30px auto; background: rgba(255, 0, 222, 0.1); padding: 40px; border-radius: 20px; border: 2px solid #ff00de;">
                <h2 style="color: #ffd700; font-size: 30px; margin-bottom: 20px;">Der Club-Manager kommt zu dir:</h2>
                
                <div style="background: rgba(0, 0, 0, 0.5); padding: 25px; border-radius: 15px; margin-bottom: 30px;">
                    <p style="font-size: 20px; line-height: 1.8; font-style: italic;">
                        "Hey, ich muss mit dir reden. Der Club hat finanzielle Probleme... 
                        Wir haben zu wenig Geld um weiter bestehen zu bleiben."
                    </p>
                    <p style="font-size: 20px; line-height: 1.8; margin-top: 20px; font-style: italic;">
                        "Du bist unser bester Türsteher. Ich habe einen Vorschlag: 
                        Kauf dich für nur 300€ in den Club ein und werde Teilhaber!"
                    </p>
                    <p style="font-size: 20px; line-height: 1.8; margin-top: 20px; font-style: italic;">
                        "Als Teilhaber bekommst du 20% aller Einnahmen. Was sagst du?"
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 40px;">
                    <p style="font-size: 24px; color: #fff; margin-bottom: 30px;">
                        Dein Kontostand: <span style="color: ${canAfford ? '#4CAF50' : '#ff0000'}; font-weight: bold;">${currentMoney}€</span>
                    </p>
                    
                    ${canAfford ? `
                        <button id="invest-yes" style="background: linear-gradient(to right, #2980b9, #6dd5fa); color: white; padding: 20px 40px; font-size: 24px; border: none; border-radius: 10px; margin: 10px; cursor: pointer;">
                            JA - 300€ INVESTIEREN
                        </button>
                    ` : `
                        <button disabled style="background: #666; color: #999; padding: 20px 40px; font-size: 24px; border: none; border-radius: 10px; margin: 10px; cursor: not-allowed;">
                            NICHT GENUG GELD (300€ benötigt)
                        </button>
                    `}
                    
                    <button id="invest-no" style="background: linear-gradient(to right, #c62828, #ff8a80); color: white; padding: 20px 40px; font-size: 24px; border: none; border-radius: 10px; margin: 10px; cursor: pointer;">
                        NEIN - ABLEHNEN
                    </button>
                </div>
            </div>
        </div>
    `);

    // Event Handler
    $('#invest-yes').on('click', function() {
        handleClubInvestment(true);
    });

    $('#invest-no').on('click', function() {
        handleClubInvestment(false);
    });
}

// Neue Funktion: Verarbeitet die Investment-Entscheidung
function handleClubInvestment(invest) {
    if (invest) {
        // Spieler investiert
        const currentMoney = parseInt(localStorage.getItem('money')) || 0;
        const newMoney = currentMoney - 300;
        localStorage.setItem('money', newMoney);
        localStorage.setItem('clubOwner', 'true');

        showInvestmentSuccess();
    } else {
        // Spieler lehnt ab
        showInvestmentGameOver();
    }
}

// Neue Funktion: Erfolg beim Investment
function showInvestmentSuccess() {
    $('body').html(`
        <div style="background: #000; color: #fff; text-align: center; padding: 50px; min-height: 100vh;">
            <h1 style="color: #4CAF50; font-family: 'Black Ops One', sans-serif; font-size: 60px;">GLÜCKWUNSCH!</h1>
            <div style="max-width: 600px; margin: 50px auto; background: rgba(76, 175, 80, 0.1); padding: 30px; border-radius: 20px; border: 2px solid #4CAF50;">
                <p style="font-size: 24px; line-height: 1.8; color: #ffd700;">
                    Du bist jetzt Teilhaber des Clubs!
                </p>
                <p style="font-size: 20px; line-height: 1.8; margin: 20px 0;">
                    Mit deinen 300€ hast du den Club gerettet. 
                    Ab sofort erhältst du 20% aller Einnahmen.
                </p>
                <p style="font-size: 20px; line-height: 1.8;">
                    Deine Arbeit als Türsteher geht weiter, 
                    aber jetzt arbeitest du für dich selbst!
                </p>
                
                <div style="background: rgba(138, 43, 226, 0.2); padding: 20px; border-radius: 15px; margin: 30px 0; border: 2px solid #ff00de;">
                    <p style="font-size: 24px; color: #ff00de; margin-bottom: 10px;">
                        🎮 ENDLOS-MODUS FREIGESCHALTET 🎮
                    </p>
                    <p style="font-size: 18px; color: #fff;">
                        Die Story dieses Spiels ist beendet.
                    </p>
                    <p style="font-size: 18px; color: #fff; margin-top: 10px;">
                        Von nun an spielst du im Endlos-Modus!
                    </p>
                    <p style="font-size: 16px; color: #ccc; margin-top: 15px;">
                        Arbeite weiter als Türsteher und Club-Besitzer.<br>
                        Sammle Geld, kaufe Ausrüstung und werde zur Legende!
                    </p>
                </div>
                
                <p style="font-size: 28px; margin-top: 30px; color: #4CAF50;">
                    Der Anfang einer Erfolgsgeschichte...
                </p>
                <button onclick="showKostenBildschirm()" style="background: linear-gradient(to right, #388e3c, #81c784); color: white; padding: 20px 40px; font-size: 24px; border: none; border-radius: 10px; margin-top: 30px; cursor: pointer;">
                    WEITER ZUR ABRECHNUNG
                </button>
            </div>
        </div>
    `);
}

// Neue Funktion: Game Over bei Ablehnung
function showInvestmentGameOver() {
    $('body').html(`
        <div style="background: #000; color: #fff; text-align: center; padding: 50px; min-height: 100vh;">
            <h1 style="color: #ff0000; font-family: 'Black Ops One', sans-serif; font-size: 60px;">GAME OVER</h1>
            <div style="max-width: 600px; margin: 50px auto; background: rgba(255,0,0,0.1); padding: 30px; border-radius: 20px; border: 2px solid #ff0000;">
                <p style="font-size: 20px; line-height: 1.8;">
                    Du hast die Investition abgelehnt...
                </p>
                <p style="font-size: 20px; line-height: 1.8; margin: 20px 0;">
                    Der Club musste schließen. Ohne Club keine Arbeit als Türsteher.
                </p>
                <p style="font-size: 24px; margin-top: 40px; color: #ff8a80;">
                    Deine Karriere als Türsteher ist beendet.
                </p>
                <p style="font-size: 18px; margin-top: 20px; color: #999;">
                    Manchmal muss man Risiken eingehen, um voranzukommen...
                </p>
                <button onclick="location.href='Landingpage.html'" style="background: linear-gradient(to right, #c62828, #ff8a80); color: white; padding: 20px 40px; font-size: 24px; border: none; border-radius: 10px; margin-top: 30px; cursor: pointer;">
                    ZURÜCK ZUM HAUPTMENÜ
                </button>
            </div>
        </div>
    `);
}

