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
  "suggestedScript": "Live dispatcher response script based on real dispatch protocols and current incident context",
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

    async generateSuggestedScript(transcript, category, priority, realWorldAnalysis) {
        // If Ollama is not available, use dynamic mock generation
        if (!this.isAvailable) {
            return this.generateDynamicMockScript(transcript, category, priority, realWorldAnalysis);
        }

        const prompt = `Generate a live dispatcher response script for this emergency call based on real 911 dispatch protocols.

Transcript: "${transcript}"
Category: ${category}
Priority: ${priority}
Data Sources: ${realWorldAnalysis.dataSource || 'Real-world datasets'}

Based on actual 911 dispatch protocols from NYC, Seattle, and NENA standards, generate a professional dispatcher response script that includes:
- Immediate acknowledgment and reassurance
- Critical information gathering questions
- Safety instructions for the caller
- Next steps based on incident type and priority
- Professional 911 dispatch language and tone

Return a single, comprehensive script response that a dispatcher can use to respond to this specific call. Use real dispatch protocols and terminology.`;

        try {
            const response = await this.generateResponse(prompt);
            return response.trim();
        } catch (error) {
            console.error('Error generating suggested script:', error);
            return this.generateDynamicMockScript(transcript, category, priority, realWorldAnalysis);
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
            suggestedScript: this.generateMockSuggestedScript(category, priority),
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

    generateDynamicMockScript(transcript, category, priority, realWorldAnalysis) {
        const timestamp = new Date().toLocaleTimeString();
        const lowerTranscript = transcript.toLowerCase();
        
        // Extract key details from transcript for more specific responses
        const hasWeapon = lowerTranscript.includes('gun') || lowerTranscript.includes('weapon') || lowerTranscript.includes('knife') || lowerTranscript.includes('shot');
        const hasInjury = lowerTranscript.includes('hurt') || lowerTranscript.includes('injured') || lowerTranscript.includes('bleeding') || lowerTranscript.includes('unconscious');
        const hasLocation = lowerTranscript.includes('street') || lowerTranscript.includes('avenue') || lowerTranscript.includes('road') || lowerTranscript.includes('building');
        const isChasing = lowerTranscript.includes('chasing') || lowerTranscript.includes('fleeing') || lowerTranscript.includes('running');
        const isVehicle = lowerTranscript.includes('car') || lowerTranscript.includes('truck') || lowerTranscript.includes('vehicle');
        const isShooting = lowerTranscript.includes('shooting') || lowerTranscript.includes('shot') || lowerTranscript.includes('tires');
        const isRobbery = lowerTranscript.includes('robbed') || lowerTranscript.includes('robbery') || lowerTranscript.includes('stolen');
        const isAssault = lowerTranscript.includes('assault') || lowerTranscript.includes('attacked') || lowerTranscript.includes('beaten');
        
        // Generate unique script based on specific transcript content
        if (isShooting && isVehicle) {
            return `[${timestamp}] "911, what's your emergency?"

"Stay calm and stay safe. Are you in immediate danger? Can you tell me exactly where you are right now? What direction are you heading? What does the suspect vehicle look like? Are there any weapons involved? Stay on the line with me - help is on the way."`;
        } else if (isRobbery) {
            return `[${timestamp}] "911, what's your emergency?"

"Stay calm and stay safe. Are you in immediate danger? Can you tell me exactly where you are right now? What was taken? Can you describe the suspect? Are there any weapons involved? Stay on the line with me - help is on the way."`;
        } else if (isAssault) {
            return `[${timestamp}] "911, what's your emergency?"

"Stay calm and stay safe. Are you in immediate danger? Can you tell me exactly where you are right now? Are you injured? Can you describe the suspect? Are there any weapons involved? Stay on the line with me - help is on the way."`;
        } else if (isChasing && isVehicle) {
            return `[${timestamp}] "911, what's your emergency?"

"Stay calm and stay safe. Are you in immediate danger? Can you tell me exactly where you are right now? What direction are you heading? What does the suspect vehicle look like? Stay on the line with me - help is on the way."`;
        } else if (hasWeapon) {
            return `[${timestamp}] "911, what's your emergency?"

"Stay calm and stay safe. Are you in immediate danger? Can you tell me exactly where you are right now? Are there any weapons involved? Can you describe what the suspect looks like? Stay on the line with me - help is on the way."`;
        } else if (category === 'Fire') {
            if (hasInjury) {
                return `[${timestamp}] "911, what's your emergency?"

"Get out of the building immediately if you haven't already. Is anyone trapped inside? What is burning? Is the fire spreading? Are there any injuries? Stay away from the building and wait for firefighters to arrive."`;
            } else {
                return `[${timestamp}] "911, what's your emergency?"

"Get out of the building immediately if you haven't already. Is anyone trapped inside? What is burning? Is the fire spreading? Stay away from the building and wait for firefighters to arrive."`;
            }
        } else if (category === 'Medical') {
            if (hasInjury) {
                return `[${timestamp}] "911, what's your emergency?"

"Is the person conscious? Are they breathing? What are their symptoms? When did this start? Stay with them and don't move them unless they're in immediate danger. EMS is on the way."`;
            } else {
                return `[${timestamp}] "911, what's your emergency?"

"Is the person conscious? Are they breathing? What are their symptoms? When did this start? Stay with them and don't move them unless they're in immediate danger. EMS is on the way."`;
            }
        } else if (category === 'Police') {
            if (priority === 'High') {
                return `[${timestamp}] "911, what's your emergency?"

"Stay calm and stay safe. Are you in immediate danger? Can you tell me exactly where you are right now? Are there any weapons involved? Can you describe what the suspect looks like? Stay on the line with me - help is on the way."`;
            } else {
                return `[${timestamp}] "911, what's your emergency?"

"Can you tell me what happened? When did this occur? Are there any witnesses present? Can you provide your exact location? Officers will be dispatched to your location shortly."`;
            }
        }

        return `[${timestamp}] "911, what's your emergency? Please stay on the line while I get help to you."`;
    }

    generateMockSuggestedScript(category, priority) {
        const timestamp = new Date().toLocaleTimeString();
        
        if (category === 'Police') {
            if (priority === 'High') {
                return `[${timestamp}] "911, what's your emergency?" 

"Stay calm and stay safe. Are you in immediate danger? Can you tell me exactly where you are right now? Are there any weapons involved? Can you describe what the suspect looks like? Stay on the line with me - help is on the way."`;
            } else {
                return `[${timestamp}] "911, what's your emergency?"

"Can you tell me what happened? When did this occur? Are there any witnesses present? Can you provide your exact location? Officers will be dispatched to your location shortly."`;
            }
        } else if (category === 'Fire') {
            return `[${timestamp}] "911, what's your emergency?"

"Get out of the building immediately if you haven't already. Is anyone trapped inside? What is burning? Is the fire spreading? Stay away from the building and wait for firefighters to arrive."`;
        } else if (category === 'Medical') {
            return `[${timestamp}] "911, what's your emergency?"

"Is the person conscious? Are they breathing? What are their symptoms? When did this start? Stay with them and don't move them unless they're in immediate danger. EMS is on the way."`;
        }

        return `[${timestamp}] "911, what's your emergency? Please stay on the line while I get help to you."`;
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
        const suggestedScript = await this.generateSuggestedScript(transcript, realWorldAnalysis.category, realWorldAnalysis.priority, realWorldAnalysis);
        const classification = this.enhanceClassificationWithData(realWorldAnalysis, dataAnalysis);
        const routing = realWorldAnalysis.routing || this.mockRouting(realWorldAnalysis.category, realWorldAnalysis.priority);

        return {
            urgentBrief,
            summary,
            suggestedScript,
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
        // Generate a specific, detailed summary based on the actual transcript content
        const keywords = realWorldAnalysis.keywords || [];
        const priority = realWorldAnalysis.priority || 'Low';
        
        let detailedSummary = '';
        
        // Generate specific incident description based on transcript content
        if (keywords.includes('ROBBERY')) {
            detailedSummary += this.generateRobberySummary(transcript);
        } else if (keywords.includes('ASSAULT') || keywords.includes('raping')) {
            detailedSummary += this.generateAssaultSummary(transcript);
        } else if (keywords.includes('ANIMAL_EMERGENCY')) {
            detailedSummary += this.generateAnimalEmergencySummary(transcript);
        } else if (keywords.includes('FIRE')) {
            detailedSummary += this.generateFireSummary(transcript);
        } else if (keywords.includes('MEDICAL')) {
            detailedSummary += this.generateMedicalSummary(transcript);
        } else if (keywords.includes('SHOOTING') || transcript.includes('shooting') || transcript.includes('gun')) {
            detailedSummary += this.generateShootingSummary(transcript);
        } else if (keywords.includes('EMERGENCY') || transcript.includes('help') || transcript.includes('emergency')) {
            detailedSummary += this.generateGenericEmergencySummary(transcript);
        } else {
            detailedSummary += this.generateGenericIncidentSummary(transcript);
        }
        
        // Add urgency and response information
        if (priority === 'High') {
            detailedSummary += `\n⚡ URGENCY: Immediate response required`;
        } else if (priority === 'Medium') {
            detailedSummary += `\n⚡ URGENCY: Standard response`;
        } else {
            detailedSummary += `\n⚡ URGENCY: Routine response`;
        }
        
        const responseTime = this.getResponseTimeTarget(realWorldAnalysis);
        if (responseTime) {
            detailedSummary += `\n⏱️ Target Response: ${responseTime}`;
        }
        
        return detailedSummary.trim();
    }

    generateRobberySummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        let summary = `🚨 ARMED ROBBERY IN PROGRESS\n`;
        
        if (lowerTranscript.includes('at my house') || lowerTranscript.includes('at home')) {
            summary += `📍 Location: Residential property\n`;
        }
        
        if (lowerTranscript.includes('armed') || lowerTranscript.includes('weapon') || lowerTranscript.includes('gun')) {
            summary += `🔫 Suspects: Armed and dangerous\n`;
        } else {
            summary += `👤 Suspects: Unknown number, status unclear\n`;
        }
        
        if (lowerTranscript.includes('money') || lowerTranscript.includes('cash') || lowerTranscript.includes('dollar')) {
            summary += `💰 Motive: Financial gain/theft\n`;
        }
        
        if (lowerTranscript.includes('help') || lowerTranscript.includes('emergency')) {
            summary += `📞 Caller: Distressed, requesting immediate assistance\n`;
        } else {
            summary += `📞 Caller: Reporting active robbery\n`;
        }
        
        return summary;
    }

    generateAssaultSummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        let summary = `🚨 VIOLENT ASSAULT IN PROGRESS\n`;
        
        if (lowerTranscript.includes('raping') || lowerTranscript.includes('rape')) {
            summary += `⚠️ Type: Sexual assault/rape\n`;
        } else {
            summary += `⚠️ Type: Physical assault\n`;
        }
        
        if (lowerTranscript.includes('at my house') || lowerTranscript.includes('at home')) {
            summary += `📍 Location: Residential property\n`;
        }
        
        if (lowerTranscript.includes('injured') || lowerTranscript.includes('hurt') || lowerTranscript.includes('bleeding')) {
            summary += `🏥 Victim Status: Injured, medical attention needed\n`;
        } else {
            summary += `👤 Victim Status: Unknown injury status\n`;
        }
        
        if (lowerTranscript.includes('help') || lowerTranscript.includes('emergency')) {
            summary += `📞 Caller: Distressed, immediate help needed\n`;
        } else {
            summary += `📞 Caller: Reporting active assault\n`;
        }
        
        return summary;
    }

    generateShootingSummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        let summary = `🚨 ACTIVE SHOOTING INCIDENT\n`;
        
        if (lowerTranscript.includes('car') || lowerTranscript.includes('vehicle')) {
            summary += `🚗 Context: Vehicle-related shooting\n`;
        }
        
        if (lowerTranscript.includes('chasing') || lowerTranscript.includes('following')) {
            summary += `🏃 Situation: Suspect pursuing victim\n`;
        }
        
        if (lowerTranscript.includes('tires') || lowerTranscript.includes('tire')) {
            summary += `🎯 Target: Vehicle tires being shot at\n`;
        }
        
        if (lowerTranscript.includes('gun') || lowerTranscript.includes('shooting')) {
            summary += `🔫 Weapon: Firearm confirmed\n`;
        }
        
        summary += `📞 Caller: In immediate danger, fleeing suspect\n`;
        
        return summary;
    }

    generateAnimalEmergencySummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        let summary = `🚨 ANIMAL EMERGENCY\n`;
        
        if (lowerTranscript.includes('dog')) {
            summary += `🐕 Animal: Dog in distress\n`;
        } else if (lowerTranscript.includes('cat')) {
            summary += `🐱 Animal: Cat in distress\n`;
        } else {
            summary += `🐾 Animal: Pet in distress\n`;
        }
        
        if (lowerTranscript.includes('eaten') || lowerTranscript.includes('attacked')) {
            summary += `⚠️ Situation: Animal being attacked/injured\n`;
        }
        
        if (lowerTranscript.includes('help') || lowerTranscript.includes('emergency')) {
            summary += `📞 Caller: Distressed about pet's safety\n`;
        } else {
            summary += `📞 Caller: Reporting animal emergency\n`;
        }
        
        return summary;
    }

    generateFireSummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        let summary = `🚨 FIRE EMERGENCY\n`;
        
        if (lowerTranscript.includes('house') || lowerTranscript.includes('home')) {
            summary += `🏠 Location: Residential fire\n`;
        }
        
        if (lowerTranscript.includes('smoke')) {
            summary += `💨 Smoke: Heavy smoke reported\n`;
        }
        
        if (lowerTranscript.includes('explosion')) {
            summary += `💥 Type: Explosion/fire\n`;
        }
        
        summary += `📞 Caller: Reporting active fire emergency\n`;
        
        return summary;
    }

    generateMedicalSummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        let summary = `🚨 MEDICAL EMERGENCY\n`;
        
        if (lowerTranscript.includes('chest pain') || lowerTranscript.includes('heart')) {
            summary += `❤️ Condition: Cardiac emergency\n`;
        } else if (lowerTranscript.includes('stroke')) {
            summary += `🧠 Condition: Stroke symptoms\n`;
        } else if (lowerTranscript.includes('unconscious')) {
            summary += `😵 Condition: Unconscious patient\n`;
        } else {
            summary += `🏥 Condition: Medical emergency\n`;
        }
        
        summary += `📞 Caller: Requesting immediate medical assistance\n`;
        
        return summary;
    }

    generateGenericEmergencySummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        let summary = `🚨 EMERGENCY IN PROGRESS\n`;
        
        if (lowerTranscript.includes('help')) {
            summary += `🆘 Situation: Caller requesting immediate help\n`;
        }
        
        if (lowerTranscript.includes('emergency')) {
            summary += `⚠️ Type: Emergency situation reported\n`;
        }
        
        summary += `📞 Caller: Distressed, immediate assistance needed\n`;
        
        return summary;
    }

    generateGenericIncidentSummary(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        let summary = `📞 INCIDENT REPORTED\n`;
        
        if (lowerTranscript.includes('at my house') || lowerTranscript.includes('at home')) {
            summary += `📍 Location: Residential property\n`;
        }
        
        summary += `📞 Caller: Providing incident details\n`;
        
        return summary;
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

    generateSuggestedScriptFromData(realWorldAnalysis) {
        const timestamp = new Date().toLocaleTimeString();
        const category = realWorldAnalysis.category;
        const priority = realWorldAnalysis.priority;
        const dataSource = realWorldAnalysis.dataSource || 'Real-world datasets';
        
        if (category === 'Police') {
            if (priority === 'High') {
                return `[${timestamp}] "911, what's your emergency?" 

"Stay calm and stay safe. Are you in immediate danger? Can you tell me exactly where you are right now? Are there any weapons involved? Can you describe what the suspect looks like? Stay on the line with me - help is on the way."

[Based on ${dataSource} - High Priority Police Response]`;
            } else {
                return `[${timestamp}] "911, what's your emergency?"

"Can you tell me what happened? When did this occur? Are there any witnesses present? Can you provide your exact location? Officers will be dispatched to your location shortly."

[Based on ${dataSource} - Standard Police Response]`;
            }
        } else if (category === 'Fire') {
            return `[${timestamp}] "911, what's your emergency?"

"Get out of the building immediately if you haven't already. Is anyone trapped inside? What is burning? Is the fire spreading? Stay away from the building and wait for firefighters to arrive."

[Based on ${dataSource} - Fire Emergency Response]`;
        } else if (category === 'Medical') {
            return `[${timestamp}] "911, what's your emergency?"

"Is the person conscious? Are they breathing? What are their symptoms? When did this start? Stay with them and don't move them unless they're in immediate danger. EMS is on the way."

[Based on ${dataSource} - Medical Emergency Response]`;
        }

        return `[${timestamp}] "911, what's your emergency? Please stay on the line while I get help to you."

[Based on ${dataSource} - General Emergency Response]`;
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
