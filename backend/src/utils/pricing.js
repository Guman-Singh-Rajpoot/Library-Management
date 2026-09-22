/**
 * Owner listing-charge formula — see SPEC.md "open questions".
 * Demo default: flat ₹45/seat, +₹20/seat for every seat above 50.
 * Isolated here so the formula can change without touching route logic.
 */
function ownerChargeForSeats(seats) {
  const n = Number(seats) || 0;
  if (n <= 0) return 0;
  const base = n * 45;
  const extra = n > 50 ? (n - 50) * 20 : 0;
  return Math.round(base + extra);
}

module.exports = { ownerChargeForSeats };
