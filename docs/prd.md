# Product Requirements Document (PRD): 로컬 실물화상기 앱 (WebcamViewer)

본 문서는 교실 환경에서 USB 웹캠 및 노트북 내장 카메라를 실물화상기처럼 사용하기 위한 Windows 데스크톱 애플리케이션의 요구사항을 정의합니다. 본 서비스는 오프라인에서 완전히 로컬로 동작하며 보안과 사용성에 초점을 맞춥니다.

---

## 1. 프로젝트 개요
- **제품명**: WebcamViewer (로컬 실물화상기)
- **개발 환경**: Windows Desktop App
- **대상 사용자**: 학교 교실에서 웹캠을 통해 수업 자료(교과서, 공책, 학생 결과물)를 학생들에게 보여주려는 교사
- **핵심 가치**: 
  - **100% 로컬 프라이버시**: 영상 데이터가 외부 서버로 전송되지 않음
  - **무설치형 오프라인 동작**: 인터넷이 안 되는 교실 환경에서도 정상 실행 가능
  - **직관적 사용성**: 전자칠판 등에서 터치하여 조작하기 쉬운 UI 및 전역 단축키

---

## 2. 주요 기술 스택
- **Application Shell**: Electron
- **Renderer Framework**: React, TypeScript, Vite
- **Styling**: TailwindCSS
- **Packager**: electron-builder (Windows `.exe` 빌드 지원)

---

## 3. 기능적 요구사항 (Functional Requirements)

### 3-1. 카메라 관리 (Camera Management)
- **장치 나열**: PC에 연결된 모든 비디오 입력 장치(USB 웹캠, 내장 카메라 등) 목록을 감지하고 드롭다운 메뉴로 제공해야 합니다.
- **스트림 시작/중지**: 버튼 클릭을 통해 카메라 스트림을 활성화/비활성화할 수 있어야 합니다.
- **스트림 전환**: 드롭다운에서 다른 카메라를 선택하면 즉시 기존 스트림을 해제(cleanup)하고 새로운 카메라로 전환되어야 합니다.
- **메모리 및 하드웨어 누수 방지**: 카메라가 중지되거나 앱이 종료될 때, 모든 활성 `MediaStreamTrack`은 반드시 `.stop()` 처리되어야 합니다.

### 3-2. 화면 제어 및 변환 (View Manipulation)
- **좌우반전**: 거울 모드 또는 정상 출력 모드로 즉시 전환할 수 있어야 합니다 (CSS `scaleX(-1)` 적용).
- **90도 회전**: 클릭 시 화면이 시계 방향으로 90도씩 회전해야 합니다 (0도 -> 90도 -> 180도 -> 270도 -> 0도 순환).
- **확대/축소**: 화면 비율을 10% 단위로 확대(최대 500%) 및 축소(최소 100%)할 수 있어야 합니다.
- **초기화**: 원클릭으로 확대율(100%), 회전(0도), 좌우반전을 기본값으로 리셋할 수 있어야 합니다.
- **화면 정지 (Freeze)**:
  - 현재 실시간 비디오 프레임을 Canvas에 드로잉하여 정지 이미지 상태로 화면을 고정합니다.
  - 정지 상태 중에도 확대, 회전, 좌우반전, 캡처 등 화면 제어는 동일하게 작동해야 합니다.
  - 정지 해제 시 다시 라이브 웹캠 영상으로 복구됩니다.

### 3-3. 캡처 및 저장 (Capture & Storage)
- **로컬 디스크 저장**: 캡처 버튼 누름 시 사용자 시스템에 이미지 파일로 저장됩니다.
- **상태 보존**: 캡처 이미지는 저장 시점의 **반전 상태, 회전 각도, 확대율, 화면 정지 상태**가 그대로 반영되어야 합니다.
- **파일 포맷 및 파일명**: PNG 형식으로 저장되며, 파일명은 날짜와 시간 정보를 포함해야 합니다.
  - 예시: `webcam-capture-2026-06-25-143012.png`
- **저장 위치**: 기본적으로 사용자 라이브러리의 '사진(Pictures)' 디렉터리 내에 `WebcamViewer` 폴더를 생성하여 저장하거나 파일 저장 대화상자를 띄울 수 있습니다. 본 MVP에서는 편리성을 위해 '사진' 폴더 또는 앱 실행 폴더 내 `captures` 폴더에 자동 무인 저장하는 구조를 기본으로 설계합니다.

### 3-4. 단축키 (Keyboard Shortcuts)
어느 상태(전체화면 포함)에서든 아래 단축키가 즉각 실행되어야 합니다.
- `Space`: 화면 정지 / 정지 해제
- `F`: 전체화면 토글 (진입/종료)
- `M`: 좌우반전 토글
- `R`: 시계방향 90도 회전
- `+` (또는 `=`): 화면 확대 (Zoom In)
- `-`: 화면 축소 (Zoom Out)
- `0`: 화면 변환 초기화 (Reset)
- `C`: 현재 화면 캡처 저장
- `Esc`: 전체화면 종료

