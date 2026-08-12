// Custom Select Dropdown Logic
document.addEventListener('DOMContentLoaded', () => {
    const customSelect = document.getElementById('customSelect');
    const trigger = customSelect?.querySelector('.custom-select-trigger');
    const options = customSelect?.querySelectorAll('.custom-option');
    const hiddenSelect = document.getElementById('source');
    const iconSpan = customSelect?.querySelector('.custom-select-icon');
    const textSpan = customSelect?.querySelector('.custom-select-text');

    if (!customSelect || !trigger || !hiddenSelect) return;

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    // Handle option selection
    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const icon = option.querySelector('.option-icon').textContent;
            const text = option.querySelector('.option-text').textContent;

            // Update UI
            iconSpan.textContent = icon;
            textSpan.textContent = text;

            // Update active state
            options.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Sync with hidden select
            hiddenSelect.value = value;
            
            // Trigger change event on hidden select
            const event = new Event('change', { bubbles: true });
            hiddenSelect.dispatchEvent(event);

            // Close dropdown
            customSelect.classList.remove('open');
        });
    });

    // Sync initial state
    const initialValue = hiddenSelect.value;
    const initialOption = Array.from(options).find(opt => opt.dataset.value === initialValue);
    if (initialOption) {
        iconSpan.textContent = initialOption.querySelector('.option-icon').textContent;
        textSpan.textContent = initialOption.querySelector('.option-text').textContent;
    }
});
