import { useEffect, useState, useCallback } from 'react';
import Card from './Card';
import { playSound } from '../utils/sounds';

const ZONES = {
  hand0: { x: 50, y: 84 },
  hand1: { x: 50, y: 12 },
  stock: { x: 50, y: 32 },
  table: { x: 50, y: 52 },
  captured0: { x: 8, y: 50 },
  captured1: { x: 92, y: 50 },
};

const FLY_MS = 1600;
const STAGGER_MS = 220;
const PPUNG_FLY_MS = 1800;

function isPlaceOnTable(event) {
  return event.to === 'table' && event.type !== 'ppung';
}

export default function FlyingCardLayer({ event, onDone }) {
  const [items, setItems] = useState([]);

  const finish = useCallback(() => {
    setItems([]);
    onDone?.();
  }, [onDone]);

  useEffect(() => {
    if (!event) return undefined;
    if (!event.cards?.length) {
      onDone?.();
      return undefined;
    }

    if (isPlaceOnTable(event)) {
      playSound('place');
      finish();
      return undefined;
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
      from,
      to,
      delay: i * STAGGER_MS,
      duration,
    }));

    setItems(newItems);
    const maxDelay = (event.cards.length - 1) * STAGGER_MS;
    const timer = setTimeout(() => finish(), duration + maxDelay + 80);

    return () => clearTimeout(timer);
  }, [event?.seq, finish, onDone]);

  if (!items.length) return null;

  return (
    <div className="flying-layer" aria-hidden="true">
      {items.map((item) => (
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
      ))}
    </div>
  );
}
