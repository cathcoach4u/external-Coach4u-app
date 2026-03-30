require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/team'));
app.use('/api', require('./routes/strategy'));
app.use('/api', require('./routes/quarterly'));
app.use('/api', require('./routes/campaigns'));
app.use('/api', require('./routes/content'));
app.use('/api', require('./routes/metrics'));
app.use('/api', require('./routes/personas'));
app.use('/api', require('./routes/ai'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`The Growth Hub running at http://localhost:${PORT}`);
});
