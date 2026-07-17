# 화면 녹화 기능 개발 로드맵 (docs/roadmap_record.md)

본 문서는 WebcamViewer 애플리케이션에 화면 녹화 및 로컬 동영상 저장 기능을 안전하고 일관되게 추가하기 위한 단계별 마일스톤과 작업 로드맵을 정의합니다.

---

## 1. 개발 마일스톤 및 세부 태스크 (Milestones)

화면 녹화 기능은 총 3단계의 흐름으로 진행되며, 각 태스크의 상세 사항은 다음과 같습니다.

### 📌 Phase 1: Electron IPC 백엔드 및 로컬 저장소 구축
* **태스크 ID**: `a9de09e8-c1d7-40b2-b52d-c7537a783c25`
* **설명**: 메인 프로세스와 프리로드 스크립트에 화면 녹화 바이너리(`ArrayBuffer`) 데이터를 수신하여 로컬에 쓰는 안전한 IPC 채널(`save-record`)을 개발합니다.
* **관련 파일**:
  - [`electron/main.ts`](file:///d:/anaconda/source_code/Webcamviewer/electron/main.ts) (수정)
  - [`electron/preload.ts`](file:///d:/anaconda/source_code/Webcamviewer/electron/preload.ts) (수정)
  - [`src/types/electron.d.ts`](file:///d:/anaconda/source_code/Webcamviewer/src/types/electron.d.ts) (수정)
* **보안 요건**:
  - DoS 공격을 방어하기 위해 전달받는 버퍼 용량을 최대 **100MB**로 엄격히 제한합니다.
  - 경로 탐색(Path Traversal) 공격을 차단하도록 파일 이름에 `path.basename()`을 적용하여 사용자의 `Videos/WebcamViewer` 폴더 내에만 정상 저장되도록 통제합니다.

---

### 📌 Phase 2: MediaRecorder 기반 React 커스텀 훅 개발
* **태스크 ID**: `4b4df186-8bc2-4960-86bf-d27973fa9a65`
* **의존성**: Phase 1 백엔드 구축 완료 후 진행
* **설명**: 웹 표준 API인 `MediaRecorder`를 활용하여 비디오 스트림의 인코딩 및 바이너리 수집, 상태 관리를 캡슐화한 `useRecord` 커스텀 훅을 설계합니다.
* **관련 파일**:
  - `src/hooks/useRecord.ts` (신규 생성)
* **세부 요건**:
  - 녹화 시간 측정 타이머(`recordingTime`), 녹화 활성화 상태(`isRecording`) 상태 관리.
  - 녹화 시작(`startRecording`) 시 미디어 레코더를 활성화하고, 녹화 중단(`stopRecording`) 시 데이터를 ArrayBuffer로 모아 백엔드 IPC 채널로 전송 및 초기화.
  - 컴포넌트 해제 또는 스트림 교체 시 미디어 자원을 명확히 해제하여 메모리 누수를 차단.

---

### 📌 Phase 3: 단축키 바인딩 및 프론트엔드 UI 통합
* **태스크 ID**: `a9ac8791-a121-4287-bf07-7b06cdda422c`
* **의존성**: Phase 2 커스텀 훅 개발 완료 후 진행
* **설명**: 녹화 상태와 컨트롤 기능을 툴바, 상태표시줄 및 글로벌 단축키 시스템에 연동하여 화면 녹화 기능을 최종 사용자 인터페이스에 결합합니다.
* **관련 파일**:
  - [`src/App.tsx`](file:///d:/anaconda/source_code/Webcamviewer/src/App.tsx) (수정)
  - [`src/hooks/useKeyboardShortcuts.ts`](file:///d:/anaconda/source_code/Webcamviewer/src/hooks/useKeyboardShortcuts.ts) (수정)
  - [`src/components/Toolbar.tsx`](file:///d:/anaconda/source_code/Webcamviewer/src/components/Toolbar.tsx) (수정)
  - [`src/components/StatusBar.tsx`](file:///d:/anaconda/source_code/Webcamviewer/src/components/StatusBar.tsx) (수정)
* **UI 요건**:
  - **단축키**: 글로벌 `R` 키를 바인딩하여 뷰어 상태와 무관하게 즉각적인 녹화 시작/정지 토글 연동.
  - **툴바**: 하단 툴바에 빨간색 비디오 녹화 아이콘 및 단축키 안내 툴팁 통합.
  - **상태바**: 녹화 시 상단 영역에 실시간 경과 시간(MM:SS)과 빨간 점멸 LED 인디케이터 렌더링.

---

## 2. 보안 가이드라인 및 제약사항

* **100% 로컬 & 오프라인**: 수집된 비디오 데이터는 절대로 외부 네트워크나 클라우드로 전송하지 않으며 오직 사용자 로컬 저장소 내부에서만 가공 및 보존됩니다.
* **샌드박싱 모델 보호**: 렌더러는 Node API에 직접 액세스하지 않고 `preload.ts`를 경유한 `window.electronAPI.saveRecord`로만 비디오 쓰기를 요청할 수 있습니다.
