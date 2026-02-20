"use strict";

const els = {
  form: document.getElementById("form"),
  banner: document.getElementById("banner"),
  submitBtn: document.getElementById("submitBtn"),

  name: document.getElementById("name"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  confirm: document.getElementById("confirm"),
  terms: document.getElementById("terms"),

  nameError: document.getElementById("nameError"),
  emailError: document.getElementById("emailError"),
  passwordError: document.getElementById("passwordError"),
  confirmError: document.getElementById("confirmError"),
  termsError: document.getElementById("termsError"),
};
const toggleButtons = document.querySelectorAll(".toggle-pass");

toggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);

    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";
    btn.textContent = isHidden ? "Hide" : "Show";
  });
});

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passRe = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  hideBanner();

  const ok = validateAll();
  if (!ok) return;

  // Simulate async submit
  setSubmitting(true);

  setTimeout(() => {
    setSubmitting(false);
    showBanner("Account created");
    els.form.reset();
    clearAllErrors();
  }, 700);
});

// Validate as user types (nice UX)
[els.name, els.email, els.password, els.confirm].forEach((input) => {
  input.addEventListener("input", () => {
    hideBanner();
    validateField(input);
    // confirm depends on password
    if (input === els.password) validateField(els.confirm);
  });
});

els.terms.addEventListener("change", () => {
  hideBanner();
  validateField(els.terms);
});

function validateAll() {
  const a = validateField(els.name);
  const b = validateField(els.email);
  const c = validateField(els.password);
  const d = validateField(els.confirm);
  const e = validateField(els.terms);
  return a && b && c && d && e;
}

function validateField(field) {
  const id = field.id;

  if (id === "name") {
    const v = field.value.trim();
    if (v.length < 2) return setError(field, els.nameError, "Name must be at least 2 characters.");
    return clearError(field, els.nameError);
  }

  if (id === "email") {
    const v = field.value.trim();
    if (!v) return setError(field, els.emailError, "Email is required.");
    if (!emailRe.test(v)) return setError(field, els.emailError, "Enter a valid email.");
    return clearError(field, els.emailError);
  }

  if (id === "password") {
    const v = field.value;
    if (!v) return setError(field, els.passwordError, "Password is required.");
    if (!passRe.test(v)) return setError(field, els.passwordError, "Use 8+ chars with at least 1 letter and 1 number.");
    return clearError(field, els.passwordError);
  }

  if (id === "confirm") {
    const v = field.value;
    if (!v) return setError(field, els.confirmError, "Please confirm your password.");
    if (v !== els.password.value) return setError(field, els.confirmError, "Passwords do not match.");
    return clearError(field, els.confirmError);
  }

  if (id === "terms") {
    if (!field.checked) return setError(field, els.termsError, "You must accept the Terms.");
    return clearError(field, els.termsError);
  }

  return true;
}

function setError(inputEl, errorEl, msg) {
  if (inputEl.type !== "checkbox") inputEl.classList.add("is-invalid");
  errorEl.textContent = msg;
  return false;
}

function clearError(inputEl, errorEl) {
  if (inputEl.type !== "checkbox") inputEl.classList.remove("is-invalid");
  errorEl.textContent = "";
  return true;
}

function clearAllErrors() {
  clearError(els.name, els.nameError);
  clearError(els.email, els.emailError);
  clearError(els.password, els.passwordError);
  clearError(els.confirm, els.confirmError);
  els.termsError.textContent = "";
}

function setSubmitting(isSubmitting) {
  els.submitBtn.disabled = isSubmitting;
  els.submitBtn.textContent = isSubmitting ? "Creating…" : "Create account";
}

function showBanner(text) {
  els.banner.hidden = false;
  els.banner.textContent = text;
}

function hideBanner() {
  els.banner.hidden = true;
  els.banner.textContent = "";
}
