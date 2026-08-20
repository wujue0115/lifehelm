export interface ExportConfig {
  groupBy: 'status' | 'priority' | 'tag'
  prefixStyle: 'number' | 'dash' | 'asterisk' | 'bullet' | 'none'
  prefixSuffix: string
  titlePrefix: string
  titleSuffix: string
  showDate: boolean
  dateFormat: string
  datePosition: 'before' | 'after'
  dateSeparator: string
}
