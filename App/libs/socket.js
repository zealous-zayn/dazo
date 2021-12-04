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
        socket.on("broadcaster", (userId) => {
            let userData = {
                viewersCount:0,
                comments:[]
            }
            redisLib.setANewLiveUserInHash('liveuser', userId,JSON.stringify(userData), (err, result) => {
                if (err) {
                    console.log(`some error occurred while setting user in redis`)
                    console.log(err)
                }
                console.log(`${userId} has been set in cache`)
                console.log(result)
            })
        });

        socket.on('message', (dataObj) => {
            let obj = JSON.parse(dataObj)
            let liveUserDetails
            redisLib.getAll('liveuser', obj.liveUserId,(err, result) => {
                if (err) {
                    console.log(`some error occurred while getting user in redis`)
                    console.log(err)
                }
                liveUserDetails = JSON.parse(result)
                liveUserDetails.comments.push({userId:obj.userId,userName:obj.userName,message:obj.message})
            redisLib.setANewLiveUserInHash('liveuser', obj.liveUserId,JSON.stringify(liveUserDetails), (err, result) => {
                if (err) {
                    console.log(`some error occurred while setting user in redis`)
                    console.log(err)
                }
                console.log(`${obj.liveUserId} has been set in cache`)
            })
            })
        })

        socket.on('get-message',(dataObj)=>{
            console.log(socket.id)
            let obj = JSON.parse(dataObj);
            redisLib.getAll('liveuser', obj.liveUserId,(err, result) => {
                if (err) {
                    console.log(`some error occurred while getting user in redis`)
                    console.log(err)
                }
                liveUserDetails = JSON.parse(result)
                let messages = liveUserDetails.comments.slice(Math.max(liveUserDetails.comments.length - parseInt(obj.numberOfMsgs), 0))
                io.to(socket.id).emit(`${obj.liveUserId}-get-message`,messages)
            })
        })

        socket.on('viewer', (dataObj) => {
            let obj = JSON.parse(dataObj)
            let liveUserDetails
            redisLib.getAll('liveuser', obj.liveUserId,(err, result) => {
                if (err) {
                    console.log(`some error occurred while getting user in redis`)
                    console.log(err)
                }
                liveUserDetails = JSON.parse(result)
                liveUserDetails.viewersCount = liveUserDetails.viewersCount+1
            redisLib.setANewLiveUserInHash('liveuser', obj.liveUserId,JSON.stringify(liveUserDetails), (err, result) => {
                if (err) {
                    console.log(`some error occurred while setting user in redis`)
                    console.log(err)
                }
                console.log(`${obj.liveUserId} has been set in cache`)
                obj.totalViewing = liveUserDetails.viewersCount
                io.sockets.emit(`${obj.liveUserId}-viewer`, obj)
            })
            })
        })

        
        socket.on('send-gift',(dataObj)=>{
            let obj = JSON.parse(dataObj)
            socket.broadcast.emit(`${obj.liveUserId}-received-gift`, obj)
        })

        socket.on('send-like',(dataObj)=>{
            let obj = JSON.parse(dataObj)
            socket.broadcast.emit(`${obj.liveUserId}-received-like`, obj)
        })

        socket.on("disconnect", () => {
            socket.to(socket.id).emit("disconnectPeer", socket.id);
            //redisLib.deleteUserFromHash('liveuser', socket.id)
        });
    });
}