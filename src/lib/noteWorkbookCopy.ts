export type NoteWorkbookContentState = 'missing' | 'draft' | 'completed' | 'hidden' | string

export function noteContentStateLabel(state: NoteWorkbookContentState) {
  if (state === 'missing') return 'Відсутня'
  if (state === 'draft') return 'Чернетка'
  if (state === 'completed') return 'Заповнена'
  if (state === 'hidden') return 'Недоступна'
  return state
}

export function workbookContentStateLabel(state: NoteWorkbookContentState) {
  if (state === 'missing') return 'Відсутній'
  if (state === 'draft') return 'Чернетка'
  if (state === 'completed') return 'Заповнений'
  if (state === 'hidden') return 'Недоступний'
  return state
}
