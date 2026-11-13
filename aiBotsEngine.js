class TerminalAudioEngine {
    constructor() {
        this.ctx = null;
        this.isEnabled = true;
    }
    initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    playTone(freq, type, startTime, duration, volume = 0.15) {
        if (!this.isEnabled) return;
        this.initContext();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }
    playProfitChime() {
        if (!this.isEnabled) return;
        this.initContext();
        const now = this.ctx.currentTime;
        this.playTone(523.25, 'triangle', now, 0.18, 0.16);
        this.playTone(659.25, 'triangle', now + 0.09, 0.18, 0.16);
        this.playTone(783.99, 'triangle', now + 0.18, 0.22, 0.18);
        this.playTone(1046.50, 'sine', now + 0.27, 0.45, 0.22);
    }
}

const terminalAudio = new TerminalAudioEngine();

function toggleTerminalAudio() {
    terminalAudio.isEnabled = !terminalAudio.isEnabled;
    if (terminalAudio.isEnabled) terminalAudio.initContext();
    const icon = document.getElementById('audio-status-icon');
    const text = document.getElementById('audio-status-text');
    if (icon && text) {
        icon.innerText = terminalAudio.isEnabled ? '🔊' : '🔇';
        text.innerText = terminalAudio.isEnabled ? 'SFX ON' : 'MUTED';
    }
}

function triggerElhadartProfitAlert(boatLabel, profitAmount) {
    terminalAudio.playProfitChime();
    const banner = document.getElementById('profit-toast-banner');
    const details = document.getElementById('profit-toast-details');
    if (banner && details) {
        details.innerText = `${boatLabel} Secured +$${profitAmount.toFixed(2)} Profit`;
        banner.classList.remove('translate-x-full', 'opacity-0');
        banner.classList.add('translate-x-0', 'opacity-100');
        clearTimeout(window.profitToastTimeout);
        window.profitToastTimeout = setTimeout(() => {
            banner.classList.remove('translate-x-0', 'opacity-100');
            banner.classList.add('translate-x-full', 'opacity-0');
        }, 4000);
    }
}

const speedBoatsDirectory = {
    1: { name: "Boat 1: OB Sniper", category: "Deriv Candle Boat (1M-5M)", setup: "Order Block Tap" },
    2: { name: "Boat 2: Tick Scalper", category: "Milliseconds Boat (1-3 Ticks)", setup: "Tick Velocity Surge" },
    3: { name: "Boat 3: Sweep Scalper", category: "Milliseconds Boat (1-2 Ticks)", setup: "Liquidity Sweep Fade" },
    4: { name: "Boat 4: FVG Rebalance", category: "Deriv Candle Boat (3M)", setup: "Fair Value Gap Fill" },
    5: { name: "Boat 5: BOS Follower", category: "Deriv Candle Boat (1M Hold)", setup: "Break of Structure" },
    6: { name: "Boat 6: CHOCH Hunter", category: "Deriv Candle Boat (2M Hold)", setup: "Change of Character" },
    7: { name: "Boat 7: Trendline Array", category: "Deriv Candle Boat (5M Hold)", setup: "Trendline Breakout" },
    8: { name: "Boat 8: Parity Shifter", category: "Milliseconds Boat (2 Ticks)", setup: "Even / Odd Parity" },
    9: { name: "Boat 9: Digit Matrixer", category: "Milliseconds Boat (1-3 Ticks)", setup: "Exact Digit / Barrier" }
};

let currentActiveSpeedBoat = 2;
let currentTimeframeMode = 'MS'; // 'MS' for Milliseconds Boats, '1M' for Deriv Candle Boats

function switchSpeedBoat(boatId) {
    currentActiveSpeedBoat = Number(boatId);
}

function switchTimeframeMode(mode) {
    currentTimeframeMode = mode;
}

function executeSpeedBoatTrade() {
    const boat = speedBoatsDirectory[currentActiveSpeedBoat];
    const label = boat ? `${boat.name} (${boat.category})` : `Speed Boat ${currentActiveSpeedBoat}`;
    triggerElhadartProfitAlert(label, 95.00);
    alert(`Executing ${label} successfully!`);
}

