# DispatchAI Copilot - Server Setup Guide

## Quick Fix for CORS Issues

The app works perfectly with mock AI, but if you want to use Ollama, you need to serve the files from an HTTP server due to browser CORS restrictions.

## Option 1: Python HTTP Server (Recommended)

### Python 3
```bash
# Navigate to the project directory
cd dispatch-ai-copilot

# Start HTTP server
python -m http.server 8000

# Open browser to: http://localhost:8000
```

### Python 2
```bash
python -m SimpleHTTPServer 8000
```

## Option 2: Node.js HTTP Server

```bash
# Install http-server globally
npm install -g http-server

# Navigate to project directory
cd dispatch-ai-copilot

# Start server
http-server -p 8000

# Open browser to: http://localhost:8000
```

## Option 3: PHP Built-in Server

```bash
# Navigate to project directory
cd dispatch-ai-copilot

# Start PHP server
php -S localhost:8000

# Open browser to: http://localhost:8000
```

## Option 4: Live Server (VS Code Extension)

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. Browser will open automatically

## Ollama Setup (Optional)

If you want to use real AI analysis:

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull a Model**:
   ```bash
   ollama pull llama3.2
   # or
   ollama pull mistral
   ```
3. **Start Ollama**:
   ```bash
   ollama serve
   ```
4. **Update Model** (optional): Edit `ollama-integration.js` line 5:
   ```javascript
   this.model = 'mistral'; // Change to your preferred model
   ```

## Testing the Setup

1. **Without Ollama**: App works perfectly with intelligent mock AI
2. **With Ollama**: Enhanced AI analysis with real language model
3. **CORS Fixed**: No more browser security errors

## Troubleshooting

### CORS Error
- **Problem**: "Access to fetch at 'http://localhost:11434/api/tags' from origin 'null' has been blocked by CORS policy"
- **Solution**: Use HTTP server instead of opening file directly

### Ollama Connection
- **Problem**: "Ollama not available, using mock AI"
- **Solution**: 
  1. Install and start Ollama
  2. Use HTTP server (not file://)
  3. Check if Ollama is running: `ollama list`

### Port Conflicts
- **Problem**: Port 8000 already in use
- **Solution**: Use different port: `python -m http.server 8080`

## Demo Recommendations

### For Hackathon Demo
1. **Use Python HTTP server** (easiest setup)
2. **Test without Ollama first** (mock AI works great)
3. **Add Ollama for enhanced demo** (optional)
4. **Have backup scenarios ready** (see demo-scenarios.md)

### For Production
1. **Use proper web server** (Apache, Nginx, etc.)
2. **Configure CORS headers** for Ollama
3. **Add authentication** if needed
4. **Implement proper error handling**

## File Structure After Setup
```
dispatch-ai-copilot/
├── index.html
├── styles.css
├── script.js
├── ollama-integration.js
├── README.md
├── demo-scenarios.md
└── server-setup.md
```

## Quick Start Commands

```bash
# Clone/download the project
cd dispatch-ai-copilot

# Start HTTP server
python -m http.server 8000

# In another terminal (optional - for Ollama)
ollama serve

# Open browser
# http://localhost:8000
```

The app will work perfectly with mock AI even without Ollama, providing realistic emergency dispatch analysis!
