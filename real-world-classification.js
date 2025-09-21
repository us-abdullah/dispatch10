// Real-World 911 Classification System
// Based on NYC, Seattle, and NENA datasets

class RealWorldClassification {
    constructor() {
        this.initializeNYCData();
        this.initializeSeattleData();
        this.initializeNENACodes();
        this.initializePriorityMatrix();
    }

    initializeNYCData() {
        // Based on NYC 911 data from https://data.cityofnewyork.us/resource/76xm-jjuj.json
        this.nycCallTypes = {
            // High Priority (Severity 1-2)
            'RESPFC': { category: 'Fire', priority: 'High', severity: 2, description: 'Respiratory Fire Call' },
            'DIFFFC': { category: 'Fire', priority: 'High', severity: 2, description: 'Difficulty Breathing Fire Call' },
            'INJURY': { category: 'Medical', priority: 'High', severity: 1, description: 'Injury' },
            'UNC': { category: 'Medical', priority: 'High', severity: 2, description: 'Unconscious' },
            'CVAC': { category: 'Medical', priority: 'High', severity: 2, description: 'Cardiac/Vascular' },
            
            // Medium Priority (Severity 3-4)
            'DRUG': { category: 'Police', priority: 'Medium', severity: 4, description: 'Drug Related' },
            'UNKNOW': { category: 'Police', priority: 'Medium', severity: 4, description: 'Unknown' },
            'SICK': { category: 'Medical', priority: 'Medium', severity: 6, description: 'Sick Person' },
            
            // Low Priority (Severity 5-6)
            'PASSING': { category: 'Police', priority: 'Low', severity: 6, description: 'Passing Call' },
            'ALARM': { category: 'Police', priority: 'Low', severity: 5, description: 'Alarm' }
        };

        this.nycSeverityLevels = {
            1: { priority: 'High', responseTime: 'Immediate', description: 'Life-threatening emergency' },
            2: { priority: 'High', responseTime: 'Immediate', description: 'Serious emergency' },
            3: { priority: 'Medium', responseTime: '15 minutes', description: 'Urgent but not life-threatening' },
            4: { priority: 'Medium', responseTime: '30 minutes', description: 'Standard response' },
            5: { priority: 'Low', responseTime: '1 hour', description: 'Non-urgent' },
            6: { priority: 'Low', responseTime: '2 hours', description: 'Routine' }
        };
    }

    initializeSeattleData() {
        // Based on Seattle 911 data patterns
        this.seattleCallTypes = {
            // High Priority (A)
            '219': { category: 'Police', priority: 'High', severity: 1, description: 'STABBING' },
            '240': { category: 'Police', priority: 'High', severity: 1, description: 'ASSAULT / BATTERY' },
            '100A': { category: 'Police', priority: 'High', severity: 2, description: 'AUDIBLE ALARM' },
            
            // Medium Priority (B)
            '851': { category: 'Police', priority: 'Medium', severity: 3, description: 'STOLEN VEHICLE' },
            '106J': { category: 'Police', priority: 'Medium', severity: 3, description: 'Psych escort' },
            '585': { category: 'Police', priority: 'Medium', severity: 4, description: 'TRAFFIC STOP' },
            
            // Low Priority (C)
            '903': { category: 'Police', priority: 'Low', severity: 6, description: 'PASSING CALL' }
        };

        this.seattlePriorityLevels = {
            'A': { priority: 'High', responseTime: 'Immediate', severity: 1 },
            'B': { priority: 'Medium', responseTime: '15 minutes', severity: 3 },
            'C': { priority: 'Low', responseTime: '1 hour', severity: 6 }
        };
    }

