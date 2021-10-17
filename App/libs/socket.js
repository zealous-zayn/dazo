const socketServer = require('socket.io');
const redisLib = require('./redisLib')

module.exports.setSocketServer = (server) => {

    let io = new socketServer.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    io.on('error', e => console.log(e))

    io.on("connection", socket => {
        socket.on("broadcaster", (name) => {
            let broadcaster = socket.id;
            redisLib.setANewLiveUserInHash('liveuser', broadcaster, name, (err, result) => {
                if (err) {
                    console.log(`some error occurred while setting user in redis`)
                    console.log(err)
                }

                console.log(result)
            })
            socket.broadcast.emit("broadcaster", socket.id);
        });

        socket.on("getLiveUser", () => {
            console.log("get user")
            redisLib.getAllLiveUsersInAHash('liveuser', (err, result) => {
                if (err) {
                    console.log(`some error occurred while getting user in redis`)
                    console.log(err)
                }

                io.sockets.emit("getLiveUser", result)
            })
        })

        socket.on('message', (liveUser, id, msgObj) => {
            console.log(msgObj)
            socket.broadcast.emit(`${liveUser}-msg`, msgObj)
            socket.to(id).emit('live-msg', msgObj)
        })

        socket.on('viewer', (name, id) => {
            console.log(name)
            io.sockets.emit(`${name}`, id)
        })

        socket.on("watcher", (id) => {
            socket.to(id).emit("watcher", socket.id);
        });
        socket.on("offer", (id, message) => {
            socket.to(id).emit("offer", socket.id, message);
        });
        socket.on("answer", (id, message) => {
            socket.to(id).emit("answer", socket.id, message);
        });
        socket.on("candidate", (id, message) => {
            socket.to(id).emit("candidate", socket.id, message);
        });
        socket.on("disconnect", () => {
            socket.to(socket.id).emit("disconnectPeer", socket.id);
            redisLib.deleteUserFromHash('liveuser', socket.id)
        });
    });
}