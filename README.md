# Financial Literacy Lab

A self-contained, no-build web app of interactive dashboards and games for
real-world money skills. Open `index.html` in any browser — that's it.

The first topic walks you through starting a 401(k) (basics, employer match,
compound growth, Traditional vs. Roth, asset allocation, quiz, action plan).
A second topic on emergency funds is included as a working example of how to
add your own.

---

## Quick start

```bash
# Just open the file
open index.html        # macOS
xdg-open index.html    # Linux

# Or serve it (recommended; needed if you ever switch to ES modules)
python3 -m http.server 8000
# then visit http://localhost:8000
```

Progress (visited modules, checklist state) is saved to `localStorage` per
browser. Clear it with DevTools → Application → Local Storage if you want a
fresh start.

---

## Project structure

```
fin-lit/
├── index.html                 # Shell — header, nav containers, script tags
├── styles.css                 # All styling (dark theme, responsive)
├── app.js                     # Engine: registry, navigation, helpers
├── topics/
│   ├── retirement-401k.js     # 7 modules on starting a 401(k)
│   └── emergency-fund.js      # 3 modules on building a cash buffer
└── README.md
```

The engine knows nothing about specific topics. Each topic file is independent
and registers itself by calling `FinLit.registerTopic({...})`. Adding a new
topic is one new file plus one `<script>` tag in `index.html`.

---

## How to add a new topic

### 1. Create `topics/<your-topic>.js`

```js
FinLit.registerTopic({
  id: 'budgeting',                      // required, unique
  title: 'Budgeting Basics',            // required, shown in topic pill
  icon: '📊',                           // optional, emoji or short string
  description: 'Track and plan...',     // optional
  modules: [                            // required, at least one
    { id: 'intro',     title: 'Why Budget',   render: renderIntro },
    { id: 'fifty30',   title: '50/30/20',     render: render503020 },
    { id: 'tracker',   title: 'Spend Tracker', render: renderTracker },
  ],
});

function renderIntro(panel, ctx) {
  panel.innerHTML = `
    <h2>Why Budget?</h2>
    <p class="lead">A budget is just a plan for your money…</p>
  `;
}

function render503020(panel, ctx) {
  panel.innerHTML = `
    <h2>The 50/30/20 Rule</h2>
    <div class="two-col">
      <div class="controls">
        <label>Take-home pay <span class="value" id="payVal"></span>
          <input type="range" id="pay" min="2000" max="15000" step="100" value="5000" />
        </label>
      </div>
      <div class="results">
        <div class="result-row"><div class="result-label">Needs (50%)</div>
          <div class="result-value" id="needs">—</div></div>
        <div class="result-row"><div class="result-label">Wants (30%)</div>
          <div class="result-value" id="wants">—</div></div>
        <div class="result-row highlight-row"><div class="result-label">Saving (20%)</div>
          <div class="result-value" id="save">—</div></div>
      </div>
    </div>
  `;
  const $ = (s) => panel.querySelector(s);
  const update = () => {
    const pay = +$('#pay').value;
    $('#payVal').textContent = ctx.fmt(pay);
    $('#needs').textContent = ctx.fmt(pay * 0.5);
    $('#wants').textContent = ctx.fmt(pay * 0.3);
    $('#save').textContent  = ctx.fmt(pay * 0.2);
  };
  $('#pay').addEventListener('input', update);
  update();
}
```

### 2. Reference it from `index.html`

```html
<script src="topics/budgeting.js"></script>
```

That's it. Reload — your topic appears as a pill in the topic nav and its
modules show up as numbered tabs.

---

## Module render API

```js
{
  id: string,                       // unique within the topic
  title: string,                    // shown in module tab
  render: (panel, ctx) => void,     // called fresh on every navigation
}
```

* `panel` — empty `<section>` you should fill via `innerHTML` and
  `panel.querySelector(...)`.
* `ctx` — the `FinLit` global (also available as `window.FinLit`). Use it for
  formatters, charts, and helpers.

The engine appends a "Next: …" button automatically after the panel, so you
don't need to hardcode navigation between modules.

### Why scope queries to `panel`?

Several modules can use the same DOM ids (`#stockMix`, `#age`, etc.). Using
`panel.querySelector` instead of `document.getElementById` keeps modules
isolated and copy-pasteable.

---

## `FinLit` helper reference

### Formatters

| Function           | Example output     | Notes                          |
| ------------------ | ------------------ | ------------------------------ |
| `FinLit.fmt(n)`    | `"$1,234"`         | rounded, comma-grouped         |
| `FinLit.fmtSign(n)`| `"+$50"` / `"-$50"`| signed currency                |
| `FinLit.pct(n, d)` | `"7.5%"`           | `d` = decimal places (default 0) |

### Charts

```js
const chart = ctx.makeChart(canvasEl, chartJsConfig);
// later:
chart.data.datasets[0].data = [...];
chart.update('none');
```

Charts created via `makeChart` are tracked and **destroyed automatically** when
the user navigates away. Don't `new Chart(...)` directly.

### Quizzes

```js
ctx.makeQuiz(container, questions, onCompleteOptional);
// questions: [{ q, options:[...], correct: index, explain: "..." }]
```

The helper renders the questions, shows feedback per click, totals the score,
and renders a "Retake quiz" button.

### Persistent checklists

```js
ctx.makeChecklist(container, items, persistKey, successHTML);
// items:      [{ title, body }]
// persistKey: e.g. 'budgeting:starter' — stored under localStorage
// successHTML: optional banner shown when all are checked
```

State persists per `persistKey`. Use a `topicId:something` form to namespace.

### Per-module state (advanced)

```js
const s = ctx.getModuleState('budgeting', 'tracker', { entries: [] });
s.entries.push({ amt: 12, cat: 'food' });
ctx.setModuleState('budgeting', 'tracker', s);
```

For modules that need to remember user-entered data across sessions.

---

## CSS hooks you can reuse

The stylesheet provides building blocks so new modules feel consistent without
new CSS:

| Class                               | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `.lead`                             | Intro paragraph under an `<h2>`            |
| `.cards` + `.card` (`.highlight`)   | 3-up info card grid                        |
| `.kv-grid` + `.kv`                  | Key/value stat tiles                       |
| `.callout` (`.success`)             | Yellow/green emphasized note               |
| `.two-col`                          | Left controls / right results layout       |
| `.controls` + `<label>` + slider    | Standard slider row with `<span class="value">` |
| `.results`, `.result-row`           | Right-side number readout                  |
| `.big-stat` / `.big-stat-value`     | Hero metric                                |
| `.verdict` (`.good`/`.bad`/`.neutral`) | Inline conclusion banner                |
| `.chart-wrap` + `<canvas>`          | Sized chart container                      |
| `.preset-row` + `.preset`           | Quick-select buttons                       |

---

## Topic ideas to add

* **Budgeting** — 50/30/20 calculator, fixed/variable expense tracker, surplus visualizer.
* **Debt payoff** — avalanche vs snowball simulator with payoff timeline.
* **Credit scores** — utilization slider, factors quiz, hard-pull cooldown timer.
* **Roth IRA / IRA** — mirrors the 401(k) flow but for individual accounts.
* **Investing basics** — index funds vs picking stocks, expense-ratio drag.
* **Home buying** — affordability calculator (DTI, PITI, opportunity cost vs renting).
* **Tax basics** — bracket walker, marginal vs effective rate, withholding sanity check.

Each fits the same `{id, title, modules: [...]}` shape as the included topics.

---

## Disclaimer

Educational tool — not financial advice. Numbers are estimates; consult a
fiduciary advisor before making real decisions.
