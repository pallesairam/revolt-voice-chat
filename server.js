const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const wss = new WebSocket.Server({ server });

const SYSTEM_INSTRUCTIONS = `You are Rev, the AI assistant for Revolt Motors, India's leading electric motorcycle company. 

Key information about Revolt Motors:
- We manufacture AI-enabled electric motorcycles like the RV400, RV1, and RV BlazeX
- Our flagship RV400 has a range of 150km, top speed of 85kmph, and takes 4.5 hours to fully charge
- We offer features like mobile app control, voice commands, GPS tracking, and AI-powered diagnostics
- We're present in 25+ cities across India
- Our mission is to make clean commuting accessible to the masses
- You can book a bike for just ₹499

Keep your responses brief and conversational (1-2 sentences typically), focused on Revolt Motors products and services, enthusiastic about electric mobility. If asked about topics outside Revolt Motors, politely redirect back to our electric motorcycles.`;

wss.on('connection', (clientWs) => {
  console.log('Client connected');
  let geminiWs = null;
  
  const connectToGemini = async () => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found');
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'Server configuration error'
      }));
      return;
    }
    
    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
    
    try {
      geminiWs = new WebSocket(geminiUrl);
      
      geminiWs.on('open', () => {
        console.log('Connected to Gemini Live API');
        
        const setupMessage = {
          setup: {
            model: "models/gemini-2.0-flash-live-001",
            generation_config: {
              response_modalities: ["TEXT"],
            },
            system_instruction: {
              parts: [{ text: SYSTEM_INSTRUCTIONS }]
            }
          }
        };
        
        geminiWs.send(JSON.stringify(setupMessage));
      });
      
      geminiWs.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received from Gemini:', Object.keys(message));
          
          if (message.setupComplete) {
            console.log('Gemini setup completed');
            clientWs.send(JSON.stringify({ type: 'setup_complete' }));
            return;
          }
          
          if (message.serverContent && message.serverContent.modelTurn) {
            console.log('Processing model turn response');
            const parts = message.serverContent.modelTurn.parts || [];
            console.log('Parts received:', parts.length);
            
            parts.forEach((part, index) => {
              console.log(`Part ${index}:`, Object.keys(part));
              
              if (part.text) {
                console.log('Text response:', part.text);
                // Send text to client for speech synthesis
                clientWs.send(JSON.stringify({
                  type: 'text_to_speech',
                  text: part.text
                }));
              }
            });
          }
          
          if (message.serverContent && message.serverContent.interrupted) {
            console.log('Interruption detected');
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
          
          if (message.serverContent && message.serverContent.turnComplete) {
            console.log('Turn completed');
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }
          
        } catch (error) {
          console.error('Error parsing Gemini message:', error);
        }
      });
      
      geminiWs.on('error', (error) => {
        console.error('Gemini WebSocket error:', error);
        clientWs.send(JSON.stringify({
          type: 'error',
          message: 'Connection to AI service failed'
        }));
      });
      
      geminiWs.on('close', (code, reason) => {
        console.log('Disconnected from Gemini Live API:', code, reason.toString());
      });
      
    } catch (error) {
      console.error('Failed to connect to Gemini:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'Failed to initialize AI service'
      }));
    }
  };
  
  clientWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received from client:', message.type, 'Data length:', message.data ? message.data.length : 0);
      
      if (message.type === 'audio' && geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        console.log('Forwarding audio to Gemini...');
        const geminiMessage = {
          realtime_input: {
            media_chunks: [{
              mime_type: "audio/pcm",
              data: message.data
            }]
          }
        };
        geminiWs.send(JSON.stringify(geminiMessage));
      } else if (message.type === 'audio') {
        console.log('Cannot forward audio - Gemini not ready:', geminiWs?.readyState);
      }
      
      if (message.type === 'clear_session') {
        if (geminiWs) {
          geminiWs.close();
        }
        setTimeout(() => connectToGemini(), 100);
      }
      
    } catch (error) {
      console.error('Error handling client message:', error);
    }
  });
  
  clientWs.on('close', () => {
    console.log('Client disconnected');
    if (geminiWs) {
      geminiWs.close();
    }
  });
  
  connectToGemini();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}`);
  console.log('Make sure GEMINI_API_KEY is set in .env');
});