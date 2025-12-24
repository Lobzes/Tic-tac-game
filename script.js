// Game State
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X'; // X - player, O - computer
let gameActive = true;
let computerThinking = false; // Flag to prevent player moves while computer is thinking
let botToken = '';
let chatId = '';

// DOM Elements
const cells = document.querySelectorAll('.cell');
const resetBtn = document.getElementById('reset-btn');
const victoryModal = document.getElementById('victory-modal');
const defeatModal = document.getElementById('defeat-modal');
const drawModal = document.getElementById('draw-modal');
const promoCodeElement = document.getElementById('promo-code');
const copyPromoBtn = document.getElementById('copy-promo-btn');
const playAgainVictoryBtn = document.getElementById('play-again-victory-btn');
const playAgainDefeatBtn = document.getElementById('play-again-defeat-btn');
const playAgainDrawBtn = document.getElementById('play-again-draw-btn');
const playerCard = document.getElementById('player-card');
const computerCard = document.getElementById('computer-card');
const settingsToggle = document.getElementById('settings-toggle');
const settingsContent = document.getElementById('settings-content');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const botTokenInput = document.getElementById('bot-token');
const chatIdInput = document.getElementById('chat-id');

// Winning combinations
const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Initialize game
function init() {
    loadSettings();
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    resetBtn.addEventListener('click', resetGame);
    copyPromoBtn.addEventListener('click', copyPromoCode);
    playAgainVictoryBtn.addEventListener('click', () => {
        closeModal(victoryModal);
        resetGame();
    });
    playAgainDefeatBtn.addEventListener('click', () => {
        closeModal(defeatModal);
        resetGame();
    });
    playAgainDrawBtn.addEventListener('click', () => {
        closeModal(drawModal);
        resetGame();
    });
    settingsToggle.addEventListener('click', toggleSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
}

// Load settings from localStorage or Telegram Web App
function loadSettings() {
    // Initialize Telegram Web App
    const tg = window.Telegram?.WebApp;

    // Bot Token (remains the same for all users)
    const defaultBotToken = '8390679003:AAHc5Xl5rqLjUG4k4bWw-zSSg2wTupJLsMI';

    // Check if running inside Telegram
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        // Get Chat ID from Telegram Web App
        const telegramUser = tg.initDataUnsafe.user;
        chatId = telegramUser.id.toString();

        console.log('✅ Telegram Web App detected!');
        console.log('👤 User:', telegramUser.first_name, telegramUser.last_name);
        console.log('🆔 Chat ID:', chatId);

        // Expand the Web App to full height
        tg.expand();

        // Enable closing confirmation
        tg.enableClosingConfirmation();

        // Set theme colors
        if (tg.themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#faf8ff');
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#2d3748');
        }
    } else {
        // Fallback: Load from localStorage or use default for testing
        const savedChatId = localStorage.getItem('telegram_chat_id');

        if (savedChatId) {
            chatId = savedChatId;
        } else {
            // For testing outside Telegram - use default
            chatId = '589695442';
            console.warn('⚠️ Running outside Telegram. Using default Chat ID for testing.');
        }
    }

    // Always use the same bot token
    const savedBotToken = localStorage.getItem('telegram_bot_token');
    if (savedBotToken) {
        botToken = savedBotToken;
    } else {
        botToken = defaultBotToken;
        localStorage.setItem('telegram_bot_token', defaultBotToken);
    }

    // Update input fields
    botTokenInput.value = botToken;
    chatIdInput.value = chatId;

    // Save Chat ID to localStorage
    localStorage.setItem('telegram_chat_id', chatId);
}

// Save settings to localStorage
function saveSettings() {
    botToken = botTokenInput.value.trim();
    chatId = chatIdInput.value.trim();

    localStorage.setItem('telegram_bot_token', botToken);
    localStorage.setItem('telegram_chat_id', chatId);

    // Show feedback
    saveSettingsBtn.textContent = 'Сохранено! ✓';
    setTimeout(() => {
        saveSettingsBtn.textContent = 'Сохранить';
        settingsContent.classList.remove('show');
    }, 1500);
}

// Toggle settings panel
function toggleSettings() {
    settingsContent.classList.toggle('show');
}

// Handle cell click
function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    // Prevent player from making a move if:
    // - Cell is already taken
    // - Game is not active
    // - It's computer's turn
    // - Computer is currently thinking/making a move
    if (board[index] !== '' || !gameActive || currentPlayer === 'O' || computerThinking) {
        return;
    }

    makeMove(index, 'X');

    if (gameActive) {
        // Set flag to prevent player from making another move
        computerThinking = true;

        setTimeout(() => {
            computerMove();
        }, 500);
    }
}

