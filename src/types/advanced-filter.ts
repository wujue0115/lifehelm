// The Notion-style advanced filter shared by the List/Board/Calendar panels —
// a tree of condition rows joined by and/or combinators, with rows optionally
// nested into groups. Persisted on FilterConfig.advancedFilter (view.ts) and
// evaluated by src/utils/advancedFilter.ts. Layered on top of (AND-combined
// with) the flat status/priority/tag/date filter row, never replacing it.

// Which value control a field's rule row shows, and which operators apply:
//  - text   : free-text fields (title, description)
//  - select : one value picked from a registry (status, priority)
//  - tags    : membership in the item's tag list
//  - date    : a 'YYYY-MM-DD' calendar value (start/due/created/updated)
export type AdvancedFilterFieldType = 'text' | 'select' | 'tags' | 'date'

export type AdvancedFilterField =
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'tags'
  | 'startDate'
  | 'dueDate'
  | 'createdAt'
  | 'updatedAt'

export type AdvancedFilterOperator =
  | 'eq' // =    exact match (text, select, date)
  | 'neq' // ≠
  | 'contains' // text substring; for tags: the list includes this value
  | 'notContains'
  | 'isEmpty' // field is unset / empty — takes no value
  | 'isNotEmpty'
  | 'gt' // >    date after
  | 'gte' // ≥
  | 'lt' // <    date before
  | 'lte' // ≤

export interface AdvancedFilterRule {
  id: string
  type: 'rule'
  field: AdvancedFilterField
  operator: AdvancedFilterOperator
  /** Always a string — a plain value for text, an option name for
   * select/tags, a 'YYYY-MM-DD' key for date. Ignored for isEmpty/isNotEmpty. */
  value: string
}

export interface AdvancedFilterGroup {
  id: string
  type: 'group'
  /** How this group's own children are joined. 'and' = every child must
   * match, 'or' = at least one. A group with no children matches everything. */
  combinator: 'and' | 'or'
  children: AdvancedFilterNode[]
}

export type AdvancedFilterNode = AdvancedFilterRule | AdvancedFilterGroup
