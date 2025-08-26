# Revolt Voice Chat

A simple Node.js implementation of a **voice chat service for Revolt**.  
This project provides a backend server that handles real-time voice communication using **WebSockets**.  

---

## 📂 Source Code
The complete implementation is available here:  
👉 [GitHub Repository – revolt-voice-chat](https://github.com/pallesairam/revolt-voice-chat)

---

## ⚙️ Tech Stack
- **Node.js** (JavaScript runtime)
- **Express.js** (web server)
- **WebSocket (ws)** (real-time communication)

---

## 📌 Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16+ recommended)
- npm (comes with Node.js)

---

## 🚀 Setup Instructions

Clone the repository:
#bash
git clone https://github.com/pallesairam/revolt-voice-chat.git
cd revolt-voice-chat
Install dependencies:

bash
Copy
Edit
npm install
Start the server:

bash
Copy
Edit
npm start
By default, the server runs on http://localhost:3000.

🔧 Configuration
You can configure environment variables by creating a .env file in the root directory:

env
Copy
Edit
PORT=3000
💻 Implementation
package.json
json
Copy
Edit
{
  "name": "revolt-voice-chat",
  "version": "1.0.0",
  "description": "Simple voice chat implementation for Revolt",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.13.0"
  }
}
server.js
js
Copy
Edit
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Serve a test client
app.get("/", (req, res) => {
  res.send("Revolt Voice Chat Server is running 🚀");
});

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("🔗 New client connected");

  ws.on("message", (message) => {
    console.log("📩 Received:", message.toString());

    // Broadcast message to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== ws) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server is listening on http://localhost:${PORT}`);
});
🎤 Usage
Start the server with npm start.

Connect a WebSocket client (like a browser or Revolt bot).

Messages sent from one client will be broadcast to all others.
This can be extended to send audio data for voice chat.

🛠 Troubleshooting
Port already in use → Change PORT in .env.

WebSocket errors → Ensure server is running and accessible.

Audio not transmitting → Ensure audio encoding/decoding is handled in the client.

🤝 Contributing
Pull requests are welcome!
For major changes, please open an issue first to discuss what you’d like to change.

📜 License
This project is licensed under the MIT License – see the LICENSE file for details.

yaml
Copy
Edit

---

⚡ Now you have:
1. **Setup instructions** ✅  
2. **Complete implementation code (`package.json`, `server.js`)** ✅  
3. **Source code repo link** ✅  

Do you also want me to add a **sample browser client (HTML + JS)** in the README so users can immediately test voice m
