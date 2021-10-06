'use strict'
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, req.body.userId + '-' + new Date().toISOString().replace(/:/g, '_') + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

module.exports = {
    upload
}