---

## 4. 비기능 및 보안 요구사항 (Non-Functional & Security)
- **로컬 격리**: 어떠한 경우에도 외부 API나 서버 통신을 시도하지 않습니다.
- **보안 설정 (Electron)**:
  - `nodeIntegration: false` 및 `contextIsolation: true` 필수 적용.
  - Preload 스크립트를 통해서만 `saveCapture` 등 최소한의 Native API 인터페이스 노출.
  - 앱 내 리소스만 로딩하도록 Content Security Policy(CSP) 설정 적용.
- **사용자 경험 (UI/UX)**:
  - 전자칠판 터치를 고려한 **최소 48px 이상의 대형 버튼 크기** 확보.
  - 시인성이 우수한 다크 테마 배경 채택 (영상 집중도 강화).
  - 현재 카메라 명칭, 확대비율, 회전 상태 등을 직관적으로 보여주는 상태 표시줄 제공.
- **신뢰성**:
  - 카메라 권한이 거부되었거나 사용 중인 다른 앱이 있을 때 앱이 크래시되지 않고 직관적인 에러 메시지를 띄워야 합니다.

---

## 5. 예외 및 예외 처리 (Exception Handling)
- **카메라 장치가 감지되지 않음**: "연결된 카메라가 없습니다. 장치를 확인해 주세요." 안내 및 Empty State 제공.
- **권한 거부**: "카메라 접근 권한이 거부되었습니다. Windows 설정에서 앱의 카메라 권한을 허용해 주세요." 에러 출력.
- **파일 저장 실패**: 디스크 공간 부족이나 권한 이슈 등으로 캡처 저장이 실패했을 때 에러 알림 제공.
- **해상도 지원 범위 초과**: 카메라의 기본 해상도 비율이 다를 경우 비디오 요소가 화면 중앙에 레터박스를 유지하며 균형 있게 맞춰져야 합니다 (Object-fit 설정).

---

## 6. 완성 및 검증 기준 (Definition of Done)
1. 앱 실행 시 활성 카메라 스트림이 정상 표시된다.
2. 툴바의 모든 기능(전체화면, 반전, 회전, 줌, 정지, 캡처)이 마우스 및 단축키로 제어된다.
3. 캡처 시 변환 상태가 포함된 PNG 파일이 로컬 디렉터리에 정확하게 저장된다.
4. 오프라인 실행 및 이전 카메라 스트림 청소가 올바르게 보장된다.
5. Windows용 `.exe` 빌드가 에러 없이 수행되고 정상 실행된다.

---

## 7. Windows 신뢰 배포 개선 PRD

> **문서 상태**: Draft — 구현 전 사용자 검토 필요<br>
> **작성 기준일**: 2026-09-22<br>
> **적용 범위**: Windows 10/11에서 WebcamViewer를 배포·설치·실행하는 과정<br>
> **문서 목적**: 현재 제품 기능은 변경하지 않고, Windows 보안 기능을 끄지 않은 상태에서 신뢰 가능한 배포 경로를 마련한다.

### 7-1. 문제 정의 및 현재 기준선

현재 `electron-builder`는 `nsis`, `portable`, `zip` 대상을 만들지만 공개 배포용 코드 서명 설정은 없다. 2026-09-22에 `dist-packaged`의 실행 산출물을 `Get-AuthenticodeSignature`로 점검한 결과, 다음 파일을 포함한 모든 검사 대상이 `NotSigned`였다.

- `WebcamViewer Setup 1.0.0.exe`
- `WebcamViewer 1.0.0.exe`
- `WebcamViewer.exe`
- `win-unpacked/WebcamViewer.exe`
- `win-unpacked/resources/elevate.exe`

또한 출력 폴더에 `WebcamViewer Setup 0.0.0.exe`와 `1.0.0` 산출물이 함께 남아 있어, 이전 릴리스 파일이 새 릴리스에 섞일 수 있다.

Microsoft Defender SmartScreen은 다운로드한 파일의 파일 해시 평판과 서명 인증서/게시자 평판을 함께 평가한다. 서명되지 않은 새 버전은 버전마다 평판을 처음부터 다시 쌓아야 하며, Windows 11의 Smart App Control은 알려지지 않은 서명 없는 실행 파일을 차단할 수 있다. 따라서 현재 증상과 직접 연관성이 가장 높은 확인된 요인은 **모든 배포 산출물이 서명되지 않았다는 것**이다.

