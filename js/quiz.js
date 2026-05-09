(() => {
    'use strict';

    const state = {
        currentStep: 0,
        totalSteps: 12,
        answers: {},
    };

    const steps = document.querySelectorAll('.quiz-step');
    const progressFill = document.getElementById('progressFill');

    function updateProgress() {
        const percent = Math.min(100, ((state.currentStep + 1) / state.totalSteps) * 100);
        progressFill.style.width = `${percent}%`;
    }

    function goToStep(index) {
        const target = document.querySelector(`.quiz-step[data-step="${index}"]`);
        if (!target) return;

        steps.forEach(step => step.classList.remove('active'));
        target.classList.add('active');
        state.currentStep = index;
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    updateProgress();
})();
