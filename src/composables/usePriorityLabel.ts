import { useI18n } from 'vue-i18n'

// Built-in priorities ('low'/'medium'/'high') are i18n keys; custom ones
// registered via the board have no translation, so they render as the
// literal name the user typed — same rule tag names already follow.
export function usePriorityLabel() {
  const { t, te } = useI18n()
  return (value: string): string => {
    const key = `priority.${value}`
    return te(key) ? t(key) : value
  }
}
