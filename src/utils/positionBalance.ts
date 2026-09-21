/** API responses may contain either flattened positions or database relations. */
interface RegisteredPosition {
  id?: number;
  code?: string;
  order?: number | null;
  codedict?: { value?: string };
}

interface BalancePlayer {
  id: number;
  point?: number;
  positions?: RegisteredPosition[];
}

export function getPositionAdjustment(player: BalancePlayer | null | undefined, position: string): number {
  if (!player?.id || !position) return 0;
  const registered = [...(player.positions ?? [])]
    .sort((a, b) => {
      const rankA = a.order != null && a.order > 0 ? a.order : Infinity;
      const rankB = b.order != null && b.order > 0 ? b.order : Infinity;
      return rankA - rankB || (a.id ?? 0) - (b.id ?? 0);
    })
    .map((item) => (item.code ?? item.codedict?.value ?? '').toUpperCase())
    .filter(Boolean);
  const codes = [...new Set(registered)];
  // No registered preference means there is no basis for a penalty.
  if (!codes.length) return 0;
  const index = codes.indexOf(position.toUpperCase());
  return index === 0 ? 0 : index === 1 ? -30 : -70;
}

export function getPositionAdjustedPoint(player: BalancePlayer | null | undefined, position: string): number {
  if (!player?.id) return 0;
  return (Number(player.point) || 0) + getPositionAdjustment(player, position);
}
