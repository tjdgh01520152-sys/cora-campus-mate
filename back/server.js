// Node.js 기본 모듈만 사용한 REST API 예시 서버입니다.
// 실제 서비스에서는 이 파일 안에서 LLM SDK, DB, 인증, 로깅 등을 연결하면 됩니다.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = normalize(join(__dirname, ".."));
const port = process.env.PORT || 3000;
const host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/chat") {
    await handleChatRequest(request, response);
    return;
  }

  if (request.method === "POST" && request.url === "/api/login") {
    await handleLoginRequest(request, response);
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    await serveStaticFile(request, response, request.method === "HEAD");
    return;
  }

  sendJson(response, 405, { error: "Method not allowed" });
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});

async function handleChatRequest(request, response) {
  try {
    const body = await readJsonBody(request);

    if (!body.message || typeof body.message !== "string") {
      sendJson(response, 400, { error: "message is required" });
      return;
    }

    // 이 함수만 실제 챗봇 제공자 호출로 교체하면 프론트엔드 변경 없이 확장됩니다.
    const chatResult = await createAssistantReply(body.message, body.history || []);
    sendJson(response, 200, chatResult);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

async function handleLoginRequest(request, response) {
  try {
    const body = await readJsonBody(request);
    const requiredFields = ["name", "studentId", "department"];
    const hasMissingField = requiredFields.some((field) => !body[field] || typeof body[field] !== "string");

    if (hasMissingField) {
      sendJson(response, 400, { error: "name, studentId, department are required" });
      return;
    }

    sendJson(response, 200, {
      id: crypto.randomUUID(),
      name: body.name,
      studentId: body.studentId,
      department: body.department,
      source: "api"
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

async function createAssistantReply(message, history) {
  return {
    id: crypto.randomUUID(),
    reply: `서버 응답입니다. 받은 메시지: ${message}`,
    summary: `현재 대화 메시지는 ${history.length}개이며, /api/chat REST 구조가 정상 동작합니다.`,
    source: "api"
  };
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8");
  return rawBody ? JSON.parse(rawBody) : {};
}

async function serveStaticFile(request, response, isHeadRequest = false) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(join(projectRoot, requestedPath));

  if (!safePath.startsWith(projectRoot)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const file = await readFile(safePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(safePath)] || "application/octet-stream"
    });
    response.end(isHeadRequest ? undefined : file);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}
