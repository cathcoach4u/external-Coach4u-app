require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mount routes
app.use('/api', require('./routes/vto'));
app.use('/api', require('./routes/accountability'));
app.use('/api', require('./routes/rocks'));
app.use('/api', require('./routes/scorecard'));
app.use('/api', require('./routes/l10'));
app.use('/api', require('./routes/issues'));
app.use('/api', require('./routes/ai'));
app.use('/api', require('./routes/alignment'));
app.use('/api', require('./routes/businesses'));

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Strategic Hub running at http://localhost:${PORT}`);
});
