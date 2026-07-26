// ---------- Stan aplikacji ----------
// Token trzymamy tylko w pamięci (nie w localStorage) - po odświeżeniu strony
// trzeba się zalogować ponownie. To świadomy wybór na start projektu.
const state = {
  token: null,
  user: null,
  exercises: [],
  workouts: [],
  currentWorkoutId: null,
};

// ---------- Pomocnik do wywołań API ----------

async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;

  let fetchBody;
  if (form) {
    fetchBody = new URLSearchParams(form);
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (body) {
    fetchBody = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: fetchBody });

  if (!res.ok) {
    let detail = "Wystąpił błąd. Spróbuj ponownie.";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---------- Routing widoków ----------

function showView(id) {
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("logout-btn").style.display = state.token ? "inline" : "none";
  document.getElementById("nav-exercises-btn").style.display = state.token ? "inline" : "none";
}

function showError(bannerId, message) {
  const el = document.getElementById(bannerId);
  el.textContent = message;
  el.classList.add("show");
}

function clearError(bannerId) {
  const el = document.getElementById(bannerId);
  el.classList.remove("show");
  el.textContent = "";
}

// ---------- Autentykacja ----------

document.getElementById("go-register").addEventListener("click", () => showView("view-register"));
document.getElementById("go-login").addEventListener("click", () => showView("view-login"));

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError("login-error");
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const tokenRes = await api("/auth/login", { method: "POST", form: { username: email, password } });
    state.token = tokenRes.access_token;
    state.user = await api("/auth/me");
    await enterApp();
  } catch (err) {
    showError("login-error", err.message);
  }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError("register-error");
  const display_name = document.getElementById("register-name").value || null;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    await api("/auth/register", { method: "POST", body: { email, password, display_name } });
    const tokenRes = await api("/auth/login", { method: "POST", form: { username: email, password } });
    state.token = tokenRes.access_token;
    state.user = await api("/auth/me");
    await enterApp();
  } catch (err) {
    showError("register-error", err.message);
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  state.token = null;
  state.user = null;
  state.workouts = [];
  state.exercises = [];
  showView("view-login");
});

async function enterApp() {
  state.exercises = await api("/exercises/");
  await loadWorkouts();
  showView("view-workouts");
}

// ---------- Zarządzanie ćwiczeniami ----------

document.getElementById("nav-exercises-btn").addEventListener("click", async () => {
  await openExercisesView();
});

document.getElementById("exercises-back-to-list").addEventListener("click", async () => {
  await loadWorkouts();
  showView("view-workouts");
});

async function openExercisesView() {
  state.exercises = await api("/exercises/");
  renderExercisesView();
  showView("view-exercises");
}

function renderExercisesView() {
  clearError("exercise-error");
  const searchInput = document.getElementById("exercises-page-search");
  const query = (searchInput.value || "").trim().toLowerCase();

  const ownList = document.getElementById("own-exercise-list");
  const globalList = document.getElementById("global-exercise-list");
  ownList.innerHTML = "";
  globalList.innerHTML = "";

  const matches = (ex) => !query || ex.name.toLowerCase().includes(query) || (ex.muscle_group || "").toLowerCase().includes(query);

  const own = state.exercises.filter((ex) => !ex.is_global && matches(ex));
  const global = state.exercises.filter((ex) => ex.is_global && matches(ex));

  if (own.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = query ? "Brak własnych ćwiczeń pasujących do wyszukiwania." : "Nie masz jeszcze własnych ćwiczeń. Dodaj pierwsze powyżej.";
    ownList.appendChild(empty);
  } else {
    own.forEach((ex) => {
      const row = document.createElement("div");
      row.className = "exercise-list-item";
      row.innerHTML = `
        <div>
          <div class="eli-name">${ex.name}</div>
          ${ex.muscle_group ? `<div class="eli-muscle">${ex.muscle_group}</div>` : ""}
        </div>
        <button class="set-delete" title="Usuń ćwiczenie" data-exercise-id="${ex.id}">✕</button>
      `;
      row.querySelector(".set-delete").addEventListener("click", () => deleteExercise(ex.id));
      ownList.appendChild(row);
    });
  }

  if (global.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Brak globalnych ćwiczeń pasujących do wyszukiwania.";
    globalList.appendChild(empty);
  } else {
    global.forEach((ex) => {
      const row = document.createElement("div");
      row.className = "exercise-list-item global";
      row.innerHTML = `
        <div>
          <div class="eli-name">${ex.name}</div>
          ${ex.muscle_group ? `<div class="eli-muscle">${ex.muscle_group}</div>` : ""}
        </div>
      `;
      globalList.appendChild(row);
    });
  }
}

