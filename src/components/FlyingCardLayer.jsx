import { useEffect, useState, useCallback } from 'react';
import Card from './Card';
import { getCardBackPath } from '../data/cardImages';
import { playSound } from '../utils/sounds';

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
const FADE_PILE_MS = 320;
const PLACE_TOTAL_MS = FLY_TO_PILE_MS + FLIP_AT_PILE_MS + FADE_PILE_MS + 80;
const STAGGER_MS = 220;
const PPUNG_FLY_MS = 1800;

function isPlaceOnTable(event) {
  return event.to === 'table' && event.type !== 'ppung';
}

export default function FlyingCardLayer({ event, onDone, onPileActive }) {
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

    if (isPlaceOnTable(event)) {
      const card = event.cards[0];
      const fromKey = event.type === 'flip_stock' ? 'stock' : (event.playerIdx === 0 ? 'hand0' : 'hand1');
      const from = ZONES[fromKey];
      const pile = ZONES.pile;

      onPileActive?.(true);
      setPlacePhase('to-pile');
      setItems([{
        id: `${event.seq}-place`,
        card,
        mode: 'place',
        from,
        faceDown: true,
      }]);

      const t1 = setTimeout(() => {
        setPlacePhase('flip');
        playSound('flipCard');
      }, FLY_TO_PILE_MS);
      const t2 = setTimeout(() => {
        setPlacePhase('land');
        playSound('place');
      }, FLY_TO_PILE_MS + FLIP_AT_PILE_MS);
      const t3 = setTimeout(() => finish(), PLACE_TOTAL_MS);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    const fromKey = event.type === 'flip_stock' ? 'stock'
      : event.type === 'play_hand' ? (event.playerIdx === 0 ? 'hand0' : 'hand1')
      : 'table';
    const toKey = event.to === 'captured' ? `captured${event.playerIdx}` : 'table';

    const from = ZONES[fromKey] || ZONES.table;
    const to = ZONES[toKey] || ZONES.table;
    const duration = event.type === 'ppung' ? PPUNG_FLY_MS : FLY_MS;

    const newItems = event.cards.map((card, i) => ({
      id: `${event.seq}-${card.id}-${i}`,
      card,
      mode: 'fly',
      from,
      to,
      delay: i * STAGGER_MS,
      duration,
    }));

    setItems(newItems);
    const maxDelay = (event.cards.length - 1) * STAGGER_MS;
    const timer = setTimeout(() => finish(), duration + maxDelay + 80);

    return () => clearTimeout(timer);
  }, [event?.seq, finish, onDone, onPileActive]);

  if (!items.length) return null;

  return (
    <div className="flying-layer" aria-hidden="true">
      {items.map((item) => {
        if (item.mode === 'place') {
          const pile = ZONES.pile;
          const phaseClass = placePhase === 'flip' ? 'place-flip'
            : placePhase === 'land' ? 'place-land'
            : 'place-to-pile';

          return (
            <div
              key={item.id}
              className={`flying-card flying-place ${phaseClass}`}
              style={{
                '--fx': `${item.from.x}%`,
                '--fy': `${item.from.y}%`,
                '--px': `${pile.x}%`,
                '--py': `${pile.y}%`,
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
