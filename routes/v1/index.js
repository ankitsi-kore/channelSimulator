const express = require('express');
const path = require('path');
const handler = require('../../controllers/handler');
const multer = require('multer');

const uploadDestination = path.join(__dirname, '../', '../', '/testcases');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDestination);
    },
    filename: function (req, file, cb) {
        const originalname = 'tests.json';
        cb(null, originalname);
    }
});

const upload = multer({ storage: storage });
const router = express.Router();

router.post('/testcase', upload.single('testcases'), handler.fetchTestCases);
router.post('/callback/:callbackId', handler.asyncBotResponse);
router.post('/asynctesting/callback/:callbackId', handler.asyncTestingResponse);
router.get('/channels', handler.getChannels);
router.post('/channels', handler.addChannel);

module.exports = router;
