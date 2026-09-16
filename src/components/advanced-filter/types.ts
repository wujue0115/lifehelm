// The option lists a rule row needs to render its value control — passed
// down from the panel (which owns the work-items store) through
// AdvancedFilterButton → AdvancedFilterDialog → the recursive group/rule
// editors, so those editors never touch the store directly.
export interface AdvancedFilterOption {
  value: string
  label: string
}

export interface AdvancedFilterContext {
  statusOptions: AdvancedFilterOption[]
  priorityOptions: AdvancedFilterOption[]
  tagOptions: AdvancedFilterOption[]
}
