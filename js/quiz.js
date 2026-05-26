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

        const fill = stepEl.querySelector('#loadingBarFill, .loading-bar-fill');
        const percentEl = stepEl.querySelector('#loadingPercent, .loading-percent');
        if (!fill || !percentEl) return;

        const startedAt = Date.now();
        cancelLoading();

        fill.style.width = '0%';
        percentEl.textContent = '0%';

        state.loadingTimer = setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const ratio = Math.min(1, elapsed / duration);
            const pct = Math.round(ratio * 100);
            fill.style.width = `${pct}%`;
            percentEl.textContent = `${pct}%`;

            if (ratio >= 1) {
                cancelLoading();
                goToStep(nextStep);
            }
        }, 80);
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
