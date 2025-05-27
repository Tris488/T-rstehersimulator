let currentMoney = 0;
let purchasedItems = [];

$(document).ready(function() {
    loadShopData();
    setupClickHandlers();
});

function loadShopData() {
    // Lade Geld
    currentMoney = parseInt(localStorage.getItem('money')) || 0;
    $('#money-amount').text(currentMoney);

    // Lade gekaufte Items
    const saved = localStorage.getItem('purchasedItems');
    if (saved) {
        purchasedItems = JSON.parse(saved);
        purchasedItems.forEach(updateItemUI);
    }
}

function setupClickHandlers() {
    // Info Buttons
    $('.info-button').on('click', function() {
        const item = $(this).data('item');
        $(`#${item}-desc`).slideToggle();
    });

    // Kauf Buttons
    $('.buy-button').on('click', function() {
        const item = $(this).data('item');
        const price = $(this).data('price');
        buyItem(item, price);
    });
}

function buyItem(item, price) {
    // Prüfe ob schon gekauft
    if (purchasedItems.includes(item)) {
        showMessage('Bereits gekauft!', 'error');
        return;
    }

    // Prüfe Geld
    if (currentMoney < price) {
        showMessage('Nicht genug Geld!', 'error');
        return;
    }

    // Kaufe Item
    currentMoney -= price;
    purchasedItems.push(item);

    // Speichere
    localStorage.setItem('money', currentMoney);
    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));

    // Update UI
    $('#money-amount').text(currentMoney);
    updateItemUI(item);

    showMessage('Gekauft!', 'success');
}

function updateItemUI(item) {
    const $item = $(`.shop-item[data-item="${item}"]`);
    const price = $item.find('.buy-button').data('price');

    $item.addClass('purchased');
    $item.find('.info-button').text('GEKAUFT');

    // NEU: Ändere Buy Button zu Sell Button
    $item.find('.buy-button')
        .text('VERKAUFEN (50% Rückgabe)')
        .removeClass('buy-button')
        .addClass('sell-button')
        .prop('disabled', false)
        .off('click')
        .on('click', function() {
            sellItem(item, Math.floor(price / 2)); // 50% des Kaufpreises
        });

    $item.find('.item-status').text('Im Besitz');
}

// NEU: Verkaufe Item
function sellItem(item, sellPrice) {
    // Entferne aus gekauften Items
    purchasedItems = purchasedItems.filter(i => i !== item);

    // Gib Geld zurück
    currentMoney += sellPrice;

    // Speichere
    localStorage.setItem('money', currentMoney);
    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));

    // Update UI
    $('#money-amount').text(currentMoney);

    // Reset Item UI
    const $item = $(`.shop-item[data-item="${item}"]`);
    const originalPrice = sellPrice * 2; // Originalpreis war doppelt so hoch

    $item.removeClass('purchased');
    $item.find('.info-button').text('INFO');

    $item.find('.sell-button')
        .text('KAUFEN')
        .removeClass('sell-button')
        .addClass('buy-button')
        .off('click')
        .on('click', function() {
            buyItem(item, originalPrice);
        });

    $item.find('.item-status').text('Nicht gekauft');

    showMessage(`Verkauft für ${sellPrice}€!`, 'success');
}

function showMessage(text, type) {
    $('#purchase-message')
        .removeClass()
        .addClass('purchase-message ' + type)
        .text(text)
        .fadeIn()
        .delay(2000)
        .fadeOut();
}