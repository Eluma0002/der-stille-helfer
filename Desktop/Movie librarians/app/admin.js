const STORE_KEYS = {
  brand: "movie_librarians_brand_name",
  movies: "movie_librarians_movies",
  people: "movie_librarians_people",
  adminAuth: "movie_librarians_admin_auth"
};

const DEFAULT_PEOPLE = [
  {
    id: "p1",
    name: "Mara",
    about: "Steht auf Wohlfühlfilme, clevere Serien und gute Dialoge.",
    hobbies: ["Kino", "Fotografie", "Vinyl"],
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80&auto=format&fit=crop"
  },
  {
    id: "p2",
    name: "Jonas",
    about: "Mag starke Spannung, schräge Ideen und Arthouse-Perlen.",
    hobbies: ["Schach", "Nachtkino", "Comics"],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80&auto=format&fit=crop"
  }
];

const els = {
  adminSetupCard: document.getElementById("adminSetupCard"),
  adminLoginCard: document.getElementById("adminLoginCard"),
  adminResetCard: document.getElementById("adminResetCard"),
  adminSetupForm: document.getElementById("adminSetupForm"),
  adminEmailSetup: document.getElementById("adminEmailSetup"),
  adminPinSetup: document.getElementById("adminPinSetup"),
  adminPinSetupRepeat: document.getElementById("adminPinSetupRepeat"),
  adminRecoverySetup: document.getElementById("adminRecoverySetup"),
  adminLoginForm: document.getElementById("adminLoginForm"),
  adminEmailLogin: document.getElementById("adminEmailLogin"),
  adminPinLogin: document.getElementById("adminPinLogin"),
  adminResetForm: document.getElementById("adminResetForm"),
  adminEmailReset: document.getElementById("adminEmailReset"),
  adminRecoveryReset: document.getElementById("adminRecoveryReset"),
  adminPinReset: document.getElementById("adminPinReset"),
  adminLoginPanel: document.getElementById("adminLoginPanel"),
  adminPanel: document.getElementById("adminPanel"),
  adminListPanel: document.getElementById("adminListPanel"),
  brandForm: document.getElementById("brandForm"),
  brandInput: document.getElementById("brandInput"),
  personForm: document.getElementById("personForm"),
  personName: document.getElementById("personName"),
  personAbout: document.getElementById("personAbout"),
  personHobbies: document.getElementById("personHobbies"),
  personAvatarUrl: document.getElementById("personAvatarUrl"),
  personPhoto: document.getElementById("personPhoto"),
  personList: document.getElementById("personList"),
  entryForm: document.getElementById("entryForm"),
  entryOwner: document.getElementById("entryOwner"),
  entryTitle: document.getElementById("entryTitle"),
  entryType: document.getElementById("entryType"),
  entryYear: document.getElementById("entryYear"),
  entryMood: document.getElementById("entryMood"),
  entryEnergy: document.getElementById("entryEnergy"),
  entryWhen: document.getElementById("entryWhen"),
  entryTip: document.getElementById("entryTip"),
  entryHonest: document.getElementById("entryHonest"),
  entryWarning: document.getElementById("entryWarning"),
  entryPoster: document.getElementById("entryPoster"),
  entryTrailer: document.getElementById("entryTrailer"),
  entryWhere: document.getElementById("entryWhere"),
  adminList: document.getElementById("adminList"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importInput: document.getElementById("importInput")
};

let entries = [];
let people = [];
let adminAuth = null;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function loadAdminAuth() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEYS.adminAuth) || "null");
    if (raw && raw.email && raw.pin) {
      adminAuth = {
        email: normalizeEmail(raw.email),
        pin: String(raw.pin),
        recoveryCode: String(raw.recoveryCode || "").trim()
      };
      return;
    }
  } catch {
    // ignore parse error and fallback to empty auth
  }
  adminAuth = null;
}

function saveAdminAuth() {
  if (!adminAuth) return;
  localStorage.setItem(STORE_KEYS.adminAuth, JSON.stringify(adminAuth));
}

function hasAdminAuth() {
  return Boolean(adminAuth?.email && adminAuth?.pin);
}

function showAuthCards() {
  const configured = hasAdminAuth();
  els.adminSetupCard?.classList.toggle("hidden", configured);
  els.adminLoginCard?.classList.toggle("hidden", !configured);
  els.adminResetCard?.classList.toggle("hidden", !configured);

  if (configured && els.adminEmailLogin) {
    els.adminEmailLogin.value = adminAuth.email;
  }
}

