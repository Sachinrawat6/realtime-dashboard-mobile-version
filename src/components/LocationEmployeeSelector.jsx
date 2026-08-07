import React, { useEffect, useState } from 'react';
import { FaUser, FaMapMarkerAlt, FaListOl, FaExclamationTriangle } from 'react-icons/fa';
import { calculatePerHourAverage } from '../utils/stats';

const RAPID_SCAN_WINDOW_MS = 60 * 1000;

function LocationEmployeeSelector({ groupedData, employeeScans }) {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Auto-select first location
    const locations = Object.keys(groupedData);
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0]);
    }
  }, [groupedData]);

  useEffect(() => {
    // Update employees when location changes
    if (selectedLocation && groupedData[selectedLocation]) {
      const locationEmployees = Object.keys(groupedData[selectedLocation]);
      setEmployees(locationEmployees);
      if (locationEmployees.length > 0 && !selectedEmployee) {
        setSelectedEmployee(locationEmployees[0]);
      }
    } else {
      setEmployees([]);
      setSelectedEmployee('');
    }
  }, [selectedLocation, groupedData]);

  const currentEmployeeData =
    selectedLocation && selectedEmployee ? groupedData[selectedLocation]?.[selectedEmployee] : null;
  const currentEmployeeScans =
    selectedLocation && selectedEmployee ? employeeScans[selectedLocation]?.[selectedEmployee] : [];

  // Get unique scans by orderId
  const uniqueScans = currentEmployeeScans.filter(
    (scan, index, self) => index === self.findIndex((s) => s.orderId === scan.orderId)
  );

  const perHourAvg = currentEmployeeData
    ? calculatePerHourAverage(
        currentEmployeeData.firstTime,
        currentEmployeeData.lastTime,
        currentEmployeeData.orderIds.size
      )
    : '0.0';

  const isReturnChecking = selectedLocation?.toLowerCase().includes('return checking');

  // Flag order IDs whose scan happened within 1 minute of the previous scan
  // (rapid/back-to-back scanning at the Return Checking station).
  const rapidScanOrderIds = new Set();
  if (isReturnChecking) {
    const scansAscending = [...uniqueScans].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    for (let i = 1; i < scansAscending.length; i++) {
      const diff =
        new Date(scansAscending[i].timestamp) - new Date(scansAscending[i - 1].timestamp);
      if (diff <= RAPID_SCAN_WINDOW_MS) {
        rapidScanOrderIds.add(scansAscending[i].orderId);
        rapidScanOrderIds.add(scansAscending[i - 1].orderId);
      }
    }
  }

  return (
    <div className="h-full bg-white p-3 sm:p-4 overflow-auto">
      <div className="container mx-auto">
        {/* Dropdown Selectors */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Location Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-500" />
                Select Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setSelectedEmployee('');
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a location</option>
                {Object.keys(groupedData).map((location) => (
                  <option key={location} value={location}>
                    {location} ({Object.keys(groupedData[location] || {}).length} employees)
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaUser className="text-green-500" />
                Select Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={!selectedLocation}
              >
                <option value="">Choose an employee</option>
                {employees.map((employee) => (
                  <option key={employee} value={employee}>
                    {employee}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Employee Data */}
        {currentEmployeeData && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaListOl className="text-blue-600" />
                Recent Scans ({uniqueScans.length})
              </h3>
              <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                Avg: {perHourAvg}/hr
              </span>
            </div>

            {isReturnChecking && rapidScanOrderIds.size > 0 && (
              <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-xs sm:text-sm text-red-700">
                <FaExclamationTriangle />
                <span className="font-semibold">{rapidScanOrderIds.size} rows</span>
                &nbsp;in red were scanned within 1 minute of the previous scan
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Style
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Scan Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uniqueScans
                    ?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    ?.map((scan, index) => {
                      const isRapidScan = rapidScanOrderIds.has(scan.orderId);
                      return (
                        <tr
                          key={index}
                          className={`transition-colors duration-150 border-b border-gray-100 ${
                            isRapidScan ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm font-medium ${isRapidScan ? 'text-red-700' : 'text-gray-900'}`}
                            >
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm font-mono font-semibold ${isRapidScan ? 'text-red-700' : 'text-gray-900'}`}
                            >
                              {scan.orderId}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm ${isRapidScan ? 'text-red-600' : 'text-gray-600'}`}
                            >
                              {scan.styleNumber}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm ${isRapidScan ? 'text-red-600 font-semibold' : 'text-gray-500'}`}
                            >
                              {scan.scannedTime}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {uniqueScans.length === 0 && (
              <div className="text-center py-12">
                <FaListOl className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No scan records found</p>
              </div>
            )}
          </div>
        )}

        {!currentEmployeeData && selectedLocation && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Please select an employee to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationEmployeeSelector;
