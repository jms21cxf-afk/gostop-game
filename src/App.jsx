import GameBoard from './components/GameBoard';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="app">
      <ErrorBoundary>
        <GameBoard />
      </ErrorBoundary>
    </div>
  );
}

export default App;
