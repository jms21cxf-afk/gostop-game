// 고스톱 점수(족보) 계산

import { findChongtongMonths } from './dealChecks';
import { cardsForScoring, getPiScoringValue } from '../data/cards';

export function calculateScore(captured) {
  const yaku = [];
  let total = 0;

  const scored = cardsForScoring(captured);
  const kwangs = scored.filter((c) => c.type === 'kwang');
  const yuls = scored.filter((c) => c.type === 'yul');
  const ttis = scored.filter((c) => c.type === 'tti');
  const pis = scored.filter((c) => c.type === 'pi');

  const kwangCount = kwangs.length;
  const hasRain = kwangs.some((k) => k.isRain);

  // 광 점수
  if (kwangCount === 5) {
    yaku.push({ name: '5광', points: 15 });
    total += 15;
  } else if (kwangCount === 4) {
    const pts = hasRain ? 4 : 4;
    yaku.push({ name: '4광', points: pts });
    total += pts;
  } else if (kwangCount === 3) {
    if (hasRain) {
      yaku.push({ name: '비3광', points: 2 });
      total += 2;
    } else {
      yaku.push({ name: '3광', points: 3 });
      total += 3;
    }
  }

  // 고도리 (새 3장: 2,4,8,12월 중 3장)
  const birds = scored.filter((c) => c.isBird);
  if (birds.length >= 3) {
    yaku.push({ name: '고도리', points: 5 });
    total += 5;
  }

  // 홍단 (6,7,10월)
  const hongdan = ttis.filter((t) => t.ribbon === 'hong');
  if (hongdan.length >= 3) {
    yaku.push({ name: '홍단', points: 3 });
    total += 3;
  }

  // 청단 (6,9,10월 띠 3장)
  const cheongdanMonths = [6, 9, 10];
  const hasCheongdan = cheongdanMonths.every((m) => ttis.some((t) => t.month === m));
  if (hasCheongdan) {
    yaku.push({ name: '청단', points: 3 });
    total += 3;
  }

  // 초단 (4,5,6월)
  const chodan = ttis.filter((t) => t.ribbon === 'cho');
  if (chodan.length >= 3) {
    yaku.push({ name: '초단', points: 3 });
    total += 3;
  }

  // 총통 (같은 달 4장 모두 먹음)
  const chongtong = findChongtongMonths(captured);
  if (chongtong.length > 0) {
    const pts = chongtong.length * 5;
    yaku.push({ name: `총통 ${chongtong.map((m) => `${m}월`).join(',')}`, points: pts });
    total += pts;
  }

  // 엽 (동물) - 5장 이상
  if (yuls.length >= 5) {
    const yulPts = yuls.length - 4;
    yaku.push({ name: `엽 ${yuls.length}장`, points: yulPts });
    total += yulPts;
  }

  // 띠 - 5장 이상
  if (ttis.length >= 5) {
    const ttiPts = ttis.length - 4;
    yaku.push({ name: `띠 ${ttis.length}장`, points: ttiPts });
    total += ttiPts;
  }

  // 피 - 10장 이상 (9·11·12월 쌍피는 2장분으로 계산)
  const piCount = pis.reduce((sum, p) => sum + getPiScoringValue(p), 0);
  if (piCount >= 10) {
    const piPts = piCount - 9;
    yaku.push({ name: `피 ${piCount}장`, points: piPts });
    total += piPts;
  }

  return { total, yaku, piCount, kwangCount };
}

export function canGoStop(score) {
  return score >= 3;
}