// Rise & Fall Indicators + Explicit Entry & Boat Router
function evaluateAllIndicators(st) {
    if (!st || !st.quotes || st.quotes.length < 20) return;
    
    const quotes = st.quotes;
    const len = quotes.length;
    const currentPrice = quotes[len - 1];
    const prevPrice = quotes[len - 2];
    const prev2Price = quotes[len - 3];
    const isRise = currentPrice >= prevPrice;

    const ma30 = quotes.slice(len - 30, len).reduce((a, b) => a + b, 0) / 30;
    const bias15M = currentPrice >= ma30 ? "15M Bullish Bias" : "15M Bearish Bias";

    const recentHigh = Math.max(...quotes.slice(len - 25, len - 1));
    const recentLow = Math.min(...quotes.slice(len - 25, len - 1));
    
    const isCHOCH = !isRise && currentPrice < recentLow && prev2Price > prevPrice;
    const isBOS = isRise && currentPrice > recentHigh;
    const liquiditySweep = Math.abs(currentPrice - recentHigh) < (currentPrice * 0.0002) || Math.abs(currentPrice - recentLow) < (currentPrice * 0.0002);

    let assignedBoatId = 2;
    let contractAction = "";
    let entryCondition = "";
    let boatRouteLabel = "";
    let exitRule = "";

    if (currentTimeframeMode === 'MS') {
        // Milliseconds Boats Routing
        if (liquiditySweep) {
            assignedBoatId = 3;
            contractAction = isRise ? "FALL (PUT) • 1 TICK FADE" : "RISE (CALL) • 1 TICK FADE";
            entryCondition = `Enter immediately @ ${currentPrice.toFixed(2)} on spike exhaustion`;
            boatRouteLabel = `Milliseconds Boat 3 (Sweep Scalper)`;
            exitRule = `Exit at 1 Tick Expiry (Milliseconds)`;
        } else {
            assignedBoatId = 2;
            const dirLabel = isRise ? "RISE (CALL)" : "FALL (PUT)";
            const pulseDir = isRise ? "upward" : "downward";
            contractAction = `${dirLabel} • 3 TICKS`;
            entryCondition = `Enter after 3 ${pulseDir} tick pulses @ ${currentPrice.toFixed(2)}`;
            boatRouteLabel = `Milliseconds Boat 2 (Tick Scalper)`;
            exitRule = `Exit at 3 Ticks Expiry (Milliseconds)`;
        }
    } else {
        // Deriv Non-Milliseconds Candle Boats Routing
        if (isCHOCH) {
            assignedBoatId = 6;
            contractAction = "FALL (PUT) • 2M REVERSAL";
            entryCondition = `Enter on 1M CHOCH candle rejection @ ${currentPrice.toFixed(2)}`;
            boatRouteLabel = `Deriv Candle Boat 6 (CHOCH Hunter)`;
            exitRule = `Exit at 2-Minute Candle Close`;
        } else if (isBOS) {
            assignedBoatId = 5;
            contractAction = "RISE (CALL) • 1M BREAKOUT";
            entryCondition = `Enter on 1M BOS bar close (${bias15M}) @ ${currentPrice.toFixed(2)}`;
            boatRouteLabel = `Deriv Candle Boat 5 (BOS Follower)`;
            exitRule = `Exit at 60s (1-Minute Bar Close)`;
        } else {
            assignedBoatId = 1;
            const macroDir = bias15M.includes("Bullish") ? "RISE (CALL)" : "FALL (PUT)";
            contractAction = `${macroDir} • 1M OB SNIPER`;
            entryCondition = `Enter when 1M candle taps Order Block @ ${currentPrice.toFixed(2)}`;
            boatRouteLabel = `Deriv Candle Boat 1 (OB Sniper)`;
            exitRule = `Exit at 60s (1-Minute Candle Close)`;
        }
    }

    st.assignedBoatId = assignedBoatId;
    st.assignedBoatName = speedBoatsDirectory[assignedBoatId].name;

    const contractEl = document.getElementById('active-contract-display');
    if (contractEl) contractEl.innerText = contractAction;

    const entryEl = document.getElementById('dual-entry-point-display');
    if (entryEl) entryEl.innerText = entryCondition;

    const boatEl = document.getElementById('rise-fall-boat-route');
    if (boatEl) boatEl.innerText = boatRouteLabel;

    const exitEl = document.getElementById('dual-exit-point-display');
    if (exitEl) exitEl.innerText = exitRule;
}
