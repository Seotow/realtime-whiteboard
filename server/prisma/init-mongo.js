// MongoDB initialization script
// This script will run when the MongoDB container starts for the first time

// Switch to the whiteboard database
db = db.getSiblingDB('whiteboard');

// Create a user for the application
db.createUser({
  user: 'whiteboardapp',
  pwd: 'apppassword123',
  roles: [
    {
      role: 'readWrite',
      db: 'whiteboard'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.boards.createIndex({ "userId": 1 });
db.boards.createIndex({ "createdAt": -1 });
db.sessions.createIndex({ "userId": 1 });
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

console.log('MongoDB initialization completed successfully');
