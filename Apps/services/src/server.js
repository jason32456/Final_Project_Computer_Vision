const express = require('express');
const cors = require('cors');
const courseRoutes = require('./routes/courseRoute');
const attendanceRoutes = require('./routes/attendanceRoute');
const env = require('dotenv');

env.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mount the routes
app.use('/courses', courseRoutes);
app.use('/attendance', attendanceRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});