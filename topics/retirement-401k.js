/**
 * Topic: Starting a 401(k)
 * Each module is a {id, title, render(panel, FinLit)} object. Render is called
 * fresh on every module entry; charts created with FinLit.makeChart get
 * destroyed automatically when the user navigates away.
 */
FinLit.registerTopic({
  id: 'retirement-401k',
  title: 'Starting a 401(k)',
  icon: '💼',
  description:
    'Your first step into investing — through your workplace retirement account.',
  modules: [
    { id: 'basics', title: 'Basics', render: renderBasics },
    { id: 'match', title: 'Employer Match', render: renderMatch },
    { id: 'growth', title: 'Compound Growth', render: renderGrowth },
    { id: 'tax', title: 'Tax Savings', render: renderTax },
    { id: 'allocation', title: 'Allocation', render: renderAllocation },
    { id: 'quiz', title: 'Quiz', render: renderQuiz },
    { id: 'plan', title: 'Action Plan', render: renderPlan },
  ],
});

// ============================================================================
// MODULE: Basics
// ============================================================================
function renderBasics(el) {
  el.innerHTML = `
    <h2>What is a 401(k)?</h2>
    <p class="lead">A 401(k) is a workplace retirement account that lets you invest a portion of every paycheck — usually with three big advantages:</p>
    <div class="cards">
      <div class="card">
        <div class="card-icon">$</div>
        <h3>Tax Advantage</h3>
        <p>Traditional contributions reduce your taxable income today. Roth 401(k) contributions grow tax-free for later.</p>
      </div>
      <div class="card highlight">
        <div class="card-icon">🤝</div>
        <h3>Employer Match</h3>
        <p>Many employers add money on top of yours. This is essentially a guaranteed return — free money.</p>
      </div>
      <div class="card">
        <div class="card-icon">📈</div>
        <h3>Compound Growth</h3>
        <p>Returns earn returns. Over decades this is the engine that turns small contributions into big balances.</p>
      </div>
    </div>

    <div class="kv-grid">
      <div class="kv">
        <div class="kv-key">2025 contribution limit</div>
        <div class="kv-val">$23,500</div>
        <div class="kv-sub">+ $7,500 catch-up if age 50+</div>
      </div>
      <div class="kv">
        <div class="kv-key">Typical employer match</div>
        <div class="kv-val">3 – 6%</div>
        <div class="kv-sub">of your salary, when you contribute</div>
      </div>
      <div class="kv">
        <div class="kv-key">Vesting</div>
        <div class="kv-val">0 – 6 yrs</div>
        <div class="kv-sub">how long until match is fully yours</div>
      </div>
      <div class="kv">
        <div class="kv-key">Early withdrawal</div>
        <div class="kv-val">10% penalty</div>
        <div class="kv-sub">before age 59½, plus income tax</div>
      </div>
    </div>

    <div class="callout">
      <strong>The golden rule:</strong> at minimum, contribute enough to capture your full employer match. Anything less is leaving money on the table.
    </div>
  `;
}

