require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/priorities',  require('./routes/priorities'));
app.use('/api/kpis',        require('./routes/kpis'));
app.use('/api/meetings',    require('./routes/meetings'));
app.use('/api/notes',       require('./routes/notes'));
app.use('/api/files',       require('./routes/files'));
app.use('/api/ai',          require('./routes/ai'));

// SPA catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`The People Hub running at http://localhost:${PORT}`);
});