document.getElementById("exercises-page-search").addEventListener("input", renderExercisesView);
async function createExercise(name, muscleGroup) {
  if (!name || !name.trim()) {
    throw new Error("Podaj nazwę ćwiczenia.");
  }
  const exercise = await api("/exercises/", {
    method: "POST",
    body: { name: name.trim(), muscle_group: muscleGroup ? muscleGroup.trim() : null },
  });
  state.exercises.push(exercise);
  return exercise;
}

document.getElementById("create-exercise-btn").addEventListener("click", async () => {
  clearError("exercise-error");
  const name = document.getElementById("new-exercise-name").value;
  const muscle = document.getElementById("new-exercise-muscle").value;
  try {
    await createExercise(name, muscle);
    document.getElementById("new-exercise-name").value = "";
    document.getElementById("new-exercise-muscle").value = "";
    renderExercisesView();
  } catch (err) {
    showError("exercise-error", err.message);
  }
});

async function deleteExercise(exerciseId) {
  try {
    await api(`/exercises/${exerciseId}`, { method: "DELETE" });
    state.exercises = state.exercises.filter((ex) => ex.id !== exerciseId);
    renderExercisesView();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Lista treningów ----------

async function loadWorkouts() {
  state.workouts = await api("/workouts/");
  renderWorkoutList();
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month: "short" });
}

function renderWorkoutList() {
  const container = document.getElementById("workout-list");
  const subtitle = document.getElementById("workouts-subtitle");
  subtitle.textContent = `${state.user.display_name ? state.user.display_name + " — " : ""}${state.workouts.length} zapisanych treningów`;

  container.innerHTML = "";

  const newBtn = document.createElement("button");
  newBtn.className = "primary";
  newBtn.textContent = "+ Nowy trening (dziś)";
  newBtn.style.marginBottom = "4px";
  newBtn.addEventListener("click", createTodayWorkout);
  container.appendChild(newBtn);

  if (state.workouts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Brak zapisanych treningów. Zacznij od kliknięcia powyżej.";
    container.appendChild(empty);
    return;
  }

  state.workouts.forEach((w) => {
    const card = document.createElement("div");
    card.className = "workout-card";
    card.innerHTML = `
      <div>
        <div class="wc-date">${formatDate(w.workout_date)}</div>
        <div class="wc-meta">${w.notes ? w.notes : "Brak notatki"}</div>
      </div>
      <div class="wc-count">${w.sets.length}<span style="font-size:11px; color:var(--text-muted);"> serii</span></div>
    `;
    card.addEventListener("click", () => openWorkout(w.id));
    container.appendChild(card);
  });
}

