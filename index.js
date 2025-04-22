require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const initializeSocket = require("./utils/socket");

const app = express();
const server = http.createServer(app);
// Initialize Socket.io
initializeSocket(server);

// Middleware
// ✅ CORS CONFIG - Allow cookies to be sent
app.use(
  cors({
    origin: ["http://localhost:5173", "https://healthcarebd2.netlify.app"],
    credentials: true, // ✅ must be true to send cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ JWT Issuer Endpoint

// Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