`portable` 대상은 단일 EXE를 실행할 때 내부 앱을 임시 디렉터리에 풀고 실제 앱 EXE를 다시 실행한다. 이 과정은 일반 설치본보다 시작 비용이 크며, 각 단계의 파일이 서명되지 않았다면 실시간 검사 대상도 늘어난다. 다만 “두 번 중 한 번”이라는 빈도만으로 SmartScreen, Defender Antivirus 오탐, Smart App Control, 학교의 WDAC/AppLocker 정책 중 어느 하나를 최종 원인으로 단정하지 않는다. Phase 1 진단에서 실제 차단 화면과 이벤트 로그로 분류한다.

### 7-2. 명시적 가정

1. 배포 대상은 일반 Windows 10/11 PC와 학교 관리 PC를 모두 포함한다.
2. Windows Defender, SmartScreen 또는 Smart App Control을 끄게 하는 방식은 허용하지 않는다.
3. 앱은 설치 후 기존 요구사항대로 네트워크 없이 카메라, 캡처, 녹화 기능을 사용할 수 있어야 한다.
4. 공개 배포용 게시자 이름은 실제 개인 또는 법인 신원 검증을 통과할 수 있어야 한다.
5. “차단 없음”은 Microsoft Store 설치본의 SmartScreen 다운로드 경고를 의미한다. 조직의 WDAC/AppLocker 정책, 타사 백신 오탐, 관리자가 명시적으로 거부한 정책까지 우회하는 것을 의미하지 않는다.
6. 아래 기본 결정은 사용자 검토 전까지 임시값이다.
   - 일반 사용자 기본 배포: **Microsoft Store AppX/MSIX**
   - 인터넷 또는 Store를 사용할 수 없는 사용자용 보조 배포: **공개 신뢰 인증서로 서명한 NSIS EXE**
   - 중앙 관리 학교용 배포: **서명된 AppX/MSIX + Intune/그룹 정책**
   - PWA: 네이티브 저장·전체화면·오프라인 동등성을 검증하는 별도 후보

### 7-3. 목표와 비목표

#### 목표

- 사용자가 출처 불명의 게시자 대신 검증된 게시자 이름을 확인할 수 있게 한다.
- Microsoft Store에서 설치한 버전은 SmartScreen 다운로드 경고 없이 실행되게 한다.
- Store 외 EXE는 Authenticode 서명, SHA-256, RFC 3161 타임스탬프를 적용하고 Smart App Control의 서명 요구사항을 충족하게 한다.
- 서명 누락, 만료, 잘못된 게시자, 이전 버전 혼입을 릴리스 전에 자동 차단한다.
- 설치 후 완전 오프라인으로 핵심 카메라 기능을 사용할 수 있게 한다.
- 실제 문제가 SmartScreen 경고인지, Defender 오탐인지, 조직 정책 차단인지 재현 가능한 정보로 구분한다.

#### 비목표

- Windows 보안 설정을 해제하거나 사용자에게 “추가 정보 → 실행” 우회를 요구하지 않는다.
- 파일 확장자 변경, ZIP 압축, PowerShell/배치 래퍼 등으로 평판 검사를 피하지 않는다.
- 자체 서명 인증서를 불특정 사용자 PC에 수동 설치하게 하지 않는다.
- 코드 서명이 악성코드 검사나 학교 보안 정책을 무조건 통과한다고 보장하지 않는다.
- 이번 단계에서 카메라·판서·녹화 기능 자체를 다시 설계하지 않는다.

### 7-4. Capability Map

| 모듈 ID | 책임 | 의존성 |
|---|---|---|
| `release-evidence` | 차단 유형 진단, 산출물 목록·해시·서명·버전 검증 및 릴리스 증적 생성 | 없음 |
| `trusted-exe-distribution` | 공개 신뢰 인증서로 NSIS/포터블 EXE와 내부 실행 코드를 서명·타임스탬프하여 직접 배포 | `release-evidence` |
| `non-exe-distribution` | Store AppX/MSIX, 관리형 사이드로드, PWA 중 조건에 맞는 비-EXE 사용자 경로 제공 | `release-evidence` |

구현 순서는 `release-evidence` → `trusted-exe-distribution`과 `non-exe-distribution` 병행이다. 각 모듈은 독립적으로 출시·검증할 수 있으며, 이 PRD 승인 후 모듈별 기술 계획과 작업 목록을 작성한다.

### 7-5. 조사 결론 및 배포 방식 결정표

