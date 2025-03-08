// Add feature card click handlers
document.addEventListener('DOMContentLoaded', function() {
    // Feature card click handlers
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('active');
            // You can implement specific feature toggling here
            // For now just add a visual effect
            this.style.backgroundColor = this.classList.contains('active') ?
                'rgba(96, 245, 172, 0.1)' : '';

            setTimeout(() => {
                this.style.backgroundColor = '';
                this.classList.remove('active');
            }, 300);
        });
    });

    // Settings button handler
    document.getElementById('openSettings').addEventListener('click', function() {
        // You can implement settings page or modal here
        document.getElementById('statusText').textContent = 'Settings will be available soon';
        document.getElementById('statusText').className = 'status-processing';

        setTimeout(() => {
            const isEnabled = document.getElementById('toggleSwitch').checked;
            document.getElementById('statusText').textContent = isEnabled ?
                'Extension is Active 🟢' : 'Extension is Inactive 🔴';
            document.getElementById('statusText').className = isEnabled ?
                'status-active' : 'status-inactive';
        }, 2000);
    });
});