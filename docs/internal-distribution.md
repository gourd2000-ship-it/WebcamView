# 교내용 무료 Windows 배포

이 절차는 **공개 인터넷 배포용이 아니다.** 공유할 PC가 소수이고, 각 PC의 관리자 권한자가 한 번씩 설치를 도와줄 수 있을 때 사용한다.

## 배포자가 처음 한 번 할 일

PowerShell에서 프로젝트 폴더로 이동한 뒤 다음 명령을 실행한다.

```powershell
.\scripts\new-internal-signing-certificate.ps1
```

명령은 기본적으로 현재 Windows 사용자 전용 폴더 `%LOCALAPPDATA%\WebcamViewer\signing`에 두 파일을 만든다.

- `webcamviewer-internal-signing.pfx`: 비밀키. 빌드 PC에만 보관하고 Git, 메신저, 이메일, 공유 드라이브에 올리지 않는다.
- `webcamviewer-internal-signing.cer`: 공개 인증서. 수신 PC의 관리자에게 전달한다.

인증서를 새로 만들면 기존 앱의 업데이트 서명자와 달라진다. 따라서 PFX와 암호를 안전한 곳에 보관하고, 유효 기간이 끝나기 전까지 같은 PFX를 계속 사용한다.

이 내부 배포 흐름은 Windows SDK의 SignTool을 사용하며 외부 RFC 3161 타임스탬프를 붙이지 않는다. 따라서 Windows SDK의 **Signing Tools for Desktop Apps** 구성 요소가 빌드 PC에 있어야 한다. 새 설치·업데이트는 인증서의 기본 5년 유효 기간 안에 배포하고, 만료 전에 새 인증서와 신뢰 설정으로 교체해야 한다.

## 서명된 AppX 만들기

빌드 PC에서 실행한다.

```powershell
npm run package:internal -- -PfxPath "$env:LOCALAPPDATA\WebcamViewer\signing\webcamviewer-internal-signing.pfx"
```

성공하면 `dist-packaged`에 `.appx` 파일이 만들어진다. 아래처럼 새 배포 폴더를 만들어 파일을 복사한다. `portable.exe`, ZIP, 기존 설치 EXE는 배포하지 않는다.

```text
배포폴더/
├─ 01_인증서_등록.bat                       # 저장소 루트에 있는 파일을 복사
├─ webcamviewer-internal-signing.cer         # 공개 인증서만 복사
└─ 02_WebcamViewer.appx                      # 새로 빌드한 AppX를 이 이름으로 복사
```

`.pfx`, PFX 암호, `scripts` 폴더는 배포 폴더에 넣지 않는다.

## 수신 PC에서 할 일

1. 전달받은 세 파일이 같은 배포자에게서 왔는지 확인한다.
2. `01_인증서_등록.bat`를 마우스 오른쪽 버튼으로 클릭하고 **관리자 권한으로 실행**한다.
3. 완료 메시지가 나오면 `02_WebcamViewer.appx`를 열고 설치한다.

BAT는 공개 `.cer`가 없거나, 이름이 다른 인증서이면 등록하지 않고 종료한다. 성공 시에만 `로컬 컴퓨터 > Trusted People`에 공개 인증서를 추가한다. 이후 이 인증서로 서명된 WebcamViewer 업데이트를 같은 PC에서 설치할 수 있다. PFX 또는 PFX 암호는 수신 PC에 전달하지 않는다.

## 문제가 생겼을 때

- 관리자 권한이 없다면 이 방식으로 인증서를 신뢰시킬 수 없다. PC 관리자에게 3단계를 요청한다.
- 인증서 주체가 다르다는 오류가 나면, 배포한 `.cer`와 `.appx`가 같은 인증서에서 나온 것이 아니다. 둘을 같은 릴리스에서 다시 준비한다.
- 학교의 별도 앱 실행 정책(WDAC/AppLocker)이 차단하면 이 인증서 등록만으로 우회하지 않는다. 해당 정책 관리자에게 앱 허용을 요청해야 한다.

## 근거

- Microsoft는 MSIX/AppX가 서명되고 장치에서 신뢰되어야 설치되며, 자체 서명 인증서는 무료의 로컬 테스트·내부 배포 옵션이라고 설명한다: <https://learn.microsoft.com/en-us/windows/msix/package/signing-package-overview>
- Microsoft의 MSIX 문제 해결 안내는 자체 서명 패키지의 인증서를 `Local Computer > Trusted People`에 설치하도록 안내한다: <https://learn.microsoft.com/en-us/windows/msix/msix-troubleshooting-guide>
- electron-builder 26.15.3은 Windows `appx` 대상과 `CSC_LINK`/`CSC_KEY_PASSWORD` 인증서 환경변수를 지원한다. 이 프로젝트에 설치된 버전의 설정 스키마로 검증했다.
