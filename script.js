// DispatchAI Copilot - Main Application Logic
class DispatchAI {
    constructor() {
        this.isRecording = false;
        this.recognition = null;
        this.transcript = [];
        this.currentIncident = null;
        this.ollama = new OllamaIntegration();
        this.retentionTimer = null;
        this.aiProcessingTimer = null;
        this.lastProcessedLength = 0;
        this.dispatchStartTime = null;
        this.dispatchTimerInterval = null;
        this.currentCallId = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.loadSettings();
        this.updateAIStatus();
    }

    initializeElements() {
        // Buttons
        this.startCallBtn = document.getElementById('startCallBtn');
        this.stopCallBtn = document.getElementById('stopCallBtn');
        this.clearTranscriptBtn = document.getElementById('clearTranscriptBtn');
        this.exportTranscriptBtn = document.getElementById('exportTranscriptBtn');
        this.exportIncidentBtn = document.getElementById('exportIncidentBtn');
        this.clearAllDataBtn = document.getElementById('clearAllDataBtn');
        this.routingBtn = document.getElementById('routingBtn');
        this.routeBtn = document.getElementById('routeBtn');

        // Notification elements
        this.notificationToast = document.getElementById('notificationToast');
        this.notificationText = document.getElementById('notificationText');
        this.notificationClose = document.getElementById('notificationClose');

        // AI status elements
        this.aiStatus = document.getElementById('aiStatus');
        this.aiIndicator = document.getElementById('aiIndicator');
        this.aiStatusText = document.getElementById('aiStatusText');
        this.aiProcessingIndicator = document.getElementById('aiProcessingIndicator');

        // Data source elements
        this.dataSource = document.getElementById('dataSource');
        this.nenaCode = document.getElementById('nenaCode');

        // Dispatch timer elements
        this.dispatchTimer = document.getElementById('dispatchTimer');
        this.timerValue = document.getElementById('timerValue');

        // Status elements
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');

        // Transcript elements
        this.transcriptContainer = document.getElementById('transcriptContainer');

        // AI Summary elements
        this.urgentBriefContent = document.getElementById('urgentBriefContent');
        this.priorityBadge = document.getElementById('priorityBadge');
        this.summaryGrid = document.getElementById('summaryGrid');

        // Classification elements
        this.policeBadge = document.getElementById('policeBadge');
        this.fireBadge = document.getElementById('fireBadge');
        this.medicalBadge = document.getElementById('medicalBadge');
        this.priorityLevel = document.getElementById('priorityLevel');
        this.confidenceFill = document.getElementById('confidenceFill');
        this.confidenceText = document.getElementById('confidenceText');

        // Other elements
        this.questionsList = document.getElementById('questionsList');
        this.routingContent = document.getElementById('routingContent');
        this.radioModal = document.getElementById('radioModal');
        this.radioInput = document.getElementById('radioInput');
        this.radioLog = document.getElementById('radioLog');

        // Privacy controls
        this.humanConfirmationToggle = document.getElementById('humanConfirmationToggle');
        this.dataRetentionSelect = document.getElementById('dataRetentionSelect');
    }

