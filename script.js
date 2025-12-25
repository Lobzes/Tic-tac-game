const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const modal = document.getElementById('modal');
const prizeDisplay = document.getElementById('prize-display');
const claimBtn = document.getElementById('claim-btn');

// Telegram Setup
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Wheel Config
const segments = [
    { text: "10% OFF", color: "#FF6384", type: "win" },
    { text: "TRY AGAIN", color: "#36A2EB", type: "lose" },
    { text: "FREE COFFEE", color: "#FFCE56", type: "win" },
    { text: "5% OFF", color: "#4BC0C0", type: "win" },
    { text: "SECRET", color: "#9966FF", type: "win" },
    { text: "20% OFF", color: "#FF9F40", type: "win" }
];

const arc = Math.PI * 2 / segments.length;
let currentRotation = 0;

// Draw Wheel
function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;

    segments.forEach((segment, i) => {
        const angle = i * arc;

        // Slice
        ctx.beginPath();
        ctx.fillStyle = segment.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();

        // Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Montserrat";
        ctx.fillText(segment.text, radius - 20, 5);
        ctx.restore();
    });
}

drawWheel();

// Spin Logic
spinBtn.addEventListener('click', () => {
    spinBtn.disabled = true;

    // Calculate random stop
    const randomSegment = Math.floor(Math.random() * segments.length);
    const stopAngle = 360 - (randomSegment * (360 / segments.length)) - (360 / segments.length / 2);

    // Add extra spins (5 full rotations)
    const extraSpins = 360 * 5;
    const totalRotation = currentRotation + extraSpins + stopAngle;

    // Apply rotation
    canvas.style.transform = `rotate(${totalRotation}deg)`;
    currentRotation = totalRotation;

    // Wait for animation
    setTimeout(() => {
        handleResult(segments[randomSegment]);
        spinBtn.disabled = false;
    }, 4000);
});

function handleResult(segment) {
    if (segment.type === 'lose') {
        // Simple alert for loss (or custom modal)
        alert("Не повезло! Попробуй еще раз.");
        return;
    }

    // Generate Code
    const code = generateCode();

    // Show Modal
    prizeDisplay.textContent = segment.text;
    modal.classList.add('show');

    // Setup Claim Button
    claimBtn.onclick = () => {
        sendData(segment.text, code);
    };
}

function generateCode() {
    return 'PROMO-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Debug on startup
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        // alert("Telegram WebApp подключен ✅");
    } else {
        alert("Telegram WebApp НЕ найден ❌ (Игра запущена как сайт)");
    }
});

function sendData(prize, code) {
    claimBtn.textContent = "Отправка...";
    claimBtn.disabled = true;

    const data = JSON.stringify({
        type: 'win',
        prize: prize,
        code: code
    });

    // Пытаемся отправить в любом случае, если есть объект tg
    if (tg) {
        try {
            tg.sendData(data);
            // Если это сработало, окно закроется само.
            // Если нет - через 3 секунды вернем кнопку.
            setTimeout(() => {
                alert("Данные отправлены, но окно не закрылось. Попробуйте закрыть вручную.");
                claimBtn.disabled = false;
                claimBtn.textContent = "Забрать";
            }, 3000);
        } catch (e) {
            alert("Ошибка отправки (tg.sendData): " + e.message);
            claimBtn.textContent = "Попробовать снова";
            claimBtn.disabled = false;
        }
    } else {
        console.log("Sent to TG:", data);
        alert("Ошибка: Объект Telegram не найден. Вы точно играете через бота?");
        modal.classList.remove('show');
        claimBtn.textContent = "Забрать";
        claimBtn.disabled = false;
    }
}








