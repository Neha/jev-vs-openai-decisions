export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return "$0";
  }
  if (value < 0.0001) {
    return `$${value.toFixed(8)}`;
  }
  if (value < 0.01) {
    return `$${value.toFixed(6)}`;
  }
  return `$${value.toFixed(4)}`;
}

export function formatMs(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${Math.round(value)}ms`;
}

export function formatPct(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(digits);
}
