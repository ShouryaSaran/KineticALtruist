const express = require('express');
const supabase = require('../lib/supabase');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data: charities, error } = await supabase.from('charities').select('*');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ data: charities || [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch charities' });
  }
});

router.get('/user', verifyToken, async (req, res) => {
  try {
    const { data: contributions, error } = await supabase
      .from('charity_contributions')
      .select('percentage, created_at, charities(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const selected = (contributions || [])[0] || null;
    if (!selected || !selected.charities) {
      return res.json({ data: null });
    }

    return res.json({
      data: {
        ...selected.charities,
        contribution_percentage: selected.percentage,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user charity' });
  }
});

router.post('/select', verifyToken, async (req, res) => {
  try {
    const { charity_id: charityId, percentage } = req.body;

    if (!charityId) {
      return res.status(400).json({ error: 'charity_id is required' });
    }

    const percent = Number(percentage);
    if (!Number.isFinite(percent) || percent < 10 || percent > 100) {
      return res.status(400).json({ error: 'percentage must be between 10 and 100' });
    }

    const { data: charity, error: charityError } = await supabase
      .from('charities')
      .select('id')
      .eq('id', charityId)
      .maybeSingle();

    if (charityError) {
      return res.status(400).json({ error: charityError.message });
    }

    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    const { data: contribution, error } = await supabase
      .from('charity_contributions')
      .upsert(
        {
          user_id: req.user.id,
          charity_id: charityId,
          percentage: percent,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ data: contribution });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save charity selection' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: charity, error } = await supabase.from('charities').select('*').eq('id', id).maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    return res.json({ data: charity });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch charity' });
  }
});

module.exports = router;