    setupEventListeners() {
        // Call controls
        this.startCallBtn.addEventListener('click', () => this.startCall());
        this.stopCallBtn.addEventListener('click', () => this.stopCall());
        this.clearTranscriptBtn.addEventListener('click', () => this.clearTranscript());
        this.exportTranscriptBtn.addEventListener('click', () => this.exportTranscript());
        this.exportIncidentBtn.addEventListener('click', () => this.exportIncident());

        // Privacy controls
        this.clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        this.dataRetentionSelect.addEventListener('change', () => this.updateRetentionTimer());

        // Routing and dispatch
        this.routingBtn.addEventListener('click', () => this.openRoutingPage());
        this.routeBtn.addEventListener('click', () => this.routeCall());



        // Notification close
        this.notificationClose.addEventListener('click', () => this.hideNotification());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                if (this.isRecording) this.stopCall();
                else this.startCall();
            }
        });
    }

    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateStatus('Recording', 'recording');
            this.startCallBtn.disabled = true;
            this.stopCallBtn.disabled = false;
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                this.addTranscriptEntry(finalTranscript, true);
                this.processTranscript(finalTranscript);
            }

            if (interimTranscript) {
                this.addTranscriptEntry(interimTranscript, false);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showError(`Speech recognition error: ${event.error}`);
        };

        this.recognition.onend = () => {
            if (this.isRecording) {
                // Restart recognition if still recording
                setTimeout(() => {
                    if (this.isRecording) {
                        this.recognition.start();
                    }
                }, 100);
            }
        };
    }

    startCall() {
        if (!this.recognition) {
            this.showError('Speech recognition not available');
            return;
        }

        try {
            this.recognition.start();
            this.startRetentionTimer();
            this.startDispatchTimer();
            this.createNewCall();
            this.showNotification('Call started - listening for audio', 2000);
        } catch (error) {
            this.showError('Failed to start speech recognition');
            console.error(error);
        }
    }

    stopCall() {
        this.isRecording = false;
        this.recognition.stop();
        this.stopDispatchTimer();
        this.completeCurrentCall();
        this.updateStatus('Ready', 'ready');
        this.startCallBtn.disabled = false;
        this.stopCallBtn.disabled = true;
        this.exportIncidentBtn.disabled = false;
        this.showNotification('Call ended - incident data ready for export', 2000);
    }

    addTranscriptEntry(text, isFinal = false) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = {
            text: text.trim(),
            timestamp,
            isFinal
        };

        if (isFinal) {
            this.transcript.push(entry);
            // Process transcript for AI analysis when we have new final text
            this.processTranscriptForAI();
        }

        this.displayTranscript();
    }

    displayTranscript() {
        const container = this.transcriptContainer;
        container.innerHTML = '';

        if (this.transcript.length === 0) {
            container.innerHTML = '<div class="transcript-placeholder"><p>Press "Start Call" to begin transcription...</p></div>';
            return;
        }

        this.transcript.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'transcript-entry';
            entryDiv.innerHTML = `
                <div class="transcript-timestamp">${entry.timestamp}</div>
                <div class="transcript-text">${entry.text}</div>
            `;
            container.appendChild(entryDiv);
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async processTranscriptForAI() {
        // Clear any existing timer
        if (this.aiProcessingTimer) {
            clearTimeout(this.aiProcessingTimer);
        }
        
        // Throttle AI processing to avoid too many calls
        this.aiProcessingTimer = setTimeout(async () => {
            try {
                // Get full transcript for analysis
                const fullTranscript = this.transcript.map(entry => entry.text).join(' ');
                
                // Only process if we have meaningful content and it's changed significantly
                if (fullTranscript.trim().length < 20 || fullTranscript.length - this.lastProcessedLength < 30) {
                    return;
                }
                
                this.lastProcessedLength = fullTranscript.length;
                
                // Show AI processing indicator
                this.showNotification('AI analyzing live transcript...', 1500);
                this.showAIProcessing(true);
                
                // Generate AI analysis
                const analysis = await this.analyzeWithAI(fullTranscript);
                
                if (analysis) {
                    // Update UI with analysis
                    this.updateUrgentBrief(analysis.urgentBrief);
                    this.updateSummary(analysis.summary);
                    this.updateQuestions(analysis.questions);
                    this.updateClassification(analysis.classification);
                    this.updateRouting(analysis.routing);
                    
                    // Show completion notification
                    const aiType = this.ollama.isAvailable ? 'Ollama AI' : 'Mock AI';
                    this.showNotification(`Live analysis updated (${aiType})`, 1000);
                }
                
                // Hide processing indicator
                this.showAIProcessing(false);
            } catch (error) {
                console.error('Error processing transcript for AI:', error);
                this.showAIProcessing(false);
            }
        }, 2000); // Wait 2 seconds after last transcript update
    }

    async processTranscript(text) {
        try {
            // Get full transcript for analysis
            const fullTranscript = this.transcript.map(entry => entry.text).join(' ');
            
            // Show AI processing indicator
            this.showNotification('AI analyzing incident...', 2000);
            this.showAIProcessing(true);
            
            // Generate AI analysis
            const analysis = await this.analyzeWithAI(fullTranscript);
            
            // Update UI with analysis
            this.updateUrgentBrief(analysis.urgentBrief);
            this.updateSummary(analysis.summary);
            this.updateQuestions(analysis.questions);
            this.updateClassification(analysis.classification);
            this.updateRouting(analysis.routing);
            
            // Update current call with new data
            this.updateCurrentCall(analysis);
            
            // Show completion notification
            const aiType = this.ollama.isAvailable ? 'Ollama AI' : 'Mock AI';
            this.showNotification(`Analysis complete (${aiType})`, 1500);
            
            // Hide processing indicator
            this.showAIProcessing(false);
        } catch (error) {
            console.error('Error processing transcript:', error);
            this.showNotification('Analysis failed - using fallback', 3000);
            this.showAIProcessing(false);
        }
    }

    async analyzeWithAI(transcript) {
        try {
            console.log('Starting AI analysis for transcript:', transcript.substring(0, 100) + '...');
            
            // Use Ollama integration for AI analysis
            const analysis = await this.ollama.analyzeIncident(transcript);
            
            if (analysis) {
                console.log('AI analysis completed:', analysis);
                return analysis;
            } else {
                console.log('AI analysis returned null, using mock analysis');
                return this.mockAIAnalysis(transcript);
            }
        } catch (error) {
            console.error('AI analysis error:', error);
            return this.mockAIAnalysis(transcript);
        }
    }

    mockAIAnalysis(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        // Determine incident type and priority
        let category = 'Police';
        let priority = 'Low';
        let confidence = 60;

        if (lowerTranscript.includes('fire') || lowerTranscript.includes('smoke') || lowerTranscript.includes('burning')) {
            category = 'Fire';
            priority = 'High';
            confidence = 85;
        } else if (lowerTranscript.includes('medical') || lowerTranscript.includes('ambulance') || lowerTranscript.includes('hurt') || lowerTranscript.includes('injured')) {
            category = 'Medical';
            priority = 'High';
            confidence = 80;
        } else if (lowerTranscript.includes('robbery') || lowerTranscript.includes('armed') || lowerTranscript.includes('gun') || lowerTranscript.includes('weapon')) {
            category = 'Police';
            priority = 'High';
            confidence = 90;
        } else if (lowerTranscript.includes('theft') || lowerTranscript.includes('stolen') || lowerTranscript.includes('break-in')) {
            category = 'Police';
            priority = 'Medium';
            confidence = 75;
        }

        // Generate urgent brief
        let urgentBrief = 'No active incident detected';
        if (priority === 'High') {
            if (category === 'Fire') {
                urgentBrief = '[HIGH] Fire emergency - immediate response required';
            } else if (category === 'Medical') {
                urgentBrief = '[HIGH] Medical emergency - EMS dispatch needed';
            } else if (category === 'Police') {
                urgentBrief = '[HIGH] Police emergency - armed incident reported';
            }
        } else if (priority === 'Medium') {
            urgentBrief = `[MEDIUM] ${category} incident - standard response`;
        }

        // Generate summary
        const summary = this.extractSummary(transcript);

        // Generate questions
        const questions = this.generateQuestions(category, priority, transcript);

        // Generate routing
        const routing = this.generateRouting(category, priority);

        return {
            urgentBrief,
            summary,
            questions,
            classification: { category, priority, confidence },
            routing
        };
    }

    extractSummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        return {
            who: this.extractWho(lowerTranscript),
            what: this.extractWhat(lowerTranscript),
            where: this.extractWhere(lowerTranscript),
            when: new Date().toLocaleString(),
            injuries: this.extractInjuries(lowerTranscript),
            suspects: this.extractSuspects(lowerTranscript)
        };
    }

    extractWho(transcript) {
        if (transcript.includes('caller') || transcript.includes('i am')) return 'Caller reporting';
        if (transcript.includes('witness')) return 'Witness reporting';
        return 'Unknown caller';
    }

    extractWhat(transcript) {
        if (transcript.includes('fire')) return 'Fire emergency';
        if (transcript.includes('robbery')) return 'Armed robbery';
        if (transcript.includes('theft')) return 'Theft incident';
        if (transcript.includes('medical')) return 'Medical emergency';
        if (transcript.includes('accident')) return 'Traffic accident';
        return 'Incident reported';
    }

    extractWhere(transcript) {
        // Simple location extraction - in production, use NLP
        const locationPatterns = [
            /at (\d+ [^,]+)/i,
            /on ([^,]+ street)/i,
            /near ([^,]+)/i,
            /(\d+ [^,]+ avenue)/i
        ];

        for (const pattern of locationPatterns) {
            const match = transcript.match(pattern);
            if (match) return match[1];
        }

        return 'Location to be determined';
    }

    extractInjuries(transcript) {
        if (transcript.includes('injured') || transcript.includes('hurt')) return 'Injuries reported';
        if (transcript.includes('no injuries') || transcript.includes('no one hurt')) return 'No injuries';
        return 'Injury status unknown';
    }

    extractSuspects(transcript) {
        if (transcript.includes('suspect') || transcript.includes('perpetrator')) {
            if (transcript.includes('armed')) return 'Armed suspect(s)';
            return 'Suspect(s) reported';
        }
        return 'No suspects identified';
    }

    generateQuestions(category, priority, transcript) {
        const questions = [];
        
        if (category === 'Police') {
            questions.push('Are the suspects armed?');
            questions.push('What direction are they heading?');
            questions.push('Can you describe the suspects?');
        } else if (category === 'Fire') {
            questions.push('Is anyone trapped inside?');
            questions.push('What is burning?');
            questions.push('Is the fire spreading?');
        } else if (category === 'Medical') {
            questions.push('Is the person conscious?');
            questions.push('Are they breathing?');
            questions.push('What are the symptoms?');
        }

        return questions.slice(0, 3);
    }

    generateRouting(category, priority) {
        const routing = [];
        
        if (category === 'Police') {
            routing.push('Police Patrol');
            if (priority === 'High') routing.push('SWAT Team');
        } else if (category === 'Fire') {
            routing.push('Fire Engine');
            routing.push('Ambulance');
            if (priority === 'High') routing.push('Fire Chief');
        } else if (category === 'Medical') {
            routing.push('EMS');
            routing.push('Ambulance');
        }

        return routing;
    }

    updateUrgentBrief(brief) {
        this.urgentBriefContent.textContent = brief;
    }

    updateSummary(summary) {
        document.getElementById('summaryWho').textContent = summary.who;
        document.getElementById('summaryWhat').textContent = summary.what;
        document.getElementById('summaryWhere').textContent = summary.where;
        document.getElementById('summaryWhen').textContent = summary.when;
        document.getElementById('summaryInjuries').textContent = summary.injuries;
        document.getElementById('summarySuspects').textContent = summary.suspects;
    }

    updateQuestions(questions) {
        this.questionsList.innerHTML = '';
        
        if (questions.length === 0) {
            this.questionsList.innerHTML = '<p class="no-questions">No questions available</p>';
            return;
        }

        questions.forEach(question => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.textContent = question;
            questionDiv.addEventListener('click', () => this.askQuestion(question));
            this.questionsList.appendChild(questionDiv);
        });
    }

    updateClassification(classification) {
        // Update category badges
        [this.policeBadge, this.fireBadge, this.medicalBadge].forEach(badge => {
            badge.classList.remove('active');
        });

        if (classification.category === 'Police') this.policeBadge.classList.add('active');
        else if (classification.category === 'Fire') this.fireBadge.classList.add('active');
        else if (classification.category === 'Medical') this.medicalBadge.classList.add('active');

        // Update priority
        this.priorityLevel.textContent = classification.priority;
        this.priorityBadge.textContent = classification.priority;
        this.priorityBadge.className = `priority-badge ${classification.priority.toLowerCase()}`;

        // Update confidence
        this.confidenceFill.style.width = `${classification.confidence}%`;
        this.confidenceText.textContent = `${classification.confidence}%`;

        // Update data source and NENA code
        if (classification.dataSource) {
            this.dataSource.textContent = classification.dataSource;
        }
        if (classification.nenaCode) {
            this.nenaCode.textContent = classification.nenaCode;
        }

        // Enable route button when we have classification
        this.routeBtn.disabled = false;
    }

    updateRouting(routing) {
        this.routingContent.innerHTML = '';
        
        if (routing.length === 0) {
            this.routingContent.innerHTML = '<p>No routing suggestions available</p>';
            return;
        }

        routing.forEach(unit => {
            const unitDiv = document.createElement('div');
            unitDiv.className = 'routing-unit';
            unitDiv.textContent = unit;
            this.routingContent.appendChild(unitDiv);
        });
    }

    askQuestion(question) {
        // In a real implementation, this would send the question to the dispatcher
        console.log('Suggested question:', question);
        this.showNotification(`Question suggested: "${question}"`);
    }

    clearTranscript() {
        this.transcript = [];
        this.displayTranscript();
        this.resetUI();
    }

    resetUI() {
        this.urgentBriefContent.textContent = 'No active incident detected';
        this.priorityBadge.textContent = 'LOW';
        this.priorityBadge.className = 'priority-badge low';
        
        // Reset summary
        ['summaryWho', 'summaryWhat', 'summaryWhere', 'summaryWhen', 'summaryInjuries', 'summarySuspects'].forEach(id => {
            document.getElementById(id).textContent = '-';
        });

        // Reset classification
        [this.policeBadge, this.fireBadge, this.medicalBadge].forEach(badge => {
            badge.classList.remove('active');
        });
        this.priorityLevel.textContent = 'Low';
        this.confidenceFill.style.width = '0%';
        this.confidenceText.textContent = '0%';

        // Reset questions and routing
        this.questionsList.innerHTML = '<p class="no-questions">Start a call to get AI-suggested questions</p>';
        this.routingContent.innerHTML = '<p>No routing suggestions available</p>';
    }

    exportTranscript() {
        const transcriptText = this.transcript.map(entry => 
            `[${entry.timestamp}] ${entry.text}`
        ).join('\n');

        this.downloadFile('transcript.txt', transcriptText);
    }

    exportIncident() {
        if (this.humanConfirmationToggle.checked) {
            if (!confirm('Confirm export of incident data?')) return;
        }

        const incidentData = {
            timestamp: new Date().toISOString(),
            transcript: this.transcript,
            urgentBrief: this.urgentBriefContent.textContent,
            summary: {
                who: document.getElementById('summaryWho').textContent,
                what: document.getElementById('summaryWhat').textContent,
                where: document.getElementById('summaryWhere').textContent,
                when: document.getElementById('summaryWhen').textContent,
                injuries: document.getElementById('summaryInjuries').textContent,
                suspects: document.getElementById('summarySuspects').textContent
            },
            classification: {
                category: this.getActiveCategory(),
                priority: this.priorityLevel.textContent,
                confidence: parseInt(this.confidenceText.textContent)
            },
            routing: Array.from(this.routingContent.children).map(unit => unit.textContent)
        };

        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        
        if (format === 'json') {
            this.downloadFile('incident.json', JSON.stringify(incidentData, null, 2));
        } else {
            this.downloadFile('incident.pdf', this.generatePDF(incidentData));
        }
    }

    getActiveCategory() {
        if (this.policeBadge.classList.contains('active')) return 'Police';
        if (this.fireBadge.classList.contains('active')) return 'Fire';
        if (this.medicalBadge.classList.contains('active')) return 'Medical';
        return 'Unknown';
    }

    generatePDF(data) {
        // Simple PDF generation - in production, use a proper PDF library
        const content = `
DISPATCH AI INCIDENT REPORT
Generated: ${data.timestamp}

URGENT BRIEF:
${data.urgentBrief}

INCIDENT SUMMARY:
Who: ${data.summary.who}
What: ${data.summary.what}
Where: ${data.summary.where}
When: ${data.summary.when}
Injuries: ${data.summary.injuries}
Suspects: ${data.summary.suspects}

CLASSIFICATION:
Category: ${data.classification.category}
Priority: ${data.classification.priority}
Confidence: ${data.classification.confidence}%

ROUTING SUGGESTIONS:
${data.routing.join(', ')}

TRANSCRIPT:
${data.transcript.map(entry => `[${entry.timestamp}] ${entry.text}`).join('\n')}
        `;
        return content;
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearAllData() {
        if (confirm('This will clear all data including call queue and history. Are you sure?')) {
            this.clearTranscript();
            this.stopCall();
            this.clearCallQueueData();
            this.showNotification('All data cleared including call queue', 2000);
        }
    }

    clearCallQueueData() {
        // Clear active calls
        localStorage.removeItem('dispatchAI_activeCalls');
        
        // Clear completed calls
        localStorage.removeItem('dispatchAI_completedCalls');
        
        // Reset current call
        this.currentCallId = null;
        this.dispatchStartTime = null;
        
        // Notify routing page if open
        this.notifyRoutingPage('clearAllData', {});
        
        console.log('Call queue data cleared');
    }

    startRetentionTimer() {
        this.clearRetentionTimer();
        const minutes = parseInt(this.dataRetentionSelect.value);
        this.retentionTimer = setTimeout(() => {
            this.clearAllData();
            this.showNotification('Data automatically cleared after retention period', 4000);
        }, minutes * 60 * 1000);
    }

    clearRetentionTimer() {
        if (this.retentionTimer) {
            clearTimeout(this.retentionTimer);
            this.retentionTimer = null;
        }
    }

    updateRetentionTimer() {
        if (this.isRecording) {
            this.startRetentionTimer();
        }
    }

    processRadioChatter() {
        const text = this.radioInput.value.trim();
        if (!text) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `
            <div class="transcript-timestamp">${timestamp}</div>
            <div class="transcript-text">${text}</div>
        `;
        this.radioLog.appendChild(logEntry);
        this.radioInput.value = '';

        // Process the radio chatter
        this.processTranscript(text);
    }

    openRadioModal() {
        this.radioModal.classList.add('active');
    }

    closeModal() {
        this.radioModal.classList.remove('active');
    }

    updateStatus(text, type) {
        this.statusText.textContent = text;
        this.statusDot.className = `status-dot ${type}`;
    }

    showError(message) {
        console.error(message);
        alert(message);
    }

    showNotification(message, duration = 3000) {
        this.notificationText.textContent = message;
        this.notificationToast.classList.add('show');
        
        // Auto-hide after duration
        setTimeout(() => {
            this.hideNotification();
        }, duration);
    }

    hideNotification() {
        this.notificationToast.classList.remove('show');
    }

    showAIProcessing(show) {
        if (this.aiProcessingIndicator) {
            this.aiProcessingIndicator.style.display = show ? 'flex' : 'none';
        }
    }

    loadSettings() {
        // Load saved settings from localStorage
        const settings = JSON.parse(localStorage.getItem('dispatchAI_settings') || '{}');
        
        if (settings.humanConfirmation !== undefined) {
            this.humanConfirmationToggle.checked = settings.humanConfirmation;
        }
        
        if (settings.dataRetention) {
            this.dataRetentionSelect.value = settings.dataRetention;
        }
    }

    saveSettings() {
        const settings = {
            humanConfirmation: this.humanConfirmationToggle.checked,
            dataRetention: this.dataRetentionSelect.value
        };
        localStorage.setItem('dispatchAI_settings', JSON.stringify(settings));
    }

    updateAIStatus() {
        // Check if Ollama is available after a short delay
        setTimeout(() => {
            if (this.ollama.isAvailable) {
                this.aiStatus.classList.add('ollama');
                this.aiIndicator.textContent = '🧠';
                this.aiStatusText.textContent = 'Ollama AI';
                console.log('AI Status: Ollama AI is active');
            } else {
                this.aiStatus.classList.remove('ollama');
                this.aiIndicator.textContent = '🤖';
                this.aiStatusText.textContent = 'Mock AI';
                console.log('AI Status: Mock AI is active');
            }
        }, 1000);
    }

    startDispatchTimer() {
        this.dispatchStartTime = new Date();
        this.dispatchTimer.style.display = 'flex';
        
        this.dispatchTimerInterval = setInterval(() => {
            if (this.dispatchStartTime) {
                const elapsed = Math.floor((new Date() - this.dispatchStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                this.timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopDispatchTimer() {
        if (this.dispatchTimerInterval) {
            clearInterval(this.dispatchTimerInterval);
            this.dispatchTimerInterval = null;
        }
        this.dispatchTimer.style.display = 'none';
        this.dispatchStartTime = null;
    }

    getDispatchTime() {
        if (this.dispatchStartTime) {
            return Math.floor((new Date() - this.dispatchStartTime) / 1000);
        }
        return 0;
    }

    openRoutingPage() {
        window.open('routing.html', '_blank');
    }

    routeCall() {
        if (!this.currentIncident) {
            this.showError('No active incident to route');
            return;
        }

        const dispatchTime = this.getDispatchTime();
        const callData = {
            callId: this.currentCallId || Date.now(),
            urgentBrief: this.currentIncident.urgentBrief,
            priority: this.currentIncident.classification?.priority || 'Low',
            category: this.currentIncident.classification?.category || 'Police',
            transcript: this.transcript.map(entry => entry.text).join(' '),
            classification: this.currentIncident.classification,
            routing: this.currentIncident.routing,
            dispatchTime: dispatchTime
        };

        // Send to routing page
        if (window.opener) {
            window.opener.postMessage({
                type: 'routeCall',
                callId: callData.callId,
                callData: callData
            }, '*');
        }

        // Store locally
        this.storeCompletedCall(callData);

        this.showNotification(`Call routed successfully (${Math.floor(dispatchTime/60)}:${(dispatchTime%60).toString().padStart(2, '0')})`, 3000);
        this.routeBtn.disabled = true;
    }

    createNewCall() {
        this.currentCallId = Date.now();
        const callerId = this.generateCallerId();
        const callData = {
            callId: this.currentCallId,
            callerId: callerId,
            urgentBrief: 'Call in progress...',
            priority: 'Low',
            category: 'Police',
            startTime: new Date(),
            status: 'In Progress',
            transcript: '',
            classification: {},
            routing: []
        };

        // Store in active calls
        this.storeActiveCall(callData);
        
        // Notify routing page if open
        this.notifyRoutingPage('newCall', callData);
        
        console.log('Created new call:', callData);
    }

    completeCurrentCall() {
        if (!this.currentCallId) return;

        const dispatchTime = this.getDispatchTime();
        const callData = {
            callId: this.currentCallId,
            callerId: this.generateCallerId(),
            urgentBrief: this.currentIncident?.urgentBrief || 'Call completed',
            priority: this.currentIncident?.classification?.priority || 'Low',
            category: this.currentIncident?.classification?.category || 'Police',
            startTime: this.dispatchStartTime || new Date(Date.now() - (dispatchTime * 1000)),
            endTime: new Date(),
            status: 'Completed',
            transcript: this.transcript.map(entry => entry.text).join(' '),
            classification: this.currentIncident?.classification || {},
            routing: this.currentIncident?.routing || [],
            dispatchTime: dispatchTime,
            outcome: 'Resolved'
        };

        // Remove from active calls
        this.removeActiveCall(this.currentCallId);
        
        // Add to completed calls
        this.storeCompletedCall(callData);
        
        // Notify routing page if open
        this.notifyRoutingPage('callCompleted', callData);
        
        this.currentCallId = null;
        this.dispatchStartTime = null;
    }

    generateCallerId() {
        const prefixes = ['CALL', 'EMRG', 'DISP', 'URGT'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `${prefix}-${number}`;
    }

    storeActiveCall(callData) {
        const activeCalls = JSON.parse(localStorage.getItem('dispatchAI_activeCalls') || '[]');
        activeCalls.push(callData);
        localStorage.setItem('dispatchAI_activeCalls', JSON.stringify(activeCalls));
    }

    removeActiveCall(callId) {
        const activeCalls = JSON.parse(localStorage.getItem('dispatchAI_activeCalls') || '[]');
        const filteredCalls = activeCalls.filter(call => call.callId !== callId);
        localStorage.setItem('dispatchAI_activeCalls', JSON.stringify(filteredCalls));
    }

    storeCompletedCall(callData) {
        const completedCalls = JSON.parse(localStorage.getItem('dispatchAI_completedCalls') || '[]');
        completedCalls.unshift({
            ...callData,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 calls
        if (completedCalls.length > 50) {
            completedCalls.splice(50);
        }
        
        localStorage.setItem('dispatchAI_completedCalls', JSON.stringify(completedCalls));
    }

    updateCurrentCall(analysis) {
        if (!this.currentCallId) return;

        const callData = {
            callId: this.currentCallId,
            urgentBrief: analysis.urgentBrief,
            priority: analysis.classification?.priority || 'Low',
            category: analysis.classification?.category || 'Police',
            classification: analysis.classification,
            routing: analysis.routing,
            transcript: this.transcript.map(entry => entry.text).join(' ')
        };

        // Update in active calls
        this.updateActiveCall(this.currentCallId, callData);
        
        // Notify routing page if open
        this.notifyRoutingPage('updateCall', { callId: this.currentCallId, callData });
    }

    updateActiveCall(callId, callData) {
        const activeCalls = JSON.parse(localStorage.getItem('dispatchAI_activeCalls') || '[]');
        const callIndex = activeCalls.findIndex(call => call.callId === callId);
        
        if (callIndex !== -1) {
            activeCalls[callIndex] = { ...activeCalls[callIndex], ...callData };
            localStorage.setItem('dispatchAI_activeCalls', JSON.stringify(activeCalls));
        }
    }

    notifyRoutingPage(type, data) {
        // Try to notify any open routing pages
        if (window.opener) {
            window.opener.postMessage({ type, data }, '*');
        }
        
        // Also try to notify parent window
        if (window.parent !== window) {
            window.parent.postMessage({ type, data }, '*');
        }
    }

    async testOllama() {
        this.showNotification('Testing AI connection...', 2000);
        this.showAIProcessing(true);
        
        try {
            const testTranscript = "This is 911, I'm calling about an armed robbery at 123 Main Street. Two men with guns just robbed the convenience store and are fleeing north in a black sedan.";
            
            const analysis = await this.ollama.analyzeIncident(testTranscript);
            
            if (analysis) {
                const aiType = this.ollama.isAvailable ? 'Ollama AI' : 'Mock AI';
                this.showNotification(`AI test successful (${aiType})`, 3000);
                
                // Update UI with test results
                this.updateUrgentBrief(analysis.urgentBrief);
                this.updateSummary(analysis.summary);
                this.updateQuestions(analysis.questions);
                this.updateClassification(analysis.classification);
                this.updateRouting(analysis.routing);
                
                console.log('AI Test Results:', analysis);
            } else {
                this.showNotification('AI test failed - no response', 3000);
            }
            
            this.showAIProcessing(false);
        } catch (error) {
            console.error('AI test error:', error);
            this.showNotification('AI test failed - check console', 3000);
            this.showAIProcessing(false);
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dispatchAI = new DispatchAI();
    
    // Save settings when they change
    document.getElementById('humanConfirmationToggle').addEventListener('change', () => {
        window.dispatchAI.saveSettings();
    });
    
    document.getElementById('dataRetentionSelect').addEventListener('change', () => {
        window.dispatchAI.saveSettings();
    });
});