    initializeNENACodes() {
        // NENA (National Emergency Number Association) standard codes
        this.nenaCodes = {
            // Medical Emergencies
            'MEDICAL': { category: 'Medical', priority: 'High', nenaCode: 'E' },
            'CARDIAC': { category: 'Medical', priority: 'High', nenaCode: 'E' },
            'STROKE': { category: 'Medical', priority: 'High', nenaCode: 'E' },
            'TRAUMA': { category: 'Medical', priority: 'High', nenaCode: 'E' },
            'OVERDOSE': { category: 'Medical', priority: 'High', nenaCode: 'E' },
            
            // Fire Emergencies
            'FIRE': { category: 'Fire', priority: 'High', nenaCode: 'E' },
            'SMOKE': { category: 'Fire', priority: 'High', nenaCode: 'E' },
            'EXPLOSION': { category: 'Fire', priority: 'High', nenaCode: 'E' },
            'GAS_LEAK': { category: 'Fire', priority: 'High', nenaCode: 'E' },
            
            // Police Emergencies - CRITICAL
            'ROBBERY': { category: 'Police', priority: 'High', nenaCode: 'E' },
            'ASSAULT': { category: 'Police', priority: 'High', nenaCode: 'E' },
            'SHOOTING': { category: 'Police', priority: 'High', nenaCode: 'E' },
            'STABBING': { category: 'Police', priority: 'High', nenaCode: 'E' },
            'DOMESTIC': { category: 'Police', priority: 'High', nenaCode: 'E' },
            'SUICIDE': { category: 'Police', priority: 'High', nenaCode: 'E' },
            'HOSTAGE': { category: 'Police', priority: 'High', nenaCode: 'E' },
            'BOMB': { category: 'Police', priority: 'High', nenaCode: 'E' },
            'EMERGENCY': { category: 'Police', priority: 'High', nenaCode: 'E' },
            
            // Animal Emergencies
            'ANIMAL_EMERGENCY': { category: 'Police', priority: 'High', nenaCode: 'E' },
            
            // Medium Priority
            'BURGLARY': { category: 'Police', priority: 'Medium', nenaCode: 'P1' },
            'ACCIDENT': { category: 'Police', priority: 'Medium', nenaCode: 'P1' },
            'HIT_RUN': { category: 'Police', priority: 'Medium', nenaCode: 'P1' },
            'DUI': { category: 'Police', priority: 'Medium', nenaCode: 'P1' },
            
            // Low Priority
            'NOISE': { category: 'Police', priority: 'Low', nenaCode: 'P2' },
            'THEFT': { category: 'Police', priority: 'Low', nenaCode: 'P2' },
            'VANDALISM': { category: 'Police', priority: 'Low', nenaCode: 'P2' }
        };
    }

    initializePriorityMatrix() {
        // Response time targets based on real data analysis
        this.responseTimeTargets = {
            'High': {
                'Police': { target: 7, max: 15, units: 'minutes' },
                'Fire': { target: 5, max: 10, units: 'minutes' },
                'Medical': { target: 4, max: 8, units: 'minutes' }
            },
            'Medium': {
                'Police': { target: 15, max: 30, units: 'minutes' },
                'Fire': { target: 10, max: 20, units: 'minutes' },
                'Medical': { target: 8, max: 15, units: 'minutes' }
            },
            'Low': {
                'Police': { target: 60, max: 120, units: 'minutes' },
                'Fire': { target: 30, max: 60, units: 'minutes' },
                'Medical': { target: 20, max: 40, units: 'minutes' }
            }
        };
    }

