const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');

const utils = require('../utils/uploadS3');

const UserModel = mongoose.model('User');
const LiveModel = mongoose.model('Live');
const FollowingModel = mongoose.model('Following')

let nanoId = nanoid.customAlphabet('0123456789ABCDEFGabcdefg_', 8);

let goLive = asyncHandler(async (req, res) => {
    let retrievedUserDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.userId) {
            let userDetails = await UserModel.findOneAndUpdate({ userId: req.body.userId }, { isLive: true }, { new: true }).select('-password -__v -_id')
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No Details Found or Your have not registered yet', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(userDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"userId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }))

    await new Promise(asyncHandler(async (resolve) => {
        let newLiveDetails = await new LiveModel({
            liveId: nanoId(),
            userId: retrievedUserDetails.userId,
            invitePkList: JSON.parse(req.body.invitePkList),
            liveTitle: req.body.liveTitle,
            liveImage: req.files.liveImage ? await utils.uploadFile(req.files.liveImage[0], `liveimage/${retrievedUserDetails.userId}`) : '',
            sponserBanner: req.files.sponserBanner ? await utils.uploadFile(req.files.sponserBanner[0], `sponserbanner/${retrievedUserDetails.userId}`) : '',
            startTime: new Date(Date.now()).getTime()
        })
        await newLiveDetails.save()
        let liveObj = newLiveDetails.toObject()
        delete liveObj._id
        delete liveObj.createdAt
        delete liveObj.updatedAt
        delete liveObj.__v
        let apiResponse = { status: true, description: 'live created', statusCode: 200, data: liveObj };
        res.send(apiResponse)
    }))
})

