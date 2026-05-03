// ===== Utilities =====
const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');
const fmtSign = (n) => (n >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const pct = (n, d = 0) => n.toFixed(d) + '%';
const $ = (id) => document.getElementById(id);

const STORAGE_KEY = 'fin-lit-progress-v1';
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
const visited = new Set(state.visited || ['basics']);
const checked = new Set(state.checked || []);
const quizScore = state.quizScore ?? null;

const TABS = ['basics', 'match', 'growth', 'tax', 'allocation', 'quiz', 'plan'];

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    visited: [...visited],
    checked: [...checked],
    quizScore,
  }));
}

// ===== Tab navigation =====
function showTab(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === name));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  visited.add(name);
  updateProgress();
  persist();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => showTab(t.dataset.tab));
});
document.querySelectorAll('.next-btn').forEach(b => {
  b.addEventListener('click', () => showTab(b.dataset.next));
});

function updateProgress() {
  const total = TABS.length - 1; // exclude "plan" so completing plan counts
  // Count visited tabs (except always-visited "basics" minus first load = simple count)
  const done = TABS.filter(t => visited.has(t)).length;
  const denom = TABS.length;
  $('progressFill').style.width = (done / denom * 100) + '%';
  $('progressText').textContent = `${done} / ${denom}`;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('completed', visited.has(t.dataset.tab));
  });
}
updateProgress();

// ===== MODULE: Employer Match =====
const matchInputs = ['matchSalary', 'matchContrib', 'matchRate', 'matchCap'];
let matchChart;

function renderMatch() {
  const salary = +$('matchSalary').value;
  const contribPct = +$('matchContrib').value;
  const matchRate = +$('matchRate').value / 100;
  const matchCap = +$('matchCap').value;

  $('matchSalaryVal').textContent = fmt(salary);
  $('matchContribVal').textContent = pct(contribPct, 1);
  $('matchRateVal').textContent = pct(matchRate * 100);
  $('matchCapVal').textContent = pct(matchCap, 1);

  const yourContrib = salary * contribPct / 100;
  // Employer matches `matchRate` of YOUR contribution, but capped at matchCap% of salary
  const matchedContribPct = Math.min(contribPct, matchCap);
  const employerMatch = salary * matchedContribPct / 100 * matchRate;
  const total = yourContrib + employerMatch;
  // Max possible match if you contributed at least the cap
  const maxPossibleMatch = salary * matchCap / 100 * matchRate;
  const missed = Math.max(0, maxPossibleMatch - employerMatch);

  $('yourContrib').textContent = fmt(yourContrib) + ' / yr';
  $('employerMatch').textContent = fmt(employerMatch) + ' / yr';
  $('totalContrib').textContent = fmt(total) + ' / yr';
  $('missedMatch').textContent = missed > 0 ? fmt(missed) + ' / yr' : '$0 (nice!)';

  const verdict = $('matchVerdict');
  if (matchCap === 0 || matchRate === 0) {
    verdict.className = 'verdict neutral';
    verdict.textContent = 'No employer match configured. Still worth contributing for the tax benefit + compound growth.';
  } else if (contribPct >= matchCap) {
    verdict.className = 'verdict good';
    verdict.textContent = `✅ You're capturing the FULL match — great. That's an instant ${pct(matchRate * 100, 0)} return on every dollar up to the cap.`;
  } else if (contribPct === 0) {
    verdict.className = 'verdict bad';
    verdict.textContent = `🚨 Contributing 0% means you're walking past ${fmt(maxPossibleMatch)}/year of free money. Even 1% beats nothing.`;
  } else {
    verdict.className = 'verdict bad';
    verdict.textContent = `⚠️ You're leaving ${fmt(missed)}/yr behind. Bumping contributions to ${pct(matchCap, 1)} captures the full match.`;
  }

  // Chart: bar comparing You / Match / Missed
  const ctx = $('matchChart').getContext('2d');
  const data = {
    labels: ['You contribute', 'Employer match', 'Money left behind'],
    datasets: [{
      data: [yourContrib, employerMatch, missed],
      backgroundColor: ['#60a5fa', '#6ee7b7', '#ef4444'],
      borderRadius: 8,
    }]
  };
  if (matchChart) {
    matchChart.data = data;
    matchChart.update('none');
  } else {
    matchChart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => fmt(c.parsed.y) + ' / yr' } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#9aa6c2', callback: (v) => fmt(v) },
            grid: { color: 'rgba(255,255,255,0.06)' }
          },
          x: { ticks: { color: '#9aa6c2' }, grid: { display: false } }
        }
      }
    });
  }
}
matchInputs.forEach(id => $(id).addEventListener('input', renderMatch));