// Make a move
function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add('taken', player.toLowerCase());

    checkResult();
}

// Computer move with AI (weakened for better player experience)
function computerMove() {
    if (!gameActive) {
        computerThinking = false;
        return;
    }

    updatePlayerTurn('O');

    let move = -1;

    // 60% chance to make a random move (easier for player to win)
    // 40% chance to play strategically
    const playRandom = Math.random() < 0.6;

    if (playRandom) {
        // Make a random move
        const availableCells = board.map((cell, index) => cell === '' ? index : null).filter(i => i !== null);
        move = availableCells[Math.floor(Math.random() * availableCells.length)];
    } else {
        // Simplified AI Strategy (weaker than before):
        // 1. Try to win (only if obvious)
        // 2. Sometimes block player (50% chance)
        // 3. Random move otherwise

        move = findWinningMove('O');

        // Only block player 50% of the time
        if (move === -1 && Math.random() < 0.5) {
            move = findWinningMove('X'); // Block player
        }

        // If no strategic move, make random move
        if (move === -1) {
            const availableCells = board.map((cell, index) => cell === '' ? index : null).filter(i => i !== null);
            move = availableCells[Math.floor(Math.random() * availableCells.length)];
        }
    }

    setTimeout(() => {
        makeMove(move, 'O');
        updatePlayerTurn('X');
        // Reset flag to allow player to make next move
        computerThinking = false;
    }, 300);
}

// Find winning move for a player
function findWinningMove(player) {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        const values = [board[a], board[b], board[c]];

        if (values.filter(v => v === player).length === 2 && values.includes('')) {
            return combination[values.indexOf('')];
        }
    }
    return -1;
}

// Update player turn indicator
function updatePlayerTurn(player) {
    currentPlayer = player;
    if (player === 'X') {
        playerCard.classList.add('active');
        computerCard.classList.remove('active');
    } else {
        playerCard.classList.remove('active');
        computerCard.classList.add('active');
    }
}

// Check game result
function checkResult() {
    let roundWon = false;
    let winningCombination = null;

    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningCombination = combination;
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        computerThinking = false; // Reset flag when game ends
        highlightWinningCells(winningCombination);

        if (board[winningCombination[0]] === 'X') {
            setTimeout(() => handleVictory(), 500);
        } else {
            setTimeout(() => handleDefeat(), 500);
        }
        return;
    }

    if (!board.includes('')) {
        gameActive = false;
        computerThinking = false; // Reset flag when game ends
        setTimeout(() => handleDraw(), 500);
    }
}

// Highlight winning cells
function highlightWinningCells(combination) {
    combination.forEach(index => {
        cells[index].classList.add('winner');
    });
}

// Handle victory
function handleVictory() {
    const promoCode = generatePromoCode();
    promoCodeElement.textContent = promoCode;
    showModal(victoryModal);
    sendTelegramMessage(`🎉 Победа! Промокод выдан: ${promoCode}`);
}

// Handle defeat
function handleDefeat() {
    showModal(defeatModal);
    sendTelegramMessage('😔 Проигрыш. Попробуйте ещё раз!');
}

// Handle draw
function handleDraw() {
    showModal(drawModal);
}

// Generate random 5-digit promo code
function generatePromoCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Copy promo code to clipboard
function copyPromoCode() {
    const code = promoCodeElement.textContent;
    navigator.clipboard.writeText(code).then(() => {
        copyPromoBtn.innerHTML = '<span>Скопировано! ✓</span>';
        setTimeout(() => {
            copyPromoBtn.innerHTML = '<span>Скопировать промокод</span>';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Send message to Telegram
async function sendTelegramMessage(message) {
    if (!botToken || !chatId) {
        console.warn('⚠️ Telegram settings not configured');
        return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        console.log(`📤 Sending message to Chat ID: ${chatId}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to send message: ${errorData.description}`);
        }

        console.log('✅ Telegram message sent successfully!');
    } catch (error) {
        console.error('❌ Error sending Telegram message:', error);
    }
}

// Show modal
function showModal(modal) {
    modal.classList.add('show');
}

// Close modal
function closeModal(modal) {
    modal.classList.remove('show');
}

// Reset game
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    computerThinking = false; // Reset flag on new game

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });

    updatePlayerTurn('X');
}

// Initialize game on page load
init();
