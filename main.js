
"use strict";

/* Данные */
const DISHES = [
  { icon: "🥣", bg: "#fde9c9", name: "Овсянка с ягодами и орехами", kcal: 380, time: "Завтрак" },
  { icon: "🍳", bg: "#fff3b8", name: "Омлет со шпинатом и сыром", kcal: 340, time: "Завтрак" },
  { icon: "🥗", bg: "#d9efc0", name: "Боул с киноа и авокадо", kcal: 460, time: "Обед" },
  { icon: "🍲", bg: "#fad7c0", name: "Крем-суп из тыквы", kcal: 290, time: "Обед" },
  { icon: "🐟", bg: "#cfe8f3", name: "Лосось с овощами на гриле", kcal: 520, time: "Ужин" },
  { icon: "🍗", bg: "#f6e0c4", name: "Курица с бурым рисом", kcal: 490, time: "Ужин" },
];

const PLANS = [
  { id: "light",   name: "Лёгкий",  kcal: 1200, price: 690,  perks: ["3 приёма пищи в день", "Подходит для похудения", "Меню без глютена по запросу"] },
  { id: "balance", name: "Баланс",  kcal: 1800, price: 890,  perks: ["4 приёма пищи в день", "Поддержание веса", "Смена меню каждую неделю"], main: true },
  { id: "energy",  name: "Энергия", kcal: 2500, price: 1090, perks: ["5 приёмов пищи в день", "Набор мышечной массы", "Повышенное содержание белка"] },
];

const REVIEWS = [
  { text: "Через месяц ушло три килограмма, и я ни разу не думала, что приготовить на ужин.", author: "Мария, 29 лет" },
  { text: "Заказываю на всю неделю: курьер приезжает к семи утра, всё свежее и вкусное.", author: "Дмитрий, 34 года" },
  { text: "Нутрициолог подобрал меню под тренировки. Силы стало больше, готовить не нужно.", author: "Елена, 26 лет" },
  { text: "Пробовал разные сервисы. Здесь порции сытные, а доставка не опаздывает.", author: "Артём, 31 год" },
];

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const STORAGE_KEY = "nutrisite_orders";

/*  Вспомогательные функции  */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const formatPrice = (value) => value.toLocaleString("ru-RU") + " ₽";

/* секция данных*/
function renderMenu() {
  $("#menuList").innerHTML = DISHES.map((d) => `
    <article class="swiper-slide dish">
      <div class="dish__img" style="background:${d.bg}" aria-hidden="true">${d.icon}</div>
      <div class="dish__body">
        <h3>${d.name}</h3>
        <div class="dish__meta"><span>${d.time}</span><b>${d.kcal} ккал</b></div>
      </div>
    </article>`).join("");
}

function renderPlans() {
  $("#planList").innerHTML = PLANS.map((p) => `
    <article class="plan ${p.main ? "plan--main" : ""}">
      <h3>${p.name} · ${p.kcal} ккал</h3>
      <div class="plan__price">${formatPrice(p.price)} <small>/ день</small></div>
      <ul>${p.perks.map((perk) => `<li>${perk}</li>`).join("")}</ul>
      <button class="btn ${p.main ? "" : "btn--ghost"}" data-open-modal data-plan="${p.id}">Выбрать тариф</button>
    </article>`).join("");
}

function renderReviews() {
  $("#reviewList").innerHTML = REVIEWS.map((r) => `
    <blockquote class="swiper-slide review">
      <p>${r.text}</p>
      <footer>${r.author}</footer>
    </blockquote>`).join("");
}

/* свайпер */
function initSliders() {
  new Swiper(".menu-slider", {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: true,
    autoplay: { delay: 4000, disableOnInteraction: true, pauseOnMouseEnter: true },
    pagination: { el: ".menu-slider .swiper-pagination", clickable: true },
    navigation: { nextEl: ".menu-slider .swiper-button-next", prevEl: ".menu-slider .swiper-button-prev" },
    breakpoints: { 640: { slidesPerView: 2 }, 980: { slidesPerView: 3 } },
  });

  new Swiper(".reviews-slider", {
    slidesPerView: 1,
    spaceBetween: 24,
    pagination: { el: ".reviews-slider .swiper-pagination", clickable: true },
    breakpoints: { 760: { slidesPerView: 2 } },
  });
}

