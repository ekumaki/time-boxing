import { useState } from 'react';
import type { Routine } from '@shared/types';
import { HomePage } from './pages/HomePage';
import { RoutineEditPage } from './pages/RoutineEditPage';
import { TimerPage } from './pages/TimerPage';
import { CompletionPage } from './pages/CompletionPage';
import { SettingsPage } from './pages/SettingsPage';

type Page =
  | { type: 'home' }
  | { type: 'edit'; routine?: Routine }
  | { type: 'timer'; routine: Routine }
  | { type: 'completion'; routine: Routine }
  | { type: 'settings' };

function App() {
  const [page, setPage] = useState<Page>({ type: 'home' });
  const [refreshKey, setRefreshKey] = useState(0);

  const navigateHome = () => {
    setRefreshKey((k) => k + 1);
    setPage({ type: 'home' });
  };

  switch (page.type) {
    case 'home':
      return (
        <HomePage
          key={refreshKey}
          onNavigateToTimer={(routine) => setPage({ type: 'timer', routine })}
          onNavigateToEdit={(routine) => setPage({ type: 'edit', routine })}
          onNavigateToSettings={() => setPage({ type: 'settings' })}
        />
      );

    case 'edit':
      return (
        <RoutineEditPage
          routine={page.routine}
          onSave={navigateHome}
          onBack={navigateHome}
        />
      );

    case 'timer':
      return (
        <TimerPage
          routine={page.routine}
          onComplete={() => setPage({ type: 'completion', routine: page.routine })}
          onBack={navigateHome}
        />
      );

    case 'completion':
      return (
        <CompletionPage
          routine={page.routine}
          onGoHome={navigateHome}
        />
      );

    case 'settings':
      return (
        <SettingsPage
          onBack={navigateHome}
        />
      );
  }
}

export default App;
