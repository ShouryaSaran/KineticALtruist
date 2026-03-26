const express = require('express');
const supabase = require('../lib/supabase');
const { runDraw } = require('../lib/drawEngine');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

const router = express.Router();

router.use(verifyToken);
router.use(verifyAdmin);

router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ data: users || [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/draws', async (req, res) => {
  try {
    const { data: draws, error } = await supabase
      .from('draws')
      .select('*')
      .order('draw_date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ data: draws || [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

router.post('/draws/run', async (req, res) => {
  try {
    const { mode } = req.body || {};
    const result = await runDraw({ mode });
    return res.json({ data: result });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to run draw' });
  }
});

router.post('/draws/simulate', async (req, res) => {
  try {
    const { mode } = req.body || {};
    const result = await runDraw({ simulate: true, mode });
    return res.json({ data: result });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to simulate draw' });
  }
});

router.get('/winners', async (req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from('winners')
      .select('id, user_id, draw_id, match_type, prize_amount, proof_url, payout_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const drawIds = [...new Set((winners || []).map((winner) => winner.draw_id).filter(Boolean))];

    let drawDateMap = new Map();
    if (drawIds.length) {
      const { data: draws, error: drawsError } = await supabase
        .from('draws')
        .select('id, draw_date')
        .in('id', drawIds);

      if (drawsError) {
        return res.status(400).json({ error: drawsError.message });
      }

      drawDateMap = new Map((draws || []).map((draw) => [draw.id, draw.draw_date]));
    }

    const normalizedWinners = (winners || []).map((winner) => ({
      ...winner,
      draw_date: drawDateMap.get(winner.draw_id) || null,
    }));

    return res.json({ data: normalizedWinners });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch winners' });
  }
});

router.post('/charities', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      image_url: imageUrl,
      active,
    } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { data: createdCharity, error } = await supabase
      .from('charities')
      .insert({
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        category: typeof category === 'string' ? category.trim() : null,
        image_url: typeof imageUrl === 'string' ? imageUrl.trim() : null,
        active: Boolean(active),
      })
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ data: createdCharity });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create charity' });
  }
});

router.put('/charities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      image_url: imageUrl,
      active,
    } = req.body;

    const { data: updatedCharity, error } = await supabase
      .from('charities')
      .update({
        ...(typeof name === 'string' ? { name: name.trim() } : {}),
        ...(typeof description === 'string' ? { description: description.trim() } : {}),
        ...(typeof category === 'string' ? { category: category.trim() } : {}),
        ...(typeof imageUrl === 'string' ? { image_url: imageUrl.trim() } : {}),
        ...(typeof active === 'boolean' ? { active } : {}),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!updatedCharity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    return res.json({ data: updatedCharity });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update charity' });
  }
});

router.delete('/charities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: deletedCharity, error } = await supabase
      .from('charities')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!deletedCharity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    return res.json({ data: { success: true } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete charity' });
  }
});

router.patch('/winners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { payout_status: payoutStatus } = req.body;
    const normalizedStatus = (payoutStatus || '').toString().trim().toLowerCase();
    const allowedStatuses = ['pending', 'approved', 'rejected', 'paid'];

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ error: 'payout_status is required' });
    }

    const { data: existingWinner, error: existingWinnerError } = await supabase
      .from('winners')
      .select('id, payout_status, proof_url')
      .eq('id', id)
      .maybeSingle();

    if (existingWinnerError) {
      return res.status(400).json({ error: existingWinnerError.message });
    }

    if (!existingWinner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    if ((normalizedStatus === 'approved' || normalizedStatus === 'paid') && !existingWinner.proof_url) {
      return res.status(400).json({ error: 'Winner proof is required before approval/payment' });
    }

    const { data: updatedWinner, error } = await supabase
      .from('winners')
      .update({ payout_status: normalizedStatus })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!updatedWinner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    return res.json({ data: updatedWinner });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update winner payout status' });
  }
});

module.exports = router;
