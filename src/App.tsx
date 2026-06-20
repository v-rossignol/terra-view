import { Routes, Route } from 'react-router-dom';
import { FirstPage } from './components/FirstPage';
import { PlanetModelerPage } from './components/PlanetModelerPage';
import { PlanetRelocatePage } from './components/PlanetRelocatePage';

function App() {
  return (
    <Routes>
      <Route index element={<FirstPage />} />
      <Route path="modeler" element={<PlanetModelerPage />} />
      <Route path=":planetId" element={<PlanetRelocatePage />} />
    </Routes>
  );
}

export default App;
