import { CARD_IMAGES, getCardImagePath, getCardFallbackPath } from './cardImages';

// 한국 일반 2인 고스톱(맞고) 기준 화투 48장
export const MONTHS = [
  { num: 1, name: '송학' },
  { num: 2, name: '매화' },
  { num: 3, name: '벚꽃' },
  { num: 4, name: '흑싸리' },
  { num: 5, name: '난' },
  { num: 6, name: '모란' },
  { num: 7, name: '싸리' },
  { num: 8, name: '공산' },
  { num: 9, name: '국화' },
  { num: 10, name: '단풍' },
  { num: 11, name: '오동' },
  { num: 12, name: '비·제비' },
];

export const DEAL_RULES = { table: 8, hand: 10, stock: 20 };

/** Wikimedia 파일명 → 광/엽/띠/피 (Kasu=피, Tane=엽, Tanzaku=띠, Hikari=광) */
const TYPE_OVERRIDES = {
  4: 'kwang',  // 2월 Tane = 매화광
  41: 'tti',   // 11월 Kasu_1 = 띠 (Tanzaku 파일 없음)
};

export function resolveTypeFromImage(imageIndex) {
  if (TYPE_OVERRIDES[imageIndex]) return TYPE_OVERRIDES[imageIndex];
  const name = CARD_IMAGES[imageIndex] || '';
  if (name.includes('Hikari')) return 'kwang';
  if (name.includes('Tane')) return 'yul';
  if (name.includes('Tanzaku')) return 'tti';
  return 'pi';
}

// imageIndex = CARD_IMAGES 배열 인덱스, type은 createDeck에서 resolveTypeFromImage로 결정
const CARD_DEFS = [
  // 1월 Hikari, Tanzaku, Kasu, Kasu
  { month: 1, label: '송학', isRain: false, imageIndex: 0 },
  { month: 1, label: '홍단', ribbon: 'hong', imageIndex: 1 },
  { month: 1, label: '피', piValue: 1, imageIndex: 2 },
  { month: 1, label: '피', piValue: 1, imageIndex: 3 },

  // 2월 Tane(광), Tanzaku, Kasu, Kasu
  { month: 2, label: '매화', isBird: true, imageIndex: 4 },
  { month: 2, label: '홍단', ribbon: 'hong', imageIndex: 5 },
  { month: 2, label: '피', piValue: 1, imageIndex: 6 },
  { month: 2, label: '피', piValue: 1, imageIndex: 7 },

  // 3월
  { month: 3, label: '벚꽃', isRain: false, imageIndex: 8 },
  { month: 3, label: '홍단', ribbon: 'hong', imageIndex: 9 },
  { month: 3, label: '피', piValue: 1, imageIndex: 10 },
  { month: 3, label: '피', piValue: 1, imageIndex: 11 },

  // 4월 Tane, Tanzaku, Kasu, Kasu
  { month: 4, label: '뻐꼬기', isBird: true, imageIndex: 12 },
  { month: 4, label: '초단', ribbon: 'cho', imageIndex: 13 },
  { month: 4, label: '피', piValue: 1, imageIndex: 14 },
  { month: 4, label: '피', piValue: 1, imageIndex: 15 },

  // 5월
  { month: 5, label: '다리', imageIndex: 16 },
  { month: 5, label: '초단', ribbon: 'cho', imageIndex: 17 },
  { month: 5, label: '피', piValue: 1, imageIndex: 18 },
  { month: 5, label: '피', piValue: 1, imageIndex: 19 },

  // 6월
  { month: 6, label: '나비', imageIndex: 20 },
  { month: 6, label: '띠', ribbon: 'hong', imageIndex: 21 },
  { month: 6, label: '피', piValue: 1, imageIndex: 22 },
  { month: 6, label: '피', piValue: 1, imageIndex: 23 },

  // 7월
  { month: 7, label: '멧돼지', imageIndex: 24 },
  { month: 7, label: '초단', ribbon: 'cho', imageIndex: 25 },
  { month: 7, label: '피', piValue: 1, imageIndex: 26 },
  { month: 7, label: '피', piValue: 1, imageIndex: 27 },

  // 8월 Hikari, Tane, Kasu, Kasu — 띠 그림 없음
  { month: 8, label: '공산', isRain: false, imageIndex: 28 },
  { month: 8, label: '기러기', isBird: true, imageIndex: 29 },
  { month: 8, label: '피', piValue: 1, imageIndex: 30 },
  { month: 8, label: '피', piValue: 1, imageIndex: 31 },

  // 9월
  { month: 9, label: '국화', imageIndex: 32, dualYulPi: true },
  { month: 9, label: '청단', ribbon: 'cheong', imageIndex: 33 },
  { month: 9, label: '피', piValue: 1, imageIndex: 34 },
  { month: 9, label: '피', piValue: 1, imageIndex: 35 },

  // 10월
  { month: 10, label: '사슴', imageIndex: 36 },
  { month: 10, label: '청단', ribbon: 'cheong', imageIndex: 37 },
  { month: 10, label: '피', piValue: 1, imageIndex: 38 },
  { month: 10, label: '피', piValue: 1, imageIndex: 39 },

  // 11월 Hikari, Kasu×3
  { month: 11, label: '비', isRain: true, imageIndex: 40 },
  { month: 11, label: '비단', ribbon: 'plain', imageIndex: 41 },
  { month: 11, label: '쌍피', piValue: 2, imageIndex: 42 },
  { month: 11, label: '피', piValue: 1, imageIndex: 43 },

  // 12월 Tane, Tanzaku, Kasu, Hikari(12광)
  { month: 12, label: '제비', isBird: true, imageIndex: 44 },
  { month: 12, label: '비단', ribbon: 'plain', imageIndex: 45 },
  { month: 12, label: '피', piValue: 1, imageIndex: 46 },
  { month: 12, label: '광', isRain: false, imageIndex: 47 },
];

