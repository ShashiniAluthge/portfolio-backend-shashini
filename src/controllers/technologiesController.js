const pool = require('../db');
const { cloudinary } = require('../config/cloudinary');

const getAllTechnologies = async (req, res) => {
    try {
        const { category } = req.query;
        let query = `
            SELECT t.id, t.name, t.image_url, t.display_order, t.created_at,
                   tc.name AS category_name, tc.slug AS category_slug
            FROM technologies t
            LEFT JOIN tech_categories tc ON t.tech_category_id = tc.id
        `;
        const values = [];
        if (category) { query += ` WHERE tc.slug = $1`; values.push(category); }
        query += ` ORDER BY tc.id ASC, t.display_order ASC`;
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getGroupedTechnologies = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.id, t.name, t.image_url, t.display_order, t.created_at,
                   tc.name AS category_name, tc.slug AS category_slug
            FROM technologies t
            LEFT JOIN tech_categories tc ON t.tech_category_id = tc.id
            ORDER BY tc.id ASC, t.display_order ASC
        `);
        const grouped = result.rows.reduce((acc, row) => {
            const key = row.category_slug || 'uncategorized';
            if (!acc[key]) acc[key] = [];
            acc[key].push(row);
            return acc;
        }, {});
        res.json(grouped);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getTechnologyById = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.id, t.name, t.image_url, t.display_order, t.created_at,
                    tc.name AS category_name, tc.slug AS category_slug
             FROM technologies t
             LEFT JOIN tech_categories tc ON t.tech_category_id = tc.id
             WHERE t.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Technology not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const createTechnology = async (req, res) => {
    try {
        const { name, tech_category_id, display_order } = req.body;
        if (!name || !tech_category_id) return res.status(400).json({ error: 'name and tech_category_id are required' });
        const image_url = req.file ? req.file.path : null;
        const result = await pool.query(
            `INSERT INTO technologies (name, image_url, tech_category_id, display_order)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, image_url, tech_category_id, display_order ?? 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateTechnology = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await pool.query('SELECT * FROM technologies WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Technology not found' });
        const old = existing.rows[0];
        const name             = req.body.name             || old.name;
        const tech_category_id = req.body.tech_category_id || old.tech_category_id;
        const display_order    = req.body.display_order    ?? old.display_order;
        let image_url = old.image_url;
        if (req.file) {
            if (image_url) {
                const publicId = image_url.split('/').slice(-3).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            image_url = req.file.path;
        }
        const result = await pool.query(
            `UPDATE technologies SET name=$1, image_url=$2, tech_category_id=$3, display_order=$4
             WHERE id=$5 RETURNING *`,
            [name, image_url, tech_category_id, display_order, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteTechnology = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await pool.query('SELECT * FROM technologies WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Technology not found' });
        const image_url = existing.rows[0].image_url;
        if (image_url) {
            const publicId = image_url.split('/').slice(-3).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
        await pool.query('DELETE FROM technologies WHERE id = $1', [id]);
        res.json({ message: 'Technology deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getAllTechnologies, getGroupedTechnologies, getTechnologyById, createTechnology, updateTechnology, deleteTechnology };