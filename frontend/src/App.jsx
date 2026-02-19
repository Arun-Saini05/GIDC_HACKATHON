
import React, { useState } from 'react';
import MapComponent from './components/Map';
import Sidebar from './components/Sidebar';

function App() {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [routePath, setRoutePath] = useState(null); // List of district names

  return (
    <div className="relative h-screen w-screen bg-slate-900 overflow-hidden flex">
      <Sidebar
        hoveredDistrict={hoveredDistrict}
        setRoutePath={setRoutePath}
      />

      {/* Map Container - fills the rest */}
      <div className="flex-1 h-full relative">
        <MapComponent
          routePath={routePath}
          setHoveredDistrict={setHoveredDistrict}
        />
      </div>
    </div>
  );
}

export default App;
