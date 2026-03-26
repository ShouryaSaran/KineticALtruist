const supabase = require('./supabase');
const { calculatePrizePool } = require('./prizePool');

function generateRandomDrawNumbers() {
  try {
    const selected = new Set();
    while (selected.size < 5) {
      const next = Math.floor(Math.random() * 45) + 1;
      selected.add(next);
    }
    return Array.from(selected).sort((a, b) => a - b);
  } catch (error) {
    throw new Error(`Failed to generate draw numbers: ${error.message}`);
  }
}

function generateAlgorithmicDrawNumbers(scores) {
  try {
    const frequency = new Map();
    for (const row of Array.isArray(scores) ? scores : []) {
      const score = toSafeNumber(row?.score);
      if (score < 1 || score > 45) continue;
      frequency.set(score, (frequency.get(score) || 0) + 1);
    }

    const ranked = Array.from(frequency.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0] - b[0];
      })
      .map((item) => item[0]);

    const selected = new Set(ranked.slice(0, 5));
    while (selected.size < 5) {
      selected.add(Math.floor(Math.random() * 45) + 1);
    }

    return Array.from(selected).sort((a, b) => a - b);
  } catch (error) {
    throw new Error(`Failed to generate algorithmic draw numbers: ${error.message}`);
  }
}

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function groupScoresByUser(scores) {
  try {
    return (Array.isArray(scores) ? scores : []).reduce((acc, item) => {
      const userId = item?.user_id;
      if (!userId) return acc;
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(item);
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Failed to group scores by user: ${error.message}`);
  }
}

function getLatestFiveScores(scoreRows) {
  return (Array.isArray(scoreRows) ? scoreRows : [])
    .slice()
    .sort((a, b) => new Date(b?.played_at || 0).getTime() - new Date(a?.played_at || 0).getTime())
    .slice(0, 5);
}

async function getRolloverAmount() {
  try {
    const { data, error } = await supabase
      .from('draws')
      .select('jackpot_amount')
      .eq('status', 'published')
      .eq('jackpot_rolled_over', true)
      .order('draw_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return toSafeNumber(data?.jackpot_amount);
  } catch (error) {
    throw new Error(`Failed to fetch rollover jackpot: ${error.message}`);
  }
}

async function runDraw(options = {}) {
  try {
    const mode = (options.mode || 'random').toString().toLowerCase();
    const simulate = Boolean(options.simulate);
    const nowIso = new Date().toISOString();
    const currentMonth = nowIso.slice(0, 7);

    if (!simulate) {
      const { data: existingDraw, error: existingDrawError } = await supabase
        .from('draws')
        .select('id, draw_date')
        .eq('status', 'published')
        .gte('draw_date', `${currentMonth}-01`)
        .lt('draw_date', `${currentMonth}-32`)
        .order('draw_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingDrawError) {
        throw new Error(`Failed to check existing monthly draw: ${existingDrawError.message}`);
      }

      if (existingDraw) {
        throw new Error('A published draw already exists for this month');
      }
    }

    const { error: expireError } = await supabase
      .from('subscriptions')
      .update({ status: 'inactive' })
      .eq('status', 'active')
      .lt('ends_at', nowIso);

    if (expireError) {
      throw new Error(`Failed to update expired subscriptions: ${expireError.message}`);
    }

    const { data: activeSubscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('user_id, amount')
      .eq('status', 'active')
      .gte('ends_at', nowIso);

    if (subscriptionError) {
      throw new Error(`Failed to fetch active subscriptions: ${subscriptionError.message}`);
    }

    const subscriptions = activeSubscriptions || [];
    const userIds = Array.from(new Set(subscriptions.map((item) => item?.user_id).filter(Boolean)));

    const pool = calculatePrizePool(subscriptions);
    const rolloverAmount = await getRolloverAmount();

    const totalPool = pool.total;
    const jackpotPool = pool.jackpot + rolloverAmount;
    const fourMatchPool = pool.fourMatch;
    const threeMatchPool = pool.threeMatch;

    let scores = [];
    if (userIds.length) {
      const { data: scoreRows, error: scoreError } = await supabase
        .from('scores')
        .select('user_id, score, played_at')
        .in('user_id', userIds);

      if (scoreError) {
        throw new Error(`Failed to fetch user scores: ${scoreError.message}`);
      }

      scores = scoreRows || [];
    }

    const drawNumbers = mode === 'algorithmic'
      ? generateAlgorithmicDrawNumbers(scores)
      : generateRandomDrawNumbers();

    const drawSet = new Set(drawNumbers);
    const scoresByUser = groupScoresByUser(scores);

    const fiveMatchWinners = [];
    const fourMatchWinners = [];
    const threeMatchWinners = [];

    for (const userId of userIds) {
      const userScores = getLatestFiveScores(scoresByUser[userId]);
      const matchCount = userScores.reduce((count, entry) => {
        return drawSet.has(toSafeNumber(entry?.score)) ? count + 1 : count;
      }, 0);

      if (matchCount === 5) {
        fiveMatchWinners.push(userId);
      } else if (matchCount === 4) {
        fourMatchWinners.push(userId);
      } else if (matchCount === 3) {
        threeMatchWinners.push(userId);
      }
    }

    const jackpotRolledOver = fiveMatchWinners.length === 0;

    const jackpotPerWinner = fiveMatchWinners.length ? jackpotPool / fiveMatchWinners.length : 0;
    const fourMatchPerWinner = fourMatchWinners.length ? fourMatchPool / fourMatchWinners.length : 0;
    const threeMatchPerWinner = threeMatchWinners.length ? threeMatchPool / threeMatchWinners.length : 0;

    if (simulate) {
      return {
        simulated: true,
        mode,
        draw: null,
        winners: {
          fiveMatch: fiveMatchWinners.map((userId) => ({
            user_id: userId,
            match_type: '5_match',
            prize_amount: jackpotPerWinner,
          })),
          fourMatch: fourMatchWinners.map((userId) => ({
            user_id: userId,
            match_type: '4_match',
            prize_amount: fourMatchPerWinner,
          })),
          threeMatch: threeMatchWinners.map((userId) => ({
            user_id: userId,
            match_type: '3_match',
            prize_amount: threeMatchPerWinner,
          })),
        },
        drawNumbers,
        totalPool,
      };
    }

    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        draw_date: new Date().toISOString().split('T')[0],
        numbers: drawNumbers,
        status: 'published',
        jackpot_amount: jackpotPool,
        four_match_amount: fourMatchPool,
        three_match_amount: threeMatchPool,
        jackpot_rolled_over: jackpotRolledOver,
      })
      .select('*')
      .single();

    if (drawError) {
      throw new Error(`Failed to insert draw record: ${drawError.message}`);
    }

    const winnerRows = [
      ...fiveMatchWinners.map((userId) => ({
        draw_id: draw.id,
        user_id: userId,
        match_type: '5_match',
        prize_amount: jackpotPerWinner,
        payout_status: 'pending',
      })),
      ...fourMatchWinners.map((userId) => ({
        draw_id: draw.id,
        user_id: userId,
        match_type: '4_match',
        prize_amount: fourMatchPerWinner,
        payout_status: 'pending',
      })),
      ...threeMatchWinners.map((userId) => ({
        draw_id: draw.id,
        user_id: userId,
        match_type: '3_match',
        prize_amount: threeMatchPerWinner,
        payout_status: 'pending',
      })),
    ];

    if (winnerRows.length) {
      const { error: winnerInsertError } = await supabase.from('winners').insert(winnerRows);
      if (winnerInsertError) {
        await supabase.from('draws').delete().eq('id', draw.id);
        throw new Error(`Failed to insert winner records: ${winnerInsertError.message}`);
      }
    }

    return {
      draw,
      mode,
      winners: {
        fiveMatch: fiveMatchWinners.map((userId) => ({
          user_id: userId,
          match_type: '5_match',
          prize_amount: jackpotPerWinner,
        })),
        fourMatch: fourMatchWinners.map((userId) => ({
          user_id: userId,
          match_type: '4_match',
          prize_amount: fourMatchPerWinner,
        })),
        threeMatch: threeMatchWinners.map((userId) => ({
          user_id: userId,
          match_type: '3_match',
          prize_amount: threeMatchPerWinner,
        })),
      },
      drawNumbers,
      totalPool,
    };
  } catch (error) {
    throw new Error(`Failed to run draw: ${error.message}`);
  }
}

module.exports = {
  runDraw,
};