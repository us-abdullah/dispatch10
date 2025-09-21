# Ollama Setup Guide for DispatchAI Copilot

## Quick Setup (5 minutes)

### 1. Install Ollama
```bash
# Download from https://ollama.ai or use package manager
# Windows: Download installer from website
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Start Ollama Service
```bash
ollama serve
```
Keep this terminal open - Ollama needs to stay running.

### 3. Pull a Model
```bash
# Recommended models (choose one):
ollama pull llama3.2        # Best balance of speed/quality
ollama pull mistral         # Fast and efficient
ollama pull codellama       # Good for structured responses
```

### 4. Test the Setup
```bash
# Open test-ollama.html in your browser
# Or run the main app with HTTP server:
python -m http.server 8000
# Then open http://localhost:8000
```

## Detailed Setup

### Model Recommendations

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `llama3.2` | ~2GB | Fast | High | General use, JSON responses |
| `mistral` | ~4GB | Medium | High | Complex analysis |
| `codellama` | ~4GB | Medium | High | Structured data |
| `llama3.1` | ~2GB | Fast | Medium | Lightweight option |

### Verify Installation

1. **Check if Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Test a simple prompt:**
   ```bash
   ollama run llama3.2 "Hello, are you working?"
   ```

3. **Use the test page:**
   - Open `test-ollama.html` in your browser
   - Click "Test Ollama Connection"
   - Should show available models

### Troubleshooting

#### Ollama Not Starting
```bash
# Check if port 11434 is in use
netstat -an | grep 11434

# Kill any processes using the port
sudo lsof -ti:11434 | xargs kill -9

# Restart Ollama
ollama serve
```

#### Model Not Found
```bash
# List installed models
ollama list

# Pull the model again
ollama pull llama3.2

# Verify it's available
ollama show llama3.2
```

#### CORS Issues
- Make sure you're using HTTP server, not opening file directly
- Use `python -m http.server 8000` or similar
- Open `http://localhost:8000` not `file:///path/to/index.html`

#### Memory Issues
- Use smaller models: `llama3.2` instead of `llama3.1`
- Close other applications
- Increase swap space if needed

### Performance Optimization

#### For Better Speed
```bash
# Use GPU acceleration (if available)
export OLLAMA_GPU=1
ollama serve

# Use specific model
ollama pull llama3.2:3b  # Smaller, faster model
```

#### For Better Quality
```bash
# Use larger model
ollama pull mistral:7b
ollama pull llama3.1:8b
```

### Integration with DispatchAI

The app automatically detects Ollama and switches between:
- **Ollama AI** (🧠) - Real language model analysis
- **Mock AI** (🤖) - Intelligent fallback system

#### Status Indicators
- **Green badge**: Mock AI active (works offline)
- **Red badge**: Ollama AI active (requires Ollama running)

#### Console Logs
Check browser console for detailed logs:
- `Ollama is available` - Connection successful
- `Using mock AI analysis` - Fallback active
- `Successfully parsed Ollama response` - AI analysis complete

### Advanced Configuration

#### Custom Model
Edit `ollama-integration.js` line 5:
```javascript
this.model = 'your-custom-model';
```

#### API Endpoint
Edit `ollama-integration.js` line 4:
```javascript
this.baseUrl = 'http://your-ollama-server:11434/api';
```

#### Response Formatting
The app is optimized for JSON responses. If using different models, you may need to adjust the prompts in `ollama-integration.js`.

### Production Deployment

#### Docker Setup
```dockerfile
FROM ollama/ollama:latest
RUN ollama pull llama3.2
EXPOSE 11434
CMD ["ollama", "serve"]
```

#### Reverse Proxy
```nginx
location /api/ {
    proxy_pass http://localhost:11434/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Testing Scenarios

Use these test cases to verify everything works:

1. **Armed Robbery** (High Priority Police)
2. **House Fire** (High Priority Fire)  
3. **Medical Emergency** (High Priority Medical)
4. **Noise Complaint** (Low Priority Police)
5. **Traffic Accident** (Medium Priority Police)

Each should generate:
- Urgent brief with priority level
- Detailed incident summary
- Relevant follow-up questions
- Proper unit routing suggestions
- Accurate confidence scoring

### Support

If you encounter issues:

1. **Check the test page**: `test-ollama.html`
2. **Review console logs**: Browser developer tools
3. **Verify Ollama**: `ollama list` and `ollama serve`
4. **Test connection**: `curl http://localhost:11434/api/tags`

The app works perfectly with Mock AI even without Ollama, so you can always fall back to that for demos!
