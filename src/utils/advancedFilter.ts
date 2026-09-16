import type { WorkItem } from '@/types/work-item'
import type {
  AdvancedFilterField,
  AdvancedFilterFieldType,
  AdvancedFilterGroup,
  AdvancedFilterNode,
  AdvancedFilterOperator,
  AdvancedFilterRule,
} from '@/types/advanced-filter'

// Order the field dropdown offers, and each field's value-control type.
export const FIELD_TYPE: Record<AdvancedFilterField, AdvancedFilterFieldType> = {
  title: 'text',
  description: 'text',
  status: 'select',
  priority: 'select',
  tags: 'tags',
  startDate: 'date',
  dueDate: 'date',
  createdAt: 'date',
  updatedAt: 'date',
}

export const FIELD_ORDER: AdvancedFilterField[] = [
  'title',
  'description',
  'status',
  'priority',
  'tags',
  'startDate',
  'dueDate',
  'createdAt',
  'updatedAt',
]

// Which operators each field type offers, in dropdown order. The first entry
// is also the fallback an operator resets to when the field's type changes
// out from under an incompatible operator (see coerceOperator).
export const OPERATORS_BY_TYPE: Record<AdvancedFilterFieldType, AdvancedFilterOperator[]> = {
  text: ['contains', 'notContains', 'eq', 'neq', 'isEmpty', 'isNotEmpty'],
  select: ['eq', 'neq', 'isEmpty', 'isNotEmpty'],
  tags: ['contains', 'notContains', 'isEmpty', 'isNotEmpty'],
  date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
}

// Operators that take no value control — the row is complete on field +
// operator alone.
export const VALUELESS_OPERATORS: ReadonlySet<AdvancedFilterOperator> = new Set([
  'isEmpty',
  'isNotEmpty',
])

export function operatorsForField(field: AdvancedFilterField): AdvancedFilterOperator[] {
  return OPERATORS_BY_TYPE[FIELD_TYPE[field]]
}

// Keep the operator if it's still valid for the (possibly just-changed)
// field, otherwise drop to that type's first operator.
export function coerceOperator(
  field: AdvancedFilterField,
  operator: AdvancedFilterOperator,
): AdvancedFilterOperator {
  const valid = operatorsForField(field)
  return valid.includes(operator) ? operator : (valid[0] as AdvancedFilterOperator)
}

export function createRule(): AdvancedFilterRule {
  return { id: crypto.randomUUID(), type: 'rule', field: 'title', operator: 'contains', value: '' }
}

