// ======================
// Stato locale
// ======================
let me = { nickname: null };
let contacts = [];
let settings = { nickname: "", darkMode: false, language: "it" };
let current = null;

// Traduzioni base
const translations = {
  it: {
    me: "Tu",
    contacts: "Contatti",
    settings: "Impostazioni",
    dark: "Modalità notte",
    nickname: "Nickname",
    language: "Lingua",
    save: "Salva impostazioni",
    addContact: "Aggiungi contatto",
    export: "Esporta",
    import: "Importa"
  },
  en: {
    me: "You",
    contacts: "Contacts",
    settings: "Settings",
    dark: "Dark mode",
    nickname: "Nickname",
    language: "Language",
    save: "Save settings",
    addContact: "Add contact",
    export: "Export",
    import: "Import"
  }
};

// ======================
// Helpers UI
// ======================
const $ = sel => document.querySelector(sel);

function log(html, cls = "") {
  const d = $("#messages");
  const el = document.createElement("div");
  el.className = "msg " + cls;
  el.innerHTML = html;
  d.appendChild(el);
  d.scrollTop = d.scrollHeight;
}

function redrawContacts() {
  const ul = $("#contactList");
  ul.innerHTML = "";
  contacts.forEach((c, i) => {
    const li = document.createElement("li");
    li.textContent = c.nickname;
    li.onclick = () => switchChat(i);
    ul.appendChild(li);
  });
  persistContacts();
}

// ======================
// Settings
// ======================
function openSettings() {
  $("#newNickname").value = settings.nickname || me.nickname;
  $("#darkMode").checked = settings.darkMode;
  $("#language").value = settings.language;
  $("#settingsPanel").style.display = "block";
}

function saveSettings() {
  settings.nickname = $("#newNickname").value.trim() || me.nickname;
  settings.darkMode = $("#darkMode").checked;
  settings.language = $("#language").value;

  me.nickname = settings.nickname;
  $("#meName").textContent = me.nickname;

  if (settings.darkMode) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  applyLanguage();
  persistSettings();   // 🔹 salva su localStorage

  $("#settingsPanel").style.display = "none";
}


function applyLanguage() {
  const dict = translations[settings.language];
  $("#meLabel").textContent = dict.me;
  $("#contactsLabel").textContent = dict.contacts;
  $("#settingsTitle").textContent = dict.settings;
  $("#lblNickname").textContent = dict.nickname;
  $("#lblDarkMode").textContent = dict.dark;
  $("#lblLanguage").textContent = dict.language;
  $("#saveBtn").textContent = dict.save;
  $("#addBtn").textContent = dict.addContact;
  $("#exportBtn").textContent = dict.export;
  $("#importBtn").textContent = dict.import;
}

// ======================
// Persistenza
// ======================
function persistSettings() {
  localStorage.setItem("settings", JSON.stringify(settings));
}
function loadSettings() {
  const raw = localStorage.getItem("settings");
  if (raw) {
    settings = JSON.parse(raw);
    me.nickname = settings.nickname;
    if (settings.darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
    applyLanguage();
    $("#meName").textContent = me.nickname;
  } else {
    // primo avvio → chiedi nome
    me.nickname = prompt("Il tuo nickname:") || "user" + Math.floor(Math.random() * 999);
    settings.nickname = me.nickname;
    persistSettings();
    $("#meName").textContent = me.nickname;
    applyLanguage();
  }
}

function persistContacts() {
  localStorage.setItem("contacts", JSON.stringify(contacts));
}
function loadContacts() {
  const raw = localStorage.getItem("contacts");
  if (raw) {
    contacts = JSON.parse(raw);
    redrawContacts();
  }
}

// ======================
// Export/Import contatti
// ======================
function exportContacts() {
  const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contacts.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importContacts(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        contacts = imported;
        persistContacts();
        redrawContacts();
        alert("Contatti importati!");
      }
    } catch {
      alert("File non valido");
    }
  };
  reader.readAsText(file);
}

// ======================
// Chat dummy
// ======================
function switchChat(i) {
  current = contacts[i];
  $("#chatWith").textContent = "Chat con " + current.nickname;
  $("#messages").innerHTML = "";
}

function sendMsg() {
  if (!current) return;
  const text = $("#msg").value.trim();
  if (!text) return;
  $("#msg").value = "";
  log(`<div class="me"><b>${translations[settings.language].me}:</b> ${text}</div>`, "me");
  // qui andrebbe la cifratura + publish via MQTT
}

// ======================
// Init
// ======================
window.onload = () => {
  loadSettings();
  loadContacts();

  $("#settingsBtn").addEventListener("click", openSettings);
  $("#saveBtn").addEventListener("click", saveSettings);
  $("#sendBtn").addEventListener("click", sendMsg);
  $("#msg").addEventListener("keydown", e => {
    if (e.key === "Enter") sendMsg();
  });

  $("#addBtn").addEventListener("click", () => {
    const nick = prompt("Nickname contatto?");
    if (!nick) return;
    contacts.push({ nickname: nick });
    redrawContacts();
  });

  $("#exportBtn").addEventListener("click", exportContacts);
  $("#importFile").addEventListener("change", importContacts);
};
