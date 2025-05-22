let already;
let person = 0;
let counter = 0;
let right = 0;
let event;
let eventcount;
$(document).ready(function() {
    already = [];
    start();
}
);

function start() {
    $("#dialog").empty();
    takeaperson();
    showKonversation([
        "Hallo, bitte den Ausweis!"
    ]);
    showKonversation([
        "Gerne hier!"
    ]);
    click();

}

function takeaperson() {
    eventcount = 0;
    $("#dialog").empty();
    person = Math.floor(Math.random() * 8);
    for (i=0;i<8;i++){
        if(already.includes(person)){
            takeaperson();
        }
        else{$.getJSON("game.json", function(data) {
            let selectedPerson = data["personen"][person];
            $("#vorname").text(selectedPerson.vorname);
            $("#nachname").text(selectedPerson.nachname);
            $("#geburtstag").text(selectedPerson.geburtstag);
            $("#geschlecht").text(selectedPerson.geschlecht);
            $("#charakter img").attr("src", selectedPerson.charakter);
            $("#picturefeld img").attr("src", selectedPerson.picturefeld);
            already[i] = [selectedPerson.id];
            event = selectedPerson.event;
        });

        }
    }

}

function click() {
    $('#JA').off('click').on('click', function () {
        if (event&&eventcount===1) {
            $.getJSON("events.json", function (data) {
                let eventData = data.events[event];
                if (eventData && eventData.konversationJa && eventcount === 1) {
                    showKonversation(eventData.konversationJa);
                    // Nach 3 Sekunden neue Person laden
                    setTimeout(() => {
                        takeaperson();
                    }, 3000);
                }
                else{
                    start();
                }
            });
        } else {
            start();
        }
    });

    $('#NEIN').off('click').on('click', function () {
        if (event) {
            $.getJSON("events.json", function (data) {
                let eventData = data.events[event];

                if (eventData && eventData.konversation && eventcount === 0) {
                    // Erste Ablehnung: Dialog anzeigen, eventcount erhöhen
                    showKonversation(eventData.konversation);
                    eventcount++;
                } else if (eventData && eventData.konversationNein && eventcount === 1) {
                    // Zweite Ablehnung: andere Konversation anzeigen,
                    // danach neue Person laden
                    showKonversation(eventData.konversationNein);
                    setTimeout(() => {
                        takeaperson();
                    }, 3000);
                }
            });
        } else {
            console.log("Kein Event vorhanden.");
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
