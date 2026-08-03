const pool = require('../db');
const { cloudinary } = require('../config/cloudinary');

const getAllProjects = async (req, res) => {
    try {
        const { category } = req.query;

        let query = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.tech_stack,
        p.github_url,
        p.live_url,
        p.image_url,
        p.project_type,
        p.created_at,
        c.name AS category_name,
        c.slug AS category_slug
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
        const values = [];

        if (category) {
            query += ` WHERE c.slug = $1`;
            values.push(category);
        }

        query += ` ORDER BY p.created_at ASC`;

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getProjectById = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
        p.id,
        p.title,
        p.description,
        p.tech_stack,
        p.github_url,
        p.live_url,
        p.image_url,
        p.project_type,
        p.created_at,
        c.name AS category_name,
        c.slug AS category_slug
       FROM projects p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createProject = async (req, res) => {
    try {
        const { title, description, tech_stack, github_url, live_url, category_id, project_type } = req.body;

        const image_url = req.file ? req.file.path : null;

        // handles both JSON array and comma-separated string from form-data
        let techArray = [];
        if (Array.isArray(tech_stack)) {
            techArray = tech_stack;
        } else if (typeof tech_stack === 'string') {
            techArray = tech_stack.split(',').map((t) => t.trim());
        }

        const result = await pool.query(
            `INSERT INTO projects
        (title, description, tech_stack, github_url, live_url, image_url, category_id, project_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [
                title,
                description,
                techArray,
                github_url || null,
                live_url || null,
                image_url,
                category_id,
                project_type || null,
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;

        // first get the existing project
        const existing = await pool.query(
            'SELECT * FROM projects WHERE id = $1', [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const old = existing.rows[0];

        // use incoming value if provided, otherwise keep the existing value
        const title = req.body.title || old.title;
        const description = req.body.description || old.description;
        const github_url = req.body.github_url || old.github_url;
        const live_url = req.body.live_url || old.live_url;
        const category_id = req.body.category_id || old.category_id;
        const project_type = req.body.project_type || old.project_type;

        // handle tech_stack
        let tech_stack = old.tech_stack;
        if (req.body.tech_stack) {
            if (Array.isArray(req.body.tech_stack)) {
                tech_stack = req.body.tech_stack;
            } else {
                tech_stack = req.body.tech_stack.split(',').map((t) => t.trim());
            }
        }

        // handle image — only update if a new file is uploaded
        let image_url = old.image_url;
        if (req.file) {
            if (image_url) {
                const publicId = image_url
                    .split('/')
                    .slice(-3)
                    .join('/')
                    .split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            image_url = req.file.path;
        }

        const result = await pool.query(
            `UPDATE projects
       SET title=$1, description=$2, tech_stack=$3, github_url=$4,
           live_url=$5, image_url=$6, category_id=$7, project_type=$8
       WHERE id=$9
       RETURNING *`,
            [title, description, tech_stack, github_url, live_url, image_url, category_id, project_type, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await pool.query(
            'SELECT * FROM projects WHERE id = $1', [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // delete image from Cloudinary before removing from DB
        const image_url = existing.rows[0].image_url;
        if (image_url) {
            const publicId = image_url
                .split('/')
                .slice(-3)
                .join('/')
                .split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
};