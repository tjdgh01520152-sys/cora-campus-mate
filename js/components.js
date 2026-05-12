// 재사용 가능한 렌더링 함수입니다. UI 컴포넌트 교체가 필요하면 이 파일 중심으로 수정합니다.
export function createMessageElement(message) {
  const article = document.createElement("article");
  article.className = `message ${message.role}`;

  const meta = document.createElement("span");
  meta.className = "message-meta";
  meta.textContent = message.role === "user" ? "User" : "Assistant";

  const content = document.createElement("p");
  content.textContent = message.content;

  article.append(meta, content);
  return article;
}

export function renderMessages(container, messages) {
  container.replaceChildren(...messages.map(createMessageElement));
  container.scrollTop = container.scrollHeight;
}

export function renderResult(container, result) {
  if (!result) {
    container.innerHTML = '<p class="empty-state">아직 활동이 없습니다.</p>';
    return;
  }

  const resultCard = document.createElement("div");
  resultCard.className = "result-card";

  const title = document.createElement("strong");
  title.textContent = result.title || (result.source === "mock" ? "Mock Result" : "Chat Result");

  const summary = document.createElement("p");
  summary.textContent = result.summary || result.reply;

  resultCard.append(title, summary);
  container.replaceChildren(resultCard);
}

export function renderConnectionStatus(element, { isLoading, lastResult }) {
  if (isLoading) {
    element.textContent = "전송 중";
    return;
  }

  element.textContent = lastResult?.source === "api" ? "API 연결됨" : "Mock API";
}
