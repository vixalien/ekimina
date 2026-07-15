export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatRWF(amount: number): string {
  return `${(amount * 1000).toLocaleString()} RWF`;
}