// ============================================================================
// MODULE: Employer Match
// ============================================================================
function renderMatch(el, ctx) {
  el.innerHTML = `
    <h2>Employer Match Maximizer</h2>
    <p class="lead">See exactly how much "free money" your employer match is worth — and what you'd lose by not contributing enough.</p>

    <div class="two-col">
      <div class="controls">
        <label>Annual salary <span class="value" id="matchSalaryVal"></span>
          <input type="range" id="matchSalary" min="30000" max="250000" step="1000" value="70000" />
        </label>
        <label>Your contribution (% of salary) <span class="value" id="matchContribVal"></span>
          <input type="range" id="matchContrib" min="0" max="15" step="0.5" value="3" />
        </label>
        <label>Employer match rate <span class="value" id="matchRateVal"></span>
          <input type="range" id="matchRate" min="0" max="100" step="5" value="100" />
          <small>$1 employer per $1 you contribute, up to the cap below</small>
        </label>
        <label>Match cap (% of salary) <span class="value" id="matchCapVal"></span>
          <input type="range" id="matchCap" min="0" max="10" step="0.5" value="5" />
        </label>
      </div>

      <div class="results">
        <div class="result-row"><div class="result-label">Your annual contribution</div><div class="result-value" id="yourContrib">—</div></div>
        <div class="result-row highlight-row"><div class="result-label">Employer match (free money)</div><div class="result-value" id="employerMatch">—</div></div>
        <div class="result-row"><div class="result-label">Total going into your 401(k)</div><div class="result-value" id="totalContrib">—</div></div>
        <div class="result-row warn"><div class="result-label">Match you're leaving behind</div><div class="result-value" id="missedMatch">—</div></div>
        <div id="matchVerdict" class="verdict"></div>
      </div>
    </div>

    <div class="chart-wrap"><canvas id="matchChart"></canvas></div>
  `;

  const $ = (s) => el.querySelector(s);
  const chart = ctx.makeChart($('#matchChart'), {
    type: 'bar',
    data: {
      labels: ['You contribute', 'Employer match', 'Money left behind'],
      datasets: [{ data: [0, 0, 0], backgroundColor: ['#60a5fa', '#6ee7b7', '#ef4444'], borderRadius: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ctx.fmt(c.parsed.y) + ' / yr' } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#9aa6c2', callback: (v) => ctx.fmt(v) }, grid: { color: 'rgba(255,255,255,0.06)' } },
        x: { ticks: { color: '#9aa6c2' }, grid: { display: false } },
      },
    },
  });

  const update = () => {
    const salary = +$('#matchSalary').value;
    const contribPct = +$('#matchContrib').value;
    const matchRate = +$('#matchRate').value / 100;
    const matchCap = +$('#matchCap').value;

    $('#matchSalaryVal').textContent = ctx.fmt(salary);
    $('#matchContribVal').textContent = ctx.pct(contribPct, 1);
    $('#matchRateVal').textContent = ctx.pct(matchRate * 100);
    $('#matchCapVal').textContent = ctx.pct(matchCap, 1);

    const yourContrib = (salary * contribPct) / 100;
    const matchedPct = Math.min(contribPct, matchCap);
    const employerMatch = ((salary * matchedPct) / 100) * matchRate;
    const total = yourContrib + employerMatch;
    const maxPossible = ((salary * matchCap) / 100) * matchRate;
    const missed = Math.max(0, maxPossible - employerMatch);

    $('#yourContrib').textContent = ctx.fmt(yourContrib) + ' / yr';
    $('#employerMatch').textContent = ctx.fmt(employerMatch) + ' / yr';
    $('#totalContrib').textContent = ctx.fmt(total) + ' / yr';
    $('#missedMatch').textContent = missed > 0 ? ctx.fmt(missed) + ' / yr' : '$0 (nice!)';

    const v = $('#matchVerdict');
    if (matchCap === 0 || matchRate === 0) {
      v.className = 'verdict neutral';
      v.textContent = 'No employer match configured. Still worth contributing for the tax benefit + compound growth.';
    } else if (contribPct >= matchCap) {
      v.className = 'verdict good';
      v.textContent = `✅ You're capturing the FULL match — great. That's an instant ${ctx.pct(matchRate * 100)} return on every dollar up to the cap.`;
    } else if (contribPct === 0) {
      v.className = 'verdict bad';
      v.textContent = `🚨 Contributing 0% means you're walking past ${ctx.fmt(maxPossible)}/year of free money. Even 1% beats nothing.`;
    } else {
      v.className = 'verdict bad';
      v.textContent = `⚠️ You're leaving ${ctx.fmt(missed)}/yr behind. Bumping contributions to ${ctx.pct(matchCap, 1)} captures the full match.`;
    }

    chart.data.datasets[0].data = [yourContrib, employerMatch, missed];
    chart.update('none');
  };

  el.querySelectorAll('input[type=range]').forEach((i) =>
    i.addEventListener('input', update)
  );
  update();
}

