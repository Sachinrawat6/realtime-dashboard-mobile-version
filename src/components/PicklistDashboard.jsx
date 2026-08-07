import axios from 'axios';
import React, { useState, useMemo, useEffect } from 'react';

const ProfessionalDashboard = ({ reportData }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [summary, setSummary] = useState({});

    if (!reportData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    const fetchEmployees = async () => {
        try {
            const reponse = await axios.get("https://fastapi.qurvii.com/getUsers");
            setUsers(reponse?.data?.data);
        } catch (error) {
            console.log("Failed to fetch employee records error :: ", error);

        }
    }

    useEffect(() => {
        fetchEmployees();
    }, []);

    const generateSummaryReport = () => {
        const firstAttemptMap = {};
        const secondAttemptMap = {};
        const employeeSummary = {};  // FINAL COMBINED SUMMARY

        reportData.picklistReport.forEach(emp => {
            const empId1 = emp.firstAttemptEmployeeId ?? 0;
            const empId2 = emp.secondAttemptEmployeeId ?? 0;

            const expected = emp.expectedToFound ?? 0;
            const firstFound = emp.actualFoundFirstAttempt ?? 0;
            const secondFound = emp.actualFoundSecondAttempt ?? 0;

            const remaining = expected - firstFound;

            // -------------------------------------
            // FIRST ATTEMPT — PICKLIST WISE
            // -------------------------------------
            let firstEfficiency = 0;
            if (expected > 0) firstEfficiency = (firstFound / expected) * 100;

            firstAttemptMap[emp.picklist_id] = {
                emp_id: empId1,
                total_expected_found: expected,
                total_found: firstFound,
                efficiency: Number(firstEfficiency.toFixed(2)),
                remaining_to_found: remaining
            };

            // -------------------------------------
            // FIRST ATTEMPT — EMPLOYEE WISE GROUPING
            // -------------------------------------
            if (!employeeSummary[empId1]) {
                employeeSummary[empId1] = {
                    emp_id: empId1,
                    first: {
                        total_expected: 0,
                        total_found: 0,
                        efficiency: 0
                    },
                    second: {
                        total_records: 0,
                        total_found: 0,
                        total_remaining: 0,
                        efficiency: 0
                    }
                };
            }

            employeeSummary[empId1].first.total_expected += expected;
            employeeSummary[empId1].first.total_found += firstFound;

            // -------------------------------------
            // SECOND ATTEMPT — PICKLIST WISE
            // -------------------------------------
            if (emp.secondAttemptEmployeeId) {
                let secondEfficiency = 0;

                if (remaining > 0) {
                    secondEfficiency = (secondFound / remaining) * 100;
                }

                secondAttemptMap[emp.picklist_id] = {
                    emp_id: empId2,
                    second_attempt_found: secondFound,
                    remaining_for_found: remaining,
                    efficiency: Number(secondEfficiency.toFixed(2))
                };

                // -------------------------------------
                // SECOND ATTEMPT — EMPLOYEE WISE GROUPING
                // -------------------------------------
                if (!employeeSummary[empId2]) {
                    employeeSummary[empId2] = {
                        emp_id: empId2,
                        first: {
                            total_expected: 0,
                            total_found: 0,
                            efficiency: 0
                        },
                        second: {
                            total_records: 0,
                            total_found: 0,
                            total_remaining: 0,
                            efficiency: 0
                        }
                    };
                }

                employeeSummary[empId2].second.total_records += 1;
                employeeSummary[empId2].second.total_found += secondFound;
                employeeSummary[empId2].second.total_remaining += remaining;
            }
        });

        // -------------------------------------
        // FINAL EFFICIENCY CALCULATION
        // -------------------------------------
        Object.values(employeeSummary).forEach(emp => {
            // FIRST ATTEMPT
            if (emp.first.total_expected > 0) {
                emp.first.efficiency = Number(
                    ((emp.first.total_found / emp.first.total_expected) * 100).toFixed(2)
                );
            } else emp.first.efficiency = 0;

            // SECOND ATTEMPT — USING NEW FORMULA
            if (emp.second.total_remaining > 0) {
                emp.second.efficiency = Number(
                    ((emp.second.total_found / emp.second.total_remaining) * 100).toFixed(2)
                );
            } else emp.second.efficiency = 0;
        });

        setSummary({
            firstAttemptMap,
            secondAttemptMap,
            employeeSummary
        });
    };

    useEffect(() => {
        generateSummaryReport();
    }, []);


    const getUserName = (id) => {
        return users.find((u) => u.id === Number(id))?.user_name?.split(" / ")[0] || "unknown user";
    }

    const { picklistReport, firstAttemptEmployeeSummary, secondAttemptEmployeeSummary } = reportData;

    // Calculate overall metrics
    const overallMetrics = useMemo(() => {
        const totalPicklists = picklistReport?.length;
        const totalExpected = picklistReport.reduce((sum, item) => sum + item.expectedToFound, 0);
        const totalFirstFound = picklistReport.reduce((sum, item) => sum + item.actualFoundFirstAttempt, 0);
        const totalSecondFound = picklistReport.reduce((sum, item) => sum + item.actualFoundSecondAttempt, 0);
        const avgFirstEfficiency = picklistReport.reduce((sum, item) => sum + item.efficiencyFirstAttempt, 0) / totalPicklists;
        const avgSecondEfficiency = picklistReport.reduce((sum, item) => sum + item.efficiencySecondAttempt, 0) / totalPicklists;

        return {
            totalPicklists,
            totalExpected,
            totalFirstFound,
            totalSecondFound,
            avgFirstEfficiency: avgFirstEfficiency || 0,
            avgSecondEfficiency: avgSecondEfficiency || 0,
            totalEmployees: firstAttemptEmployeeSummary.length + secondAttemptEmployeeSummary.length
        };
    }, [picklistReport, firstAttemptEmployeeSummary, secondAttemptEmployeeSummary]);

    const MetricCard = ({ title, value, subtitle, trend, color = 'blue' }) => (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>

            </div>
        </div>
    );

    const EfficiencyBar = ({ value, label, color = 'blue' }) => (
        <div className="mb-4">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full bg-${color}-500`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">


            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
                    <nav className="flex space-x-4 sm:space-x-8 w-max min-w-full">
                        {['overview', 'picklists', 'first-attempt', 'second-attempt', "summary"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.replace('-', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard
                                title="Total Picklists"
                                value={overallMetrics.totalPicklists}
                                subtitle="Processed today"
                            />
                            <MetricCard
                                title="First Attempt Efficiency"
                                // value={overallMetrics.avgFirstEfficiency.toFixed(1) + '%'}
                                // value={((overallMetrics.totalFirstFound / overallMetrics.totalExpected) * 100).toFixed(2) || "0.00" + '%'}
                                value={
                                    (() => {
                                        try {
                                            const num = +overallMetrics.totalFirstFound || 0;
                                            const den = +overallMetrics.totalExpected || 0;

                                            if (den <= 0) return "0.00%";

                                            const result = ((num / den) * 100).toFixed(2);
                                            return isNaN(result) ? "0.00%" : result + '%';
                                        } catch {
                                            return "0.00%";
                                        }
                                    })()
                                }

                                subtitle="Average success rate"
                                trend={2.5}
                                color="green"
                            />
                            <MetricCard
                                title="Second Attempt Efficiency"
                                // value={overallMetrics.avgSecondEfficiency.toFixed(1) + '%'}
                                // value={((overallMetrics.totalSecondFound / (overallMetrics.totalExpected - overallMetrics.totalFirstFound)) * 100).toFixed(2) || "0.00" + '%'}
                                value={
                                    (() => {
                                        const denominator = (overallMetrics.totalExpected || 0) - (overallMetrics.totalFirstFound || 0);

                                        // Agar denominator 0 ya negative hai to 0.00% return karo
                                        if (denominator <= 0) {
                                            return "0.00%";
                                        }

                                        // Percentage calculate karo
                                        const numerator = overallMetrics.totalSecondFound || 0;
                                        const percentage = (numerator / denominator) * 100;

                                        // NaN check
                                        if (isNaN(percentage)) {
                                            return "0.00%";
                                        }

                                        return percentage.toFixed(2) + '%';
                                    })()
                                }
                                subtitle="Follow-up success rate"
                                trend={1.2}
                                color="blue"
                            />
                            <MetricCard
                                title="Total Employees"
                                value={overallMetrics.totalEmployees}
                                subtitle="Active workforce"
                            />
                        </div>

                        {/* Efficiency Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Distribution</h3>
                                <EfficiencyBar
                                    // value={overallMetrics.avgFirstEfficiency}
                                    // value={((overallMetrics.totalSecondFound / (overallMetrics.totalExpected - overallMetrics.totalFirstFound)) * 100).toFixed(2) || "0.00"}
                                    value={((overallMetrics.totalFirstFound / overallMetrics.totalExpected) * 100).toFixed(2) || "0.00" + '%'}
                                    label="First Attempt Efficiency"
                                    color="green"
                                />
                                <EfficiencyBar
                                    // value={overallMetrics.avgSecondEfficiency}
                                    // value={((overallMetrics.totalFirstFound / overallMetrics.totalExpected) * 100).toFixed(2) || "0.00" + '%'}
                                    value={((overallMetrics.totalSecondFound / (overallMetrics.totalExpected - overallMetrics.totalFirstFound)) * 100).toFixed(2) || "0.00"}
                                    label="Second Attempt Efficiency"
                                    color="blue"
                                />
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Found Items Breakdown</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">First Attempt Found</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {overallMetrics.totalFirstFound}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">Second Attempt Found</span>
                                        <span className="text-lg font-bold text-blue-600">
                                            {overallMetrics.totalSecondFound}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                        <span className="text-sm font-medium text-gray-900">Total Expected</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            {overallMetrics.totalExpected}

                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Picklists Tab */}
                {activeTab === 'picklists' && (
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Picklist Performance Details</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Picklist ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Channel
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expected
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            First Found
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Second Found
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            First Eff.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Second Eff.
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {picklistReport.map((picklist) => (
                                        <tr key={picklist.picklist_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {picklist.picklist_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {picklist.channel}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {picklist.expectedToFound}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {picklist.actualFoundFirstAttempt}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {picklist.actualFoundSecondAttempt}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${picklist.efficiencyFirstAttempt >= 80
                                                    ? 'bg-green-100 text-green-800'
                                                    : picklist.efficiencyFirstAttempt >= 60
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {picklist.efficiencyFirstAttempt}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${picklist.efficiencySecondAttempt >= 80
                                                    ? 'bg-green-100 text-green-800'
                                                    : picklist.efficiencySecondAttempt >= 60
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {picklist.efficiencySecondAttempt}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* First Attempt Tab */}
                {activeTab === 'first-attempt' && (
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">First Attempt Employee Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Picklists
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Records
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expected
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Found
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Alter
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Efficiency
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Channels
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {firstAttemptEmployeeSummary.map((employee) => (
                                        <tr key={employee.employee_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {getUserName(employee.employee_id)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.totalPicklists}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.totalRecords}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.totalExpectedToFound}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.totalFound}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.totalAlter}

                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.efficiency >= 80
                                                    ? 'bg-green-100 text-green-800'
                                                    : employee.efficiency >= 60
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {employee.efficiency}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {employee.channels.join(', ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Second Attempt Tab */}
                {activeTab === 'second-attempt' && (
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Second Attempt Employee Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Picklists
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Found
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Found
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Alter
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Channels
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {secondAttemptEmployeeSummary.map((employee) => (
                                        <tr key={employee.employee_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {/* {employee.employee_id} */}
                                                {getUserName(employee.employee_id)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.totalPicklists}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.totalRecords}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.totalFound}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {/* {employee.totalAlter} */}
                                                {employee.totalRecords - employee.totalFound}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {employee.channels.join(', ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* final summary */}
                {activeTab === 'summary' && (
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Employee Performance Summary</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            1st Attempt Expected
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            1st Attempt Found
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            1st Attempt Efficiency
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            1st Attempt Remaining
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            2nd Attempt Found
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            2nd Attempt Efficiency
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Final Effi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.values(summary.employeeSummary).map((emp, i) => (
                                        <tr key={`${emp.emp_id}-${i}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {getUserName(emp.emp_id)}
                                            </td>

                                            {/* First Attempt */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {emp.first?.total_expected ?? 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {emp.first?.total_found ?? 0}
                                            </td>
                                            <td
                                                className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${emp.first?.efficiency >= 80
                                                    ? 'text-green-600'
                                                    : emp.first?.efficiency >= 50
                                                        ? 'text-yellow-600'
                                                        : 'text-red-600'
                                                    }`}
                                            >
                                                {emp.first?.efficiency ?? 0}%
                                            </td>

                                            {/* Second Attempt */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {emp.second?.total_remaining ?? 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {emp.second?.total_found ?? 0}
                                            </td>
                                            <td
                                                className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${emp.second?.efficiency >= 80
                                                    ? 'text-green-600'
                                                    : emp.second?.efficiency >= 50
                                                        ? 'text-yellow-600'
                                                        : 'text-red-600'
                                                    }`}
                                            >
                                                {emp.second?.efficiency ?? 0}%
                                            </td>

                                            <td
                                                className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${emp.second?.efficiency >= 80
                                                    ? 'text-green-600'
                                                    : emp.second?.efficiency >= 50
                                                        ? 'text-yellow-600'
                                                        : 'text-red-600'
                                                    }`}
                                            >
                                                <span className='bg-gray-200 py-1 px-4 '>
                                                    {/* {(((emp.first?.total_found || 0) + (emp.second.total_found || 0)) / ((emp.first.total_expected + emp.second.total_remaining)) * 100) ?? 0} */}
                                                    {
                                                        (
                                                            (
                                                                (emp.first?.total_found || 0) +
                                                                (emp.second?.total_found || 0)
                                                            ) /
                                                            (
                                                                (emp.first?.total_expected || 0) +
                                                                (emp.second?.total_remaining || 0)
                                                            ) * 100
                                                        ).toFixed(2) + "%" || "0.00 %"
                                                    }


                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                        </div>
                    </div>
                )}



            </div>
        </div >
    );
};

export default ProfessionalDashboard;