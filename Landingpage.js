$(document).ready(hover);

function hover() {
    $('.options-card').hover(function() {
        // Setzt die Hintergrundfarbe beim Hovern auf grau
        $(this).css("background-color", "gray");
    }, function() {
        $(this).css("background-color", "crimson");
    });
    $('.start-card').hover(function() {
        $(this).css("background-color", "gray");
    }, function() {
        $(this).css("background-color", "#1f4ff1");
    });
}
