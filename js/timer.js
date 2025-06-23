/**
 * Timer Management Component
 * Advanced timer functionality with exact Python app features
 */

class TimerManager {
    constructor() {
        this.state = {
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsed: 0,
            sessionStartTime: null,
            currentItem: null,
            breakMode: false
        };
        
        this.interval = null;
        this.callbacks = {};
        this.autoBreakSettings = {
            enabled: false,
            interval: 25, // minutes
            duration: 5   // minutes
        };
        
        this.notifications = {
            goalReached: false,
            breakReminders: true
        };
    }

    // Timer Core Functions
    start(item = null) {
        if (!item && !this.state.currentItem) {
            return { success: false, message: 'Please select an item to practice!' };
        }

        if (this.state.isPaused) {
            // Resume from pause
            this.state.startTime = Date.now() - this.state.elapsed;
            this.state.isPaused = false;
        } else {
            // Fresh start
            this.state.startTime = Date.now();
            this.state.sessionStartTime = Date.now();
            this.state.elapsed = 0;
            this.state.currentItem = item || this.state.currentItem;
            this.notifications.goalReached = false;
        }
        
        this.state.isRunning = true;
        this.startInterval();
        
        this.triggerCallback('onStart', {
            item: this.state.currentItem,
            startTime: this.state.sessionStartTime
        });
        
        return { success: true, message: 'Timer started successfully' };
    }

    pause() {
        if (!this.state.isRunning) {
            return { success: false, message: 'Timer is not running' };
        }
        
        this.state.elapsed = Date.now() - this.state.startTime;
        this.state.isRunning = false;
        this.state.isPaused = true;
        this.stopInterval();
        
        this.triggerCallback('onPause', {
            elapsed: this.state.elapsed,
            item: this.state.currentItem
        });
        
        return { success: true, message: 'Timer paused' };
    }

    resume() {
        if (!this.state.isPaused) {
            return { success: false, message: 'Timer is not paused' };
        }
        
        return this.start();
    }

    stop() {
        const sessionDuration = this.getCurrentTime();
        const wasRunning = this.state.isRunning;
        
        this.state.isRunning = false;
        this.state.isPaused = false;
        this.stopInterval();
        
        // Save session if duration >= 1 minute
        let sessionSaved = false;
        if (sessionDuration >= 60 && this.state.currentItem) {
            sessionSaved = true;
            this.triggerCallback('onSessionSave', {
                item: this.state.currentItem,
                duration: sessionDuration,
                startTime: this.state.sessionStartTime,
                endTime: new Date().toISOString()
            });
        }
        
        // Reset state
        this.resetState();
        
        this.triggerCallback('onStop', {
            duration: sessionDuration,
            sessionSaved: sessionSaved
        });
        
        return { 
            success: true, 
            message: sessionSaved ? 'Session saved successfully' : 'Timer stopped',
            sessionSaved: sessionSaved,
            duration: sessionDuration
        };
    }

    toggle() {
        if (this.state.isRunning) {
            return this.pause();
        } else if (this.state.isPaused) {
            return this.resume();
        } else {
            return { success: false, message: 'Please select an item first' };
        }
    }

    // Timer State Management
    getCurrentTime() {
        if (this.state.isRunning && this.state.startTime) {
            return Math.floor((Date.now() - this.state.startTime) / 1000);
        }
        return Math.floor(this.state.elapsed / 1000);
    }

    getFormattedTime() {
        const seconds = this.getCurrentTime();
        return this.formatTime(seconds);
    }

    isRunning() {
        return this.state.isRunning;
    }

    isPaused() {
        return this.state.isPaused;
    }

    getCurrentItem() {
        return this.state.currentItem;
    }

    resetState() {
        this.state = {
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsed: 0,
            sessionStartTime: null,
            currentItem: null,
            breakMode: false
        };
        this.notifications.goalReached = false;
    }