| 배포 방식 | SmartScreen/차단 관점 | 오프라인 사용 | 요구 조건 | 결정 |
|---|---|---:|---|---|
| Microsoft Store AppX/MSIX | Store가 패키지를 Microsoft 인증서로 다시 서명하므로 SmartScreen **다운로드 경고 대상이 아님** | 설치 후 가능 | Partner Center 등록, Store 자산, 인증 통과 | **일반 사용자 기본안** |
| 공개 신뢰 인증서로 서명한 NSIS EXE | 게시자 확인 및 인증서 평판 승계 가능. 단, 새 인증서는 초기 “인식되지 않은 앱” 경고 가능 | 가능 | Artifact Signing 또는 CA 인증서, 타임스탬프, 안정된 게시자 | **오프라인 배포 보조안** |
| 서명된 AppX/MSIX 직접 배포 | EXE 대신 App Installer 사용. 공개 신뢰 인증서 또는 대상 PC에 미리 배포한 조직 인증서 필요 | 가능 | 인증서 신뢰, 사이드로드 허용, 선택적으로 Intune/MDM | **학교 관리 PC 권장안** |
| Edge 설치형 PWA | 다운로드 EXE가 없어 실행 파일 SmartScreen 관문은 없음 | 최초 설치·캐시 후 가능 | HTTPS, manifest, service worker, 브라우저 카메라 권한 | **타당성 검증 후 선택안** |
| 자체 서명 EXE/MSIX | 해당 인증서를 미리 신뢰시킨 PC 외에는 서명 없음과 사실상 동일 | 가능 | 사용자별 인증서 설치 필요 | 공개 배포 금지 |
| unsigned portable/ZIP | ZIP 안의 EXE도 검사되며 신뢰 문제가 해결되지 않음. 포터블은 매 실행 시 압축 해제 비용도 발생 | 가능 | 없음 | 기본 배포에서 제외 |

중요한 제약은 다음과 같다.

- **Store 밖의 직접 EXE 배포에서 첫 다운로드부터 SmartScreen 경고가 절대 나타나지 않는다고 보장할 수 없다.** Microsoft 문서상 유효한 OV/EV 인증서도 평판이 형성되기 전에는 경고가 나타날 수 있으며, EV 인증서가 즉시 평판을 부여하던 과거 동작은 더 이상 제공되지 않는다.
- 반대로 Store에서 배포한 AppX/MSIX는 Microsoft 인증서로 다시 서명되며 SmartScreen 다운로드 경고를 피하는 가장 확실한 공식 경로다.
- Store에 기존 EXE 링크만 등록하는 방식은 Store가 EXE를 다시 서명하지 않으므로 이번 목표의 기본안이 아니다. 반드시 패키지형 AppX/MSIX 제출을 사용한다.

### 7-6. 기능 요구사항

#### 7-6-1. `release-evidence`

- 릴리스 빌드는 빈 전용 출력 디렉터리에서 시작해야 한다. 이전 버전 산출물을 재사용하거나 같은 폴더에 섞지 않는다.
- 모든 사용자 배포 산출물에 `package.json`과 동일한 버전이 포함되어야 한다. `0.0.0` 같은 불일치가 발견되면 릴리스를 실패 처리한다.
- 릴리스별로 다음 내용을 포함하는 manifest를 생성해야 한다.
  - 제품명, 앱 버전, 빌드 시각, Git commit
  - 파일명, 크기, SHA-256 해시
  - 서명 상태, 게시자 Subject, 인증서 Thumbprint, 타임스탬프 상태
  - 패키지 대상(`nsis`, `portable`, `appx`)
- 사용자 제보에는 다음 진단 정보를 받는 절차를 제공해야 한다.
  - 경고/차단 화면 캡처와 정확한 문구
  - Windows 버전과 에디션
  - Smart App Control 상태
  - 파일 SHA-256 및 디지털 서명 상태
  - Windows Security 보호 기록 또는 관련 이벤트 시간
  - 설치형/포터블/Store/PWA 중 사용 경로
- Defender가 악성 또는 PUA로 탐지한 경우에만 Microsoft Security Intelligence의 “Software developer” 경로로 해당 버전 파일을 제출한다. SmartScreen의 단순 “흔히 다운로드되지 않음” 평판은 수동 허용 목록 신청으로 해결할 수 없음을 운영 문서에 명시한다.

#### 7-6-2. `trusted-exe-distribution`

- 프로덕션 EXE는 Microsoft Trusted Root Program에 연결되는 **RSA 기반 공개 신뢰 코드 서명 인증서**로 서명해야 한다. ECC 인증서는 현재 Smart App Control 호환 경로에서 사용하지 않는다.
- 기본 서명 공급자는 Microsoft Artifact Signing의 `Public Trust` 프로필로 한다.
  - 대한민국 법인/조직은 현재 Public Trust 대상 지역에 포함된다.
  - 대한민국 거주 개인 개발자는 현재 개인 Public Trust 대상이 아니므로, 개인 명의 배포라면 CA 발급 OV 코드 서명 인증서를 대안으로 사용한다.
  - 실제 신청 전 Microsoft의 최신 국가·신원 요건을 다시 확인한다.
