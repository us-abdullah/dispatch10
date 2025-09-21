// Ollama Integration for DispatchAI Copilot
class OllamaIntegration {
    constructor() {
        this.baseUrl = 'http://localhost:11434/api';
        this.model = 'llama3.2'; // Default model, can be changed
        this.isAvailable = false;
        this.realWorldClassification = new RealWorldClassification();
        this.dataAnalysis = new DataAnalysis();
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            // Always try to connect to Ollama, regardless of protocol
            console.log('Checking Ollama availability...');
            
            const response = await fetch(`${this.baseUrl}/tags`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                this.isAvailable = true;
                console.log('Ollama is available and connected');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.log('Ollama not available, using real-world data-driven analysis:', error.message);
            this.isAvailable = false;
        }
    }

    async generateResponse(prompt, options = {}) {
        if (!this.isAvailable) {
            console.log('Ollama not available, using mock response');
            return this.mockResponse(prompt);
        }

        try {
            console.log('Calling Ollama API with prompt:', prompt.substring(0, 100) + '...');
            
            const response = await fetch(`${this.baseUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        ...options
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Ollama response received:', data.response ? 'Success' : 'Empty');
            return data.response;
        } catch (error) {
            console.error('Ollama API error:', error);
            this.isAvailable = false; // Mark as unavailable for future calls
            return this.mockResponse(prompt);
        }
    }

    async analyzeIncident(transcript) {
        console.log('Analyzing incident with transcript:', transcript.substring(0, 100) + '...');
        
        // First, get real-world classification based on actual 911 data
        const realWorldAnalysis = this.realWorldClassification.classifyIncident(transcript);
        const dataAnalysis = this.dataAnalysis.getClassificationForTranscript(transcript);
        
        console.log('Real-world classification:', realWorldAnalysis);
        console.log('Data analysis result:', dataAnalysis);
        
        // If Ollama is not available, use real-world data-driven analysis
        if (!this.isAvailable) {
            console.log('Using real-world data-driven analysis');
            return this.generateDataDrivenAnalysis(transcript, realWorldAnalysis, dataAnalysis);
        }

        const prompt = `You are an AI assistant for 911 dispatch trained on real NYC, Seattle, and NENA datasets. Analyze this emergency call transcript and provide a structured response in JSON format.

REAL-WORLD DATA CONTEXT:
- NYC 911 Data: ${JSON.stringify(realWorldAnalysis)}
- Data Analysis: ${JSON.stringify(dataAnalysis)}
- NENA Standards: Based on National Emergency Number Association codes

Transcript: "${transcript}"

Please analyze and return a JSON object with the following structure:
{
  "urgentBrief": "One-line urgent summary with priority level [HIGH/MEDIUM/LOW] based on real data patterns",
  "summary": {
    "who": "Who is involved (caller, witness, etc.)",
    "what": "What happened (type of incident) - use real call type classifications",
    "where": "Location if mentioned",
    "when": "Time reference if mentioned",
    "injuries": "Injury status",
    "suspects": "Suspect information if any"
  },
  "questions": [
    "Suggested follow-up question 1 based on real dispatch protocols",
    "Suggested follow-up question 2 based on real dispatch protocols",
    "Suggested follow-up question 3 based on real dispatch protocols"
  ],
  "classification": {
    "category": "Police/Fire/Medical based on real data patterns",
    "priority": "High/Medium/Low based on actual severity levels",
    "confidence": 85,
    "nenaCode": "E/P1/P2 based on NENA standards",
    "responseTime": "Target response time based on real data"
  },
  "routing": [
    "Suggested unit 1 based on real dispatch patterns",
    "Suggested unit 2 based on real dispatch patterns"
  ],
  "dataSource": "NYC/Seattle/NENA datasets",
  "severityLevel": "1-6 based on real severity codes"
}

Focus on emergency response needs using real-world data patterns. Be concise and actionable. Return ONLY the JSON object, no other text.`;

        try {
            console.log('Calling Ollama for data-driven incident analysis...');
            const response = await this.generateResponse(prompt);
            console.log('Raw Ollama response:', response);
            
            const parsed = this.parseJSONResponse(response);
            if (parsed) {
                console.log('Successfully parsed Ollama response:', parsed);
                // Enhance with real-world data
                const enhanced = this.enhanceWithRealWorldData(parsed, realWorldAnalysis, dataAnalysis);
                // Add detailed AI summary to urgent brief
                const detailedSummary = this.generateDetailedAISummary(transcript, realWorldAnalysis);
                enhanced.urgentBrief = enhanced.urgentBrief + '\n\n' + detailedSummary;
                enhanced.dataSource = this.generateDetailedDataSource(realWorldAnalysis, dataAnalysis);
                return enhanced;
            } else {
                console.log('Failed to parse Ollama response, using data-driven analysis');
                return this.generateDataDrivenAnalysis(transcript, realWorldAnalysis, dataAnalysis);
            }
        } catch (error) {
            console.error('Error analyzing incident with Ollama:', error);
            return this.generateDataDrivenAnalysis(transcript, realWorldAnalysis, dataAnalysis);
        }
    }

    async generateUrgentBrief(transcript) {
        const prompt = `Analyze this emergency call transcript and create a one-line urgent brief for 911 dispatch.

Transcript: "${transcript}"

Format: [PRIORITY] Brief description - key details
Priority levels: HIGH (life-threatening), MEDIUM (urgent but stable), LOW (non-emergency)

Examples:
- [HIGH] Armed robbery - 2 suspects fleeing north in black sedan - caller safe
- [MEDIUM] House fire - smoke visible from second floor - residents evacuated
- [LOW] Noise complaint - loud music from apartment building

Be specific about location, suspects, injuries, and immediate threats.`;

        try {
            const response = await this.generateResponse(prompt);
            return response.trim();
        } catch (error) {
            console.error('Error generating urgent brief:', error);
            return this.generateMockUrgentBrief(transcript);
        }
    }

    async generateQuestions(transcript, category, priority) {
        const prompt = `Generate 3 specific follow-up questions for a 911 dispatcher to ask based on this emergency call.

Transcript: "${transcript}"
Category: ${category}
Priority: ${priority}

Focus on:
- Safety information (injuries, weapons, threats)
- Location details (address, landmarks, directions)
- Suspect descriptions (if applicable)
- Current situation status

Return as a JSON array of strings.`;

        try {
            const response = await this.generateResponse(prompt);
            const parsed = JSON.parse(response);
            return Array.isArray(parsed) ? parsed : this.generateMockQuestions(category, priority);
        } catch (error) {
            console.error('Error generating questions:', error);
            return this.generateMockQuestions(category, priority);
        }
    }

    async classifyIncident(transcript) {
        const prompt = `Classify this emergency call transcript for 911 dispatch.

Transcript: "${transcript}"

Return a JSON object with:
{
  "category": "Police/Fire/Medical",
  "priority": "High/Medium/Low", 
  "confidence": 85
}

Categories:
- Police: crimes, suspicious activity, traffic incidents, domestic disputes
- Fire: fires, smoke, explosions, gas leaks, building emergencies
- Medical: injuries, medical emergencies, accidents, health crises

Priority:
- High: life-threatening, active threats, major emergencies
- Medium: urgent but not life-threatening
- Low: non-emergency, routine calls

Be decisive and provide confidence score (0-100).`;

        try {
            const response = await this.generateResponse(prompt);
            return this.parseJSONResponse(response);
        } catch (error) {
            console.error('Error classifying incident:', error);
            return this.mockClassification(transcript);
        }
    }

    async suggestRouting(transcript, category, priority) {
        const prompt = `Suggest emergency response units to dispatch based on this call.

Transcript: "${transcript}"
Category: ${category}
Priority: ${priority}

Return a JSON array of suggested units:
- Police: "Patrol Unit", "Detective", "SWAT", "Traffic Unit"
- Fire: "Fire Engine", "Ladder Truck", "Ambulance", "Fire Chief"
- Medical: "EMS", "Ambulance", "Paramedic", "Medical Supervisor"

Consider the severity and type of incident.`;

        try {
            const response = await this.generateResponse(prompt);
            const parsed = JSON.parse(response);
            return Array.isArray(parsed) ? parsed : this.mockRouting(category, priority);
        } catch (error) {
            console.error('Error suggesting routing:', error);
            return this.mockRouting(category, priority);
        }
    }

    parseJSONResponse(response) {
        try {
            // Ensure response is a string
            const responseStr = typeof response === 'string' ? response : String(response);
            console.log('Parsing JSON response:', responseStr.substring(0, 200) + '...');
            
            // Try to extract JSON from the response (handle cases where Ollama adds extra text)
            const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                console.log('Extracted JSON:', jsonStr);
                return JSON.parse(jsonStr);
            }
            
            // If no JSON object found, try parsing the whole response
            return JSON.parse(responseStr);
        } catch (error) {
            console.error('Error parsing JSON response:', error);
            console.error('Response was:', response);
            return null;
        }
    }

    // Mock responses for when Ollama is not available
    mockResponse(transcript) {
        return this.mockAIAnalysis(transcript);
    }

    mockAIAnalysis(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        let category = 'Police';
        let priority = 'Low';
        let confidence = 60;

        if (lowerTranscript.includes('fire') || lowerTranscript.includes('smoke')) {
            category = 'Fire';
            priority = 'High';
            confidence = 85;
        } else if (lowerTranscript.includes('medical') || lowerTranscript.includes('ambulance')) {
            category = 'Medical';
            priority = 'High';
            confidence = 80;
        } else if (lowerTranscript.includes('robbery') || lowerTranscript.includes('armed')) {
            category = 'Police';
            priority = 'High';
            confidence = 90;
        }

        return {
            urgentBrief: this.generateMockUrgentBrief(transcript),
            summary: this.extractMockSummary(transcript),
            questions: this.generateMockQuestions(category, priority),
            classification: { category, priority, confidence },
            routing: this.mockRouting(category, priority)
        };
    }

    generateMockUrgentBrief(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        if (lowerTranscript.includes('fire')) {
            return '[HIGH] Fire emergency - immediate response required';
        } else if (lowerTranscript.includes('robbery') || lowerTranscript.includes('armed')) {
            return '[HIGH] Armed incident - suspect(s) at large';
        } else if (lowerTranscript.includes('medical') || lowerTranscript.includes('injured')) {
            return '[HIGH] Medical emergency - EMS dispatch needed';
        } else if (lowerTranscript.includes('theft') || lowerTranscript.includes('stolen')) {
            return '[MEDIUM] Theft incident - standard police response';
        } else {
            return '[LOW] Incident reported - further assessment needed';
        }
    }

    extractMockSummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        return {
            who: lowerTranscript.includes('caller') ? 'Caller reporting' : 'Unknown caller',
            what: this.extractWhat(lowerTranscript),
            where: this.extractWhere(lowerTranscript),
            when: new Date().toLocaleString(),
            injuries: lowerTranscript.includes('injured') ? 'Injuries reported' : 'No injuries mentioned',
            suspects: lowerTranscript.includes('suspect') ? 'Suspect(s) reported' : 'No suspects identified'
        };
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
        const locationPatterns = [
            /at (\d+ [^,]+)/i,
            /on ([^,]+ street)/i,
            /near ([^,]+)/i
        ];

        for (const pattern of locationPatterns) {
            const match = transcript.match(pattern);
            if (match) return match[1];
        }

        return 'Location to be determined';
    }

    generateMockQuestions(category, priority) {
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

    mockClassification(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        let category = 'Police';
        let priority = 'Low';
        let confidence = 60;

        if (lowerTranscript.includes('fire') || lowerTranscript.includes('smoke')) {
            category = 'Fire';
            priority = 'High';
            confidence = 85;
        } else if (lowerTranscript.includes('medical') || lowerTranscript.includes('ambulance')) {
            category = 'Medical';
            priority = 'High';
            confidence = 80;
        } else if (lowerTranscript.includes('robbery') || lowerTranscript.includes('armed')) {
            category = 'Police';
            priority = 'High';
            confidence = 90;
        }

        return { category, priority, confidence };
    }

    mockRouting(category, priority) {
        const routing = [];
        
        if (category === 'Police') {
            routing.push('Police Patrol');
            if (priority === 'High') routing.push('Detective');
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

    generateDataDrivenAnalysis(transcript, realWorldAnalysis, dataAnalysis) {
        // Generate analysis based on real-world data
        const baseUrgentBrief = this.generateUrgentBriefFromData(realWorldAnalysis, dataAnalysis);
        const detailedSummary = this.generateDetailedAISummary(transcript, realWorldAnalysis);
        const urgentBrief = baseUrgentBrief + '\n\n' + detailedSummary;
        
        const summary = this.extractSummaryFromData(transcript, realWorldAnalysis);
        const questions = this.generateQuestionsFromData(realWorldAnalysis);
        const classification = this.enhanceClassificationWithData(realWorldAnalysis, dataAnalysis);
        const routing = realWorldAnalysis.routing || this.mockRouting(realWorldAnalysis.category, realWorldAnalysis.priority);

        return {
            urgentBrief,
            summary,
            questions,
            classification,
            routing,
            dataSource: this.generateDetailedDataSource(realWorldAnalysis, dataAnalysis),
            severityLevel: realWorldAnalysis.severity || 6,
            nenaCode: realWorldAnalysis.nenaCode || 'P2'
        };
    }

    generateUrgentBriefFromData(realWorldAnalysis, dataAnalysis) {
        const priority = realWorldAnalysis.priority || 'Low';
        const category = realWorldAnalysis.category || 'Police';
        const severity = realWorldAnalysis.severity || 6;
        const keywords = realWorldAnalysis.keywords || [];
        
        let brief = `[${priority}] `;
        
        // Generate specific briefs based on keywords and severity
        if (keywords.includes('ROBBERY')) {
            brief += 'Armed robbery in progress - immediate police response required';
        } else if (keywords.includes('ASSAULT') || keywords.includes('raping')) {
            brief += 'Violent assault in progress - immediate police response required';
        } else if (keywords.includes('ANIMAL_EMERGENCY')) {
            brief += 'Animal emergency - immediate response required';
        } else if (keywords.includes('FIRE')) {
            brief += 'Fire emergency - immediate fire response required';
        } else if (keywords.includes('MEDICAL') || keywords.includes('CARDIAC')) {
            brief += 'Medical emergency - immediate EMS response required';
        } else if (keywords.includes('EMERGENCY') || keywords.includes('help')) {
            brief += 'Emergency in progress - immediate response required';
        } else {
            // Generic briefs based on category and severity
            if (category === 'Police') {
                if (severity <= 2) brief += 'Police emergency - immediate response required';
                else if (severity <= 4) brief += 'Police incident - standard response';
                else brief += 'Police call - routine response';
            } else if (category === 'Fire') {
                if (severity <= 2) brief += 'Fire emergency - immediate response required';
                else if (severity <= 4) brief += 'Fire incident - standard response';
                else brief += 'Fire call - routine response';
            } else if (category === 'Medical') {
                if (severity <= 2) brief += 'Medical emergency - immediate response required';
                else if (severity <= 4) brief += 'Medical incident - standard response';
                else brief += 'Medical call - routine response';
            }
        }

        return brief;
    }

    generateDetailedDataSource(realWorldAnalysis, dataAnalysis) {
        const sources = [];
        
        // NYC Data specifics
        if (dataAnalysis.nycPatterns && dataAnalysis.nycPatterns.length > 0) {
            const nycCount = dataAnalysis.nycPatterns.length;
            const topPattern = dataAnalysis.nycPatterns[0];
            sources.push(`NYC 911 (${nycCount} similar incidents, ${topPattern.callType})`);
        }
        
        // Seattle Data specifics  
        if (dataAnalysis.seattlePatterns && dataAnalysis.seattlePatterns.length > 0) {
            const seattleCount = dataAnalysis.seattlePatterns.length;
            const topPattern = dataAnalysis.seattlePatterns[0];
            sources.push(`Seattle 911 (${seattleCount} similar calls, ${topPattern.callType})`);
        }
        
        // NENA Code specifics
        if (realWorldAnalysis.nenaCode) {
            const nenaDescription = this.getNENADescription(realWorldAnalysis.nenaCode);
            sources.push(`NENA ${realWorldAnalysis.nenaCode} (${nenaDescription})`);
        }
        
        // Real-time data specifics
        if (dataAnalysis.realTimeData) {
            sources.push(`Real-time dispatch data (${dataAnalysis.realTimeData.incidentCount} active incidents)`);
        }
        
        return sources.length > 0 ? sources.join(' | ') : 'Real-world datasets';
    }

    getNENADescription(nenaCode) {
        const descriptions = {
            'E': 'Emergency - Immediate response required',
            'P1': 'Priority 1 - High priority response',
            'P2': 'Priority 2 - Standard response',
            'P3': 'Priority 3 - Low priority response'
        };
        return descriptions[nenaCode] || 'Standard response';
    }

    generateDetailedAISummary(transcript, realWorldAnalysis) {
        // Extract key details from transcript for AI analysis
        const keyDetails = this.extractKeyDetailsFromTranscript(transcript);
        const keywords = realWorldAnalysis.keywords || [];
        const priority = realWorldAnalysis.priority || 'Low';
        
        let detailedSummary = '';
        
        // Location context
        if (keyDetails.location) {
            detailedSummary += `📍 Location: ${keyDetails.location}\n`;
        }
        
        // Incident specifics
        if (keywords.includes('ROBBERY')) {
            detailedSummary += `🚨 Incident: Armed robbery reported\n`;
            if (keyDetails.suspects) detailedSummary += `👤 Suspects: ${keyDetails.suspects}\n`;
            if (keyDetails.weapons) detailedSummary += `🔫 Weapons: ${keyDetails.weapons}\n`;
        } else if (keywords.includes('ASSAULT') || keywords.includes('raping')) {
            detailedSummary += `🚨 Incident: Violent assault in progress\n`;
            if (keyDetails.victims) detailedSummary += `👤 Victims: ${keyDetails.victims}\n`;
            if (keyDetails.injuries) detailedSummary += `🏥 Injuries: ${keyDetails.injuries}\n`;
        } else if (keywords.includes('ANIMAL_EMERGENCY')) {
            detailedSummary += `🚨 Incident: Animal emergency\n`;
            if (keyDetails.animalType) detailedSummary += `🐕 Animal: ${keyDetails.animalType}\n`;
            if (keyDetails.animalCondition) detailedSummary += `🏥 Condition: ${keyDetails.animalCondition}\n`;
        } else if (keywords.includes('FIRE')) {
            detailedSummary += `🚨 Incident: Fire emergency\n`;
            if (keyDetails.fireType) detailedSummary += `🔥 Fire Type: ${keyDetails.fireType}\n`;
            if (keyDetails.smoke) detailedSummary += `💨 Smoke: ${keyDetails.smoke}\n`;
        } else if (keywords.includes('MEDICAL')) {
            detailedSummary += `🚨 Incident: Medical emergency\n`;
            if (keyDetails.medicalCondition) detailedSummary += `🏥 Condition: ${keyDetails.medicalCondition}\n`;
            if (keyDetails.consciousness) detailedSummary += `🧠 Consciousness: ${keyDetails.consciousness}\n`;
        }
        
        // Caller information
        if (keyDetails.callerState) {
            detailedSummary += `📞 Caller: ${keyDetails.callerState}\n`;
        }
        
        // Urgency indicators
        if (priority === 'High') {
            detailedSummary += `⚡ URGENCY: Immediate response required\n`;
        } else if (priority === 'Medium') {
            detailedSummary += `⚡ URGENCY: Standard response\n`;
        } else {
            detailedSummary += `⚡ URGENCY: Routine response\n`;
        }
        
        // Response time target
        const responseTime = this.getResponseTimeTarget(realWorldAnalysis);
        if (responseTime) {
            detailedSummary += `⏱️ Target Response: ${responseTime}\n`;
        }
        
        return detailedSummary.trim();
    }

    extractKeyDetailsFromTranscript(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        const details = {};
        
        // Location extraction
        if (lowerTranscript.includes('at my house') || lowerTranscript.includes('at home')) {
            details.location = 'Residential location';
        } else if (lowerTranscript.includes('street') || lowerTranscript.includes('avenue')) {
            const streetMatch = lowerTranscript.match(/(\d+\s+[^,]+(?:street|avenue|road|way))/i);
            if (streetMatch) details.location = streetMatch[1];
        }
        
        // Suspect information
        if (lowerTranscript.includes('armed') || lowerTranscript.includes('weapon')) {
            details.weapons = 'Armed suspect(s)';
        }
        if (lowerTranscript.includes('suspect') || lowerTranscript.includes('perpetrator')) {
            details.suspects = 'Suspect(s) reported';
        }
        
        // Victim information
        if (lowerTranscript.includes('injured') || lowerTranscript.includes('hurt')) {
            details.injuries = 'Injuries reported';
        }
        if (lowerTranscript.includes('unconscious') || lowerTranscript.includes('not breathing')) {
            details.consciousness = 'Unconscious/unresponsive';
        }
        
        // Animal emergency details
        if (lowerTranscript.includes('dog')) {
            details.animalType = 'Dog';
        } else if (lowerTranscript.includes('cat')) {
            details.animalType = 'Cat';
        }
        if (lowerTranscript.includes('eaten') || lowerTranscript.includes('attacked')) {
            details.animalCondition = 'Being attacked/injured';
        }
        
        // Fire details
        if (lowerTranscript.includes('smoke')) {
            details.smoke = 'Heavy smoke reported';
        }
        if (lowerTranscript.includes('explosion')) {
            details.fireType = 'Explosion';
        }
        
        // Medical details
        if (lowerTranscript.includes('chest pain') || lowerTranscript.includes('heart')) {
            details.medicalCondition = 'Cardiac emergency';
        } else if (lowerTranscript.includes('stroke')) {
            details.medicalCondition = 'Stroke symptoms';
        }
        
        // Caller state
        if (lowerTranscript.includes('help') || lowerTranscript.includes('emergency')) {
            details.callerState = 'Distressed, requesting immediate help';
        } else if (lowerTranscript.includes('calm') || lowerTranscript.includes('okay')) {
            details.callerState = 'Calm, providing information';
        } else {
            details.callerState = 'Providing incident details';
        }
        
        return details;
    }

    getResponseTimeTarget(realWorldAnalysis) {
        const priority = realWorldAnalysis.priority;
        const category = realWorldAnalysis.category;
        
        if (priority === 'High') {
            if (category === 'Police') return '2-4 minutes (Emergency)';
            if (category === 'Fire') return '2-4 minutes (Emergency)';
            if (category === 'Medical') return '2-4 minutes (Emergency)';
        } else if (priority === 'Medium') {
            return '5-8 minutes (Priority 1)';
        } else {
            return '10-15 minutes (Priority 2)';
        }
        
        return null;
    }

    extractSummaryFromData(transcript, realWorldAnalysis) {
        const lowerTranscript = transcript.toLowerCase();
        
        return {
            who: this.extractWhoFromTranscript(lowerTranscript),
            what: realWorldAnalysis.keywords ? realWorldAnalysis.keywords.join(', ') : 'Incident reported',
            where: this.extractWhereFromTranscript(lowerTranscript),
            when: new Date().toLocaleString(),
            injuries: this.extractInjuriesFromTranscript(lowerTranscript),
            suspects: this.extractSuspectsFromTranscript(lowerTranscript)
        };
    }

    extractWhoFromTranscript(transcript) {
        if (transcript.includes('caller') || transcript.includes('i am') || transcript.includes('i got')) return 'Caller reporting';
        if (transcript.includes('witness')) return 'Witness reporting';
        return 'Unknown caller';
    }

    extractWhereFromTranscript(transcript) {
        // Simple location extraction - in production, use NLP
        const locationPatterns = [
            /at (\d+ [^,]+)/i,
            /on ([^,]+ street)/i,
            /near ([^,]+)/i,
            /(\d+ [^,]+ avenue)/i,
            /at my house/i,
            /at home/i
        ];

        for (const pattern of locationPatterns) {
            const match = transcript.match(pattern);
            if (match) return match[1] || 'Residential location';
        }

        if (transcript.includes('house') || transcript.includes('home')) return 'Residential location';
        return 'Location to be determined';
    }

    extractInjuriesFromTranscript(transcript) {
        if (transcript.includes('injured') || transcript.includes('hurt') || transcript.includes('bleeding')) return 'Injuries reported';
        if (transcript.includes('no injuries') || transcript.includes('no one hurt')) return 'No injuries';
        if (transcript.includes('raping') || transcript.includes('assault')) return 'Potential injuries - medical attention needed';
        return 'Injury status unknown';
    }

    extractSuspectsFromTranscript(transcript) {
        if (transcript.includes('suspect') || transcript.includes('perpetrator') || transcript.includes('robbery') || transcript.includes('raping')) {
            if (transcript.includes('armed') || transcript.includes('weapon')) return 'Armed suspect(s)';
            return 'Suspect(s) reported';
        }
        return 'No suspects identified';
    }

    generateQuestionsFromData(realWorldAnalysis) {
        const questions = [];
        const category = realWorldAnalysis.category;
        const priority = realWorldAnalysis.priority;
        
        if (category === 'Police') {
            if (priority === 'High') {
                questions.push('Are there any weapons involved?');
                questions.push('Is anyone injured?');
                questions.push('Can you describe the suspect(s)?');
            } else {
                questions.push('What is the nature of the incident?');
                questions.push('Are there any witnesses?');
                questions.push('When did this occur?');
            }
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

    enhanceClassificationWithData(realWorldAnalysis, dataAnalysis) {
        return {
            category: realWorldAnalysis.category || 'Police',
            priority: realWorldAnalysis.priority || 'Low',
            confidence: realWorldAnalysis.confidence || 60,
            nenaCode: realWorldAnalysis.nenaCode || 'P2',
            responseTime: realWorldAnalysis.responseTime || '30 minutes',
            severityLevel: realWorldAnalysis.severity || 6,
            dataSource: dataAnalysis.source || 'Real-world datasets'
        };
    }

    enhanceWithRealWorldData(ollamaResponse, realWorldAnalysis, dataAnalysis) {
        // Enhance Ollama response with real-world data
        return {
            ...ollamaResponse,
            classification: {
                ...ollamaResponse.classification,
                nenaCode: realWorldAnalysis.nenaCode || ollamaResponse.classification.nenaCode,
                responseTime: realWorldAnalysis.responseTime || ollamaResponse.classification.responseTime,
                severityLevel: realWorldAnalysis.severity || ollamaResponse.classification.severityLevel,
                dataSource: dataAnalysis.source || 'NYC/Seattle/NENA datasets'
            },
            dataSource: dataAnalysis.source || 'NYC/Seattle/NENA datasets',
            severityLevel: realWorldAnalysis.severity || 6
        };
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OllamaIntegration;
} else {
    window.OllamaIntegration = OllamaIntegration;
}