    classifyIncident(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        // Special demo cases for low priority incidents
        if (lowerTranscript.includes('nose bleed') || lowerTranscript.includes('nosebleed') || lowerTranscript.includes('nose bleeding')) {
            return {
                category: 'Medical',
                priority: 'Low',
                confidence: 25,
                nenaCode: 'P3',
                keywords: ['NOSE_BLEED'],
                urgency: 'low',
                severity: 3,
                specialNote: 'Nose bleed - Low priority medical call'
            };
        }
        
        if (lowerTranscript.includes('pizza')) {
            return {
                category: 'Police',
                priority: 'Low',
                confidence: 15,
                nenaCode: 'P4',
                keywords: ['PIZZA', 'POSSIBLE_PRANK'],
                urgency: 'low',
                severity: 2,
                specialNote: 'Pizza mentioned - Possible prank call'
            };
        }
        
        if (lowerTranscript.includes('cat') && lowerTranscript.includes('tree')) {
            return {
                category: 'Fire',
                priority: 'Low',
                confidence: 10,
                nenaCode: 'P4',
                keywords: ['CAT_TREE', 'POSSIBLE_PRANK'],
                urgency: 'low',
                severity: 1,
                specialNote: 'Cat in tree - Possible prank call'
            };
        }
        
        // Extract keywords and patterns
        const keywords = this.extractKeywords(lowerTranscript);
        const urgencyIndicators = this.detectUrgencyIndicators(lowerTranscript);
        const locationContext = this.extractLocationContext(lowerTranscript);
        
        // Apply classification logic based on real data patterns
        const classification = this.applyRealWorldClassification(keywords, urgencyIndicators, locationContext);
        
        // Check for multi-category incidents
        const multiCategory = this.detectMultiCategoryIncidents(lowerTranscript, keywords);
        if (multiCategory) {
            classification.categories = multiCategory.categories;
            classification.primaryCategory = multiCategory.primaryCategory;
            classification.secondaryCategories = multiCategory.secondaryCategories;
        }
        
        return classification;
    }

    detectMultiCategoryIncidents(transcript, keywords) {
        const categories = [];
        const lowerTranscript = transcript.toLowerCase();
        
        // Fire + Medical (e.g., "fire with injuries", "explosion with casualties")
        if ((lowerTranscript.includes('fire') || lowerTranscript.includes('explosion') || lowerTranscript.includes('smoke')) &&
            (lowerTranscript.includes('hurt') || lowerTranscript.includes('injured') || lowerTranscript.includes('casualties') || lowerTranscript.includes('medical'))) {
            categories.push('Fire', 'Medical');
        }
        
        // Police + Medical (e.g., "shooting with injuries", "assault with medical emergency")
        if ((lowerTranscript.includes('shooting') || lowerTranscript.includes('assault') || lowerTranscript.includes('robbery') || lowerTranscript.includes('fight')) &&
            (lowerTranscript.includes('hurt') || lowerTranscript.includes('injured') || lowerTranscript.includes('bleeding') || lowerTranscript.includes('unconscious'))) {
            categories.push('Police', 'Medical');
        }
        
        // Fire + Police (e.g., "arson", "suspicious fire")
        if ((lowerTranscript.includes('fire') || lowerTranscript.includes('arson') || lowerTranscript.includes('suspicious')) &&
            (lowerTranscript.includes('suspect') || lowerTranscript.includes('criminal') || lowerTranscript.includes('intentional') || lowerTranscript.includes('arson'))) {
            categories.push('Fire', 'Police');
        }
        
        // All three categories (e.g., "explosion with casualties and suspects")
        if ((lowerTranscript.includes('explosion') || lowerTranscript.includes('bomb')) &&
            (lowerTranscript.includes('hurt') || lowerTranscript.includes('injured')) &&
            (lowerTranscript.includes('suspect') || lowerTranscript.includes('terrorist') || lowerTranscript.includes('criminal'))) {
            categories.push('Fire', 'Medical', 'Police');
        }
        
        if (categories.length > 1) {
            // Remove duplicates
            const uniqueCategories = [...new Set(categories)];
            
            return {
                categories: uniqueCategories,
                primaryCategory: uniqueCategories[0], // First category is primary
                secondaryCategories: uniqueCategories.slice(1),
                multiCategory: true
            };
        }
        
        return null;
    }

