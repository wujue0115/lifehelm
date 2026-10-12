/** File contents as bare base64 (no `data:…;base64,` prefix), the shape the
 * attachments API expects. */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const commaIndex = result.indexOf(',')
      resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1))
    }
    reader.onerror = () => reject(reader.error as Error)
    reader.readAsDataURL(file)
  })
}
