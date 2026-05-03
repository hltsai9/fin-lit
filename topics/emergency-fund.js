/**
 * Topic: Emergency Fund
 *
 * Minimal demo topic that shows the registration pattern and uses the shared
 * helpers (chart, checklist). Replace or extend with your own content — see
 * README.md for the full module API.
 */
FinLit.registerTopic({
  id: 'emergency-fund',
  title: 'Emergency Fund',
  icon: '🛟',
  description:
    'A safety net of cash for surprises (job loss, medical, car). Comes before investing.',
  modules: [
    { id: 'why', title: 'Why It Matters', render: renderEFWhy },
    { id: 'size', title: 'Right-Size It', render: renderEFSize },
    { id: 'plan', title: 'Build Plan', render: renderEFPlan },
  ],
});

function renderEFWhy(el) {
  el.innerHTML = `
    <h2>Why an Emergency Fund Comes First</h2>
    <p class="lead">Before aggressive investing, most experts recommend a small cash buffer so a flat tire doesn't become a credit-card spiral.</p>
    <div class="cards">
      <div class="card">
        <div class="card-icon">⛑️</div>
        <h3>Stops debt cycles</h3>
        <p>Without a buffer, surprise costs hit credit cards at 20%+ interest. The fund is cheap insurance.</p>
      </div>
      <div class="card highlight">
        <div class="card-icon">🧘</div>
        <h3>Lets you invest with confidence</h3>
        <p>You can leave 401(k) money invested through downturns instead of selling at a loss to cover bills.</p>
      </div>
      <div class="card">
        <div class="card-icon">💼</div>
        <h3>Career flexibility</h3>
        <p>3–6 months of expenses gives you runway to leave a bad job, take a sabbatical, or weather a layoff.</p>
      </div>
    </div>
    <div class="callout">
      <strong>Order of operations:</strong> small starter fund (~$1k) → capture full 401(k) match → pay off high-interest debt → finish emergency fund (3–6 months) → invest more.
    </div>
  `;
}

function renderEFSize(el, ctx) {
  el.innerHTML = `
    <h2>Right-Size Your Fund</h2>
    <p class="lead">Most guidance is "3–6 months of expenses." The exact number depends on how stable your income is.</p>

    <div class="two-col">
      <div class="controls">
        <label>Monthly essential expenses <span class="value" id="efExpVal"></span>
          <input type="range" id="efExp" min="1000" max="10000" step="100" value="3500" />
          <small>Rent/mortgage, food, utilities, insurance, minimum debt payments</small></label>
        <label>Months of cushion <span class="value" id="efMonthsVal"></span>
          <input type="range" id="efMonths" min="1" max="12" step="1" value="3" /></label>
        <label>Current saved <span class="value" id="efSavedVal"></span>
          <input type="range" id="efSaved" min="0" max="50000" step="500" value="500" /></label>
        <label>Monthly savings rate <span class="value" id="efRateVal"></span>
          <input type="range" id="efRate" min="50" max="2000" step="50" value="300" /></label>
      </div>
      <div class="results">
        <div class="big-stat">
          <div class="big-stat-label">Target fund size</div>
          <div class="big-stat-value" id="efTarget">—</div>
        </div>
        <div class="result-row"><div class="result-label">Still to save</div><div class="result-value" id="efGap">—</div></div>
        <div class="result-row highlight-row"><div class="result-label">Months to reach target</div><div class="result-value" id="efETA">—</div></div>
        <div id="efVerdict" class="verdict"></div>
      </div>
    </div>

    <div class="chart-wrap"><canvas id="efChart"></canvas></div>
  `;

  const $ = (s) => el.querySelector(s);
  const chart = ctx.makeChart($('#efChart'), {
    type: 'bar',
    data: {
      labels: ['Saved', 'Still to save'],
      datasets: [{ data: [0, 0], backgroundColor: ['#6ee7b7', '#f59e0b'], borderRadius: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ctx.fmt(c.parsed.x) } } },
      scales: {
        x: { stacked: true, beginAtZero: true, ticks: { color: '#9aa6c2', callback: (v) => ctx.fmt(v) }, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: { stacked: true, ticks: { color: '#9aa6c2' }, grid: { display: false } },
      },
    },
  });

  const update = () => {
    const exp = +$('#efExp').value;
    const months = +$('#efMonths').value;
    const saved = +$('#efSaved').value;
    const rate = +$('#efRate').value;

    $('#efExpVal').textContent = ctx.fmt(exp);
    $('#efMonthsVal').textContent = months + ' mo';
    $('#efSavedVal').textContent = ctx.fmt(saved);
    $('#efRateVal').textContent = ctx.fmt(rate) + '/mo';

    const target = exp * months;
    const gap = Math.max(0, target - saved);
    const eta = rate > 0 ? gap / rate : Infinity;

    $('#efTarget').textContent = ctx.fmt(target);
    $('#efGap').textContent = ctx.fmt(gap);
    $('#efETA').textContent =
      gap === 0 ? '✅ Done!' : eta === Infinity ? '∞' : Math.ceil(eta) + ' mo';

    const v = $('#efVerdict');
    if (gap === 0) {
      v.className = 'verdict good';
      v.textContent = '🎯 You\'ve hit your target. Redirect savings toward investing.';
    } else if (months <= 3 && saved < exp) {
      v.className = 'verdict bad';
      v.textContent = "⚠️ Less than one month saved. Prioritize getting to a $1k starter fund first.";
    } else {
      v.className = 'verdict neutral';
      v.textContent = `Stick with ${ctx.fmt(rate)}/mo and you'll be there in ${Math.ceil(eta)} months.`;
    }

    chart.data.datasets[0].data = [saved, gap];
    chart.update('none');
  };

  el.querySelectorAll('input[type=range]').forEach((i) => i.addEventListener('input', update));
  update();
}

function renderEFPlan(el, ctx) {
  el.innerHTML = `
    <h2>Build Plan</h2>
    <p class="lead">Walk through these steps to set up your fund. Progress saves to this browser.</p>
    <div id="efPlanHost"></div>
  `;

  ctx.makeChecklist(
    el.querySelector('#efPlanHost'),
    [
      { title: 'Open a high-yield savings account', body: 'Look for FDIC-insured online banks paying 4%+ APY. Keep it separate from your checking so you don\'t spend it.' },
      { title: 'Set up automatic transfer on payday', body: 'Even $50/paycheck builds the habit. You\'ll barely notice it leaving.' },
      { title: 'Hit a $1,000 starter goal first', body: 'This handles the most common surprises. Then resume 401(k) match capture before finishing the full fund.' },
      { title: 'Define what counts as an "emergency"', body: 'Job loss, medical, essential car/home repair. Not vacations, not holiday gifts. Write it down.' },
      { title: 'Reach your full target (3–6 months)', body: 'Once there, redirect that monthly savings into investing.' },
    ],
    'emergency-fund:plan',
    '🎉 <strong>Set!</strong> You\'ve mapped out your safety net. Make the first transfer today.'
  );
}
