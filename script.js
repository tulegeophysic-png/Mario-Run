// ==========================================
// AURA BOT - LOGIC SIMULATION & DASHBOARD REALTIME
// ==========================================

// Cấu hình tham số ngưỡng AI
const CONFIG = {
    SAFE_DISTANCE: 30.0, // cm
    PM25_LIMIT_WARN: 50,
    PM25_LIMIT_DANGER: 100,
    CO2_LIMIT_WARN: 1200,
    TEMP_LIMIT_HIGH: 35,
    HUMIDITY_LIMIT_HIGH: 75
};

// State khởi tạo
let isRobotRunning = true;

// DOM Elements
const elTemp = document.getElementById('val-temp');
const elHumidity = document.getElementById('val-humidity');
const elPm25 = document.getElementById('val-pm25');
const elCo2 = document.getElementById('val-co2');
const elDistance = document.getElementById('val-distance');

const elAiBadge = document.getElementById('ai-status-badge');
const elWarningsList = document.getElementById('ai-warnings-list');
const elRecommendList = document.getElementById('ai-recommendations-list');
const elNavDecision = document.getElementById('nav-decision-text');
const elLogConsole = document.getElementById('log-console');

const btnAuto = document.getElementById('btn-auto');
const btnStop = document.getElementById('btn-stop');

// ==========================================
// 1. MÔ PHỎNG ĐỌC CẢM BIẾN (SENSOR ARRAY)
// ==========================================
function readSensors() {
    return {
        temperature: (Math.random() * (38 - 20) + 20).toFixed(1),
        humidity: (Math.random() * (85 - 40) + 40).toFixed(1),
        pm25: (Math.random() * (150 - 10) + 10).toFixed(1),
        co2: (Math.random() * (1600 - 400) + 400).toFixed(0),
        distance: (Math.random() * (200 - 10) + 10).toFixed(1)
    };
}

// ==========================================
// 2. KHỐI AI PHÂN TÍCH MÔI TRƯỜNG
// ==========================================
function analyzeEnvironment(data) {
    let warnings = [];
    let recommendations = [];
    let status = "AN TOÀN";
    let statusClass = "safe";

    // Phân tích PM2.5
    if (data.pm25 > CONFIG.PM25_LIMIT_DANGER) {
        status = "NGUY HIỂM";
        statusClass = "danger";
        warnings.push(`PM2.5 rất cao (${data.pm25} µg/m³)!`);
        recommendations.push("Bật máy lọc không khí tối đa & đeo khẩu trang N95.");
    } else if (data.pm25 > CONFIG.PM25_LIMIT_WARN) {
        if (status !== "NGUY HIỂM") { status = "CẢNH BÁO"; statusClass = "warning"; }
        warnings.push(`PM2.5 vượt ngưỡng (${data.pm25} µg/m³).`);
        recommendations.push("Nên đóng cửa sổ và bật lọc không khí.");
    }

    // Phân tích CO2
    if (data.co2 > CONFIG.CO2_LIMIT_WARN) {
        if (status !== "NGUY HIỂM") { status = "CẢNH BÁO"; statusClass = "warning"; }
        warnings.push(`Khí CO₂ cao (${data.co2} ppm).`);
        recommendations.push("Không khí bí, hãy mở cửa thông gió.");
    }

    // Phân tích Nhiệt độ & Độ ẩm
    if (data.temperature > CONFIG.TEMP_LIMIT_HIGH) {
        warnings.push(`Nhiệt độ cao (${data.temperature}°C).`);
        recommendations.push("Bật điều hòa/quạt tránh sốc nhiệt.");
    }
    if (data.humidity > CONFIG.HUMIDITY_LIMIT_HIGH) {
        warnings.push(`Độ ẩm cao (${data.humidity}%).`);
        recommendations.push("Bật chế độ hút ẩm (Dry) chống mốc.");
    }

    if (warnings.length === 0) {
        recommendations.push("Môi trường đạt chuẩn lý tưởng!");
    }

    return { status, statusClass, warnings, recommendations };
}

