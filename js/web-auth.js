window.__REDVITAL_API_AUTH = true;
import { apiFetch, apiJson } from "./api.js?v=api-auth-v1";
import {
  activeUser,
  clearCurrentUser,
  loadCurrentUser,
  login,
  logout,
  requireAuth,
} from "./auth.js";
import { showFormMessage, showMessage } from "./ui.js";
import {
  clean,
  formatPersonName,
  validEmail,
  validPassword,
  validPhone,
  values,
  validate,
} from "./validation.js";
import { initAdminApi } from "./admin-api.js?v=admin-api-v1";
import {
  attachCityAutocomplete,
  attachProvinceAutocomplete,
} from "./cities.js";

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const page = document.body.dataset.page;
const splitBlood = (value) => ({
  bloodType: value.replace(/[+-]/, ""),
  rh: value.includes("+") ? "+" : "-",
});
const setBusy = (button, busy) => {
  if (!button) return;
  if (busy) {
    button.dataset.defaultLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Procesando…";
  } else {
    button.disabled = false;
    button.textContent = button.dataset.defaultLabel || button.textContent;
  }
};
const initPasswordToggles = () => {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      button.textContent = visible ? "Ocultar" : "Mostrar";
      button.setAttribute("aria-pressed", String(visible));
    });
  });
};
const messageFor = (error) => {
  if (error?.status === 400) return "Revisá los datos ingresados.";
  if (error?.status === 401) return "Revisá tu correo y contraseña.";
  if (error?.status === 403)
    return "No tenés permiso para realizar esa acción.";
  if (error?.status === 409)
    return "Ya existe una cuenta registrada con ese correo electrónico.";
  if (error?.status >= 500)
    return "No pudimos crear la cuenta en este momento. Intentá nuevamente.";
  if (error instanceof TypeError || error?.message === "Failed to fetch")
    return "No pudimos conectar con RedVital. Intentá nuevamente.";
  return "No pudimos completar la operación. Intentá nuevamente.";
};
const registerDebug = () => {};
const buildRegisterPayload = (value, blood) => ({
  firstName: clean(value.firstName),
  lastName: clean(value.lastName),
  email: clean(value.email).toLowerCase(),
  password: value.password,
  phone: clean(value.phone),
  bloodType: blood.bloodType,
  rhFactor: blood.rh,
  city: clean(value.city),
  role: value.role,
  available:
    (value.role === "donor" || value.role === "patient") &&
    value.available === "on",
});
const initRegisterFields = (form) => {
  const firstName = form.elements.firstName;
  const lastName = form.elements.lastName;
  const normalizeNames = () =>
    [firstName, lastName].filter(Boolean).forEach((input) => {
      input.value = formatPersonName(input.value);
    });
  [firstName, lastName].filter(Boolean).forEach((input) =>
    input.addEventListener("blur", () => {
      input.value = formatPersonName(input.value);
    }),
  );
  const city = form.elements.city;
  const cityField = city.closest(".field");
  const provinceField = document.createElement("div");
  provinceField.className = "field";
  provinceField.innerHTML =
    '<label for="province">Provincia</label><div class="city-autocomplete"><input id="province" name="province" type="text" autocomplete="off" aria-controls="province-suggestions"><div id="province-suggestions" class="city-suggestions" role="listbox" hidden></div></div><span class="field-error" data-error="province"></span>';
  cityField.before(provinceField);
  const province = provinceField.querySelector("#province");
  const cityAutocomplete = attachCityAutocomplete(
    city,
    city.closest(".city-autocomplete")?.querySelector(".city-suggestions"),
    { province: () => province.value },
  );
  const provinceAutocomplete = attachProvinceAutocomplete(
    province,
    provinceField.querySelector(".city-suggestions"),
    {
      onSelect: () => cityAutocomplete.clear(),
      onInput: () => cityAutocomplete.clear(),
    },
  );
  const donorFields = $("#donor-fields");
  const available = form.elements.available;
  const availabilityError = document.createElement("span");
  availabilityError.className = "field-error";
  availabilityError.dataset.error = "available";
  donorFields.append(availabilityError);
  const syncParticipation = () => {
    const role = form.elements.role.value;
    donorFields.hidden = role !== "donor" && role !== "patient";
    donorFields.classList.toggle("hidden", donorFields.hidden);
    available.checked = false;
    availabilityError.textContent = "";
    donorFields.querySelector(".availability-copy strong").textContent =
      role === "patient" ? "Quiero recibir donaciones" : "Quiero donar";
  };
  form
    .querySelectorAll('input[name="role"]')
    .forEach((input) => input.addEventListener("change", syncParticipation));
  syncParticipation();
  return {
    normalizeNames,
    provinceAutocomplete,
    cityAutocomplete,
    availabilityError,
  };
};
const recordRegisterFailure = (stage, error, status) => {
  console.error("[register] failure stage:", stage, error);
};

