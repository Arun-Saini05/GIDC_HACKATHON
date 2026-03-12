import React, { useState, useRef } from 'react';
import axios from 'axios';

/* ── helpers ──────────────────────────────────────────────── */
const catBadge = (cat) => {
    const map = {
        High: 'bg-red-500/20 text-red-400 border border-red-500/30',
        Medium: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        Low: 'bg-green-500/20 text-green-400 border border-green-500/30',
    };
    return map[cat] || 'bg-slate-700/50 text-slate-400';
};

const trendColor = (t) =>
    t && !String(t).includes('-') ? 'text-red-400' : 'text-green-400';
const trendIcon = (t) =>
    t && !String(t).includes('-') ? '▲' : '▼';

/* ── Road Crime LSTM section (reused in both hover + search) ─ */
const RoadCrimeBadge = ({ cat, trend }) => {
    if (!cat || cat === 'No Data') return null;
    const barCol = cat === 'High' ? '#EF4444' : cat === 'Medium' ? '#F59E0B' : '#10B981';
    return (
        <div className="pt-2 mt-2 border-t border-slate-700/40 space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Road Crime</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${catBadge(cat)}`}>{cat}</span>
            </div>
            {trend && (
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">Road Future Trend</span>
                    <span className={`text-xs font-bold ${trendColor(trend)}`}>{trendIcon(trend)} {trend}</span>
                </div>
            )}
        </div>
    );
};

const WomenCrimeBadge = ({ cat, trend }) => {
    if (!cat || cat === 'No Data') return null;
    const barCol = cat === 'High' ? '#EF4444' : cat === 'Medium' ? '#F59E0B' : '#10B981';
    return (
        <div className="pt-2 mt-2 border-t border-slate-700/40 space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Women Crime</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${catBadge(cat)}`}>{cat}</span>
            </div>
            {trend && (
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">Women Future Trend</span>
                    <span className={`text-xs font-bold ${trendColor(trend)}`}>{trendIcon(trend)} {trend}</span>
                </div>
            )}
        </div>
    );
};

/* ── Search result cards ──────────────────────────────────── */
const DistrictCard = ({ data, onClose }) => (
    <div className="rounded-lg border border-slate-600 bg-slate-800/80 p-3 space-y-2 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white text-xs">✕</button>
        <div>
            <p className="text-base font-bold text-white leading-tight">{data.name}</p>
            <p className="text-[10px] text-slate-400">{data.state}</p>
        </div>
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Overall Risk</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${catBadge(data.category)}`}>{data.category}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Future Trend</span>
                <span className={`text-xs font-bold ${trendColor(data.future_trend)}`}>
                    {trendIcon(data.future_trend)} {data.future_trend}
                </span>
            </div>
        </div>
        <WomenCrimeBadge cat={data.women_crime_category} trend={data.women_crime_trend} />
    </div>
);

const StateCard = ({ data, onClose }) => {
    const total = data.high_pct + data.med_pct + data.low_pct;
    return (
        <div className="rounded-lg border border-blue-500/30 bg-slate-800/80 p-3 space-y-3 relative">
            <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white text-xs">✕</button>
            <div>
                <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-bold text-blue-300">{data.name}</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{data.district_count} districts</p>
                {data.fuzzy_corrected && (
                    <p className="text-[10px] text-amber-400 mt-0.5 italic">✦ Auto-corrected spelling</p>
                )}
            </div>

            {/* Risk distribution bar */}
            <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Risk Distribution</p>
                <div className="flex rounded overflow-hidden h-2 w-full">
                    {data.high_pct > 0 && <div style={{ width: `${data.high_pct}%` }} className="bg-red-500" />}
                    {data.med_pct > 0 && <div style={{ width: `${data.med_pct}%` }} className="bg-orange-400" />}
                    {data.low_pct > 0 && <div style={{ width: `${data.low_pct}%` }} className="bg-green-500" />}
                </div>
                <div className="flex gap-3 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />High {data.high_pct}%</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Med {data.med_pct}%</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Low {data.low_pct}%</span>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-1.5 pt-2 border-t border-slate-700/40">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Overall Category</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${catBadge(data.overall_category)}`}>{data.overall_category}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Avg Future Trend</span>
                    <span className={`text-xs font-bold ${trendColor(data.future_trend)}`}>
                        {trendIcon(data.future_trend)} {data.future_trend}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Avg WCI</span>
                    <span className="text-xs font-bold text-slate-300">{data.avg_wci}</span>
                </div>
            </div>
        </div>
    );
};

const SuggestionList = ({ matches, onSelect }) => (
    <div className="rounded-lg border border-slate-600 bg-slate-800/90 divide-y divide-slate-700 overflow-hidden">
        {matches.map((m) => (
            <button key={m.name} onClick={() => onSelect(m.name)}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors">
                <p className="text-xs font-semibold text-white">{m.name}</p>
                <p className="text-[10px] text-slate-400">{m.state}</p>
            </button>
        ))}
    </div>
);

