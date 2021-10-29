'use strict'
const multer = require('multer');
const path = require('path')

const storage = multer.memoryStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, req.body.userId + '-' + new Date().toISOString().replace(/:/g, '_') + '-' + file.originalname)
    }
});

const upload = multer({
    storage: storage, fileFilter: (req, file, cb) => {
        const filetypes = /mp4|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        } else {
            cb({ message: 'File format not supported please upload mp4, jpeg or png' }, false);
        }
    }
});

module.exports = {
    upload
}