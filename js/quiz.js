(() => {
    'use strict';

    const state = {
        currentStep: 0,
        totalSteps: 12,
        history: [],
        answers: {},
        loadingTimer: null,
    };

    const steps = document.querySelectorAll('.quiz-step');
    const progressFill = document.getElementById('progressFill');
    const backButton = document.getElementById('backButton');

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

    function handleCardClick(event) {
        const card = event.currentTarget;
        const value = card.dataset.value;
        const next = parseInt(card.dataset.next, 10);
        const stepEl = card.closest('.quiz-step');
        const stepKey = stepEl ? stepEl.dataset.step : 'unknown';

        state.answers[stepKey] = value;

        if (!Number.isNaN(next)) {
            goToStep(next);
        }
    }

    document.querySelectorAll('.card-option').forEach(card => {
        card.addEventListener('click', handleCardClick);
    });

    backButton.addEventListener('click', goBack);

    updateProgress();
    updateBackButton();
})();
