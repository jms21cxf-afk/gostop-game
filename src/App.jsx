import GameBoard from './components/GameBoard';
import ErrorBoundary from './components/ErrorBoundary';
import { useViewportLayout } from './hooks/useViewportLayout';

function App() {
  useViewportLayout();

  return (
    <div className="app">
      <ErrorBoundary>
        <GameBoard />
      </ErrorBoundary>
    </div>
  );
}

export default App;
