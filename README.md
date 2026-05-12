# Campus Mate

## 1단계: 전체 구조 설명

Campus Mate는 향후 챗봇을 통합할 수 있는 학생 포털형 웹사이트입니다. 챗봇은 첫 화면에 바로 보이지 않고, 로그인 후 오른쪽 아래의 원형 `CM Chat` 버튼에서 열립니다.

- 홈: 로그인 상태, 오늘 수업 수, 현재 GPA, 친구 수, 최근 활동을 보여줍니다.
- 로그인 시스템: `POST /api/login`으로 연결 가능한 구조이며, 서버가 없을 때도 Mock 로그인으로 UI 흐름을 확인합니다.
- 시간표: 과목명, 요일, 시간, 강의실을 입력해 주간 시간표에 추가합니다.
- 학점계산기: 과목별 이수 학점과 성적을 입력해 4.5 만점 평균 평점을 계산합니다.
- 친구창: 친구 이름과 상태 메시지를 추가하고 친구별 메시지 동작을 준비합니다.
- 챗봇: 로고 클릭으로 열리는 숨김 패널이며 `POST /api/chat`과 통신합니다.
- 결과 출력 영역: 로그인, 시간표, 학점, 친구, 챗봇 결과를 최근 활동으로 표시합니다.

## 2단계: 폴더 구조

```text
.
├── backend/
│   └── server.js
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── app.js
│   ├── components.js
│   └── state.js
├── index.html
├── package.json
└── README.md
```

## 3단계: 코드

- `index.html`: 학생 포털 레이아웃, 로그인, 시간표, 학점계산기, 친구창, 숨김 챗봇 패널을 정의합니다.
- `css/styles.css`: 포털 대시보드, 반응형 레이아웃, 시간표 테이블, GPA 목록, 친구창, 챗봇 드로어 스타일을 관리합니다.
- `js/app.js`: 로고 클릭 챗봇 열기, 로그인, 시간표 추가/삭제, GPA 계산, 친구 추가, 메시지 전송을 연결합니다.
- `js/api.js`: `/api/login`, `/api/chat` REST 호출을 담당하고 서버가 없을 때 Mock 응답을 제공합니다.
- `js/state.js`: 로그인 사용자, 메시지 히스토리, 로딩 상태, 마지막 결과를 관리합니다.
- `js/components.js`: 챗봇 메시지, 최근 활동, API 연결 상태를 렌더링합니다.
- `backend/server.js`: 정적 파일 제공, `POST /api/login`, `POST /api/chat` 예시 API를 제공합니다.

## 4단계: 챗봇 연결 방법

1. `backend/server.js`의 `createAssistantReply()` 내부를 실제 챗봇 API 호출로 교체합니다.
2. 프론트엔드는 계속 `js/api.js`의 `sendChatMessage()`만 사용합니다.
3. 요청 body는 `{ message, history }` 형태를 유지합니다.
4. 응답은 `{ id, reply, summary, source }` 형태로 반환합니다.
5. 스트리밍이 필요하면 `/api/chat/stream`을 새로 추가하고 `js/api.js`에 별도 함수를 추가합니다.

## 유지보수 및 확장 전략

- 인증 확장은 `/api/login`을 실제 세션, JWT, OAuth 서버로 교체합니다.
- 시간표, 학점, 친구 데이터는 현재 `localStorage`에 저장되며 이후 DB API로 옮기기 쉽도록 기능별 상태를 분리했습니다.
- UI 컴포넌트 교체는 `js/components.js`, 화면 동작 확장은 `js/app.js` 중심으로 처리합니다.
- 친구 메시지 기능은 향후 `/api/friends/messages` 같은 REST 엔드포인트로 확장하면 됩니다.

## 실행

```bash
npm start
```

또는 npm이 없는 환경에서는 다음처럼 실행할 수 있습니다.

```bash
node backend/server.js
```

브라우저에서 `http://127.0.0.1:3000`을 열면 됩니다.

다른 사람 컴퓨터에서도 열리는 공개 링크가 필요하면 [DEPLOY.md](./DEPLOY.md)를 따라 Render에 배포합니다.
