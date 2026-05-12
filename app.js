import { loginUser, sendChatMessage } from "./api.js";
import { addMessage, clearUser, setLastResult, setLoading, setUser, store, subscribe } from "./state.js";
import { renderConnectionStatus, renderMessages, renderResult } from "./components.js";

const days = ["월", "화", "수", "목", "금"];
const timeSlots = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];
const gradeScale = {
  "A+": 4.5,
  A0: 4.0,
  "B+": 3.5,
  B0: 3.0,
  "C+": 2.5,
  C0: 2.0,
  "D+": 1.5,
  D0: 1.0,
  F: 0
};

const storageKeys = {
  schedule: "campus-mate-schedule",
  grades: "campus-mate-grades",
  friends: "campus-mate-friends"
};

let scheduleItems = loadList(storageKeys.schedule, [
  { id: crypto.randomUUID(), title: "웹프로그래밍", day: "월", time: "10:30", room: "공학관 204" },
  { id: crypto.randomUUID(), title: "데이터베이스", day: "수", time: "13:30", room: "새롬관 312" }
]);

let gradeItems = loadList(storageKeys.grades, [
  { id: crypto.randomUUID(), title: "자료구조", credit: 3, score: "A0" },
  { id: crypto.randomUUID(), title: "컴퓨터구조", credit: 3, score: "B+" }
]);

let friends = loadList(storageKeys.friends, [
  { id: crypto.randomUUID(), name: "김민지", note: "도서관에서 공부 중", online: true },
  { id: crypto.randomUUID(), name: "이준호", note: "팀플 자료 정리 중", online: true },
  { id: crypto.randomUUID(), name: "박서연", note: "수업 이동 중", online: false }
]);

const logoChatToggle = document.querySelector("#logo-chat-toggle");
const chatBackdrop = document.querySelector("#chat-backdrop");
const chatContainer = document.querySelector("#chat-container");
const chatClose = document.querySelector("#chat-close");
const chatLauncher = document.querySelector("#chat-launcher");
const chatWidgetClose = document.querySelector("#chat-widget-close");
const messageList = document.querySelector("#message-list");
const resultSummary = document.querySelector("#result-summary");
const connectionStatus = document.querySelector("#connection-status");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");

const accountPanel = document.querySelector(".account-panel");
const loginForm = document.querySelector("#login-form");
const logoutButton = document.querySelector("#logout-button");
const userChip = document.querySelector("#user-chip");
const accountSummary = document.querySelector("#account-summary");

const todayCount = document.querySelector("#today-count");
const gpaPreview = document.querySelector("#gpa-preview");
const friendCount = document.querySelector("#friend-count");

const scheduleForm = document.querySelector("#schedule-form");
const timetableGrid = document.querySelector("#timetable-grid");
const gpaForm = document.querySelector("#gpa-form");
const gradeList = document.querySelector("#grade-list");
const gpaTotal = document.querySelector("#gpa-total");
const friendForm = document.querySelector("#friend-form");
const friendList = document.querySelector("#friend-list");

// 전역 상태가 바뀔 때 채팅, 결과, 로그인 상태 UI를 동기화합니다.
subscribe((currentStore) => {
  renderMessages(messageList, currentStore.messages);
  renderResult(resultSummary, currentStore.lastResult);
  renderConnectionStatus(connectionStatus, currentStore);
  renderLoginState(currentStore.user);
});

logoChatToggle.addEventListener("click", () => {
  document.body.classList.remove("chat-widget-hidden");
  setChatOpen(!document.body.classList.contains("chat-open"));
});

chatLauncher.addEventListener("click", () => {
  setChatOpen(!document.body.classList.contains("chat-open"));
});

chatWidgetClose.addEventListener("click", () => {
  setChatOpen(false);
  document.body.classList.add("chat-widget-hidden");
});

chatBackdrop.addEventListener("click", () => setChatOpen(false));
chatClose.addEventListener("click", () => setChatOpen(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setChatOpen(false);
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const user = await loginUser({
    name: formData.get("name").trim(),
    studentId: formData.get("studentId").trim(),
    department: formData.get("department").trim()
  });

  setUser(user);
  loginForm.reset();
  window.location.hash = "#dashboard";
  setLastResult({
    title: "로그인 완료",
    summary: `${user.name}님, ${user.department} 계정으로 로그인했습니다.`,
    source: user.source === "api" ? "api" : "mock"
  });
});

logoutButton.addEventListener("click", () => {
  clearUser();
  setChatOpen(false);
  window.location.hash = "";
  setLastResult({
    title: "로그아웃",
    summary: "현재 브라우저에 저장된 로그인 상태를 해제했습니다.",
    source: "local"
  });
});

scheduleForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(scheduleForm);
  const item = {
    id: crypto.randomUUID(),
    title: formData.get("courseTitle").trim(),
    day: formData.get("courseDay"),
    time: formData.get("courseTime"),
    room: formData.get("courseRoom").trim()
  };

  scheduleItems = [...scheduleItems, item];
  saveList(storageKeys.schedule, scheduleItems);
  renderTimetable();
  renderStats();
  scheduleForm.reset();
  setLastResult({
    title: "시간표 추가",
    summary: `${item.day}요일 ${item.time}에 ${item.title} 수업을 추가했습니다.`,
    source: "local"
  });
});

timetableGrid.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-class]");
  if (!removeButton) return;

  const targetId = removeButton.dataset.removeClass;
  const removedItem = scheduleItems.find((item) => item.id === targetId);
  scheduleItems = scheduleItems.filter((item) => item.id !== targetId);
  saveList(storageKeys.schedule, scheduleItems);
  renderTimetable();
  renderStats();

  if (removedItem) {
    setLastResult({
      title: "시간표 삭제",
      summary: `${removedItem.title} 수업을 시간표에서 삭제했습니다.`,
      source: "local"
    });
  }
});

gpaForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(gpaForm);
  const item = {
    id: crypto.randomUUID(),
    title: formData.get("gradeCourse").trim(),
    credit: Number(formData.get("gradeCredit")),
    score: formData.get("gradeScore")
  };

  gradeItems = [...gradeItems, item];
  saveList(storageKeys.grades, gradeItems);
  renderGrades();
  renderStats();
  gpaForm.reset();
  setLastResult({
    title: "학점 계산",
    summary: `${item.title} ${item.credit}학점 ${item.score}를 반영했습니다. 현재 GPA는 ${calculateGpa().toFixed(2)}입니다.`,
    source: "local"
  });
});

gradeList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-grade]");
  if (!removeButton) return;

  const targetId = removeButton.dataset.removeGrade;
  const removedItem = gradeItems.find((item) => item.id === targetId);
  gradeItems = gradeItems.filter((item) => item.id !== targetId);
  saveList(storageKeys.grades, gradeItems);
  renderGrades();
  renderStats();

  if (removedItem) {
    setLastResult({
      title: "학점 항목 삭제",
      summary: `${removedItem.title} 항목을 계산 목록에서 삭제했습니다.`,
      source: "local"
    });
  }
});

friendForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(friendForm);
  const friend = {
    id: crypto.randomUUID(),
    name: formData.get("friendName").trim(),
    note: formData.get("friendNote").trim(),
    online: true
  };

  friends = [friend, ...friends];
  saveList(storageKeys.friends, friends);
  renderFriends();
  renderStats();
  friendForm.reset();
  setLastResult({
    title: "친구 추가",
    summary: `${friend.name}님을 친구창에 추가했습니다.`,
    source: "local"
  });
});

friendList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-friend-message]");
  if (!actionButton) return;

  const friend = friends.find((item) => item.id === actionButton.dataset.friendMessage);
  if (!friend) return;

  setLastResult({
    title: "친구 메시지",
    summary: `${friend.name}님에게 보낼 메시지 창을 준비했습니다. 실제 채팅 API는 이후 /api/friends/messages로 연결하면 됩니다.`,
    source: "local"
  });
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = chatInput.value.trim();
  if (!message || store.isLoading) return;

  addMessage({ role: "user", content: message });
  chatInput.value = "";
  setLoading(true);

  const result = await sendChatMessage({
    message,
    history: store.messages
  });

  setLastResult({
    title: result.source === "api" ? "챗봇 응답" : "챗봇 Mock 응답",
    summary: result.summary || result.reply,
    source: result.source
  });
  addMessage({
    role: "assistant",
    content: result.reply
  });
  setLoading(false);
});

renderTimetable();
renderGrades();
renderFriends();
renderStats();

function setChatOpen(isOpen) {
  document.body.classList.toggle("chat-open", isOpen);
  chatContainer.setAttribute("aria-hidden", String(!isOpen));
  chatContainer.inert = !isOpen;
  logoChatToggle.setAttribute("aria-expanded", String(isOpen));
  chatLauncher.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    window.setTimeout(() => chatInput.focus(), 120);
  }
}