function parseCsv(v) {
  return v
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function loadEntries() {
  try {
    entries = JSON.parse(localStorage.getItem(STORE_KEYS.movies) || "[]");
  } catch {
    entries = [];
  }

  const fallbackOwnerId = people[0]?.id || "";
  entries = entries.map((entry) => ({
    ...entry,
    ownerId: entry.ownerId || fallbackOwnerId
  }));
}

function saveEntries() {
  localStorage.setItem(STORE_KEYS.movies, JSON.stringify(entries));
}

function loadPeople() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEYS.people) || "null");
    people = Array.isArray(raw) && raw.length ? raw : DEFAULT_PEOPLE;
  } catch {
    people = DEFAULT_PEOPLE;
  }
}

function savePeople() {
  localStorage.setItem(STORE_KEYS.people, JSON.stringify(people));
}

function fillOwnerSelect() {
  if (!els.entryOwner) return;
  const keep = els.entryOwner.value;
  els.entryOwner.innerHTML = "";
  people.forEach((person) => {
    els.entryOwner.append(new Option(person.name, person.id));
  });

  if (keep && people.some((p) => p.id === keep)) {
    els.entryOwner.value = keep;
  } else if (people[0]) {
    els.entryOwner.value = people[0].id;
  }
}

function renderPeople() {
  if (!els.personList) return;
  els.personList.innerHTML = "";

  people.forEach((person, index) => {
    const div = document.createElement("div");
    div.className = "movie-item";
    const hobbies = Array.isArray(person.hobbies) ? person.hobbies.join(", ") : "";
    div.innerHTML = `
      <div class="library-item-top">
        <img class="mini-poster" src="${person.avatarUrl || "https://placehold.co/120x180?text=Foto"}" alt="${person.name}" />
        <div>
          <h4>${person.name}</h4>
          <p>${person.about || ""}</p>
          <small><strong>Hobbys:</strong> ${hobbies || "-"}</small>
        </div>
      </div>
      <div class="tool-row">
        <button type="button" data-delete-person="${index}">Profil löschen</button>
      </div>
    `;
    els.personList.appendChild(div);
  });

  els.personList.querySelectorAll("button[data-delete-person]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-delete-person"));
      const person = people[index];
      if (!person) return;
      if (people.length <= 1) {
        alert("Mindestens ein Videotheker-Profil muss bleiben.");
        return;
      }

      people.splice(index, 1);
      entries = entries.map((entry) => {
        if (entry.ownerId === person.id) {
          return { ...entry, ownerId: people[0].id };
        }
        return entry;
      });
      savePeople();
      saveEntries();
      fillOwnerSelect();
      renderPeople();
      renderList();
    });
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function renderList() {
  els.adminList.innerHTML = "";
  entries.forEach((entry, index) => {
    const owner = people.find((p) => p.id === entry.ownerId);
    const div = document.createElement("div");
    div.className = "movie-item";
    div.innerHTML = `
      <h4>${entry.title} (${entry.year || ""})</h4>
      <p><strong>Typ:</strong> ${entry.type || "film"} · <strong>Bereich:</strong> ${entry.where || entry.type || "film"}</p>
      <p><strong>Videotheker:</strong> ${owner?.name || "-"}</p>
      <small>${entry.tip || ""}</small>
      <div class="tool-row">
        <button type="button" data-delete="${index}">Löschen</button>
      </div>
    `;
    els.adminList.appendChild(div);
  });

  els.adminList.querySelectorAll("button[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-delete"));
      entries.splice(index, 1);
      saveEntries();
      renderList();
    });
  });
}

function unlockAdmin() {
  els.adminLoginPanel.classList.add("hidden");
  els.adminPanel.classList.remove("hidden");
  els.adminListPanel.classList.remove("hidden");
  els.brandInput.value = localStorage.getItem(STORE_KEYS.brand) || "";
}