// ============================================================================
// MODULE: Compound Growth
// ============================================================================
function renderGrowth(el, ctx) {
  el.innerHTML = `
    <h2>Compound Growth Simulator</h2>
    <p class="lead">Time is the single biggest lever in retirement investing. Move the sliders and watch what happens.</p>

    <div class="two-col">
      <div class="controls">
        <label>Current age <span class="value" id="ageVal"></span>
          <input type="range" id="age" min="20" max="60" step="1" value="25" /></label>
        <label>Retirement age <span class="value" id="retireVal"></span>
          <input type="range" id="retire" min="50" max="75" step="1" value="65" /></label>
        <label>Annual salary <span class="value" id="growSalaryVal"></span>
          <input type="range" id="growSalary" min="30000" max="250000" step="1000" value="70000" /></label>
        <label>Your contribution (% of salary) <span class="value" id="growContribVal"></span>
          <input type="range" id="growContrib" min="0" max="20" step="0.5" value="10" /></label>
        <label>Employer match (% of salary) <span class="value" id="growMatchVal"></span>
          <input type="range" id="growMatch" min="0" max="10" step="0.5" value="5" /></label>
        <label>Expected annual return <span class="value" id="returnVal"></span>
          <input type="range" id="return" min="2" max="12" step="0.5" value="7" />
          <small>Long-run S&amp;P 500 average ≈ 7% real return</small></label>
        <label>Annual salary growth <span class="value" id="raiseVal"></span>
          <input type="range" id="raise" min="0" max="6" step="0.5" value="3" /></label>
      </div>

      <div class="results">
        <div class="big-stat">
          <div class="big-stat-label">Projected balance at retirement</div>
          <div class="big-stat-value" id="finalBalance">—</div>
        </div>
        <div class="result-row"><div class="result-label">Total you contributed</div><div class="result-value" id="totalYouContrib">—</div></div>
        <div class="result-row"><div class="result-label">Total employer match</div><div class="result-value" id="totalEmpMatch">—</div></div>
        <div class="result-row highlight-row"><div class="result-label">Investment growth</div><div class="result-value" id="totalGrowth">—</div></div>
        <div class="result-row"><div class="result-label">Estimated monthly retirement income (4% rule)</div><div class="result-value" id="monthlyIncome">—</div></div>
      </div>
    </div>

    <div class="chart-wrap"><canvas id="growthChart"></canvas></div>

    <div class="callout">
      <strong>Try this:</strong> bump retirement age from 65 to 67 — the balance often grows by 25%+. Then drop your start age by 5 years and watch what happens.
    </div>
  `;

  const $ = (s) => el.querySelector(s);
  const chart = ctx.makeChart($('#growthChart'), {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#e8edf7' } },
        tooltip: { mode: 'index', callbacks: { label: (c) => `${c.dataset.label}: ${ctx.fmt(c.parsed.y)}` } },
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { stacked: true, ticks: { color: '#9aa6c2', callback: (v) => ctx.fmt(v) }, grid: { color: 'rgba(255,255,255,0.06)' } },
        x: { stacked: true, ticks: { color: '#9aa6c2' }, title: { display: true, text: 'Age', color: '#9aa6c2' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
      elements: { point: { radius: 0, hoverRadius: 4 } },
    },
  });

  const update = () => {
    const age = +$('#age').value;
    const retire = +$('#retire').value;
    let salary = +$('#growSalary').value;
    const contribPct = +$('#growContrib').value / 100;
    const matchPct = +$('#growMatch').value / 100;
    const ret = +$('#return').value / 100;
    const raise = +$('#raise').value / 100;

    $('#ageVal').textContent = age;
    $('#retireVal').textContent = retire;
    $('#growSalaryVal').textContent = ctx.fmt(salary);
    $('#growContribVal').textContent = ctx.pct(contribPct * 100, 1);
    $('#growMatchVal').textContent = ctx.pct(matchPct * 100, 1);
    $('#returnVal').textContent = ctx.pct(ret * 100, 1);
    $('#raiseVal').textContent = ctx.pct(raise * 100, 1);

    if (retire <= age) {
      $('#finalBalance').textContent = '—';
      return;
    }

    const years = retire - age;
    const labels = [];
    const youSeries = [];
    const matchSeries = [];
    const growthSeries = [];

    let balance = 0;
    let cumYou = 0;
    let cumMatch = 0;
    let curSalary = salary;

    for (let i = 0; i <= years; i++) {
      labels.push(age + i);
      youSeries.push(Math.round(cumYou));
      matchSeries.push(Math.round(cumMatch));
      growthSeries.push(Math.round(Math.max(0, balance - cumYou - cumMatch)));

      if (i === years) break;
      const youAdd = curSalary * contribPct;
      const matchAdd = curSalary * matchPct;
      const monthlyAdd = (youAdd + matchAdd) / 12;
      const monthlyR = ret / 12;
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyR) + monthlyAdd;
      }
      cumYou += youAdd;
      cumMatch += matchAdd;
      curSalary *= 1 + raise;
    }

    const total = Math.round(balance);
    const growth = Math.max(0, total - cumYou - cumMatch);

    $('#finalBalance').textContent = ctx.fmt(total);
    $('#totalYouContrib').textContent = ctx.fmt(cumYou);
    $('#totalEmpMatch').textContent = ctx.fmt(cumMatch);
    $('#totalGrowth').textContent = ctx.fmt(growth);
    $('#monthlyIncome').textContent = ctx.fmt((total * 0.04) / 12) + ' / mo';

    chart.data.labels = labels;
    chart.data.datasets = [
      { label: 'Your contributions', data: youSeries, backgroundColor: 'rgba(96, 165, 250, 0.7)', borderColor: '#60a5fa', fill: true, stack: 'a' },
      { label: 'Employer match', data: matchSeries, backgroundColor: 'rgba(110, 231, 183, 0.7)', borderColor: '#6ee7b7', fill: true, stack: 'a' },
      { label: 'Investment growth', data: growthSeries, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderColor: '#f59e0b', fill: true, stack: 'a' },
    ];
    chart.update('none');
  };

  el.querySelectorAll('input[type=range]').forEach((i) =>
    i.addEventListener('input', update)
  );
  update();
}

