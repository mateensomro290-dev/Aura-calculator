/**
 * Aura Calculator - Application Logic
 * Features:
 *  - White background (Day Mode) / Dark Cosmic (Night Mode)
 *  - Obsidian Black Calculator Chassis with Gray-toned tactile keys
 *  - Standard & Scientific math operations
 *  - Angle mode (DEG / RAD)
 *  - Synthesized Web Audio click feedback
 *  - Calculation history drawer
 *  - Full physical keyboard support
 *  - Dynamic display font scaling
 */

(function () {
  'use strict';

  // --- State ---
  let expression = '';
  let currentResult = '0';
  let isCalculated = false;
  let angleMode = 'DEG'; // 'DEG' or 'RAD'
  let soundEnabled = true;
  let history = [];

  // --- Aura Color Definitions ---
  const AURA_COLORS = {
    cyan: { hex: '#06b6d4', rgb: '6, 182, 212' },
    violet: { hex: '#8b5cf6', rgb: '139, 92, 246' },
    emerald: { hex: '#10b981', rgb: '16, 185, 129' },
    amber: { hex: '#f59e0b', rgb: '245, 158, 11' },
    rose: { hex: '#f43f5e', rgb: '244, 63, 94' }
  };

  // --- DOM Elements ---
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const soundToggle = document.getElementById('soundToggle');
  const soundOnIcon = soundToggle.querySelector('.sound-on');
  const soundOffIcon = soundToggle.querySelector('.sound-off');
  const historyToggle = document.getElementById('historyToggle');
  const historyDrawer = document.getElementById('historyDrawer');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');
  const scientificToggle = document.getElementById('scientificToggle');
  const scientificPanel = document.getElementById('scientificPanel');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const resultDisplay = document.getElementById('resultDisplay');
  const modeBadge = document.getElementById('modeBadge');
  const copyBtn = document.getElementById('copyBtn');
  const copyTooltip = document.getElementById('copyTooltip');
  const clearBtn = document.getElementById('clearBtn');
  const moodDots = document.querySelectorAll('.mood-dot');

  // --- Audio Synthesis (Web Audio API) ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  function playClickSound(freq = 600, duration = 0.03, type = 'sine') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked until first user gesture
    }
  }

  // --- Ripple Effect on Buttons ---
  function createRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const circle = document.createElement('span');
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${(e.clientX || (rect.left + rect.width / 2)) - rect.left - radius}px`;
    circle.style.top = `${(e.clientY || (rect.top + rect.height / 2)) - rect.top - radius}px`;
    circle.classList.add('ripple');

    const ripple = btn.querySelector('.ripple');
    if (ripple) ripple.remove();

    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 450);
  }

  // --- Display Update & Formatting ---
  function formatNumberForDisplay(numStr) {
    if (numStr === 'Error' || numStr === 'Cannot divide by 0' || isNaN(Number(numStr))) {
      return numStr;
    }

    const parts = numStr.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // Add commas to integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return integerPart + decimalPart;
  }

  function adjustDisplayFontSize() {
    const len = resultDisplay.textContent.length;
    if (len > 16) {
      resultDisplay.style.fontSize = '1.35rem';
    } else if (len > 12) {
      resultDisplay.style.fontSize = '1.65rem';
    } else if (len > 9) {
      resultDisplay.style.fontSize = '1.95rem';
    } else {
      resultDisplay.style.fontSize = '2.35rem';
    }
  }

  function updateDisplay() {
    expressionDisplay.textContent = expression
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' − ');

    resultDisplay.textContent = formatNumberForDisplay(currentResult);
    adjustDisplayFontSize();

    // Update Clear button label: if expression or result is non-zero, show C/AC
    if (expression === '' && currentResult === '0') {
      clearBtn.textContent = 'AC';
    } else {
      clearBtn.textContent = 'C';
    }
  }

  // --- Core Calculation Logic ---
  function inputDigit(digit) {
    playClickSound(580, 0.035);

    if (isCalculated) {
      expression = '';
      currentResult = digit;
      isCalculated = false;
    } else {
      if (currentResult === '0' || currentResult === 'Error' || currentResult === 'Cannot divide by 0') {
        currentResult = digit;
      } else {
        currentResult += digit;
      }
    }
    updateDisplay();
  }

  function inputDoubleZero() {
    playClickSound(580, 0.035);
    if (isCalculated) {
      expression = '';
      currentResult = '0';
      isCalculated = false;
    } else if (currentResult !== '0' && currentResult !== 'Error') {
      currentResult += '00';
    }
    updateDisplay();
  }

  function inputDecimal() {
    playClickSound(620, 0.03);
    if (isCalculated) {
      expression = '';
      currentResult = '0.';
      isCalculated = false;
    } else if (!currentResult.includes('.')) {
      currentResult += '.';
    }
    updateDisplay();
  }

  function handleBackspace() {
    playClickSound(480, 0.03);
    if (isCalculated) {
      expression = '';
      isCalculated = false;
    }
    if (currentResult.length > 1) {
      currentResult = currentResult.slice(0, -1);
      if (currentResult === '-') currentResult = '0';
    } else {
      currentResult = '0';
    }
    updateDisplay();
  }

  function handleClear() {
    playClickSound(420, 0.04);
    if (clearBtn.textContent === 'C' && currentResult !== '0') {
      currentResult = '0';
    } else {
      expression = '';
      currentResult = '0';
      isCalculated = false;
    }
    updateDisplay();
  }

  function handleOperator(op) {
    playClickSound(700, 0.035, 'triangle');

    if (isCalculated) {
      expression = currentResult + ' ' + op + ' ';
      currentResult = '0';
      isCalculated = false;
    } else {
      if (currentResult !== '0' || expression === '') {
        expression += currentResult + ' ' + op + ' ';
        currentResult = '0';
      } else if (expression.length > 0) {
        // Replace last operator if already ended with an operator
        expression = expression.trimEnd();
        expression = expression.slice(0, -1) + op + ' ';
      }
    }
    updateDisplay();
  }

  function handleNegate() {
    playClickSound(540, 0.03);
    if (currentResult === '0' || currentResult === 'Error') return;
    if (currentResult.startsWith('-')) {
      currentResult = currentResult.slice(1);
    } else {
      currentResult = '-' + currentResult;
    }
    updateDisplay();
  }

  function handlePercent() {
    playClickSound(640, 0.03);
    const num = parseFloat(currentResult);
    if (!isNaN(num)) {
      currentResult = (num / 100).toString();
      updateDisplay();
    }
  }

  function handleParenthesis(paren) {
    playClickSound(660, 0.03);
    if (paren === '(') {
      if (currentResult !== '0' && !isCalculated) {
        expression += currentResult + ' * ( ';
      } else {
        expression += '( ';
      }
      currentResult = '0';
    } else {
      if (currentResult !== '0') {
        expression += currentResult + ' ) ';
      } else {
        expression += ' ) ';
      }
      currentResult = '0';
    }
    isCalculated = false;
    updateDisplay();
  }

  // --- Scientific Operations ---
  function handleScientific(action) {
    playClickSound(750, 0.035);
    const num = parseFloat(currentResult);
    if (isNaN(num)) return;

    let res = 0;
    let desc = '';

    switch (action) {
      case 'sin': {
        const rad = angleMode === 'DEG' ? (num * Math.PI) / 180 : num;
        res = Math.sin(rad);
        desc = `sin(${num})`;
        break;
      }
      case 'cos': {
        const rad = angleMode === 'DEG' ? (num * Math.PI) / 180 : num;
        res = Math.cos(rad);
        desc = `cos(${num})`;
        break;
      }
      case 'tan': {
        const rad = angleMode === 'DEG' ? (num * Math.PI) / 180 : num;
        if (Math.abs(Math.cos(rad)) < 1e-10) {
          currentResult = 'Error';
          updateDisplay();
          return;
        }
        res = Math.tan(rad);
        desc = `tan(${num})`;
        break;
      }
      case 'ln': {
        if (num <= 0) {
          currentResult = 'Error';
          updateDisplay();
          return;
        }
        res = Math.log(num);
        desc = `ln(${num})`;
        break;
      }
      case 'log': {
        if (num <= 0) {
          currentResult = 'Error';
          updateDisplay();
          return;
        }
        res = Math.log10(num);
        desc = `log(${num})`;
        break;
      }
      case 'sqrt': {
        if (num < 0) {
          currentResult = 'Error';
          updateDisplay();
          return;
        }
        res = Math.sqrt(num);
        desc = `√(${num})`;
        break;
      }
      case 'square': {
        res = Math.pow(num, 2);
        desc = `sqr(${num})`;
        break;
      }
      case 'power': {
        handleOperator('^');
        return;
      }
      case 'inv': {
        if (num === 0) {
          currentResult = 'Cannot divide by 0';
          updateDisplay();
          return;
        }
        res = 1 / num;
        desc = `1/(${num})`;
        break;
      }
      case 'pi': {
        currentResult = Math.PI.toString();
        isCalculated = false;
        updateDisplay();
        return;
      }
      case 'e': {
        currentResult = Math.E.toString();
        isCalculated = false;
        updateDisplay();
        return;
      }
      case 'deg-rad': {
        angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
        modeBadge.textContent = angleMode;
        document.getElementById('degRadBtn').textContent = angleMode.toLowerCase();
        return;
      }
    }

    // Clean up precision artifacts (e.g. 0.0000000000000001 -> 0)
    if (Math.abs(res) < 1e-12) res = 0;
    res = Number(res.toFixed(10)).toString();

    // Log to history and update
    addHistoryItem(desc, res);
    currentResult = res;
    isCalculated = true;
    updateDisplay();
  }

  // --- Safe Math Expression Evaluator ---
  function safeEvaluate(fullExpr) {
    // Replace power symbol ^ with **
    let sanitized = fullExpr.replace(/\^/g, '**');

    // Remove any trailing unclosed operator or space
    sanitized = sanitized.trim();

    // Balance unclosed open parentheses
    let openCount = (sanitized.match(/\(/g) || []).length;
    let closeCount = (sanitized.match(/\)/g) || []).length;
    while (openCount > closeCount) {
      sanitized += ' )';
      closeCount++;
    }

    // Check for division by zero
    if (/\/\s*0(?![0-9.])/.test(sanitized)) {
      throw new Error('Cannot divide by 0');
    }

    // Allowed characters whitelist: numbers, decimal, spaces, parens, operators
    if (!/^[0-9+\-*/().\s*%]+$/.test(sanitized.replace(/\*\*/g, ''))) {
      throw new Error('Invalid Syntax');
    }

    // Use Function constructor in a closed scope
    const evalResult = new Function(`return (${sanitized})`)();

    if (!isFinite(evalResult) || isNaN(evalResult)) {
      throw new Error('Error');
    }

    // Trim floating precision issues
    const rounded = Math.round(evalResult * 1e12) / 1e12;
    return rounded.toString();
  }

  function handleCalculate() {
    playClickSound(850, 0.045, 'triangle');

    let fullExpr = expression;
    if (currentResult !== '0' || fullExpr === '') {
      fullExpr += currentResult;
    }

    fullExpr = fullExpr.trim();
    if (!fullExpr) return;

    try {
      const finalVal = safeEvaluate(fullExpr);
      addHistoryItem(fullExpr, finalVal);
      expression = fullExpr + ' =';
      currentResult = finalVal;
      isCalculated = true;
      updateDisplay();
    } catch (err) {
      if (err.message === 'Cannot divide by 0') {
        currentResult = 'Cannot divide by 0';
      } else {
        currentResult = 'Error';
      }
      isCalculated = true;
      updateDisplay();
    }
  }

  // --- History Management ---
  function addHistoryItem(exp, res) {
    const item = {
      expression: exp.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/-/g, ' − '),
      result: res
    };
    history.unshift(item);
    if (history.length > 30) history.pop();
    renderHistory();
    try {
      localStorage.setItem('aura_calc_history', JSON.stringify(history));
    } catch (e) {}
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<p class="history-empty">No calculations yet</p>';
      return;
    }

    historyList.innerHTML = '';
    history.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = `
        <span class="history-item-exp">${item.expression} =</span>
        <span class="history-item-res">${formatNumberForDisplay(item.result)}</span>
      `;
      el.addEventListener('click', () => {
        playClickSound(600, 0.03);
        currentResult = item.result;
        expression = '';
        isCalculated = false;
        updateDisplay();
        historyDrawer.classList.remove('open');
      });
      historyList.appendChild(el);
    });
  }

  // --- Theme (Day Mode / Night Mode) ---
  function setTheme(theme) {
    if (theme === 'night') {
      body.classList.remove('day-mode');
      body.classList.add('night-mode');
      themeLabel.textContent = 'Night';
    } else {
      body.classList.remove('night-mode');
      body.classList.add('day-mode');
      themeLabel.textContent = 'Day';
    }
    try {
      localStorage.setItem('aura_calc_theme', theme);
    } catch (e) {}
  }

  function toggleTheme() {
    playClickSound(520, 0.035);
    const isNight = body.classList.contains('night-mode');
    setTheme(isNight ? 'day' : 'night');
  }

  // --- Aura Mood Glow Palette ---
  function setAuraGlow(colorKey) {
    const config = AURA_COLORS[colorKey];
    if (!config) return;

    document.documentElement.style.setProperty('--aura-color', config.hex);
    document.documentElement.style.setProperty('--aura-color-rgb', config.rgb);

    moodDots.forEach(dot => {
      dot.classList.toggle('active', dot.dataset.glow === colorKey);
    });

    try {
      localStorage.setItem('aura_calc_glow', colorKey);
    } catch (e) {}
  }

  // --- Event Listeners Initialization ---
  function initEvents() {
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Sound Toggle
    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundOnIcon.classList.toggle('hidden', !soundEnabled);
      soundOffIcon.classList.toggle('hidden', soundEnabled);
      if (soundEnabled) playClickSound(600, 0.03);
      try {
        localStorage.setItem('aura_calc_sound', soundEnabled.toString());
      } catch (e) {}
    });

    // Scientific Mode Drawer Toggle
    scientificToggle.addEventListener('click', () => {
      playClickSound(580, 0.03);
      const isOpen = scientificPanel.classList.toggle('open');
      scientificToggle.classList.toggle('active', isOpen);
    });

    // History Toggle & Drawer
    historyToggle.addEventListener('click', () => {
      playClickSound(560, 0.03);
      historyDrawer.classList.add('open');
    });

    closeHistoryBtn.addEventListener('click', () => {
      playClickSound(500, 0.03);
      historyDrawer.classList.remove('open');
    });

    clearHistoryBtn.addEventListener('click', () => {
      playClickSound(450, 0.04);
      history = [];
      renderHistory();
      try {
        localStorage.removeItem('aura_calc_history');
      } catch (e) {}
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
      playClickSound(720, 0.03);
      navigator.clipboard.writeText(currentResult).then(() => {
        copyTooltip.classList.add('show');
        setTimeout(() => copyTooltip.classList.remove('show'), 1500);
      }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = currentResult;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copyTooltip.classList.add('show');
        setTimeout(() => copyTooltip.classList.remove('show'), 1500);
      });
    });

    // Aura Color Palette Dots
    moodDots.forEach(dot => {
      dot.addEventListener('click', () => {
        playClickSound(650, 0.03);
        setAuraGlow(dot.dataset.glow);
      });
    });

    // Keypad Click Event Delegation
    document.querySelector('.calculator-keypad').addEventListener('click', (e) => {
      const btn = e.target.closest('.key');
      if (!btn) return;

      createRipple(e);

      const action = btn.dataset.action;
      const val = btn.dataset.val;

      switch (action) {
        case 'number':
          if (val === '00') inputDoubleZero();
          else inputDigit(val);
          break;
        case 'decimal':
          inputDecimal();
          break;
        case 'operator':
          handleOperator(val);
          break;
        case 'calculate':
          handleCalculate();
          break;
        case 'clear-all':
          handleClear();
          break;
        case 'backspace':
          handleBackspace();
          break;
        case 'percent':
          handlePercent();
          break;
        case 'negate':
          handleNegate();
          break;
        case 'paren-open':
          handleParenthesis('(');
          break;
        case 'paren-close':
          handleParenthesis(')');
          break;
        default:
          if (btn.classList.contains('key-sci')) {
            handleScientific(action);
          }
          break;
      }
    });

    // Physical Keyboard Support
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is focusing an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      let keyBtn = null;

      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
        keyBtn = document.querySelector(`.key-num[data-val="${e.key}"]`);
      } else if (e.key === '.') {
        inputDecimal();
        keyBtn = document.querySelector('.key[data-action="decimal"]');
      } else if (e.key === '+') {
        handleOperator('+');
        keyBtn = document.querySelector('.key-op[data-val="+"]');
      } else if (e.key === '-') {
        handleOperator('-');
        keyBtn = document.querySelector('.key-op[data-val="-"]');
      } else if (e.key === '*') {
        handleOperator('*');
        keyBtn = document.querySelector('.key-op[data-val="*"]');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('/');
        keyBtn = document.querySelector('.key-op[data-val="/"]');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
        keyBtn = document.getElementById('equalsBtn');
      } else if (e.key === 'Backspace') {
        handleBackspace();
        keyBtn = document.querySelector('.key[data-action="backspace"]');
      } else if (e.key === 'Escape') {
        handleClear();
        keyBtn = document.getElementById('clearBtn');
      } else if (e.key === '%') {
        handlePercent();
        keyBtn = document.querySelector('.key[data-action="percent"]');
      } else if (e.key === '(') {
        handleParenthesis('(');
        keyBtn = document.querySelector('.key[data-action="paren-open"]');
      } else if (e.key === ')') {
        handleParenthesis(')');
        keyBtn = document.querySelector('.key[data-action="paren-close"]');
      }

      if (keyBtn) {
        keyBtn.classList.add('pressed');
        setTimeout(() => keyBtn.classList.remove('pressed'), 120);
      }
    });
  }

  // --- Saved Preferences Loading ---
  function loadPreferences() {
    try {
      // Saved Theme (Default is Day Mode as requested)
      const savedTheme = localStorage.getItem('aura_calc_theme') || 'day';
      setTheme(savedTheme);

      // Saved Glow
      const savedGlow = localStorage.getItem('aura_calc_glow') || 'cyan';
      setAuraGlow(savedGlow);

      // Saved Sound
      const savedSound = localStorage.getItem('aura_calc_sound');
      if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        soundOnIcon.classList.toggle('hidden', !soundEnabled);
        soundOffIcon.classList.toggle('hidden', soundEnabled);
      }

      // Saved History
      const savedHistory = localStorage.getItem('aura_calc_history');
      if (savedHistory) {
        history = JSON.parse(savedHistory);
        renderHistory();
      }
    } catch (e) {
      console.warn('Could not access localStorage for preferences', e);
    }
  }

  // --- Initialize App ---
  function init() {
    loadPreferences();
    initEvents();
    updateDisplay();
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
