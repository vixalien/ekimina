type NameEntry = { name: string; initials: string };

let cache: Record<string, string> | null = null;

function initialsOf(n: string): string {
  return n
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export async function loadNames(): Promise<void> {
  const { getAllUsers } = await import("./store.js");
  const users = await getAllUsers();
  cache = {};
  for (const u of users) {
    if (u.name) cache[u.address.toLowerCase()] = u.name;
  }
}

export function nameOf(addr: string): NameEntry {
  const name = cache?.[addr.toLowerCase()] ?? addr.slice(0, 6);
  return { name, initials: initialsOf(name) };
}
