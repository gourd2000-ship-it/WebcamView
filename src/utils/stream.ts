/**
 * Safely stops all active tracks of a given MediaStream.
 * Prevents camera hardware locks and memory leaks.
 */
export function stopStream(stream: MediaStream | null): void {
  if (!stream) return
  
  try {
    stream.getTracks().forEach((track) => {
      if (track.readyState === 'live') {
        track.stop()
      }
    })
  } catch (error) {
    console.error('Failed to stop stream tracks:', error)
  }
}