// ============================================================================
// MODULE: Tax Savings (Traditional vs Roth)
// ============================================================================
function renderTax(el, ctx) {
  el.innerHTML = `
    <h2>Traditional vs. Roth — Tax Savings</h2>
    <p class="lead">Your 401(k) usually has two flavors. The right one depends on your tax rate now vs. in retirement.</p>

    <div class="two-col">
      <div class="controls">
        <label>Annual salary <span class="value" id="taxSalaryVal"></span>
          <input type="range" id="taxSalary" min="30000" max="250000" step="1000" value="70000" /></label>
        <label>Contribution (% of salary) <span class="value" id="taxContribVal"></span>
          <input type="range" id="taxContrib" min="0" max="20" step="0.5" value="10" /></label>
        <label>Marginal tax rate today <span class="value" id="taxNowVal"></span>
          <input type="range" id="taxNow" min="10" max="37" step="1" value="22" /></label>
        <label>Expected tax rate in retirement <span class="value" id="taxLaterVal"></span>
          <input type="range" id="taxLater" min="0" max="37" step="1" value="15" /></label>
      </div>

      <div class="results">
        <div class="comparison">
          <div class="comp-col">
            <h3>Traditional 401(k)</h3>
            <p class="comp-sub">Pre-tax contributions, taxed on withdrawal</p>
            <div class="comp-row"><span>Tax saved this year</span><strong id="tradSaved">—</strong></div>
            <div class="comp-row"><span>Tax owed in retirement</span><strong id="tradOwed">—</strong></div>
            <div class="comp-row total"><span>Net tax benefit</span><strong id="tradNet">—</strong></div>
          </div>
          <div class="comp-col alt">
            <h3>Roth 401(k)</h3>
            <p class="comp-sub">After-tax contributions, tax-free growth</p>
            <div class="comp-row"><span>Tax saved this year</span><strong>$0</strong></div>
            <div class="comp-row"><span>Tax owed in retirement</span><strong>$0</strong></div>
            <div class="comp-row total"><span>Net tax benefit</span><strong id="rothNet">—</strong></div>
          </div>
        </div>
        <div id="taxVerdict" class="verdict"></div>
      </div>
    </div>
  `;

  const $ = (s) => el.querySelector(s);
  const update = () => {
    const salary = +$('#taxSalary').value;
    const contribPct = +$('#taxContrib').value / 100;
    const tNow = +$('#taxNow').value / 100;
    const tLater = +$('#taxLater').value / 100;

    $('#taxSalaryVal').textContent = ctx.fmt(salary);
    $('#taxContribVal').textContent = ctx.pct(contribPct * 100, 1);
    $('#taxNowVal').textContent = ctx.pct(tNow * 100);
    $('#taxLaterVal').textContent = ctx.pct(tLater * 100);

    const contrib = salary * contribPct;
    const tradSaved = contrib * tNow;
    const tradOwed = contrib * tLater;
    const tradNet = tradSaved - tradOwed;
    const rothNet = contrib * tLater;

    $('#tradSaved').textContent = ctx.fmt(tradSaved);
    $('#tradOwed').textContent = ctx.fmt(tradOwed);
    $('#tradNet').textContent = ctx.fmtSign(tradNet);
    $('#rothNet').textContent = ctx.fmtSign(rothNet);

    const v = $('#taxVerdict');
    if (Math.abs(tNow - tLater) < 0.01) {
      v.className = 'verdict neutral';
      v.textContent = '🟰 Tax rates roughly equal — Traditional and Roth come out the same. Diversifying between both is a great move.';
    } else if (tNow > tLater) {
      v.className = 'verdict good';
      v.textContent = `📉 You expect to be in a LOWER bracket later. Traditional saves you ~${ctx.fmt((tNow - tLater) * contrib)} per year vs. Roth.`;
    } else {
      v.className = 'verdict good';
      v.textContent = `📈 You expect a HIGHER bracket later. Roth wins by ~${ctx.fmt((tLater - tNow) * contrib)} per year — pay tax now while it's cheap.`;
    }
  };

  el.querySelectorAll('input[type=range]').forEach((i) =>
    i.addEventListener('input', update)
  );
  update();
}

