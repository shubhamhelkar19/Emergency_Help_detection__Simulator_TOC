const textInput = document.getElementById('textInput');
const patternInput = document.getElementById('patternInput');
const buildBtn = document.getElementById('buildBtn');
const exampleBtn = document.getElementById('exampleBtn');
const errorBox = document.getElementById('error');
const automaton = document.getElementById('automaton');
const tableWrap = document.getElementById('tableWrap');
const textDisplay = document.getElementById('textDisplay');
const stateLegend = document.querySelector('.state-legend');
const currentChar = document.getElementById('currentChar');
const currentState = document.getElementById('currentState');
const nextState = document.getElementById('nextState');
const position = document.getElementById('position');
const characterHint = document.getElementById('characterHint');
const messageBox = document.getElementById('message');
const status = document.getElementById('status');
const scanPercent = document.getElementById('scanPercent');
const progressBar = document.getElementById('progressBar');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');
const matchCount = document.getElementById('matchCount');
const transitionCount = document.getElementById('transitionCount');
const patternLength = document.getElementById('patternLength');
const modelTitle = document.getElementById('modelTitle');
const modelDescription = document.getElementById('modelDescription');
const heroKeywordTag = document.getElementById('heroKeywordTag');
const automatonHint = document.getElementById('automatonHint');
const tableHint = document.getElementById('tableHint');
const matchesBox = document.getElementById('matches');
const scenarioButtons = [...document.querySelectorAll('[data-scenario]')];

const scenarios = {
  library: {
    text: 'I AM NEAR THE LIBRARY PLEASE HELP ME NOW',
    pattern: 'HELP',
    message: 'Library emergency sample: the DFA will search the message for HELP.',
  },
  gate: {
    text: 'HELP I AM LOST NEAR THE MAIN GATE',
    pattern: 'HELP',
    message: 'Main gate emergency sample: the keyword appears at the beginning of the message.',
  },
  hostel: {
    text: 'PLEASE HELP ME NEAR HOSTEL BLOCK B',
    pattern: 'HELP',
    message: 'Hostel emergency sample: watch the DFA reach accepting state q4 when it reads HELP.',
  },
  noMatch: {
    text: 'I AM WAITING NEAR THE LIBRARY',
    pattern: 'HELP',
    message: 'No-match test: this sample has no HELP keyword, so the scan should finish without an alert.',
  },
};

let model = null;
let stepIndex = 0; // number of characters already processed
let stateHistory = [0];
let playing = false;
let timer = null;
let activeScenario = 'library';

function cleanInput(value) {
  return value.toLocaleUpperCase('en-US');
}

// Build the transition function δ(q, c). A state q means that q characters
// of the keyword currently match the end of the text consumed so far.
function buildDFA(pattern) {
  const alphabet = [...new Set(pattern.split(''))];
  const m = pattern.length;
  const table = Array.from({ length: m + 1 }, () => Object.create(null));

  for (let q = 0; q <= m; q++) {
    for (const ch of alphabet) {
      const candidate = pattern.slice(0, q) + ch;
      let best = Math.min(m, candidate.length);
      while (best > 0 && !candidate.endsWith(pattern.slice(0, best))) best--;
      table[q][ch] = best;
    }
  }
  return { pattern, alphabet, table };
}

function getNextState(state, ch) {
  return model.table[state][ch] !== undefined ? model.table[state][ch] : 0;
}

function build() {
  stopPlaying();
  const text = cleanInput(textInput.value.trim());
  const pattern = cleanInput(patternInput.value.trim());
  errorBox.textContent = '';

  if (!text) {
    errorBox.textContent = 'Enter a message to scan.';
    textInput.focus();
    return;
  }
  if (!pattern) {
    errorBox.textContent = 'Enter the keyword the DFA should detect.';
    patternInput.focus();
    return;
  }
  if (pattern.length > 24) {
    errorBox.textContent = 'Keep the keyword within 24 characters so the state diagram stays readable.';
    patternInput.focus();
    return;
  }

  textInput.value = text;
  patternInput.value = pattern;
  model = { text, ...buildDFA(pattern) };
  stepIndex = 0;
  stateHistory = [0];

  renderAutomaton();
  renderTable();
  renderText();
  patternLength.textContent = String(pattern.length);
  updateUI();
  updateKeywordLabels(pattern);
  setStatus('READY TO SCAN', '');
  setMessage(`DFA for \"${pattern}\" is ready. Press Next Step to follow each character, or Play to scan automatically.`, '');
}

