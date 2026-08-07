import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FaTshirt, FaUser, FaCut, FaCrown, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import ProductPage from './ProductPage';
import { playNotificationSound } from '../utils/sound';
import { calculatePerHourAverage } from '../utils/stats';

function TailorCuttingStats({ groupedData, employeeScans, recentUpdates, productDetails }) {
  const [tailorData, setTailorData] = useState([]);
  const [cuttingData, setCuttingData] = useState([]);
  const [updatedEmployees, setUpdatedEmployees] = useState(new Set());
  const [isProductShow, setIsProductShow] = useState(false);
  const [locationSelector, setLocationSelector] = useState('tailor');
  const [currentStyleNumber, setCurrentStyleNumber] = useState('');
  const [scrollIndex, setScrollIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const tableContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  const employeeImages = {
    sudhan: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361766/sudhan_k5no1a.jpg',
    aslam: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288946/aslam_tqme8r.webp',
    nurul: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361765/nurul_fbkhoi.jpg',
    'sah mohammad miyan':
      'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288949/shan_xv4zcx.webp',
    'vikash kumar':
      'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361769/vikas_n4kwta.jpg',
    'rizwan mohammad':
      'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361766/rizwan_iipcjq.jpg',
    'subhash cutting master':
      'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361767/subhash_tfhx6k.jpg',
    shailendar:
      'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361766/shailendar_mdmwqq.jpg',
    mukhtar: 'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168202/mukhtar_dqciu4.jpg',
    mahesh: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288948/mahesh_jr3e2j.webp',
    'naimuddin ansari':
      'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168199/niamuddin_iyhh8r.jpg',
    ranjeet: 'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168199/niamuddin_iyhh8r.jpg',
    'mobarak miyo':
      'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361770/mubarak_kg8i4f.jpg',
    khurshid: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288947/khurshid_sosa9x.webp',
    nasim: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770448904/nasim_jqrqzx_fq1djl.jpg',
    qamaruddn:
      'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168200/qamaruddin_x2htlc.jpg',
    dilshad: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361764/dilshad_cuyrgt.jpg',
    surendra: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361767/surendar_teupip.jpg',
    samsul: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361765/samsul_frnxp0.jpg',
    inamul: 'https://res.cloudinary.com/der6k8zbm/image/upload/v1764168201/inamul_atsm3g.jpg',
    rampreet: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361770/rampreet_bnyrbx.jpg',
    'idrees miyan':
      'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770361766/idrish_k0i3zd.jpg',
    pooja: 'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288947/pooja_b17nmm.webp',
    'manish kumar':
      'https://res.cloudinary.com/dlqbbwdc5/image/upload/v1770288946/golu_rkbcoi.webp',
  };

  // Memoized duration calculation
  const calculateDuration = useCallback((firstTime, lastTime) => {
    if (!firstTime || !lastTime) return 'N/A';

    const first = new Date(firstTime);
    const last = new Date(lastTime);
    const diffMs = last - first;

    if (diffMs < 0) return 'Invalid';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Process data based on location selector
  useEffect(() => {
    const tailorArray = [];
    const cuttingArray = [];

    Object.entries(groupedData).forEach(([location, employees]) => {
      const loc = location.toLowerCase();

      Object.entries(employees).forEach(([employee, info]) => {
        const employeeData = {
          location,
          employee,
          orderCount: info.orderIds.size,
          duration: calculateDuration(info.firstTime, info.lastTime),
          perHourAvg: calculatePerHourAverage(info.firstTime, info.lastTime, info.orderIds.size),
          firstScan: info.firstTime,
          lastScan: info.lastTime,
          scanCount: employeeScans[location]?.[employee]?.length || 0,
        };

        const isTailor =
          loc.includes('tailor scan 2') ||
          loc.includes('cutting master') ||
          loc.includes('kharcha');
        const isCuttingMaster = loc.includes('cutting') || loc.includes('master');

        // Push to appropriate arrays based on location
        if (isTailor) tailorArray.push(employeeData);
        if (isCuttingMaster) cuttingArray.push(employeeData);
      });
    });

    // Sorting
    tailorArray.sort((a, b) => b.orderCount - a.orderCount);
    cuttingArray.sort((a, b) => b.orderCount - a.orderCount);

    setTailorData(tailorArray);
    setCuttingData(cuttingArray);
    setScrollIndex(0); // Reset scroll when data changes
  }, [groupedData, employeeScans, calculateDuration]);

  // Filter data based on location selector for display
  const getDisplayData = useCallback(() => {
    switch (locationSelector) {
      case 'tailor':
        return tailorData;
      case 'cutting master':
        return cuttingData;
      default:
        return [];
    }
  }, [locationSelector, tailorData, cuttingData]);

  // Auto-scroll functionality
  useEffect(() => {
    if (isPaused || isProductShow) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const startAutoScroll = () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }

      scrollIntervalRef.current = setInterval(() => {
        setScrollIndex((prevIndex) => {
          const displayData = getDisplayData();
          if (displayData.length <= 5) return 0; // No need to scroll if less than 5 items

          const nextIndex = prevIndex + 1;
          // Reset to 0 if we've reached the end
          return nextIndex >= displayData.length ? 0 : nextIndex;
        });
      }, 5000); // Scroll every 5 seconds
    };

    startAutoScroll();

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isPaused, isProductShow, getDisplayData]);

  // Handle recent updates with location filtering
  useEffect(() => {
    if (recentUpdates && recentUpdates.length > 0) {
      const newUpdatedEmployees = new Set();

      recentUpdates.forEach((update) => {
        const location = update.location.toLowerCase();
        const isTailorUpdate =
          location.includes('tailor scan 2') ||
          location.includes('cutting master') ||
          location.includes('master');
        const isCuttingUpdate = location.includes('cutting') || location.includes('master');

        // Only add to updates if it matches the current selector or no selector is set
        const shouldShowUpdate =
          (!locationSelector && (isTailorUpdate || isCuttingUpdate)) ||
          (locationSelector === 'tailor' && isTailorUpdate) ||
          (locationSelector === 'cutting master' && isCuttingUpdate);

        if (shouldShowUpdate) {
          const employeeKey = `${update.location}-${update.employee}`;
          newUpdatedEmployees.add(employeeKey);

          // Pause auto-scroll when update comes
          setIsPaused(true);

          // Resume auto-scroll after 5 seconds
          setTimeout(() => {
            setIsPaused(false);
          }, 5000);
        }
      });

      if (newUpdatedEmployees.size > 0) {
        setUpdatedEmployees(newUpdatedEmployees);
        setIsProductShow(true);

        // Set current style number from productDetails
        if (productDetails && productDetails[0]?.orders_2?.style_number) {
          setCurrentStyleNumber(productDetails[0].orders_2.style_number);
        }

        // Clear animation after 5 seconds
        const timer = setTimeout(() => {
          setUpdatedEmployees(new Set());
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [recentUpdates, locationSelector, productDetails]);

  const getRankBadge = useCallback((index) => {
    switch (index) {
      case 0:
        return {
          bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
          text: 'text-white',
          icon: <FaCrown className="text-sm" />,
          label: '1st',
        };
      case 1:
        return {
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: 'text-white',
          icon: <FaCrown className="text-sm" />,
          label: '2nd',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-orange-400 to-orange-500',
          text: 'text-white',
          icon: <FaCrown className="text-sm" />,
          label: '3rd',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          icon: null,
          label: `${index + 1}`,
        };
    }
  }, []);

  // Get visible data based on scroll index
  const getVisibleData = useCallback(() => {
    const displayData = getDisplayData();
    const itemsPerPage = 5; // Show 5 employees at a time

    if (displayData.length <= itemsPerPage) {
      return displayData;
    }

    // Get the next 5 items starting from scrollIndex
    const visibleData = [];
    for (let i = 0; i < itemsPerPage; i++) {
      const index = (scrollIndex + i) % displayData.length;
      visibleData.push(displayData[index]);
    }

    return visibleData;
  }, [getDisplayData, scrollIndex]);

  // Get style number for a specific employee
  const getStyleNumberForEmployee = useCallback(
    (employee, location, isUpdated) => {
      if (isUpdated && currentStyleNumber) {
        return currentStyleNumber;
      }
      return '_';
    },
    [currentStyleNumber]
  );

  // Manual scroll controls
  const scrollUp = () => {
    setScrollIndex((prevIndex) => {
      const displayData = getDisplayData();
      const newIndex = prevIndex - 1;
      return newIndex < 0 ? displayData.length - 1 : newIndex;
    });
  };

  const scrollDown = () => {
    setScrollIndex((prevIndex) => {
      const displayData = getDisplayData();
      const newIndex = prevIndex + 1;
      return newIndex >= displayData.length ? 0 : newIndex;
    });
  };

  // TableRow component with only 3 columns
  const TableRow = React.useCallback(
    ({ item, index, isUpdated }) => {
      const rankBadge = getRankBadge(index);
      const isTopThree = index < 3;
      const styleNumber = getStyleNumberForEmployee(item.employee, item.location, isUpdated);

      return (
        <tr
          className={`
            relative transition-all duration-300
            ${isTopThree && !isUpdated ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'hover:bg-gray-50'}
            ${isUpdated ? 'ring-2 ring-green-400 bg-green-500 ring-opacity-50' : ''}
          `}
        >
          {isUpdated && (
            <style>
              {`
                .row-highlight-${item.location.replace(/\s+/g, '-')}-${item.employee.replace(/\s+/g, '-')}::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(90deg,
                    rgba(34, 197, 94, 0.2) 0%,
                    rgba(34, 197, 94, 0.4) 50%,
                    rgba(34, 197, 94, 0.2) 100%);
                  animation: slideHighlight 4s ease-in-out forwards;
                  z-index: 0;
                  border-radius: 4px;
                }
              `}
            </style>
          )}

          {/* Employee Name Column */}
          <td className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 whitespace-nowrap relative z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-28 lg:h-28 2xl:w-40 2xl:h-40 shrink-0 overflow-hidden rounded-full flex items-center justify-center bg-blue-100 ring-2 ring-blue-300 ${
                  isUpdated ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <img
                  className="w-full h-full object-cover rounded-full"
                  src={employeeImages[item.employee?.split(' / ')[0].toLowerCase()]}
                  alt={item.employee?.split(' / ')[0]}
                />
              </div>
              <div className="min-w-0">
                <div
                  className={`text-xs sm:text-base md:text-2xl lg:text-4xl 2xl:text-7xl font-semibold truncate ${
                    isTopThree ? 'text-blue-800' : 'text-gray-900'
                  } ${isUpdated ? 'text-green-800 font-bold' : ''}`}
                >
                  {item.employee?.split(' / ')[0] && item.employee?.split(' / ')?.length > 1
                    ? item.employee?.split(' ')[0]
                    : item.employee?.split(' / ')[0]}
                  {isUpdated && (
                    <span className="ml-2 text-[9px] sm:text-xs bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="text-[10px] sm:text-sm md:text-lg lg:text-2xl 2xl:text-2xl font-bold text-gray-500 truncate">
                  {item.location?.split(' / ')[0]}
                </div>
              </div>
            </div>
          </td>

          {/* Style Number Column */}
          <td className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 whitespace-nowrap relative z-10">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs sm:text-base md:text-2xl lg:text-4xl 2xl:text-7xl font-bold ${
                  isUpdated
                    ? 'text-green-700 bg-green-100 px-2 py-1 sm:px-3 sm:py-2 rounded-lg animate-pulse'
                    : isTopThree
                      ? 'text-orange-800'
                      : 'text-gray-900'
                }`}
              >
                {styleNumber}
              </span>
            </div>
          </td>

          {/* Scan Count Column */}
          <td className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 whitespace-nowrap relative z-10">
            <div className="flex items-center justify-start">
              <span className="inline-flex items-center justify-center text-xs sm:text-base md:text-2xl lg:text-4xl 2xl:text-7xl font-bold">
                {item.orderCount}
              </span>
            </div>
          </td>

          {/* Avg/hr Column */}
          <td className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 whitespace-nowrap relative z-10">
            <div className="flex items-center justify-start">
              <span className="inline-flex items-center justify-center text-xs sm:text-base md:text-2xl lg:text-4xl 2xl:text-7xl font-bold text-indigo-700">
                {item.perHourAvg}
              </span>
            </div>
          </td>
        </tr>
      );
    },
    [getRankBadge, getStyleNumberForEmployee]
  );

  const Table = React.memo(({ title, data, icon, iconColor }) => {
    const visibleData = getVisibleData();
    const displayData = getDisplayData();
    const hasEnoughData = displayData.length > 5;

    return (
      <div className="bg-white rounded-2xl border border-gray-200 relative">
        {/* Scroll Controls */}
        {hasEnoughData && (
          <div className="absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-1.5 sm:gap-2 z-20">
            <button
              onClick={scrollUp}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="p-2 sm:p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-xs sm:text-base"
            >
              <FaChevronUp />
            </button>
            <button
              onClick={scrollDown}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="p-2 sm:p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-xs sm:text-base"
            >
              <FaChevronDown />
            </button>
          </div>
        )}

        {/* Auto-scroll Indicator */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2">
          <div
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}
          ></div>
          <span className="text-[10px] sm:text-xs text-gray-600">
            {isPaused ? 'Paused' : 'Auto-scrolling'}
          </span>
        </div>

        <div className="overflow-x-auto" ref={tableContainerRef}>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-left text-xs sm:text-sm md:text-lg lg:text-2xl 2xl:text-5xl font-bold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-left text-xs sm:text-sm md:text-lg lg:text-2xl 2xl:text-5xl font-bold text-gray-600 uppercase tracking-wider">
                  Style
                </th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-left text-xs sm:text-sm md:text-lg lg:text-2xl 2xl:text-5xl font-bold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-left text-xs sm:text-sm md:text-lg lg:text-2xl 2xl:text-5xl font-bold text-gray-600 uppercase tracking-wider">
                  Avg/hr
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleData.map((item, index) => (
                <TableRow
                  key={`${item.location}-${item.employee}-${scrollIndex + index}`}
                  item={item}
                  index={index}
                  isUpdated={updatedEmployees.has(`${item.location}-${item.employee}`)}
                />
              ))}
            </tbody>
          </table>

          {visibleData.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-5xl mb-4">📊</div>
              <p className="text-gray-500 text-lg">No data available</p>
              <p className="text-gray-400 text-sm mt-2">
                Select a different location or check back later
              </p>
            </div>
          )}

          {/* Scroll Progress Indicator */}
          {hasEnoughData && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {scrollIndex + 1} to {Math.min(scrollIndex + 5, displayData.length)} of{' '}
                  {displayData.length} employees
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(10, Math.ceil(displayData.length / 5)) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          Math.floor(scrollIndex / 5) === i ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      ></div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  });

  // Handle product page display
  useEffect(() => {
    if (isProductShow) {
      playNotificationSound();

      const timer = setTimeout(() => {
        setIsProductShow(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isProductShow]);

  if (isProductShow) {
    return <ProductPage data={productDetails} />;
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 overflow-auto">
      {/* Global CSS for animation */}
      <style>
        {`
          @keyframes slideHighlight {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            20% {
              transform: translateX(-50%);
              opacity: 0.5;
            }
            50% {
              transform: translateX(0%);
              opacity: 0.8;
            }
            80% {
              transform: translateX(50%);
              opacity: 0.5;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>

      {/* Display Tables */}
      {!locationSelector ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Table
            title="Cutting Master"
            data={cuttingData}
            icon={<FaCut className="text-3xl text-green-300" />}
            iconColor="bg-green-500/20"
          />
          <Table
            title="Tailor"
            data={tailorData}
            icon={<FaTshirt className="text-3xl text-blue-300" />}
            iconColor="bg-blue-500/20"
          />
        </div>
      ) : (
        <div className="w-full mx-auto">
          <Table
            title={locationSelector === 'cutting master' ? 'Cutting Master' : 'Tailor'}
            data={getDisplayData()}
            icon={
              locationSelector === 'cutting master' ? (
                <FaCut className="text-3xl text-green-300" />
              ) : (
                <FaTshirt className="text-3xl text-blue-300" />
              )
            }
            iconColor={locationSelector === 'cutting master' ? 'bg-green-500/20' : 'bg-blue-500/20'}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(TailorCuttingStats);
