
"use strict";

/* =====================================
   GAMECHAT V1.0 - APPLICATION ENGINE
   Prototype local de démonstration
===================================== */

const DB = {
  users: "gamechat_users",
  session: "gamechat_session",
  balance: "gamechat_balance",
  transactions: "gamechat_transactions",
  streams: "gamechat_streams",
  messages: "gamechat_messages"
};

const initialStreams = [
  {
    id: "demo1",
    title: "Session Gaming avec la communauté",
    creator: "GameMaster",
    category: "Gaming",
    description: "Bienvenue dans notre session gaming !",
    emoji: "🎮",
    color: "",
    viewers: 128
  },
  {
    id: "demo2",
    title: "Musique et bonne ambiance",
    creator: "MusicWorld",
    category: "Musique",
    description: "Découvrons de nouvelles musiques.",
    emoji: "🎵",
    color: "blue",
    viewers: 86
  },
  {
    id: "demo3",
    title: "Discussion entre amis",
    creator: "Community",
    category: "Discussion",
    description: "Discutons ensemble de tout et de rien.",
    emoji: "💬",
    color: "orange",
    viewers: 54
  }
];

let authMode = "register";
let activeStream = null;
let activeCategory = "Tous";

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession() {
  return read(DB.session, null);
}

function getBalance() {
  return Number(localStorage.getItem(DB.balance) || 0);
}

function getStreams() {
  const streams = read(DB.streams, null);

  if (!Array.isArray(streams)) {
    save(DB.streams, initialStreams);
    return initialStreams;
  }

  return streams;
}

function getTransactions() {
  return read(DB.transactions, []);
}