// ===== MODULE: Compound Growth =====
const growthInputs = ['age', 'retire', 'growSalary', 'growContrib', 'growMatch', 'return', 'raise'];
let growthChart;

function renderGrowth() {
  const age = +$('age').value;
  const retire = +$('retire').value;
  let salary = +$('growSalary').value;
  const contribPct = +$('growContrib').value / 100;
  const matchPct = +$('growMatch').value / 100;
  const ret = +$('return').value / 100;
  const raise = +$('raise').value / 100;

  $('ageVal').textContent = age;
  $('retireVal').textContent = retire;
  $('growSalaryVal').textContent = fmt(salary);
  $('growContribVal').textContent = pct(contribPct * 100, 1);
  $('growMatchVal').textContent = pct(matchPct * 100, 1);
  $('returnVal').textContent = pct(ret * 100, 1);
  $('raiseVal').textContent = pct(raise * 100, 1);

  if (retire <= age) {
    $('finalBalance').textContent = '—';
    return;
  }

  const years = retire - age;
  const labels = [];
  const balances = [];
  const youSeries = [];
  const matchSeries = [];

  let balance = 0;
  let cumYou = 0;
  let cumMatch = 0;
  let curSalary = salary;
  for (let i = 0; i <= years; i++) {
    labels.push(age + i);
    balances.push(Math.round(balance));
    youSeries.push(Math.round(cumYou));
    matchSeries.push(Math.round(cumMatch));

    if (i === years) break;
    const youAdd = curSalary * contribPct;
    const matchAdd = curSalary * matchPct;
    // Contribute monthly, grow monthly: more accurate than annual lump
    const monthlyAdd = (youAdd + matchAdd) / 12;
    const monthlyR = ret / 12;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyR) + monthlyAdd;
    }
    cumYou += youAdd;
    cumMatch += matchAdd;
    curSalary *= (1 + raise);
  }

  const total = balances[balances.length - 1];
  const growth = total - cumYou - cumMatch;

  $('finalBalance').textContent = fmt(total);
  $('totalYouContrib').textContent = fmt(cumYou);
  $('totalEmpMatch').textContent = fmt(cumMatch);
  $('totalGrowth').textContent = fmt(growth);
  $('monthlyIncome').textContent = fmt(total * 0.04 / 12) + ' / mo';

  const ctx = $('growthChart').getContext('2d');
  const data = {
    labels,
    datasets: [
      {
        label: 'Your contributions',
        data: youSeries,
        backgroundColor: 'rgba(96, 165, 250, 0.7)',
        borderColor: '#60a5fa',
        fill: true,
        stack: 'a',
      },
      {
        label: 'Employer match',
        data: matchSeries,
        backgroundColor: 'rgba(110, 231, 183, 0.7)',
        borderColor: '#6ee7b7',
        fill: true,
        stack: 'a',
      },
      {
        label: 'Investment growth',
        data: balances.map((b, i) => Math.max(0, b - youSeries[i] - matchSeries[i])),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: '#f59e0b',
        fill: true,
        stack: 'a',
      },
    ]
  };
  if (growthChart) {
    growthChart.data = data;
    growthChart.update('none');
  } else {
    growthChart = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#e8edf7' } },
          tooltip: {
            mode: 'index',
            callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)}` }
          }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            stacked: true,
            ticks: { color: '#9aa6c2', callback: (v) => fmt(v) },
            grid: { color: 'rgba(255,255,255,0.06)' }
          },
          x: {
            stacked: true,
            ticks: { color: '#9aa6c2' },
            title: { display: true, text: 'Age', color: '#9aa6c2' },
            grid: { color: 'rgba(255,255,255,0.04)' }
          }
        },
        elements: { point: { radius: 0, hoverRadius: 4 } }
      }
    });
  }
}
growthInputs.forEach(id => $(id).addEventListener('input', renderGrowth));

// ===== MODULE: Tax =====
const taxInputs = ['taxSalary', 'taxContrib', 'taxNow', 'taxLater'];

function renderTax() {
  const salary = +$('taxSalary').value;
  const contribPct = +$('taxContrib').value / 100;
  const tNow = +$('taxNow').value / 100;
  const tLater = +$('taxLater').value / 100;

  $('taxSalaryVal').textContent = fmt(salary);
  $('taxContribVal').textContent = pct(contribPct * 100, 1);
  $('taxNowVal').textContent = pct(tNow * 100);
  $('taxLaterVal').textContent = pct(tLater * 100);

  const contrib = salary * contribPct;
  const tradSaved = contrib * tNow;
  // Assume same growth in retirement: compare net values per dollar
  // Simpler framing: pre-tax dollar today taxed at tLater later vs after-tax dollar (cost: 1*tNow today)
  // Per $1 contributed: traditional gives back tNow today, owes tLater later. Roth costs tNow today, owes 0 later.
  // Net benefit of traditional vs roth = tNow - tLater (per dollar contributed, in present-equivalent terms)
  const tradOwed = contrib * tLater;
  const tradNet = tradSaved - tradOwed;
  // Roth: paid tNow now, 0 later -> net benefit relative to taxable = contrib * tLater (saved future tax)
  const rothNet = contrib * tLater;

  $('tradSaved').textContent = fmt(tradSaved);
  $('tradOwed').textContent = fmt(tradOwed);
  $('tradNet').textContent = fmtSign(tradNet);
  $('rothNet').textContent = fmtSign(rothNet);

  const verdict = $('taxVerdict');
  if (Math.abs(tNow - tLater) < 0.01) {
    verdict.className = 'verdict neutral';
    verdict.textContent = '🟰 Tax rates roughly equal — Traditional and Roth come out the same. Diversifying between both is a great move.';
  } else if (tNow > tLater) {
    verdict.className = 'verdict good';
    verdict.textContent = `📉 You expect to be in a LOWER bracket later. Traditional saves you ~${fmt((tNow - tLater) * contrib)} per year vs. Roth.`;
  } else {
    verdict.className = 'verdict good';
    verdict.textContent = `📈 You expect a HIGHER bracket later. Roth wins by ~${fmt((tLater - tNow) * contrib)} per year — pay tax now while it's cheap.`;
  }
}
taxInputs.forEach(id => $(id).addEventListener('input', renderTax));