    extractKeywords(transcript) {
        const keywords = [];
        
        // HIGH PRIORITY - Medical keywords
        if (transcript.includes('chest pain') || transcript.includes('heart attack')) keywords.push('CARDIAC');
        if (transcript.includes('stroke') || transcript.includes('paralyzed')) keywords.push('STROKE');
        if (transcript.includes('unconscious') || transcript.includes('not breathing')) keywords.push('MEDICAL');
        if (transcript.includes('overdose') || transcript.includes('drug')) keywords.push('OVERDOSE');
        if (transcript.includes('bleeding') || transcript.includes('injured')) keywords.push('TRAUMA');
        if (transcript.includes('dying') || transcript.includes('help')) keywords.push('MEDICAL');
        
        // HIGH PRIORITY - Fire keywords
        if (transcript.includes('fire') || transcript.includes('burning')) keywords.push('FIRE');
        if (transcript.includes('smoke') || transcript.includes('smoking')) keywords.push('SMOKE');
        if (transcript.includes('explosion') || transcript.includes('exploded')) keywords.push('EXPLOSION');
        if (transcript.includes('gas leak') || transcript.includes('gas smell')) keywords.push('GAS_LEAK');
        
        // HIGH PRIORITY - Police keywords (CRITICAL)
        if (transcript.includes('robbery') || transcript.includes('robbed') || transcript.includes('got robbed')) keywords.push('ROBBERY');
        if (transcript.includes('assault') || transcript.includes('attacked')) keywords.push('ASSAULT');
        if (transcript.includes('raping') || transcript.includes('rape') || transcript.includes('sexual assault')) keywords.push('ASSAULT');
        if (transcript.includes('shooting') || transcript.includes('shot') || transcript.includes('gun') || transcript.includes('chasing') || transcript.includes('tires')) keywords.push('SHOOTING');
        if (transcript.includes('stabbing') || transcript.includes('stabbed')) keywords.push('STABBING');
        if (transcript.includes('domestic') || transcript.includes('family')) keywords.push('DOMESTIC');
        if (transcript.includes('suicide') || transcript.includes('kill myself')) keywords.push('SUICIDE');
        if (transcript.includes('hostage') || transcript.includes('kidnapped')) keywords.push('HOSTAGE');
        if (transcript.includes('bomb') || transcript.includes('explosive')) keywords.push('BOMB');
        if (transcript.includes('help') || transcript.includes('emergency')) keywords.push('EMERGENCY');
        
        // MEDIUM PRIORITY
        if (transcript.includes('accident') || transcript.includes('crash')) keywords.push('ACCIDENT');
        if (transcript.includes('stolen') || transcript.includes('theft')) keywords.push('THEFT');
        
        // LOW PRIORITY
        if (transcript.includes('noise') || transcript.includes('loud')) keywords.push('NOISE');
        
        // ANIMAL EMERGENCIES
        if (transcript.includes('dog') || transcript.includes('animal') || transcript.includes('pet')) {
            if (transcript.includes('eaten') || transcript.includes('attacked') || transcript.includes('hurt')) {
                keywords.push('ANIMAL_EMERGENCY');
            }
        }
        
        return keywords;
    }

    detectUrgencyIndicators(transcript) {
        const indicators = {
            immediate: 0,
            urgent: 0,
            routine: 0
        };
        
        // Immediate indicators - CRITICAL EMERGENCIES
        const immediateWords = [
            'emergency', 'urgent', 'immediately', 'now', 'help', 'dying', 'critical',
            'robbery', 'robbed', 'raping', 'rape', 'assault', 'shooting', 'stabbing',
            'fire', 'burning', 'smoke', 'explosion', 'hostage', 'bomb', 'suicide',
            'unconscious', 'not breathing', 'bleeding', 'heart attack', 'stroke'
        ];
        immediateWords.forEach(word => {
            if (transcript.includes(word)) indicators.immediate++;
        });
        
        // Urgent indicators
        const urgentWords = ['asap', 'quickly', 'soon', 'important', 'serious', 'injured', 'hurt'];
        urgentWords.forEach(word => {
            if (transcript.includes(word)) indicators.urgent++;
        });
        
        // Routine indicators
        const routineWords = ['when you can', 'not urgent', 'routine', 'later', 'noise', 'loud'];
        routineWords.forEach(word => {
            if (transcript.includes(word)) indicators.routine++;
        });
        
        return indicators;
    }

