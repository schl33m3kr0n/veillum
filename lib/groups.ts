import { createId } from "./ids";
import type { Layer } from "./types";

export function groupMembers(layers: Layer[], groupId: string | null | undefined): Layer[] {
  if (!groupId) return [];
  return layers.filter((l) => l.groupId === groupId);
}

export function expandSelection(layers: Layer[], ids: string[]): string[] {
  const wanted = new Set<string>();
  for (const id of ids) {
    const layer = layers.find((l) => l.id === id);
    if (!layer) continue;
    if (layer.groupId) {
      for (const member of groupMembers(layers, layer.groupId)) {
        wanted.add(member.id);
      }
    } else {
      wanted.add(id);
    }
  }
  return layers.filter((l) => wanted.has(l.id)).map((l) => l.id);
}

export function canGroup(layers: Layer[], selectedIds: string[]): boolean {
  const targets = layers.filter((l) => selectedIds.includes(l.id) && !l.locked);
  if (targets.length < 2) return false;
  const gid = targets[0]?.groupId;
  if (gid && targets.every((l) => l.groupId === gid)) {
    const members = groupMembers(layers, gid);
    if (
      members.length === targets.length &&
      members.every((m) => selectedIds.includes(m.id))
    ) {
      return false;
    }
  }
  return true;
}

export function canUngroup(layers: Layer[], selectedIds: string[]): boolean {
  return layers.some((l) => selectedIds.includes(l.id) && !!l.groupId);
}

export function applyGroup(layers: Layer[], selectedIds: string[]): Layer[] | null {
  const targets = layers.filter((l) => selectedIds.includes(l.id) && !l.locked);
  if (!canGroup(layers, selectedIds)) return null;
  const gid = createId("g");
  const ids = new Set(targets.map((l) => l.id));
  return layers.map((l) => (ids.has(l.id) ? { ...l, groupId: gid } : l));
}

export function applyUngroup(layers: Layer[], selectedIds: string[]): Layer[] {
  const ids = new Set(expandSelection(layers, selectedIds));
  return layers.map((l) => (ids.has(l.id) ? { ...l, groupId: null } : l));
}

export function remapGroupIds<T extends Layer>(layers: T[]): T[] {
  const map = new Map<string, string>();
  return layers.map((l) => {
    if (!l.groupId) return { ...l, groupId: null };
    if (!map.has(l.groupId)) map.set(l.groupId, createId("g"));
    return { ...l, groupId: map.get(l.groupId)! };
  });
}
