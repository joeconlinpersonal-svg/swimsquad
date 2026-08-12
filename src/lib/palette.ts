export function seriesColorVar(colorIndex: number): string {
  const slot = (colorIndex % 8) + 1;
  return `var(--series-${slot})`;
}
