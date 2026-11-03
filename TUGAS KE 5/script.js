const searchForm = document.getElementById("searchForm");
const usernameInput = document.getElementById("username");
const searchButton = document.getElementById("searchButton");
const statusBox = document.getElementById("status");
const resultCard = document.getElementById("result");

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = "status " + type;
  statusBox.hidden = false;
}

function hideStatus() {
  statusBox.hidden = true;
  statusBox.textContent = "";
  statusBox.className = "status";
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

function showProfile(user) {
  document.getElementById("avatar").src = user.avatar_url;
  document.getElementById("avatar").alt = "Avatar " + user.login;
  document.getElementById("name").textContent = user.name || user.login;
  document.getElementById("login").textContent = "@" + user.login;
  document.getElementById("bio").textContent = user.bio || "Pengguna ini belum menambahkan bio.";
  document.getElementById("repos").textContent = formatNumber(user.public_repos);
  document.getElementById("followers").textContent = formatNumber(user.followers);
  document.getElementById("following").textContent = formatNumber(user.following);

  const profileLink = document.getElementById("profileLink");
  profileLink.href = user.html_url;

  resultCard.hidden = false;
}

searchForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = usernameInput.value.trim();

  if (!username) {
    resultCard.hidden = true;
    showStatus("Username tidak boleh kosong. Silakan masukkan username GitHub.", "error");
    usernameInput.focus();
    return;
  }

  // Username GitHub hanya menerima huruf, angka, dan tanda hubung.
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    resultCard.hidden = true;
    showStatus("Format username tidak valid. Gunakan 1–39 karakter berupa huruf, angka, atau tanda hubung.", "error");
    usernameInput.focus();
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Memuat...";
  resultCard.hidden = true;
  showStatus("Sedang mengambil data profil GitHub...", "loading");

  try {
    const response = await fetch(
      "https://api.github.com/users/" + encodeURIComponent(username),
      {
        headers: {
          "Accept": "application/vnd.github+json"
        }
      }
    );

    if (response.status === 404) {
    // 1. Menyembunyikan form pencarian dan komponen hasil
    const mainContainer = document.querySelector(".container");
    
    // Kita sembunyikan semua elemen anak di dalam container terlebih dahulu
    Array.from(mainContainer.children).forEach(child => {
        if (child.id !== "error404-container" && child.tagName !== "FOOTER") {
            child.style.display = "none";
        }
    });
    
    // 2. Memunculkan tampilan error 404 besar
    const errorBox = document.getElementById("error404-container");
    errorBox.style.display = "block";
    
    // 3. Logika ketika tombol "Cari Lagi" diklik
    document.getElementById("btn-kembali").onclick = function() {
        errorBox.style.display = "none";
        
        // Memunculkan kembali elemen pencarian asli
        document.querySelector(".search-card").style.display = "block";
        
        // Reset input text
        const usernameInput = document.getElementById("username");
        if (usernameInput) {
            usernameInput.value = "";
            usernameInput.focus();
        }
    };
    
    return;
}

    if (response.status === 403 || response.status === 429) {
      showStatus("404: User tidak ditemukan. Periksa kembali username Github yang dimasukkan.", "error");
      return;
    }

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const user = await response.json();

    showProfile(user);
    showStatus("Profil berhasil ditemukan.", "success");

  } catch (error) {
    showStatus("Terjadi kesalahan saat mengambil data. Periksa koneksi internet lalu coba lagi.", "error");
    console.error("GitHub API error:", error);

  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Cari Profil";
  }
});