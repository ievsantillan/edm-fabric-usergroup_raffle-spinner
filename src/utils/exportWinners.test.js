import { describe, it, expect } from 'vitest';
import { buildWinnersFilename } from './exportWinners';

describe('buildWinnersFilename', () => {
  const fixedNow = new Date('2026-06-27T15:00:00Z');

  it('uses slugified event name + date', () => {
    expect(
      buildWinnersFilename('Edmonton Fabric User Group', '2026-06-27', fixedNow)
    ).toBe('edmonton-fabric-user-group-winners-2026-06-27.csv');
  });

  it('falls back to "raffle" when eventName is missing', () => {
    expect(buildWinnersFilename('', '2026-06-27', fixedNow)).toBe(
      'raffle-winners-2026-06-27.csv'
    );
  });

  it('falls back to today (UTC) when eventDate is missing', () => {
    expect(buildWinnersFilename('My Event', '', fixedNow)).toBe(
      'my-event-winners-2026-06-27.csv'
    );
  });

  it('strips unsafe characters and collapses runs of separators', () => {
    expect(
      buildWinnersFilename("Tom's   Cool / Event!!!", '2026/06/27', fixedNow)
    ).toBe('tom-s-cool-event-winners-2026-06-27.csv');
  });
});
