const pool = require('../db');

const getAbout = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT title, description FROM about ORDER BY id DESC LIMIT 1'
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'About content not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getEducation = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, institution, faculty, qualification, description, start_year, end_year
             FROM education
             ORDER BY display_order ASC`
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const addEducation = async (req, res) => {
    try {
        const { institution, faculty, qualification, description, start_year, end_year, display_order } = req.body;
        if (!institution) return res.status(400).json({ error: 'institution is required' });

        const result = await pool.query(
            `INSERT INTO education (institution, faculty, qualification, description, start_year, end_year, display_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                institution,
                faculty ?? null,
                qualification ?? null,
                description ?? null,
                start_year ?? null,
                end_year ?? null,
                display_order ?? 1,
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateEducation = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await pool.query('SELECT * FROM education WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Education entry not found' });

        const old = existing.rows[0];
        const institution = req.body.institution ?? old.institution;
        const faculty = req.body.faculty ?? old.faculty;
        const qualification = req.body.qualification ?? old.qualification;
        const description = req.body.description ?? old.description;
        const start_year = req.body.start_year ?? old.start_year;
        const end_year = req.body.end_year ?? old.end_year;
        const display_order = req.body.display_order ?? old.display_order;

        const result = await pool.query(
            `UPDATE education
             SET institution=$1, faculty=$2, qualification=$3, description=$4,
                 start_year=$5, end_year=$6, display_order=$7
             WHERE id=$8 RETURNING *`,
            [institution, faculty, qualification, description, start_year, end_year, display_order, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getExperience = async (req, res) => {
    try {
        const experienceResult = await pool.query(
            `SELECT id, company, position, start_date, end_date, currently_working
             FROM experience
             ORDER BY display_order ASC`
        );

        const experiences = experienceResult.rows;

        const enriched = await Promise.all(
            experiences.map(async (exp) => {
                const contributionsResult = await pool.query(
                    `SELECT icon, title, description
                     FROM experience_contributions
                     WHERE experience_id = $1
                     ORDER BY display_order ASC`,
                    [exp.id]
                );

                const technologiesResult = await pool.query(
                    `SELECT technology
                     FROM experience_technologies
                     WHERE experience_id = $1`,
                    [exp.id]
                );

                return {
                    ...exp,
                    contributions: contributionsResult.rows,
                    technologies: technologiesResult.rows.map((row) => row.technology),
                };
            })
        );

        res.json(enriched);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getAbout, getEducation, updateEducation, addEducation, getExperience };