import { Routes, Route } from 'react-router-dom';
import { FirstPage } from './components/FirstPage';
import { PlanetRelocatePage } from './components/PlanetRelocatePage';

function App() {
  return (
    <Routes>
      <Route index element={<FirstPage />} />
      <Route path=":planetId" element={<PlanetRelocatePage />} />
    </Routes>
  );
}

export default App;
