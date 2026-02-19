
import React, { useState } from 'react';
import axios from 'axios';

const Sidebar = ({ hoveredDistrict, setRoutePath }) => {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [loading, setLoading] = useState(false);
    const [routeResult, setRouteResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!source || !destination) return;
        setLoading(true);
        setError(null);
        setRouteResult(null);

        try {
            const res = await axios.post('http://localhost:8000/api/safest-route', {
                source,
                destination
            });

            if (res.data.error) {
                setError(res.data.error);
            } else {
                setRouteResult(res.data.path);
                setRoutePath(res.data.path); // Pass to map
                // Ideally map needs coords.
            }
        } catch (err) {
            setError("Failed to fetch route. Is backend running?");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute top-0 left-0 h-full w-80 bg-slate-900/90 backdrop-blur-md text-white shadow-xl z-[1000] p-6 overflow-y-auto border-r border-slate-700">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
                SafeTravels India
            </h1>

            {/* Hovered Info */}
            <div className="mb-8 p-0 bg-slate-800 rounded-lg border border-slate-600 overflow-hidden shadow-lg transition-all duration-300">
                <div className="p-3 bg-slate-900 border-b border-slate-700">
                    <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Current Region</h2>
                </div>

                {hoveredDistrict ? (
                    <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-extrabold text-white tracking-tight">{hoveredDistrict.name}</h3>
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                                {hoveredDistrict.date}
                            </span>
                        </div>

                        <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Analysis</span>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                                    ${hoveredDistrict.category === 'High' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                        hoveredDistrict.category === 'Medium' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                                            hoveredDistrict.category === 'Low' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                                                'bg-slate-700 text-slate-300'}`}>
                                    {hoveredDistrict.category || 'No Data'} Risk
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Future Trend</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-semibold
                                        ${(hoveredDistrict.futureChance && hoveredDistrict.futureChance.includes('-')) ? 'text-green-400' : 'text-red-400'}`}>
                                        {hoveredDistrict.futureChance || 'N/A'}
                                    </span>
                                    <span className="text-[10px] text-slate-600">vs prev year</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col items-center justify-center text-center opacity-60">
                        <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-slate-400 text-sm font-medium">Hover over any district to see crime analysis</p>
                    </div>
                )}
            </div>

            {/* Route Finder */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Route Finder
                </h2>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Source District</label>
                        <input
                            type="text"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="e.g. MUMBAI"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Destination</label>
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="e.g. DELHI"
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Finding Safe Path...' : 'Find Safest Route'}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-300 text-xs">
                            {error}
                        </div>
                    )}

                    {routeResult && (
                        <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded">
                            <h3 className="text-green-400 font-semibold mb-2 text-sm">Recommended Path</h3>
                            <div className="text-xs text-slate-300 space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {routeResult.map((stop, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="flex flex-col items-center">
                                            <span className={`w-2 h-2 rounded-full 
                                                ${stop.risk === 'High' ? 'bg-red-500' :
                                                    stop.risk === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                            </span>
                                            {index < routeResult.length - 1 && <div className="w-0.5 h-3 bg-slate-700 my-0.5"></div>}
                                        </div>
                                        <span>{stop.name}</span>
                                        <span className="text-[10px] text-slate-500 ml-auto">{stop.risk}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-700">
                                <p className="text-xs text-slate-400">Total Safety Score: High</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 text-center">
                Tourism Safety India &copy; 2026
            </div>
        </div >
    );
};

export default Sidebar;
