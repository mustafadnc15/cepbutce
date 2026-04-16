import { generateId } from '../../src/utils/id';

describe('generateId', () => {
  it('returns a string of length 22-26 characters', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThanOrEqual(22);
    expect(id.length).toBeLessThanOrEqual(26);
  });

  it('returns unique ids across 1000 calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });
});
