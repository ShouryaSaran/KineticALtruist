const express = require('express');
const supabase = require('../lib/supabase');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { data: draws, error } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('draw_date', { ascending: false }); 

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ data: draws || [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const { data: latestDraw, error } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'published') 
      .order('draw_date', { ascending: false }) 
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!latestDraw) {
      return res.status(404).json({ error: 'No published draws found' });
    }

    return res.json({ data: latestDraw });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch latest draw' });
  }
});

module.exports = router;
