// Game State
var board = ['', '', '', '', '', '', '', '', ''];
var currentPlayer = 'X'; // X - player, O - computer
var gameActive = true;
var computerThinking = false;

// DOM Elements
var cells = document.querySelectorAll('.cell');
var resetBtn = document.getElementById('reset-btn');
var victoryModal = document.getElementById('victory-modal');
var defeatModal = document.getElementById('defeat-modal');
var drawModal = document.getElementById('draw-modal');
var promoCodeElement = document.getElementById('promo-code');
var copyPromoBtn = document.getElementById('copy-promo-btn');
var playAgainVictoryBtn = document.getElementById('play-again-victory-btn');
var playAgainDefeatBtn = document.getElementById('play-again-defeat-btn');
var playAgainDrawBtn = document.getElementById('play-again-draw-btn');

// Winning combinations
var winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Initialize game safely
document.addEventListener('DOMContentLoaded', function () {
    init();
});

function init() {
    // Initialize Telegram Web App features safely
    if (window.Telegram && window.Telegram.WebApp) {
        var tg = window.Telegram.WebApp;
        tg.ready(); // Signal that app is ready
        tg.expand(); // Expand to full height

        // Enable closing confirmation
        try {
            tg.enableClosingConfirmation();
        } catch (e) {
            console.log('Closing confirmation not supported');
        }

        // Set theme colors safely
        if (tg.themeParams) {
            if (tg.themeParams.bg_color) {
                document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
            }
            if (tg.themeParams.text_color) {
                document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
            }
        }
    }

    // Attach event listeners
    cells.forEach(function (cell) {
        cell.addEventListener('click', handleCellClick);
    });

    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    if (copyPromoBtn) copyPromoBtn.addEventListener('click', copyPromoCode);

    if (playAgainVictoryBtn) {
        playAgainVictoryBtn.addEventListener('click', function () {
            closeModal(victoryModal);
            resetGame();
        });
    }

    if (playAgainDefeatBtn) {
        playAgainDefeatBtn.addEventListener('click', function () {
            closeModal(defeatModal);
            resetGame();
        });
    }

    if (playAgainDrawBtn) {
        playAgainDrawBtn.addEventListener('click', function () {
            closeModal(drawModal);
            resetGame();
        });
    }
}

// Handle cell click
function handleCellClick(e) {
    var cell = e.target;
    var index = parseInt(cell.getAttribute('data-index'));

    // Prevent player from making a move if:
    if (board[index] !== '' || !gameActive || currentPlayer === 'O' || computerThinking) {
        return;
    }

    makeMove(index, 'X');

    if (gameActive) {
        computerThinking = true;
        setTimeout(function () {
            computerMove();
        }, 500);
    }
}

// Make a move
function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add('taken', player.toLowerCase());
    checkResult();
}

// Computer move
function computerMove() {
    if (!gameActive) {
        computerThinking = false;
        return;
    }

    updatePlayerTurn('O');

    var move = -1;
    var playRandom = Math.random() < 0.6; // 60% random

    if (playRandom) {
        var availableCells = [];
        board.forEach(function (cell, idx) {
            if (cell === '') availableCells.push(idx);
        });

        if (availableCells.length > 0) {
            move = availableCells[Math.floor(Math.random() * availableCells.length)];
        }
    } else {
        move = findWinningMove('O');
        if (move === -1 && Math.random() < 0.5) {
            move = findWinningMove('X'); // Block
        }
        if (move === -1) {
            var availableCells = [];
            board.forEach(function (cell, idx) {
                if (cell === '') availableCells.push(idx);
            });
            if (availableCells.length > 0) {
                move = availableCells[Math.floor(Math.random() * availableCells.length)];
            }
        }
    }

    if (move !== -1) {
        setTimeout(function () {
            makeMove(move, 'O');
            updatePlayerTurn('X');
            computerThinking = false;
        }, 300);
    } else {
        computerThinking = false;
    }
}

// Find winning move
function findWinningMove(player) {
    for (var i = 0; i < winningCombinations.length; i++) {
        var combo = winningCombinations[i];
        var a = combo[0], b = combo[1], c = combo[2];
        var values = [board[a], board[b], board[c]];

        var count = 0;
        var emptyIndex = -1;

        if (values[0] === player) count++; else if (values[0] === '') emptyIndex = a;
        if (values[1] === player) count++; else if (values[1] === '') emptyIndex = b;
        if (values[2] === player) count++; else if (values[2] === '') emptyIndex = c;

        if (count === 2 && emptyIndex !== -1) {
            return emptyIndex;
        }
    }
    return -1;
}

// Update player turn
function updatePlayerTurn(player) {
    currentPlayer = player;
    var playerCard = document.getElementById('player-card');
    var computerCard = document.getElementById('computer-card');

    if (player === 'X') {
        playerCard.classList.add('active');
        computerCard.classList.remove('active');
    } else {
        playerCard.classList.remove('active');
        computerCard.classList.add('active');
    }
}

// Check result
function checkResult() {
    var roundWon = false;
    var winningCombination = null;

    for (var i = 0; i < winningCombinations.length; i++) {
        var combo = winningCombinations[i];
        if (board[combo[0]] && board[combo[0]] === board[combo[1]] && board[combo[0]] === board[combo[2]]) {
            roundWon = true;
            winningCombination = combo;
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        computerThinking = false;
        highlightWinningCells(winningCombination);

        if (board[winningCombination[0]] === 'X') {
            setTimeout(handleVictory, 500);
        } else {
            setTimeout(handleDefeat, 500);
        }
        return;
    }

    if (!board.includes('')) {
        gameActive = false;
        computerThinking = false;
        setTimeout(handleDraw, 500);
    }
}

function highlightWinningCells(combination) {
    combination.forEach(function (index) {
        cells[index].classList.add('winner');
    });
}

function handleVictory() {
    var promoCode = generatePromoCode();
    promoCodeElement.textContent = promoCode;
    showModal(victoryModal);

    // Send data to Telegram Bot
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        var data = JSON.stringify({
            type: 'victory',
            promo: promoCode
        });
        window.Telegram.WebApp.sendData(data);
    } else {
        // Fallback for PC / Browser
        console.log('Victory! Promo (Demo Mode):', promoCode);
        // Optional: Alert user they are in demo mode
        // alert('Вы победили! В Telegram боте вы бы получили сообщение с промокодом.');
    }
}

function handleDefeat() {
    showModal(defeatModal);

    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        var data = JSON.stringify({
            type: 'defeat'
        });
        window.Telegram.WebApp.sendData(data);
    }
}

function handleDraw() {
    showModal(drawModal);
}

function generatePromoCode() {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var code = '';
    for (var i = 0; i < 5; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

function copyPromoCode() {
    var code = promoCodeElement.textContent;
    navigator.clipboard.writeText(code).then(function () {
        copyPromoBtn.innerHTML = '<span>Скопировано! ✓</span>';
        setTimeout(function () {
            copyPromoBtn.innerHTML = '<span>Скопировать промокод</span>';
        }, 2000);
    }).catch(function (err) {
        console.error('Failed to copy:', err);
    });
}

function showModal(modal) {
    modal.classList.add('show');
}

function closeModal(modal) {
    modal.classList.remove('show');
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    computerThinking = false;

    cells.forEach(function (cell) {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });

    updatePlayerTurn('X');
}