// ===== MODULE: Allocation =====
let allocChart;

function renderAlloc() {
  const stocks = +$('stockMix').value;
  const bonds = 100 - stocks;
  $('stockVal').textContent = stocks + '%';
  $('bondVal').textContent = bonds + '%';

  // Approximate historical figures (educational)
  // Stocks: ~10% return, ~16% std dev. Bonds: ~4% return, ~5% std dev.
  const expR = (stocks / 100) * 0.10 + (bonds / 100) * 0.04;
  const std = Math.sqrt(
    Math.pow(stocks / 100, 2) * Math.pow(0.16, 2) +
    Math.pow(bonds / 100, 2) * Math.pow(0.05, 2) +
    2 * (stocks / 100) * (bonds / 100) * 0.16 * 0.05 * 0.05  // low correlation
  );
  const worst = (expR - 2 * std) * 100;
  const best = (expR + 2 * std) * 100;
  const future = 10000 * Math.pow(1 + expR, 30);

  $('expReturn').textContent = pct(expR * 100, 1) + ' / yr';
  $('worstYear').textContent = pct(worst, 1);
  $('bestYear').textContent = '+' + pct(best, 1);
  $('thirtyYears').textContent = fmt(future);

  const tip = $('allocationTip');
  if (stocks >= 90) {
    tip.innerHTML = '<strong>Aggressive.</strong> Suitable for long horizons (30+ years). Expect 30%+ drops in bad years — stay the course.';
  } else if (stocks >= 70) {
    tip.innerHTML = '<strong>Growth-tilted.</strong> Most common for investors under 50. Strong long-term return, manageable volatility.';
  } else if (stocks >= 50) {
    tip.innerHTML = '<strong>Balanced.</strong> Smoother ride, lower long-term return. Common as you approach retirement.';
  } else if (stocks >= 30) {
    tip.innerHTML = '<strong>Conservative.</strong> Better for those near or in retirement. May not outpace inflation by much.';
  } else {
    tip.innerHTML = '<strong>Very conservative.</strong> Inflation will erode purchasing power if held for decades.';
  }

  const ctx = $('allocChart').getContext('2d');
  const data = {
    labels: ['Stocks', 'Bonds'],
    datasets: [{
      data: [stocks, bonds],
      backgroundColor: ['#60a5fa', '#6ee7b7'],
      borderColor: '#0e1525',
      borderWidth: 3,
    }]
  };
  if (allocChart) {
    allocChart.data = data;
    allocChart.update('none');
  } else {
    allocChart = new Chart(ctx, {
      type: 'doughnut',
      data,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#e8edf7' } },
          tooltip: { callbacks: { label: (c) => c.label + ': ' + c.parsed + '%' } }
        },
        cutout: '60%',
      }
    });
  }
}
$('stockMix').addEventListener('input', renderAlloc);
document.querySelectorAll('.preset').forEach(b => {
  b.addEventListener('click', () => {
    $('stockMix').value = b.dataset.mix;
    renderAlloc();
  });
});