- 서명 알고리즘은 SHA-256, 타임스탬프는 RFC 3161 + SHA-256을 사용한다.
- 외부 설치 파일만이 아니라 앱 EXE, DLL, helper, 임시 설치/제거 실행 파일 등 로드 가능한 모든 실행 코드는 유효한 신뢰 서명을 가져야 한다.
- 동일 제품의 모든 릴리스에서 법적으로 검증된 동일 게시자 이름과 인증서 계보를 유지한다.
- 인증서 개인 키, PFX, 암호, Azure client secret을 저장소·빌드 로그·배포 파일에 포함하지 않는다. 가능하면 CI의 OIDC/워크로드 ID와 최소 권한 `Artifact Signing Certificate Profile Signer` 역할을 사용한다.
- 현재 `scripts/setup-self-sign.ps1`은 개발 PC 전용임을 명시하고 공개 릴리스 흐름에서 제거한다. 하드코딩된 PFX 암호와 “SmartScreen이 허용한다”는 단정 문구도 제거 또는 교정한다.
- `portable`은 서명 완료 후에도 시작 시간과 Defender 재검사를 비교 측정한다. 설치형 NSIS보다 유의미하게 느리거나 반복 검사가 발생하면 기본 다운로드에서 제외하고 USB/무설치 요구에만 제공한다.
- 서명이 끝난 파일은 압축·리소스 수정·재패키징하지 않는다. 변경이 필요하면 다시 빌드하고 다시 서명한다.

#### 7-6-3. `non-exe-distribution`

**A. Microsoft Store AppX/MSIX — 기본안**

- 현재 `electron-builder` 26의 `appx` target으로 Store 제출용 패키지를 먼저 검증한다. `electron-builder` 27의 별도 `msix` target 업그레이드는 필요성이 확인된 경우에만 별도 승인한다.
- Partner Center에서 예약한 `Identity.Name`, `Publisher`, `PublisherDisplayName`을 대소문자와 공백까지 정확하게 빌드 설정에 반영한다.
- 패키지 manifest에는 Electron 실행에 필요한 `runFullTrust`와 실제 사용하는 `webcam`, `microphone` capability만 선언하고 불필요한 capability를 추가하지 않는다.
- Store용 아이콘·타일·스크린샷·개인정보 처리방침·오프라인 동작 설명을 준비한다.
- Windows App Certification Kit를 통과한 패키지만 Partner Center 비공개 flight에 제출한다.
- Store 설치본에서 카메라/마이크 권한, Pictures/Videos 저장, 전체화면, 앱 종료, 보조 모니터 시작이 기존 EXE와 동등하게 동작해야 한다.
- Store 인증 후 Microsoft가 다시 서명한 패키지를 일반 사용자 기본 다운로드 경로로 안내한다.

**B. 관리형 학교용 AppX/MSIX 사이드로드**

- 학교 IT가 Intune, Configuration Manager 또는 그룹 정책을 운영하는 경우에만 제공한다.
- 공개 신뢰 인증서로 서명하거나, 학교가 관리하는 인증서를 MDM/GPO를 통해 대상 PC의 신뢰 저장소에 먼저 배포한다.
- 인증서 설치를 개별 교사에게 맡기지 않는다.
- 앱 허용 정책이 있는 학교에서는 Publisher rule을 사용할 수 있도록 게시자·제품명·버전 정책 예시를 관리자 문서로 제공한다.

**C. 설치형 PWA — 선택안**

- 기존 React 화면을 Electron API와 브라우저 API 사이의 adapter로 분리할 수 있는지 먼저 검증한다.
- HTTPS origin, web app manifest, 192px/512px 아이콘, service worker를 제공한다.
- 첫 설치 후 네트워크를 끊고 재부팅해도 앱 셸과 핵심 카메라 기능이 실행되어야 한다.
- `getUserMedia()`의 카메라/마이크 권한 흐름을 브라우저 기준으로 다시 검증한다.
- 캡처·녹화 저장은 Electron IPC 대신 File System Access API 또는 명시적 브라우저 다운로드로 대체한다. 사용자가 선택한 폴더 권한이 없는 경우의 UX를 정의한다.
- 보조 모니터 자동 배치, 앱 강제 종료, 무인 파일 저장 등 브라우저에서 동일하게 제공하기 어려운 기능 차이를 문서화한다.
- “최초 설치도 인터넷 없이 USB만으로 가능”이 필수라면 PWA는 단독 기본안으로 채택하지 않는다. 이 경우 Store AppX/MSIX 또는 관리형 사이드로드를 사용한다.

### 7-7. 기술 스택과 설정 원칙

- 기존: Electron 42, React 19, TypeScript 6, Vite 8, electron-builder 26
- 직접 EXE 서명 우선안: Microsoft Artifact Signing Public Trust + 현재 electron-builder 26의 `win.azureSignOptions`
- 직접 EXE 서명 대안: Microsoft Trusted Root Program 소속 CA의 RSA OV 인증서 + `win.signtoolOptions`
- Store 패키지: 현재 버전의 `appx` target, Partner Center, Windows App Certification Kit
- PWA 후보: Vite PWA 구성, web app manifest, service worker, browser storage/file adapter

설정은 다음 원칙을 따라야 한다.

