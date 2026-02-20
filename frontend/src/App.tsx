import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GameProvider } from './contexts/GameContext'
import { GameModals } from './components/GameModals'
import { StartPage } from './pages/StartPage'
import { LoginPage } from './pages/LoginPage'
import { MainPage } from './pages/MainPage'
import { AchievementPage } from './pages/AchievementPage'

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <GameModals />
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/login/new" element={<LoginPage />} />
          <Route path="/login/continue" element={<LoginPage />} />
          <Route path="/game" element={<MainPage />} />
          <Route path="/market" element={<Navigate to="/game#market" replace />} />
          <Route path="/recipes" element={<Navigate to="/game?open=recipes" replace />} />
          <Route path="/missions" element={<Navigate to="/game#missions" replace />} />
          <Route path="/achievements" element={<AchievementPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  )
}

export default App
