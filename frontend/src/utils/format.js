function trimDecimal(value) {
  return Number(value.toFixed(1)).toString();
}

export function formatCompact(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "0";
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${trimDecimal(num / 1_000_000)}M`;
  if (abs >= 1_000) return `${trimDecimal(num / 1_000)}k`;
  return String(Math.round(num));
}

export function formatRupees(value) {
  return `₹${formatCompact(value)}`;
}

export function formatRs(value) {
  return `Rs ${formatCompact(value)}`;
}
