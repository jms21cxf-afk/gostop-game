export default function GoStopModal({ playerName, score, goCount, onGo, onStop }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content gostop-modal">
        <h2>🎯 {playerName}님, {score}점!</h2>
        <p className="gostop-message">
          3점 이상입니다! 어떻게 하시겠습니까?
        </p>
        {goCount > 0 && (
          <p className="go-count">고 {goCount}번 외침 (스톱 시 ×{1 + goCount}배)</p>
        )}

        <div className="gostop-buttons">
          <button className="btn btn-go btn-large" onClick={onGo}>
            🔔 고!
          </button>
          <button className="btn btn-stop btn-large" onClick={onStop}>
            ✋ 스톱!
          </button>
        </div>

        <p className="gostop-hint">
          <strong>고</strong>: 더 높은 점수를 노립니다<br />
          <strong>스톱</strong>: 지금 점수를 받고 판을 끝냅니다
        </p>
      </div>
    </div>
  );
}
