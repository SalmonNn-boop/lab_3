const USERS_URL = "https://jsonplaceholder.typicode.com/users";
const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.getElementById("loadBtn");
const searchInput = document.getElementById("searchInput");
const statusEl = document.getElementById("status");
const userListEl = document.getElementById("userList");
const postsSection = document.getElementById("postsSection");
const postsTitle = document.getElementById("postsTitle");
const postsArea = document.getElementById("postsArea");

let allUsers = [];
let usersLoaded = false;

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function clearStatus() {
  statusEl.textContent = "";
  statusEl.className = "status";
}

function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function setLoadBtnLoading(isLoading) {
  loadBtn.disabled = isLoading;
  loadBtn.textContent = isLoading ? "Загрузка..." : "Загрузить пользователей";
}

function getErrorMessage(response) {
  if (response.statusText) {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
  return `HTTP ${response.status}`;
}

async function loadUsers() {
  setLoadBtnLoading(true);
  setStatus("Загрузка...", "loading");
  
  clearElement(userListEl);
  clearElement(postsArea);
  
  postsTitle.textContent = "Публикации";
  
  const emptyPosts = document.createElement("div");
  emptyPosts.className = "empty-state";
  emptyPosts.textContent = "Выберите пользователя, чтобы увидеть его публикации";
  postsArea.appendChild(emptyPosts);

  try {
    const response = await fetch(USERS_URL);

    if (!response.ok) {
      throw new Error(getErrorMessage(response));
    }

    const users = await response.json();

    allUsers = users;
    usersLoaded = true;
    renderUsers(allUsers);
    clearStatus();
  } catch (err) {
    usersLoaded = false;
    allUsers = [];
    
    const emptyUsers = document.createElement("li");
    emptyUsers.className = "empty-state";
    emptyUsers.textContent = "Здесь появятся пользователи";
    userListEl.appendChild(emptyUsers);

    setStatus(
      `Ошибка загрузки: ${err.message}. Нажмите «Загрузить пользователей», чтобы повторить попытку.`,
      "error"
    );
  } finally {
    setLoadBtnLoading(false);
  }
}

function renderUsers(users) {
  clearElement(userListEl);

  if (users.length === 0) {
    setStatus("Пользователи не найдены", "info");
    const emptyUsers = document.createElement("li");
    emptyUsers.className = "empty-state";
    emptyUsers.textContent = "Пользователи не найдены";
    userListEl.appendChild(emptyUsers);
    return;
  }

  users.forEach((user) => {
    const li = document.createElement("li");
    li.className = "user-card";

    const info = document.createElement("div");
    info.className = "user-info";

    const name = document.createElement("span");
    name.className = "user-name";
    name.textContent = user.name;

    const email = document.createElement("span");
    email.className = "user-meta";
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("span");
    city.className = "user-meta";
    city.textContent = `Город: ${user.address?.city ?? "—"}`;

    info.append(name, email, city);

    const btn = document.createElement("button");
    btn.className = "btn btn-secondary";
    btn.type = "button";
    btn.textContent = "Показать публикации";
    btn.addEventListener("click", () => loadPosts(user.id, user.name, btn));

    li.append(info, btn);
    userListEl.appendChild(li);
  });

  if (statusEl.classList.contains("error")) clearStatus();
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  if (!usersLoaded) {
    if (query !== "") {
      setStatus("Сначала загрузите пользователей, чтобы использовать поиск.", "info");
    } else {
      clearStatus();
    }
    return;
  }

  if (query === "") {
    renderUsers(allUsers);
    clearStatus();
    return;
  }

  const filtered = allUsers.filter((u) =>
    u.name.toLowerCase().includes(query)
  );

  renderUsers(filtered);
});

async function loadPosts(userId, userName, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Загрузка...";

  postsTitle.textContent = `Публикации: ${userName}`;
  
  postsArea.innerHTML = `<div class="empty-state">Загрузка...</div>`;
  setStatus("Загрузка...", "loading");

  try {
    const response = await fetch(`${POSTS_URL}?userId=${userId}`);

    if (!response.ok) {
      throw new Error(getErrorMessage(response));
    }

    const posts = await response.json();
    const firstThree = posts.slice(0, 3);

    clearElement(postsArea);

    if (firstThree.length === 0) {
      const emptyPosts = document.createElement("div");
      emptyPosts.className = "empty-state";
      emptyPosts.textContent = "Публикаций не найдено";
      postsArea.appendChild(emptyPosts);
      setStatus("Публикаций не найдено", "info");
      return;
    }

    firstThree.forEach((post) => {
      const card = document.createElement("article");
      card.className = "post-card";

      const title = document.createElement("h3");
      title.className = "post-title";
      title.textContent = post.title;

      const body = document.createElement("p");
      body.className = "post-body";
      body.textContent = post.body;

      card.append(title, body);
      postsArea.appendChild(card);
    });

    clearStatus();
  } catch (err) {
    setStatus(
      `Ошибка загрузки публикаций: ${err.message}. Нажмите кнопку ещё раз, чтобы повторить.`,
      "error"
    );
    postsArea.innerHTML = `<div class="empty-state">Ошибка загрузки публикаций</div>`;
    postsTitle.textContent = "Публикации";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

loadBtn.addEventListener("click", loadUsers);