const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
} = require('../controllers/projectsController');

router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', upload.single('image'), createProject);
router.put('/:id', upload.single('image'), updateProject);
router.delete('/:id', deleteProject);

module.exports = router;