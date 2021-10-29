const AWS = require('aws-sdk');
const config = require('../../config');
const path = require('path')


let uploadFile = async (req, res) => {
    let s3bucket = new AWS.S3({
        accessKeyId: config.awsKey,
        secretAccessKey: config.awsSecret,
    });
    let params
    console.log(/mp4/.test(path.extname(req.file.originalname).toLowerCase()))
    if (/mp4/.test(path.extname(req.file.originalname).toLowerCase())) {
        params = {
            Bucket: "dazolive", //Bucket Name
            Key: req.body.userId + '-' + new Date().toISOString().replace(/:/g, '_') + '-' + req.file.originalname.replace(/\s/g, '-'),
            ACL: 'public-read',
            Body: req.file.buffer,
            ContentLength: req.file.size
        };

    } else {
        params = {
            Bucket: "dazolive", //Bucket Name
            Key: 'profilepic/' + req.body.userId + '-' + new Date().toISOString().replace(/:/g, '_') + '-' + req.file.originalname.replace(/\s/g, '-'),
            ACL: 'public-read',
            Body: req.file.buffer,
            ContentLength: req.file.size
        };

    }

    console.log(params)

    let s3UploadDetails = await new Promise((resolve) => {
        s3bucket.upload(params, (err, result) => {
            if (err) {
                let apiResponse = { status: true, description: "Failed to upload image", statusCode: 500, data: err.message }
                res.send(apiResponse)
            } else {
                result.s3Filename = params.Key
                resolve(result)
            }
        })
    })

    return s3UploadDetails

}

let mediaConvert = async (req, res) => {
    AWS.config.update({
        region: 'ap-south-1',
        accessKeyId: config.awsKey,
        secretAccessKey: config.awsSecret,
    });
    AWS.config.mediaconvert = { endpoint: 'https://idej2gpma.mediaconvert.ap-south-1.amazonaws.com' };

    let uploadDetails = await uploadFile(req, res)
    console.log(uploadDetails)
    let params = {
        "Queue": "arn:aws:mediaconvert:ap-south-1:991963335719:queues/Default",
        "UserMetadata": {},
        "Role": "arn:aws:iam::991963335719:role/service-role/dazo_live_full",
        "Settings": {
            "TimecodeConfig": {
                "Source": "ZEROBASED"
            },
            "OutputGroups": [
                {
                    "CustomName": "dazolive",
                    "Name": "Apple HLS",
                    "Outputs": [
                        {
                            "Preset": "System-Avc_16x9_540p_29_97fps_3500kbps",
                            "OutputSettings": {
                                "HlsSettings": {
                                    "SegmentModifier": "d"
                                }
                            },
                            "NameModifier": "-dazolive"
                        }
                    ],
                    "OutputGroupSettings": {
                        "Type": "HLS_GROUP_SETTINGS",
                        "HlsGroupSettings": {
                            "SegmentLength": 10,
                            "Destination": "s3://dazolive/reels/",
                            "MinSegmentLength": 0
                        }
                    }
                }
            ],
            "Inputs": [
                {
                    "AudioSelectors": {
                        "Audio Selector 1": {
                            "DefaultSelection": "DEFAULT"
                        }
                    },
                    "VideoSelector": {},
                    "TimecodeSource": "ZEROBASED",
                    "FileInput": `s3://dazolive/${uploadDetails.s3Filename}`
                }
            ]
        },
        "AccelerationSettings": {
            "Mode": "DISABLED"
        },
        "StatusUpdateInterval": "SECONDS_60",
        "Priority": 0
    }

    let endpointPromise = await new AWS.MediaConvert({ apiVersion: '2017-08-29' }).createJob(params).promise();

    let jobDetails = await checkStatus(endpointPromise.Job.Id, uploadDetails.s3Filename)
    jobDetails.Job.FilePath = uploadDetails.Location
    return jobDetails
}

let checkStatus = (jobId, s3Filename) => {
    return new Promise((resolve, reject) => {
        getJobByID(jobId, s3Filename).then(data => {
            if (data.Job.Status !== 'COMPLETE') {
                console.log(data.Job.Status)
                setTimeout(() => {
                    resolve(checkStatus(jobId, s3Filename))
                }, 500)
            } else {
                console.log(data.Job.Status)
                resolve(data)
            }
        }).catch(err => {
            reject(err)
        })
    })
}

let getJobByID = async (jobId, s3Filename) => {
    AWS.config.update({
        region: 'ap-south-1',
        accessKeyId: config.awsKey,
        secretAccessKey: config.awsSecret,
    });
    AWS.config.mediaconvert = { endpoint: 'https://idej2gpma.mediaconvert.ap-south-1.amazonaws.com' };

    let params = {
        Id: jobId
    }

    let jobDetails = await new AWS.MediaConvert({ apiVersion: '2017-08-29' }).getJob(params).promise()
    jobDetails.Job.PlaybackURL = `https://dazolive.s3.ap-south-1.amazonaws.com/reels/${s3Filename.replace('.mp4', '-dazolive.m3u8')}`
    return jobDetails
}


module.exports = {
    uploadFile,
    mediaConvert
}