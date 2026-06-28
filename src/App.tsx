import { Routes, Route } from 'react-router-dom';
import { FirstPage } from './components/FirstPage';
import { PlanetHexPage } from './components/PlanetHexPage';
import { PlanetModelerPage } from './components/PlanetModelerPage';
import { PlanetRelocatePage } from './components/PlanetRelocatePage';
import { TechnicsPage } from './components/TechnicsPage';

function App() {
  return (
    <Routes>
      <Route index element={<FirstPage />} />
      <Route path="technics" element={<TechnicsPage />} />
      <Route path="modeler" element={<PlanetModelerPage />} />
      <Route path=":planetId/:q/:r" element={<PlanetHexPage />} />
      <Route path=":planetId" element={<PlanetRelocatePage />} />
    </Routes>
  );
}

export default App;
