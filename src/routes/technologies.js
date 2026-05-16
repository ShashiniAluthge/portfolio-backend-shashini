const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
    getAllTechnologies,
    getGroupedTechnologies,
    getTechnologyById,
    createTechnology,
    updateTechnology,
    deleteTechnology,
} = require('../controllers/technologiesController');

// GET /api/technologies/grouped  — must be before /:id
router.get('/grouped', getGroupedTechnologies);

router.get('/', getAllTechnologies);
router.get('/:id', getTechnologyById);
router.post('/', upload.single('image'), createTechnology);
router.put('/:id', upload.single('image'), updateTechnology);
router.delete('/:id', deleteTechnology);

module.exports = router;