function toSafeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function calculatePrizePool(subscriptions) {
  try {
    const list = Array.isArray(subscriptions) ? subscriptions : [];
    const total = list.reduce((sum, item) => sum + toSafeNumber(item?.amount), 0);

    return {
      total,
      jackpot: total * 0.4,
      fourMatch: total * 0.35,
      threeMatch: total * 0.25,
    };
  } catch (error) {
    throw new Error(`Failed to calculate prize pool: ${error.message}`);
  }
}

module.exports = {
  calculatePrizePool,
};