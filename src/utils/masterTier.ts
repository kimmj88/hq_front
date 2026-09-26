/** MASTER without an LP suffix keeps its existing base score. */
export function getMasterTierLp(name: string): number | null {
  const match = name.trim().match(/^(?:MASTER|마스터)(?:\s+(\d+)\s*(?:LP|점))?$/i);
  return match ? Number(match[1] ?? 0) : null;
}

export function getMasterTierBonus(name: string): number {
  const lp = getMasterTierLp(name);
  return lp === null ? 0 : Math.floor(lp / 100) * 25;
}
