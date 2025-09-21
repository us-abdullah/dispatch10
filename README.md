# DispatchAI Copilot

A single-page web app designed as an auxiliary monitor for 911 dispatchers. It provides AI-powered real-time call transcription, incident analysis, and dispatch assistance.

## Features

### Core Functionality
- **Live Call Transcription**: Real-time speech-to-text using Web Speech API
- **AI Incident Summarizer**: Intelligent analysis using Ollama (with fallback to mock AI)
- **Urgent Brief**: One-line priority summary that updates in real-time
- **Incident Classification**: Auto-categorizes calls as Police/Fire/Medical with priority levels
- **Suggested Questions**: AI-generated follow-up questions for dispatchers
- **Routing Suggestions**: Recommended emergency response units
- **Evidence Export**: Download incident data as JSON or PDF

### Privacy & Control
- **Human Confirmation**: Required before any routing/export actions
- **Auto Data Deletion**: Configurable retention periods (15 min, 1 hr, 24 hrs)
- **Data Clearing**: Manual and automatic data cleanup

### Optional Features
- **Radio Chatter Log**: Process and transcribe radio communications
- **Real-time Updates**: Live UI updates as transcript builds
- **Responsive Design**: Works on different screen sizes

## Setup Instructions

### Prerequisites
1. **Modern Web Browser**: Chrome, Firefox, Safari, or Edge with Web Speech API support
2. **Ollama (Optional)**: For AI analysis (falls back to mock AI if not available)

### Quick Start
1. Open `index.html` in a web browser
2. Click "Start Call" to begin transcription
3. Speak into your microphone to see real-time transcription
4. Watch as AI analyzes the call and provides suggestions

### Ollama Setup (Optional)
For enhanced AI analysis:

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull a Model**: 
   ```bash
   ollama pull llama3.2
   ```
3. **Start Ollama**: 
   ```bash
   ollama serve
   ```
4. **Update Model**: Edit `ollama-integration.js` to use your preferred model

### Demo Scenarios
Try these roleplay scenarios:

**Police Emergency:**
> "This is 911, I'm calling about an armed robbery at 123 Main Street. Two men with guns just robbed the convenience store and are fleeing north in a black sedan. I'm safe inside my car."

**Fire Emergency:**
> "911, there's a fire at my house! I can see smoke coming from the second floor. I've evacuated everyone but I think someone might still be inside. The address is 456 Oak Avenue."

**Medical Emergency:**
> "I need an ambulance! My husband is having chest pain and can't breathe. We're at 789 Pine Street, apartment 3B. He's conscious but very pale."

## Technical Details

### Architecture
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Speech Recognition**: Web Speech API
- **AI Integration**: Ollama API with fallback to mock responses
- **Data Storage**: LocalStorage for settings, no persistent data storage

### Browser Compatibility
- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

### Security Features
- No data sent to external servers (except Ollama if configured)
- All processing happens locally
- Configurable data retention
- Human confirmation for critical actions

## File Structure
```
dispatch-ai-copilot/
├── index.html              # Main HTML file
├── styles.css              # CSS styling
├── script.js               # Main JavaScript application
├── ollama-integration.js   # Ollama AI integration
└── README.md              # This file
```

## Customization

### Styling
Edit `styles.css` to customize:
- Color scheme
- Font sizes
- Layout spacing
- Animation effects

### AI Behavior
Edit `ollama-integration.js` to modify:
- AI prompts
- Classification logic
- Response formatting
- Model selection

### UI Layout
Edit `index.html` to change:
- Panel arrangement
- Button placement
- Information display

## Troubleshooting

### Speech Recognition Not Working
- Ensure microphone permissions are granted
- Check browser compatibility
- Try refreshing the page

### Ollama Connection Issues
- Verify Ollama is running: `ollama list`
- Check if model is available: `ollama pull llama3.2`
- App will fall back to mock AI if Ollama unavailable

### Export Issues
- Check browser download settings
- Ensure popup blockers are disabled
- Verify file permissions

## Demo Tips

### For Hackathon Demo
1. **Prepare Scenarios**: Have 2-3 emergency scenarios ready to roleplay
2. **Test Microphone**: Ensure clear audio input
3. **Show Features**: Demonstrate transcription, AI analysis, and export
4. **Explain Privacy**: Highlight data retention and human confirmation features

### Best Practices
- Speak clearly and at normal pace
- Use realistic emergency scenarios
- Show the AI learning and adapting
- Demonstrate the export functionality

## Future Enhancements

- **Real CAD Integration**: Connect to actual Computer-Aided Dispatch systems
- **Multi-language Support**: Support for different languages
- **Advanced NLP**: More sophisticated natural language processing
- **Voice Commands**: Control the interface with voice
- **Team Collaboration**: Multi-dispatcher support
- **Historical Analysis**: Learn from past incidents

## License

This project is created for demonstration purposes. Please ensure compliance with local regulations and privacy laws when deploying in production environments.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all prerequisites are installed
3. Test with different browsers
4. Review the troubleshooting section above
