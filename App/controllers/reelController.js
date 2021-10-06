const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

const config = require('../../config')

const ReelModel = mongoose.model('Reel');
const UserModel = mongoose.model('User');

let nanoId = nanoid.customAlphabet('0123456789ABCDEFGabcdefg_', 8);
const fileSizeFormatter = (bytes, decimal) => {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const dm = decimal || 2;
    const size = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'YB', 'ZB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1000));
    return parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + ' ' + size[index]
}

const uploadReel = asyncHandler(async (req, res) => {
    let userDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.userId) {
            let details = await UserModel.findOne({ userId: req.body.userId });
            if (!details) {
                let apiResponse = { status: false, description: 'No user found with this user Id', statusCode: 200, data: null }
                res.send(apiResponse)
                fs.unlinkSync(path.join(config.directoryPath + '/' + req.file.path))
            } else {
                resolve(details)
            }
        } else {
            let apiResponse = { status: false, description: '"userId" is missing', statusCode: 200, data: null }
            res.send(apiResponse)
            fs.unlinkSync(path.join(config.directoryPath + '/' + req.file.path))
        }
    }))
    await new Promise(asyncHandler(async (resolve) => {
        let reelIdGenerated = nanoId();
        let newReel = new ReelModel({
            reelId: reelIdGenerated,
            userId: userDetails.userId,
            fileName: req.file.originalname,
            filePath: path.join(config.directoryPath + '/' + req.file.path),
            downloadPath: `/download-ree/${reelIdGenerated}`,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 4),
            fileSizeBytes: req.file.size
        })

        await newReel.save()
        let apiResponse = { status: true, description: "new reel created", statusCode: 200, data: newReel.toObject() }
        res.send(apiResponse)
    }))
})

const downloadReel = asyncHandler(async (req, res) => {
    let reelsDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.params.reelId) {
            let details = await ReelModel.findOne({ reelId: req.params.reelId })
            if (!details) {
                let apiResponse = { status: false, description: 'No reel found with this reel Id', statusCode: 200, data: null }
                res.send(apiResponse)
            } else {
                resolve(details)
            }
        } else {
            let apiResponse = { status: false, description: '"reelId" is missing', statusCode: 200, data: null }
            res.send(apiResponse)
        }
    }))

    await new Promise(asyncHandler(async (resolve) => {
        if (req.headers.range) {
            const parts = req.headers.range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1] !== ''
                ? parseInt(parts[1], 10)
                : reelsDetails.fileSizeBytes - 1
            const chunksize = (end - start) + 1
            const file = fs.createReadStream(reelsDetails.filePath, { start, end })
            const head = {
                'Content-Range': `bytes ${start}-${end}/${reelsDetails.fileSizeBytes}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': reelsDetails.fileSizeBytes,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(200, head)
            fs.createReadStream(reelsDetails.filePath).pipe(res)
        }
    }))
})

let getReelsByUser = (asyncHandler(async (req, res) => {
    let userDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.params.userId) {
            let details = await UserModel.findOne({ userId: req.params.userId });
            if (!details) {
                let apiResponse = { status: false, description: 'No user found with this user Id', statusCode: 200, data: null }
                res.send(apiResponse)
            } else {
                resolve(details)
            }
        } else {
            let apiResponse = { status: false, description: '"userId" is missing', statusCode: 200, data: null }
            res.send(apiResponse)
        }
    }))
    let reels = await new Promise(asyncHandler(async (resolve) => {
        let reelsDetails = await ReelModel.find({ userId: userDetails.userId }).sort({ createdAt: -1 })
        if (!reelsDetails) {
            let apiResponse = { status: false, description: 'No reel found for this user', statusCode: 200, data: null }
            res.send(apiResponse)
        } else {
            resolve(reelsDetails)
        }
    }))

    let apiResponse = { status: true, description: 'All reels of this user', statusCode: 200, data: reels }
    res.send(apiResponse)
}))

let getReels = (asyncHandler(async (req, res) => {
    let pageNo = parseInt(req.query.pageNo);
    let limit = parseInt(req.query.limit);
    let endKey = null;
    let reelCollection
    if (!req.query.endKey) {
        reelCollection = await ReelModel.find({})
            .sort({ '_id': 1 })
            .limit(limit);
    } else {
        reelCollection = await ReelModel.find({ _id: { $gt: mongoose.Types.ObjectId(req.query.endKey) } })
            .sort({ '_id': 1 })
            .limit(limit);
    }

    reelCollection.forEach(reel => {
        endKey = reel._id
    })

    let reelCounts = await ReelModel.count()
    let totalPages = Math.ceil(reelCounts / limit)

    let resposneObj = {
        reels: reelCollection,
        nextUrl: pageNo !== totalPages ? `/download-reel/?pageNo=${pageNo + 1}&limit=${limit}&endKey=${endKey}` : null,
        nextPage: pageNo !== totalPages,
        totalPages: totalPages
    }

    let apiResponse = { status: true, description: "reels details", statusCode: 200, data: resposneObj }
    res.send(apiResponse)

}))

module.exports = {
    uploadReel,
    downloadReel,
    getReels,
    getReelsByUser
}