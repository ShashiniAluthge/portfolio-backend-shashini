const express = require('express');
const router = express.Router();
const { getAbout, getEducation, updateEducation, addEducation, getExperience } = require('../controllers/aboutController');

router.get('/', getAbout);
router.get('/education', getEducation);
router.post('/education', addEducation);
router.put('/education/:id', updateEducation);
router.get('/experience', getExperience);



module.exports = router;