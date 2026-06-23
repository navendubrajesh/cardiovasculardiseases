import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acknowledgeDisclaimer,
  canRunPrediction,
  clearDisclaimerAcknowledgement,
  isDisclaimerAcknowledged,
} from './disclaimer';

const memoryStore: Record<string, string> = {};

describe('disclaimer session acknowledgement (AC-001)', () => {
  beforeEach(() => {
    for (const key of Object.keys(memoryStore)) delete memoryStore[key];
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, value: string) => {
        memoryStore[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
    });
    clearDisclaimerAcknowledgement();
  });

  it('starts unacknowledged in a fresh session', () => {
    expect(isDisclaimerAcknowledged()).toBe(false);
    expect(canRunPrediction()).toBe(false);
  });

  it('allows prediction after acknowledgement', () => {
    acknowledgeDisclaimer();
    expect(isDisclaimerAcknowledged()).toBe(true);
    expect(canRunPrediction()).toBe(true);
  });

  it('clears acknowledgement when session is reset', () => {
    acknowledgeDisclaimer();
    clearDisclaimerAcknowledgement();
    expect(isDisclaimerAcknowledged()).toBe(false);
    expect(canRunPrediction()).toBe(false);
  });
});
