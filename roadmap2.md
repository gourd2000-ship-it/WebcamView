# WebcamViewer 신규 요구사항 구현 로드맵 (roadmap2.md)

이 로드맵은 실물화상기 요구사항(기본 좌우반전 설정, 회전/반전에 대응하는 판서 좌표 보정, 자동초점 지원)을 성공적으로 구현하기 위한 단계별 작업 계획을 수립합니다.

## 1. 개요 및 최종 목표
* **목표 1**: 실물화상기 특성에 맞춰 앱 구동 시 화면을 기본적으로 180도 회전된 상태(`rotation = 180`)로 시작.
* **목표 2**: 화면이 대칭, 회전, 확대된 상태에서도 마우스 포인터 위치에 정확히 판서 선이 일치되도록 캔버스 좌표 역변환 연산식 적용.
* **목표 3**: 하단 툴바에 자동초점(Refocus) 버튼을 추가하고, WebRTC MediaStreamTrack Constraints API를 이용해 카메라 렌즈의 오토포커싱 동작 제어.

---

## 2. 태스크 리스트 및 구현 세부사항

### 태스크 1: 기본 180도 회전 설정
* **설명**: 앱 실행 및 변형 초기화 시 기본 180도 회전 상태 활성화.
* **수정 파일**:
  * [src/hooks/useViewerTransform.ts](file:///d:/codes/WebcamViewer/src/hooks/useViewerTransform.ts)
* **내용**:
  * `rotation` 상태의 초기값(`useState`)을 `180`으로 설정하고 `isFlipped`는 `false`로 설정.
  * `resetTransform` 콜백 내에서 `setRotation(180)`, `setIsFlipped(false)`로 리셋 설정.
* **인수 조건**: 앱 시작 시 또는 초기화 단축키(0) 입력 시 화면이 180도 회전된 상태로 기동함.

### 태스크 2: 회전 및 대칭에 대응하는 판서(Canvas) 좌표 보정
* **설명**: 화면 변형(zoom, rotation, flip) 시 드로잉 마스크와 마우스 포인터 정렬.
* **수정 파일**:
  * [src/components/AnnotationCanvas.tsx](file:///d:/codes/WebcamViewer/src/components/AnnotationCanvas.tsx)
  * [src/components/CameraViewer.tsx](file:///d:/codes/WebcamViewer/src/components/CameraViewer.tsx)
* **내용**:
  * `AnnotationCanvas` 컴포넌트의 인터페이스에 `zoom`, `rotation`, `isFlipped` 프로프 주입.
  * `getCanvasCoords` 내에서 스크린 좌표에 대해 캔버스 CSS transform 역행렬 연산(역회전 -> 역대칭 -> 역줌)을 수학적으로 수행.
  * `canvas.clientWidth` 및 `canvas.clientHeight` 레이아웃 영역 비율을 기준하여 실제 캔버스 내부 해상도로 스케일 복원.
* **인수 조건**: 90도/180도/270도 회전, 좌우반전, 확대 상태에서도 펜/형광펜/지우개/도형 그리기가 커서 위치에 정확하게 그려짐.

### 태스크 3: 웹캠 비디오 트랙 자동 초점 맞추기 API 연동
* **설명**: WebRTC `applyConstraints` 인터페이스 제어 및 자동 초점 강제 트리거.
* **수정 파일**:
  * [src/hooks/useCamera.ts](file:///d:/codes/WebcamViewer/src/hooks/useCamera.ts)
* **내용**:
  * `isAutoFocusSupported` 상태(초점 조절 기능 지원 유무) 및 `triggerAutoFocus` 비동기 콜백 추가.
  * `triggerAutoFocus` 실행 시 현재 초점 모드를 읽은 후, `continuous` 모드라면 `manual`로 전환 후 250ms 딜레이를 두어 하드웨어 드라이버를 리셋하고, 다시 `continuous`로 복원하여 비디오 드라이버에 재포커싱(Refocus)을 강제 트리거함.
* **인수 조건**: 자동 초점 기능을 지원하는 장치 감지 시 `isAutoFocusSupported`가 true가 되며 오토포커싱 재탐색이 성공함.

### 태스크 4: 툴바 자동 초점 맞추기 버튼 UI 추가
* **설명**: 하단 툴바에 Focus 아이콘 추가 및 상태 연동.
* **수정 파일**:
  * [src/components/Toolbar.tsx](file:///d:/codes/WebcamViewer/src/components/Toolbar.tsx)
  * [src/App.tsx](file:///d:/codes/WebcamViewer/src/App.tsx)
* **내용**:
  * `Toolbar.tsx`에 `Focus` 아이콘 단추를 추가하고 `isAutoFocusSupported` 값에 따라 노출 제어.
  * `App.tsx`에서 `useCamera`의 `triggerAutoFocus` 메서드를 `Toolbar`의 `onTriggerAutoFocus` 프로프와 매핑.
* **인수 조건**: 하단바 좌측에 자동초점 버튼이 올바르게 나타나며, 클릭 시 오토포커싱 요청이 송신됨.

---

## 3. 의존성 및 우선순위 그래프
```mermaid
graph TD
    T1["1. 기본 좌우반전 설정"] --> T2["2. 판서 좌표계 역변환 보정"]
    T3["3. 자동 초점 API 연동"] --> T4["4. 자동 초점 버튼 UI 추가"]
```
