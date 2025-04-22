import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminReport.css';

const AdminReport = () => {
  const navigate = useNavigate();
  const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';
  const [loginReports, setLoginReports] = useState([]);
  const [applicationReports, setApplicationReports] = useState([]);
  const [pointsReports, setPointsReports] = useState([]);
  const [commissionsReports, setCommissionsReports] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [reportType, setReportType] = useState('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsorID, setSelectedSponsorID] = useState('all');
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

  // Fetch list of all sponsors
  const fetchSponsors = useCallback(async () => {
    try {
      const response = await axios.get(`${REACT_APP_BASEURL}/sponsor/all`);
      if (response.data) {
        setSponsors(response.data.sponsors);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    }
  }, [REACT_APP_BASEURL]);

  const fetchLoginReports = useCallback(async (userType) => {
    try {
      let endpoint = `${REACT_APP_BASEURL}/reports/login`;
      
      if (userType !== 'all') {
        endpoint += `/${userType}`;
      }
      
      const response = await axios.get(endpoint);
      
      if (response.data) {
        setLoginReports(response.data);
      } else {
        console.error('Error fetching login reports: No data returned');
      }
    } catch (error) {
      console.error('Error fetching login reports:', error);
    }
  }, [REACT_APP_BASEURL]);

  const fetchPointsReports = useCallback(async () => {
    try {
      // Adjust the API call based on selected sponsor
      const sponsorID = selectedSponsorID !== 'all' ? selectedSponsorID : null;
      
      const response = await axios.post(`${REACT_APP_BASEURL}/reports/points`, {
        UserID: null,
        SponsorID: sponsorID
      });
      
      if (response.data) {
        setPointsReports(response.data);
      } else {
        console.error('Error fetching points reports: No data returned');
      }
    } catch (error) {
      console.error('Error fetching points reports:', error);
    }
  }, [REACT_APP_BASEURL, selectedSponsorID]);

  const fetchApplicationReports = useCallback(async () => {
    try {
      // If a specific sponsor is selected, use its ID, otherwise fetch all
      const endpoint = selectedSponsorID !== 'all' 
        ? `${REACT_APP_BASEURL}/reports/applications/${selectedSponsorID}`
        : `${REACT_APP_BASEURL}/reports/applications/all`;
      
      const response = await axios.get(endpoint);
      if (response.data) {
        setApplicationReports(response.data);
      } else {
        console.error('Error fetching application reports: No data returned');
      }
    } catch (error) {
      console.error('Error fetching application reports:', error);
    }
  }, [REACT_APP_BASEURL, selectedSponsorID]);

  const fetchCommissionsReports = useCallback(async () => {
    try {
      // If a specific sponsor is selected, use its ID, otherwise fetch all
      const endpoint = selectedSponsorID !== 'all'
        ? `${REACT_APP_BASEURL}/reports/commission/${selectedSponsorID}`
        : `${REACT_APP_BASEURL}/reports/commission/all`;
  
      const response = await axios.get(endpoint);
  
      if (response.data) {
        setCommissionsReports(response.data);
      } else {
        console.error('Error fetching commissions reports: No data returned');
      }
    } catch (error) {
      console.error('Error fetching commissions reports:', error);
    }
  }, [REACT_APP_BASEURL, selectedSponsorID]);  

  useEffect(() => {
    // Redirect if not admin
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    // Fetch sponsors list on component mount
    fetchSponsors();
    
  }, [navigate, storedUser, fetchSponsors]);

  useEffect(() => {
    // Fetch reports whenever the report type, active tab, or selected sponsor changes
    if (reportType === 'login') {
      fetchLoginReports(activeTab);
    } else if (reportType === 'applications') {
      fetchApplicationReports();
    } else if (reportType === 'points') {
      fetchPointsReports();
    } else if (reportType === 'commissions') {
      fetchCommissionsReports();
    }
  }, [
    activeTab, 
    reportType, 
    selectedSponsorID, 
    fetchLoginReports, 
    fetchApplicationReports, 
    fetchPointsReports, 
    fetchCommissionsReports
  ]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const handleSponsorChange = (e) => {
    setSelectedSponsorID(e.target.value);
  };

  const filteredLoginReports = useMemo(() => {
    return loginReports
      .filter(report => 
        (report.UserID && report.UserID.toString().includes(searchTerm)) ||
        (report.AuditType && report.AuditType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.AuditDetails && report.AuditDetails.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.AuditLogDate) - new Date(a.AuditLogDate));
  }, [loginReports, searchTerm]);

  const filteredPointsReports = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return pointsReports.filter(report =>
      (report.UserID && report.UserID.toString().includes(term)) ||
      (report.UserFName && report.UserFName.toLowerCase().includes(term)) ||
      (report.UserLName && report.UserLName.toLowerCase().includes(term)) ||
      (report.TransactionReason && report.TransactionReason.toLowerCase().includes(term))
    );
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
      (getApplicationStatusText(report.DriverStatus).toLowerCase().includes(term)) ||
      (report.SponsorCompanyName && report.SponsorCompanyName.toLowerCase().includes(term))
    );
  }, [applicationReports, searchTerm, getApplicationStatusText]);

  const getCommissionStatusText = useCallback((statusCode) => {
    return commissionStatusMap[statusCode] || 'Unknown';
  }, [commissionStatusMap]);  

  const filteredCommissionsReports = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return commissionsReports.filter(report =>
      (report.CommissionID && report.CommissionID.toString().includes(term)) ||
      (report.SponsorID && report.SponsorID.toString().includes(term)) ||
      (report.CommissionAmount && report.CommissionAmount.toString().includes(term)) ||
      (getCommissionStatusText(report.CommissionStatus).toLowerCase().includes(term))
    );
  }, [commissionsReports, searchTerm, getCommissionStatusText]);  

  const handleDownloadCSV = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
  
    try {
      let reportEndpoint = '';
      let requestData = {};
  
      if (reportType === 'login') {
        if (activeTab === 'all') {
          reportEndpoint = 'login-report';
        } else {
          reportEndpoint = 'login-user-report';
          requestData.usertype = activeTab;
        }
      } else if (reportType === 'applications') {
        if (selectedSponsorID !== 'all') {
          reportEndpoint = 'driver-app-report';
          requestData.SponsorID = selectedSponsorID;
        } else {
          reportEndpoint = 'all-driver-app-report';
        }
      } else if (reportType === 'points') {
        reportEndpoint = 'points-report';
        requestData = {
          UserID: null,
          SponsorID: selectedSponsorID !== 'all' ? selectedSponsorID : null
        };
      } else if (reportType === 'commissions') {
        if (selectedSponsorID !== 'all') {
          reportEndpoint = 'sponsor-commissions-report';
          requestData.SponsorID = selectedSponsorID;
        } else {
          reportEndpoint = 'all-commissions-report';
        }
      }
  
      const response = await axios({
        url: `${REACT_APP_BASEURL}/reports/download/${reportEndpoint}`,
        method: 'POST',
        data: requestData,
        responseType: 'blob',
      });
  
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

  const renderLoginReportsTable = () => (
    <table className="admin-report-table">
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
          filteredLoginReports.map((report) => (
            <tr key={report.AuditLogID}>
              <td data-label="ID">{report.AuditLogID}</td>
              <td data-label="Timestamp">{formatTimestamp(report.AuditLogDate)}</td>
              <td data-label="User">{report.UserID || 'N/A'}</td>
              <td data-label="Type">{report.AuditType}</td>
              <td data-label="Message">{report.AuditDetails}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="no-data">No reports found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderPointsReportsTable = () => (
    <table className="admin-report-table">
      <thead>
        <tr>
          <th>User ID</th>
          <th>Name</th>
          <th>Transaction Date</th>
          <th>Points Change</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {filteredPointsReports.length > 0 ? (
          filteredPointsReports.map((report, index) => (
            <tr key={index}>
              <td data-label="User ID">{report.UserID}</td>
              <td data-label="Name">{`${report.UserFName} ${report.UserLName}`}</td>
              <td data-label="Date">{formatTimestamp(report.TransactionDate)}</td>
              <td data-label="Points Change">{report.TransactionChange}</td>
              <td data-label="Reason">{report.TransactionReason}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="no-data">No points transactions found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderApplicationReportsTable = () => (
    <table className="admin-report-table">
      <thead>
        <tr>
          <th>User ID</th>
          <th>Name</th>
          <th>Username</th>
          <th>Organization</th>
          <th>Status</th>
          <th>Driver Reason</th>
          <th>Sponsor Reason</th>
        </tr>
      </thead>
      <tbody>
        {filteredApplicationReports.length > 0 ? (
          filteredApplicationReports.map((report, index) => (
            <tr key={index}>
              <td data-label="User ID">{report.UserID}</td>
              <td data-label="Name">{`${report.UserFName} ${report.UserLName}`}</td>
              <td data-label="Username">{report.Username}</td>
              <td data-label="Organization">{report.SponsorCompanyName}</td>
              <td data-label="Status">{getApplicationStatusText(report.DriverStatus)}</td>
              <td data-label="Driver Reason">{report.DriverReason}</td>
              <td data-label="Sponsor Reason">{report.SponsorReason}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="no-data">No applications found</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderCommissionsReportsTable = () => (
    <table className="admin-report-table">
      <thead>
        <tr>
          <th>Commission ID</th>
          <th>Purchase ID</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Sponsor ID</th>
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
              <td>{report.SponsorID}</td>
            </tr>
          ))
        ) : (
          <tr><td colSpan="5" className="no-data">No commissions found</td></tr>
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
    <div className="admin-report-page">
      <nav className="bg-white shadow-md py-4 px-6 fixed w-full top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/landing')}
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
      
      <div className="admin-report-container">
        <h1 className="report-title">Admin Reports</h1>
        
        <div className="report-controls">
          <div className="report-selection-group">
            <div className="control-item">
              <label htmlFor="report-type">Select Report Type:</label>
              <select
                id="report-type"
                className="control-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="login">Login Reports</option>
                <option value="points">Points Reports</option>
                <option value="applications">Driver Applications</option>
                <option value="commissions">Commission Reports</option>
              </select>
            </div>

            {reportType !== 'login' && (
              <div className="control-item">
                <label htmlFor="sponsor-select">Select Organization:</label>
                <select
                  id="sponsor-select"
                  className="control-select"
                  value={selectedSponsorID}
                  onChange={handleSponsorChange}
                >
                  <option value="all">All Organizations</option>
                  {sponsors.map(sponsor => (
                    <option key={sponsor.SponsorID} value={sponsor.SponsorID}>
                      {sponsor.SponsorCompanyName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              className="download-button"
              onClick={handleDownloadCSV}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        </div>
        
        {reportType === 'login' && (
          <div className="report-tabs">
            <button 
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All Logins
            </button>
            <button 
              className={`tab-button ${activeTab === 'driver' ? 'active' : ''}`}
              onClick={() => handleTabChange('driver')}
            >
              Driver Logins
            </button>
            <button 
              className={`tab-button ${activeTab === 'sponsor' ? 'active' : ''}`}
              onClick={() => handleTabChange('sponsor')}
            >
              Sponsor Logins
            </button>
            <button 
              className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleTabChange('admin')}
            >
              Admin Logins
            </button>
          </div>
        )}
        
        <div className="report-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder={reportType === 'login' ? 
                "Search by user, type or message..." : 
                "Search by user, name, organization or status..."}
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
          {reportType === 'login' && renderLoginReportsTable()}
          {reportType === 'points' && renderPointsReportsTable()}
          {reportType === 'applications' && renderApplicationReportsTable()}
          {reportType === 'commissions' && renderCommissionsReportsTable()}
        </div>
      </div>
    </div>
  );
};

export default AdminReport;