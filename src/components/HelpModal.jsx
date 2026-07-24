export default function HelpModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🎴 고스톱 게임 방법</h2>

        <section>
          <h3>2인 고스톱 (맞고) 카드 나누기</h3>
          <ul>
            <li>바닥: <strong>8장</strong></li>
            <li>나 &amp; 컴퓨터: 각 <strong>10장</strong></li>
            <li>남은 덱: <strong>20장</strong> (차례마다 1장씩 자동으로 열림)</li>
          </ul>
          <p>패는 <strong>1월→12월 순</strong>으로 정렬되어 보기 쉽습니다. 카드를 한 장 내면 9장이 남는 것이 정상입니다.</p>
        </section>

        <section>
          <h3>한 턴 순서 (이렇게 번갈아 합니다)</h3>
          <ol>
            <li><strong>① 패에서 카드 1장</strong> 내기</li>
            <li>같은 월이 바닥에 있으면 가져가기 (없으면 바닥에 놓기)</li>
            <li><strong>② 덱에서 카드 1장</strong> 자동으로 뒤집기</li>
            <li>또 같은 월이 있으면 가져가기 (없으면 바닥에 놓기)</li>
            <li>①~② 끝나면 상대 차례 · <strong>잠시 쉬었다</strong> 다음 사람</li>
          </ol>
        </section>

        <section>
          <h3>「바닥에서 고르세요」는 언제?</h3>
          <p>
            내가 낸 카드(또는 덱에서 연 카드)와 <strong>같은 월</strong>이 바닥에
            <strong> 딱 2장</strong> 있을 때 나옵니다.
          </p>
          <p>
            둘 다 같은 월이라 어느 쪽과 맞출지 <strong>직접 골라야</strong> 해요.
            깜빡이는 바닥 카드 중 하나를 터치하면 됩니다.
          </p>
          <ul>
            <li>바닥에 1장만 → 자동으로 가져감 (고를 필요 없음)</li>
            <li>바닥에 3장 → 뻥! 4장 모두 자동으로 가져감</li>
          </ul>
        </section>

        <section>
          <h3>초가리 · 총통 (같은 달 4장)</h3>
          <ul>
            <li>
              <strong>초가리</strong>: <strong>게임 막 시작할 때</strong> 손패에 같은 달 4장이 있으면
              {' '}<strong>카드를 다시 나눕니다</strong> (아직 한 장도 내지 않은 상태 · 이 게임 자동 처리)
            </li>
            <li>
              <strong>총통</strong>: <strong>플레이 중</strong> 같은 달 4장을 <strong>전부 먹으면</strong>{' '}
              <strong>+5점</strong>
            </li>
            <li>
              같은 달 4장을 <strong>전부 내 쪽</strong>(손패 + 먹은 패)에서 갖게 되면, 상대는 그 달 카드가
              없어서 맞출 수 없습니다 · <strong>급하지 않게 한 장씩</strong> 내면 됩니다
            </li>
          </ul>
        </section>

        <section>
          <h3>특수 규칙</h3>
          <ul>
            <li><strong>9월 국화(엽)</strong>: 엽·피 둘 다 가능 → 먹을 때 <strong>어디에 둘지</strong> 선택</li>
            <li><strong>뻥</strong>: 바닥에 같은 월 3장 + 내 카드 1장 = 4장 모두 가져감</li>
            <li><strong>쪽</strong>: 바닥에 같은 월 1장 + 내 카드 = 2장 가져감</li>
          </ul>
        </section>

        <section>
          <h3>점수 (족보)</h3>
          <ul>
            <li><strong>5광</strong>: 15점 | <strong>4광</strong>: 4점 | <strong>3광</strong>: 3점</li>
            <li><strong>고도리</strong> (새 3장): 5점</li>
            <li><strong>홍단</strong> (6,7,10월 띠): 3점</li>
            <li><strong>청단</strong> (6,9,10월 띠 3장): 3점</li>
            <li><strong>초단</strong> (4,5,6월 띠): 3점</li>
            <li><strong>엽</strong> 5장 이상: 장당 1점</li>
            <li><strong>띠</strong> 5장 이상: 장당 1점</li>
            <li><strong>피</strong> 10장 이상: 장당 1점 (9월 국화·11·12월 쌍피는 <strong>2장분</strong>)</li>
          </ul>
        </section>

        <section>
          <h3>고 & 스톱</h3>
          <p>3점 이상이 되면 <strong>고</strong>(계속) 또는 <strong>스톱</strong>(점수 받기)을 선택합니다.</p>
          <p>고를 외치면 점수가 올라갈 수 있지만, 상대가 먼저 스톱하면 점수를 못 받을 수도 있습니다.</p>
        </section>

        <button className="btn btn-primary btn-large" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
