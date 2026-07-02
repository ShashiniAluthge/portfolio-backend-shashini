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

module.exports = { getAbout, getEducation, getExperience };