async function createTodayWorkout() {
  try {
    const workout = await api("/workouts/", { method: "POST", body: {} });
    state.workouts.unshift(workout);
    openWorkout(workout.id);
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById("back-to-list").addEventListener("click", async () => {
  await loadWorkouts();
  showView("view-workouts");
});

// ---------- Szczegóły treningu ----------

async function openWorkout(workoutId) {
  state.currentWorkoutId = workoutId;
  const workout = await api(`/workouts/${workoutId}`);
  renderWorkoutDetail(workout);
  document.getElementById("add-set-exercise-search").value = "";
  populateExerciseSelect();
  showView("view-workout-detail");
}

function populateExerciseSelect(filterQuery) {
  const select = document.getElementById("add-set-exercise");
  const previousValue = select.value;
  const query = (filterQuery || "").trim().toLowerCase();

  const filtered = query
    ? state.exercises.filter((ex) => ex.name.toLowerCase().includes(query) || (ex.muscle_group || "").toLowerCase().includes(query))
    : state.exercises;

  select.innerHTML = "";

  if (filtered.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "Brak wyników";
    opt.disabled = true;
    select.appendChild(opt);
    return;
  }

  filtered.forEach((ex) => {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = ex.muscle_group ? `${ex.name} (${ex.muscle_group})` : ex.name;
    select.appendChild(opt);
  });

  // Zachowaj poprzedni wybór, jeśli dalej pasuje do filtra
  if (filtered.some((ex) => String(ex.id) === previousValue)) {
    select.value = previousValue;
  }
}

document.getElementById("add-set-exercise-search").addEventListener("input", (e) => {
  populateExerciseSelect(e.target.value);
});

function renderWorkoutDetail(workout) {
  document.getElementById("workout-detail-date").textContent = formatDate(workout.workout_date);

  const groupsEl = document.getElementById("exercise-groups");
  groupsEl.innerHTML = "";

  if (workout.sets.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Brak serii. Dodaj pierwszą poniżej.";
    groupsEl.appendChild(empty);
    return;
  }

  const groups = [];
  const groupIndex = {};
  workout.sets.forEach((s) => {
    if (!(s.exercise_id in groupIndex)) {
      groupIndex[s.exercise_id] = groups.length;
      groups.push({ exercise_id: s.exercise_id, exercise_name: s.exercise_name, sets: [] });
    }
    groups[groupIndex[s.exercise_id]].sets.push(s);
  });

  const maxWeightOverall = Math.max(1, ...workout.sets.map((s) => s.weight_kg || 0));

  groups.forEach((group) => {
    const groupEl = document.createElement("div");
    groupEl.className = "exercise-group";

    const header = document.createElement("div");
    header.className = "exercise-header";
    header.textContent = group.exercise_name || "Ćwiczenie";
    groupEl.appendChild(header);

    group.sets.forEach((s, idx) => {
      const row = document.createElement("div");
      row.className = "set-row";

      const plateWidthPct = s.weight_kg ? Math.max(15, Math.round((s.weight_kg / maxWeightOverall) * 100)) : 0;

      row.innerHTML = `
        <div class="set-index">#${idx + 1}</div>
        <div class="barbell">
          <div class="bar"></div>
          ${s.weight_kg ? `<div class="plate" style="width:${plateWidthPct}%; height:${Math.min(20, 8 + s.weight_kg / 8)}px;"></div>` : ""}
          <div class="bar"></div>
        </div>
        <div class="set-numbers">
          <span class="reps">${s.reps}</span><span class="unit">reps</span>
          ${s.weight_kg ? `<span class="weight">${s.weight_kg}</span><span class="unit">kg</span>` : ""}
        </div>
        <button class="set-delete" title="Usuń serię" data-set-id="${s.id}">✕</button>
      `;

      row.querySelector(".set-delete").addEventListener("click", () => deleteSet(s.id));
      groupEl.appendChild(row);
    });

    groupsEl.appendChild(groupEl);
  });
}

document.getElementById("quick-add-exercise-toggle").addEventListener("click", () => {
  const panel = document.getElementById("quick-add-exercise-panel");
  const isHidden = panel.style.display === "none";
  panel.style.display = isHidden ? "flex" : "none";
});

document.getElementById("quick-add-exercise-btn").addEventListener("click", async () => {
  const name = document.getElementById("quick-exercise-name").value;
  const muscle = document.getElementById("quick-exercise-muscle").value;
  try {
    const exercise = await createExercise(name, muscle);
    populateExerciseSelect();
    document.getElementById("add-set-exercise").value = exercise.id;
    document.getElementById("quick-exercise-name").value = "";
    document.getElementById("quick-exercise-muscle").value = "";
    document.getElementById("quick-add-exercise-panel").style.display = "none";
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("add-set-btn").addEventListener("click", async () => {
  const exercise_id = parseInt(document.getElementById("add-set-exercise").value, 10);
  const reps = parseInt(document.getElementById("add-set-reps").value, 10);
  const weightRaw = document.getElementById("add-set-weight").value;
  const rpeRaw = document.getElementById("add-set-rpe").value;

  if (!reps || reps <= 0) {
    alert("Podaj liczbę powtórzeń większą od zera.");
    return;
  }

  const body = {
    exercise_id,
    reps,
    weight_kg: weightRaw ? parseFloat(weightRaw) : null,
    rpe: rpeRaw ? parseFloat(rpeRaw) : null,
    set_number: 1,
  };

  try {
    await api(`/workouts/${state.currentWorkoutId}/sets`, { method: "POST", body });
    document.getElementById("add-set-reps").value = "";
    document.getElementById("add-set-weight").value = "";
    document.getElementById("add-set-rpe").value = "";
    const workout = await api(`/workouts/${state.currentWorkoutId}`);
    renderWorkoutDetail(workout);
    const idx = state.workouts.findIndex((w) => w.id === state.currentWorkoutId);
    if (idx !== -1) state.workouts[idx] = workout;
  } catch (err) {
    alert(err.message);
  }
});

async function deleteSet(setId) {
  try {
    await api(`/workouts/sets/${setId}`, { method: "DELETE" });
    const workout = await api(`/workouts/${state.currentWorkoutId}`);
    renderWorkoutDetail(workout);
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Start ----------
showView("view-login");