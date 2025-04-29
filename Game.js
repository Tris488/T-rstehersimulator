let already;
let person;
let counter;
$(document).ready(start);
function start(){
    console.log("Starting2");
    person=Math.floor(Math.random()*2)
    $.getJSON("game.json", function(data){
        console.log(data["personen"]);
        let selectedPerson = data["personen"][person];
        console.log("Ausgewählte Person:", selectedPerson);
        $("#vorname").text(selectedPerson.vorname);
        $("#nachname").text(selectedPerson.nachname);
        $("#geburtstag").text(selectedPerson.geburtstag);
        $("#geschlecht").text(selectedPerson.geschlecht);
        $("#charakter img").attr("src", selectedPerson.charakter);
    })
}
