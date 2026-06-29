/**
 * Generates a mock MediaStream containing a 30fps test pattern.
 * Enables full testing of rotation, flip, zoom, freeze, and capture
 * without requiring any physical webcam hardware.
 */
export function createVirtualCameraStream(): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    return new MediaStream()
  }

  let angle = 0
  let ballX = 640
  let ballY = 360
  let dx = 5
  let dy = 4
  
  let intervalId: any = null

  // Rendering loop
  const drawPattern = () => {
    // 1. Clear background with dark purple/indigo gradient
    const gradient = ctx.createLinearGradient(0, 0, 1280, 720)
    gradient.addColorStop(0, '#10121a')
    gradient.addColorStop(0.5, '#181b28')
    gradient.addColorStop(1, '#0e0f14')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1280, 720)

    // 2. Draw a futuristic grid pattern
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)'
    ctx.lineWidth = 1
    const gridSize = 80
    for (let x = 0; x < 1280; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 720)
      ctx.stroke()
    }
    for (let y = 0; y < 720; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(1280, y)
      ctx.stroke()
    }

    // 3. Draw a bouncing target ball with orbit rings
    ctx.fillStyle = '#4f46e5'
    ctx.beginPath()
    ctx.arc(ballX, ballY, 35, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#818cf8'
    ctx.lineWidth = 3
    ctx.stroke()

    // Bouncing logic
    ballX += dx
    ballY += dy
    if (ballX <= 35 || ballX >= 1280 - 35) dx = -dx
    if (ballY <= 35 || ballY >= 720 - 35) dy = -dy

    // 4. Draw a spinning crosshair pointer in the center
    ctx.save()
    ctx.translate(640, 360)
    ctx.rotate(angle)
    ctx.strokeStyle = '#f43f5e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-80, 0)
    ctx.lineTo(80, 0)
    ctx.moveTo(0, -80)
    ctx.lineTo(0, 80)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(0, 0, 50, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    angle += 0.02

    // 5. Draw text info overlay
    ctx.fillStyle = '#f3f4f6'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('실물화상기 가상 카메라 시뮬레이터', 640, 160)
    
    ctx.font = '18px monospace'
    ctx.fillStyle = '#6366f1'
    ctx.fillText('단축키 및 화면 제어(배율/반전/회전/정지) 테스트 가능', 640, 210)

    // 6. Draw real-time clock
    const now = new Date()
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 24px monospace'
    ctx.fillText(now.toLocaleTimeString(), 640, 550)
  }

  // Draw 30 frames per second
  intervalId = setInterval(drawPattern, 1000 / 30)

  // Capture stream from canvas
  const stream = (canvas as any).captureStream(30) as MediaStream

  // Bind cleanup to track stop
  const originalGetTracks = stream.getTracks.bind(stream)
  const tracks = originalGetTracks()
  tracks.forEach((track) => {
    const originalStop = track.stop.bind(track)
    track.stop = () => {
      originalStop()
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
  })

  return stream
}
