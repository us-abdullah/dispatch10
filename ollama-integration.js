// Ollama Integration for DispatchAI Copilot
class OllamaIntegration {
    constructor() {
        this.baseUrl = 'http://localhost:11434/api';
        this.model = 'llama3.2'; // Default model, can be changed
        this.isAvailable = false;
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            // Check if we're running from file:// protocol
            if (window.location.protocol === 'file:') {
                console.log('Running from file:// protocol - Ollama not accessible, using mock AI');
                this.isAvailable = false;
                return;
            }

            const response = await fetch(`${this.baseUrl}/tags`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                this.isAvailable = true;
                console.log('Ollama is available');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.log('Ollama not available, using mock AI:', error.message);
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
        
        // If Ollama is not available, use mock analysis
        if (!this.isAvailable) {
            console.log('Using mock AI analysis');
            return this.mockAIAnalysis(transcript);
        }

        const prompt = `You are an AI assistant for 911 dispatch. Analyze this emergency call transcript and provide a structured response in JSON format.

Transcript: "${transcript}"

Please analyze and return a JSON object with the following structure:
{
  "urgentBrief": "One-line urgent summary with priority level [HIGH/MEDIUM/LOW]",
  "summary": {
    "who": "Who is involved (caller, witness, etc.)",
    "what": "What happened (type of incident)",
    "where": "Location if mentioned",
    "when": "Time reference if mentioned",
    "injuries": "Injury status",
    "suspects": "Suspect information if any"
  },
  "questions": [
    "Suggested follow-up question 1",
    "Suggested follow-up question 2",
    "Suggested follow-up question 3"
  ],
  "classification": {
    "category": "Police/Fire/Medical",
    "priority": "High/Medium/Low",
    "confidence": 85
  },
  "routing": [
    "Suggested unit 1",
    "Suggested unit 2"
  ]
}

Focus on emergency response needs. Be concise and actionable. Return ONLY the JSON object, no other text.`;

        try {
            console.log('Calling Ollama for incident analysis...');
            const response = await this.generateResponse(prompt);
            console.log('Raw Ollama response:', response);
            
            const parsed = this.parseJSONResponse(response);
            if (parsed) {
                console.log('Successfully parsed Ollama response:', parsed);
                return parsed;
            } else {
                console.log('Failed to parse Ollama response, using mock analysis');
                return this.mockAIAnalysis(transcript);
            }
        } catch (error) {
            console.error('Error analyzing incident with Ollama:', error);
            return this.mockAIAnalysis(transcript);
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
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OllamaIntegration;
} else {
    window.OllamaIntegration = OllamaIntegration;
}
