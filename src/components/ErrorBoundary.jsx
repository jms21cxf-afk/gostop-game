import { Component } from 'react';

/** React 렌더 오류 시 초록 빈 화면 대신 복구 UI */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[고스톱] 화면 오류', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('gostop-game-save');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="error-fallback">
          <div className="error-fallback-box">
            <h1>잠깐 문제가 생겼어요</h1>
            <p>게임 화면을 불러오지 못했습니다. 새로고침하면 대부분 해결됩니다.</p>
            <div className="error-fallback-actions">
              <button type="button" className="btn btn-primary btn-large" onClick={this.handleReload}>
                새로고침
              </button>
              <button type="button" className="btn btn-secondary btn-large" onClick={this.handleReset}>
                저장 지우고 다시 시작
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