/* ── Main Sidebar ─────────────────────────────────────────── */
const Sidebar = ({
    hoveredDistrict,
    setRoutePath,
    setSearchTarget,
    showRoads,
    setShowRoads,
    isOpen,
    onToggle,
    searchQ,
    setSearchQ,
    searchResult,
    setSearchResult,
    searchLoading,
    searchError,
    handleRegionSearch,
    // Lifted Route Props
    source,
    setSource,
    destination,
    setDestination,
    routeLoading,
    routeError,
    routePath,
    handleRouteSearch
}) => {
    const searchRef = useRef(null);

    const showRoadCrime =
        hoveredDistrict &&
        hoveredDistrict.roadCrimeCategory &&
        hoveredDistrict.roadCrimeCategory !== 'No Data';

    const showWomenCrime =
        hoveredDistrict &&
        hoveredDistrict.womenCrimeCategory &&
        hoveredDistrict.womenCrimeCategory !== 'No Data';

    return (
        <div className={`absolute top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-md text-white shadow-xl z-[1000] p-5 overflow-y-auto border-r border-slate-700 space-y-5 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            {/* Mobile Close Button */}
            <button
                onClick={onToggle}
                className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* ── Title ── */}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                SafeTravels India
            </h1>

            {/* ── Search Bar (Hidden on mobile as it's at the top level) ── */}
            <div className="hidden md:block space-y-2">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={searchRef}
                            type="text"
                            value={searchQ}
                            onChange={e => { setSearchQ(e.target.value); if (!e.target.value) { setSearchResult(null); } }}
                            onKeyDown={e => e.key === 'Enter' && handleRegionSearch()}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
                            placeholder="Search district or state…"
                        />
                    </div>
                    <button
                        onClick={() => handleRegionSearch()}
                        disabled={searchLoading || !searchQ.trim()}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                    >
                        {searchLoading ? '…' : 'Go'}
                    </button>
                </div>

                {/* Search results */}
                {searchError && (
                    <p className="text-[11px] text-red-400 italic pl-1">{searchError}</p>
                )}
                {searchResult?.type === 'district' && (
                    <DistrictCard data={searchResult} onClose={() => setSearchResult(null)} />
                )}
                {searchResult?.type === 'state' && (
                    <StateCard data={searchResult} onClose={() => setSearchResult(null)} />
                )}
                {searchResult?.type === 'suggestions' && (
                    <SuggestionList
                        matches={searchResult.matches}
                        onSelect={name => { setSearchQ(name); handleRegionSearch(name); }}
                    />
                )}
            </div>

            {/* ── Current Region (hover card) ── */}
            <div className="p-0 bg-slate-800 rounded-lg border border-slate-600 overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-900 border-b border-slate-700">
                    <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Current Region</h2>
                </div>

                {hoveredDistrict ? (
                    <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 space-y-4">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-extrabold text-white tracking-tight">{hoveredDistrict.name}</h3>
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{hoveredDistrict.date}</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Overall Risk</span>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${catBadge(hoveredDistrict.category)}`}>
                                    {hoveredDistrict.category || 'No Data'} Risk
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Future Trend</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-semibold ${trendColor(hoveredDistrict.futureChance)}`}>
                                        {hoveredDistrict.futureChance || 'N/A'}
                                    </span>
                                    <span className="text-[10px] text-slate-600">vs prev year</span>
                                </div>
                            </div>
                        </div>

                        {showRoadCrime && (() => {
                            const trend = hoveredDistrict.roadCrimeTrend || null;
                            const trendUp = trend && !trend.includes('-');
                            return (
                                <div className="pt-3 border-t border-slate-700/60 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Road Crime</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${catBadge(hoveredDistrict.roadCrimeCategory)}`}>
                                            {hoveredDistrict.roadCrimeCategory}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 pt-1 border-t border-slate-700/40">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-400">Future Trend</span>
                                            {trend ? (
                                                <span className={`text-xs font-bold ${trendUp ? 'text-red-400' : 'text-green-400'}`}>
                                                    {trendUp ? '▲' : '▼'} {trend}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-500 italic">N/A</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {showWomenCrime && (() => {
                            const trend = hoveredDistrict.womenCrimeTrend || null;
                            const trendUp = trend && !trend.includes('-');
                            return (
                                <div className="pt-3 border-t border-slate-700/60 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Women Crime</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${catBadge(hoveredDistrict.womenCrimeCategory)}`}>
                                            {hoveredDistrict.womenCrimeCategory}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 pt-1 border-t border-slate-700/40">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-400">Future Trend</span>
                                            {trend ? (
                                                <span className={`text-xs font-bold ${trendUp ? 'text-red-400' : 'text-green-400'}`}>
                                                    {trendUp ? '▲' : '▼'} {trend}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-500 italic">N/A</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
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

            {/* ── Route Finder (Hidden on mobile) ── */}
            <div className="hidden md:block p-0 bg-slate-800 rounded-lg border border-slate-600 overflow-hidden shadow-lg mt-5">
                <div className="p-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Route Finder</h2>
                    <button onClick={() => setShowRoads(!showRoads)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${showRoads
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Roads {showRoads ? 'On' : 'Off'}
                    </button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Source District</label>
                        <input type="text" value={source} onChange={e => setSource(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="e.g. MUMBAI" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Destination</label>
                        <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="e.g. DELHI" />
                    </div>
                    <button onClick={handleRouteSearch} disabled={routeLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                        {routeLoading ? 'Finding Safe Path...' : 'Find Safest Route'}
                    </button>

                    {routePath && (
                        <div className="mt-2 p-4 bg-green-900/20 border border-green-800 rounded">
                            <h3 className="text-green-400 font-semibold mb-2 text-sm">Recommended Path</h3>
                            <div className="text-xs text-slate-300 space-y-1 max-h-60 overflow-y-auto pr-2">
                                {routePath.map((stop, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex flex-col items-center">
                                            <span className={`w-2 h-2 rounded-full ${stop.risk === 'High' ? 'bg-red-500' : stop.risk === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
                                            {i < routePath.length - 1 && <div className="w-0.5 h-3 bg-slate-700 my-0.5" />}
                                        </div>
                                        <span>{stop.name}</span>
                                        <span className="text-[10px] text-slate-500 ml-auto">{stop.risk}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 text-center">
                Tourism Safety India &copy; 2026
            </div>
        </div>
    );
};

export default Sidebar;