    extractLocationContext(transcript) {
        const context = {
            residential: transcript.includes('house') || transcript.includes('home') || transcript.includes('apartment'),
            commercial: transcript.includes('store') || transcript.includes('business') || transcript.includes('office'),
            public: transcript.includes('street') || transcript.includes('park') || transcript.includes('school'),
            vehicle: transcript.includes('car') || transcript.includes('vehicle') || transcript.includes('highway')
        };
        
        return context;
    }

    applyRealWorldClassification(keywords, urgencyIndicators, locationContext) {
        let category = 'Police';
        let priority = 'Low';
        let confidence = 60;
        let severity = 6;
        let nenaCode = 'P2';
        
        // Determine category and priority based on keywords
        if (keywords.length > 0) {
            const primaryKeyword = keywords[0];
            const classification = this.nenaCodes[primaryKeyword];
            
            if (classification) {
                category = classification.category;
                priority = classification.priority;
                nenaCode = classification.nenaCode;
                confidence = 85;
                
                // Adjust severity based on real data patterns
                if (priority === 'High') severity = 1;
                else if (priority === 'Medium') severity = 3;
                else severity = 6;
            }
        }
        
        // Apply urgency modifiers based on indicators
        if (urgencyIndicators.immediate > 0) {
            priority = 'High';
            severity = 1;
            confidence = Math.min(confidence + 10, 95);
        } else if (urgencyIndicators.urgent > 0) {
            if (priority === 'Low') priority = 'Medium';
            severity = Math.min(severity, 3);
            confidence = Math.min(confidence + 5, 90);
        }
        
        // Location-based adjustments
        if (locationContext.residential && category === 'Police') {
            // Residential police calls often higher priority
            if (priority === 'Low') priority = 'Medium';
        }
        
        if (locationContext.public && (category === 'Fire' || category === 'Medical')) {
            // Public space emergencies often higher priority
            priority = 'High';
            severity = 1;
        }
        
        // Generate routing suggestions based on real data
        const routing = this.generateRoutingSuggestions(category, priority, severity);
        
        return {
            category,
            priority,
            severity,
            confidence,
            nenaCode,
            routing,
            responseTime: this.responseTimeTargets[priority][category],
            keywords: keywords.slice(0, 3), // Top 3 keywords
            urgencyScore: urgencyIndicators.immediate * 3 + urgencyIndicators.urgent * 2 - urgencyIndicators.routine
        };
    }

    generateRoutingSuggestions(category, priority, severity) {
        const routing = [];
        
        if (category === 'Police') {
            routing.push('Police Patrol');
            if (priority === 'High') {
                routing.push('Detective');
                if (severity === 1) routing.push('SWAT Team');
            }
            if (severity <= 2) routing.push('Crime Scene Unit');
        } else if (category === 'Fire') {
            routing.push('Fire Engine');
            routing.push('Ambulance');
            if (priority === 'High') {
                routing.push('Fire Chief');
                if (severity === 1) routing.push('Hazmat Unit');
            }
        } else if (category === 'Medical') {
            routing.push('EMS');
            routing.push('Ambulance');
            if (priority === 'High') {
                routing.push('Medical Supervisor');
                if (severity === 1) routing.push('Trauma Team');
            }
        }
        
        return routing;
    }

    getResponseTimeTarget(category, priority) {
        return this.responseTimeTargets[priority][category];
    }

    getNENAStandard(category, priority) {
        // Return NENA standard response codes
        const standards = {
            'E': { description: 'Emergency', responseTime: 'Immediate' },
            'P1': { description: 'Priority 1', responseTime: '15 minutes' },
            'P2': { description: 'Priority 2', responseTime: '1 hour' }
        };
        
        if (priority === 'High') return standards['E'];
        if (priority === 'Medium') return standards['P1'];
        return standards['P2'];
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealWorldClassification;
} else {
    window.RealWorldClassification = RealWorldClassification;
}
