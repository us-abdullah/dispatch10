class CallQueueManager {
    constructor() {
        this.activeCalls = [];
        this.completedCalls = [];
        this.callIdCounter = 1;
        this.timers = new Map(); // Store active timers
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadFromStorage();
        this.forceRefresh();
    }

    forceRefresh() {
        // Force refresh every 2 seconds to catch any missed updates
        setInterval(() => {
            this.loadFromStorage();
        }, 2000);
    }

    initializeElements() {
        this.activeCallsQueue = document.getElementById('activeCallsQueue');
        this.callHistory = document.getElementById('callHistory');
        this.backBtn = document.getElementById('backBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
    }

    setupEventListeners() {
        this.backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        this.refreshBtn.addEventListener('click', () => {
            this.loadFromStorage();
            this.showNotification('Data refreshed', 1000);
        });

        // Listen for messages from main page
        window.addEventListener('message', (event) => {
            console.log('Received message:', event.data);
            if (event.data.type === 'newCall') {
                this.addActiveCall(event.data.data);
            } else if (event.data.type === 'callCompleted') {
                this.addCompletedCall(event.data.data);
            } else if (event.data.type === 'updateCall') {
                this.updateActiveCall(event.data.data.callId, event.data.data.callData);
            } else if (event.data.type === 'routeCall') {
                this.routeCall(event.data.callId);
            } else if (event.data.type === 'clearAllData') {
                this.clearAllData();
            }
        });

        // Also listen for storage changes (for when main page updates localStorage)
        window.addEventListener('storage', (event) => {
            if (event.key === 'dispatchAI_activeCalls' || event.key === 'dispatchAI_completedCalls') {
                this.loadFromStorage();
            }
        });
    }

    addActiveCall(callData) {
        console.log('Adding active call:', callData);
        
        const call = {
            id: callData.callId || this.callIdCounter++,
            callerId: callData.callerId || this.generateCallerId(),
            urgentBrief: callData.urgentBrief || 'No brief available',
            priority: callData.priority || 'Low',
            category: callData.category || 'Police',
            startTime: new Date(callData.startTime),
            status: 'In Progress',
            transcript: callData.transcript || '',
            classification: callData.classification || {},
            routing: callData.routing || []
        };

        // Check if call already exists
        const existingIndex = this.activeCalls.findIndex(c => c.id === call.id);
        if (existingIndex !== -1) {
            this.activeCalls[existingIndex] = call;
            console.log('Updated existing call');
        } else {
            this.activeCalls.push(call);
            this.startTimer(call.id);
            console.log('Added new call to queue');
        }
        
        this.renderActiveCalls();
        this.saveToStorage();
    }

    addCompletedCall(callData) {
        const call = {
            id: callData.callId || this.callIdCounter++,
            callerId: callData.callerId || this.generateCallerId(),
            urgentBrief: callData.urgentBrief || 'No brief available',
            priority: callData.priority || 'Low',
            category: callData.category || 'Police',
            startTime: new Date(callData.startTime),
            endTime: new Date(callData.endTime),
            status: 'Completed',
            transcript: callData.transcript || '',
            classification: callData.classification || {},
            routing: callData.routing || [],
            dispatchTime: callData.dispatchTime || 0,
            outcome: callData.outcome || 'Resolved'
        };

        this.completedCalls.unshift(call);
        this.renderCallHistory();
        this.saveToStorage();
    }

    updateActiveCall(callId, callData) {
        const call = this.activeCalls.find(c => c.id === callId);
        if (call) {
            call.urgentBrief = callData.urgentBrief || call.urgentBrief;
            call.priority = callData.priority || call.priority;
            call.category = callData.category || call.category;
            call.transcript = callData.transcript || call.transcript;
            call.classification = callData.classification || call.classification;
            call.routing = callData.routing || call.routing;
            
            this.renderActiveCalls();
            this.saveToStorage();
        }
    }

    routeCall(callId) {
        const callIndex = this.activeCalls.findIndex(c => c.id === callId);
        if (callIndex !== -1) {
            const call = this.activeCalls[callIndex];
            call.status = 'Completed';
            call.endTime = new Date();
            call.dispatchTime = this.getDispatchTime(callId);
            
            // Move to completed calls
            this.completedCalls.unshift(call); // Add to beginning
            this.activeCalls.splice(callIndex, 1);
            
            // Stop timer
            this.stopTimer(callId);
            
            this.renderActiveCalls();
            this.renderCallHistory();
            this.saveToStorage();
        }
    }

    generateCallerId() {
        const prefixes = ['CALL', 'EMRG', 'DISP', 'URGT'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `${prefix}-${number}`;
    }

    startTimer(callId) {
        const call = this.activeCalls.find(c => c.id === callId);
        if (call) {
            const timer = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now - call.startTime) / 1000);
                call.elapsedTime = elapsed;
                this.renderActiveCalls();
            }, 1000);
            
            this.timers.set(callId, timer);
        }
    }

    stopTimer(callId) {
        const timer = this.timers.get(callId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(callId);
        }
    }

    getDispatchTime(callId) {
        const call = this.activeCalls.find(c => c.id === callId) || 
                   this.completedCalls.find(c => c.id === callId);
        if (call) {
            if (call.dispatchTime) {
                return call.dispatchTime;
            }
            const endTime = call.endTime || new Date();
            return Math.floor((endTime - call.startTime) / 1000);
        }
        return 0;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    getPriorityClass(priority) {
        switch (priority.toLowerCase()) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return 'priority-low';
        }
    }

    getStatusClass(status) {
        switch (status) {
            case 'In Progress': return 'status-in-progress';
            case 'Completed': return 'status-completed';
            default: return 'status-in-progress';
        }
    }

    getOutcomeTag(call) {
        if (call.exported) return { class: 'outcome-exported', text: 'Exported Pack' };
        if (call.escalated) return { class: 'outcome-escalated', text: 'Escalated' };
        return { class: 'outcome-resolved', text: 'Resolved' };
    }

    renderActiveCalls() {
        if (this.activeCalls.length === 0) {
            this.activeCallsQueue.innerHTML = '<div class="empty-state">No active calls</div>';
            return;
        }

        // Sort by priority (High -> Medium -> Low)
        const sortedCalls = [...this.activeCalls].sort((a, b) => {
            const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        this.activeCallsQueue.innerHTML = sortedCalls.map(call => `
            <div class="call-item ${call.priority.toLowerCase()}-priority" onclick="this.showCallDetails(${call.id})">
                <div class="call-header">
                    <div class="caller-id">${call.callerId}</div>
                    <div class="priority-badge ${this.getPriorityClass(call.priority)}">${call.priority}</div>
                    <div class="status-badge ${this.getStatusClass(call.status)}">${call.status}</div>
                </div>
                <div class="urgent-brief">${call.urgentBrief}</div>
                <div class="dispatch-time ${call.status === 'In Progress' ? 'timer-live' : ''}">
                    Dispatch Time: ${this.formatTime(call.elapsedTime || 0)}
                </div>
                <div class="call-details">
                    Category: ${call.category} | Started: ${call.startTime.toLocaleTimeString()}
                </div>
            </div>
        `).join('');
    }

    renderCallHistory() {
        if (this.completedCalls.length === 0) {
            this.callHistory.innerHTML = '<div class="empty-state">No completed calls</div>';
            return;
        }

        this.callHistory.innerHTML = this.completedCalls.map(call => {
            const outcome = this.getOutcomeTag(call);
            return `
                <div class="call-item" onclick="this.showCallDetails(${call.id})">
                    <div class="call-header">
                        <div class="caller-id">${call.callerId}</div>
                        <div class="priority-badge ${this.getPriorityClass(call.priority)}">${call.priority}</div>
                        <div class="status-badge ${this.getStatusClass(call.status)}">${call.status}</div>
                    </div>
                    <div class="urgent-brief">${call.urgentBrief}</div>
                    <div class="dispatch-time">
                        Dispatch Time: ${this.formatTime(call.dispatchTime || 0)}
                    </div>
                    <div class="call-details">
                        Category: ${call.category} | Completed: ${call.endTime.toLocaleTimeString()}
                    </div>
                    <div class="outcome-tag ${outcome.class}">${outcome.text}</div>
                </div>
            `;
        }).join('');
    }

    showCallDetails(callId) {
        const call = this.activeCalls.find(c => c.id === callId) || 
                    this.completedCalls.find(c => c.id === callId);
        
        if (call) {
            const details = `
                <div class="call-summary">
                    <div class="summary-title">Call Details - ${call.callerId}</div>
                    <div class="summary-details">
                        <strong>Priority:</strong> ${call.priority}<br>
                        <strong>Category:</strong> ${call.category}<br>
                        <strong>Status:</strong> ${call.status}<br>
                        <strong>Start Time:</strong> ${call.startTime.toLocaleString()}<br>
                        ${call.endTime ? `<strong>End Time:</strong> ${call.endTime.toLocaleString()}<br>` : ''}
                        <strong>Dispatch Time:</strong> ${this.formatTime(call.dispatchTime || call.elapsedTime || 0)}<br><br>
                        <strong>Urgent Brief:</strong><br>
                        ${call.urgentBrief}<br><br>
                        <strong>Transcript:</strong><br>
                        ${call.transcript || 'No transcript available'}<br><br>
                        <strong>Classification:</strong><br>
                        ${JSON.stringify(call.classification, null, 2)}<br><br>
                        <strong>Routing Suggestions:</strong><br>
                        ${call.routing.map(r => `• ${r}`).join('<br>')}
                    </div>
                </div>
            `;
            
            // Create modal or show in a dedicated area
            this.showModal('Call Details', details);
        }
    }

    showModal(title, content) {
        // Simple modal implementation
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="background: #1a1a1a; padding: 2rem; border-radius: 8px; max-width: 80%; max-height: 80%; overflow-y: auto;">
                <h3 style="color: #ff4444; margin-bottom: 1rem;">${title}</h3>
                <div style="color: #ccc; line-height: 1.6;">${content}</div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #ff4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    clearAllData() {
        // Clear all active calls
        this.activeCalls = [];
        
        // Clear all completed calls
        this.completedCalls = [];
        
        // Clear all timers
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.clear();
        
        // Clear localStorage
        localStorage.removeItem('dispatchAI_activeCalls');
        localStorage.removeItem('dispatchAI_completedCalls');
        
        // Re-render empty state
        this.renderActiveCalls();
        this.renderCallHistory();
        
        this.showNotification('Call queue and history cleared', 2000);
        console.log('All call queue data cleared');
    }

    showNotification(message, duration = 2000) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #0066cc;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1000;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    saveToStorage() {
        localStorage.setItem('dispatchAI_activeCalls', JSON.stringify(this.activeCalls));
        localStorage.setItem('dispatchAI_completedCalls', JSON.stringify(this.completedCalls));
    }

    loadFromStorage() {
        try {
            const activeCalls = localStorage.getItem('dispatchAI_activeCalls');
            const completedCalls = localStorage.getItem('dispatchAI_completedCalls');
            
            console.log('Loading from storage - Active calls:', activeCalls);
            console.log('Loading from storage - Completed calls:', completedCalls);
            
            if (activeCalls) {
                this.activeCalls = JSON.parse(activeCalls).map(call => {
                    call.startTime = new Date(call.startTime);
                    if (call.endTime) call.endTime = new Date(call.endTime);
                    return call;
                });
                
                // Restart timers for active calls
                this.activeCalls.forEach(call => {
                    if (call.status === 'In Progress') {
                        this.startTimer(call.id);
                    }
                });
            }
            
            if (completedCalls) {
                this.completedCalls = JSON.parse(completedCalls).map(call => {
                    call.startTime = new Date(call.startTime);
                    if (call.endTime) call.endTime = new Date(call.endTime);
                    return call;
                });
            }
            
            console.log('Active calls after load:', this.activeCalls);
            console.log('Completed calls after load:', this.completedCalls);
            
            this.renderActiveCalls();
            this.renderCallHistory();
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.callQueueManager = new CallQueueManager();
});
