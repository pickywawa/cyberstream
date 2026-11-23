export { cert_age as certToAge } from '../../rust/generated/cyberstream';

/** "-12" style label, the French convention, whatever the source system */
export function ageLabel(certAge?: number, cert?: string): string | undefined {
  if (certAge === undefined) return cert || undefined;
  return certAge === 0 ? 'Tous publics' : `-${certAge}`;
}
