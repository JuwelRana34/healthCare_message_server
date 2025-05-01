const { Server } = require("socket.io");
const ADMIN_EMAIL = "admin@gmail.com";

// Data structures
let users = {};
let adminSocketId = null;
let conversations = {}; 

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin:'*',
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        },
    });

    io.on("connection", (socket) => {
        // console.log("New client connected:", socket.id);

        // --- User Connection and Disconnection ---
        socket.on("userJoined", (user) => {
            users[user.email] = { socketId: socket.id, name: user.name, photo: user.photo };
            // console.log(`User ${user.email} joined`);

            if (user.email === ADMIN_EMAIL) {
                adminSocketId = socket.id;
                // console.log("Admin connected");
                if (adminSocketId) {
                    io.to(adminSocketId).emit("allConversations", conversations);
                }
            } else {
                if (adminSocketId) {
                    io.to(adminSocketId).emit("newUser", user);
                }
            }
        });

        socket.on("disconnect", () => {
            let disconnectedUserEmail = null;
            for (const email in users) {
                if (users[email].socketId === socket.id) {
                    disconnectedUserEmail = email;
                    delete users[email];
                    break;
                }
            }

            if (disconnectedUserEmail === ADMIN_EMAIL) {
                adminSocketId = null;
                console.log("Admin disconnected");
            }
            // console.log(`User ${disconnectedUserEmail} disconnected`);
        });

        // --- Message Handling ---
        socket.on("sendMessageToAdmin", ({ sender, message }) => {
            const timestamp = new Date();
            if (!conversations[sender]) {
                conversations[sender] = [];
            }
            conversations[sender].push({ sender, message, timestamp });

            if (adminSocketId) {
                io.to(adminSocketId).emit("newMessageFromUser", { userEmail: sender, messages: conversations[sender] });
            } else {
                // console.log("Admin is not online");
            }
        });

        socket.on("sendMessageToUser", ({ receiver, message }) => {
            const timestamp = new Date();
            if (!conversations[receiver]) {
                conversations[receiver] = [];
            }
            conversations[receiver].push({ sender: ADMIN_EMAIL, message, timestamp });

            if (users[receiver]) {
                io.to(users[receiver].socketId).emit("receiveMessage", { sender: ADMIN_EMAIL, message });
            } else {
                // console.log(`User ${receiver} is not online`);
            }
        });

        // --- Admin Specific ---
        socket.on("adminSelectUser", (userEmail) => {
            if (conversations[userEmail]) {
                io.to(adminSocketId).emit("loadConversation", { userEmail, messages: conversations[userEmail] });
            } else {
                io.to(adminSocketId).emit("loadConversation", { userEmail, messages: [] });
            }
        });
    });

    return io;
};

module.exports = initializeSocket;
