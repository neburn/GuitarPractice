/**
 * Database Manager - IndexedDB implementation
 * Replaces Python SQLite functionality with IndexedDB
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'GuitarPracticeTracker';
        this.dbVersion = 1;
        this.db = null;
        this.isReady = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (e) => {
                this.db = e.target.result;
                this.createObjectStores();
            };
        });
    }

    createObjectStores() {
        // Songs store
        if (!this.db.objectStoreNames.contains('songs')) {
            const songsStore = this.db.createObjectStore('songs', {
                keyPath: 'id',
                autoIncrement: true
            });
            songsStore.createIndex('name', 'name', { unique: true });
            songsStore.createIndex('artist', 'artist');
            songsStore.createIndex('added_date', 'added_date');
        }

        // Exercises store
        if (!this.db.objectStoreNames.contains('exercises')) {
            const exercisesStore = this.db.createObjectStore('exercises', {
                keyPath: 'id',
                autoIncrement: true
            });
            exercisesStore.createIndex('name', 'name', { unique: true });
            exercisesStore.createIndex('added_date', 'added_date');
        }

        // Repertoire store
        if (!this.db.objectStoreNames.contains('repertoire')) {
            const repertoireStore = this.db.createObjectStore('repertoire', {
                keyPath: 'id',
                autoIncrement: true
            });
            repertoireStore.createIndex('name', 'name', { unique: true });
            repertoireStore.createIndex('added_date', 'added_date');
        }

        // Routines store
        if (!this.db.objectStoreNames.contains('routines')) {
            const routinesStore = this.db.createObjectStore('routines', {
                keyPath: 'id',
                autoIncrement: true
            });
            routinesStore.createIndex('name', 'name', { unique: true });
            routinesStore.createIndex('created_date', 'created_date');
        }

        // Practice sessions store
        if (!this.db.objectStoreNames.contains('sessions')) {
            const sessionsStore = this.db.createObjectStore('sessions', {
                keyPath: 'id',
                autoIncrement: true
            });
            sessionsStore.createIndex('date', 'date');
            sessionsStore.createIndex('item', 'item');
            sessionsStore.createIndex('type', 'type');
            sessionsStore.createIndex('duration', 'duration');
        }

        // Achievements store
        if (!this.db.objectStoreNames.contains('achievements')) {
            const achievementsStore = this.db.createObjectStore('achievements', {
                keyPath: 'id'
            });
            achievementsStore.createIndex('category', 'category');
        }

        // Settings store
        if (!this.db.objectStoreNames.contains('settings')) {
            this.db.createObjectStore('settings', {
                keyPath: 'key'
            });
        }

        console.log('Object stores created');
    }

    // Generic CRUD operations
    async add(storeName, data) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Add timestamp if not present
            if (!data.added_date && !data.created_date && !data.date) {
                data.added_date = new Date().toISOString();
            }
            
            const request = store.add(data);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getAll(storeName, indexName = null, key = null) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (indexName && key) {
                const index = store.index(indexName);
                request = index.getAll(key);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async get(storeName, id) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async update(storeName, data) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async delete(storeName, id) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async find(storeName, indexName, value) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Specific methods for each entity type
    async addSong(songData) {
        try {
            // Check if song already exists
            const existing = await this.find('songs', 'name', songData.name);
            if (existing) {
                throw new Error('Song already exists');
            }
            
            const song = {
                name: songData.name,
                artist: songData.artist || '',
                tags: songData.tags || [],
                practice_notes: songData.practice_notes || '',
                book: songData.book || '',
                page: songData.page || '',
                link: songData.link || '',
                practice_count: 0,
                added_date: new Date().toISOString()
            };
            
            return await this.add('songs', song);
        } catch (error) {
            console.error('Error adding song:', error);
            throw error;
        }
    }

    async addExercise(exerciseData) {
        try {
            const existing = await this.find('exercises', 'name', exerciseData.name);
            if (existing) {
                throw new Error('Exercise already exists');
            }
            
            const exercise = {
                name: exerciseData.name,
                tags: exerciseData.tags || [],
                practice_notes: exerciseData.practice_notes || '',
                book: exerciseData.book || '',
                page: exerciseData.page || '',
                link: exerciseData.link || '',
                practice_count: 0,
                added_date: new Date().toISOString()
            };
            
            return await this.add('exercises', exercise);
        } catch (error) {
            console.error('Error adding exercise:', error);
            throw error;
        }
    }

    async addRepertoire(repertoireData) {
        try {
            const existing = await this.find('repertoire', 'name', repertoireData.name);
            if (existing) {
                throw new Error('Repertoire item already exists');
            }
            
            const repertoire = {
                name: repertoireData.name,
                tags: repertoireData.tags || [],
                practice_notes: repertoireData.practice_notes || '',
                book: repertoireData.book || '',
                page: repertoireData.page || '',
                link: repertoireData.link || '',
                practice_count: 0,
                added_date: new Date().toISOString()
            };
            
            return await this.add('repertoire', repertoire);
        } catch (error) {
            console.error('Error adding repertoire:', error);
            throw error;
        }
    }

    async addRoutine(routineData) {
        try {
            const existing = await this.find('routines', 'name', routineData.name);
            if (existing) {
                throw new Error('Routine already exists');
            }
            
            const routine = {
                name: routineData.name,
                items: routineData.items || [],
                created_date: new Date().toISOString()
            };
            
            return await this.add('routines', routine);
        } catch (error) {
            console.error('Error adding routine:', error);
            throw error;
        }
    }

    async addPracticeSession(sessionData) {
        try {
            // Determine session type from item name
            let type = 'other';
            if (sessionData.item.startsWith('Song:')) type = 'song';
            else if (sessionData.item.startsWith('Exercise:')) type = 'exercise';
            else if (sessionData.item.startsWith('Repertoire:')) type = 'repertoire';
            else if (sessionData.item.startsWith('Routine:')) type = 'routine';
            
            const session = {
                item: sessionData.item,
                duration: sessionData.duration,
                date: sessionData.date || new Date().toISOString(),
                type: type,
                notes: sessionData.notes || ''
            };
            
            const result = await this.add('sessions', session);
            
            // Update practice count for the item
            await this.updatePracticeCount(sessionData.item);
            
            return result;
        } catch (error) {
            console.error('Error adding practice session:', error);
            throw error;
        }
    }

    async updatePracticeCount(itemDisplayName) {
        try {
            let storeName, itemName;
            
            if (itemDisplayName.startsWith('Song: ')) {
                storeName = 'songs';
                itemName = itemDisplayName.substring(6);
            } else if (itemDisplayName.startsWith('Exercise: ')) {
                storeName = 'exercises';
                itemName = itemDisplayName.substring(10);
            } else if (itemDisplayName.startsWith('Repertoire: ')) {
                storeName = 'repertoire';
                itemName = itemDisplayName.substring(12);
            } else {
                return; // No practice count for routines or other items
            }
            
            const item = await this.find(storeName, 'name', itemName);
            if (item) {
                item.practice_count = (item.practice_count || 0) + 1;
                await this.update(storeName, item);
            }
        } catch (error) {
            console.error('Error updating practice count:', error);
        }
    }

    // Settings management
    async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.get('settings', key);
            return setting ? setting.value : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    async setSetting(key, value) {
        try {
            return await this.update('settings', { key, value });
        } catch (error) {
            console.error('Error setting:', error);
            throw error;
        }
    }

    // Data export
    async exportAllData() {
        try {
            const data = {
                songs: await this.getAll('songs'),
                exercises: await this.getAll('exercises'),
                repertoire: await this.getAll('repertoire'),
                routines: await this.getAll('routines'),
                sessions: await this.getAll('sessions'),
                settings: await this.getAll('settings'),
                exported_date: new Date().toISOString()
            };
            
            return data;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    // Data import
    async importData(data) {
        try {
            const transaction = this.db.transaction([
                'songs', 'exercises', 'repertoire', 'routines', 'sessions', 'settings'
            ], 'readwrite');
            
            // Clear existing data
            const stores = ['songs', 'exercises', 'repertoire', 'routines', 'sessions'];
            for (const storeName of stores) {
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => resolve();
                    clearRequest.onerror = () => reject(clearRequest.error);
                });
            }
            
            // Import new data
            for (const storeName of stores) {
                if (data[storeName] && Array.isArray(data[storeName])) {
                    const store = transaction.objectStore(storeName);
                    for (const item of data[storeName]) {
                        delete item.id; // Remove ID to let IndexedDB auto-generate
                        await new Promise((resolve, reject) => {
                            const addRequest = store.add(item);
                            addRequest.onsuccess = () => resolve();
                            addRequest.onerror = () => reject(addRequest.error);
                        });
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    // Clear all data
    async clearAllData() {
        try {
            const stores = ['songs', 'exercises', 'repertoire', 'routines', 'sessions', 'achievements'];
            
            for (const storeName of stores) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => resolve();
                    clearRequest.onerror = () => reject(clearRequest.error);
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    // Search functionality
    async searchItems(storeName, searchTerm) {
        try {
            const allItems = await this.getAll(storeName);
            const searchLower = searchTerm.toLowerCase();
            
            return allItems.filter(item => {
                return item.name.toLowerCase().includes(searchLower) ||
                       (item.artist && item.artist.toLowerCase().includes(searchLower)) ||
                       (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)));
            });
        } catch (error) {
            console.error('Error searching items:', error);
            return [];
        }
    }

    // Analytics queries
    async getPracticeStatistics(timeframe = 'all') {
        try {
            const sessions = await this.getAll('sessions');
            
            // Filter by timeframe
            const now = new Date();
            let filteredSessions = sessions;
            
            if (timeframe === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredSessions = sessions.filter(s => new Date(s.date) >= weekAgo);
            } else if (timeframe === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredSessions = sessions.filter(s => new Date(s.date) >= monthAgo);
            }
            
            if (filteredSessions.length === 0) {
                return {
                    totalTime: 0,
                    totalSessions: 0,
                    averageSession: 0,
                    longestSession: 0,
                    practiceByType: {},
                    practiceByItem: {}
                };
            }
            
            const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
            const totalSessions = filteredSessions.length;
            const averageSession = Math.floor(totalTime / totalSessions);
            const longestSession = Math.max(...filteredSessions.map(s => s.duration));
            
            // Group by type
            const practiceByType = {};
            filteredSessions.forEach(session => {
                const type = session.type || 'other';
                practiceByType[type] = (practiceByType[type] || 0) + session.duration;
            });
            
            // Group by item
            const practiceByItem = {};
            filteredSessions.forEach(session => {
                practiceByItem[session.item] = (practiceByItem[session.item] || 0) + session.duration;
            });
            
            return {
                totalTime,
                totalSessions,
                averageSession,
                longestSession,
                practiceByType,
                practiceByItem
            };
        } catch (error) {
            console.error('Error getting practice statistics:', error);
            return null;
        }
    }

    async getStreakData() {
        try {
            const sessions = await this.getAll('sessions');
            
            // Group sessions by date
            const sessionsByDate = {};
            sessions.forEach(session => {
                const date = new Date(session.date).toDateString();
                if (!sessionsByDate[date]) {
                    sessionsByDate[date] = [];
                }
                sessionsByDate[date].push(session);
            });
            
            const practiceDates = Object.keys(sessionsByDate).sort();
            
            // Calculate current streak
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;
            
            const today = new Date().toDateString();
            let checkDate = new Date();
            
            // Check current streak (working backwards from today)
            while (true) {
                const dateStr = checkDate.toDateString();
                if (sessionsByDate[dateStr]) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
            
            // Calculate longest streak
            if (practiceDates.length > 0) {
                tempStreak = 1;
                longestStreak = 1;
                
                for (let i = 1; i < practiceDates.length; i++) {
                    const prevDate = new Date(practiceDates[i - 1]);
                    const currDate = new Date(practiceDates[i]);
                    const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                    
                    if (dayDiff === 1) {
                        tempStreak++;
                        longestStreak = Math.max(longestStreak, tempStreak);
                    } else {
                        tempStreak = 1;
                    }
                }
            }
            
            return { currentStreak, longestStreak };
        } catch (error) {
            console.error('Error getting streak data:', error);
            return { currentStreak: 0, longestStreak: 0 };
        }
    }
}

// Create global instance
window.DatabaseManager = new DatabaseManager();
