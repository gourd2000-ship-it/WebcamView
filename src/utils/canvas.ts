/**
 * Draws a video frame or image source onto a canvas with correct transformations
 * (zoom, rotation, flip) and image filters (brightness, contrast, invert, grayscale) applied,
 * matching the viewer state.
 */
export function drawTransformedCanvas(
  source: HTMLVideoElement | HTMLImageElement,
  zoom: number,
  rotation: number,
  isFlipped: boolean,
  annotationCanvas: HTMLCanvasElement | null = null,
  filters = { brightness: 100, contrast: 100, isInverted: false, isGrayscale: false }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Failed to get 2D context')
  }

  // Get original source dimensions
  let srcWidth = 0
  let srcHeight = 0
  
  if (source instanceof HTMLVideoElement) {
    srcWidth = source.videoWidth
    srcHeight = source.videoHeight
  } else {
    srcWidth = source.naturalWidth
    srcHeight = source.naturalHeight
  }

  // If dimensions are 0 (e.g. video not loaded), use fallback values
  if (!srcWidth || !srcHeight) {
    srcWidth = 1920
    srcHeight = 1080
  }

  // Determine canvas dimensions based on rotation
  const isRotated90or270 = rotation === 90 || rotation === 270
  const destWidth = isRotated90or270 ? srcHeight : srcWidth
  const destHeight = isRotated90or270 ? srcWidth : srcHeight

  canvas.width = destWidth
  canvas.height = destHeight

  // 1. Move origin to canvas center
  ctx.translate(canvas.width / 2, canvas.height / 2)

  // 2. Apply flip (horizontal mirror)
  if (isFlipped) {
    ctx.scale(-1, 1)
  }

  // 3. Apply rotation (convert degrees to radians)
  ctx.rotate((rotation * Math.PI) / 180)

  // 4. Apply zoom scale
  ctx.scale(zoom, zoom)

  // 5. Set image adjustment filters on context
  ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) invert(${filters.isInverted ? 100 : 0}%) grayscale(${filters.isGrayscale ? 100 : 0}%)`

  // 6. Draw image centered
  ctx.drawImage(
    source,
    -srcWidth / 2,
    -srcHeight / 2,
    srcWidth,
    srcHeight
  )

  // 7. Reset filter for annotations so they are not affected by filters
  ctx.filter = 'none'

  // 8. Draw annotations centered on top
  if (annotationCanvas) {
    ctx.drawImage(
      annotationCanvas,
      -srcWidth / 2,
      -srcHeight / 2,
      srcWidth,
      srcHeight
    )
  }

  return canvas
}
