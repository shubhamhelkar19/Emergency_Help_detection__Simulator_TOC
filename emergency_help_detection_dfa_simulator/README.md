# Emergency Keyword Detection — DFA Simulation

A beginner-friendly browser simulation for a Theory of Computation project. It models one real-life idea: a college safety desk receives a student message and checks whether it contains a keyword chosen by the user.

## Real-life concept

For example, a student could send: `I AM NEAR THE LAB PLEASE FIRE ALERT`. Type `FIRE` into **Keyword to find**, then click **Build DFA & Scan**. The DFA reads the message from left to right. Its states track how much of the chosen keyword has matched so far.

For the keyword `FIRE`:

- `q0`: no part of FIRE is currently matched
- `q1`: `F` matched
- `q2`: `FI` matched
- `q3`: `FIR` matched
- `q4`: `FIRE` matched — accepting state

You can replace `FIRE` with `HELP`, `SOS`, `DANGER`, or another word up to 24 characters. The state diagram, transition table, accepting state, keyword length, and detection messages update to match your word. Matching ignores uppercase/lowercase differences.

## Features

- Editable student message and editable target keyword.
- Sample campus messages for the library, main gate, hostel, and a no-match test.
- Dynamically generated DFA state diagram and transition table for the selected keyword.
- `Next Step`, `Previous`, `Play/Pause`, and `Reset` controls.
- Highlights the current character and each detected occurrence of the selected keyword.
- Shows scan progress, current state, next state, matches, and character positions.
- Responsive desktop/mobile layout.
- No backend or package installation required.

## How to run on Windows

1. Download and extract the ZIP file.
2. Open the `emergency_help_detection_dfa_simulator` folder.
3. Double-click `index.html` to open it in Chrome or Microsoft Edge.
4. Type a message that contains the word you want to detect. For example: `THERE IS A FIRE NEAR THE LAB`.
5. Replace `HELP` in **Keyword to find** with `FIRE`.
6. Click **Build DFA & Scan**.
7. Press **Next Step** to see how each character changes the DFA state, or press **Play** for automatic scanning.

## Theory of Computation connection

A deterministic finite automaton (DFA) is represented by states, an input alphabet, a transition function, a start state (`q0`), and an accepting state. For a keyword of length `m`, the simulator creates states `q0` through `qm`. The accepting state `qm` is reached when the full keyword has been read in sequence. The transition table shows how the automaton changes state for each character.

## Important limitation

This is an educational prototype. It matches the literal character sequence typed as the keyword; it does not understand message context or determine whether a person is truly in danger. It does not contact campus security or emergency services.

## Files

- `index.html` — page layout
- `style.css` — styles and responsive layout
- `script.js` — DFA construction, transitions, animation, and detection report
