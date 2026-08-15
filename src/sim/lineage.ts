import type { Cell } from "./types";

export function lineageIds(cells: readonly Cell[], id: number): Set<number> {
  const byId = new Map<number, Cell>();
  const children = new Map<number, number[]>();
  for (const cell of cells) {
    byId.set(cell.id, cell);
    if (cell.parentId !== null) {
      const list = children.get(cell.parentId);
      if (list) list.push(cell.id);
      else children.set(cell.parentId, [cell.id]);
    }
  }

  const out = new Set<number>();
  let cursor: Cell | undefined = byId.get(id);
  while (cursor) {
    out.add(cursor.id);
    cursor = cursor.parentId === null ? undefined : byId.get(cursor.parentId);
  }

  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    out.add(current);
    const kids = children.get(current);
    if (kids) for (const kid of kids) stack.push(kid);
  }
  return out;
}

export function lineageChain(cells: readonly Cell[], id: number): string[] {
  const byId = new Map(cells.map((c) => [c.id, c]));
  const clones: string[] = [];
  let cursor = byId.get(id);
  while (cursor) {
    if (clones[0] !== cursor.cloneId) clones.unshift(cursor.cloneId);
    cursor = cursor.parentId === null ? undefined : byId.get(cursor.parentId);
  }
  return clones;
}
