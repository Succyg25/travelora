document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  const safeText = (el, value) => el && (el.textContent = value);

  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const isDigits = (v) => /^\d+$/.test(v);

  const calcDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e - s;
    if (isNaN(diff) || diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const escapeHtml = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Navbar login/logout toggle
  (function navbarUserToggle() {
    const navAuthLinks = $("navAuthLinks");
    const navUserDropdown = $("navUserDropdown");
    const navUserName = $("navUserName");
    const logoutBtn = $("logoutBtn");

    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (user && user.name) {
      navAuthLinks?.classList.add("d-none");
      navUserDropdown?.classList.remove("d-none");
      if (navUserName) navUserName.textContent = user.name;
    } else {
      navAuthLinks?.classList.remove("d-none");
      navUserDropdown?.classList.add("d-none");
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        location.reload();
      });
    }
  })();

  // Booking form
  (function initBookingForm() {
    const form = $("bookingForm");
    if (!form) return;

    const nameEl = $("fullName") || $("name");
    const emailEl = $("email");
    const phoneEl = $("phone");
    const destEl = $("destination");
    const travelersEl = $("travelers");
    const startEl = $("startDate");
    const endEl = $("endDate");
    const totalEl =
      $("totalCost") || $("totalCostDisplay") || qs(".total-display");
    const basePriceEl = $("basePrice");

    const updateBasePrice = () => {
      if (!destEl) return;
      const selectedOption = destEl.options[destEl.selectedIndex];
      if (selectedOption && selectedOption.dataset.price) {
        basePriceEl.value = selectedOption.dataset.price;
      } else {
        basePriceEl.value = "";
      }
    };

    const updateTotal = () => {
      const base = parseFloat(basePriceEl?.value) || 0;
      const travelers = parseInt(travelersEl?.value) || 1;
      const days = calcDays(startEl?.value, endEl?.value);
      let total = 0;
      if (days > 0) {
        total = base * travelers * days;
      } else {
        total = base * travelers;
      }
      if (totalEl)
        safeText(
          totalEl,
          `$${total.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        );
    };

    function addOneDay(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      if (isNaN(date)) return "";
      date.setDate(date.getDate() + 1);
      return date.toISOString().split("T")[0];
    }

    function fixEndDate() {
      if (!startEl || !endEl) return;
      const startDate = new Date(startEl.value);
      const endDate = new Date(endEl.value);

      if (!startEl.value) return;
      if (isNaN(endDate) || endDate <= startDate) {
        endEl.value = addOneDay(startEl.value);
      }
    }

    updateBasePrice();
    fixEndDate();
    updateTotal();

    destEl.addEventListener("change", () => {
      updateBasePrice();
      updateTotal();
    });

    startEl.addEventListener("change", () => {
      fixEndDate();
      updateTotal();
    });
    endEl.addEventListener("change", () => {
      fixEndDate();
      updateTotal();
    });

    travelersEl?.addEventListener("input", updateTotal);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const booking = {
        id: Date.now(),
        fullName: nameEl.value.trim(),
        email: emailEl.value.trim(),
        phone: phoneEl.value.trim(),
        destination: destEl.value,
        travelers: parseInt(travelersEl.value),
        startDate: startEl.value,
        endDate: endEl.value,
        basePrice: parseFloat(basePriceEl.value),
        bookedAt: new Date().toISOString(),
      };

      if (
        !booking.fullName ||
        !booking.email ||
        !booking.phone ||
        !booking.destination ||
        !booking.startDate ||
        !booking.endDate
      )
        return alert("Please fill in all fields.");

      if (!isEmail(booking.email)) return alert("Enter a valid email.");
      if (!isDigits(booking.phone))
        return alert("Phone must contain only digits.");

      const days = calcDays(booking.startDate, booking.endDate);
      if (days <= 0) return alert("End date must be after start date.");

      booking.days = days;
      booking.totalCost = booking.basePrice * booking.travelers * days;

      const saved = JSON.parse(localStorage.getItem("bookings")) || [];
      saved.push(booking);
      localStorage.setItem("bookings", JSON.stringify(saved));
      localStorage.setItem("latestBooking", JSON.stringify(booking));

      [
        "fullName",
        "email",
        "phone",
        "destination",
        "travelers",
        "startDate",
        "endDate",
      ].forEach((id) => localStorage.removeItem("form_" + id));

      window.location.href = "confirmation.html";
    });
  })();

  (function initConfirmation() {
    setTimeout(() => {
      const booking = JSON.parse(localStorage.getItem("latestBooking"));
      if (!booking) return;

      safeText($("confDestination"), booking.destination);
      safeText(
        $("confDates"),
        `${formatDate(booking.startDate)} → ${formatDate(booking.endDate)}`
      );
      safeText($("confTravelers"), booking.travelers);
      safeText(
        $("confCost"),
        `$${booking.totalCost.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      );
      safeText(
        $("confMessage"),
        `Your trip has been reserved, ${booking.fullName}. A confirmation email was sent to ${booking.email}.`
      );

      $("downloadReceipt")?.addEventListener("click", () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Travelora Booking Receipt", 20, 25);
        doc.setFontSize(12);

        const lines = [
          `Name: ${booking.fullName}`,
          `Email: ${booking.email}`,
          `Destination: ${booking.destination}`,
          `Dates: ${formatDate(booking.startDate)} - ${formatDate(
            booking.endDate
          )}`,
          `Travelers: ${booking.travelers}`,
          `Total Cost: $${booking.totalCost.toLocaleString()}`,
        ];

        let y = 45;
        lines.forEach((line) => {
          doc.text(line, 20, y);
          y += 8;
        });

        doc.save("Travelora_Receipt.pdf");
      });
    }, 100);
  })();

  (function initMyBookings() {
    const list = $("bookings-list");
    const clearAllBtn = $("clear-all");
    if (!list) return;

    const renderBookings = () => {
      let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
      if (bookings.length === 0) {
        list.innerHTML = `<p class="text-muted">No bookings found.</p>`;
        if (clearAllBtn) clearAllBtn.disabled = true;
        return;
      }
      if (clearAllBtn) clearAllBtn.disabled = false;
      list.innerHTML = "";

      bookings.forEach((b, i) => {
        const card = document.createElement("div");
        card.className = "col-12 col-md-8 col-lg-6 mb-3";

        card.innerHTML = `
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${escapeHtml(b.destination)}</h5>
              <p class="card-text mb-1"><strong>Name:</strong> ${escapeHtml(
                b.fullName
              )}</p>
              <p class="card-text mb-1"><strong>Email:</strong> ${escapeHtml(
                b.email
              )}</p>
              <p class="card-text mb-1"><strong>Travelers:</strong> ${
                b.travelers
              }</p>
              <p class="card-text mb-1"><strong>Dates:</strong> ${formatDate(
                b.startDate
              )} → ${formatDate(b.endDate)}</p>
              <p class="card-text mb-3"><strong>Total Cost:</strong> $${b.totalCost.toLocaleString()}</p>
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-danger btn-sm delete-btn">Delete</button>
                <button class="btn btn-primary btn-sm download-btn">Download Receipt</button>
              </div>
            </div>
          </div>
        `;

        card.querySelector(".delete-btn").addEventListener("click", () => {
          bookings.splice(i, 1);
          localStorage.setItem("bookings", JSON.stringify(bookings));
          renderBookings();
        });

        card.querySelector(".download-btn").addEventListener("click", () => {
          const doc = new jsPDF();

          doc.setFontSize(18);
          doc.text("Travelora Booking Receipt", 20, 25);
          doc.setFontSize(12);

          const lines = [
            `Name: ${b.fullName}`,
            `Email: ${b.email}`,
            `Destination: ${b.destination}`,
            `Dates: ${formatDate(b.startDate)} - ${formatDate(b.endDate)}`,
            `Travelers: ${b.travelers}`,
            `Total Cost: $${b.totalCost.toLocaleString()}`,
          ];

          let y = 45;
          lines.forEach((line) => {
            doc.text(line, 20, y);
            y += 8;
          });

          doc.save(`Travelora_Receipt_${b.id || i}.pdf`);
        });

        list.appendChild(card);
      });
    };

    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete all bookings?")) {
          localStorage.removeItem("bookings");
          renderBookings();
        }
      });
    }

    renderBookings();
  })();

  function saveUser(name, email, password) {
    const userData = { name, email, password };
    localStorage.setItem("traveloraUser", JSON.stringify(userData));
  }

  function loginUser(email, password) {
    const saved = JSON.parse(localStorage.getItem("traveloraUser"));
    if (!saved) return false;
    if (saved.email === email && saved.password === password) {
      localStorage.setItem("loggedInUser", JSON.stringify(saved));
      return true;
    }
    return false;
  }

  function logoutUser() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  }

  function displayLoggedInUser() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const headerBox = $("user-info");

    if (headerBox && user) {
      headerBox.innerHTML = `
        Welcome, <strong>${user.name}</strong> 👋
        <button class="btn btn-sm btn-outline-light ms-3" id="logoutBtn">Logout</button>
      `;
      $("logoutBtn").addEventListener("click", logoutUser);
    }
  }

  displayLoggedInUser();

  const signupForm = $("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const signupName = $("signupName");
      const signupEmail = $("signupEmail");
      const signupPassword = $("signupPassword");

      saveUser(
        signupName.value.trim(),
        signupEmail.value.trim(),
        signupPassword.value.trim()
      );

      alert("Account created successfully! Please login.");
      window.location.href = "login.html";
    });
  }

  const loginForm = $("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const loginEmail = $("loginEmail");
      const loginPassword = $("loginPassword");

      const success = loginUser(
        loginEmail.value.trim(),
        loginPassword.value.trim()
      );

      if (!success) {
        alert("Invalid email or password!");
        return;
      }

      window.location.href = "index.html";
    });
  }

  function loadProfile() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const box = $("profileBox");

    if (box && user) {
      box.innerHTML = `
        <p class="fs-5"><strong>Name:</strong> ${user.name}</p>
        <p class="fs-5"><strong>Email:</strong> ${user.email}</p>
      `;
    }
  }

  loadProfile();

  (function protectIndexPage() {
    if (window.location.pathname.includes("index.html")) {
      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
      if (!loggedInUser) {
        window.location.href = "login.html";
      }
    }
  })();

  (function protectPrivatePages() {
    const PUBLIC_PAGES = ["login.html", "register.html", "signup.html"];
    const currentPage = window.location.pathname.split("/").pop();
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!PUBLIC_PAGES.includes(currentPage)) {
      if (!loggedInUser) {
        window.location.href = "login.html";
      }
    }
  })();
});
document.addEventListener("DOMContentLoaded", () => {
  const navAuthLinks = document.getElementById("navAuthLinks");
  const navUserDropdown = document.getElementById("navUserDropdown");
  const navUserName = document.getElementById("navUserName");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileNavItem = document.getElementById("profileNavItem");

  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (user && user.name) {
    navAuthLinks?.classList.add("d-none");
    navUserDropdown?.classList.remove("d-none");
    profileNavItem.style.display = "block";
    if (navUserName) navUserName.textContent = user.name;
  } else {
    navAuthLinks?.classList.remove("d-none");
    navUserDropdown?.classList.add("d-none");
    profileNavItem.style.display = "none";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      location.reload();
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const profileBox = document.getElementById("profileBox");
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logoutBtn");

  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (userInfo) {
    userInfo.textContent = `Welcome, ${user.name} 👋`;
  }

  if (profileBox) {
    profileBox.innerHTML = `
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "login.html";
    });
  }
});
const profileForm = document.getElementById("profileForm");

if (profileForm && user) {
  document.getElementById("profileName").value = user.name;
  document.getElementById("profileEmail").value = user.email;

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newName = document.getElementById("profileName").value.trim();
    const newEmail = document.getElementById("profileEmail").value.trim();
    const newPassword = document.getElementById("profilePassword").value;

    if (!newName || !newEmail) {
      alert("Name and email cannot be empty.");
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(newEmail)) {
      alert("Please enter a valid email.");
      return;
    }

    let updatedUser = { ...user, name: newName, email: newEmail };

    if (newPassword.trim() !== "") {
      updatedUser.password = newPassword;
    }

    localStorage.setItem("traveloraUser", JSON.stringify(updatedUser));
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

    alert("Profile updated successfully!");

    document.getElementById("profilePassword").value = "";

    const navUserName = document.getElementById("navUserName");
    if (navUserName) navUserName.textContent = updatedUser.name;

    const userInfo = document.getElementById("user-info");
    if (userInfo) userInfo.textContent = `Welcome, ${updatedUser.name} 👋`;
  });
}