let endLive = asyncHandler(async (req, res) => {
    let retrievedUserDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.userId) {
            let userDetails = await UserModel.findOneAndUpdate({ userId: req.body.userId }, { isLive: false }, { new: true }).select('-password -__v -_id')
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No Details Found or Your have not registered yet', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(userDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"userId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }))

    await new Promise(asyncHandler(async (resolve) => {
        if (req.body.liveId) {
            req.body.endTime = Date.now()
            req.body.totalDuration = Math.abs(new Date(parseInt(req.body.startDate)) - new Date(req.body.endTime))
            let liveDetails = await LiveModel.findOneAndUpdate({ liveId: req.body.liveId }, req.body, { new: true }).select('-_id -__v -createdAt -updatedAt')
            if (!liveDetails) {
                let apiResponse = { status: false, description: 'No Live Details Found', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                let apiResponse = { status: true, description: "Live ended", statusCode: 200, data: liveDetails }
                res.send(apiResponse)
            }
        } else {
            let apiResponse = { status: false, description: '"liveId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }))

})

let getAllLiveUsers = asyncHandler(async (req, res) => {
    let pageNo = parseInt(req.query.pageNo);
    let limit = parseInt(req.query.limit);
    let endKey = null;
    let userLiveCollection
    if (!req.query.endKey) {
        userLiveCollection = await UserModel.aggregate(
            [
                {
                    $match:
                    {
                        isLive: true
                    }
                },
                {
                    $lookup:
                    {
                        from: "lives",
                        let: { user_id: "$userId", end_time: null },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$userId",
                                                    "$$user_id"
                                                ]
                                            },
                                            {
                                                $eq: [
                                                    "$endTime",
                                                    "$$end_time"
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            { $sort: { createdAt: -1 } }
                        ],
                        as: "liveDetails"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        userId: "$userId",
                        lifeTimeExperiance: "$lifeTimeExperiance",
                        invitePkList: { $arrayElemAt: ["$liveDetails.invitePkList", 0] },
                        liveTitle: { $arrayElemAt: ["$liveDetails.liveTitle", 0] },
                        liveImage: { $arrayElemAt: ["$liveDetails.liveImage", 0] },
                        sponserBanner: { $arrayElemAt: ["$liveDetails.sponserBanner", 0] },
                        startTime: { $arrayElemAt: ["$liveDetails.startTime", 0] },
                    }
                }
            ]
        ).sort({ '_id': 1, 'lifeTimeExperiance': 1 })
            .limit(limit);
    } else {
        userLiveCollection = await UserModel.aggregate(
            [
                {
                    $match:
                    {
                        isLive: true,
                        _id: { $gt: mongoose.Types.ObjectId(req.query.endKey) }
                    }
                },
                {
                    $lookup:
                    {
                        from: "lives",
                        let: { user_id: "$userId", end_time: null },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$userId",
                                                    "$$user_id"
                                                ]
                                            },
                                            {
                                                $eq: [
                                                    "$endTime",
                                                    "$$end_time"
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            { $sort: { createdAt: -1 } }
                        ],
                        as: "liveDetails"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        userId: "$userId",
                        lifeTimeExperiance: "$lifeTimeExperiance",
                        invitePkList: { $arrayElemAt: ["$liveDetails.invitePkList", 0] },
                        liveTitle: { $arrayElemAt: ["$liveDetails.liveTitle", 0] },
                        liveImage: { $arrayElemAt: ["$liveDetails.liveImage", 0] },
                        sponserBanner: { $arrayElemAt: ["$liveDetails.sponserBanner", 0] },
                        startTime: { $arrayElemAt: ["$liveDetails.startTime", 0] },
                    }
                }
            ]
        ).sort({ '_id': 1, 'lifeTimeExperiance': 1 })
            .limit(limit);
    }

    endKey = await userLiveCollection[userLiveCollection.length - 1]._id

    let userCounts = await UserModel.count({ isLive: true })
    let totalPages = Math.ceil(userCounts / limit)

    let resposneObj = {
        liveUsers: userLiveCollection,
        nextUrl: pageNo !== totalPages ? `/get-all-live-users?pageNo=${pageNo + 1}&limit=${limit}&endKey=${endKey}` : null,
        nextPage: pageNo !== totalPages,
        totalPages: totalPages
    }

    let apiResponse = { status: true, description: "All Live users details", statusCode: 200, data: resposneObj }
    res.send(apiResponse)
})

let getFollowedLiveUsers = asyncHandler(async (req, res) => {
    let pageNo = parseInt(req.query.pageNo);
    let limit = parseInt(req.query.limit);
    let startIndex = (pageNo - 1) * limit;
    let endKey = null;
    let userLiveCollection
        userLiveCollection = await UserModel.aggregate(
            [
                {
                    $match:{
                        isLive:true
                    }
                },
                {
                    $lookup: {
                        from: "lives",
                        from: "lives",
                            let: { user_id: "$userId", end_time: null },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$userId",
                                                        "$$user_id"
                                                    ]
                                                },
                                                {
                                                    $eq: [
                                                        "$endTime",
                                                        "$$end_time"
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                },
                                { $sort: { createdAt: -1 } }
                            ],
                        as: "liveUsers"
                    }
                },
                {
                    $unwind: {
                        path: "$liveUsers"
                    }
                },
                { $sort : { createdAt : 1 } },
                {
                    $lookup: {
                        from: "followings",
                        let: { follow_id: "$liveUsers.userId",  },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and:[
                                            {
                                                 $eq: ["$userId", req.query.userId]
                                            },
                                            {
                                                $eq:["$followingId","$$follow_id"]
                                            }
                                        ]
                                    }
                                }
                            }
                        ], 
                        as: "followingUsers"
                    }
                },
                {
                    $unwind: {
                        path: "$followingUsers"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        userId: "$userId",
                        lifeTimeExperiance: "$lifeTimeExperiance",
                        invitePkList: "$liveUsers.invitePkList",
                        liveTitle: "$liveUsers.liveTitle",
                        liveImage: "$liveUsers.liveImage",
                        sponserBanner: "$liveUsers.sponserBanner",
                        startTime: "$liveUsers.startTime",
                    }
                }
            ]
        ).sort({ '_id': 1, 'lifeTimeExperiance': 1 })
        .skip(startIndex)
        .limit(limit);

    

    let apiResponse = { status: true, 
        description: "All followed Live users details", 
        statusCode: 200, data: userLiveCollection.length>=1 ? userLiveCollection :"No more data to show" }
    res.send(apiResponse)
})

module.exports = {
    goLive,
    endLive,
    getAllLiveUsers,
    getFollowedLiveUsers
}