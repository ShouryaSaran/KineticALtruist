const express = require('express');
const supabase = require('../lib/supabase');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.get('/me', async (req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from('winners')
      .select('id, prize_amount, match_type, payout_status, proof_url, created_at, draw_id, draws(draw_date)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const winnings = (winners || []).map((winner) => ({
      id: winner.id,
      prize_amount: winner.prize_amount,
      match_type: winner.match_type,
      payout_status: winner.payout_status,
      proof_url: winner.proof_url,
      created_at: winner.created_at,
      draw_id: winner.draw_id,
      draw_date: winner.draws?.draw_date || null,
    }));

    return res.json({ data: winnings });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch winnings' });
  }
});

router.patch('/:id/proof', async (req, res) => {
  try {
    const { id } = req.params;
    const { proof_url } = req.body;
    const normalizedProofUrl = (proof_url || '').toString().trim();

    if (!normalizedProofUrl) {
      return res.status(400).json({ error: 'proof_url is required' });
    }

    try {
      const parsed = new URL(normalizedProofUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'proof_url must be a valid http/https URL' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'proof_url must be a valid URL' });
    }

    const { data: existingWinner, error: existingWinnerError } = await supabase
      .from('winners')
      .select('id, payout_status')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (existingWinnerError) {
      return res.status(400).json({ error: existingWinnerError.message });
    }

    if (!existingWinner) {
      return res.status(404).json({ error: 'Winning record not found' });
    }

    const payoutStatus = (existingWinner.payout_status || '').toString().toLowerCase();
    if (!['pending', 'rejected'].includes(payoutStatus)) {
      return res.status(400).json({ error: 'Proof cannot be changed after approval/payment' });
    }

    const { data: updatedWinner, error } = await supabase
      .from('winners')
      .update({ proof_url: normalizedProofUrl })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id, prize_amount, match_type, payout_status, proof_url, created_at, draw_id')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ data: updatedWinner });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update proof URL' });
  }
});

module.exports = router;