export function createGroup(children: AdvancedFilterNode[] = []): AdvancedFilterGroup {
  return { id: crypto.randomUUID(), type: 'group', combinator: 'and', children }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Defensively rebuild a group tree from a persisted (or otherwise untrusted)
// blob — drop unknown fields/operators and malformed nodes rather than trust
// the shape. Returns undefined when nothing usable survives, matching the
// panels' "undefined means no advanced filter" convention.
export function normalizeAdvancedFilter(value: unknown): AdvancedFilterGroup | undefined {
  const group = normalizeGroup(value)
  return group && group.children.length > 0 ? group : undefined
}

function normalizeNode(value: unknown): AdvancedFilterNode | null {
  if (!isRecord(value)) return null
  if (value.type === 'group') return normalizeGroup(value)
  if (value.type === 'rule') return normalizeRule(value)
  return null
}

function normalizeGroup(value: unknown): AdvancedFilterGroup | null {
  if (!isRecord(value)) return null
  const combinator = value.combinator === 'or' ? 'or' : 'and'
  const rawChildren = Array.isArray(value.children) ? value.children : []
  const children = rawChildren
    .map(normalizeNode)
    .filter((node): node is AdvancedFilterNode => node !== null)
  return {
    id: typeof value.id === 'string' ? value.id : crypto.randomUUID(),
    type: 'group',
    combinator,
    children,
  }
}

function normalizeRule(value: Record<string, unknown>): AdvancedFilterRule | null {
  const field = value.field
  if (typeof field !== 'string' || !(field in FIELD_TYPE)) return null
  const typedField = field as AdvancedFilterField
  const operator =
    typeof value.operator === 'string' &&
    operatorsForField(typedField).includes(value.operator as AdvancedFilterOperator)
      ? (value.operator as AdvancedFilterOperator)
      : (operatorsForField(typedField)[0] as AdvancedFilterOperator)
  return {
    id: typeof value.id === 'string' ? value.id : crypto.randomUUID(),
    type: 'rule',
    field: typedField,
    operator,
    value: typeof value.value === 'string' ? value.value : '',
  }
}

// Any leaf rule anywhere in the tree makes the filter "active" — an empty
// root group, or one holding only empty groups, is inert.
export function isAdvancedFilterActive(group: AdvancedFilterGroup | undefined): boolean {
  return countRules(group) > 0
}

export function countRules(group: AdvancedFilterGroup | undefined): number {
  if (!group) return 0
  let count = 0
  for (const child of group.children) {
    if (child.type === 'rule') count += 1
    else count += countRules(child)
  }
  return count
}

function dateKey(value: string | null): string | null {
  return value ? value.slice(0, 10) : null
}

function matchesRule(item: WorkItem, rule: AdvancedFilterRule): boolean {
  const type = FIELD_TYPE[rule.field]
  const { operator } = rule

  if (type === 'text') {
    const raw = rule.field === 'description' ? item.description : item.title
    if (operator === 'isEmpty') return raw.trim() === ''
    if (operator === 'isNotEmpty') return raw.trim() !== ''
    const haystack = raw.toLowerCase()
    const needle = rule.value.trim().toLowerCase()
    if (operator === 'contains') return haystack.includes(needle)
    if (operator === 'notContains') return !haystack.includes(needle)
    if (operator === 'eq') return haystack === needle
    if (operator === 'neq') return haystack !== needle
    return true
  }

  if (type === 'select') {
    const raw = rule.field === 'priority' ? item.priority : item.status
    if (operator === 'isEmpty') return raw === ''
    if (operator === 'isNotEmpty') return raw !== ''
    if (operator === 'eq') return raw === rule.value
    if (operator === 'neq') return raw !== rule.value
    return true
  }

  if (type === 'tags') {
    if (operator === 'isEmpty') return item.tags.length === 0
    if (operator === 'isNotEmpty') return item.tags.length > 0
    if (operator === 'contains') return item.tags.includes(rule.value)
    if (operator === 'notContains') return !item.tags.includes(rule.value)
    return true
  }

  // date
  const key = dateKey(dateValueFor(item, rule.field))
  if (operator === 'isEmpty') return key === null
  if (operator === 'isNotEmpty') return key !== null
  if (key === null || !rule.value) return false
  if (operator === 'eq') return key === rule.value
  if (operator === 'neq') return key !== rule.value
  if (operator === 'gt') return key > rule.value
  if (operator === 'gte') return key >= rule.value
  if (operator === 'lt') return key < rule.value
  if (operator === 'lte') return key <= rule.value
  return true
}

function dateValueFor(item: WorkItem, field: AdvancedFilterField): string | null {
  if (field === 'startDate') return item.startDate
  if (field === 'dueDate') return item.dueDate
  if (field === 'createdAt') return item.createdAt
  if (field === 'updatedAt') return item.updatedAt
  return null
}

function matchesNode(item: WorkItem, node: AdvancedFilterNode): boolean {
  return node.type === 'rule' ? matchesRule(item, node) : matchesGroup(item, node)
}

function matchesGroup(item: WorkItem, group: AdvancedFilterGroup): boolean {
  if (group.children.length === 0) return true
  return group.combinator === 'and'
    ? group.children.every((child) => matchesNode(item, child))
    : group.children.some((child) => matchesNode(item, child))
}

export function evaluateAdvancedFilter(item: WorkItem, group: AdvancedFilterGroup): boolean {
  return matchesGroup(item, group)
}
