import { categories, formatPrice, salon } from "./data.js";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];
const bookingDialog = $("#booking-dialog");
const lookDialog = $("#look-dialog");
const serviceSelect = $("#booking-service");
const messageInput = $("#booking-message");
const mobileQuery = window.matchMedia("(max-width: 760px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let currentLook = "";
let lookTrigger = null;
let toastTimer;

// Shared contact configuration keeps every action pointing at the same salon.
$("#year").textContent = new Date().getFullYear();
$("#map-link").href = salon.map;
$("#vk-message-link").href = salon.vkMessages;

function renderServices(categoryId) {
  const category = categories.find(({ id }) => id === categoryId);
  if (!category) return;
  $("#category-description").textContent = category.description;
  $("#service-panel").setAttribute("aria-labelledby", `tab-${category.id}`);
  $("#service-list").replaceChildren(
    ...category.services.map((service) => {
      const row = document.createElement("article");
      row.className = "service-row";
      row.innerHTML = `<div><h3 class="service-name">${service.name}</h3><p class="service-detail">${service.detail}</p></div><div class="service-price">от ${formatPrice(service.price)} ₽<small>${service.time}</small></div><button class="service-book" data-book="${service.name}" aria-label="Записаться: ${service.name}"></button>`;
      return row;
    }),
  );
  $$('[role="tab"]').forEach((tab) => {
    const isSelected = tab.dataset.category === categoryId;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
  });
}

const tabList = $(".service-tabs");
tabList.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-category]");
  if (tab) renderServices(tab.dataset.category);
});
tabList.addEventListener("keydown", (event) => {
  const tabs = $$('[role="tab"]', tabList);
  const index = tabs.indexOf(document.activeElement);
  if (index < 0) return;
  let nextIndex;
  if (["ArrowRight", "ArrowDown"].includes(event.key))
    nextIndex = (index + 1) % tabs.length;
  if (["ArrowLeft", "ArrowUp"].includes(event.key))
    nextIndex = (index - 1 + tabs.length) % tabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;
  if (nextIndex === undefined) return;
  event.preventDefault();
  tabs[nextIndex].focus();
  renderServices(tabs[nextIndex].dataset.category);
});
function updateTabOrientation() {
  tabList.setAttribute(
    "aria-orientation",
    mobileQuery.matches ? "horizontal" : "vertical",
  );
}
mobileQuery.addEventListener("change", updateTabOrientation);
updateTabOrientation();
renderServices(categories[0].id);

// The browser opens the user's messaging app; no form data is sent to a server.
categories.forEach((category) => {
  const group = document.createElement("optgroup");
  group.label = category.label;
  category.services.forEach((service) => {
    const option = document.createElement("option");
    option.value = service.name;
    option.textContent = `${service.name} — от ${formatPrice(service.price)} ₽`;
    group.append(option);
  });
  serviceSelect.append(group);
});

function updateSmsLink() {
  const isAppleMobile =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const separator = isAppleMobile ? "&" : "?";
  $("#sms-link").href =
    `sms:${salon.phone}${separator}body=${encodeURIComponent(messageInput.value.trim())}`;
}

function updateMessage() {
  const service = serviceSelect.value;
  messageInput.value = service
    ? `Здравствуйте! Хочу записаться в «${salon.name}». Интересует: ${service.toLocaleLowerCase("ru-RU")}. Подскажите, пожалуйста, ближайшее свободное время.`
    : `Здравствуйте! Хочу записаться в «${salon.name}» и посоветоваться по выбору услуги. Подскажите, пожалуйста, удобное время.`;
  updateSmsLink();
}

function updateScrollLock() {
  document.body.classList.toggle("scroll-locked", Boolean($("dialog[open]")));
}

function openBooking(service = "") {
  closeMobileMenu();
  if (lookDialog.open) lookDialog.close();
  $$("[data-custom]", serviceSelect).forEach((option) => option.remove());
  if (service === "Помогите выбрать услугу") service = "";
  if (
    service &&
    ![...serviceSelect.options].some((option) => option.value === service)
  ) {
    const option = document.createElement("option");
    option.value = service;
    option.textContent = service;
    option.dataset.custom = "true";
    serviceSelect.append(option);
  }
  serviceSelect.value = service;
  updateMessage();
  if (!bookingDialog.open) bookingDialog.showModal();
  updateScrollLock();
}

