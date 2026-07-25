import { useEffect, useState, useCallback } from 'react';
import Card from './Card';
import { getCardBackPath } from '../data/cardImages';
import { playSound } from '../utils/sounds';
import { useIsMobile } from '../hooks/useIsMobile';

const ZONES = {
  hand0: { x: 50, y: 84 },
  hand1: { x: 50, y: 12 },
  stock: { x: 50, y: 32 },
  table: { x: 50, y: 52 },
  pile: { x: 84, y: 56 },
  captured0: { x: 8, y: 50 },
  captured1: { x: 92, y: 50 },
};

const FLY_MS = 1600;
const FLY_TO_PILE_MS = 700;
const FLIP_AT_PILE_MS = 550;
const FLY_TO_DEST_MS = 700;
const PILE_DRAW_MS = 80;
const STAGGER_MS = 220;
const PPUNG_FLY_MS = 1800;

function isFlipStock(event) {
  return event?.type === 'flip_stock';
}

function isHandToTable(event) {
  return event?.type === 'play_hand' && event.to === 'table';
}

function getFlipDest(event) {
  return event.to === 'captured'
    ? ZONES[`captured${event.playerIdx}`]
    : ZONES.table;
}

export default function FlyingCardLayer({ event, onDone, onPileActive }) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [placePhase, setPlacePhase] = useState(null);

  const finish = useCallback(() => {
    setItems([]);
    setPlacePhase(null);
    onPileActive?.(false);
    onDone?.();
  }, [onDone, onPileActive]);

  useEffect(() => {
    if (!event) return undefined;
    if (!event.cards?.length) {
      onDone?.();
      return undefined;
    }

    // ② 덱 뒤집기 — 모바일: 오른쪽 덱에서 뒤집고 이동 / PC: 위 덱→더미→뒤집기→이동
    if (isFlipStock(event)) {
      const card = event.cards[0];
      const pile = ZONES.pile;
      const stock = ZONES.stock;
      const dest = getFlipDest(event);
      const matchExtras = event.to === 'captured' && event.cards.length > 1
        ? event.cards.slice(1)
        : [];

      onPileActive?.(true);
      setPlacePhase(isMobile ? 'at-pile' : 'to-pile');
      setItems([
        {
          id: `${event.seq}-flip-stock`,
          card,
          mode: 'place',
          pile,
          stock,
          dest,
          isMobile,
        },
        ...matchExtras.map((c, i) => ({
          id: `${event.seq}-match-${c.id}`,
          card: c,
          mode: 'fly',
          from: ZONES.table,
          to: dest,
          delay: PILE_DRAW_MS + FLIP_AT_PILE_MS + 200 + i * STAGGER_MS,
          duration: FLY_MS,
        })),
      ]);

      const flipStart = isMobile ? PILE_DRAW_MS : FLY_TO_PILE_MS;
      const flyStart = flipStart + FLIP_AT_PILE_MS;
      const totalMs = flyStart + FLY_TO_DEST_MS + 80
        + (matchExtras.length ? FLY_MS + STAGGER_MS : 0);

      const t0 = setTimeout(() => {
        setPlacePhase('flip');
        playSound('flipCard');
      }, flipStart);
      const t1 = setTimeout(() => {
        setPlacePhase('fly-dest');
        playSound(event.to === 'captured' ? 'match' : 'place');
      }, flyStart);
      const t2 = setTimeout(() => finish(), totalMs);

      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    if (isHandToTable(event)) {
      const card = event.cards[0];
      const from = ZONES[event.playerIdx === 0 ? 'hand0' : 'hand1'];
      const to = ZONES.table;

      setItems([{
        id: `${event.seq}-hand-table`,
        card,
        mode: 'fly',
        from,
        to,
        delay: 0,
        duration: FLY_MS,
      }]);

      const timer = setTimeout(() => finish(), FLY_MS + 80);
      return () => clearTimeout(timer);
    }

    const toKey = event.to === 'captured' ? `captured${event.playerIdx}` : 'table';
    const duration = event.type === 'ppung' ? PPUNG_FLY_MS : FLY_MS;

    const newItems = event.cards.map((card, i) => {
      let fromKey;
      if (event.type === 'play_hand') {
        fromKey = i === 0 ? (event.playerIdx === 0 ? 'hand0' : 'hand1') : 'table';
      } else if (event.type === 'ppung') {
        fromKey = i === 0
          ? (event.from === 'stock' ? 'stock' : (event.playerIdx === 0 ? 'hand0' : 'hand1'))
          : 'table';
      } else {
        fromKey = 'table';
      }

      const from = ZONES[fromKey] || ZONES.table;
      const to = ZONES[toKey] || ZONES.table;
      return {
        id: `${event.seq}-${card.id}-${i}`,
        card,
        mode: 'fly',
        from,
        to,
        delay: i * STAGGER_MS,
        duration,
      };
    });

    setItems(newItems);
    const maxDelay = (event.cards.length - 1) * STAGGER_MS;
    const timer = setTimeout(() => finish(), duration + maxDelay + 80);

    return () => clearTimeout(timer);
  }, [event?.seq, finish, onDone, onPileActive, isMobile]);

  if (!items.length) return null;

  return (
    <div className="flying-layer" aria-hidden="true">
      {items.map((item) => {
        if (item.mode === 'place') {
          const phaseClass = placePhase === 'flip' ? 'place-flip'
            : placePhase === 'fly-dest' ? 'place-fly-dest'
            : item.isMobile ? 'place-at-pile' : 'place-to-pile';

          return (
            <div
              key={item.id}
              className={`flying-card flying-place ${phaseClass}`}
              style={{
                '--fx': `${item.stock.x}%`,
                '--fy': `${item.stock.y}%`,
                '--px': `${item.pile.x}%`,
                '--py': `${item.pile.y}%`,
                '--tx': `${item.dest.x}%`,
                '--ty': `${item.dest.y}%`,
              }}
            >
              <div className="flip-card-3d">
                <div className="flip-face flip-back">
                  <img src={getCardBackPath()} alt="" className="card-img" draggable={false} />
                </div>
                <div className="flip-face flip-front">
                  <Card card={item.card} size="flying" disabled />
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            className="flying-card flying-fly"
            style={{
              '--fx': `${item.from.x}%`,
              '--fy': `${item.from.y}%`,
              '--tx': `${item.to.x}%`,
              '--ty': `${item.to.y}%`,
              '--fly-ms': `${item.duration}ms`,
              animationDelay: `${item.delay}ms`,
            }}
          >
            <Card card={item.card} size="flying" disabled />
          </div>
        );
      })}
    </div>
  );
}
