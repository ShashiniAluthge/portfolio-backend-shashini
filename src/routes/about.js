const express = require('express');
const router = express.Router();
const { getAbout, getEducation, getExperience } = require('../controllers/aboutController');

router.get('/', getAbout);
router.get('/education', getEducation);
router.get('/experience', getExperience);

module.exports = router;