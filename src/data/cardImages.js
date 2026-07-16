// Wikimedia Commons SVG Hwatu (CCL, 상업 이용 가능)
// https://commons.wikimedia.org/wiki/Category:SVG_Hwatu

export const CARD_IMAGES = [
  // 1월
  'Hwatu_January_Hikari.svg',
  'Hwatu_January_Tanzaku.svg',
  'Hwatu_January_Kasu_1.svg',
  'Hwatu_January_Kasu_2.svg',
  // 2월
  'Hwatu_February_Tane.svg',
  'Hwatu_February_Tanzaku.svg',
  'Hwatu_February_Kasu_1.svg',
  'Hwatu_February_Kasu_2.svg',
  // 3월
  'Hwatu_March_Hikari.svg',
  'Hwatu_March_Tanzaku.svg',
  'Hwatu_March_Kasu_1.svg',
  'Hwatu_March_Kasu_2.svg',
  // 4월
  'Hwatu_April_Tane.svg',
  'Hwatu_April_Tanzaku.svg',
  'Hwatu_April_Kasu_1.svg',
  'Hwatu_April_Kasu_2.svg',
  // 5월
  'Hwatu_May_Tane.svg',
  'Hwatu_May_Tanzaku.svg',
  'Hwatu_May_Kasu_1.svg',
  'Hwatu_May_Kasu_2.svg',
  // 6월
  'Hwatu_June_Tane.svg',
  'Hwatu_June_Tanzaku.svg',
  'Hwatu_June_Kasu_1.svg',
  'Hwatu_June_Kasu_2.svg',
  // 7월
  'Hwatu_July_Tane.svg',
  'Hwatu_July_Tanzaku.svg',
  'Hwatu_July_Kasu_1.svg',
  'Hwatu_July_Kasu_2.svg',
  // 8월
  'Hwatu_August_Hikari.svg',
  'Hwatu_August_Tane.svg',
  'Hwatu_August_Kasu_1.svg',
  'Hwatu_August_Kasu_2.svg',
  // 9월
  'Hwatu_September_Tane.svg',
  'Hwatu_September_Tanzaku.svg',
  'Hwatu_September_Kasu_1.svg',
  'Hwatu_September_Kasu_2.svg',
  // 10월
  'Hwatu_October_Tane.svg',
  'Hwatu_October_Tanzaku.svg',
  'Hwatu_October_Kasu_1.svg',
  'Hwatu_October_Kasu_2.svg',
  // 11월
  'Hwatu_November_Hikari.svg',
  'Hwatu_November_Kasu_1.svg',
  'Hwatu_November_Kasu_2.svg',
  'Hwatu_November_Kasu_3.svg',
  // 12월
  'Hwatu_December_Tane.svg',
  'Hwatu_December_Tanzaku.svg',
  'Hwatu_December_Kasu.svg',
  'Hwatu_December_Hikari.svg',
];

export const CARD_BACK = 'card-back.svg';

export function getCardImagePath(index) {
  return `/cards/hwatu/${CARD_IMAGES[index]}`;
}

export function getCardFallbackPath(index) {
  return `/cards/hwatu/fallback-${String(index).padStart(2, '0')}.png`;
}

export function getCardBackPath() {
  return `/cards/hwatu/${CARD_BACK}`;
}