- 계정명·프로필명·게시자명은 명시적으로 관리하되 비밀값은 환경 변수 또는 CI secret에 둔다.
- 운영 서명과 개발 자체 서명을 같은 명령으로 실행하지 않는다.
- 인증 정보가 없으면 운영 패키지 명령은 unsigned 결과를 성공으로 취급하지 않고 실패해야 한다.
- `appId`, `productName`, Store identity, 서명 Publisher를 릴리스 도중 임의 변경하지 않는다.

릴리스 검증 스크립트의 코드 스타일 예시는 다음과 같다.

```powershell
$releaseFiles = Get-ChildItem -LiteralPath $ReleaseDirectory -Recurse -File |
    Where-Object { $_.Extension -in '.exe', '.dll', '.msi', '.appx', '.msix' }

$invalidFiles = foreach ($file in $releaseFiles) {
    $signature = Get-AuthenticodeSignature -LiteralPath $file.FullName
    if ($signature.Status -ne 'Valid') {
        [PSCustomObject]@{
            Path   = $file.FullName
            Status = $signature.Status
        }
    }
}

if ($DistributionMode -eq 'direct' -and $invalidFiles) {
    $invalidFiles | Format-Table -AutoSize
    throw 'Direct Windows release contains unsigned or invalidly signed files.'
}
```

`DistributionMode=direct`는 사용자가 직접 받는 EXE/MSI에 공개 신뢰 서명을 강제한다. Store 업로드용 AppX/MSIX는 로컬 테스트 서명을 허용할 수 있지만, Store 인증 후 사용자에게 전달되는 패키지가 Microsoft 서명인지 별도로 확인한다.

PowerShell 변수는 `PascalCase`, 환경 변수는 `UPPER_SNAKE_CASE`, capability/module ID는 `kebab-case`를 사용한다. 오류를 경고만 출력하고 계속 진행하지 말고 non-zero exit로 릴리스를 중단한다.

### 7-8. 명령 계약

개발 및 기존 품질 검사:

```powershell
npm ci
npm run lint
npm run build
```

직접 배포용 Windows 패키지 후보 생성:

```powershell
npx electron-builder --win nsis portable --x64
```

Store 제출용 AppX 후보 생성:

```powershell
npx electron-builder --win appx --x64
```

개별 산출물의 Authenticode 검증:

```powershell
Get-AuthenticodeSignature -LiteralPath '.\dist-packaged\WebcamViewer Setup 1.0.0.exe' |
    Format-List Status, StatusMessage, SignerCertificate, TimeStamperCertificate

signtool verify /pa /all /v '.\dist-packaged\WebcamViewer Setup 1.0.0.exe'
Get-FileHash -Algorithm SHA256 -LiteralPath '.\dist-packaged\WebcamViewer Setup 1.0.0.exe'
```

Store 패키지 인증 사전 검사:

```powershell
& 'C:\Program Files (x86)\Windows Kits\10\App Certification Kit\appcert.exe' reset
& 'C:\Program Files (x86)\Windows Kits\10\App Certification Kit\appcert.exe' test `
    -appxpackagepath '.\dist-packaged\WebcamViewer.appx' `
    -reportoutputpath '.\artifacts\wack-report.xml'
```

실제 파일명은 버전·아키텍처 패턴에서 자동 검색하되, 검색 결과가 0개 또는 2개 이상이면 검증 스크립트가 실패해야 한다.

### 7-9. 예정 프로젝트 구조

```text
scripts/
├─ setup-self-sign.ps1              # 개발 전용으로 제한·문구 교정
├─ verify-windows-release.ps1       # 서명, 타임스탬프, 버전, 해시 검증
└─ collect-windows-block-report.ps1 # 사용자 PC의 비밀정보 제외 진단 수집

build/
└─ appx/                            # Store 아이콘·타일 자산

artifacts/                          # CI가 생성하는 manifest/WACK 보고서, Git 제외

src/platform/
├─ desktopAdapter.ts                # 기존 Electron IPC 구현
└─ webAdapter.ts                    # PWA를 채택할 때만 추가

tests/release/
└─ windows-release-checklist.md     # 깨끗한 VM/Store flight 검증 기록
```

PWA가 채택되지 않으면 `src/platform/webAdapter.ts`와 관련 PWA 의존성은 만들지 않는다.

### 7-10. 테스트 전략

#### 자동 검증

- `npm run lint`와 `npm run build`가 성공해야 한다.
- 릴리스 산출물 전체의 Authenticode 상태가 `Valid`여야 한다.
- 인증서 Subject가 승인된 게시자와 일치해야 한다.
- SHA-256 파일 해시와 릴리스 manifest가 일치해야 한다.
- 타임스탬프가 존재하고 인증서 만료 이후에도 서명을 검증할 수 있어야 한다.
- 산출물 버전이 `package.json` 버전과 일치해야 한다.
- 깨끗한 출력 디렉터리 외 파일이 릴리스 묶음에 포함되면 실패해야 한다.
- AppX/MSIX는 Windows App Certification Kit에서 오류 없이 통과해야 한다.

