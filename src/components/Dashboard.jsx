import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { unlockAudio } from '../utils/sound';
import { unlockSpeech } from '../utils/speech';
import TailorCuttingStats from './TailorCuttingStats';
import LocationEmployeeSelector from './LocationEmployeeSelector';
import TopEmployeesStats from './TopEmployeeStats';

import Navbar from './Navbar';
import ProductPage from './ProductPage';
import PicklistDashboardPage from '../pages/PicklistDashboardPage';

function Dashboard() {
  const [rows, setRows] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [employeeScans, setEmployeeScans] = useState({});
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [styleDetails, setStyleDetails] = useState([]);

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

  // INITIAL LOAD
  useEffect(() => {
    fetch('https://realtime-backend-673j.onrender.com/api/scan')
      // fetch("http://localhost:5000/api/scan")

      .then((res) => res.json())
      .then((data) => {
        setRows(data.data);
        setGroupedData(calculateGroups(data.data));
        setEmployeeScans(processEmployeeScans(data.data));
      });
  }, []);

  // REALTIME UPDATES
  useEffect(() => {
    const handleNewData = (newRows) => {
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
  }, [rows]);

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

  return (
    <div className="h-screen bg-gray-900 overflow-hidden flex flex-col">
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{renderActiveComponent()}</div>
    </div>
  );
}

export default Dashboard;