// ==========================================
// 3. KHỐI QUYẾT ĐỊNH DI CHUYỂN
// ==========================================
function makeNavigationDecision(distance) {
    if (parseFloat(distance) < CONFIG.SAFE_DISTANCE) {
        const actions = ["Lùi lại & rẽ trái 90°", "Lùi lại & rẽ phải 90°", "Xoay tại chỗ 180°"];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        return {
            text: `🛑 Vật cản gần (${distance}cm) ➔ ${randomAction}`,
            isObstacle: true
        };
    }
    return {
        text: `🟢 Đường thông thoáng (${distance}cm) ➔ Tiến về phía trước`,
        isObstacle: false
    };
}

// ==========================================
// 4. HIỂN THỊ DỮ LIỆU & LOGS
// ==========================================
function addLog(message, type = "info") {
    const timeStr = new Date().toLocaleTimeString();
    const logItem = document.createElement('p');
    logItem.className = `log-item ${type}`;
    logItem.textContent = `[${timeStr}] ${message}`;
    
    elLogConsole.appendChild(logItem);
    elLogConsole.scrollTop = elLogConsole.scrollHeight; // Auto scroll
}

function updateUI(data, aiResult, navResult) {
    // 1. Cập nhật chỉ số cảm biến
    elTemp.textContent = data.temperature;
    elHumidity.textContent = data.humidity;
    elPm25.textContent = data.pm25;
    elCo2.textContent = data.co2;
    elDistance.textContent = data.distance;

    // 2. Cập nhật AI Status & Khuyến nghị
    elAiBadge.textContent = aiResult.status;
    elAiBadge.className = `badge ${aiResult.statusClass}`;

    elWarningsList.innerHTML = aiResult.warnings.length > 0 
        ? aiResult.warnings.map(w => `<li>• ${w}</li>`).join('')
        : '<li>• Không có cảnh báo</li>';

    elRecommendList.innerHTML = aiResult.recommendations
        .map(r => `<li>• ${r}</li>`).join('');

    // 3. Cập nhật di chuyển
    elNavDecision.textContent = navResult.text;

    // 4. Ghi Log
    addLog(`Telemetry Sent: T=${data.temperature}°C, PM2.5=${data.pm25}, Status=${aiResult.status}`, 
        aiResult.statusClass === 'danger' ? 'danger' : (aiResult.statusClass === 'warning' ? 'warn' : 'info'));
}

// ==========================================
// 5. CHU KỲ HOẠT ĐỘNG CHÍNH (MAIN LOOP)
// ==========================================
function runRobotCycle() {
    if (!isRobotRunning) return;

    const sensorData = readSensors();
    const aiAnalysis = analyzeEnvironment(sensorData);
    const navDecision = makeNavigationDecision(sensorData.distance);

    updateUI(sensorData, aiAnalysis, navDecision);
}

// Lập lịch tự động cập nhật mỗi 2.5 giây
let cycleInterval = setInterval(runRobotCycle, 2500);

// Nút bấm điều khiển
btnStop.addEventListener('click', () => {
    isRobotRunning = false;
    document.getElementById('robot-state-text').textContent = "Đã dừng";
    document.querySelector('.status-indicator').classList.remove('online');
    addLog("[COMMAND] Robot đã tạm dừng hoạt động thủ công.", "warn");
});

btnAuto.addEventListener('click', () => {
    if (!isRobotRunning) {
        isRobotRunning = true;
        document.getElementById('robot-state-text').textContent = "Đang hoạt động";
        document.querySelector('.status-indicator').classList.add('online');
        addLog("[COMMAND] Khởi động lại chế độ tự hành.", "info");
        runRobotCycle();
    }
});

// Chạy chu kỳ đầu tiên ngay khi tải trang
runRobotCycle();