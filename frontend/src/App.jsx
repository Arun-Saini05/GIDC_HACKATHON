
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import MapComponent from './components/Map';
import Sidebar from './components/Sidebar';

// Reusable components for search results logic (matching design)
const MobileResultCard = ({ data, onClose }) => {
  if (!data || data.type === 'suggestions') return null;

  const catBadge = (cat) => {
    const map = {
      High: 'bg-red-500/20 text-red-400 border border-red-500/30',
      Medium: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      Low: 'bg-green-500/20 text-green-400 border border-green-500/30',
    };
    return map[cat] || 'bg-slate-700/50 text-slate-400';
  };

  const trendColor = (t) => t && !String(t).includes('-') ? 'text-red-400' : 'text-green-400';

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-[1001] bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-500">✕</button>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-none">{data.name}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {data.type === 'state' ? `${data.district_count} districts` : data.state}
          </p>
          {data.fuzzy_corrected && (
            <p className="text-[10px] text-amber-400 italic mt-1">✦ Auto-corrected spelling</p>
          )}
        </div>
      </div>

      {data.type === 'state' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
              <span>Risk Distribution</span>
            </div>
            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-800">
              <div style={{ width: `${data.high_pct}%` }} className="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <div style={{ width: `${data.med_pct}%` }} className="bg-orange-400" />
              <div style={{ width: `${data.low_pct}%` }} className="bg-green-500" />
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> High {data.high_pct}%</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Med {data.med_pct}%</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Low {data.low_pct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/50">
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Overall</p>
              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${catBadge(data.overall_category)}`}>
                {data.overall_category}
              </span>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Future Trend</p>
              <span className={`text-xs font-bold ${trendColor(data.future_trend)}`}>
                {data.future_trend && !String(data.future_trend).includes('-') ? '▲' : '▼'} {data.future_trend}
              </span>
            </div>
          </div>
        </div>
      )}

      {data.type === 'district' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-sm text-slate-400">Risk Assessment</span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${catBadge(data.category)}`}>
              {data.category}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-400">Future Chance</span>
            <span className={`text-sm font-bold ${trendColor(data.future_trend)}`}>
              {data.future_trend && !String(data.future_trend).includes('-') ? '▲' : '▼'} {data.future_trend}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  const [searchTarget, setSearchTarget] = useState(null);
  const [showRoads, setShowRoads] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search state (lifted from Sidebar)
  const [searchQ, setSearchQ] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleRegionSearch = useCallback(async (overrideQ) => {
    const q = (overrideQ ?? searchQ).trim();
    if (!q) return;
    setSearchLoading(true); setSearchError(''); setSearchResult(null);
    try {
      const res = await axios.get(`http://192.168.0.102:8001/api/search?q=${encodeURIComponent(q)}`);
      if (res.data.type === 'not_found') {
        setSearchError(res.data.message);
      } else {
        setSearchResult(res.data);
        if (res.data.type === 'district') {
          setSearchTarget({ type: 'district', name: res.data.name });
        } else if (res.data.type === 'state') {
          setSearchTarget({ type: 'state', name: res.data.name });
        } else if (res.data.type === 'suggestions' && res.data.matches?.length === 1) {
          setSearchTarget({ type: 'district', name: res.data.matches[0].name });
        }
      }
    } catch {
      setSearchError("Backend not reachable.");
    } finally { setSearchLoading(false); }
  }, [searchQ]);

  // Route searching state (lifted from Sidebar)
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [isRouteSheetOpen, setIsRouteSheetOpen] = useState(false);

  const handleRouteSearch = useCallback(async () => {
    if (!source || !destination) return;
    setRouteLoading(true); setRouteError(null); setRoutePath(null);
    try {
      const res = await axios.post('http://192.168.0.102:8001/api/safest-route', { source, destination });
      if (res.data.error) {
        setRouteError(res.data.error);
      } else {
        setRoutePath(res.data.path);
        setIsRouteSheetOpen(false); // Close mobile sheet on success
      }
    } catch (err) {
      setRouteError("Failed to fetch route. Is backend running?");
    } finally {
      setRouteLoading(false);
    }
  }, [source, destination, setRoutePath]);

  return (
    <div className="relative h-screen w-screen bg-slate-900 overflow-hidden flex flex-col md:flex-row">
      <div className="md:hidden fixed top-6 left-4 right-4 z-[1001]">
        <div className="flex items-center gap-3 bg-[#1A2234]/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-4 py-2.5 shadow-2xl transition-all">
          <input
            type="text"
            placeholder="Search district or state..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegionSearch()}
            className="flex-1 bg-transparent border-none outline-none text-white text-base placeholder-slate-500"
          />
          <div className="flex items-center gap-3">
            {searchResult && (
              <button onClick={() => { setSearchQ(''); setSearchResult(null); }} className="text-slate-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button onClick={() => handleRegionSearch()} className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        {searchError && <div className="mt-2 ml-2 text-red-400 text-xs italic">{searchError}</div>}
      </div>

      <Sidebar
        hoveredDistrict={hoveredDistrict}
        setRoutePath={setRoutePath}
        setSearchTarget={setSearchTarget}
        showRoads={showRoads}
        setShowRoads={setShowRoads}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        searchQ={searchQ}
        setSearchQ={setSearchQ}
        searchResult={searchResult}
        setSearchResult={setSearchResult}
        searchLoading={searchLoading}
        searchError={searchError}
        handleRegionSearch={handleRegionSearch}
        // Lifted Route Props
        source={source}
        setSource={setSource}
        destination={destination}
        setDestination={setDestination}
        routeLoading={routeLoading}
        routeError={routeError}
        routePath={routePath}
        handleRouteSearch={handleRouteSearch}
      />

      {/* Mobile Route Finder Bottom Sheet */}
      {isRouteSheetOpen && (
        <div className="md:hidden fixed inset-0 z-[1002] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] flex flex-col bg-[#1A2234] rounded-t-[2.5rem] border-t border-slate-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-700/50 rounded-full mx-auto my-4 flex-shrink-0" />
            
            <div className="px-8 pb-8 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Route Finder</h2>
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400/70">Tap to enter destinations</p>
                </div>
                <button onClick={() => setIsRouteSheetOpen(false)} className="p-2.5 bg-slate-800/50 rounded-full text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-green-500 bg-slate-900 z-10" />
                  <div className="absolute left-[1.2rem] top-[60%] h-12 border-l border-dashed border-slate-600" />
                  <input
                    type="text"
                    placeholder="Starting point..."
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-800/40 border border-slate-700/30 rounded-2xl pl-10 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-red-500 bg-slate-900 z-10" />
                  <input
                    type="text"
                    placeholder="Destination..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-800/40 border border-slate-700/30 rounded-2xl pl-10 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleRouteSearch}
                disabled={routeLoading || !source || !destination}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] mb-8"
              >
                {routeLoading ? 'Calculating Safest Route...' : 'Find Safest Route'}
              </button>
              
              {routeError && <p className="mb-4 text-center text-red-400 text-xs font-medium italic">{routeError}</p>}

              {/* Route Results (Pixel-Perfect from Mockup) */}
              {routePath && (
                <div className="animate-in slide-up fade-in duration-500">
                  <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400/90 mb-6 pl-1">Fastest & Safest Route</h3>
                  <div className="space-y-0 relative pl-4 border-l border-slate-700/80 ml-2">
                    {routePath.map((stop, i) => (
                      <div key={i} className="relative pb-8 last:pb-2 flex items-center justify-between group">
                        {/* Dot */}
                        <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-[#1A2234] z-20 shadow-lg ${
                          stop.risk === 'High' ? 'bg-red-500' : 
                          stop.risk === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                        }`} />
                        
                        <span className="text-sm font-bold text-slate-100 uppercase tracking-tight">{stop.name}</span>
                        
                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                          stop.risk === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                          stop.risk === 'Medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
                          'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {stop.risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Mobile Route FAB */}
      <button
        onClick={() => setIsRouteSheetOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-[1001] w-14 h-14 bg-blue-600 rounded-full shadow-[0_10_30px_rgba(37,99,235,0.5)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all animate-in zoom-in duration-500 group"
      >
        {/* Animated Ring */}
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20 group-hover:opacity-40" />
        
        <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>

      <MobileResultCard 
        data={searchResult} 
        onClose={() => setSearchResult(null)} 
      />

      {/* Map Container */}
      <div className="flex-1 h-full relative w-full">
        <MapComponent
          routePath={routePath}
          setHoveredDistrict={setHoveredDistrict}
          searchTarget={searchTarget}
          showRoads={showRoads}
        />
      </div>
    </div>
  );
}

export default App;