// ===== MODULE: Quiz =====
const QUIZ = [
  {
    q: 'You earn $60,000 and your employer matches 100% of contributions up to 5% of salary. What\'s the minimum you should contribute to capture the full match?',
    options: ['1% — anything is good', '5% — to get the full match', '10% — more is always better', '0% — match is automatic'],
    correct: 1,
    explain: 'You need to contribute at least 5% of salary ($3,000) to capture the full $3,000 employer match. Anything less leaves money on the table.'
  },
  {
    q: 'A Traditional 401(k) contribution of $5,000 if you\'re in the 22% federal tax bracket reduces this year\'s tax bill by approximately:',
    options: ['$5,000', '$1,100', '$0 — taxes are unchanged', '$2,200'],
    correct: 1,
    explain: '$5,000 × 22% = $1,100 in tax savings today. You\'ll owe taxes on it later when you withdraw, ideally at a lower rate.'
  },
  {
    q: 'A 25-year-old who invests $300/month in a 401(k) at a 7% average return would have approximately how much at age 65?',
    options: ['~$144,000', '~$400,000', '~$790,000', '~$2 million'],
    correct: 2,
    explain: 'Roughly $790K. Total contributed: $144K. The other ~$650K is compound growth — the magic of starting early.'
  },
  {
    q: 'Which 401(k) investment option is generally simplest and best for beginners?',
    options: [
      'A single company stock',
      'A target-date fund matching your retirement year',
      'Whatever the highest-returning fund was last year',
      'Bond fund only'
    ],
    correct: 1,
    explain: 'Target-date funds automatically diversify and shift to safer assets as you age. Set-and-forget — perfect for starting.'
  },
  {
    q: 'Vesting schedules apply to:',
    options: [
      'Your own contributions',
      'The employer match only',
      'Both your and employer\'s contributions',
      'Investment returns'
    ],
    correct: 1,
    explain: 'Your own money is always 100% yours immediately. Vesting only governs the employer match — typically 0–6 years to fully vest.'
  },
  {
    q: 'You\'re 28 and starting your 401(k). A reasonable starting allocation might be:',
    options: ['100% bonds — safety first', '20% stocks / 80% bonds', '80% stocks / 20% bonds', '100% your company stock'],
    correct: 2,
    explain: 'At 28 you have ~40 years to retirement. Stock-heavy allocation captures long-term growth and rides out volatility. The "110 minus age" rule suggests ~82% stocks.'
  }
];

function renderQuiz() {
  const container = $('quizContainer');
  container.innerHTML = '';
  let answered = 0;
  let correct = 0;

  QUIZ.forEach((item, qi) => {
    const wrap = document.createElement('div');
    wrap.className = 'quiz-q';
    const h = document.createElement('h3');
    h.textContent = `Q${qi + 1}. ${item.q}`;
    wrap.appendChild(h);

    const opts = document.createElement('div');
    opts.className = 'quiz-options';
    item.options.forEach((opt, oi) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (wrap.dataset.answered) return;
        wrap.dataset.answered = '1';
        answered++;
        const isRight = oi === item.correct;
        if (isRight) correct++;
        Array.from(opts.children).forEach((b, bi) => {
          b.disabled = true;
          if (bi === item.correct) b.classList.add('correct');
          if (bi === oi && !isRight) b.classList.add('wrong');
        });
        const exp = document.createElement('div');
        exp.className = 'quiz-explain';
        exp.innerHTML = (isRight ? '✅ Correct! ' : '❌ Not quite. ') + item.explain;
        wrap.appendChild(exp);

        if (answered === QUIZ.length) {
          const r = $('quizResults');
          r.classList.remove('hidden');
          const pctScore = Math.round(correct / QUIZ.length * 100);
          r.innerHTML = `
            <div class="score">${correct} / ${QUIZ.length}</div>
            <p>${pctScore >= 80 ? '🎉 Strong understanding — ready to start contributing!' :
                pctScore >= 50 ? '👍 Solid foundation. Review the modules above for the misses.' :
                'Keep learning — review the earlier modules and try again.'}</p>
            <button id="retryQuiz">Retake quiz</button>
          `;
          $('retryQuiz').addEventListener('click', renderQuiz);
        }
      });
      opts.appendChild(btn);
    });
    wrap.appendChild(opts);
    container.appendChild(wrap);
  });
  $('quizResults').classList.add('hidden');
}
renderQuiz();

// ===== MODULE: Action Plan checklist =====
function renderChecklist() {
  document.querySelectorAll('#checklist input[type=checkbox]').forEach(cb => {
    cb.checked = checked.has(cb.dataset.step);
    cb.addEventListener('change', () => {
      if (cb.checked) checked.add(cb.dataset.step);
      else checked.delete(cb.dataset.step);
      persist();
      $('planSuccess').hidden = checked.size < 6;
    });
  });
  $('planSuccess').hidden = checked.size < 6;
}
renderChecklist();

// ===== Initial renders =====
renderMatch();
renderGrowth();
renderTax();
renderAlloc();
