/**
 * Generates a timestamp-based filename for webcam captures.
 * Format: webcam-capture-YYYY-MM-DD-HHMMSS.png
 */
export function generateCaptureFileName(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `webcam-capture-${year}-${month}-${day}-${hours}${minutes}${seconds}.png`
}

/**
 * Generates a timestamp-based filename for webcam recordings.
 * Format: webcam-record-YYYY-MM-DD-HHMMSS.webm
 */
export function generateRecordFileName(ext: string = 'webm'): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `webcam-record-${year}-${month}-${day}-${hours}${minutes}${seconds}.${ext}`
}
