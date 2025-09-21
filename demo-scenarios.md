# DispatchAI Copilot - Demo Scenarios

## Quick Start Demo
1. Open `index.html` in a web browser
2. Click "Start Call" 
3. Roleplay one of the scenarios below
4. Watch the AI analyze and provide suggestions
5. Click "Export Incident Pack" to download the data

## Demo Scenarios

### 1. Armed Robbery (Police - High Priority)
**Script:**
> "This is 911, I'm calling about an armed robbery at 123 Main Street. Two men with guns just robbed the convenience store and are fleeing north in a black sedan. I'm safe inside my car but I can see them driving away. They were wearing dark hoodies and masks."

**Expected AI Response:**
- **Urgent Brief:** [HIGH] Armed robbery - 2 suspects fleeing north in black sedan - caller safe
- **Category:** Police
- **Priority:** High
- **Suggested Questions:** "Are the suspects armed?", "What direction are they heading?", "Can you describe the suspects?"
- **Routing:** Police Patrol, Detective

### 2. House Fire (Fire - High Priority)
**Script:**
> "911, there's a fire at my house! I can see smoke coming from the second floor. I've evacuated everyone but I think someone might still be inside. The address is 456 Oak Avenue. The fire seems to be spreading quickly."

**Expected AI Response:**
- **Urgent Brief:** [HIGH] House fire - smoke from second floor - possible person trapped
- **Category:** Fire
- **Priority:** High
- **Suggested Questions:** "Is anyone trapped inside?", "What is burning?", "Is the fire spreading?"
- **Routing:** Fire Engine, Ambulance, Fire Chief

### 3. Medical Emergency (Medical - High Priority)
**Script:**
> "I need an ambulance! My husband is having chest pain and can't breathe. We're at 789 Pine Street, apartment 3B. He's conscious but very pale and sweating. He's 65 years old and has a history of heart problems."

**Expected AI Response:**
- **Urgent Brief:** [HIGH] Medical emergency - chest pain, breathing difficulty - 65yo male
- **Category:** Medical
- **Priority:** High
- **Suggested Questions:** "Is the person conscious?", "Are they breathing?", "What are the symptoms?"
- **Routing:** EMS, Ambulance

### 4. Noise Complaint (Police - Low Priority)
**Script:**
> "Hi, this is 911. I'm calling about a noise complaint. My neighbors at 321 Elm Street have been playing loud music all night and it's keeping everyone awake. I've tried knocking on their door but they won't answer."

**Expected AI Response:**
- **Urgent Brief:** [LOW] Noise complaint - loud music disturbance
- **Category:** Police
- **Priority:** Low
- **Suggested Questions:** "How long has this been going on?", "Have you tried contacting them?", "Is this a recurring issue?"
- **Routing:** Police Patrol

### 5. Traffic Accident (Police - Medium Priority)
**Script:**
> "There's been a car accident on Highway 101 near the downtown exit. Two cars collided and one of them is blocking the right lane. I can see people standing outside their vehicles but I'm not sure if anyone is injured. Traffic is backing up."

**Expected AI Response:**
- **Urgent Brief:** [MEDIUM] Traffic accident - 2 vehicles, lane blocked
- **Category:** Police
- **Priority:** Medium
- **Suggested Questions:** "Are there any injuries?", "Are the vehicles blocking traffic?", "Do you need medical assistance?"
- **Routing:** Police Patrol, Traffic Unit

## Demo Tips

### For Hackathon Presentation
1. **Start with a dramatic scenario** (armed robbery or fire)
2. **Show the real-time transcription** as you speak
3. **Highlight the AI analysis** updating live
4. **Demonstrate the export functionality**
5. **Show the privacy controls** and data retention

### Technical Demo Points
- **Speech Recognition:** Show how it captures speech in real-time
- **AI Analysis:** Point out how it categorizes and prioritizes incidents
- **Suggested Questions:** Click on questions to show interactivity
- **Export Feature:** Download both JSON and PDF formats
- **Privacy Features:** Show data retention and human confirmation

### Browser Compatibility
- **Chrome/Edge:** Full functionality
- **Firefox:** Full functionality  
- **Safari:** Full functionality
- **Mobile:** Responsive design works on tablets

### Troubleshooting
- **No speech recognition:** Check microphone permissions
- **AI not working:** App falls back to mock AI automatically
- **Export not working:** Check browser download settings
- **UI not responsive:** Refresh the page

## Advanced Features Demo

### Radio Chatter Log
1. Click "Radio Log" button
2. Paste or type radio chatter text
3. Click "Process" to analyze it
4. Show how it integrates with the main incident

### Privacy Controls
1. Show "Human Confirmation Required" toggle
2. Demonstrate data retention settings
3. Show "Clear All Data" functionality
4. Explain the auto-deletion feature

### Keyboard Shortcuts
- **Ctrl+Enter:** Start/Stop call
- **Escape:** Close modals
- **Tab:** Navigate between elements

## Ollama Integration (Optional)

If you have Ollama installed:
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2`
3. Start Ollama: `ollama serve`
4. The app will automatically use Ollama for enhanced AI analysis

Without Ollama, the app uses intelligent mock AI that still provides realistic analysis based on keyword detection and pattern matching.
