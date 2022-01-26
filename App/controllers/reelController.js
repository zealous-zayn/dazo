const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');
const fs = require('fs');

const utils = require('../utils/uploadS3');

const ReelModel = mongoose.model('Reel');
const UserModel = mongoose.model('User');
const LikeModel = mongoose.model('Like');
const CommentModel = mongoose.model('Comment');

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
            } else {
                resolve(details)
            }
        } else {
            let apiResponse = { status: false, description: '"userId" is missing', statusCode: 200, data: null }
            res.send(apiResponse)
        }
    }))

    let mediaConvertDetails = await utils.mediaConvert(req, res)

    await new Promise(asyncHandler(async (resolve) => {
        let reelIdGenerated = nanoId();
        let newReel = await new ReelModel({
            reelId: reelIdGenerated,
            userId: userDetails.userId,
            profilePic: userDetails.profilePic ? userDetails.profilePic : "",
            userName: userDetails.firstName + ' ' + userDetails.lastName,
            caption: req.body.caption,
            fileName: req.file.originalname,
            filePath: mediaConvertDetails.Job.FilePath,
            downloadPath: mediaConvertDetails.Job.PlaybackURL,
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

let getReelsByUser = asyncHandler(async (req, res) => {
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
})

let getReels = asyncHandler(async (req, res) => {
    let pageNo = parseInt(req.query.pageNo);
    let limit = parseInt(req.query.limit);
    let endKey = null;
    let reelCollection
    if (!req.query.endKey) {
        reelCollection = await ReelModel.aggregate(
            [
                {
                    $lookup:
                    {
                        from: "likes",
                        let: { reel_id: "$reelId", flag: true },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$reelId",
                                                    "$$reel_id"
                                                ]
                                            },
                                            {
                                                $eq: [
                                                    "$liked",
                                                    "$$flag"
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "likeDetails"
                    }
                },
                {
                    $lookup:
                    {
                        from: "likes",
                        let: { reel_id: "$reelId", user_id: req.query.userId },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$reelId",
                                                    "$$reel_id"
                                                ]
                                            },
                                            {
                                                $eq: [
                                                    "$userId",
                                                    "$$user_id"
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "likeDetailsAsUser"
                    }
                },
                {
                    $lookup:
                    {
                        from: "comments",
                        localField: "reelId",
                        foreignField: "reelId",
                        as: "commentDetails"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        reelId: "$reelId",
                        userId: "$userId",
                        caption: "$caption",
                        isLiked: {
                            $cond: {
                                if: {
                                    $eq: [{ $size: "$likeDetailsAsUser" }, 0],
                                },
                                then: false,
                                else: { $arrayElemAt: ["$likeDetailsAsUser.liked", 0] }
                            }
                        },
                        fileName: "$fileName",
                        fileSize: "$fileSize",
                        fileType: "$fileType",
                        downloadPath: "$downloadPath",
                        totalViews: "$view",
                        totalLikes: { $size: "$likeDetails" },
                        totalComment: { $size: "$commentDetails" },
                        createdAt: "$createdAt"
                    }
                }
            ]
        )
            .sort({ '_id': 1 })
            .limit(limit);
    } else {
        reelCollection = await ReelModel.aggregate([
            {
                $match:
                {
                    _id:
                        { $gt: mongoose.Types.ObjectId(req.query.endKey) }
                }
            },
            {
                $lookup:
                {
                    from: "likes",
                    let: { reel_id: "$reelId", flag: false },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$reelId",
                                                "$$reel_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$liked",
                                                "$$flag"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "likeDetails"
                }
            },
            {
                $lookup:
                {
                    from: "likes",
                    let: { reel_id: "$reelId", user_id: req.query.userId },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$reelId",
                                                "$$reel_id"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$userId",
                                                "$$user_id"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "likeDetailsAsUser"
                }
            },
            {
                $lookup:
                {
                    from: "comments",
                    localField: "reelId",
                    foreignField: "reelId",
                    as: "commentDetails"
                }
            },
            {
                $project: {
                    _id: 1,
                    reelId: "$reelId",
                    userId: "$userId",
                    caption: "$caption",
                    isLiked: {
                        $cond: {
                            if: {
                                $eq: [{ $size: "$likeDetailsAsUser" }, 0],
                            },
                            then: false,
                            else: { $arrayElemAt: ["$likeDetailsAsUser.liked", 0] }
                        }
                    },
                    profilePic: "$profilePic",
                    userName:"$userName",
                    fileName: "$fileName",
                    fileSize: "$fileSize",
                    fileType: "$fileType",
                    downloadPath: "$downloadPath",
                    totalViews: "$view",
                    totalLikes: { $size: "$likeDetails" },
                    totalComment: { $size: "$commentDetails" },
                    createdAt: "$createdAt"
                }
            }
        ])
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
        nextUrl: pageNo !== totalPages ? `/get-all-reel?userId=${req.query.userId}&pageNo=${pageNo + 1}&limit=${limit}&endKey=${endKey}` : null,
        nextPage: pageNo !== totalPages,
        totalPages: totalPages
    }

    let apiResponse = { status: true, description: "reels details", statusCode: 200, data: resposneObj }
    res.send(apiResponse)

})

let likeReels = asyncHandler(async (req, res) => {
    await new Promise(asyncHandler(async (resolve) => {
        let reelDetails = await ReelModel.findOne({ reelId: req.body.reelId })
        if (!reelDetails) {
            let apiResponse = { status: false, description: 'No reel present with this reel id', statusCode: 404, data: [] }
            res.send(apiResponse)
        } else {
            let userDetails = await UserModel.findOne({ userId: req.body.userId })
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No user present with this user id', statusCode: 404, data: [] }
                res.send(apiResponse)
            } else {
                resolve(reelDetails)
            }
        }
    }))

    let likeResolvedDetails = await new Promise(asyncHandler(async (resolve) => {
        let likeDetails = await LikeModel.find({ reelId: req.body.reelId, userId: req.body.userId })
        if (likeDetails.length !== 0) {
            let updateLikeDetails = await LikeModel.findOneAndUpdate({ reelId: req.body.reelId }, { liked: req.body.liked }, { new: true })
            resolve(updateLikeDetails)
        } else {
            let likeNewDetails = await new LikeModel({
                reelId: req.body.reelId,
                userId: req.body.userId,
                liked: req.body.liked
            })

            let details = likeNewDetails.save()
            resolve(details)
        }
    }))

    let apiResponse = { status: true, description: 'Like status created', statusCode: 200, data: likeResolvedDetails }
    res.send(apiResponse)
})

let getReelLikeByUser = asyncHandler(async (req, res) => {
    await new Promise(asyncHandler(async (resolve) => {
        let reelDetails = await ReelModel.find({ reelId: req.query.reelId })
        if (!reelDetails) {
            let apiResponse = { status: false, description: 'No reel present with this reel id', statusCode: 404, data: [] }
            res.send(apiResponse)
        } else {
            let userDetails = await UserModel.find({ userId: req.query.userId })
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No user present with this user id', statusCode: 404, data: [] }
                res.send(apiResponse)
            } else {
                resolve(reelDetails)
            }
        }
    }))

    let details = await new Promise(asyncHandler(async (resolve) => {
        let likeDetails = await LikeModel.find({ reelId: req.query.reelId, userId: req.query.userId })
        if (!likeDetails) {
            let apiResponse = { status: false, description: 'User has not liked this reel', statusCode: 404, data: [] }
            res.send(apiResponse)
        } else {
            resolve(likeDetails)
        }
    }))

    let apiResponse = { status: true, description: 'like details', statusCode: 200, data: details };
    res.send(apiResponse)
})

let viewReels = asyncHandler(async (req, res) => {
    let reelResolvedDetails = await new Promise(asyncHandler(async (resolve) => {
        let reelDetails = await ReelModel.findOne({ reelId: req.query.reelId })
        if (!reelDetails) {
            let apiResponse = { status: false, description: 'No reel present with this reel id', statusCode: 404, data: [] }
            res.send(apiResponse)
        } else {
            let userDetails = await UserModel.findOne({ userId: req.query.userId })
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No user present with this user id', statusCode: 404, data: [] }
                res.send(apiResponse)
            } else {
                resolve(reelDetails)
            }
        }
    }))
    let viewDetails = await new Promise(asyncHandler(async (resolve) => {
        let details = await ReelModel.findOneAndUpdate({ reelId: reelResolvedDetails.reelId }, { $inc: { view: 1 } }, { new: true }).select('-_id -__v -filePath')
        resolve(details)
    }))

    let apiResponse = { status: true, description: 'View details updated', statusCode: 200, data: viewDetails };
    res.send(apiResponse)
})

let commentReel = asyncHandler(async (req, res) => {
    let reelDetails = await new Promise(asyncHandler(async (resolve) => {
        let reelDetails = await ReelModel.findOne({ reelId: req.body.reelId })
        if (!reelDetails) {
            let apiResponse = { status: false, description: 'No reel present with this reel id', statusCode: 404, data: [] }
            res.send(apiResponse)
        } else {
            let userDetails = await UserModel.findOne({ userId: req.body.userId })
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No user present with this user id', statusCode: 404, data: [] }
                res.send(apiResponse)
            } else {
                resolve(reelDetails)
            }
        }
    }))

    let commentResolvedDetails = await new Promise(asyncHandler(async (resolve) => {
        let commentDetails = await CommentModel.find({ reelId: reelDetails.reelId, userId: reelDetails.userId });
        if (commentDetails.length !== 0) {
            let updateComment = await CommentModel.findOneAndUpdate({ reelId: reelDetails.reelId, userId: reelDetails.userId }, { comment: req.body.comment }, { new: true })
            resolve({ data: updateComment, desc: "Comment Updated Successfully" })
        } else {
            let newComment = await new CommentModel({
                commentId: nanoId(),
                reelId: reelDetails.reelId,
                userId: reelDetails.userId,
                comment: req.body.comment
            })

            let commentNewDetails = await newComment.save()
            resolve({ data: commentNewDetails, desc: "Comment Created Successfully" })
        }
    }))

    let apiResponse = { status: true, description: commentResolvedDetails.desc, statusCode: 200, data: commentResolvedDetails.data };
    res.send(apiResponse)
})

let getAllCommentsByReel = asyncHandler(async (req, res) => {
    let commentDetails = await CommentModel.find({ reelId: req.params.reelId })
    if (!commentDetails) {
        let apiResponse = { status: false, description: 'No comments present with this reel id', statusCode: 404, data: [] }
        res.send(apiResponse)
    } else {
        let apiResponse = { status: true, description: 'All Comment Details', statusCode: 200, data: commentDetails }
        res.send(apiResponse)
    }
})

module.exports = {
    uploadReel,
    downloadReel,
    getReels,
    getReelsByUser,
    likeReels,
    getReelLikeByUser,
    viewReels,
    commentReel,
    getAllCommentsByReel
}
