/**
 * Financial Literacy Lab — Engine
 *
 * Provides a topic registry, navigation, persistence, and shared helpers
 * (charts, quizzes, checklists, formatters). Topic files register themselves
 * via FinLit.registerTopic({...}). See README.md for the full API.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'fin-lit-state-v2';

  const FinLit = {
    topics: [],
    currentTopicId: null,
    currentModuleId: null,
    _charts: [],
    _state: {},

    // ============================================================
    // Lifecycle
    // ============================================================
    init() {
      this._loadState();
      const last = this._state._last;
      const initialTopic =
        (last && this.topics.find((t) => t.id === last.topicId)) ||
        this.topics[0];
      if (!initialTopic) {
        document.getElementById('moduleContent').innerHTML =
          '<div class="empty">No topics registered. Add a topic in <code>topics/</code> and reference it from <code>index.html</code>.</div>';
        return;
      }
      this.showTopic(initialTopic.id, last && last.moduleId);
    },

    // ============================================================
    // Registry
    // ============================================================
    registerTopic(topic) {
      if (!topic || !topic.id || !Array.isArray(topic.modules)) {
        console.error('Invalid topic registration:', topic);
        return;
      }
      if (this.topics.find((t) => t.id === topic.id)) {
        console.warn('Topic already registered:', topic.id);
        return;
      }
      this.topics.push(topic);
      if (this.currentTopicId !== null) this._renderTopicNav();
    },

    // ============================================================
    // Navigation
    // ============================================================
    showTopic(id, moduleId) {
      const topic = this.topics.find((t) => t.id === id);
      if (!topic) return;
      this.currentTopicId = id;
      this._renderTopicNav();
      const target =
        moduleId && topic.modules.find((m) => m.id === moduleId)
          ? moduleId
          : topic.modules[0] && topic.modules[0].id;
      if (target) this.showModule(target);
    },

    showModule(id) {
      const topic = this.topics.find((t) => t.id === this.currentTopicId);
      if (!topic) return;
      const idx = topic.modules.findIndex((m) => m.id === id);
      if (idx < 0) return;
      const mod = topic.modules[idx];

      this._cleanupCharts();
      this.currentModuleId = id;

      const tState = this._topicState(topic.id);
      tState.visited = tState.visited || [];
      if (!tState.visited.includes(id)) tState.visited.push(id);
      this._state._last = { topicId: topic.id, moduleId: id };
      this._persist();

      const root = document.getElementById('moduleContent');
      root.innerHTML = '';
      const panel = document.createElement('section');
      panel.className = 'panel active';
      root.appendChild(panel);

      try {
        mod.render(panel, this);
      } catch (e) {
        console.error('Module render failed:', e);
        panel.innerHTML = `<div class="error">Module failed to load: ${e.message}</div>`;
      }

      const next = topic.modules[idx + 1];
      if (next) {
        const btn = document.createElement('button');
        btn.className = 'btn-primary next-btn';
        btn.textContent = `Next: ${next.title} →`;
        btn.addEventListener('click', () => this.showModule(next.id));
        panel.appendChild(btn);
      }

      this._renderModuleTabs(topic);
      this._updateProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ============================================================
    // Per-module persistent state
    // ============================================================
    getModuleState(topicId, moduleId, defaults) {
      const t = this._topicState(topicId);
      t.modules = t.modules || {};
      if (!(moduleId in t.modules)) {
        t.modules[moduleId] = Object.assign({}, defaults || {});
      }
      return t.modules[moduleId];
    },

    setModuleState(topicId, moduleId, value) {
      const t = this._topicState(topicId);
      t.modules = t.modules || {};
      t.modules[moduleId] = value;
      this._persist();
    },

    _topicState(topicId) {
      this._state.topics = this._state.topics || {};
      this._state.topics[topicId] = this._state.topics[topicId] || {};
      return this._state.topics[topicId];
    },

    _loadState() {
      try {
        this._state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      } catch (e) {
        this._state = {};
      }
    },

    _persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
      } catch (e) {
        /* storage full or unavailable — silently ignore */
      }
    },

    // ============================================================
    // Nav rendering
    // ============================================================
    _renderTopicNav() {
      const nav = document.getElementById('topicNav');
      nav.innerHTML = '';
      this.topics.forEach((t) => {
        const btn = document.createElement('button');
        btn.className =
          'topic-pill' + (t.id === this.currentTopicId ? ' active' : '');
        btn.innerHTML =
          (t.icon ? `<span class="topic-icon">${t.icon}</span>` : '') +
          `<span>${t.title}</span>`;
        btn.addEventListener('click', () => this.showTopic(t.id));
        nav.appendChild(btn);
      });
    },

    _renderModuleTabs(topic) {
      const tabs = document.getElementById('moduleTabs');
      tabs.innerHTML = '';
      const visited = this._topicState(topic.id).visited || [];
      topic.modules.forEach((m, i) => {
        const b = document.createElement('button');
        const isActive = m.id === this.currentModuleId;
        const isVisited = visited.includes(m.id);
        b.className =
          'tab' +
          (isActive ? ' active' : '') +
          (isVisited && !isActive ? ' completed' : '');
        b.textContent = `${i + 1}. ${m.title}`;
        b.addEventListener('click', () => this.showModule(m.id));
        tabs.appendChild(b);
      });
    },

    _updateProgress() {
      const topic = this.topics.find((t) => t.id === this.currentTopicId);
      if (!topic) return;
      const visited = this._topicState(topic.id).visited || [];
      const total = topic.modules.length;
      const done = Math.min(visited.length, total);
      document.getElementById('progressFill').style.width =
        (done / total) * 100 + '%';
      document.getElementById('progressText').textContent = `${done} / ${total}`;
      document.getElementById('progressTopicName').textContent = topic.title;
    },

    // ============================================================
    // Charts (auto-destroyed on module switch)
    // ============================================================
    makeChart(canvas, config) {
      const chart = new Chart(canvas, config);
      this._charts.push(chart);
      return chart;
    },

    _cleanupCharts() {
      this._charts.forEach((c) => {
        try { c.destroy(); } catch (e) { /* noop */ }
      });
      this._charts = [];
    },

    // ============================================================
    // Formatters
    // ============================================================
    fmt(n) {
      return '$' + Math.round(n).toLocaleString('en-US');
    },
    fmtSign(n) {
      const s = n >= 0 ? '+' : '-';
      return s + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
    },
    pct(n, d) {
      return Number(n).toFixed(d == null ? 0 : d) + '%';
    },

    // ============================================================
    // UI helpers
    // ============================================================

    /**
     * Wire a slider's value-display span. The span must have id `${id}Val`.
     * Returns the input element so callers can attach extra listeners.
     */
    bindRange(root, id, formatter) {
      const input = root.querySelector('#' + id);
      const display = root.querySelector('#' + id + 'Val');
      if (!input) return null;
      const update = () => {
        if (display) display.textContent = formatter ? formatter(+input.value) : input.value;
      };
      input.addEventListener('input', update);
      update();
      return input;
    },

    /**
     * Render an interactive multiple-choice quiz.
     *   questions: [{q, options:[...], correct: index, explain: string}]
     *   onComplete: optional ({correct, total}) => void
     */
    makeQuiz(container, questions, onComplete) {
      container.innerHTML = '';
      const list = document.createElement('div');
      const results = document.createElement('div');
      results.className = 'quiz-results hidden';
      let answered = 0;
      let correct = 0;

      questions.forEach((item, qi) => {
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
            exp.innerHTML =
              (isRight ? '✅ Correct! ' : '❌ Not quite. ') + item.explain;
            wrap.appendChild(exp);

            if (answered === questions.length) {
              const p = Math.round((correct / questions.length) * 100);
              results.classList.remove('hidden');
              const verdict =
                p >= 80
                  ? '🎉 Strong understanding — ready to put it into practice!'
                  : p >= 50
                  ? '👍 Solid foundation. Review the misses and try again.'
                  : 'Keep learning — review the earlier modules and retake.';
              results.innerHTML =
                `<div class="score">${correct} / ${questions.length}</div>` +
                `<p>${verdict}</p>` +
                `<button class="quiz-retry">Retake quiz</button>`;
              results
                .querySelector('.quiz-retry')
                .addEventListener('click', () =>
                  FinLit.makeQuiz(container, questions, onComplete)
                );
              if (onComplete) onComplete({ correct, total: questions.length });
            }
          });
          opts.appendChild(btn);
        });
        wrap.appendChild(opts);
        list.appendChild(wrap);
      });

      container.appendChild(list);
      container.appendChild(results);
    },

    /**
     * Render a persistent checklist.
     *   items: [{title, body}]
     *   persistKey: string used to key localStorage
     *   successMessage: HTML shown when all items checked
     */
    makeChecklist(container, items, persistKey, successMessage) {
      this._state.checklists = this._state.checklists || {};
      const saved = this._state.checklists[persistKey] || [];
      const checked = new Set(saved);

      const ol = document.createElement('ol');
      ol.className = 'checklist';

      const success = document.createElement('div');
      success.className = 'callout success';
      success.hidden = checked.size < items.length;
      success.innerHTML =
        successMessage ||
        '🎉 <strong>You did it!</strong> Every step checked off.';

      items.forEach((it, i) => {
        const li = document.createElement('li');
        const id = `chk_${persistKey.replace(/[^a-z0-9]/gi, '_')}_${i}`;
        li.innerHTML = `
          <label>
            <input type="checkbox" id="${id}" ${
          checked.has(String(i)) ? 'checked' : ''
        } />
            <div>
              <strong>${it.title}</strong>
              <p>${it.body}</p>
            </div>
          </label>`;
        const cb = li.querySelector('input');
        cb.addEventListener('change', () => {
          if (cb.checked) checked.add(String(i));
          else checked.delete(String(i));
          FinLit._state.checklists[persistKey] = [...checked];
          FinLit._persist();
          success.hidden = checked.size < items.length;
        });
        ol.appendChild(li);
      });

      container.appendChild(ol);
      container.appendChild(success);
    },
  };

  window.FinLit = FinLit;

  document.addEventListener('DOMContentLoaded', () => FinLit.init());
})();