#### 깨끗한 Windows 환경 수동/E2E 검증

다음 환경에서 각 릴리스 후보를 처음 다운로드한 상태부터 검증한다.

- 최신 보안 업데이트가 적용된 지원 Windows 11
- 학교가 실제 운영 중인 Windows 10 ESU 또는 관리 이미지가 있다면 해당 이미지
- SmartScreen 활성화
- Smart App Control 평가/적용 환경 각각 가능한 범위
- 관리자 권한이 없는 표준 사용자
- 온라인 설치 후 네트워크가 차단된 상태

각 환경에서 다음을 확인한다.

1. 다운로드부터 첫 화면 표시까지 걸린 시간을 기록한다.
2. 게시자 이름, 경고 문구, 하드 블록 여부를 기록한다.
3. 설치형, 포터블, Store 패키지를 각각 5회 냉간 실행해 중앙값과 최댓값을 비교한다.
4. 카메라·마이크 권한, 장치 전환, 화면 정지, 판서, PNG 캡처, WebM 녹화, 전체화면, 보조 모니터를 회귀 테스트한다.
5. 설치 제거 후 파일·바로가기·권한이 비정상적으로 남지 않는지 확인한다.
6. Store/PWA 경로는 설치 후 네트워크를 끊고 재부팅한 뒤 핵심 기능을 다시 확인한다.

Defender가 파일을 악성/PUA로 명시 탐지한 경우, 같은 해시를 Microsoft Security Intelligence에 제출하고 최종 판정 전 해당 버전을 공개하지 않는다.

### 7-11. 단계별 출시 계획과 의사결정 게이트

#### Phase 1 — 원인 분류와 릴리스 증적

- 서명·버전·해시 검증 스크립트를 만든다.
- 실제 차단이 발생한 PC 3대 이상에서 진단 정보를 수집한다.
- SmartScreen 평판 경고, Smart App Control 차단, Defender 오탐, 조직 정책 차단, 단순 포터블 압축 해제 지연으로 분류한다.

**Gate 1**: 재현 사례가 분류되고 현재 unsigned 산출물이 자동으로 거부되어야 다음 단계로 진행한다.

#### Phase 2 — 서명된 EXE 보조 채널

- 게시 주체가 법인/개인인지 결정한다.
- 법인이고 자격을 충족하면 Artifact Signing Public Trust를 우선 적용한다.
- 자격이 없으면 RSA OV 인증서를 선택한다. EV는 조달 정책상 필요할 때만 선택하며 SmartScreen 즉시 평판을 이유로 구매하지 않는다.
- NSIS와 포터블 외부 파일 및 내부 실행 코드 전체를 서명·타임스탬프한다.
- 설치형과 포터블 실행 시간을 비교해 포터블 유지 여부를 결정한다.

**Gate 2**: 깨끗한 Windows에서 서명 검증과 Smart App Control 실행을 통과해야 보조 다운로드로 공개한다. 초기 SmartScreen 평판 경고가 0이어야 한다는 요구가 유지되면 이 채널은 기본 배포로 승격하지 않는다.

#### Phase 3 — Store AppX/MSIX 기본 채널

- Partner Center identity와 Store 자산을 준비한다.
- AppX 패키징 및 WACK 검증을 완료한다.
- 비공개 flight에서 기능 회귀와 오프라인 실행을 확인한다.
- 인증을 통과하면 Store 링크를 기본 배포 경로로 전환한다.

**Gate 3**: Store 설치본이 SmartScreen 다운로드 경고 없이 설치되고 핵심 기능 회귀가 없을 때 일반 배포 기본안으로 전환한다.

#### Phase 4 — 학교 관리 배포 및 PWA 선택 검증

- 관리형 학교에는 Intune/GPO용 AppX/MSIX 배포 가이드를 제공한다.
- PWA는 1개 수직 기능 흐름인 “카메라 열기 → 화면 변환 → PNG 저장 → 오프라인 재실행”만 먼저 프로토타입한다.
- 네이티브 기능 차이와 운영 비용을 평가한 후 PWA 정식 채택 여부를 별도 승인한다.

### 7-12. 경계 조건

#### 항상 수행

- 프로덕션 산출물을 SHA-256으로 서명하고 RFC 3161 타임스탬프를 적용한다.
- 릴리스마다 서명, 게시자, 버전, 해시, WACK 결과를 검증한다.
- 동일한 게시자 정체성과 제품 식별자를 유지한다.
- 개인 키와 인증 비밀을 CI 비밀 저장소 또는 관리형 서명 서비스에만 보관한다.
- Windows 보안 기능이 켜진 깨끗한 환경에서 첫 실행을 검증한다.

#### 먼저 확인 후 수행

