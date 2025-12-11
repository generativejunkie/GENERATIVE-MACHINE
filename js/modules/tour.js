export function initTour() {
    const overlay = document.getElementById('tourOverlay');
    const startBtn = document.getElementById('startTourBtn');

    // Check if user has already seen the tour
    const hasSeenTour = localStorage.getItem('gj_seen_tour_v1');

    if (!hasSeenTour) {
        // Show after a slight delay for better transition
        setTimeout(() => {
            if (overlay) {
                overlay.style.display = 'flex';
                // Trigger reflow to enable transition
                overlay.offsetHeight;
                overlay.classList.add('visible');
            }
        }, 1000);
    }

    if (startBtn && overlay) {
        startBtn.addEventListener('click', () => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.style.display = 'none';
                localStorage.setItem('gj_seen_tour_v1', 'true');

                // Optional: Smooth scroll to first machine
                const firstMachine = document.getElementById('image-machine');
                if (firstMachine) {
                    firstMachine.scrollIntoView({ behavior: 'smooth' });
                }
            }, 400); // Wait for fade out
        });
    }
}