async function registerPage() {
  const form = $("#register-form");
  if (!form) return;
  const submit = form.querySelector("[type=submit]");
  const fields = initRegisterFields(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    let stage = "submit";
    registerDebug("[register] submit");
    const value = values(form);
    const errors = {
      firstName: (x) => (clean(x) ? "" : "Ingresá tu nombre."),
      lastName: (x) => (clean(x) ? "" : "Ingresá tu apellido."),
      email: (x) => (validEmail(x) ? "" : "Ingresá un email válido."),
      phone: (x) => (validPhone(x) ? "" : "Ingresá un teléfono válido."),
      password: (x) =>
        validPassword(x) ? "" : "Usá 8 caracteres, una mayúscula y un número.",
      confirm: (x) =>
        x === value.password ? "" : "Las contraseñas no coinciden.",
      role: (x) => (x ? "" : "Elegí un rol."),
      bloodType: (x) => (x ? "" : "Seleccioná tu grupo sanguíneo."),
    };
    errors.province = () =>
      fields.provinceAutocomplete.isValid()
        ? ""
        : "Seleccioná una provincia válida de las sugerencias.";
    errors.city = () =>
      fields.cityAutocomplete.isValid()
        ? ""
        : "Seleccioná una localidad válida de las sugerencias.";
    errors.available = () =>
      form.elements.available.checked
        ? ""
        : form.elements.role.value === "patient"
          ? "Debés confirmar que querés recibir donaciones para continuar."
          : "Debés confirmar que querés donar para continuar.";
    fields.normalizeNames();
    if (!validate(form, errors)) return;
    stage = "payload";
    const blood = splitBlood(value.bloodType);
    const payload = buildRegisterPayload(value, blood);
    registerDebug("[register] payload ready", {
      ...payload,
      password: "[redacted]",
    });
    setBusy(submit, true);
    let result;
    try {
      stage = "fetch";
      registerDebug("[register] request started");
      result = await apiJson("/auth/register", "POST", payload);
      stage = "response";
      registerDebug("[register] response received");
      registerDebug("[register] status", result.response.status);
      stage = "parse";
      registerDebug("[register] body parsed", {
        id: result.data?.id,
        email: result.data?.email,
        role: result.data?.role,
        status: result.data?.status,
      });
    } catch (error) {
      recordRegisterFailure(stage, error, result?.response?.status);
      showFormMessage("No se pudo crear la cuenta", messageFor(error), "error");
      setBusy(submit, false);
      return;
    }
    try {
      stage = "toast";
      registerDebug("[register] success handler start");
      showFormMessage(
        "Cuenta creada correctamente",
        "Ya podés iniciar sesión.",
        "success",
      );
      stage = "form-reset";
      form.reset();
      stage = "redirect";
      setTimeout(() => {
        location.href = "login.html";
      }, 1600);
      registerDebug("[register] success handler end");
    } catch (error) {
      recordRegisterFailure(stage, error, result?.response?.status);
      showFormMessage(
        "No se pudo completar la confirmación",
        "La cuenta fue creada, pero no pudimos mostrar la confirmación. Podés iniciar sesión.",
        "error",
      );
    } finally {
      setBusy(submit, false);
    }
  });
}

async function loginPage() {
  const form = $("#login-form");
  if (!form) return;
  const submit = form.querySelector("[type=submit]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = values(form);
    if (!validEmail(value.email) || !value.password)
      return showFormMessage(
        "No pudimos iniciar sesión",
        "Revisá tu email y contraseña e intentá nuevamente.",
        "error",
      );
    setBusy(submit, true);
    try {
      clearCurrentUser();
      const authenticatedUser = await login(clean(value.email), value.password);
      showFormMessage(
        "Inicio de sesión exitoso",
        "Bienvenido/a a RedVital.",
        "success",
      );
      setTimeout(() => {
        location.href =
          authenticatedUser?.role === "admin" ? "admin.html" : "panel.html";
      }, 700);
    } catch (error) {
      showFormMessage("No pudimos iniciar sesión", messageFor(error), "error");
    } finally {
      setBusy(submit, false);
    }
  });
}

