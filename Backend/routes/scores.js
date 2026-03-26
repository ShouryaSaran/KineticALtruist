const express = require('express');
const supabase = require('../lib/supabase');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { data: scores, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', req.user.id)
      .order('played_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ data: scores || [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { score, date, played_at: playedAt } = req.body;
    const normalizedPlayedAt = playedAt || date || new Date().toISOString();

    if (typeof score !== 'number' || score < 1 || score > 45) {
      return res.status(400).json({ error: 'Score must be a number between 1 and 45' });
    }

    const { data: existingScores, error: fetchError } = await supabase
      .from('scores')
      .select('id, played_at')
      .eq('user_id', req.user.id)
      .order('played_at', { ascending: true });

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if ((existingScores || []).length >= 5) {
      const oldestScore = existingScores[0];

      const { error: deleteError } = await supabase.from('scores').delete().eq('id', oldestScore.id);

      if (deleteError) {
        return res.status(400).json({ error: deleteError.message });
      }
    }

    const { data: newScore, error: insertError } = await supabase
      .from('scores')
      .insert({
        user_id: req.user.id,
        score,
        played_at: normalizedPlayedAt,
      })
      .select('*')
      .single();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    return res.status(201).json({ data: newScore });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add score' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingScore, error: findError } = await supabase
      .from('scores')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (findError) {
      return res.status(400).json({ error: findError.message });
    }

    if (!existingScore) {
      return res.status(404).json({ error: 'Score not found' });
    }

    const { error: deleteError } = await supabase
      .from('scores')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    return res.json({ data: { success: true } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete score' });
  }
});

module.exports = router;
