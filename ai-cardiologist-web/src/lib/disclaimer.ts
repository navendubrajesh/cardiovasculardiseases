const SESSION_KEY = 'aicardio.disclaimer.ack';

export function isDisclaimerAcknowledged(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function acknowledgeDisclaimer(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export function clearDisclaimerAcknowledgement(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function canRunPrediction(): boolean {
  return isDisclaimerAcknowledged();
}