async function profilePage() {
  const user = await requireAuth();
  if (!user) return;
  const form = $("#profile-form");
  if (!form) return;
  try {
    const profile = (await apiFetch("/users/me/profile")).data;
    const data = {
      ...profile,
      email: user.email,
      bloodType: `${profile.bloodType}${profile.rhFactor}`,
    };
    ["firstName", "lastName", "email", "phone", "bloodType", "city"].forEach(
      (key) => {
        if (form.elements[key]) form.elements[key].value = data[key] || "";
      },
    );
    const availability = $(".profile-availability-checkbox");
    if (availability) {
      const participationLabel = $(".profile-availability-copy strong");
      const participationHelp = $(".profile-availability-copy .help");
      $("#availability-field").hidden = false;
      participationLabel.textContent =
        user.role === "donor"
          ? "Disponible para donar"
          : "Dispuesto a recibir donaciones";
      participationHelp.textContent =
        user.role === "donor"
          ? "Tu disponibilidad informa tu intención actual de donar. La aptitud definitiva debe ser evaluada por el centro de salud."
          : "La solicitud y la donación deben coordinarse con el centro de salud correspondiente.";
      availability.checked = profile.available;
    }
    const summary = $("#profile-summary");
    if (summary)
      summary
        .querySelector("h1")
        ?.replaceChildren(
          document.createTextNode(`${profile.firstName} ${profile.lastName}`),
        );
  } catch (error) {
    showMessage(messageFor(error), "error");
    return;
  }
  const submit = form.querySelector("[type=submit]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = values(form);
    value.firstName = formatPersonName(value.firstName);
    value.lastName = formatPersonName(value.lastName);
    const blood = splitBlood(value.bloodType);
    setBusy(submit, true);
    try {
      const updated = (
        await apiJson("/users/me/profile", "PATCH", {
          firstName: clean(value.firstName),
          lastName: clean(value.lastName),
          phone: clean(value.phone),
          bloodType: blood.bloodType,
          rhFactor: blood.rh,
          city: clean(value.city),
        })
      ).data;
      if (user.role === "donor" || user.role === "patient")
        await apiJson("/users/me/availability", "PATCH", {
          available: Boolean(form.elements.available?.checked),
        });
      showMessage("Perfil actualizado correctamente.", "success");
      form.elements.city.value = updated.city;
    } catch (error) {
      showMessage(messageFor(error), "error");
    } finally {
      setBusy(submit, false);
    }
  });
  $(".profile-availability-checkbox")?.addEventListener(
    "change",
    async (event) => {
      try {
        await apiJson("/users/me/availability", "PATCH", {
          available: event.target.checked,
        });
      } catch (error) {
        event.target.checked = !event.target.checked;
        showMessage(messageFor(error), "error");
      }
    },
  );
}

async function panelPage() {
  const user = await requireAuth();
  if (!user) return;
  const welcome = $("#welcome");
  if (welcome) welcome.textContent = "Hola";
  const role = $("#role-label");
  if (role)
    role.textContent =
      user.role === "donor" ? "DONANTE" : "PACIENTE / RESPONSABLE";
  const content = $("#dashboard-content");
  if (content)
    content.innerHTML =
      user.role === "donor"
        ? '<article class="card donor-availability"><div class="donor-availability-copy"><span class="dashboard-icon" aria-hidden="true">✓</span><div><span class="eyebrow">Participación</span><h2>Consultá tu disponibilidad en tu perfil</h2><p>Las solicitudes siguen funcionando con el flujo local actual.</p></div></div><a class="btn btn-outline" href="perfil.html">Mi perfil</a></article>'
        : '<article class="card patient-cta"><div><h2>Mis solicitudes</h2><p>Las solicitudes continúan utilizando el almacenamiento local actual.</p></div><a class="btn btn-primary" href="mis-solicitudes.html">Ver solicitudes</a></article>';
}
async function recovery() {
  const dialog = $("#recovery-dialog"),
    open = $("#forgot-password");
  if (!dialog || !open) return;
  const emailForm = $("#recovery-email-form"),
    emailMessage = $("#recovery-email-message"),
    passwordForm = $("#recovery-password-form"),
    passwordMessage = $("#recovery-password-message"),
    emailStep = $("#recovery-email-step"),
    passwordStep = $("#recovery-password-step");
  const token = new URLSearchParams(location.search).get("token");
  open.addEventListener("click", () => dialog.showModal());
  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = clean(emailForm.elements.email.value).toLowerCase();
    if (!validEmail(email)) {
      emailMessage.textContent = "Ingresá un email válido.";
      return;
    }
    try {
      await apiJson("/auth/forgot-password", "POST", { email });
      emailMessage.textContent =
        "Si la cuenta existe, recibirás instrucciones para recuperar el acceso.";
    } catch (error) {
      emailMessage.textContent = messageFor(error);
    }
  });
  if (token) {
    emailStep.hidden = true;
    passwordStep.hidden = false;
    dialog.showModal();
  }
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!token) {
      passwordMessage.textContent =
        "Abrí el enlace recibido por email para cambiar tu contraseña.";
      return;
    }
    const value = values(passwordForm);
    if (!validPassword(value.password) || value.password !== value.confirm) {
      passwordMessage.textContent = "Revisá la contraseña y su confirmación.";
      return;
    }
    try {
      await apiJson("/auth/reset-password", "POST", {
        token,
        password: value.password,
      });
      dialog.close();
      showFormMessage(
        "Contraseña actualizada",
        "Ya podés iniciar sesión con tu nueva contraseña.",
        "success",
      );
    } catch (error) {
      passwordMessage.textContent = messageFor(error);
    }
  });
}

