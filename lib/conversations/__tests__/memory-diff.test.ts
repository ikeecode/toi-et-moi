import { describe, it, expect } from 'vitest';
import { buildMemoryDiff } from '@/lib/conversations/memory-diff';

describe('buildMemoryDiff', () => {
  const baseBefore = {
    title: 'Balade',
    description: 'Parc',
    date: '2026-01-10',
    photoCount: 2,
  };

  it('retourne null quand rien ne change', () => {
    expect(buildMemoryDiff(baseBefore, baseBefore, { added: 0, removed: 0 })).toBeNull();
  });

  it('détecte un changement de titre uniquement', () => {
    const after = { ...baseBefore, title: 'Balade à vélo' };
    expect(buildMemoryDiff(baseBefore, after, { added: 0, removed: 0 })).toEqual({
      title: { from: 'Balade', to: 'Balade à vélo' },
    });
  });

  it('détecte l\'ajout et la suppression de photos', () => {
    expect(
      buildMemoryDiff(baseBefore, baseBefore, { added: 2, removed: 1 })
    ).toEqual({
      photosAdded: 2,
      photosRemoved: 1,
    });
  });

  it('gère la description passée de null à valeur', () => {
    const before = { ...baseBefore, description: null };
    const after = { ...baseBefore, description: 'Ensoleillé' };
    expect(buildMemoryDiff(before, after, { added: 0, removed: 0 })).toEqual({
      description: { from: null, to: 'Ensoleillé' },
    });
  });

  it('combine plusieurs changements', () => {
    const after = { ...baseBefore, title: 'Autre', date: '2026-02-01' };
    expect(buildMemoryDiff(baseBefore, after, { added: 1, removed: 0 })).toEqual({
      title: { from: 'Balade', to: 'Autre' },
      date: { from: '2026-01-10', to: '2026-02-01' },
      photosAdded: 1,
    });
  });
});
