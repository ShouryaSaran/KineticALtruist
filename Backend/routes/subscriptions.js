const express = require('express');
const supabase = require('../lib/supabase');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.get('/me', async (req, res) => {
  try {
    const nowIso = new Date().toISOString();

    await supabase
      .from('subscriptions')
      .update({ status: 'inactive' })
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .lt('ends_at', nowIso);

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const subscription = (subscriptions || [])[0] || null;
    return res.json({ data: subscription });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { plan, razorpay_order_id, razorpay_payment_id, amount } = req.body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: "Plan must be either 'monthly' or 'yearly'" });
    }

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a valid positive number' });
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + (plan === 'monthly' ? 30 : 365));

    const nowIso = startsAt.toISOString();

    // Mark all old subscriptions as inactive (including both truly expired and active ones being replaced)
    const { error: expireError } = await supabase
      .from('subscriptions')
      .update({ status: 'inactive' })
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    if (expireError) {
      return res.status(400).json({ error: expireError.message });
    }

    const { data: createdSubscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: req.user.id,
        plan,
        status: 'active',
        amount,
        razorpay_order_id,
        razorpay_payment_id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ data: createdSubscription });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
});

module.exports = router;
