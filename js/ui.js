/**
 * Statistics and Analytics Component
 * Creates charts and analytics like the Python app
 */

class StatisticsManager {
    constructor() {
        this.chartInstances = {};
        this.colors = {
            primary: '#4A90E2',
            success: '#28A745',
            warning: '#FFC107',
            danger: '#DC3545',
            info: '#17A2B8',
            secondary: '#6C757D'
        };
    }

    async init() {
        console.log('📊 Initializing Statistics Manager...');
        this.loadChartLibrary();
    }

    loadChartLibrary() {
        // Simple chart implementation without external dependencies
        // Using Canvas API for lightweight charts
    }

    // Main Statistics Dashboard
    async updateStatistics(timeframe = 'all') {
        try {
            const sessions = await window.DatabaseManager.getAll('sessions');
            const stats = this.calculateStatistics(sessions, timeframe);
            
            this.updateOverviewStats(stats);
            this.createPracticeChart(sessions, timeframe);
            this.createSubjectDistribution(sessions);
            this.createWeeklyHeatmap(sessions);
            this.updateTopPracticed(sessions);
            
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    calculateStatistics(sessions, timeframe = 'all') {
        const filteredSessions = this.filterSessionsByTimeframe(sessions, timeframe);
        
        if (filteredSessions.length === 0) {
            return {
                totalTime: 0,
                totalSessions: 0,
                averageSession: 0,
                longestSession: 0,
                practiceByType: {},
                practiceBySubject: {},
                dailyAverages: {}
            };
        }

        const totalTime = filteredSessions.reduce((sum, session) => sum + session.duration, 0);
        const totalSessions = filteredSessions.length;
        const averageSession = Math.floor(totalTime / totalSessions);
        const longestSession = Math.max(...filteredSessions.map(s => s.duration));

        // Group by subject
        const practiceBySubject = {};
        filteredSessions.forEach(session => {
            const subject = session.item || 'Unknown';
            practiceBySubject[subject] = (practiceBySubject[subject] || 0) + session.duration;
        });

        // Daily averages
        const sessionsByDate = this.groupSessionsByDate(filteredSessions);
        const dailyAverages = {};
        Object.keys(sessionsByDate).forEach(date => {
            const dayTotal = sessionsByDate[date].reduce((sum, s) => sum + s.duration, 0);
            dailyAverages[date] = dayTotal;
        });

        return {
            totalTime,
            totalSessions,
            averageSession,
            longestSession,
            practiceBySubject,
            dailyAverages,
            filteredSessions
        };
    }

    updateOverviewStats(stats) {
        // Update overview statistics display
        const elements = {
            'totalPracticeTime': this.formatTime(stats.totalTime),
            'totalSessions': stats.totalSessions.toString(),
            'averageSession': this.formatTime(stats.averageSession),
            'longestSession': this.formatTime(stats.longestSession)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Chart Creation Functions
    createPracticeChart(sessions, timeframe = 'weekly') {
        const canvas = document.getElementById('practiceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.clearCanvas(ctx, canvas);

        const data = this.preparePracticeChartData(sessions, timeframe);
        this.drawBarChart(ctx, canvas, data, {
            title: 'Practice History',
            color: this.colors.primary,
            yAxisLabel: 'Minutes'
        });
    }

    preparePracticeChartData(sessions, timeframe) {
        const groupedData = {};
        const now = new Date();
        let labels = [];
        
        if (timeframe === 'daily') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const key = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dateKey = date.toDateString();
                labels.push(key);
                groupedData[dateKey] = 0;
            }
            
            sessions.forEach(session => {
                const sessionDate = new Date(session.date).toDateString();
                if (groupedData.hasOwnProperty(sessionDate)) {
                    groupedData[sessionDate] += Math.floor(session.duration / 60);
                }
            });
            
        } else if (timeframe === 'weekly') {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
                const key = `Week ${4 - i}`;
                labels.push(key);
                groupedData[key] = 0;
            }
            
            sessions.forEach(session => {
                const sessionDate = new Date(session.date);
                const weeksDiff = Math.floor((now - sessionDate) / (7 * 24 * 60 * 60 * 1000));
                if (weeksDiff >= 0 && weeksDiff < 4) {
                    const weekKey = `Week ${4 - weeksDiff}`;
                    groupedData[weekKey] += Math.floor(session.duration / 60);
                }
            });
            
        } else if (timeframe === 'monthly') {
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = month.toLocaleDateString('en-US', { month: 'short' });
                labels.push(key);
                groupedData[key] = 0;
            }
            
            sessions.forEach(session => {
                const sessionDate = new Date(session.date);
                const monthKey = sessionDate.toLocaleDateString('en-US', { month: 'short' });
                if (groupedData.hasOwnProperty(monthKey)) {
                    groupedData[monthKey] += Math.floor(session.duration / 60);
                }
            });
        }

        return {
            labels: labels,
            data: labels.map(label => groupedData[label] || 0)
        };
    }

    createSubjectDistribution(sessions) {
        const canvas = document.getElementById('subjectChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.clearCanvas(ctx, canvas);

        // Group sessions by subject
        const subjectData = {};
        sessions.forEach(session => {
            const subject = session.item || 'Unknown';
            subjectData[subject] = (subjectData[subject] || 0) + Math.floor(session.duration / 60);
        });

        // Convert to array and sort
        const sortedSubjects = Object.entries(subjectData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8); // Top 8 subjects

        if (sortedSubjects.length === 0) return;

        const data = {
            labels: sortedSubjects.map(([subject]) => subject),
            data: sortedSubjects.map(([, minutes]) => minutes)
        };

        this.drawPieChart(ctx, canvas, data, {
            title: 'Study Time by Subject'
        });
    }

    createWeeklyHeatmap(sessions) {
        const container = document.getElementById('weeklyHeatmap');
        if (!container) return;

        // Create heatmap grid for last 12 weeks
        const weeks = 12;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Group sessions by date
        const sessionsByDate = {};
        sessions.forEach(session => {
            const date = new Date(session.date).toDateString();
            sessionsByDate[date] = (sessionsByDate[date] || 0) + session.duration;
        });

        // Find max value for scaling
        const maxMinutes = Math.max(...Object.values(sessionsByDate).map(s => Math.floor(s / 60)), 1);

        let html = '<div class="heatmap-container">';
        html += '<div class="heatmap-days">';
        days.forEach(day => {
            html += `<div class="heatmap-day-label">${day}</div>`;
        });
        html += '</div>';
        
        html += '<div class="heatmap-grid">';
        
        const now = new Date();
        for (let week = weeks - 1; week >= 0; week--) {
            html += '<div class="heatmap-week">';
            for (let day = 0; day < 7; day++) {
                const date = new Date(now);
                date.setDate(date.getDate() - (week * 7 + (6 - day)));
                
                const dateStr = date.toDateString();
                const minutes = Math.floor((sessionsByDate[dateStr] || 0) / 60);
                const intensity = Math.min(minutes / maxMinutes, 1);
                
                const title = `${date.toLocaleDateString()}: ${minutes} minutes`;
                html += `<div class="heatmap-cell" style="opacity: ${0.1 + intensity * 0.9}" title="${title}"></div>`;
            }
            html += '</div>';
        }
        
        html += '</div></div>';
        
        container.innerHTML = html;
    }

    updateTopPracticed(sessions) {
        const container = document.getElementById('topPracticedList');
        if (!container) return;

        // Group by subject and calculate totals
        const subjectTotals = {};
        sessions.forEach(session => {
            const subject = session.item || 'Unknown';
            if (!subjectTotals[subject]) {
                subjectTotals[subject] = { time: 0, sessions: 0 };
            }
            subjectTotals[subject].time += session.duration;
            subjectTotals[subject].sessions += 1;
        });

        // Convert to array and sort by time
        const sortedSubjects = Object.entries(subjectTotals)
            .map(([subject, data]) => ({
                subject,
                time: data.time,
                sessions: data.sessions,
                avgSession: Math.floor(data.time / data.sessions)
            }))
            .sort((a, b) => b.time - a.time)
            .slice(0, 10);

        if (sortedSubjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🎯</span>
                    <p>Start practicing to see your most practiced subjects!</p>
                </div>
            `;
            return;
        }

        let html = '';
        sortedSubjects.forEach((item, index) => {
            const rank = index + 1;
            const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`;
            
            html += `
                <div class="top-practiced-item">
                    <div class="rank">${medal}</div>
                    <div class="subject-info">
                        <div class="subject-name">${item.subject}</div>
                        <div class="subject-stats">
                            ${item.sessions} sessions • Avg: ${this.formatTime(item.avgSession)}
                        </div>
                    </div>
                    <div class="total-time">${this.formatTime(item.time)}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Canvas Drawing Functions
    drawBarChart(ctx, canvas, data, options = {}) {
        const { labels, data: values } = data;
        const { title, color = this.colors.primary, yAxisLabel } = options;
        
        const padding = 60;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set styles
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#666666';
        ctx.font = '12px Segoe UI';
        
        // Draw title
        if (title) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 30);
        }
        
        // Calculate max value for scaling
        const maxValue = Math.max(...values, 1);
        const barWidth = chartWidth / labels.length * 0.8;
        const barSpacing = chartWidth / labels.length * 0.2;
        
        // Draw bars
        ctx.fillStyle = color;
        values.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + barSpacing);
            const y = canvas.height - padding - barHeight;
            
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw value on top of bar
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
            
            // Draw label
            ctx.fillText(labels[index], x + barWidth / 2, canvas.height - padding + 20);
            
            ctx.fillStyle = color;
        });
        
        // Draw axes
        ctx.strokeStyle = '#666666';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
    }

    drawPieChart(ctx, canvas, data, options = {}) {
        const { labels, data: values } = data;
        const { title } = options;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 3;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw title
        if (title) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(title, centerX, 30);
        }
        
        const total = values.reduce((sum, val) => sum + val, 0);
        if (total === 0) return;
        
        let currentAngle = -Math.PI / 2; // Start at top
        
        const colors = [
            this.colors.primary,
            this.colors.success, 
            this.colors.warning,
            this.colors.danger,
            this.colors.info,
            this.colors.secondary,
            '#E83E8C',
            '#6F42C1'
        ];
        
        values.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.fillStyle = colors[index % colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], labelX, labelY);
            ctx.fillText(`${Math.round(value)}m`, labelX, labelY + 12);
            
            currentAngle += sliceAngle;
        });
    }

    clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Utility Functions
    filterSessionsByTimeframe(sessions, timeframe) {
        const now = new Date();
        
        switch (timeframe) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return sessions.filter(s => new Date(s.date) >= weekAgo);
                
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return sessions.filter(s => new Date(s.date) >= monthAgo);
                
            default:
                return sessions;
        }
    }

    groupSessionsByDate(sessions) {
        const grouped = {};
        sessions.forEach(session => {
            const date = new Date(session.date).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
