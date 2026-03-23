import { computed, ref } from 'vue'

type UseDirtySnapshotOptions<T> = {
  serialize?: (snapshot: T) => string
  deserialize?: (raw: string) => T
}

const defaultSerialize = <T>(snapshot: T) => JSON.stringify(snapshot)
const defaultDeserialize = <T>(raw: string) => JSON.parse(raw) as T

export function useDirtySnapshot<T>(
  snapshotFactory: () => T,
  options: UseDirtySnapshotOptions<T> = {}
) {
  const serialize = options.serialize ?? defaultSerialize<T>
  const deserialize = options.deserialize ?? defaultDeserialize<T>
  const savedSnapshotRaw = ref<string | null>(null)

  const hasSavedSnapshot = computed(() => savedSnapshotRaw.value !== null)
  const isDirty = computed(() => {
    if (!savedSnapshotRaw.value) return false
    return serialize(snapshotFactory()) !== savedSnapshotRaw.value
  })

  function markSaved(snapshot?: T) {
    const next = snapshot ?? snapshotFactory()
    savedSnapshotRaw.value = serialize(next)
  }

  function getSavedSnapshot(): T | null {
    if (!savedSnapshotRaw.value) return null
    try {
      return deserialize(savedSnapshotRaw.value)
    } catch {
      return null
    }
  }

  function clearSavedSnapshot() {
    savedSnapshotRaw.value = null
  }

  return {
    hasSavedSnapshot,
    isDirty,
    markSaved,
    getSavedSnapshot,
    clearSavedSnapshot,
  }
}
