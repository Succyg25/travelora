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

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const PUBLIC_PAGES = ["login.html", "register.html", "signup.html"];
  const isPublicPage = PUBLIC_PAGES.includes(currentPage);

  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!isPublicPage && !user) {
    window.location.replace("login.html");
    return;
  }

  const navAuthLinks = $("navAuthLinks");
  const navUserDropdown = $("navUserDropdown");
  const navUserName = $("navUserName");
  const profileNavItem = $("profileNavItem");

  if (user && user.name) {
    navAuthLinks?.classList.add("d-none");
    navUserDropdown?.classList.remove("d-none");
    if (navUserName) navUserName.textContent = user.name;
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

  const userInfo = $("user-info");
  if (userInfo && user) {
    userInfo.innerHTML = `Welcome, <strong>${escapeHtml(
      user.name
    )}</strong> 👋`;
  }

  if ($("profileBox") && user) {
    $("profileBox").innerHTML = `
      <p class="fs-5"><strong>Name:</strong> ${escapeHtml(user.name)}</p>
      <p class="fs-5"><strong>Email:</strong> ${escapeHtml(user.email)}</p>
    `;
  }

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

      const updated = { ...user, name: newName, email: newEmail };
      if (newPassword) updated.password = newPassword;

      localStorage.setItem("traveloraUser", JSON.stringify(updated));
      localStorage.setItem("loggedInUser", JSON.stringify(updated));

      alert("Profile updated!");
      $("profilePassword").value = "";

      if (navUserName) navUserName.textContent = newName;
      if (userInfo)
        userInfo.innerHTML = `Welcome, <strong>${escapeHtml(
          newName
        )}</strong> 👋`;
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

      localStorage.setItem(
        "traveloraUser",
        JSON.stringify({ name, email, password })
      );
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

      const saved = JSON.parse(localStorage.getItem("traveloraUser"));
      if (!saved || saved.email !== email || saved.password !== password) {
        alert("Invalid email or password!");
        return;
      }

      localStorage.setItem("loggedInUser", JSON.stringify(saved));
      window.location.href = "index.html";
    });
  }

  const bookingForm = $("bookingForm");
  if (bookingForm) {
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
      const opt = destEl.options[destEl.selectedIndex];
      basePriceEl.value = opt?.dataset.price || "";
    };

    const updateTotal = () => {
      const base = parseFloat(basePriceEl?.value) || 0;
      const travelers = parseInt(travelersEl?.value) || 1;
      const days = calcDays(startEl?.value, endEl?.value) || 1;
      const total = base * travelers * days;

      if (totalEl) {
        safeText(
          totalEl,
          `$${total.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        );
      }
    };

    const addOneDay = (dateStr) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    };

    const fixEndDate = () => {
      if (!startEl?.value || !endEl) return;
      const start = new Date(startEl.value);
      const end = new Date(endEl.value);
      if (isNaN(end) || end <= start) {
        endEl.value = addOneDay(startEl.value);
      }
    };

    updateBasePrice();
    fixEndDate();
    updateTotal();

    destEl?.addEventListener("change", () => {
      updateBasePrice();
      updateTotal();
    });
    startEl?.addEventListener("change", () => {
      fixEndDate();
      updateTotal();
    });
    endEl?.addEventListener("change", () => {
      fixEndDate();
      updateTotal();
    });
    travelersEl?.addEventListener("input", updateTotal);

    bookingForm.addEventListener("submit", (e) => {
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
      ) {
        return alert("Please fill all fields.");
      }
      if (!isEmail(booking.email)) return alert("Invalid email.");
      if (!isDigits(booking.phone)) return alert("Phone must be digits only.");

      const days = calcDays(booking.startDate, booking.endDate);
      if (days <= 0) return alert("End date must be after start date.");

      booking.days = days;
      booking.totalCost = booking.basePrice * booking.travelers * days;

      const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
      bookings.push(booking);
      localStorage.setItem("bookings", JSON.stringify(bookings));
      localStorage.setItem("latestBooking", JSON.stringify(booking));

      window.location.href = "confirmation.html";
    });
  }

  if (window.location.pathname.includes("confirmation.html")) {
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
        doc.text("Travelora Booking Receipt", 20, 25);
        doc.setFontSize(12);
        let y = 45;
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
    const renderBookings = () => {
      let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
      if (bookings.length === 0) {
        bookingsList.innerHTML = `<p class="text-muted">No bookings found.</p>`;
        if (clearAllBtn) clearAllBtn.disabled = true;
        return;
      }
      if (clearAllBtn) clearAllBtn.disabled = false;

      bookingsList.innerHTML = "";
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
          doc.save(`Travelora_Receipt_${b.id || i}.pdf`);
        });

        bookingsList.appendChild(card);
      });
    };

    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", () => {
        if (confirm("Delete all bookings?")) {
          localStorage.removeItem("bookings");
          renderBookings();
        }
      });
    }

    renderBookings();
  }
});