serviceSelect.addEventListener("change", updateMessage);
messageInput.addEventListener("input", updateSmsLink);
$("#booking-form").addEventListener("submit", (event) =>
  event.preventDefault(),
);

document.addEventListener("click", (event) => {
  const bookingButton = event.target.closest("[data-book]");
  if (bookingButton) openBooking(bookingButton.dataset.book);
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) document.getElementById(closeButton.dataset.close).close();
});

// Only a complete pointer gesture on the backdrop dismisses the dialog.
$$("dialog").forEach((dialog) => {
  let startedOnBackdrop = false;
  function onBackdrop(event) {
    const rect = dialog.getBoundingClientRect();
    return (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    );
  }
  dialog.addEventListener("pointerdown", (event) => {
    startedOnBackdrop = onBackdrop(event);
  });
  dialog.addEventListener("click", (event) => {
    if (startedOnBackdrop && onBackdrop(event)) dialog.close();
    startedOnBackdrop = false;
  });
  dialog.addEventListener("close", () => {
    updateScrollLock();
    $("#toast").classList.remove("visible");
    document.body.append($("#toast"));
    if (dialog === bookingDialog && lookTrigger) {
      lookTrigger.focus({ preventScroll: true });
      lookTrigger = null;
    }
  });
});

function showToast(message) {
  const toast = $("#toast");
  ($("dialog[open]") || document.body).append(toast);
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3500);
}

$("#copy-message").addEventListener("click", async () => {
  const text = messageInput.value.trim();
  if (!text) {
    showToast("Сначала напишите сообщение.");
    messageInput.focus();
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Сообщение скопировано. Вставьте его в чат VK.");
  } catch {
    // Select the real editable field if clipboard access is unavailable.
    messageInput.focus();
    messageInput.select();
    showToast("Текст выделен. Скопируйте его через меню устройства.");
  }
});

$$("[data-look]").forEach((card) => {
  card.addEventListener("click", () => {
    currentLook = card.dataset.look;
    lookTrigger = card;
    $("#look-title").textContent = currentLook;
    $("#look-description").textContent = card.dataset.description;
    $("#look-dialog-image").src = `/images/${card.dataset.image}-640.webp`;
    $("#look-dialog-image").alt = $("img", card).alt;
    lookDialog.showModal();
    updateScrollLock();
  });
});
$("#book-look").addEventListener("click", () =>
  openBooking(`Образ «${currentLook}»`),
);
lookDialog.addEventListener("close", () => {
  // A booking opened from a look should eventually return focus to that card.
  if (!bookingDialog.open) lookTrigger = null;
});

const menuToggle = $(".menu-toggle");
const mobileMenu = $("#mobile-menu");
function closeMobileMenu({ returnFocus = false } = {}) {
  mobileMenu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Открыть меню");
  if (returnFocus) menuToggle.focus();
}
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  mobileMenu.hidden = open;
  menuToggle.setAttribute("aria-expanded", String(!open));
  menuToggle.setAttribute("aria-label", open ? "Открыть меню" : "Закрыть меню");
});
mobileMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMobileMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mobileMenu.hidden)
    closeMobileMenu({ returnFocus: true });
});
document.addEventListener("click", (event) => {
  if (!mobileMenu.hidden && !event.target.closest(".header")) closeMobileMenu();
});
window.matchMedia("(min-width: 951px)").addEventListener("change", (event) => {
  if (event.matches) closeMobileMenu();
});

// Content is visible by default. Motion is optional and never blocks navigation.
if ("IntersectionObserver" in window) {
  if (!reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    $$(".reveal").forEach((element) => {
      // Do not hide content already visible on a deep link or restored scroll.
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add("will-reveal");
        revealObserver.observe(element);
      }
    });
  }
  const bookingBarObserver = new IntersectionObserver(([entry]) => {
    $(".mobile-book-bar").classList.toggle(
      "is-visible",
      !entry.isIntersecting && entry.boundingClientRect.top < 0,
    );
  });
  bookingBarObserver.observe($(".hero-cta"));
}
