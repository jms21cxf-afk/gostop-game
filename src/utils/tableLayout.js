function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 바닥 카드 배치 — 가운데 더미 주변으로 넓게 퍼뜨림 */
export function getTableCardLayout(cards) {
  if (!cards.length) return [];

  const sorted = [...cards].sort((a, b) => a.month - b.month || a.id.localeCompare(b.id));
  const count = sorted.length;

  return sorted.map((card, i) => {
    const h = hashId(card.id);
    const angle = ((i / count) * Math.PI * 2) - Math.PI / 2 + ((h % 15) - 7) * (Math.PI / 180);
    const radiusBase = count <= 4 ? 105 : count <= 6 ? 125 : 145;
    const radius = radiusBase + (h % 20);

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * (radius * 0.72);
    const rot = (h % 22) - 11;

    return {
      card,
      style: {
        '--tx': `${x}px`,
        '--ty': `${y}px`,
        '--rot': `${rot}deg`,
        zIndex: 10 + i,
      },
    };
  });
}

export function getTableCardOffset(cardId, cards) {
  const layout = getTableCardLayout(cards);
  const found = layout.find((l) => l.card.id === cardId);
  return found?.style || { '--tx': '0px', '--ty': '0px', '--rot': '0deg' };
}
