/**
 * UI Components and Helpers
 * Modern UI interactions and components matching Python app
 */

class UIManager {
    constructor() {
        this.modals = {};
        this.animations = {};
        this.themes = {
            dark: {
                background: '#2D2D2D',
                sidebar: '#1E1E1E',
                cardBackground: '#3A3A3A',
                textPrimary: '#FFFFFF',
                textSecondary: '#CCCCCC',
                primary: '#4A90E2'
            },
            light: {
                background: '#FFFFFF',
                sidebar: '#F8F9FA',
                cardBackground: '#FFFFFF',
                textPrimary: '#212529',
                textSecondary: '#6C757D',
                primary: '#4A90E2'
            }
        };
        this.currentTheme = 'dark';
    }

    init() {
        console.log('🎨 Initializing UI Manager...');
        this.setupModalHandlers();
        this.setupTooltips();
        this.setupAnimations();
        this.setupThemeToggle();
        this.setupResponsive();
        this.setupKeyboardShortcuts();
        this.loadTheme();
    }

    // Modal Management
    setupModalHandlers() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Setup specific modal triggers
        this.setupModalTriggers();
    }

    setupModalTriggers() {
        // Goal edit modal
        const editGoalBtn = document.getElementById('editGoal');
        if (editGoalBtn) {
            editGoalBtn.addEventListener('click', () => this.showModal('goalEditModal'));
        }

        // Settings modal
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showModal('settingsModal'));
        }

        // Close buttons
        document.querySelectorAll('.btn-close, [id^="close"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('modal-show');
            
            // Focus first input
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }

            // Add to active modals
            this.modals[modalId] = modal;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal-show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);

            delete this.modals[modalId];
            
            // Restore body scroll if no modals open
            if (Object.keys(this.modals).length === 0) {
                document.body.style.overflow = '';
            }
        }
    }

    closeAllModals() {
        Object.keys(this.modals).forEach(modalId => {
            this.closeModal(modalId);
        });
    }

    // Tooltip System
    setupTooltips() {
        document.querySelectorAll('[title], [data-tooltip]').forEach(element => {
            this.addTooltip(element);
        });
    }

    addTooltip(element) {
        const tooltipText = element.getAttribute('title') || element.getAttribute('data-tooltip');
        if (!tooltipText) return;

        // Remove default title to prevent browser tooltip
        element.removeAttribute('title');

        let tooltip = null;

        element.addEventListener('mouseenter', (e) => {
            tooltip = this.createTooltip(tooltipText);
            document.body.appendChild(tooltip);
            this.positionTooltip(tooltip, e.target);
        });

        element.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
        });

        element.addEventListener('mousemove', (e) => {
            if (tooltip) {
                this.positionTooltip(tooltip, e.target, e.clientX, e.clientY);
            }
        });
    }

    createTooltip(text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: var(--card-background);
            color: var(--text-primary);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            border: 1px solid var(--card-border);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        setTimeout(() => tooltip.style.opacity = '1', 10);
        return tooltip;
    }

    positionTooltip(tooltip, element, mouseX = null, mouseY = null) {
        if (mouseX && mouseY) {
            tooltip.style.left = mouseX + 10 + 'px';
            tooltip.style.top = mouseY - tooltip.offsetHeight - 10 + 'px';
        } else {
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        }
    }

    // Animation System
    setupAnimations() {
        // Intersection Observer for scroll animations
        this.observeElements();
        
        // Add smooth transitions to cards
        document.querySelectorAll('.card').forEach(card => {
            card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        });
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.card, .stat-item').forEach(el => {
            observer.observe(el);
        });
    }

    // Theme Management
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(themeName) {
        if (!this.themes[themeName]) return;

        this.currentTheme = themeName;
        const theme = this.themes[themeName];
        
        // Apply CSS custom properties
        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}`, value);
        });

        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.icon');
            if (icon) {
                icon.textContent = themeName === 'dark' ? '🌙' : '☀️';
            }
        }

        // Save preference
        localStorage.setItem('theme', themeName);
        
        // Update select if exists
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = themeName;
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }

    // Responsive Design
    setupResponsive() {
        this.handleMobileMenu();
        this.handleScreenResize();
    }

    handleMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        if (menuToggle && sidebar && overlay) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        // Auto-show mobile header on small screens
        this.updateMobileHeader();
        window.addEventListener('resize', () => this.updateMobileHeader());
    }

    updateMobileHeader() {
        const mobileHeader = document.querySelector('.mobile-header');
        if (mobileHeader) {
            if (window.innerWidth <= 768) {
                mobileHeader.style.display = 'flex';
            } else {
                mobileHeader.style.display = 'none';
                // Close mobile menu if open
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('overlay');
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            }
        }
    }

    handleScreenResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.updateResponsiveElements();
            }, 250);
        });
    }

    updateResponsiveElements() {
        // Adjust chart sizes
        const charts = document.querySelectorAll('canvas');
        charts.forEach(chart => {
            if (chart.getContext) {
                chart.width = chart.offsetWidth;
                chart.height = chart.offsetHeight;
                // Trigger redraw if statistics manager is available
                if (window.StatisticsManager) {
                    window.StatisticsManager.updateStatistics();
                }
            }
        });
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const shortcuts = {
                'Space': () => this.handleSpaceKey(e),
                'Escape': () => this.handleEscapeKey(),
                'KeyS': () => this.handleSaveKey(e),
                'KeyT': () => this.handleTimerKey(e),
                'KeyG': () => this.handleGoalKey(e),
                'Digit1': () => this.handleTabKey(e, 'dashboard'),
                'Digit2': () => this.handleTabKey(e, 'timer'),
                'Digit3': () => this.handleTabKey(e, 'library'),
                'Digit4': () => this.handleTabKey(e, 'statistics'),
                'Digit5': () => this.handleTabKey(e, 'achievements')
            };

            const handler = shortcuts[e.code];
            if (handler) {
                handler();
            }
        });
    }

    handleSpaceKey(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            if (window.TimerManager) {
                window.TimerManager.toggle();
            }
        }
    }

    handleEscapeKey() {
        this.closeAllModals();
        // Also stop timer if running
        if (window.TimerManager && window.TimerManager.isRunning()) {
            window.TimerManager.stop();
        }
    }

    handleSaveKey(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            this.quickSave();
        }
    }

    handleTimerKey(e) {
        if (e.altKey) {
            e.preventDefault();
            this.switchTab('timer');
        }
    }

    handleGoalKey(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            this.showModal('goalEditModal');
        }
    }

    handleTabKey(e, tabId) {
        if (e.ctrlKey) {
            e.preventDefault();
            this.switchTab(tabId);
        }
    }

    quickSave() {
        if (window.GuitarPracticeApp) {
            window.GuitarPracticeApp.saveSettings();
            window.GuitarPracticeApp.saveNotes();
            this.showToast('Settings saved!', 'success');
        }
    }

    switchTab(tabId) {
        if (window.GuitarPracticeApp) {
            window.GuitarPracticeApp.switchTab(tabId);
        }
    }

    // Progress Animations
    animateProgressBar(element, targetPercent, duration = 1000) {
        const startPercent = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentPercent = startPercent + (targetPercent - startPercent) * this.easeOutCubic(progress);
            element.style.width = currentPercent + '%';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    animateCountUp(element, targetValue, duration = 1000, suffix = '') {
        const startValue = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * this.easeOutCubic(progress));
            element.textContent = currentValue + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Loading States
    showLoading(element, text = 'Loading...') {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        loader.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(45, 45, 45, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            border-radius: inherit;
        `;

        element.style.position = 'relative';
        element.appendChild(loader);
        return loader;
    }

    hideLoading(loader) {
        if (loader && loader.parentNode) {
            loader.remove();
        }
    }

    // Confirmation Dialogs
    showConfirmDialog(title, message, onConfirm, onCancel) {
        const modal = document.getElementById('confirmModal');
        if (!modal) return;

        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        // Remove existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        // Add new listeners
        newConfirmBtn.addEventListener('click', () => {
            this.closeModal('confirmModal');
            if (onConfirm) onConfirm();
        });

        newCancelBtn.addEventListener('click', () => {
            this.closeModal('confirmModal');
            if (onCancel) onCancel();
        });

        this.showModal('confirmModal');
    }

    // Toast Notifications (Enhanced)
    showToast(message, type = 'info', duration = 3000, actions = null) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        let actionsHTML = '';
        if (actions) {
            actionsHTML = actions.map(action => 
                `<button class="toast-action" data-action="${action.id}">${action.text}</button>`
            ).join('');
        }

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
                ${actionsHTML}
                <button class="toast-close">&times;</button>
            </div>
        `;

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            max-width: 400px;
            background: var(--card-background);
            border: 1px solid var(--card-border);
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Handle actions
        if (actions) {
            toast.querySelectorAll('.toast-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const actionId = e.target.getAttribute('data-action');
                    const action = actions.find(a => a.id === actionId);
                    if (action && action.handler) {
                        action.handler();
                    }
                    this.removeToast(toast);
                });
            });
        }

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        return toast;
    }

    removeToast(toast) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Progress Ring Animation
    animateProgressRing(element, targetPercent, duration = 1000) {
        if (!element) return;

        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        const startPercent = 0;
        const startTime = performance.now();

        element.style.strokeDasharray = circumference;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentPercent = startPercent + (targetPercent - startPercent) * this.easeOutCubic(progress);
            const offset = circumference - (currentPercent / 100) * circumference;
            
            element.style.strokeDashoffset = offset;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Form Validation
    validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;
        const errors = [];

        inputs.forEach(input => {
            this.clearValidationError(input);
            
            if (!input.value.trim()) {
                this.showValidationError(input, 'This field is required');
                isValid = false;
                errors.push({ field: input.name || input.id, message: 'Required field is empty' });
            } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                this.showValidationError(input, 'Please enter a valid email address');
                isValid = false;
                errors.push({ field: input.name || input.id, message: 'Invalid email format' });
            } else if (input.type === 'number') {
                const min = parseFloat(input.min);
                const max = parseFloat(input.max);
                const value = parseFloat(input.value);
                
                if (!isNaN(min) && value < min) {
                    this.showValidationError(input, `Value must be at least ${min}`);
                    isValid = false;
                    errors.push({ field: input.name || input.id, message: `Value below minimum (${min})` });
                } else if (!isNaN(max) && value > max) {
                    this.showValidationError(input, `Value must be at most ${max}`);
                    isValid = false;
                    errors.push({ field: input.name || input.id, message: `Value above maximum (${max})` });
                }
            }
        });

        return { isValid, errors };
    }

    showValidationError(input, message) {
        input.classList.add('error');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: var(--button-danger);
            font-size: 12px;
            margin-top: 4px;
        `;
        
        input.parentNode.appendChild(errorDiv);
    }

    clearValidationError(input) {
        input.classList.remove('error');
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Auto-save indicators
    showAutoSaveIndicator(element, text = 'Saving...') {
        const indicator = document.createElement('span');
        indicator.className = 'autosave-indicator';
        indicator.textContent = text;
        indicator.style.cssText = `
            color: var(--text-muted);
            font-size: 12px;
            margin-left: 10px;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        element.appendChild(indicator);
        setTimeout(() => indicator.style.opacity = '1', 10);

        return indicator;
    }

    hideAutoSaveIndicator(indicator, savedText = 'Saved ✓') {
        if (!indicator) return;
        
        indicator.textContent = savedText;
        indicator.style.color = 'var(--button-success)';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 200);
        }, 1500);
    }

    // Smooth scrolling
    smoothScrollTo(element, duration = 500) {
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        requestAnimationFrame(animation.bind(this));
    }

    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    // Focus management
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success', 2000);
            return true;
        } catch (err) {
            console.error('Failed to copy: ', err);
            this.showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }

    // File download
    downloadFile(data, filename, type = 'application/json') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // Color utilities
    getContrastColor(backgroundColor) {
        // Convert hex to RGB
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    // Device detection
    isMobile() {
        return window.innerWidth <= 768;
    }

    isTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Debounce utility
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Throttle utility
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Local storage with expiration
    setStorageWithExpiry(key, value, ttl) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    getStorageWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        const item = JSON.parse(itemStr);
        const now = new Date();

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }

        return item.value;
    }

    // Cleanup
    destroy() {
        // Remove event listeners
        this.closeAllModals();
        
        // Clear animations
        Object.values(this.animations).forEach(animation => {
            if (animation.cancel) animation.cancel();
        });
        
        // Remove tooltips
        document.querySelectorAll('.tooltip').forEach(tooltip => {
            tooltip.remove();
        });
        
        // Remove toasts
        document.querySelectorAll('.toast').forEach(toast => {
            toast.remove();
        });
    }
}

// Create global instance
window.UIManager = new UIManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.UIManager.init();
});

// CSS for UI components (injected dynamically)
const uiStyles = `
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        backdrop-filter: blur(5px);
    }

    .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--card-background);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .modal-content.large {
        width: 800px;
        height: 600px;
    }

    .modal-header {
        padding: 20px;
        border-bottom: 1px solid var(--card-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        color: var(--text-primary);
    }

    .btn-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }

    .btn-close:hover {
        background: var(--card-border);
    }

    .modal-body {
        padding: 20px;
    }

    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
    }

    .toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .toast-message {
        flex: 1;
        color: var(--text-primary);
    }

    .toast-action {
        background: var(--button-primary);
        color: var(--text-primary);
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }

    .toast-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0;
        width: 20px;
        height: 20px;
    }

    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--card-border);
        border-top: 2px solid var(--button-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .loading-text {
        margin-top: 10px;
        color: var(--text-secondary);
        font-size: 14px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .animate-in {
        animation: slideInUp 0.5s ease;
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .form-input.error {
        border-color: var(--button-danger);
    }

    .progress-ring {
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
    }

    .progress-ring-background {
        fill: none;
        stroke: var(--card-border);
        stroke-width: 4;
    }

    .progress-ring-progress {
        fill: none;
        stroke: var(--button-primary);
        stroke-width: 4;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s ease;
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 95vw;
            margin: 20px;
        }

        .toast {
            right: 10px;
            left: 10px;
            min-width: auto;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = uiStyles;
document.head.appendChild(styleSheet);
