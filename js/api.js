// 백엔드 REST API와 통신하는 레이어입니다. 실제 서비스 연결 시 endpoint별 내부 구현만 교체합니다.
const CHAT_ENDPOINT = "/api/chat";
const LOGIN_ENDPOINT = "/api/login";

export async function loginUser({ name, studentId, department }) {
  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, studentId, department })
    });

    if (!response.ok) {
      throw new Error(`Login API failed with ${response.status}`);
    }

    return await response.json();
  } catch {
    return {
      id: crypto.randomUUID(),
      name,
      studentId,
      department,
      source: "mock"
    };
  }
}

export async function sendChatMessage({ message, history }) {
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history
      })
    });

    if (!response.ok) {
      throw new Error(`Chat API failed with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // 정적 파일로 열었을 때도 프론트엔드 흐름을 확인할 수 있도록 임시 응답을 제공합니다.
    return createMockChatResponse(message, error);
  }
}

function createMockChatResponse(message, error) {
  return {
    id: crypto.randomUUID(),
    reply: `임시 응답입니다. 실제 서버가 연결되면 "${message}"에 대한 모델 응답이 이 자리에 표시됩니다.`,
    summary: "현재는 Mock 응답으로 UI와 상태 관리 흐름을 검증 중입니다.",
    source: "mock",
    error: error.message
  };
}