/* счетчики в hero*/
function initCounters() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    if (reduce) { el.textContent = target; return; }
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * progress);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/*модалка*/
const modal = $("#modal");
const form = $("#orderForm");
const success = $("#success");
let lastFocused = null;   // элемент, с которого открыли окно (для возврата фокуса)

function openModal(planId) {
  lastFocused = document.activeElement;
  form.hidden = false;
  success.hidden = true;
  if (planId) $("#planSelect").value = planId;
  updateTotal();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  $("input", form).focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

function initModal() {
  // Делегирование: открывают и кнопки из шапки, и динамически созданные карточки тарифов
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open-modal]");
    if (opener) openModal(opener.dataset.plan);
    if (e.target.closest("[data-close-modal]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}

/*Форма: поля, подсчёт цены*/
function buildFormControls() {
  $("#planSelect").innerHTML = PLANS.map(
    (p) => `<option value="${p.id}">${p.name} · ${p.kcal} ккал</option>`
  ).join("");

  $("#days").innerHTML = DAYS.map((d, i) => `
    <label class="day">
      <input type="checkbox" name="days" value="${i}" ${i < 5 ? "checked" : ""}>
      <span>${d}</span>
    </label>`).join("");
}

function updateTotal() {
  const plan = PLANS.find((p) => p.id === $("#planSelect").value);
  const daysCount = $$('input[name="days"]:checked', form).length;
  $("#total").textContent = formatPrice(plan.price * daysCount);
}

/*Валидация */
const VALIDATORS = {
  name:    (v) => (v.trim().length >= 2 ? "" : "Введите имя (минимум 2 символа)"),
  phone:   (v) => (/^\+?[\d\s()-]{10,18}$/.test(v.trim()) ? "" : "Введите телефон в формате +7 900 000-00-00"),
  email:   (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Введите корректную почту"),
  address: (v) => (v.trim().length >= 6 ? "" : "Укажите улицу и дом"),
};

function setError(field, message) {
  const wrapper = field.closest(".field");
  wrapper.classList.toggle("invalid", Boolean(message));
  $(".error", wrapper).textContent = message;
}

function validateForm() {
  let valid = true;
  for (const [name, check] of Object.entries(VALIDATORS)) {
    const input = form.elements[name];
    const message = check(input.value);
    setError(input, message);
    if (message) valid = false;
  }
  const daysChosen = $$('input[name="days"]:checked', form).length > 0;
  $("#days").closest(".field").querySelector(".error").textContent =
    daysChosen ? "" : "Выберите хотя бы один день доставки";
  return valid && daysChosen;
}

/* ---------- 9. Отправка (имитация, без сервера) ---------- */
function saveOrder(order) {
  try {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    orders.push(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.warn("Не удалось сохранить заказ:", err);
  }
}

function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const plan = PLANS.find((p) => p.id === form.elements.plan.value);
  const days = $$('input[name="days"]:checked', form).map((i) => DAYS[Number(i.value)]);

  saveOrder({
    name: form.elements.name.value.trim(),
    plan: plan.id,
    days,
    createdAt: new Date().toISOString(),
  });

  // textContent вместо innerHTML — пользовательский ввод не интерпретируется как HTML
  $("#successText").textContent =
    `${form.elements.name.value.trim()}, тариф «${plan.name}» оформлен. ` +
    `Доставка: ${days.join(", ")}. Сумма за неделю: ${$("#total").textContent}.`;

  form.hidden = true;
  success.hidden = false;
  form.reset();
  buildFormControls();
}

/* ---------- 10. Мобильное меню (бургер) ---------- */
function initBurger() {
  const burger = $("#burger");
  const nav = $("#nav");

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  };

  burger.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 860) setOpen(false); });
}

/* ---------- 11. Запуск ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initBurger();
  renderMenu();
  renderPlans();
  renderReviews();
  initSliders();
  initCounters();
  buildFormControls();
  initModal();
  form.addEventListener("change", updateTotal);
  form.addEventListener("submit", handleSubmit);
});