import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import SectionHeader from './components/SectionHeader';
import FacilityCard from './components/FacilityCard';
import GeneratorCard from './components/GeneratorCard';
import Visualization from './components/Visualization';
import OutagesSummary from './components/OutagesSummary';
import OutageVisualization from './components/OutageVisualization';
import { parseIesoXml, SECTION_KEYS } from './utils/iesoParser';
import { fetchAvailableReportsIndex, buildReportFilename, getMsUntilNext20Past } from './utils/reportIndex';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const API_GENERATION_ENDPOINT = '/api/ieso-generation';
const LIVE_DIRECT_URL = 'https://reports-public.ieso.ca/public/GenOutputCapability/PUB_GenOutputCapability.xml';
const CORS_PROXY_BASE = 'https://api.allorigins.win/raw?url=';

const INITIAL_LIMIT = 18;

export default function App() {
  const [xmlText, setXmlText] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [sortBy, setSortBy] = useState('capability'); // 'capability' | 'output'
  const [viewMode, setViewMode] = useState('facility'); // 'facility' | 'generator'
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'visual'

  // Live vs Historical Archive State
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [availableDates, setAvailableDates] = useState([]);
  const [versionsByDateMap, setVersionsByDateMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVersion, setSelectedVersion] = useState(1);
  const [nextRefreshTimeStr, setNextRefreshTimeStr] = useState('');

  // Load historical reports directory index
  useEffect(() => {
    fetchAvailableReportsIndex().then(({ dates, versionsByDate }) => {
      if (dates && dates.length > 0) {
        setAvailableDates(dates);
        setVersionsByDateMap(versionsByDate);

        const latestDate = dates[0];
        setSelectedDate(latestDate);

        const versions = versionsByDate[latestDate] || [1];
        if (versions.length > 0) {
          setSelectedVersion(versions[0]);
        }
      }
    }).catch(err => console.warn('Directory index fetch error:', err));
  }, []);

  // Update available versions when selected date changes
  const handleSelectDate = (newDate) => {
    setSelectedDate(newDate);
    const versions = versionsByDateMap[newDate] || [1];
    if (versions.length > 0) {
      setSelectedVersion(versions[0]);
    }
  };

  // Fetch report XML (live or historical) via server API route
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let filename = 'PUB_GenOutputCapability.xml';
    if (!isLiveMode && selectedDate && selectedVersion) {
      filename = buildReportFilename(selectedDate, selectedVersion);
    }

    const apiTargetUrl = `${API_GENERATION_ENDPOINT}?filename=${encodeURIComponent(filename)}`;
    const fallbackDirect = `https://reports-public.ieso.ca/public/GenOutputCapability/${filename}`;

    let fetchedXml = null;

    try {
      const response = await fetch(apiTargetUrl, { cache: 'no-cache' });
      if (response.ok) {
        fetchedXml = await response.text();
      }
    } catch (err1) {
      console.warn('Backend API proxy fetch failed, trying direct URL fallback...', err1);
    }

    if (!fetchedXml) {
      try {
        const response = await fetch(fallbackDirect, { cache: 'no-cache' });
        if (response.ok) {
          fetchedXml = await response.text();
        }
      } catch (err2) {
        console.warn('Direct fetch failed, trying CORS proxy fallback...', err2);
      }
    }

    if (!fetchedXml) {
      try {
        const response = await fetch(CORS_PROXY_BASE + encodeURIComponent(fallbackDirect));
        if (response.ok) {
          fetchedXml = await response.text();
        }
      } catch (err3) {
        console.warn('CORS proxy fetch failed...', err3);
      }
    }

    if (fetchedXml) {
      setXmlText(fetchedXml);
      try {
        const parsed = parseIesoXml(fetchedXml, null, sortBy);
        setData(parsed);
        setLastRefreshed(new Date());
      } catch (parseErr) {
        setError('Failed to parse IESO report: ' + parseErr.message);
      }
    } else {
      setError(`Unable to load ${isLiveMode ? 'live' : 'archive'} report XML from server API.`);
    }

    setIsLoading(false);
  }, [isLiveMode, selectedDate, selectedVersion, sortBy]);

  // Re-fetch when report selection parameters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // XX:20 Auto-Refresh Timer Scheduling (Runs only in Live Mode)
  useEffect(() => {
    if (!isLiveMode) {
      setNextRefreshTimeStr('');
      return;
    }

    const msUntilNext20 = getMsUntilNext20Past();
    const nextRefreshDate = new Date(Date.now() + msUntilNext20);
    const nextTimeString = nextRefreshDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    setNextRefreshTimeStr(nextTimeString);

    const timer = setTimeout(() => {
      console.log('XX:20 scheduled auto-refresh triggered.');
      fetchReport();
    }, msUntilNext20);

    return () => clearTimeout(timer);
  }, [isLiveMode, lastRefreshed, fetchReport]);

  // Re-parse data when sortBy changes
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    if (xmlText) {
      try {
        const parsed = parseIesoXml(xmlText, null, newSortBy);
        setData(parsed);
      } catch (err) {
        console.error('Failed to sort data:', err);
      }
    }
  };

  const toggleSectionExpand = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const currentAvailableVersions = versionsByDateMap[selectedDate] || [1];

  return (
    <div class="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <div class="max-w-6xl mx-auto px-4 py-2">
        {/* Top Header Bar */}
        <Header
          createdAt={data?.createdAt}
          lastRefreshed={lastRefreshed}
          isRefreshing={isLoading}
          onRefresh={fetchReport}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode)}
          isLiveMode={isLiveMode}
          onToggleLiveMode={(live) => setIsLiveMode(live)}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          selectedVersion={selectedVersion}
          onSelectVersion={(v) => setSelectedVersion(v)}
          availableDates={availableDates}
          availableVersions={currentAvailableVersions}
          nextRefreshTimeStr={nextRefreshTimeStr}
        />

        {/* Tab Navigation Bar: Summary vs Visualization */}
        <TabBar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

        {/* Error Notification */}
        {error && (
          <div class="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded mb-3 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <AlertTriangle class="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchReport}
              class="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded font-medium text-[11px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !data && (
          <div class="flex flex-col items-center justify-center py-12 gap-2">
            <RefreshCw class="w-6 h-6 text-blue-600 animate-spin" />
            <p class="text-slate-500 text-xs font-medium">Loading generation summary...</p>
          </div>
        )}

        {/* Loaded Data View */}
        {data && (
          <>
            {/* Tab 1: Summary List / Table View */}
            {activeTab === 'summary' && (
              <main class="space-y-4">
                {data.sections.map((section) => {
                  const isNuclear = section.key === SECTION_KEYS.NUCLEAR;
                  const isExpanded = !!expandedSections[section.key];
                  const facilities = section.facilities || [];

                  if (viewMode === 'generator') {
                    // Generator View: Gather all individual units for this fuel section
                    const allUnits = [];
                    facilities.forEach(fac => {
                      (fac.units || []).forEach(unit => {
                        allUnits.push(unit);
                      });
                    });

                    // Sort units according to sortBy selector
                    allUnits.sort((a, b) => {
                      if (sortBy === 'output') {
                        if (b.outputMW !== a.outputMW) return b.outputMW - a.outputMW;
                        return b.capabilityMW - a.capabilityMW;
                      }
                      return b.capabilityMW - a.capabilityMW;
                    });

                    const hasMore = allUnits.length > INITIAL_LIMIT;
                    const visibleUnits = (hasMore && !isExpanded)
                      ? allUnits.slice(0, INITIAL_LIMIT)
                      : allUnits;

                    return (
                      <section key={section.key}>
                        <SectionHeader section={section} viewMode="generator" />

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3.5 gap-y-1.5">
                          {visibleUnits.length > 0 ? (
                            visibleUnits.map((unit) => (
                              <GeneratorCard key={unit.genName} unit={unit} />
                            ))
                          ) : (
                            <div class="py-2 text-slate-400 text-xs italic">
                              No generators reported for {section.title} generation.
                            </div>
                          )}
                        </div>

                        {hasMore && (
                          <div class="mt-1.5 pt-0.5 text-center">
                            <button
                              onClick={() => toggleSectionExpand(section.key)}
                              class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium py-0.5 px-2.5 rounded hover:bg-blue-50 transition-colors"
                            >
                              <span>
                                {isExpanded
                                  ? 'Show top 18'
                                  : `Show all ${allUnits.length} ${section.title.toLowerCase()} generators`}
                              </span>
                              {isExpanded ? <ChevronUp class="w-3.5 h-3.5" /> : <ChevronDown class="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </section>
                    );
                  }

                  // Facility View: Aggregate by facility
                  const hasMore = facilities.length > INITIAL_LIMIT;
                  const visibleFacilities = (hasMore && !isExpanded)
                    ? facilities.slice(0, INITIAL_LIMIT)
                    : facilities;

                  const gridLayoutClass = isNuclear
                    ? "divide-y divide-slate-100"
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3.5 gap-y-1.5";

                  return (
                    <section key={section.key}>
                      <SectionHeader section={section} viewMode="facility" />

                      <div class={gridLayoutClass}>
                        {visibleFacilities.length > 0 ? (
                          visibleFacilities.map((facility) => (
                            <FacilityCard key={facility.name} facility={facility} />
                          ))
                        ) : (
                          <div class="py-2 text-slate-400 text-xs italic">
                            No facilities reported for {section.title} generation.
                          </div>
                        )}
                      </div>

                      {hasMore && (
                        <div class="mt-1.5 pt-0.5 text-center">
                          <button
                            onClick={() => toggleSectionExpand(section.key)}
                            class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium py-0.5 px-2.5 rounded hover:bg-blue-50 transition-colors"
                          >
                            <span>
                              {isExpanded
                                ? 'Show top 18'
                                : `Show all ${facilities.length} ${section.title.toLowerCase()} facilities`}
                            </span>
                            {isExpanded ? <ChevronUp class="w-3.5 h-3.5" /> : <ChevronDown class="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </section>
                  );
                })}
              </main>
            )}

            {/* Tab 2: Unified Visualization Ranking Chart View */}
            {activeTab === 'visual' && (
              <main class="py-1">
                <Visualization
                  data={data}
                  viewMode={viewMode}
                  onViewModeChange={(mode) => setViewMode(mode)}
                />
              </main>
            )}

            {/* Tab 3: Outages Summary View */}
            {activeTab === 'outages' && (
              <main class="py-1">
                <OutagesSummary data={data} />
              </main>
            )}

            {/* Tab 4: Unified Outage Visualization Ranking View */}
            {activeTab === 'outage_visual' && (
              <main class="py-1">
                <OutageVisualization
                  data={data}
                  viewMode={viewMode}
                  onViewModeChange={(mode) => setViewMode(mode)}
                />
              </main>
            )}
          </>
        )}

        {/* Minimal Footer */}
        <footer class="mt-8 pt-3 border-t border-slate-200 text-center text-[11px] text-slate-400">
          <p>IESO Ontario Generation Summary • Public Report</p>
        </footer>
      </div>
    </div>
  );
}
