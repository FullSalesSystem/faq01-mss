(() => {
    'use strict';

    const steps = document.querySelectorAll('.quiz-step');
    const progressFill = document.getElementById('progressFill');
    const backButton = document.getElementById('backButton');

    const state = {
        currentStep: 0,
        totalSteps: steps.length,
        history: [],
        answers: {},
        loadingTimer: null,
    };

    function updateProgress() {
        const percent = Math.min(100, ((state.currentStep + 1) / state.totalSteps) * 100);
        progressFill.style.width = `${percent}%`;
    }

    function updateBackButton() {
        if (state.history.length > 0) {
            backButton.hidden = false;
        } else {
            backButton.hidden = true;
        }
    }

    function cancelLoading() {
        if (state.loadingTimer) {
            clearInterval(state.loadingTimer);
            state.loadingTimer = null;
        }
    }

    function startLoading(stepEl) {
        const duration = parseInt(stepEl.dataset.loading, 10);
        const nextStep = parseInt(stepEl.dataset.nextOnLoad, 10);
        if (Number.isNaN(duration) || Number.isNaN(nextStep)) return;

        const bars = Array.from(stepEl.querySelectorAll('.loading-bar-wrapper')).map(wrapper => {
            const fill = wrapper.querySelector('.loading-bar-fill');
            const percentEl = wrapper.querySelector('.loading-percent');
            const target = parseInt(fill && fill.dataset.target, 10);
            return { fill, percentEl, target: Number.isNaN(target) ? 100 : target };
        }).filter(bar => bar.fill && bar.percentEl);

        if (bars.length === 0) return;

        const startedAt = Date.now();
        cancelLoading();

        bars.forEach(bar => {
            bar.fill.style.width = '0%';
            bar.percentEl.textContent = '0%';
        });

        state.loadingTimer = setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const ratio = Math.min(1, elapsed / duration);
            bars.forEach(bar => {
                const pct = Math.round(ratio * bar.target);
                bar.fill.style.width = `${pct}%`;
                bar.percentEl.textContent = `${pct}%`;
            });

            if (ratio >= 1) {
                cancelLoading();
                goToStep(nextStep);
            }
        }, 60);
    }

    const PORTE_TO_SCORE = {
        'abaixo-30k': 2,
        '30-50k': 2,
        '50-100k': 4,
        '100-300k': 4,
        '300-500k': 6,
        '500k-1m': 6,
        'acima-1m': 6,
    };

    const SCORE_GARGALOS = {
        2: [15, 20, 18, 10],
        4: [35, 40, 38, 30],
        6: [40, 50, 48, 40],
    };

    const DONUT_CIRC = 263.9;

    function getScore() {
        const porte = state.answers['6'];
        return PORTE_TO_SCORE[porte] || 4;
    }

    function updateResultScore() {
        const score = getScore();
        const scoreEl = document.getElementById('resultScore');
        if (scoreEl) scoreEl.textContent = `Resultado: ${score}/10`;

        const values = SCORE_GARGALOS[score] || SCORE_GARGALOS[4];
        const donuts = document.querySelectorAll('.quiz-step[data-step="21"] .bottleneck');
        donuts.forEach((d, i) => {
            const pct = values[i];
            if (pct == null) return;
            const len = (pct / 100) * DONUT_CIRC;
            const circle = d.querySelector('.donut-value');
            if (circle) {
                circle.setAttribute('stroke-dasharray', `${len.toFixed(1)} ${DONUT_CIRC}`);
                circle.style.setProperty('--len', len.toFixed(1));
            }
            const label = d.querySelector('.donut-label');
            if (label) label.textContent = `${pct}%`;
        });
    }

    function updateProjectionMarker() {
        const svg = document.querySelector('.quiz-step[data-step="22"] .level-chart');
        if (!svg) return;
        const rect = svg.querySelector('.proj-badge-rect');
        const text = svg.querySelector('.proj-badge-text');
        const dot = svg.querySelector('.proj-badge-dot');
        if (!rect || !text || !dot) return;
        const atBaixo = getScore() !== 6;
        if (atBaixo) {
            rect.setAttribute('x', '0');
            rect.setAttribute('y', '204');
            rect.setAttribute('width', '80');
            text.setAttribute('x', '40');
            text.setAttribute('y', '224');
            text.setAttribute('font-size', '13');
            dot.setAttribute('cx', '40');
            dot.setAttribute('cy', '251');
        } else {
            rect.setAttribute('x', '66');
            rect.setAttribute('y', '163');
            rect.setAttribute('width', '128');
            text.setAttribute('x', '130');
            text.setAttribute('y', '183');
            text.setAttribute('font-size', '15');
            dot.setAttribute('cx', '150');
            dot.setAttribute('cy', '210');
        }
    }

    function goToStep(index, options = {}) {
        const target = document.querySelector(`.quiz-step[data-step="${index}"]`);
        if (!target) return;

        cancelLoading();

        if (!options.skipHistory && state.currentStep !== index) {
            state.history.push(state.currentStep);
        }

        steps.forEach(step => step.classList.remove('active'));
        target.classList.add('active');
        state.currentStep = index;

        updateProgress();
        updateBackButton();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (index === 21) updateResultScore();
        if (index === 22) updateProjectionMarker();

        if (target.dataset.loading) {
            startLoading(target);
        }
    }

    function goBack() {
        if (state.history.length === 0) return;
        const previous = state.history.pop();
        goToStep(previous, { skipHistory: true });
    }

    function handleSingleSelect(event) {
        const el = event.currentTarget;
        const value = el.dataset.value;
        const next = parseInt(el.dataset.next, 10);
        const stepEl = el.closest('.quiz-step');
        const stepKey = stepEl ? stepEl.dataset.step : 'unknown';

        // Special case: step 5 (nicho) — captura tambem o texto livre se preenchido
        if (stepEl && stepEl.dataset.step === '5') {
            const customNiche = document.getElementById('nichoOutro');
            if (customNiche && customNiche.value.trim()) {
                state.answers['5_outro'] = customNiche.value.trim();
            }
        }

        state.answers[stepKey] = value;

        if (!Number.isNaN(next)) {
            goToStep(next);
        }
    }

    document.querySelectorAll('.card-option, .list-option').forEach(el => {
        el.addEventListener('click', handleSingleSelect);
    });

    // Multi-select handling
    document.querySelectorAll('.quiz-step[data-multi-step]').forEach(stepEl => {
        const stepKey = stepEl.dataset.step;
        const checkboxes = stepEl.querySelectorAll('.multi-checkbox');
        const submit = stepEl.querySelector('[data-multi-submit]');
        if (!submit) return;

        const refresh = () => {
            const selected = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
            submit.disabled = selected.length === 0;
            state.answers[stepKey] = selected;
        };

        checkboxes.forEach(cb => cb.addEventListener('change', refresh));

        submit.addEventListener('click', () => {
            const next = parseInt(submit.dataset.next, 10);
            if (!submit.disabled && !Number.isNaN(next)) {
                goToStep(next);
            }
        });
    });

    // Text input steps (nome, email, whatsapp)
    document.querySelectorAll('.quiz-step[data-input-step]').forEach(stepEl => {
        const stepKey = stepEl.dataset.step;
        const input = stepEl.querySelector('.text-input');
        const submit = stepEl.querySelector('[data-input-submit]');
        if (!input || !submit) return;

        const isValid = () => {
            if (!input.value.trim()) return false;
            return input.checkValidity();
        };

        const refresh = () => {
            submit.disabled = !isValid();
        };

        const submitStep = () => {
            if (!isValid()) return;
            state.answers[stepKey] = input.value.trim();
            const next = parseInt(submit.dataset.next, 10);
            if (!Number.isNaN(next)) goToStep(next);
        };

        input.addEventListener('input', refresh);
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                submitStep();
            }
        });
        submit.addEventListener('click', submitStep);

        refresh();
    });

    // Botões "Continuar" simples (apenas avançam)
    document.querySelectorAll('[data-advance]').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = parseInt(btn.dataset.next, 10);
            if (!Number.isNaN(next)) goToStep(next);
        });
    });

    backButton.addEventListener('click', goBack);

    updateProgress();
    updateBackButton();
})();