function notify(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(notify.timer);

  notify.timer = setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

/* NAVIGATION */

function showPage(page) {
  const target = document.getElementById(page);

  if (!target) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  target.classList.add("active");

  if (page === "wallet") updateWallet();
  if (page === "profile") updateProfile();
  if (page === "home" || page === "discover") renderStreams();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* AUTHENTIFICATION DE DÉMONSTRATION */

function setAuthMode(mode) {
  authMode = mode;

  document.getElementById("registerTab").classList.toggle(
    "selected", mode === "register"
  );

  document.getElementById("loginTab").classList.toggle(
    "selected", mode === "login"
  );

  document.getElementById("username").required = mode === "register";

  document.getElementById("username").classList.toggle(
    "hidden", mode === "login"
  );

  document.querySelector('label[for="username"]');

  document.getElementById("authSubmit").textContent =
    mode === "register" ? "Créer mon compte" : "Me connecter";

  document.getElementById("authMessage").textContent = "";
}

document.getElementById("authForm").addEventListener("submit", async event => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const message = document.getElementById("authMessage");

  if (password.length < 8) {
    message.textContent = "Mot de passe : 8 caractères minimum.";
    return;
  }

  let users = read(DB.users, []);

  if (authMode === "register") {
    if (username.length < 3) {
      message.textContent = "Ton pseudo doit contenir au moins 3 caractères.";
      return;
    }

    if (users.some(user => user.email === email)) {
      message.textContent = "Cette adresse e-mail existe déjà.";
      return;
    }

    const user = {
      id: "user_" + Date.now(),
      username,
      email,
      password,
      role: "Membre",
      createdAt: new Date().toISOString()
    };

    users.push(user);
    save(DB.users, users);
    save(DB.session, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    localStorage.setItem(DB.balance, "100");
    save(DB.transactions, [{
      description: "Bonus de bienvenue (démo)",
      amount: 100,
      date: new Date().toISOString()
    }]);

    message.textContent = "Bienvenue sur GAMECHAT !";
    updateInterface();
    notify("Compte de démonstration créé !");
    showPage("home");

  } else {
    const user = users.find(
      item => item.email === email && item.password === password
    );

    if (!user) {
      message.textContent = "Identifiants incorrects.";
      return;
    }

    save(DB.session, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    updateInterface();
    notify("Connexion réussie !");
    showPage("home");
  }

  event.target.reset();
});

function logout() {
  localStorage.removeItem(DB.session);
  updateInterface();
  notify("Déconnexion effectuée.");
  showPage("home");
}

/* AFFICHAGE UTILISATEUR */

function updateInterface() {
  const user = getSession();

  document.getElementById("loginBtn").classList.toggle("hidden", !!user);
  document.getElementById("logoutBtn").classList.toggle("hidden", !user);

  document.getElementById("tokenBalance").textContent = getBalance();

  updateProfile();
  updateWallet();
}

function updateProfile() {
  const user = getSession();

  document.getElementById("profileName").textContent =
    user ? user.username : "Visiteur";

  document.getElementById("profileEmail").textContent =
    user ? user.email : "Connecte-toi pour voir ton profil.";

  document.getElementById("profileRole").textContent =
    user ? user.role : "Membre GAMECHAT";
}

/* CATALOGUE DES LIVES */

function renderStreams() {
  const streams = getStreams();

  const homeGrid = document.getElementById("liveGrid");
  const discoverGrid = document.getElementById("discoverGrid");

  if (homeGrid) {
    homeGrid.replaceChildren();

    streams.slice(0, 3).forEach(stream => {
      homeGrid.appendChild(createStreamCard(stream));
    });
  }

  if (discoverGrid) {
    discoverGrid.replaceChildren();

    const search = document.getElementById("searchInput")
      .value.toLowerCase();

    streams
      .filter(stream => {
        const matchesCategory =
          activeCategory === "Tous" ||
          stream.category === activeCategory;

        const text = (
          stream.title + " " +
          stream.creator + " " +
          stream.category
        ).toLowerCase();

        return matchesCategory && text.includes(search);
      })
      .forEach(stream => {
        discoverGrid.appendChild(createStreamCard(stream));
      });
  }
}

function createStreamCard(stream) {
  const card = document.createElement("article");
  card.className = "live-card";

  const thumb = document.createElement("div");
  thumb.className = "live-thumb " + (stream.color || "");

  const emoji = document.createElement("span");
  emoji.textContent = stream.emoji || "📹";

  const tag = document.createElement("span");
  tag.className = "live-tag";
  tag.textContent = "● LIVE DÉMO";

  thumb.append(emoji, tag);

  const details = document.createElement("div");
  details.className = "live-details";

  const title = document.createElement("h3");
  title.textContent = stream.title;

  const creator = document.createElement("p");
  creator.textContent = "👤 " + stream.creator;

  const category = document.createElement("p");
  category.textContent =
    "📂 " + stream.category + " · 👁 " + stream.viewers;

  details.append(title, creator, category);
  card.append(thumb, details);

  card.addEventListener("click", () => openStream(stream.id));

  return card;
}

function filterCategory(category) {
  activeCategory = category;
  renderStreams();
}

document.getElementById("searchInput").addEventListener("input", renderStreams);

/* SALLE DE DIRECT */

function openStream(id) {
  const stream = getStreams().find(item => item.id === id);

  if (!stream) {
    notify("Ce direct n'existe pas.");
    return;
  }

  activeStream = stream;

  document.getElementById("liveTitle").textContent = stream.title;
  document.getElementById("liveCreator").textContent =
    "👤 " + stream.creator;

  document.getElementById("roomTitle").textContent = stream.title;
  document.getElementById("roomDescription").textContent =
    stream.description || "Bienvenue dans cette communauté.";

  document.getElementById("liveVisual").textContent =
    stream.emoji || "📹";

  renderChat();
  showPage("live");
}

/* CHAT LOCAL DE DÉMONSTRATION */

function renderChat() {
  const container = document.getElementById("chatMessages");
  container.replaceChildren();

  if (!activeStream) return;

  const messages = read(DB.messages, [])
    .filter(item => item.streamId === activeStream.id);

  messages.slice(-100).forEach(message => {
    const line = document.createElement("div");
    line.className = "chat-message";

    const name = document.createElement("strong");
    name.textContent = message.username + " : ";

    const content = document.createElement("span");
    content.textContent = message.text;

    line.append(name, content);
    container.appendChild(line);
  });

  container.scrollTop = container.scrollHeight;
}

document.getElementById("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const user = getSession();

  if (!user) {
    notify("Connecte-toi pour participer au chat.");
    showPage("auth");
    return;
  }

  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !activeStream) return;

  const messages = read(DB.messages, []);

  messages.push({
    streamId: activeStream.id,
    username: user.username,
    text,
    date: new Date().toISOString()
  });

  save(DB.messages, messages.slice(-500));

  input.value = "";
  renderChat();
});

/* JETONS ET CADEAUX DE DÉMONSTRATION */

function addTransaction(description, amount) {
  const history = getTransactions();

  history.unshift({
    description,
    amount,
    date: new Date().toISOString()
  });

  save(DB.transactions, history.slice(0, 100));
}

function sendGift() {
  if (!getSession()) {
    notify("Connecte-toi pour envoyer un cadeau.");
    showPage("auth");
    return;
  }

  if (!activeStream) return;

  if (getBalance() < 10) {
    notify("Solde de démonstration insuffisant.");
    return;
  }

  localStorage.setItem(DB.balance, String(getBalance() - 10));

  addTransaction(
    "Cadeau envoyé à " + activeStream.creator,
    -10
  );

  updateInterface();
  notify("🎁 Cadeau de démonstration envoyé !");
}

/* PORTEFEUILLE */

function updateWallet() {
  const balance = getBalance();

  document.getElementById("walletBalance").textContent = balance;
  document.getElementById("tokenBalance").textContent = balance;

  const container = document.getElementById("transactions");
  container.replaceChildren();

  const history = getTransactions();

  if (!history.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Aucune transaction.";
    container.appendChild(empty);
    return;
  }

  history.forEach(transaction => {
    const row = document.createElement("div");
    row.className = "transaction";

    const description = document.createElement("p");
    description.textContent = transaction.description;

    const amount = document.createElement("strong");
    amount.textContent =
      (transaction.amount > 0 ? "+" : "") +
      transaction.amount + " jetons";

    const date = document.createElement("p");
    date.className = "small";
    date.textContent =
      new Date(transaction.date).toLocaleString("fr-FR");

    row.append(description, amount, date);
    container.appendChild(row);
  });
}

/* CRÉATION D'UNE SALLE */

document.getElementById("createForm").addEventListener("submit", event => {
  event.preventDefault();

  const user = getSession();

  if (!user) {
    notify("Connecte-toi pour créer un direct.");
    showPage("auth");
    return;
  }

  const title = document.getElementById("streamTitle").value.trim();
  const category = document.getElementById("streamCategory").value;
  const description =
    document.getElementById("streamDescription").value.trim();

  if (!title) return;

  const emojis = {
    Gaming: "🎮",
    Musique: "🎵",
    Discussion: "💬",
    Sport: "🏀",
    Éducation: "📚",
    Autre: "📹"
  };

  const stream = {
    id: "stream_" + Date.now(),
    title,
    creator: user.username,
    category,
    description,
    emoji: emojis[category] || "📹",
    color: "",
    viewers: 1
  };

  const streams = getStreams();
  streams.unshift(stream);
  save(DB.streams, streams);

  document.getElementById("createForm").reset();

  notify("Salle de démonstration créée !");
  openStream(stream.id);
});

/* INITIALISATION */

function initializeGameChat() {
  if (!Array.isArray(read(DB.users, []))) {
    save(DB.users, []);
  }

  getStreams();

  updateInterface();
  renderStreams();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => console.log("PWA:", error.message));
  }
}

initializeGameChat();