function updateKeywordLabels(pattern) {
  const m = pattern.length;
  modelTitle.textContent = `DFA for the keyword ${pattern}`;
  heroKeywordTag.textContent = pattern;
  if (m === 1) {
    modelDescription.textContent = `q0 = no match; q1 = the keyword “${pattern}” detected.`;
  } else {
    modelDescription.textContent = `q0 = no match; q1–q${m - 1} represent partial matches; q${m} = the complete keyword detected.`;
  }
  automatonHint.textContent = `Matching characters move the DFA through its states. Reaching accepting state q${m} means the complete keyword “${pattern}” was found.`;
  const alphabet = [...new Set(pattern.split(''))].map(ch => ch === ' ' ? 'SPACE' : ch).join(', ');
  tableHint.textContent = `“Other” means any character not in the keyword alphabet (${alphabet}); it transitions to q0.`;
}

function renderAutomaton() {
  const m = model.pattern.length;
  stateLegend.innerHTML = '<span><i class="legend-start"></i> Start state</span><span><i class="legend-accept"></i> Accept state</span>';
  const track = document.createElement('div');
  track.className = 'automaton-track';

  for (let q = 0; q <= m; q++) {
    const wrap = document.createElement('div');
    wrap.className = 'state-wrap';
    const node = document.createElement('div');
    node.className = `state-node${q === m ? ' accept' : ''}`;
    node.dataset.state = String(q);
    const small = document.createElement('small');
    small.textContent = q === 0 ? 'START' : q === m ? 'ACCEPT' : '';
    node.append(small, document.createTextNode(`q${q}`));
    wrap.appendChild(node);

    if (q < m) {
      const arrow = document.createElement('div');
      arrow.className = 'state-arrow';
      const label = document.createElement('span');
      label.textContent = model.pattern[q] === ' ' ? 'SPACE' : model.pattern[q];
      arrow.appendChild(label);
      wrap.appendChild(arrow);
    }
    track.appendChild(wrap);
  }
  automaton.replaceChildren(track);
}

function renderTable() {
  const headers = model.alphabet.map(ch => `<th>${escapeHtml(displayChar(ch))}</th>`).join('');
  let html = `<table><thead><tr><th>State</th>${headers}<th>Other</th></tr></thead><tbody>`;
  for (let q = 0; q <= model.pattern.length; q++) {
    html += `<tr data-row-state="${q}" class="${q === model.pattern.length ? 'accept-row' : ''}"><td>q${q}${q === model.pattern.length ? ' ✓' : ''}</td>`;
    for (const ch of model.alphabet) html += `<td>q${model.table[q][ch]}</td>`;
    html += '<td>q0</td></tr>';
  }
  html += '</tbody></table>';
  tableWrap.innerHTML = html;
}

function renderText() {
  const fragment = document.createDocumentFragment();
  [...model.text].forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = `char${ch === ' ' ? ' space' : ''}`;
    span.dataset.index = String(i);
    span.textContent = displayChar(ch);
    span.title = ch === ' ' ? `Space at position ${i + 1}` : `Position ${i + 1}: ${ch}`;
    fragment.appendChild(span);
  });
  textDisplay.replaceChildren(fragment);
}

function displayChar(ch) {
  if (ch === ' ') return '·';
  if (ch === '\n') return '↵';
  return ch;
}

function getMatchesAtCurrentStep() {
  const found = [];
  for (let i = 0; i < stepIndex; i++) {
    if (stateHistory[i + 1] === model.pattern.length) found.push(i - model.pattern.length + 1);
  }
  return found;
}

function renderTextHighlights() {
  const chars = [...textDisplay.querySelectorAll('.char')];
  chars.forEach((el, i) => {
    el.classList.remove('processed', 'current', 'match');
    if (i < stepIndex) el.classList.add('processed');
    if (i === stepIndex && stepIndex < model.text.length) el.classList.add('current');
  });

  for (const start of getMatchesAtCurrentStep()) {
    for (let i = start; i < start + model.pattern.length; i++) {
      if (chars[i]) chars[i].classList.add('match');
    }
  }
}

function updateUI() {
  if (!model) return;
  const matches = getMatchesAtCurrentStep();
  const done = stepIndex >= model.text.length;
  const nextInput = done ? null : model.text[stepIndex];
  const state = stateHistory[stepIndex];
  const predicted = nextInput === null ? null : getNextState(state, nextInput);
  const percent = Math.round((stepIndex / model.text.length) * 100);

  renderTextHighlights();
  matchCount.textContent = String(matches.length);
  transitionCount.textContent = String(stepIndex);
  patternLength.textContent = String(model.pattern.length);
  currentChar.textContent = nextInput === null ? 'END' : displayChar(nextInput);
  characterHint.textContent = nextInput === null ? 'Message fully scanned' : (nextInput === ' ' ? 'Space character' : 'Waiting for next transition');
  currentState.textContent = `q${state}`;
  nextState.textContent = predicted === null ? '—' : `q${predicted}`;
  position.textContent = `${stepIndex} / ${model.text.length}`;
  scanPercent.textContent = `${percent}% scanned`;
  progressBar.style.width = `${percent}%`;

  document.querySelectorAll('.state-node').forEach(node => {
    node.classList.toggle('active', Number(node.dataset.state) === state);
  });
  tableWrap.querySelectorAll('tbody tr').forEach(row => {
    row.classList.toggle('active-row', Number(row.dataset.rowState) === state);
  });

  nextBtn.disabled = done;
  playBtn.disabled = done;
  prevBtn.disabled = stepIndex === 0;

  if (matches.length === 0) {
    matchesBox.textContent = done ? 'No keyword found in this message.' : 'No keyword detected yet.';
  } else {
    matchesBox.innerHTML = matches.map(start => `<span class="match-pill">position ${start + 1}–${start + model.pattern.length}</span>`).join('');
  }

  if (stepIndex === 0) {
    setStatus('READY TO SCAN', '');
  } else if (done) {
    setStatus(matches.length ? 'SCAN COMPLETE · ALERT FOUND' : 'SCAN COMPLETE · NO MATCH', matches.length ? 'found' : 'finished');
  } else if (state === model.pattern.length) {
    setStatus('KEYWORD DETECTED', 'found');
  } else {
    setStatus('SCANNING MESSAGE', 'running');
  }
}