async function renderApiPanel() {
  const user = await requireAuth();
  if (!user) return;
  const profile = (await apiFetch("/users/me/profile")).data;
  const firstName = formatPersonName(String(profile?.firstName || "").trim());
  const lastName = formatPersonName(String(profile?.lastName || "").trim());
  const welcome = $("#welcome");
  if (welcome)
    welcome.textContent = `Hola, ${[firstName, lastName].filter(Boolean).join(" ") || "Hola"}`;
  $("#role-label").textContent =
    user.role === "donor" ? "DONANTE" : "PACIENTE / RESPONSABLE";
  $("#dashboard-kicker").textContent =
    user.role === "donor"
      ? "TU ESPACIO DE DONACIÓN"
      : "TU ESPACIO DE SOLICITUDES";
  $("#dashboard-description").textContent =
    user.role === "donor"
      ? "Encontrá solicitudes compatibles y mantené actualizada tu disponibilidad para ayudar."
      : "Creá, administrá y seguí el estado de tus solicitudes de sangre.";
  const content = $("#dashboard-content");
  if (!content) return;
  if (user.role === "donor") {
    content.innerHTML =
      '<article class="card donor-availability"><div class="donor-availability-copy"><span class="dashboard-icon" aria-hidden="true">✓</span><div><span class="eyebrow">Disponibilidad</span><h2>Consultá tu disponibilidad en tu perfil</h2><p>La disponibilidad se administra desde tu perfil.</p></div></div><a class="btn btn-outline" href="perfil.html">Mi perfil</a></article>';
    return;
  }
  const blood =
    `${profile?.bloodType || ""}${profile?.rhFactor || ""}` || "No disponible";
  const participation = profile?.available
    ? "Dispuesto a recibir donaciones"
    : "Recepción de donaciones desactivada";
  content.innerHTML = `<section class="dashboard-section profile-summary"><div class="dashboard-head"><div><span class="eyebrow">Tu perfil</span><h2>Resumen de tu información</h2></div><a class="btn btn-outline" href="perfil.html">Ver mi perfil</a></div><div class="patient-summary"><article class="card dashboard-stat"><span>Grupo sanguíneo</span><strong>${blood}</strong></article><article class="card dashboard-stat"><span>Localidad</span><strong>${profile?.city || "No disponible"}</strong></article><article class="card dashboard-stat"><span>Participación</span><strong>${participation}</strong></article><article class="card dashboard-stat"><span>Email</span><strong>${user.email}</strong></article></div></section><article class="card patient-cta"><div><h2>Mis solicitudes</h2><p>Creá, administrá y seguí el estado de tus solicitudes de sangre.</p></div><a class="btn btn-primary" href="mis-solicitudes.html">Ver mis solicitudes</a></article>`;
}

export async function initWebApiAuth() {
  if (window.__REDVITAL_API_AUTH_INITIALIZED) return;
  window.__REDVITAL_API_AUTH_INITIALIZED = true;
  initPasswordToggles();
  window.__REDVITAL_API_AUTH = true;
  await registerPage();
  await loginPage();
  await recovery();
  if (page === "panel") await renderApiPanel();
  if (page === "perfil") await profilePage();
}
queueMicrotask(() => initWebApiAuth());
queueMicrotask(() => {
  if (page === "admin-api") initAdminApi();
});