// ============================================================================
// MODULE: Asset Allocation
// ============================================================================
function renderAllocation(el, ctx) {
  el.innerHTML = `
    <h2>Asset Allocation Explorer</h2>
    <p class="lead">Inside your 401(k) you choose <em>how</em> the money is invested. More stocks = higher long-term return but bumpier ride.</p>

    <div class="two-col">
      <div class="controls">
        <label>Stocks (equities) <span class="value" id="stockMixVal"></span>
          <input type="range" id="stockMix" min="0" max="100" step="5" value="80" /></label>
        <div class="bond-display">Bonds: <strong id="bondVal">—</strong></div>
        <div class="preset-row">
          <button class="preset" data-mix="100">Aggressive 100/0</button>
          <button class="preset" data-mix="80">Growth 80/20</button>
          <button class="preset" data-mix="60">Balanced 60/40</button>
          <button class="preset" data-mix="40">Conservative 40/60</button>
        </div>
        <small>Rule of thumb: subtract your age from 110. That's a reasonable stock %. Younger investors have time to ride out volatility.</small>
        <div class="allocation-tip" id="allocationTip"></div>
      </div>

      <div class="results">
        <div class="result-row"><div class="result-label">Expected annual return</div><div class="result-value" id="expReturn">—</div></div>
        <div class="result-row"><div class="result-label">Typical worst year (1-yr drawdown)</div><div class="result-value warn-text" id="worstYear">—</div></div>
        <div class="result-row"><div class="result-label">Typical best year</div><div class="result-value good-text" id="bestYear">—</div></div>
        <div class="result-row"><div class="result-label">$10,000 in 30 years</div><div class="result-value" id="thirtyYears">—</div></div>
      </div>
    </div>

    <div class="chart-wrap"><canvas id="allocChart"></canvas></div>
    <p class="hint">Most 401(k)s offer a <strong>Target-Date Fund</strong> (e.g. "Target 2060") that does this automatically — perfect for beginners.</p>
  `;

  const $ = (s) => el.querySelector(s);
  const chart = ctx.makeChart($('#allocChart'), {
    type: 'doughnut',
    data: {
      labels: ['Stocks', 'Bonds'],
      datasets: [{ data: [80, 20], backgroundColor: ['#60a5fa', '#6ee7b7'], borderColor: '#0e1525', borderWidth: 3 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#e8edf7' } },
        tooltip: { callbacks: { label: (c) => c.label + ': ' + c.parsed + '%' } },
      },
      cutout: '60%',
    },
  });

  const update = () => {
    const stocks = +$('#stockMix').value;
    const bonds = 100 - stocks;
    $('#stockMixVal').textContent = stocks + '%';
    $('#bondVal').textContent = bonds + '%';

    // Educational approximations.
    // Stocks ~ 10% return, ~16% std dev. Bonds ~ 4% return, ~5% std dev. Low correlation.
    const expR = (stocks / 100) * 0.1 + (bonds / 100) * 0.04;
    const std = Math.sqrt(
      Math.pow(stocks / 100, 2) * 0.16 ** 2 +
        Math.pow(bonds / 100, 2) * 0.05 ** 2 +
        2 * (stocks / 100) * (bonds / 100) * 0.16 * 0.05 * 0.05
    );
    const worst = (expR - 2 * std) * 100;
    const best = (expR + 2 * std) * 100;
    const future = 10000 * Math.pow(1 + expR, 30);

    $('#expReturn').textContent = ctx.pct(expR * 100, 1) + ' / yr';
    $('#worstYear').textContent = ctx.pct(worst, 1);
    $('#bestYear').textContent = '+' + ctx.pct(best, 1);
    $('#thirtyYears').textContent = ctx.fmt(future);

    const tip = $('#allocationTip');
    if (stocks >= 90) tip.innerHTML = '<strong>Aggressive.</strong> Suitable for long horizons (30+ years). Expect 30%+ drops in bad years — stay the course.';
    else if (stocks >= 70) tip.innerHTML = '<strong>Growth-tilted.</strong> Most common for investors under 50. Strong long-term return, manageable volatility.';
    else if (stocks >= 50) tip.innerHTML = '<strong>Balanced.</strong> Smoother ride, lower long-term return. Common as you approach retirement.';
    else if (stocks >= 30) tip.innerHTML = '<strong>Conservative.</strong> Better for those near or in retirement. May not outpace inflation by much.';
    else tip.innerHTML = '<strong>Very conservative.</strong> Inflation will erode purchasing power if held for decades.';

    chart.data.datasets[0].data = [stocks, bonds];
    chart.update('none');
  };

  $('#stockMix').addEventListener('input', update);
  el.querySelectorAll('.preset').forEach((b) =>
    b.addEventListener('click', () => {
      $('#stockMix').value = b.dataset.mix;
      update();
    })
  );
  update();
}

// ============================================================================
// MODULE: Quiz
// ============================================================================
function renderQuiz(el, ctx) {
  el.innerHTML = `
    <h2>Quick Quiz — 401(k) IQ</h2>
    <p class="lead">Lock in what you learned. Retake anytime.</p>
    <div id="quizHost"></div>
  `;
  const questions = [
    {
      q: 'You earn $60,000 and your employer matches 100% of contributions up to 5% of salary. What\'s the minimum you should contribute to capture the full match?',
      options: ['1% — anything is good', '5% — to get the full match', '10% — more is always better', '0% — match is automatic'],
      correct: 1,
      explain: 'You need to contribute at least 5% of salary ($3,000) to capture the full $3,000 employer match. Anything less leaves money on the table.',
    },
    {
      q: 'A Traditional 401(k) contribution of $5,000 if you\'re in the 22% federal tax bracket reduces this year\'s tax bill by approximately:',
      options: ['$5,000', '$1,100', '$0 — taxes are unchanged', '$2,200'],
      correct: 1,
      explain: '$5,000 × 22% = $1,100 in tax savings today. You\'ll owe taxes on it later when you withdraw, ideally at a lower rate.',
    },
    {
      q: 'A 25-year-old who invests $300/month in a 401(k) at a 7% average return would have approximately how much at age 65?',
      options: ['~$144,000', '~$400,000', '~$790,000', '~$2 million'],
      correct: 2,
      explain: 'Roughly $790K. Total contributed: $144K. The other ~$650K is compound growth — the magic of starting early.',
    },
    {
      q: 'Which 401(k) investment option is generally simplest and best for beginners?',
      options: ['A single company stock', 'A target-date fund matching your retirement year', 'Whatever the highest-returning fund was last year', 'Bond fund only'],
      correct: 1,
      explain: 'Target-date funds automatically diversify and shift to safer assets as you age. Set-and-forget — perfect for starting.',
    },
    {
      q: 'Vesting schedules apply to:',
      options: ['Your own contributions', 'The employer match only', "Both your and employer's contributions", 'Investment returns'],
      correct: 1,
      explain: 'Your own money is always 100% yours immediately. Vesting only governs the employer match — typically 0–6 years to fully vest.',
    },
    {
      q: "You're 28 and starting your 401(k). A reasonable starting allocation might be:",
      options: ['100% bonds — safety first', '20% stocks / 80% bonds', '80% stocks / 20% bonds', '100% your company stock'],
      correct: 2,
      explain: 'At 28 you have ~40 years to retirement. Stock-heavy allocation captures long-term growth and rides out volatility. The "110 minus age" rule suggests ~82% stocks.',
    },
  ];
  ctx.makeQuiz(el.querySelector('#quizHost'), questions);
}

// ============================================================================
// MODULE: Action Plan
// ============================================================================
function renderPlan(el, ctx) {
  el.innerHTML = `
    <h2>Your First-Step Action Plan</h2>
    <p class="lead">Six concrete steps to start investing in your 401(k) this week. Check them off as you go — progress saves to this browser.</p>
    <div id="planHost"></div>
    <div class="resources">
      <h3>Where to learn more</h3>
      <ul>
        <li>Your plan's Summary Plan Description (SPD) — the source of truth for match, vesting, fund options.</li>
        <li>IRS contribution limits at irs.gov — they update each year.</li>
        <li>r/personalfinance "Prime Directive" flowchart — solid free framework.</li>
        <li>Bogleheads wiki — three-fund portfolio if you want simple low-cost investing.</li>
      </ul>
    </div>
  `;

  const items = [
    { title: 'Find your 401(k) plan portal', body: 'Check with HR or your benefits site (Fidelity, Vanguard, Empower, Principal, etc.). Get login credentials.' },
    { title: 'Look up your employer match', body: 'Find the exact match formula and vesting schedule in your Summary Plan Description. Note the % needed for full match.' },
    { title: 'Set contribution % to AT LEAST the full match', body: 'If your employer matches up to 5%, contribute at least 5% from your paycheck. This is a guaranteed 100%+ return.' },
    { title: 'Choose Traditional or Roth', body: 'If you expect higher taxes later → Roth. If today\'s tax rate is high and you want a deduction now → Traditional. Mixed is fine.' },
    { title: 'Pick a default investment — Target-Date Fund', body: 'Pick the fund matching your retirement year (e.g. "Target Retirement 2060"). Low-cost, diversified, automatic rebalancing.' },
    { title: 'Set an annual auto-escalation of 1%', body: 'Many plans let you increase your contribution by 1% per year automatically. Painless way to grow toward 15%.' },
  ];

  ctx.makeChecklist(
    el.querySelector('#planHost'),
    items,
    'retirement-401k:plan',
    "🎉 <strong>You did it!</strong> You've planned your first investing move. The hardest part is starting — set the contribution today and let time do the heavy lifting."
  );
}