function nextStep() {
  if (!model || stepIndex >= model.text.length) return;
  const ch = model.text[stepIndex];
  const before = stateHistory[stepIndex];
  const after = getNextState(before, ch);
  stateHistory.push(after);
  stepIndex++;
  updateUI();

  if (after === model.pattern.length) {
    const start = stepIndex - model.pattern.length;
    setMessage(`Keyword “${model.pattern}” detected at character positions ${start + 1}–${stepIndex}. This is a simulation only; no real alert is sent.`, 'found');
  } else if (stepIndex >= model.text.length) {
    const matches = getMatchesAtCurrentStep();
    if (matches.length) setMessage(`Scan complete. “${model.pattern}” was found ${matches.length} time${matches.length === 1 ? '' : 's'}. The green characters and positions identify each match. No real alert is sent.`, 'finished');
    else setMessage(`Scan complete. “${model.pattern}” was not found, so the simulation does not flag this message.`, 'finished');
  } else {
    setMessage(`Read “${displayChar(ch)}”: q${before} → q${after}. The automaton keeps the longest prefix of the keyword that matches the text seen so far.`, '');
  }
}

function previousStep() {
  if (!model || stepIndex <= 0) return;
  stepIndex--;
  stateHistory.pop();
  updateUI();
  setMessage(`Moved back one character. Continue to watch how the DFA checks for “${model.pattern}”.`, '');
}

function reset() {
  stopPlaying();
  if (!model) return;
  stepIndex = 0;
  stateHistory = [0];
  updateUI();
  setMessage(`Simulation reset. The DFA is back at q0, ready to check for “${model.pattern}”.`, '');
}

function play() {
  if (!model || stepIndex >= model.text.length) return;
  if (playing) {
    stopPlaying();
    setMessage('Automatic scanning paused. Use Next Step or Play to continue.', '');
    return;
  }
  playing = true;
  playBtn.textContent = 'Ⅱ Pause';
  setStatus('SCANNING MESSAGE', 'running');
  timer = window.setInterval(() => {
    if (stepIndex >= model.text.length) {
      stopPlaying();
      updateUI();
      return;
    }
    nextStep();
    if (stepIndex >= model.text.length) stopPlaying();
  }, 450);
}

function stopPlaying() {
  playing = false;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  playBtn.textContent = '▶ Play';
}

function setStatus(text, kind) {
  status.textContent = text;
  status.className = `status-chip${kind ? ` ${kind}` : ''}`;
}

function setMessage(text, kind) {
  const symbol = kind === 'found' ? '✓' : kind === 'finished' ? '◈' : 'ⓘ';
  messageBox.className = `event-message${kind === 'found' ? ' event-found' : kind === 'finished' ? ' event-finished' : ''}`;
  messageBox.replaceChildren();
  const icon = document.createElement('span');
  icon.className = 'event-symbol';
  icon.textContent = symbol;
  const content = document.createElement('span');
  content.textContent = text;
  messageBox.append(icon, content);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch]);
}

function loadScenario(name, shouldBuild = true) {
  const scenario = scenarios[name];
  if (!scenario) return;
  activeScenario = name;
  textInput.value = scenario.text;
  if (!patternInput.value.trim()) patternInput.value = scenario.pattern;
  scenarioButtons.forEach(btn => btn.classList.toggle('selected', btn.dataset.scenario === name));
  if (shouldBuild) build();
}

buildBtn.addEventListener('click', build);
exampleBtn.addEventListener('click', () => loadScenario(activeScenario));
nextBtn.addEventListener('click', nextStep);
prevBtn.addEventListener('click', previousStep);
resetBtn.addEventListener('click', reset);
playBtn.addEventListener('click', play);
scenarioButtons.forEach(btn => btn.addEventListener('click', () => loadScenario(btn.dataset.scenario)));
[textInput, patternInput].forEach(input => input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
    event.preventDefault();
    build();
  }
}));

loadScenario('library');
