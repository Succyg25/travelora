const protectedPages = [
  "dashboard.html",
  "profile.html",
  "mybookings.html",
  "confirmation.html",
];

const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!loggedInUser) {
    alert("Please log in first to access this page.");
    window.location.replace("login.html");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const safeText = (el, value) => el && (el.textContent = value);

  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const isDigits = (v) => /^\d+$/.test(v);

  const escapeHtml = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const calcDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e - s;
    if (isNaN(diff) || diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

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

  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  const navAuthLinks = $("navAuthLinks");
  const navUserDropdown = $("navUserDropdown");
  const navUserName = $("navUserName");
  const profileNavItem = $("profileNavItem");

  if (user && user.name) {
    navAuthLinks?.classList.add("d-none");
    navUserDropdown?.classList.remove("d-none");
    navUserName.textContent = user.name;
    if (profileNavItem) profileNavItem.style.display = "block";
  } else {
    navAuthLinks?.classList.remove("d-none");
    navUserDropdown?.classList.add("d-none");
    if (profileNavItem) profileNavItem.style.display = "none";
  }

  document.querySelectorAll("#logoutBtn, [data-logout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "login.html";
    });
  });

  const profileForm = $("profileForm");
  if (profileForm && user) {
    $("profileName").value = user.name;
    $("profileEmail").value = user.email;

    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const newName = $("profileName").value.trim();
      const newEmail = $("profileEmail").value.trim();
      const newPassword = $("profilePassword").value;

      if (!newName || !newEmail) return alert("Name and email required.");
      if (!isEmail(newEmail)) return alert("Invalid email.");

      let users = JSON.parse(localStorage.getItem("users")) || [];
      const index = users.findIndex((u) => u.email === user.email);

      const updated = { ...user, name: newName, email: newEmail };
      if (newPassword) updated.password = newPassword;

      users[index] = updated;

      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("loggedInUser", JSON.stringify(updated));

      alert("Profile updated!");
      $("profilePassword").value = "";
      navUserName.textContent = newName;
    });
  }

  const signupForm = $("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = $("signupName").value.trim();
      const email = $("signupEmail").value.trim();
      const password = $("signupPassword").value.trim();

      if (!name || !email || !password) return alert("All fields required.");
      if (!isEmail(email)) return alert("Invalid email.");

      let users = JSON.parse(localStorage.getItem("users")) || [];

      if (users.some((u) => u.email === email)) {
        alert("Email already registered.");
        return;
      }

      users.push({ name, email, password });
      localStorage.setItem("users", JSON.stringify(users));

      alert("Account created! Please login.");
      window.location.href = "login.html";
    });
  }

  const loginForm = $("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = $("loginEmail").value.trim();
      const password = $("loginPassword").value.trim();

      let users = JSON.parse(localStorage.getItem("users")) || [];
      const found = users.find(
        (u) => u.email === email && u.password === password
      );

      if (!found) return alert("Invalid email or password!");

      localStorage.setItem("loggedInUser", JSON.stringify(found));
      window.location.href = "index.html";
    });
  }

  const bookingForm = $("bookingForm");
  if (bookingForm) {
    const destEl = $("destination");
    const travelersEl = $("travelers");
    const startEl = $("startDate");
    const endEl = $("endDate");
    const basePriceEl = $("basePrice");
    const totalEl = $("totalCost");

    const updateBasePrice = () => {
      if (!destEl) return;
      const opt = destEl.options[destEl.selectedIndex];
      basePriceEl.value = opt?.dataset.price || "";
    };

    const updateTotal = () => {
      const base = parseFloat(basePriceEl?.value) || 0;
      const travelers = parseInt(travelersEl?.value) || 1;
      const days = calcDays(startEl?.value, endEl?.value) || 1;
      const total = base * travelers * days;

      safeText(
        totalEl,
        `$${total.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      );
    };

    const autoFixEndDate = () => {
      if (!startEl.value) return;
      const s = new Date(startEl.value);
      const e = new Date(endEl.value);
      if (isNaN(e) || e <= s) {
        s.setDate(s.getDate() + 1);
        endEl.value = s.toISOString().split("T")[0];
      }
    };

    updateBasePrice();
    autoFixEndDate();
    updateTotal();

    destEl.addEventListener("change", () => {
      updateBasePrice();
      updateTotal();
    });
    startEl.addEventListener("change", () => {
      autoFixEndDate();
      updateTotal();
    });
    endEl.addEventListener("change", updateTotal);
    travelersEl.addEventListener("input", updateTotal);

    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const booking = {
        id: Date.now(),
        fullName: $("fullName").value.trim(),
        email: $("email").value.trim(),
        phone: $("phone").value.trim(),
        destination: destEl.value,
        travelers: parseInt(travelersEl.value),
        startDate: startEl.value,
        endDate: endEl.value,
        basePrice: parseFloat(basePriceEl.value),
        bookedAt: new Date().toISOString(),
      };

      if (!booking.fullName || !booking.email || !booking.phone)
        return alert("Please fill all fields.");

      if (!isEmail(booking.email)) return alert("Invalid email.");
      if (!isDigits(booking.phone)) return alert("Phone must contain digits.");

      const days = calcDays(booking.startDate, booking.endDate);
      if (days <= 0) return alert("End date must be after start date.");

      booking.days = days;
      booking.totalCost = booking.basePrice * booking.travelers * days;

      let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
      bookings.push(booking);

      localStorage.setItem("bookings", JSON.stringify(bookings));
      localStorage.setItem("latestBooking", JSON.stringify(booking));

      window.location.href = "confirmation.html";
    });
  }

  if (currentPage === "confirmation.html") {
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
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Travelora Booking Receipt", 20, 20);

        doc.setFontSize(12);
        let y = 40;
        [
          `Name: ${booking.fullName}`,
          `Email: ${booking.email}`,
          `Destination: ${booking.destination}`,
          `Dates: ${formatDate(booking.startDate)} - ${formatDate(
            booking.endDate
          )}`,
          `Travelers: ${booking.travelers}`,
          `Total Cost: $${booking.totalCost.toLocaleString()}`,
        ].forEach((line) => {
          doc.text(line, 20, y);
          y += 8;
        });

        doc.save("Travelora_Receipt.pdf");
      });
    }, 100);
  }

  const bookingsList = $("bookings-list");
  const clearAllBtn = $("clear-all");

  if (bookingsList) {
    const render = () => {
      let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

      if (!bookings.length) {
        bookingsList.innerHTML = `<p class="text-muted">No bookings found.</p>`;
        if (clearAllBtn) clearAllBtn.disabled = true;
        return;
      }

      bookingsList.innerHTML = "";
      clearAllBtn.disabled = false;

      bookings.forEach((b, i) => {
        const card = document.createElement("div");
        card.className = "col-12 col-md-8 col-lg-6 mb-3";

        card.innerHTML = `
          <div class="card shadow-sm">
            <div class="card-body">
              <h5>${escapeHtml(b.destination)}</h5>
              <p><strong>Name:</strong> ${escapeHtml(b.fullName)}</p>
              <p><strong>Email:</strong> ${escapeHtml(b.email)}</p>
              <p><strong>Travelers:</strong> ${b.travelers}</p>
              <p><strong>Dates:</strong> ${formatDate(
                b.startDate
              )} → ${formatDate(b.endDate)}</p>
              <p><strong>Total Cost:</strong> $${b.totalCost.toLocaleString()}</p>
              <button class="btn btn-danger btn-sm delete-btn">Delete</button>
              <button class="btn btn-primary btn-sm download-btn">Download Receipt</button>
            </div>
          </div>
        `;

        card.querySelector(".delete-btn").addEventListener("click", () => {
          bookings.splice(i, 1);
          localStorage.setItem("bookings", JSON.stringify(bookings));
          render();
        });

        card.querySelector(".download-btn").addEventListener("click", () => {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();

          doc.setFontSize(18);
          doc.text("Travelora Booking Receipt", 20, 25);

          doc.setFontSize(12);
          let y = 45;
          [
            `Name: ${b.fullName}`,
            `Email: ${b.email}`,
            `Destination: ${b.destination}`,
            `Dates: ${formatDate(b.startDate)} - ${formatDate(b.endDate)}`,
            `Travelers: ${b.travelers}`,
            `Total Cost: $${b.totalCost.toLocaleString()}`,
          ].forEach((line) => {
            doc.text(line, 20, y);
            y += 8;
          });

          doc.save(`Travelora_Receipt_${b.id}.pdf`);
        });

        bookingsList.appendChild(card);
      });
    };

    clearAllBtn?.addEventListener("click", () => {
      if (confirm("Delete all bookings?")) {
        localStorage.removeItem("bookings");
        render();
      }
    });

    render();
  }
});