function setupAuth() {
  els.adminSetupForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = normalizeEmail(els.adminEmailSetup.value);
    const pin = String(els.adminPinSetup.value || "").trim();
    const pinRepeat = String(els.adminPinSetupRepeat.value || "").trim();
    const recoveryCode = String(els.adminRecoverySetup.value || "").trim();

    if (!email || !pin || pin.length < 4) {
      alert("Bitte gültige E-Mail und eine PIN mit mindestens 4 Zeichen eingeben.");
      return;
    }
    if (pin !== pinRepeat) {
      alert("PIN-Wiederholung stimmt nicht überein.");
      return;
    }

    adminAuth = { email, pin, recoveryCode };
    saveAdminAuth();
    showAuthCards();
    els.adminSetupForm.reset();
    alert("Admin-Zugang erstellt. Du kannst dich jetzt einloggen.");
  });

  els.adminLoginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = normalizeEmail(els.adminEmailLogin.value);
    const pin = String(els.adminPinLogin.value || "").trim();

    if (!hasAdminAuth()) {
      alert("Bitte zuerst einen Admin-Zugang erstellen.");
      showAuthCards();
      return;
    }

    if (email !== adminAuth.email || pin !== adminAuth.pin) {
      alert("Login fehlgeschlagen");
      return;
    }

    unlockAdmin();
  });

  els.adminResetForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasAdminAuth()) {
      alert("Es ist noch kein Admin-Zugang eingerichtet.");
      return;
    }

    const email = normalizeEmail(els.adminEmailReset.value);
    const recovery = String(els.adminRecoveryReset.value || "").trim();
    const newPin = String(els.adminPinReset.value || "").trim();

    if (!adminAuth.recoveryCode) {
      alert("Für diesen Zugang wurde kein Wiederherstellungs-Code hinterlegt.");
      return;
    }
    if (email !== adminAuth.email || recovery !== adminAuth.recoveryCode) {
      alert("E-Mail oder Wiederherstellungs-Code ist falsch.");
      return;
    }
    if (newPin.length < 4) {
      alert("Neue PIN muss mindestens 4 Zeichen haben.");
      return;
    }

    adminAuth.pin = newPin;
    saveAdminAuth();
    els.adminResetForm.reset();
    alert("PIN wurde erfolgreich zurückgesetzt.");
  });
}

function setupBranding() {
  els.brandForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem(STORE_KEYS.brand, els.brandInput.value.trim() || "Movie librarians");
    alert("Name gespeichert");
  });
}

function setupPeopleForm() {
  els.personForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const photoFile = els.personPhoto?.files?.[0];
    let avatarUrl = els.personAvatarUrl.value.trim();
    if (!avatarUrl && photoFile) {
      try {
        avatarUrl = await fileToDataUrl(photoFile);
      } catch {
        alert("Foto konnte nicht geladen werden.");
        return;
      }
    }

    const person = {
      id: `p_${Date.now()}`,
      name: els.personName.value.trim(),
      about: els.personAbout.value.trim(),
      hobbies: parseCsv(els.personHobbies.value),
      avatarUrl: avatarUrl || "https://placehold.co/240x240?text=Foto"
    };

    people.unshift(person);
    savePeople();
    fillOwnerSelect();
    renderPeople();
    els.personForm.reset();
  });
}

function setupEntryForm() {
  els.entryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!people.length) {
      alert("Bitte zuerst ein Videotheker-Profil anlegen.");
      return;
    }

    const entry = {
      id: `e_${Date.now()}`,
      ownerId: els.entryOwner.value,
      title: els.entryTitle.value.trim(),
      type: els.entryType.value,
      year: Number(els.entryYear.value),
      mood: parseCsv(els.entryMood.value),
      energy: els.entryEnergy.value.trim().toLowerCase(),
      when: parseCsv(els.entryWhen.value),
      tip: els.entryTip.value.trim(),
      honest: els.entryHonest.value.trim(),
      warning: els.entryWarning.value.trim(),
      posterUrl: els.entryPoster.value.trim(),
      trailerUrl: els.entryTrailer.value.trim(),
      where: els.entryWhere.value
    };
    entries.unshift(entry);
    saveEntries();
    renderList();
    els.entryForm.reset();
  });
}

function setupImportExport() {
  els.exportBtn?.addEventListener("click", () => {
    const payload = {
      people,
      entries
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-lounge-library.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  els.importBtn?.addEventListener("click", () => els.importInput.click());
  els.importInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) {
          entries = parsed;
        } else {
          const importedPeople = Array.isArray(parsed.people) ? parsed.people : [];
          const importedEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
          if (!importedEntries.length) throw new Error("invalid");
          people = importedPeople.length ? importedPeople : people;
          entries = importedEntries;
        }

        const fallbackOwnerId = people[0]?.id || "";
        entries = entries.map((entry) => ({ ...entry, ownerId: entry.ownerId || fallbackOwnerId }));
        savePeople();
        saveEntries();
        fillOwnerSelect();
        renderPeople();
        renderList();
      } catch {
        alert("Import fehlgeschlagen");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  });
}

function init() {
  loadAdminAuth();
  showAuthCards();
  loadPeople();
  loadEntries();
  savePeople();
  fillOwnerSelect();
  renderPeople();
  renderList();
  setupAuth();
  setupBranding();
  setupPeopleForm();
  setupEntryForm();
  setupImportExport();
}

init();