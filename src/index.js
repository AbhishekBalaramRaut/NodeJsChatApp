const path  = require('path');
const http = require('http');
const express  =  require('express');
const socketio  =  require('socket.io');
const Filter  =  require('bad-words');
const {generateMessage,generateLocationMessage} = require('./utils/messages');
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
// io.attach(server, {
//     pingInterval: 10000,
//     pingTimeout: 5000,
//     cookie: false
//   });
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname,'../public');

app.use(express.static(publicDirectoryPath));

let count = 0;

io.on('connection', (socket) => {

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options});

        if(error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message',generateMessage('Admin','Welcome!'));
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`));
        io.to(user.room).emit('roomdata',{
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });

    socket.on('sendMessage', (message,callback) => {
        const user = getUser(socket.id);

        const filter  = new Filter();

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        if(user) {
            io.to(user.room).emit('message', generateMessage(user.username, message));
        }
       
        callback();
    })

    socket.on('sendLocation', (coords,callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('url', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })

    // socket.on('countInc', () => {
    //     count++;
    //     io.emit('countupdated', count);
    // });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message',generateMessage('Admin', `${user.username} has left`));
            io.to(user.room).emit('roomdata',{
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});



server.listen(port,() => {
    console.log(`Server is listening on port ${port}`);
})