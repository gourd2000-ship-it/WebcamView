/**
 * WebM 파일(EBML 형식)의 누락되었거나 Infinity인 재생 시간(Duration) 헤더 정보를 
 * 녹화 시간 정보를 바탕으로 정정해주는 경량 바이너리 헬퍼입니다.
 */

class EbmlReader {
  private pos = 0
  private data: Uint8Array

  constructor(buffer: ArrayBuffer) {
    this.data = new Uint8Array(buffer)
  }

  get length() {
    return this.data.length
  }

  get position() {
    return this.pos
  }

  seek(pos: number) {
    this.pos = pos
  }

  readVint(): { id: number; length: number; value: number } | null {
    if (this.pos >= this.data.length) return null

    const firstByte = this.data[this.pos]
    let mask = 0x80
    let length = 1

    while (length <= 8) {
      if ((firstByte & mask) !== 0) {
        break
      }
      mask >>= 1
      length++
    }

    if (length > 8 || this.pos + length > this.data.length) {
      return null
    }

    // Read ID (with length mask included)
    let id = 0
    for (let i = 0; i < length; i++) {
      id = (id * 256) + this.data[this.pos + i]
    }

    // Read value (with length mask stripped)
    let value = firstByte & (mask - 1)
    for (let i = 1; i < length; i++) {
      value = (value * 256) + this.data[this.pos + i]
    }

    this.pos += length
    return { id, length, value }
  }

  readBytes(len: number): Uint8Array {
    const bytes = this.data.subarray(this.pos, this.pos + len)
    this.pos += len
    return bytes
  }

  readDouble(): number {
    const bytes = this.readBytes(8)
    const view = new DataView(bytes.buffer, bytes.byteOffset, 8)
    return view.getFloat64(0, false) // Big endian
  }
}

/**
 * WebM 파일의 ArrayBuffer와 녹음된 duration(밀리초)을 받아 
 * duration 메타데이터가 올바르게 주입된 새로운 ArrayBuffer 또는 Blob을 리턴합니다.
 */
export function fixWebmDuration(arrayBuffer: ArrayBuffer, durationMs: number): ArrayBuffer {
  const reader = new EbmlReader(arrayBuffer)
  let segmentInfoPos = -1
  let segmentInfoLen = -1
  let durationPos = -1

  // EBML 트리 파싱 (최소한 Segment Info 및 Duration의 오프셋 탐색)
  while (reader.position < reader.length) {
    const vint = reader.readVint()
    if (!vint) break

    const id = vint.id
    const size = vint.value

    // Segment ID = 0x18538067
    if (id === 0x18538067) {
      continue
    }

    // Info ID = 0x1549A966 (Segment Info)
    if (id === 0x1549A966) {
      segmentInfoPos = reader.position
      segmentInfoLen = size
      
      // Info 바디 내부 파싱
      const end = reader.position + size
      while (reader.position < end) {
        const subVint = reader.readVint()
        if (!subVint) break
        
        // Duration ID = 0x4489
        if (subVint.id === 0x4489) {
          durationPos = reader.position
          break
        }
        
        reader.seek(reader.position + subVint.value)
      }
      break
    }

    reader.seek(reader.position + size)
  }

  // Duration 태그를 찾았거나 Segment Info를 찾은 경우 바이너리 패치 적용
  if (segmentInfoPos !== -1) {
    const data = new Uint8Array(arrayBuffer)
    
    // Duration 태그(0x4489)가 이미 있는 경우 해당 값을 패치
    if (durationPos !== -1) {
      const buffer = arrayBuffer.slice(0)
      const view = new DataView(buffer, durationPos, 8)
      view.setFloat64(0, durationMs, false) // Big endian으로 밀리초 주입 (Chromium 기본 TimecodeScale은 1,000,000ns = 1ms)
      return buffer
    } else {
      // Duration 태그가 누락된 경우 Segment Info 끝에 새로 삽입
      // Duration Element: ID(0x4489) + Size(0x88 = 8바이트 플로트) + 8바이트 Value
      const durationElement = new Uint8Array(10)
      durationElement[0] = 0x44
      durationElement[1] = 0x89
      durationElement[2] = 0x88 // vint length mask + 8
      
      const view = new DataView(durationElement.buffer, 3, 8)
      view.setFloat64(0, durationMs, false)

      // 새로운 버퍼 병합 작성
      const insertIdx = segmentInfoPos + segmentInfoLen
      const newBuffer = new Uint8Array(data.length + 10)
      newBuffer.set(data.subarray(0, insertIdx), 0)
      newBuffer.set(durationElement, insertIdx)
      newBuffer.set(data.subarray(insertIdx), insertIdx + 10)

      return newBuffer.buffer
    }
  }

  return arrayBuffer
}
