import Card from './Card';

export default function DualCaptureModal({ card, onChoose }) {
  if (!card) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content gostop-modal dual-capture-modal">
        <h2>9월 국화 — 어디에 둘까요?</h2>
        <p className="gostop-message">
          이 카드는 <strong>엽</strong> 또는 <strong>피</strong> 둘 다 됩니다.
          <br />먹은 패 칸 중 하나를 골라 주세요.
        </p>

        <div className="dual-capture-preview">
          <Card card={card} size="medium" disabled />
        </div>

        <div className="gostop-buttons">
          <button className="btn btn-secondary btn-large" onClick={() => onChoose('yul')}>
            🐾 엽 칸
          </button>
          <button className="btn btn-primary btn-large" onClick={() => onChoose('pi')}>
            ⚪ 피 칸
          </button>
        </div>

        <p className="gostop-hint">
          <strong>엽</strong>: 엽 5장 이상 점수에 도움 · <strong>피</strong>: 피 10장 이상 점수에 도움
        </p>
      </div>
    </div>
  );
}