    // Timer Interval Management
    startInterval() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        this.interval = setInterval(() => {
            this.onTick();
        }, 1000);
    }

    stopInterval() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    onTick() {
        const currentTime = this.getCurrentTime();
        
        // Update display
        this.triggerCallback('onTick', {
            currentTime: currentTime,
            formattedTime: this.formatTime(currentTime),
            item: this.state.currentItem
        });
        
        // Check for goal completion
        this.checkGoalCompletion(currentTime);
        
        // Check for auto-break
        this.checkAutoBreak(currentTime);
        
        // Check for eye care reminder
        this.checkEyeCareReminder(currentTime);
        
        // Update page title
        this.updatePageTitle(currentTime);
    }

    // Auto-break Management
    enableAutoBreak(intervalMinutes = 25, durationMinutes = 5) {
        this.autoBreakSettings = {
            enabled: true,
            interval: intervalMinutes,
            duration: durationMinutes
        };
    }

    disableAutoBreak() {
        this.autoBreakSettings.enabled = false;
    }

    checkAutoBreak(currentTimeSeconds) {
        if (!this.autoBreakSettings.enabled || this.state.breakMode) {
            return;
        }
        
        const minutes = Math.floor(currentTimeSeconds / 60);
        const intervalMinutes = this.autoBreakSettings.interval;
        
        if (minutes > 0 && minutes % intervalMinutes === 0) {
            this.triggerAutoBreak();
        }
    }

    triggerAutoBreak() {
        const breakDuration = this.autoBreakSettings.duration;
        
        // Pause current timer
        this.pause();
        
        // Start break timer
        this.state.breakMode = true;
        
        this.triggerCallback('onAutoBreak', {
            duration: breakDuration,
            message: `Time for a ${breakDuration}-minute break!`
        });
        
        // Auto-resume after break (if user wants)
        setTimeout(() => {
            if (this.state.breakMode) {
                this.state.breakMode = false;
                this.triggerCallback('onBreakEnd', {
                    message: 'Break time over! Ready to continue?'
                });
            }
        }, breakDuration * 60 * 1000);
    }

    // Goal & Achievement Tracking
    checkGoalCompletion(currentTimeSeconds) {
        if (this.notifications.goalReached) {
            return;
        }
        
        const minutes = Math.floor(currentTimeSeconds / 60);
        const goalMinutes = this.getGoalMinutes();
        
        if (minutes >= goalMinutes) {
            this.notifications.goalReached = true;
            this.triggerGoalAchievement(minutes);
        }
    }

    triggerGoalAchievement(minutes) {
        const congratsMessages = [
            "Congratulations! You've reached your study goal. Take a well-deserved break and recharge!",
            "Study session complete! Great job on reaching your goal. Time for a quick break!",
            "You did it! Study session accomplished. Treat yourself to a moment of relaxation!",
            "Well done! You've met your study goal. Now, take some time to unwind and reflect on your progress.",
            "Study session over! You've achieved your goal. Reward yourself with a brief pause before your next task.",
            "Goal achieved! Take a breather and pat yourself on the back for your hard work.",
            "Mission accomplished! You've hit your study target. Enjoy a short break before diving back in.",
            "Study session complete. Nicely done! Use this time to relax and rejuvenate before your next endeavor.",
            "You've reached your study goal! Treat yourself to a well-deserved break. You've earned it!",
            "Goal achieved! Take a moment to celebrate your success. Your dedication is paying off!"
        ];
        
        const randomMessage = congratsMessages[Math.floor(Math.random() * congratsMessages.length)];
        
        this.triggerCallback('onGoalReached', {
            minutes: minutes,
            message: randomMessage,
            goalMinutes: this.getGoalMinutes()
        });
        
        // Show notification if supported
        this.showNotification('Study Goal Reached! 🎉', randomMessage);
    }

    // Eye Care Reminders (20-20-20 rule)
    checkEyeCareReminder(currentTimeSeconds) {
        const minutes = Math.floor(currentTimeSeconds / 60);
        
        // Every 20 minutes
        if (minutes > 0 && minutes % 20 === 0) {
            this.triggerEyeCareReminder();
        }
    }

    triggerEyeCareReminder() {
        const message = "It's time for a 20/20/20 break! Look away for 20 seconds at something 20 feet away.";
        
        this.triggerCallback('onEyeCareReminder', {
            message: message,
            rule: "20-20-20"
        });
        
        this.showNotification('Eye Care Reminder 👁️', message);
    }

    // Quick Practice Sessions
    async addQuickSession(item, minutes) {
        const seconds = minutes * 60;
        
        const session = {
            item: item,
            duration: seconds,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            quickSession: true
        };
        
        this.triggerCallback('onQuickSession', session);
        
        return session;
    }

    // Callback System
    setCallback(event, callback) {
        this.callbacks[event] = callback;
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    triggerCallback(event, data = {}) {
        if (this.callbacks[event] && typeof this.callbacks[event] === 'function') {
            try {
                this.callbacks[event](data);
            } catch (error) {
                console.error(`Error in timer callback ${event}:`, error);
            }
        }
    }

    // Notifications
    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: this.getNotificationIcon(),
                tag: 'study-timer',
                requireInteraction: false
            });
            
            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);
        }
        
        // Also trigger callback for in-app notifications
        this.triggerCallback('onNotification', { title, message });
    }

    getNotificationIcon() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0iIzRBOTBFMiI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiLz48L3N2Zz4=';
    }

    // Background Timer Support
    handleVisibilityChange() {
        if (document.hidden && this.state.isRunning) {
            // Store current state for background continuation
            this.backgroundStartTime = Date.now();
            this.showNotification('Timer Running', 'Your study timer is running in the background');
        } else if (!document.hidden && this.backgroundStartTime && this.state.isRunning) {
            // Sync timer after returning from background
            const backgroundTime = Date.now() - this.backgroundStartTime;
            this.state.elapsed += backgroundTime;
            this.backgroundStartTime = null;
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

    updatePageTitle(seconds) {
        if (this.state.isRunning) {
            const formatted = this.formatTime(seconds);
            document.title = `${formatted} - Study Timer`;
        } else {
            document.title = 'Study Timer - Focus App';
        }
    }

    getGoalMinutes() {
        // This should be connected to the app's goal setting
        return window.GuitarPracticeApp?.state?.settings?.dailyGoal || 60;
    }

    // Persistence
    saveState() {
        const timerState = {
            isRunning: this.state.isRunning,
            isPaused: this.state.isPaused,
            elapsed: this.state.elapsed,
            currentItem: this.state.currentItem,
            sessionStartTime: this.state.sessionStartTime,
            autoBreakSettings: this.autoBreakSettings
        };
        
        localStorage.setItem('timerState', JSON.stringify(timerState));
    }

    loadState() {
        try {
            const saved = localStorage.getItem('timerState');
            if (saved) {
                const timerState = JSON.parse(saved);
                
                // Only restore if session was recent (within last hour)
                if (timerState.sessionStartTime) {
                    const sessionAge = Date.now() - new Date(timerState.sessionStartTime).getTime();
                    if (sessionAge < 60 * 60 * 1000) { // 1 hour
                        this.state = { ...this.state, ...timerState };
                        this.autoBreakSettings = timerState.autoBreakSettings || this.autoBreakSettings;
                        
                        // If was running, ask user if they want to continue
                        if (timerState.isRunning) {
                            this.triggerCallback('onStateRestore', {
                                sessionAge: Math.floor(sessionAge / 1000),
                                item: timerState.currentItem
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading timer state:', error);
        }
    }

    clearState() {
        localStorage.removeItem('timerState');
    }

    // Timer Modes
    startBreakTimer(minutes = 5) {
        this.state.breakMode = true;
        this.state.currentItem = `☕ Break (${minutes}m)`;
        return this.start();
    }

    startPomodoroSession(workMinutes = 25, breakMinutes = 5) {
        this.enableAutoBreak(workMinutes, breakMinutes);
        return this.start();
    }

    // Statistics & Analytics
    getSessionStats() {
        return {
            currentTime: this.getCurrentTime(),
            isRunning: this.state.isRunning,
            isPaused: this.state.isPaused,
            currentItem: this.state.currentItem,
            sessionStartTime: this.state.sessionStartTime,
            goalProgress: this.getGoalProgress()
        };
    }

    getGoalProgress() {
        const currentMinutes = Math.floor(this.getCurrentTime() / 60);
        const goalMinutes = this.getGoalMinutes();
        return Math.min((currentMinutes / goalMinutes) * 100, 100);
    }

    // Cleanup
    destroy() {
        this.stopInterval();
        this.clearState();
        this.callbacks = {};
    }
}

// Create global instance
window.TimerManager = new TimerManager();

// Setup document visibility change handler
document.addEventListener('visibilitychange', () => {
    window.TimerManager.handleVisibilityChange();
});

// Auto-save state periodically
setInterval(() => {
    if (window.TimerManager.isRunning()) {
        window.TimerManager.saveState();
    }
}, 30000); // Every 30 seconds

// Load state on page load
document.addEventListener('DOMContentLoaded', () => {
    window.TimerManager.loadState();
});
