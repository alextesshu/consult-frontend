const SHUFFLE_SEED_BYTES = 16

type FillRandomValues = (bytes: Uint8Array) => Uint8Array

export function createSpecialistDiscoveryShuffleSeed(
  fillRandomValues: FillRandomValues = (bytes) => globalThis.crypto.getRandomValues(bytes),
): string {
  const bytes = new Uint8Array(SHUFFLE_SEED_BYTES)
  fillRandomValues(bytes)
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}
