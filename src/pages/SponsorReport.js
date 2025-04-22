import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SponsorReport.css';

const SponsorReport = () => {
  const navigate = useNavigate();
  const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';
  const [loginReports, setLoginReports] = useState([]);
  const [pointsReports, setPointsReports] = useState([]);
  const [applicationReports, setApplicationReports] = useState([]);
  const [commissionsReports, setCommissionsReports] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [reportType, setReportType] = useState('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [sponsorID, setSponsorID] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

  const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  const applicationStatusMap = useMemo(() => ({
    0: 'Rejected',
    1: 'Pending',
    2: 'Accepted',
    3: 'Removed'
  }), []);

  const commissionStatusMap = useMemo(() => ({
    0: 'Pending',
    1: 'Paid',
    2: 'Cancelled',
    3: 'Disputed'
  }), []);  

  const fetchLoginReports = useCallback(async (userType) => {
    if (!sponsorID) return;

    try {
      const response = await axios.get(`${REACT_APP_BASEURL}/reports/login/sponsor/${sponsorID}`);
      let data = response.data;

      if (userType === 'driver') {
        data = data.filter(report => report.AuditType.includes('Driver'));
      } else if (userType === 'sponsor') {
        data = data.filter(report => report.AuditType.includes('Sponsor'));
      }

      setLoginReports(data);
    } catch (error) {
      console.error('Error fetching login reports:', error);
    }
  }, [REACT_APP_BASEURL, sponsorID]);

  const fetchPointsReports = useCallback(async () => {
    if (!sponsorID) return;

    try {
      const response = await axios.post(`${REACT_APP_BASEURL}/reports/points`, {
        SponsorID: sponsorID
      });

      setPointsReports(response.data || []);
    } catch (error) {
      console.error('Error fetching points reports:', error);
    }
  }, [REACT_APP_BASEURL, sponsorID]);

  const fetchApplicationReports = useCallback(async () => {
    if (!sponsorID) return;

    try {
      const response = await axios.get(`${REACT_APP_BASEURL}/reports/applications/${sponsorID}`);
      setApplicationReports(response.data || []);
    } catch (error) {
      console.error('Error fetching applications report:', error);
    }
  }, [REACT_APP_BASEURL, sponsorID]);

  const fetchCommissionsReports = useCallback(async () => {
    if (!sponsorID) return;

    try {
      const response = await axios.get(`${REACT_APP_BASEURL}/reports/commission/${sponsorID}`);
      setCommissionsReports(response.data || []);
    } catch (error) {
      console.error('Error fetching commissions report:', error);
    }
  }, [REACT_APP_BASEURL, sponsorID]);

  useEffect(() => {
    const fetchSponsorDetails = async () => {
      if (!storedUser || !storedUser.username) {
        console.error("No user found in local storage.");
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/get-sponsor-details/${storedUser.username}`);
        if (response.data.success) {
          setSponsorID(response.data.sponsorID);
        } else {
          console.error("Failed to fetch sponsor details:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching sponsor details:", error);
      }
    };

    fetchSponsorDetails();
  }, [storedUser, navigate, REACT_APP_BASEURL]);

  useEffect(() => {
    if (!sponsorID) return;

    if (reportType === 'login') {
      fetchLoginReports(activeTab);
    } else if (reportType === 'points') {
      fetchPointsReports();
    } else if (reportType === 'applications') {
      fetchApplicationReports();
    } else if (reportType === 'commissions') {
      fetchCommissionsReports();
    }
  }, [sponsorID, reportType, activeTab, fetchLoginReports, fetchPointsReports, fetchApplicationReports, fetchCommissionsReports]);

  const filteredLoginReports = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return loginReports
      .filter(report => 
        (report.UserID && report.UserID.toString().includes(term)) ||
        (report.Username && report.Username.toLowerCase().includes(term)) ||
        (report.AuditType && report.AuditType.toLowerCase().includes(term)) ||
        (report.AuditDetails && report.AuditDetails.toLowerCase().includes(term)) ||
        (report.UserFName && report.UserFName.toLowerCase().includes(term)) ||
        (report.UserLName && report.UserLName.toLowerCase().includes(term))
      )
      .sort((a, b) => new Date(b.AuditLogDate) - new Date(a.AuditLogDate));
  }, [loginReports, searchTerm]);
  
  const filteredPointsReports = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return pointsReports
      .filter(report =>
        (report.UserID && report.UserID.toString().includes(term)) ||
        (report.UserFName && report.UserFName.toLowerCase().includes(term)) ||
        (report.UserLName && report.UserLName.toLowerCase().includes(term)) ||
        (report.TransactionReason && report.TransactionReason.toLowerCase().includes(term))
      )
      .sort((a, b) => new Date(b.TransactionDate) - new Date(a.TransactionDate));
  }, [pointsReports, searchTerm]);

  const getApplicationStatusText = useCallback((statusCode) => {
    return applicationStatusMap[statusCode] || 'Unknown';
  }, [applicationStatusMap]);
  
  const filteredApplicationReports = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return applicationReports.filter(report =>
      (report.UserID && report.UserID.toString().includes(term)) ||
      (report.Username && report.Username.toLowerCase().includes(term)) ||
      (report.UserFName && report.UserFName.toLowerCase().includes(term)) ||
      (report.UserLName && report.UserLName.toLowerCase().includes(term)) ||
      (getApplicationStatusText(report.DriverStatus).toLowerCase().includes(term))
    );
  }, [applicationReports, searchTerm, getApplicationStatusText]);

  const getCommissionStatusText = useCallback((statusCode) => {
    return commissionStatusMap[statusCode] || 'Unknown';
  }, [commissionStatusMap]);  

  const filteredCommissionsReports = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return commissionsReports.filter(report =>
      (report.CommissionID && report.CommissionID.toString().includes(term)) ||
      (report.CommissionAmount && report.CommissionAmount.toString().includes(term)) ||
      (getCommissionStatusText(report.CommissionStatus).toLowerCase().includes(term))
    );
  }, [commissionsReports, searchTerm, getCommissionStatusText]);
  
  const handleDownloadCSV = async () => {
    if (!sponsorID || isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      let reportEndpoint = '';
      let requestData = { SponsorID: sponsorID };
      
      if (reportType === 'login') {
        reportEndpoint = 'login-sponsor-report';
      } else if (reportType === 'points') {
        reportEndpoint = 'points-report';
      } else if (reportType === 'applications') {
        reportEndpoint = 'driver-app-report';
      } else if (reportType === 'commissions') {
        reportEndpoint = 'sponsor-commissions-report';
      }
      
      // If filtering by user type in the login report
      if (reportType === 'login' && activeTab !== 'all') {
        reportEndpoint = 'login-sponsor-report';
        requestData.usertype = activeTab === 'driver' ? 'driver' : 'sponsor';
      }
      
      const response = await axios({
        url: `${REACT_APP_BASEURL}/reports/download/${reportEndpoint}`,
        method: 'POST',
        data: requestData,
        responseType: 'blob', // Important for handling file download
      });
      
      // Create a download link and trigger it
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${reportEndpoint}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", { timeZone: "UTC" });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderLoginReports = () => (
    <table className="sponsor-report-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Timestamp</th>
          <th>User ID</th>
          <th>Type</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {filteredLoginReports.length > 0 ? (
          filteredLoginReports.map(report => (
            <tr key={report.AuditLogID}>
              <td>{report.AuditLogID}</td>
              <td>{formatTimestamp(report.AuditLogDate)}</td>
              <td>{report.UserID || 'N/A'}</td>
              <td>{report.AuditType}</td>
              <td>{report.AuditDetails}</td>
            </tr>
          ))
        ) : (
          <tr><td colSpan="5" className="no-data">No login reports found</td></tr>
        )}
      </tbody>
    </table>
  );

  const renderPointsReports = () => (
    <table className="sponsor-report-table">
      <thead>
        <tr>
          <th>User ID</th>
          <th>Name</th>
          <th>Date</th>
          <th>Change</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {filteredPointsReports.length > 0 ? (
          filteredPointsReports.map((report, index) => (
            <tr key={index}>
              <td>{report.UserID}</td>
              <td>{`${report.UserFName} ${report.UserLName}`}</td>
              <td>{formatTimestamp(report.TransactionDate)}</td>
              <td>{report.TransactionChange}</td>
              <td>{report.TransactionReason}</td>
            </tr>
          ))
        ) : (
          <tr><td colSpan="5" className="no-data">No points transactions found</td></tr>
        )}
      </tbody>
    </table>
  );

  const renderApplicationReports = () => (
    <table className="sponsor-report-table">
      <thead>
        <tr>
          <th>User ID</th>
          <th>Name</th>
          <th>Username</th>
          <th>Status</th>
          <th>Driver Reason</th>
          <th>Sponsor Reason</th>
        </tr>
      </thead>
      <tbody>
        {filteredApplicationReports.length > 0 ? (
          filteredApplicationReports.map((report, index) => (
            <tr key={index}>
              <td>{report.UserID}</td>
              <td>{`${report.UserFName} ${report.UserLName}`}</td>
              <td>{report.Username}</td>
              <td>{getApplicationStatusText(report.DriverStatus)}</td>
              <td>{report.DriverReason}</td>
              <td>{report.SponsorReason}</td>
            </tr>
          ))
        ) : (
          <tr><td colSpan="6" className="no-data">No applications found</td></tr>
        )}
      </tbody>
    </table>
  );

  const renderCommissionsReports = () => (
    <table className="sponsor-report-table">
      <thead>
        <tr>
          <th>Commission ID</th>
          <th>Purchase ID</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {filteredCommissionsReports.length > 0 ? (
          filteredCommissionsReports.map((report, index) => (
            <tr key={index}>
              <td>{report.CommissionID}</td>
              <td>{report.PurchaseID}</td>
              <td>{formatCurrency(report.CommissionAmount)}</td>
              <td>{getCommissionStatusText(report.CommissionStatus)}</td>
            </tr>
          ))
        ) : (
          <tr><td colSpan="4" className="no-data">No commissions found</td></tr>
        )}
      </tbody>
    </table>
  );

  const calculateTotalCommissions = () => {
    const totalAmount = commissionsReports.reduce((total, commission) => {
      return total + (parseFloat(commission.CommissionAmount) || 0);
    }, 0);
    
    const unpaidAmount = commissionsReports
      .filter(commission => commission.CommissionStatus === 0) // Status code 0 = Pending
      .reduce((total, commission) => {
        return total + (parseFloat(commission.CommissionAmount) || 0);
      }, 0);
    
    return {
      total: formatCurrency(totalAmount),
      unpaid: formatCurrency(unpaidAmount)
    };
  };

  return (
    <div className="sponsor-report-page">
      <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/sponsor/landing')}
              className="flex items-center mr-10 focus:outline-none"
            >
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <AwardIcon className="text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-800">Pedal Points</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={handleLogout} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
              Log out
            </button>
          </div>
        </div>
      </nav>
      <div className="sponsor-report-container">
        <h1 className="report-title">Organization Reports</h1>

        <div className="report-selector">
          <label>Select Report Type:</label>
          <select
            className="report-dropdown"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="login">Login Reports</option>
            <option value="points">Points Reports</option>
            <option value="applications">Driver Applications</option>
            <option value="commissions">Commissions</option>
          </select>
          
          <button 
            className="download-button"
            onClick={handleDownloadCSV}
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>

        {reportType === 'login' && (
          <div className="report-tabs">
            <button className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Logins</button>
            <button className={`tab-button ${activeTab === 'driver' ? 'active' : ''}`} onClick={() => setActiveTab('driver')}>Driver Logins</button>
            <button className={`tab-button ${activeTab === 'sponsor' ? 'active' : ''}`} onClick={() => setActiveTab('sponsor')}>Sponsor User Logins</button>
          </div>
        )}

        <div className="report-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by user, name, reason, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {reportType === 'commissions' && (
          <div className="commission-summary">
            <div className="commission-total">
              <h3>Commission Summary</h3>
              <p>Total Commissions: <strong>{calculateTotalCommissions().total}</strong></p>
              <p>Unpaid Commissions: <strong>{calculateTotalCommissions().unpaid}</strong></p>
            </div>
          </div>
        )}

        <div className="reports-content">
          {reportType === 'login' && renderLoginReports()}
          {reportType === 'points' && renderPointsReports()}
          {reportType === 'applications' && renderApplicationReports()}
          {reportType === 'commissions' && renderCommissionsReports()}
        </div>
      </div>
    </div>
  );
};

export default SponsorReport;