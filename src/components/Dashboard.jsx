import React, { useCallback, useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { unlockAudio } from '../utils/sound';
import { unlockSpeech } from '../utils/speech';
import TailorCuttingStats from './TailorCuttingStats';
import LocationEmployeeSelector from './LocationEmployeeSelector';
import TopEmployeesStats from './TopEmployeeStats';

import Navbar from './Navbar';
import ProductPage from './ProductPage';
import PicklistDashboardPage from '../pages/PicklistDashboardPage';

const SCAN_API = 'https://realtime-backend-673j.onrender.com/api/scan';
const todayStr = () => new Date().toISOString().split('T')[0];

function Dashboard() {
  const [rows, setRows] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [employeeScans, setEmployeeScans] = useState({});
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [styleDetails, setStyleDetails] = useState([]);

  // Date filter for /api/scan: 'today' (live), 'single' (one date), 'range' (start-end)
  const [dateFilterMode, setDateFilterMode] = useState('today');
  const [singleDate, setSingleDate] = useState(todayStr());
  const [rangeStart, setRangeStart] = useState(todayStr());
  const [rangeEnd, setRangeEnd] = useState(todayStr());
  const [isLoadingScans, setIsLoadingScans] = useState(false);

  // Unlock audio playback on first user interaction so later
  // websocket-triggered sounds play reliably (browsers block
  // autoplay until a user gesture has occurred).
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
      unlockSpeech();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Process scan data function
  const processEmployeeScans = (data) => {
    const scans = {};
    data.forEach((item) => {
      const location = item.locations?.name || 'Unknown Location';
      const employee = item.employees?.user_name || 'Unknown Employee';
      const orderId = item.order_id;
      const styleNumber = item?.orders_2?.style_number || 'N/A';
      const timestamp = item.scanned_timestamp;

      if (!scans[location]) scans[location] = {};
      if (!scans[location][employee]) scans[location][employee] = [];

      scans[location][employee].push({
        orderId,
        styleNumber,
        timestamp,
        scannedTime: new Date(timestamp).toLocaleTimeString(),
      });
    });

    Object.keys(scans).forEach((location) => {
      Object.keys(scans[location]).forEach((employee) => {
        scans[location][employee].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
    });

    return scans;
  };

  // Group data function
  const calculateGroups = (data) => {
    const groups = {};
    data.forEach((item) => {
      const location = item.locations?.name || 'Unknown Location';
      const employee = item.employees?.user_name || 'Unknown Employee';
      const orderId = item.order_id;
      const time = item.scanned_timestamp;

      if (!groups[location]) groups[location] = {};
      if (!groups[location][employee]) {
        groups[location][employee] = {
          orderIds: new Set(),
          firstTime: time,
          lastTime: time,
        };
      }

      groups[location][employee].orderIds.add(orderId);

      if (new Date(time) < new Date(groups[location][employee].firstTime)) {
        groups[location][employee].firstTime = time;
      }
      if (new Date(time) > new Date(groups[location][employee].lastTime)) {
        groups[location][employee].lastTime = time;
      }
    });
    return groups;
  };

  // Track recent updates
  const trackUpdates = (newRows) => {
    const updates = [];
    newRows.forEach((row) => {
      const location = row.locations?.name || 'Unknown Location';
      const employee = row.employees?.user_name || 'Unknown Employee';
      if (
        location.toLowerCase().includes('tailor scan 2') ||
        location.toLowerCase().includes('cutting') ||
        location.toLowerCase().includes('master') ||
        location.toLowerCase().includes('kharcha')
      ) {
        updates.push({ location, employee, timestamp: new Date() });
      }
    });
    return updates;
  };

  // Build the /api/scan URL for the current date filter
  const buildScanUrl = useCallback(() => {
    if (dateFilterMode === 'range' && rangeStart && rangeEnd) {
      // Backend filters with `endDate` as an exclusive upper bound
      // (scanned_timestamp < endDate 00:00:00), which would silently drop
      // every scan on the selected end date. Send the day after instead so
      // the whole end date is included.
      const endExclusive = new Date(rangeEnd);
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
      const endDateParam = endExclusive.toISOString().split('T')[0];

      return `${SCAN_API}?startDate=${rangeStart}&endDate=${endDateParam}`;
    }
    if (dateFilterMode === 'single' && singleDate) {
      return `${SCAN_API}?date=${singleDate}`;
    }
    return SCAN_API;
  }, [dateFilterMode, singleDate, rangeStart, rangeEnd]);

  // LOAD SCAN DATA (re-runs whenever the date filter changes)
  useEffect(() => {
    setIsLoadingScans(true);
    fetch(buildScanUrl())
      .then((res) => res.json())
      .then((data) => {
        setRows(data.data);
        setGroupedData(calculateGroups(data.data));
        setEmployeeScans(processEmployeeScans(data.data));
      })
      .catch((err) => console.error('Failed to load scan data:', err))
      .finally(() => setIsLoadingScans(false));
  }, [buildScanUrl]);

  // REALTIME UPDATES (only relevant while viewing today's live data)
  useEffect(() => {
    const handleNewData = (newRows) => {
      if (dateFilterMode !== 'today') return;

      // set style details
      setStyleDetails(newRows);
      // Track which employees are being updated
      const newUpdates = trackUpdates(newRows);
      if (newUpdates.length > 0) {
        setRecentUpdates(newUpdates);

        // Clear updates after 2 seconds
        setTimeout(() => {
          setRecentUpdates((prev) =>
            prev.filter((update) => new Date() - new Date(update.timestamp) < 2000)
          );
        }, 2000);
      }

      // Update main data
      const updated = [...newRows, ...rows];
      setRows(updated);
      setGroupedData(calculateGroups(updated));
      setEmployeeScans(processEmployeeScans(updated));
    };

    socket.on('new-data', handleNewData);
    return () => socket.off('new-data', handleNewData);
  }, [rows, dateFilterMode]);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 0:
        return (
          <TailorCuttingStats
            groupedData={groupedData}
            employeeScans={employeeScans}
            recentUpdates={recentUpdates}
            productDetails={styleDetails}
          />
        );
      case 1:
        return <LocationEmployeeSelector groupedData={groupedData} employeeScans={employeeScans} />;
      case 2:
        return <TopEmployeesStats groupedData={groupedData} />;
      case 3:
        return <PicklistDashboardPage />;
      default:
        return (
          <TailorCuttingStats
            groupedData={groupedData}
            employeeScans={employeeScans}
            recentUpdates={recentUpdates}
            productDetails={styleDetails}
          />
        );
    }
  };

  const today = todayStr();

  return (
    <div className="h-screen bg-gray-900 overflow-hidden flex flex-col">
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Date Filter Bar (Picklist Report tab has its own date picker) */}
      {activeTab !== 3 && (
        <div className="bg-gray-800 border-b border-gray-700 px-2 py-2 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setDateFilterMode('today')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
                  dateFilterMode === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Today (Live)
              </button>
              <button
                onClick={() => setDateFilterMode('single')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
                  dateFilterMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Pick Date
              </button>
              <button
                onClick={() => setDateFilterMode('range')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
                  dateFilterMode === 'range'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Date Range
              </button>
            </div>

            {dateFilterMode === 'today' && (
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live updates on
              </span>
            )}

            {dateFilterMode === 'single' && (
              <input
                type="date"
                value={singleDate}
                max={today}
                onChange={(e) => setSingleDate(e.target.value)}
                className="border border-gray-600 bg-gray-900 text-white rounded-lg px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {dateFilterMode === 'range' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={rangeStart}
                  max={rangeEnd || today}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="border border-gray-600 bg-gray-900 text-white rounded-lg px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  value={rangeEnd}
                  min={rangeStart}
                  max={today}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="border border-gray-600 bg-gray-900 text-white rounded-lg px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {isLoadingScans && <span className="text-[11px] sm:text-xs text-gray-400">Loading…</span>}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{renderActiveComponent()}</div>
    </div>
  );
}

export default Dashboard;
