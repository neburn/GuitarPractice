/**
 * Main Application Logic - Study Timer PWA
 * Integrates all components with exact Python app functionality
 */

class StudyTimerApp {
    constructor() {
        this.state = {
            activeTab: 'dashboard',
            timer: {
                isRunning: false,
                isPaused: false,
                startTime: null,
                elapsed: 0,
                currentSession: null
            },
            settings: {
                dailyGoal: 60, // minutes
                currentSubject: 'Mathematics',
                notificationsEnabled: true,
                breakInterval: 25,
                eyeCareEnabled: false,
                theme: 'dark'
            },
            data: {
                sessions: [],
                notes: '',
                achievements: []
            }
        };

        this.timerInterval = null;
        this.breakReminder = null;
    }

    async init() {
        console.log('🚀 Initializing Study Timer App...');
        
        try {
            // Initialize database
            await window.DatabaseManager.init();
            console.log('✅ Database initialized');

            // Load data from IndexedDB
            await this.loadData();
            console.log('✅ Data loaded');

            // Setup UI event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup');

            // Initialize UI components
            this.initializeUI();
            console.log('✅ UI initialized');

            // Setup notifications
            this.setupNotifications();
            console.log('✅ Notifications setup');

            // Setup break reminders
            this.setupBreakReminders();
            console.log('✅ Break reminders setup');

            // Update dashboard
            this.updateDashboard();
            console.log('✅ Dashboard updated');

            updateStatusIndicator('📱 Ready to study!', 2000);
            
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showToast('Failed to initialize app', 'error');
        }
    }

    async loadData() {
        // Load sessions
        this.state.data.sessions = await window.DatabaseManager.getAll('sessions');
        
        // Load settings
        this.state.settings.dailyGoal = await window.DatabaseManager.getSetting('dailyGoal', 60);
        this.state.settings.currentSubject = await window.DatabaseManager.getSetting('currentSubject', 'Mathematics');
        this.state.settings.notificationsEnabled = await window.DatabaseManager.getSetting('notificationsEnabled', true);
        this.state.settings.breakInterval = await window.DatabaseManager.getSetting('breakInterval', 25);
        this.state.settings.eyeCareEnabled = await window.DatabaseManager.getSetting('eyeCareEnabled', false);
        
        // Load notes
        this.state.data.notes = await window.DatabaseManager.getSetting('notes', '');
        
        console.log('Data loaded:', this.state);
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Timer controls
        document.getElementById('startBtn')?.addEventListener('click', () => this.startTimer());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.pauseTimer());
        document.getElementById('stopBtn')?.addEventListener('click', () => this.stopTimer());

