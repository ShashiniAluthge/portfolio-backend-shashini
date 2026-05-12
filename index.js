const express = require('express');
const cors = require('cors');
require('dotenv').config();

const projectRoutes = require('./src/routes/projects');
const categoryRoutes = require('./src/routes/categories');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Portfolio API running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});