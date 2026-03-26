require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const scoresRoutes = require('./routes/scores');
const drawsRoutes = require('./routes/draws');
const charitiesRoutes = require('./routes/charities');
const paymentRoutes = require('./routes/payment');
const subscriptionsRoutes = require('./routes/subscriptions');
const winningsRoutes = require('./routes/winnings');
const adminRoutes = require('./routes/admin');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/draws', drawsRoutes);
app.use('/api/charities', charitiesRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/winnings', winningsRoutes);
app.use('/api/admin', adminRoutes);

const port = process.env.PORT || 5000;

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
