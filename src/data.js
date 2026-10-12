/** All prices are indicative. Update this file after confirming the salon's price list. */
export const salon = {
  name: "Преображение",
  phone: "+79102664823",
  displayPhone: "+7 (910) 266-48-23",
  address: "село Плещеево, Луговая улица, 4Б",
  vkPage: "https://vk.ru/club242078993",
  vkMessages: "https://vk.me/club242078993",
  maxMessages: "https://max.ru/u/f9LHodD0cOJguaPi-o30SOBbFZKIRngXs4i7B2z9io7AYtnJjKc1JReePPQ",
  map:
    "https://yandex.ru/maps/?text=" +
    encodeURIComponent("село Плещеево, Луговая улица 4Б"),
};

export const categories = [
  {
    id: "haircuts",
    label: "Стрижки",
    description:
      "Форма, которая подходит именно вам. От лёгкого обновления до смелых перемен.",
    services: [
      {
        name: "Женская стрижка",
        detail: "Новая форма, лёгкость и ухоженные кончики",
        price: 900,
        time: "45–60 мин",
      },
      {
        name: "Мужская стрижка",
        detail: "Точные линии и внимание к деталям",
        price: 500,
        time: "30–45 мин",
      },
      {
        name: "Детская стрижка",
        detail: "Бережно и без спешки для маленьких гостей",
        price: 400,
        time: "30–40 мин",
      },
      {
        name: "Коррекция чёлки",
        detail: "Маленькая деталь, которая меняет всё",
        price: 250,
        time: "15–20 мин",
      },
    ],
  },
  {
    id: "color",
    label: "Окрашивание",
    description:
      "Глубина оттенка, мягкие переходы и цвет, который подчёркивает вашу индивидуальность.",
    services: [
      {
        name: "Окрашивание в один тон",
        detail: "Ровный цвет и выразительный блеск",
        price: 2000,
        time: "1,5–2 часа",
      },
      {
        name: "Окрашивание корней",
        detail: "Аккуратное обновление вашего оттенка",
        price: 1500,
        time: "1,5–2 часа",
      },
      {
        name: "Сложное окрашивание",
        detail: "Рельефные пряди и естественные переходы",
        price: 4500,
        time: "3–5 часов",
      },
      {
        name: "Тонирование",
        detail: "Освежить оттенок и придать цвету глубину",
        price: 1500,
        time: "60–90 мин",
      },
    ],
  },
  {
    id: "care",
    label: "Уход и укладка",
    description:
      "Больше мягкости, блеска и поводов полюбить свои волосы заново.",
    services: [
      {
        name: "Уход для волос",
        detail: "Подбираем уход под состояние и потребности волос",
        price: 1000,
        time: "30–60 мин",
      },
      {
        name: "Укладка",
        detail: "Естественный объём или гладкость на каждый день",
        price: 800,
        time: "30–45 мин",
      },
      {
        name: "Локоны",
        detail: "Мягкие волны для особенного настроения",
        price: 1200,
        time: "45–60 мин",
      },
      {
        name: "Вечерняя причёска",
        detail: "Продуманный образ для вашего события",
        price: 1800,
        time: "60–90 мин",
      },
    ],
  },
];

export const formatPrice = (price) =>
  new Intl.NumberFormat("ru-RU").format(price);