/** 9·11·12월 — 피 칸에 있을 때 점수·집계 2장분 */
export function getPiScoringValue(card) {
  if (card?.type !== 'pi') return 0;
  const idx = card.imageIndex ?? (() => {
    const n = parseInt(String(card.id || '').replace('card-', ''), 10);
    return n >= 0 && n < CARD_DEFS.length ? CARD_DEFS[n].imageIndex : null;
  })();
  if (idx === 32 && card.dualYulPi) return 2;
  if (idx === 42) return 2;
  return card.piValue ?? 1;
}

export function createDeck() {
  return CARD_DEFS.map((def, index) => {
    const type = resolveTypeFromImage(def.imageIndex);
    return {
      id: `card-${index}`,
      image: getCardImagePath(def.imageIndex),
      fallback: getCardFallbackPath(def.imageIndex),
      type,
      piValue: type === 'pi' ? (def.piValue ?? 1) : undefined,
      dualYulPi: def.dualYulPi ?? false,
      dualPending: false,
      ...def,
    };
  });
}

export function isDualYulPiCard(card) {
  return Boolean(card?.dualYulPi);
}

/** 9월 국화 — 엽 또는 피로 분류 */
export function applyCaptureType(card, asType) {
  if (!isDualYulPiCard(card)) return card;
  if (asType === 'pi') {
    return { ...card, type: 'pi', piValue: 2, dualPending: false, dualYulPi: true };
  }
  return { ...card, type: 'yul', piValue: undefined, dualPending: false, dualYulPi: true };
}

export function cardsForScoring(captured) {
  return (captured || []).map((c) => {
    if (c.dualPending && isDualYulPiCard(c)) {
      return { ...c, type: 'yul', piValue: undefined };
    }
    return c;
  });
}

export function getMonthInfo(month) {
  return MONTHS.find((m) => m.num === month);
}

export function sortHand(cards) {
  return [...cards].sort((a, b) => a.month - b.month);
}

/** 먹은 패 배열 순서(먹은 순) 유지 */
export function groupCapturedByType(captured) {
  const list = captured || [];
  return {
    kwang: list.filter((c) => c.type === 'kwang'),
    yul: list.filter((c) => c.type === 'yul'),
    tti: list.filter((c) => c.type === 'tti'),
    pi: list.filter((c) => c.type === 'pi'),
  };
}

/** 저장된 게임 등 예전 type 필드 보정 */
export function normalizeCard(card) {
  if (!card) return card;
  const idx = card.id?.startsWith('card-') ? parseInt(card.id.replace('card-', ''), 10) : -1;
  if (idx >= 0 && idx < CARD_DEFS.length) {
    return { ...createDeck()[idx] };
  }
  if (card.imageIndex != null) {
    const type = resolveTypeFromImage(card.imageIndex);
    return { ...card, type, piValue: type === 'pi' ? (card.piValue ?? 1) : undefined };
  }
  return card;
}

export function normalizeCards(cards) {
  return (cards || []).map(normalizeCard);
}

export function normalizeGameState(state) {
  if (!state) return null;
  const players = (state.players || []).map((p) => ({
    ...p,
    hand: normalizeCards(p?.hand),
    captured: normalizeCards(p?.captured),
    name: p?.name ?? '플레이어',
    score: p?.score ?? 0,
    totalScore: p?.totalScore ?? 0,
    goCount: p?.goCount ?? 0,
  }));
  if (players.length < 2) return null;
  return {
    ...state,
    table: normalizeCards(state.table),
    stock: normalizeCards(state.stock),
    pendingCard: state.pendingCard ? normalizeCard(state.pendingCard) : null,
    matchCandidates: normalizeCards(state.matchCandidates),
    players,
  };
}