function renderLoginState(user) {
  document.body.classList.toggle("is-authenticated", Boolean(user));
  userChip.textContent = user ? `${user.name}님` : "로그인 전";
  logoutButton.classList.toggle("hidden", !user);
  loginForm.classList.toggle("hidden", Boolean(user));
  accountSummary.classList.toggle("hidden", !user);
  accountSummary.textContent = user ? `${user.studentId} · ${user.department}` : "";
  accountPanel.querySelector("h2").textContent = user ? "내 계정" : "계정 정보";
}

function renderTimetable() {
  const table = document.createElement("table");
  table.className = "timetable-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.append(createCell("th", "시간"));
  days.forEach((day) => headerRow.append(createCell("th", day)));
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  timeSlots.forEach((time) => {
    const row = document.createElement("tr");
    const timeCell = createCell("th", time);
    timeCell.className = "time-cell";
    row.append(timeCell);

    days.forEach((day) => {
      const cell = document.createElement("td");
      scheduleItems
        .filter((item) => item.day === day && item.time === time)
        .forEach((item) => cell.append(createClassBlock(item)));
      row.append(cell);
    });

    tbody.append(row);
  });

  table.append(thead, tbody);
  timetableGrid.replaceChildren(table);
}

function createClassBlock(item) {
  const block = document.createElement("div");
  block.className = "class-block";

  const title = document.createElement("strong");
  title.textContent = item.title;

  const room = document.createElement("span");
  room.textContent = item.room;

  const removeButton = document.createElement("button");
  removeButton.className = "class-remove";
  removeButton.type = "button";
  removeButton.textContent = "삭제";
  removeButton.dataset.removeClass = item.id;

  block.append(title, room, removeButton);
  return block;
}

function renderGrades() {
  const gpa = calculateGpa();
  gpaTotal.textContent = gpa.toFixed(2);

  if (!gradeItems.length) {
    gradeList.innerHTML = '<p class="empty-state">계산할 과목이 없습니다.</p>';
    return;
  }

  gradeList.replaceChildren(...gradeItems.map(createGradeItem));
}

function createGradeItem(item) {
  const article = document.createElement("article");
  article.className = "grade-item";

  const main = document.createElement("div");
  main.className = "grade-main";

  const title = document.createElement("strong");
  title.textContent = item.title;

  const detail = document.createElement("span");
  detail.textContent = `${item.credit}학점 · ${gradeScale[item.score].toFixed(1)}점`;

  const score = document.createElement("span");
  score.className = "grade-score";
  score.textContent = item.score;

  main.append(title, detail);

  const removeButton = document.createElement("button");
  removeButton.className = "remove-grade";
  removeButton.type = "button";
  removeButton.textContent = "삭제";
  removeButton.dataset.removeGrade = item.id;

  article.append(main, score, removeButton);
  return article;
}

function renderFriends() {
  if (!friends.length) {
    friendList.innerHTML = '<p class="empty-state">아직 등록된 친구가 없습니다.</p>';
    return;
  }

  friendList.replaceChildren(...friends.map(createFriendItem));
}

function createFriendItem(friend) {
  const article = document.createElement("article");
  article.className = "friend-item";

  const avatar = document.createElement("span");
  avatar.className = "friend-avatar";
  avatar.textContent = friend.name.slice(0, 1);

  const main = document.createElement("div");
  main.className = "friend-main";

  const name = document.createElement("strong");
  name.textContent = friend.name;

  const note = document.createElement("span");
  const status = friend.online ? "온라인" : "오프라인";
  if (friend.online) {
    const dot = document.createElement("span");
    dot.className = "online-dot";
    note.append(dot);
  }
  note.append(`${status} · ${friend.note}`);

  const action = document.createElement("button");
  action.className = "friend-action";
  action.type = "button";
  action.textContent = "메시지";
  action.dataset.friendMessage = friend.id;

  main.append(name, note);
  article.append(avatar, main, action);
  return article;
}

function renderStats() {
  const today = ["일", "월", "화", "수", "목", "금", "토"][new Date().getDay()];
  todayCount.textContent = scheduleItems.filter((item) => item.day === today).length;
  gpaPreview.textContent = calculateGpa().toFixed(2);
  friendCount.textContent = friends.length;
}

function calculateGpa() {
  const totalCredits = gradeItems.reduce((sum, item) => sum + item.credit, 0);
  if (!totalCredits) return 0;

  const weightedScore = gradeItems.reduce((sum, item) => {
    return sum + item.credit * gradeScale[item.score];
  }, 0);

  return weightedScore / totalCredits;
}

function createCell(tagName, text) {
  const cell = document.createElement(tagName);
  cell.textContent = text;
  return cell;
}

function loadList(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
