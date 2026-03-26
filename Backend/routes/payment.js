const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const verifyToken = require('../middleware/verifyToken');

const EXPECTED_AMOUNTS = {
  monthly: 2900,
  yearly: 24900,
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const router = express.Router();

router.use(verifyToken);

router.post('/mock-success', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Mock payment route is available only in development' });
  }

  const { plan } = req.body;

  if (!['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: "Plan must be either 'monthly' or 'yearly'" });
  }

  const now = Date.now();
  return res.json({
    data: {
      verified: true,
      razorpay_order_id: `mock_order_${now}`,
      razorpay_payment_id: `mock_pay_${now}`,
      razorpay_signature: 'mock_signature',
    },
  });
});

router.post('/create-order', async (req, res) => {
  try {
    const { amount, plan } = req.body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: "Plan must be either 'monthly' or 'yearly'" });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount !== EXPECTED_AMOUNTS[plan]) {
      return res.status(400).json({ error: 'Invalid amount for selected plan' });
    }

    const order = await razorpay.orders.create({
      amount: normalizedAmount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { plan, user_id: req.user.id },
    });

    return res.json({
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: "Plan must be either 'monthly' or 'yearly'" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    return res.json({ data: { verified: true } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;