        // Quick practice buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.getAttribute('data-minutes'));
                this.quickPractice(minutes);
            });
        });

        // Settings
        document.getElementById('editGoal')?.addEventListener('click', () => this.showGoalEditor());
        document.getElementById('saveGoalEdit')?.addEventListener('click', () => this.saveGoal());
        document.getElementById('cancelGoalEdit')?.addEventListener('click', () => this.hideGoalEditor());

        // Practice item selection
        document.getElementById('practiceItem')?.addEventListener('change', (e) => {
            this.state.settings.currentSubject = e.target.value;
            this.saveSettings();
        });

        // Session notes
        document.getElementById('sessionNotes')?.addEventListener('input', (e) => {
            this.state.data.notes = e.target.value;
            this.saveNotes();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.ctrlKey) {
                e.preventDefault();
                this.toggleTimer();
            }
            if (e.code === 'Escape') {
                this.stopTimer();
            }
        });

        // Settings modal
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettings')?.addEventListener('click', () => this.hideSettings());

        // Mobile menu
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        // Mobile responsive menu logic would go here
        // For now, keeping it simple
    }

    initializeUI() {
        this.updateTimerDisplay();
        this.updateQuickPracticeItems();
        this.updateGoalDisplay();
        this.updateRecentSessions();
        this.loadPracticeItems();
    }

    // Timer Management
    startTimer() {
        if (!this.state.settings.currentSubject) {
            this.showToast('Please select what to practice first!', 'warning');
            return;
        }

        if (this.state.timer.isPaused) {
            // Resume
            this.state.timer.startTime = Date.now() - this.state.timer.elapsed;
            this.state.timer.isPaused = false;
        } else {
            // Fresh start
            this.state.timer.startTime = Date.now();
            this.state.timer.elapsed = 0;
            this.state.timer.currentSession = {
                item: this.state.settings.currentSubject,
                startTime: new Date().toISOString(),
                subject: this.state.settings.currentSubject
            };
        }

        this.state.timer.isRunning = true;
        this.updateTimerButtons();
        
        // Start timer interval
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);

        this.showToast('Timer started!', 'success');
        updateStatusIndicator('⏱️ Studying...');
    }

    pauseTimer() {
        this.state.timer.isRunning = false;
        this.state.timer.isPaused = true;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.updateTimerButtons();
        this.showToast('Timer paused', 'info');
        updateStatusIndicator('⏸️ Paused');
    }

    stopTimer() {
        const sessionDuration = Math.floor(this.state.timer.elapsed / 1000);
        
        this.state.timer.isRunning = false;
        this.state.timer.isPaused = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Save session if longer than 1 minute
        if (sessionDuration >= 60) {
            this.saveSession(sessionDuration);
        }
        
        // Reset timer
        this.state.timer.elapsed = 0;
        this.state.timer.startTime = null;
        this.state.timer.currentSession = null;
        
        this.updateTimerDisplay();
        this.updateTimerButtons();
        this.updateDashboard();
        
        this.showToast('Session completed!', 'success');
        updateStatusIndicator('✅ Session saved');
    }

    toggleTimer() {
        if (this.state.timer.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    updateTimer() {
        if (this.state.timer.isRunning && this.state.timer.startTime) {
            this.state.timer.elapsed = Date.now() - this.state.timer.startTime;
            this.updateTimerDisplay();
            this.updateGoalProgress();
            
            // Check for break reminders
            this.checkBreakReminder();
        }
    }

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (display) {
            const seconds = Math.floor(this.state.timer.elapsed / 1000);
            display.textContent = this.formatTime(seconds);
            
            // Update page title when running
            if (this.state.timer.isRunning) {
                document.title = `${this.formatTime(seconds)} - Study Timer`;
            } else {
                document.title = 'Study Timer - Focus App';
            }
        }
    }

    updateTimerButtons() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (startBtn && pauseBtn && stopBtn) {
            if (this.state.timer.isRunning) {
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                startBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Running...</span>';
            } else if (this.state.timer.isPaused) {
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = false;
                startBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Resume</span>';
            } else {
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                startBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Start</span>';
            }
        }
    }

    async saveSession(duration) {
        try {
            const session = {
                item: this.state.settings.currentSubject,
                duration: duration,
                date: new Date().toISOString(),
                notes: this.state.data.notes
            };
            
            await window.DatabaseManager.addPracticeSession(session);
            this.state.data.sessions.push(session);
            
            console.log('Session saved:', session);
        } catch (error) {
            console.error('Error saving session:', error);
            this.showToast('Failed to save session', 'error');
        }
    }

    // Quick Practice
    async quickPractice(minutes) {
        if (!this.state.settings.currentSubject) {
            this.showToast('Please select what to practice first!', 'warning');
            return;
        }

        try {
            const session = {
                item: this.state.settings.currentSubject,
                duration: minutes * 60, // Convert to seconds
                date: new Date().toISOString(),
                notes: `Quick ${minutes}-minute session`
            };
            
            await window.DatabaseManager.addPracticeSession(session);
            this.state.data.sessions.push(session);
            
            this.showToast(`Added ${minutes}-minute session!`, 'success');
            this.updateDashboard();
            
        } catch (error) {
            console.error('Error saving quick session:', error);
            this.showToast('Failed to save session', 'error');
        }
    }

    // UI Updates
    updateDashboard() {
        this.updateTodayStats();
        this.updateGoalProgress();
        this.updateRecentSessions();
        this.updateStreakData();
    }

    updateTodayStats() {
        const today = new Date().toDateString();
        const todaySessions = this.state.data.sessions.filter(session => 
            new Date(session.date).toDateString() === today
        );
        
        const todayTime = todaySessions.reduce((total, session) => total + session.duration, 0);
        const todayCount = todaySessions.length;
        
        // Update UI
        const todayTimeEl = document.getElementById('todayTime');
        const todaySessionsEl = document.getElementById('todaySessions');
        
        if (todayTimeEl) {
            todayTimeEl.textContent = this.formatTime(todayTime);
        }
        
        if (todaySessionsEl) {
            todaySessionsEl.textContent = todayCount;
        }
    }

    updateGoalProgress() {
        const today = new Date().toDateString();
        const todaySessions = this.state.data.sessions.filter(session => 
            new Date(session.date).toDateString() === today
        );
        
        let todayMinutes = todaySessions.reduce((total, session) => total + Math.floor(session.duration / 60), 0);
        
        // Add current session time if running
        if (this.state.timer.isRunning) {
            todayMinutes += Math.floor(this.state.timer.elapsed / 60000);
        }
        
        const goalMinutes = this.state.settings.dailyGoal;
        const progress = Math.min((todayMinutes / goalMinutes) * 100, 100);
        
        // Update progress bar
        const progressBar = document.getElementById('goalProgressRing');
        if (progressBar) {
            const circumference = 2 * Math.PI * 35;
            const offset = circumference - (progress / 100) * circumference;
            progressBar.style.strokeDasharray = circumference;
            progressBar.style.strokeDashoffset = offset;
        }
        
        // Update text
        const progressText = document.getElementById('goalProgressText');
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        
        const goalProgress = document.getElementById('goalProgress');
        if (goalProgress) {
            goalProgress.textContent = `${Math.round(progress)}%`;
        }
        
        const goalRemaining = document.getElementById('goalRemaining');
        if (goalRemaining) {
            const remaining = Math.max(0, goalMinutes - todayMinutes);
            goalRemaining.textContent = remaining > 0 ? 
                `${remaining} minutes remaining` : 
                'Goal completed! 🎉';
        }
    }

    updateRecentSessions() {
        const recentSessionsList = document.getElementById('recentSessionsList');
        if (!recentSessionsList) return;
        
        const recentSessions = this.state.data.sessions
            .slice(-5)
            .reverse();
        
        if (recentSessions.length === 0) {
            recentSessionsList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🎯</span>
                    <p>No sessions yet. Start practicing!</p>
                </div>
            `;
            return;
        }
        
        recentSessionsList.innerHTML = recentSessions.map(session => `
            <div class="session-item">
                <div class="session-info">
                    <div class="session-subject">${session.item}</div>
                    <div class="session-date">${new Date(session.date).toLocaleString()}</div>
                </div>
                <div class="session-duration">${this.formatTime(session.duration)}</div>
            </div>
        `).join('');
    }

    updateStreakData() {
        // Calculate current streak
        const sessions = this.state.data.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
        let currentStreak = 0;
        let checkDate = new Date();
        
        for (let i = 0; i < 30; i++) { // Check last 30 days
            const dateStr = checkDate.toDateString();
            const hasSession = sessions.some(session => 
                new Date(session.date).toDateString() === dateStr
            );
            
            if (hasSession) {
                currentStreak++;
            } else if (i > 0) { // Don't break on first day (today might not have sessions yet)
                break;
            }
            
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        const currentStreakEl = document.getElementById('currentStreak');
        if (currentStreakEl) {
            currentStreakEl.textContent = currentStreak;
        }
    }

    loadPracticeItems() {
        const practiceSelect = document.getElementById('practiceItem');
        const quickPracticeSelect = document.getElementById('quickPracticeItem');
        
        const subjects = [
            'Mathematics',
            'Science', 
            'Literature',
            'History',
            'Geography',
            'Language Arts',
            'Foreign Languages',
            'Computer Science',
            'Psychology',
            'Philosophy',
            'Art',
            'Music',
            'Other'
        ];
        
        const updateSelect = (select) => {
            if (!select) return;
            select.innerHTML = '<option value="">Select what to practice...</option>';
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                if (subject === this.state.settings.currentSubject) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        };
        
        updateSelect(practiceSelect);
        updateSelect(quickPracticeSelect);
    }

    updateQuickPracticeItems() {
        const quickPracticeItem = document.getElementById('quickPracticeItem');
        if (quickPracticeItem) {
            quickPracticeItem.value = this.state.settings.currentSubject;
        }
    }

    // Goal Management
    showGoalEditor() {
        const modal = document.getElementById('goalEditModal');
        const goalMinutes = document.getElementById('goalMinutes');
        
        if (modal && goalMinutes) {
            goalMinutes.value = this.state.settings.dailyGoal;
            modal.style.display = 'block';
        }
    }

    hideGoalEditor() {
        const modal = document.getElementById('goalEditModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async saveGoal() {
        const goalMinutes = document.getElementById('goalMinutes');
        if (goalMinutes) {
            const newGoal = parseInt(goalMinutes.value);
            if (newGoal >= 5 && newGoal <= 480) {
                this.state.settings.dailyGoal = newGoal;
                await this.saveSettings();
                this.updateGoalDisplay();
                this.updateGoalProgress();
                this.hideGoalEditor();
                this.showToast('Goal updated!', 'success');
            } else {
                this.showToast('Goal must be between 5 and 480 minutes', 'error');
            }
        }
    }

    updateGoalDisplay() {
        const goalTarget = document.getElementById('goalTarget');
        if (goalTarget) {
            goalTarget.textContent = `${this.state.settings.dailyGoal} minutes`;
        }
    }

    // Tab Management
    switchTab(tabId) {
        // Update navigation
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabId}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        this.state.activeTab = tabId;
        
        // Load tab-specific data
        if (tabId === 'statistics') {
            this.loadStatistics();
        } else if (tabId === 'dashboard') {
            this.updateDashboard();
        }
    }

    // Statistics
    loadStatistics() {
        // This would load statistics data and update charts
        // For now, just update basic stats
        const totalTime = this.state.data.sessions.reduce((total, session) => total + session.duration, 0);
        const totalSessions = this.state.data.sessions.length;
        
        const totalTimeEl = document.getElementById('totalPracticeTime');
        const totalSessionsEl = document.getElementById('totalSessions');
        
        if (totalTimeEl) {
            totalTimeEl.textContent = this.formatTime(totalTime);
        }
        
        if (totalSessionsEl) {
            totalSessionsEl.textContent = totalSessions;
        }
    }

    // Break Reminders & Notifications
    setupNotifications() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    setupBreakReminders() {
        if (this.state.settings.notificationsEnabled && this.state.settings.eyeCareEnabled) {
            // Set up 20-20-20 rule reminders every 20 minutes
            setInterval(() => {
                if (this.state.timer.isRunning) {
                    this.showNotification('Eye Care Reminder', 'Time for a 20-second break! Look at something 20 feet away.');
                }
            }, 20 * 60 * 1000); // 20 minutes
        }
    }

    checkBreakReminder() {
        const elapsed = Math.floor(this.state.timer.elapsed / 60000); // minutes
        const breakInterval = this.state.settings.breakInterval;
        
        if (elapsed > 0 && elapsed % breakInterval === 0 && this.state.settings.notificationsEnabled) {
            this.showNotification('Break Time!', `You've been studying for ${elapsed} minutes. Time for a short break!`);
        }
    }

    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0iIzRBOTBFMiI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiLz48L3N2Zz4='
            });
        }
    }

    // Settings Management
    async saveSettings() {
        try {
            await window.DatabaseManager.setSetting('dailyGoal', this.state.settings.dailyGoal);
            await window.DatabaseManager.setSetting('currentSubject', this.state.settings.currentSubject);
            await window.DatabaseManager.setSetting('notificationsEnabled', this.state.settings.notificationsEnabled);
            await window.DatabaseManager.setSetting('breakInterval', this.state.settings.breakInterval);
            await window.DatabaseManager.setSetting('eyeCareEnabled', this.state.settings.eyeCareEnabled);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    async saveNotes() {
        try {
            await window.DatabaseManager.setSetting('notes', this.state.data.notes);
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    showSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Utility Functions
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    showToast(message, type = 'info') {
        // Use the global showToast function
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize the app
window.GuitarPracticeApp = new StudyTimerApp();

// Auto-start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.GuitarPracticeApp.init();
    });
} else {
    window.GuitarPracticeApp.init();
}