- Artifact Signing 또는 상용 CA 비용 발생
- Partner Center 개인/법인 계정 생성 및 법적 게시자 이름 공개
- electron-builder 27 이상으로 메이저 업그레이드
- 공개 HTTPS 호스팅 또는 PWA 도입
- 기존 포터블 다운로드 폐지
- 학교 IT 정책, Intune 또는 인증서 배포 변경

#### 절대 수행하지 않음

- Defender, SmartScreen, Smart App Control 해제를 설치 안내로 제공
- 공개 릴리스에 자체 서명 인증서 사용
- PFX, 개인 키 또는 평문 암호 커밋
- 서명 후 바이너리 수정
- 사용자가 경고를 무시하도록 유도
- unsigned EXE를 ZIP, 확장자 변경 또는 스크립트로 감싸 신뢰 검사를 우회

### 7-13. 성공 기준

1. 직접 배포용 CI 또는 릴리스 명령은 unsigned/invalid/timestamp 누락 실행 코드가 하나라도 있으면 실패한다. Store 제출용 패키지는 별도 검증 모드를 사용한다.
2. 모든 릴리스 파일은 버전, SHA-256, 서명 정보가 포함된 manifest를 가진다.
3. Store AppX/MSIX는 WACK와 Store 인증을 통과하고 Microsoft가 다시 서명한 형태로 배포된다.
4. 깨끗한 일반 Windows PC에서 Store 설치본에 SmartScreen 다운로드 경고가 나타나지 않는다.
5. 서명된 EXE에서는 “알 수 없는 게시자”가 표시되지 않고 승인된 게시자 이름이 표시된다.
6. 서명된 EXE와 내부 실행 코드는 Smart App Control 서명 검증 테스트를 통과한다.
7. 설치 후 네트워크를 차단해도 기존 카메라·캡처·녹화 기능이 정상 동작한다.
8. 직접 EXE 경로에서 초기 SmartScreen 평판 경고가 발생할 수 있다는 제한이 다운로드 페이지에 정확히 안내된다.
9. 포터블 냉간 실행 시간이 설치형보다 허용 기준 이상 느리면 포터블을 기본 배포에서 제거한다. 허용 기준은 Phase 1 측정 후 확정한다.
10. 조직 정책에 의한 차단은 제품 결함과 구분되며, 학교 IT가 사용할 Publisher 기반 허용 정책 정보를 제공한다.

### 7-14. 미결정 사항

구현 전 다음 항목의 사용자 승인이 필요하다.

1. 게시자가 대한민국 법인/조직인지 개인인지
2. Microsoft Store 사용이 가능한지, 또는 최초 설치부터 인터넷 없이 USB 배포가 필수인지
3. 학교 PC가 Intune/GPO 등으로 중앙 관리되는지
4. 최소 지원 Windows 버전과 CPU 아키텍처가 x64 단일인지
5. 기본 배포를 Store로 전환하고 포터블 EXE를 보조 채널로 내리는 데 동의하는지
6. PWA가 잃게 되는 네이티브 기능을 허용할 수 있는지

미결정 상태의 기본 선택은 **Store AppX/MSIX를 일반 사용자 기본안으로, 서명된 NSIS EXE를 완전 오프라인 보조안으로 유지**하는 것이다.

### 7-15. 근거 자료

- [Microsoft — SmartScreen reputation for Windows app developers](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- [Microsoft — Microsoft Defender SmartScreen overview](https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/)
- [Microsoft — Smart App Control overview](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/overview)
- [Microsoft — Sign your app for Smart App Control compliance](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/code-signing-for-smart-app-control)
- [Microsoft — Artifact Signing quickstart and supported regions](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- [Microsoft — Artifact Signing trust models](https://learn.microsoft.com/en-us/azure/artifact-signing/concept-trust-models)
- [Microsoft — SignTool](https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool)
- [Microsoft — Time Stamping Authenticode Signatures](https://learn.microsoft.com/en-us/windows/win32/seccrypto/time-stamping-authenticode-signatures)
- [Microsoft — App package requirements for MSIX](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements)
- [Microsoft — Choose a distribution path for your Windows app](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path)
- [Microsoft — Windows App Certification Kit](https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/windows-app-certification-kit)
- [Microsoft — Sideload line-of-business apps](https://learn.microsoft.com/en-us/windows/application-management/sideload-apps-in-windows)
- [Microsoft — Submit a file for malware analysis](https://www.microsoft.com/en-us/wdsi/filesubmission)
- [Microsoft Edge — Get started developing a PWA](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/)
- [Microsoft Edge — Store data and files on the device](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/offline)
- [electron-builder 26 — Windows targets and signing options](https://www.electron.build/v26/docs/win/)
- [electron-builder — AppX target](https://www.electron.build/docs/appx/)
- [electron-builder — Portable target extraction template](https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/templates/nsis/portable.nsi)
