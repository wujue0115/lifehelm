import { useI18n } from 'vue-i18n'

// Built-in priorities ('low'/'medium'/'high') are i18n keys; custom ones
// registered via the board have no translation, so they render as the
// literal name the user typed — same rule tag names already follow. An
// empty value means the item's priority column was deleted out from under
// it (see BoardPanel.vue's confirmRemoveColumn), so it gets its own label
// rather than falling through to an empty pill.
export function usePriorityLabel() {
  const { t, te } = useI18n()
  return (value: string): string => {
    if (!value) return t('priority.none')
    const key = `priority.${value}`
    return te(key) ? t(key) : value
  }
}
