import type { MemoryDiff } from './types';

export interface MemorySnapshot {
  title: string;
  description: string | null;
  date: string;
  photoCount: number;
}

export function buildMemoryDiff(
  before: MemorySnapshot,
  after: MemorySnapshot,
  photos: { added: number; removed: number }
): MemoryDiff | null {
  const diff: MemoryDiff = {};

  if (before.title !== after.title) {
    diff.title = { from: before.title, to: after.title };
  }
  if (before.description !== after.description) {
    diff.description = { from: before.description, to: after.description };
  }
  if (before.date !== after.date) {
    diff.date = { from: before.date, to: after.date };
  }
  if (photos.added > 0) {
    diff.photosAdded = photos.added;
  }
  if (photos.removed > 0) {
    diff.photosRemoved = photos.removed;
  }

  return Object.keys(diff).length === 0 ? null : diff;
}
