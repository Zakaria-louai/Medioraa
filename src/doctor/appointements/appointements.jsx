import { useState, useEffect } from "react";
import "./appointements.css";
import { getAppointments } from "../../api/api";
import { TailSpin } from "react-loader-spinner";

function Request() {
  const [dateFilter, setDateFilter] = useState("today"); 
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    const datePart = String(dateStr).split("T")[0];
    const parts = datePart.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day); 
  };

  const getLocalToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, statusFilter, searchTerm]);

  const itemsPerPage = 5;

  const normalizeStatus = (status) => {
    if (!status) return "scheduled";
    return status.toLowerCase();
  };

  const formatStatusForDisplay = (status) => {
    if (!status) return "Scheduled";
    const s = status.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

 const formatAppointment = (item) => {
  let firstName = item.patient?.first_name;
  let lastName = item.patient?.last_name;
  if (firstName === "string") firstName = "";
  if (lastName === "string") lastName = "";

  const patientName = `${firstName || ""} ${lastName || ""}`.trim() || "Patient";

  let pictureUrl = null;
  if (
    item.patient?.picture &&
    item.patient.picture !== "string" &&
    item.patient.picture.startsWith("http")
  ) {
    pictureUrl = item.patient.picture;
  }
  if (!pictureUrl && patientName !== "Patient") {
    // CHANGE THIS LINE - use only first letter
    const firstLetter = patientName.charAt(0).toUpperCase();
    pictureUrl = `https://ui-avatars.com/api/?name=${firstLetter}&background=215eed&color=fff&length=1`;
  }

  const rawStatus = normalizeStatus(item.status);

  return {
    id: item.id,
    name: patientName,
    date: item.date,
    status: rawStatus,
    displayStatus: formatStatusForDisplay(item.status),
    picture: pictureUrl,
    initials: `${firstName?.[0] || ""}`.toUpperCase(),
  };
};

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setRequests([]);
      try {
        const res = await getAppointments();
        let data = [];
        if (Array.isArray(res.data?.data)) {
          data = res.data.data;       // { data: { data: [...] } }
        } else if (Array.isArray(res.data)) {
          data = res.data;            // { data: [...] }
        }
        console.log("Appointments fetched:", data.length, data);
        const formattedData = data.map(formatAppointment);
        setRequests(formattedData);
        console.log("Formatted appointments:", formattedData);
        const today = getLocalToday();
        console.log("Today's date:", today);
        formattedData.forEach(app => {
          const appDate = parseDateString(app.date);
          console.log(`Appointment: ${app.name}, Date: ${app.date}, Parsed: ${appDate}, Is >= today? ${appDate >= today}`);
        });
      } catch (err) {
        console.error("APPOINTMENTS ERROR:", err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const getFilteredRequests = () => {
    if (!requests.length) return [];

    const today = getLocalToday();
    let startDate = new Date(today);
    let endDate = new Date(today);

    if (dateFilter === "today") {
     
      startDate = new Date(today);
      endDate = new Date(today);
    } else if (dateFilter === "3days") {
     
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setDate(today.getDate() + 2);
    } else if (dateFilter === "7days") {
      
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setDate(today.getDate() + 6);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let filtered = requests.filter((req) => {
      const appointmentDate = parseDateString(req.date);
      if (!appointmentDate) return false;
    
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((req) =>
        req.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort(
      (a, b) =>
        (parseDateString(a.date)?.getTime() ?? 0) -
        (parseDateString(b.date)?.getTime() ?? 0)
    );

    console.log(`Filtered appointments for ${dateFilter}:`, filtered.length);
    return filtered;
  };

  const filteredRequests = getFilteredRequests();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

 const scheduledCount = filteredRequests.filter( (r) => r.status === "scheduled").length;
  const canceledCount = filteredRequests.filter((r) => r.status === "canceled").length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    const d = parseDateString(dateStr);
    if (!d) return "Invalid date";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="request-wait">
        <TailSpin width="60" height="60" color="#215eed" />
      </div>
    );
  }

  return (
    <div className="request-request-container">
      <div className="request-flex">
        <div className="request-page-header">
          <h2 className="request-page-header__title">
            Patient Appointment Requests
          </h2>
          <p className="request-page-header__subtitle">
            Review upcoming consultation bookings from your patients.
          </p>
        </div>
        <main className="request-main">
          <div className="request-filters-bar">
            <div className="request-filters-bar__left">
              <div className="request-filter-select-wrap">
                <span className="material-symbols-outlined request-filter-icon">
                  calendar_today
                </span>
                <select
                  className="request-filter-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="3days">Next 3 Days</option>
                  <option value="7days">Next 7 Days</option>
                </select>
                <span className="material-symbols-outlined request-filter-arrow">
                  expand_more
                </span>
              </div>

              <div className="request-filter-select-wrap">
                <span className="material-symbols-outlined request-filter-icon">
                  filter_list
                </span>
                <select
                  className="request-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="canceled">Canceled</option>
                </select>
                <span className="material-symbols-outlined request-filter-arrow">
                  expand_more
                </span>
              </div>
            </div>

            <div className="request-search-wrap">
              <span className="material-symbols-outlined request-search-icon">
                search
              </span>
              <input
                className="request-search-input"
                type="text"
                placeholder="Search patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="request-table-container">
            <div className="request-table-scroll">
              <table className="request-data-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Date</th>
                    <th className="request-status-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRequests.length > 0 ? (
                    currentRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div className="request-patient-cell">
                            <div className="request-patient-avatar">
                              {req.picture ? (
                                <img
                                  src={req.picture}
                                  alt={req.name}
                                  className="request-patient-avatar-img"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    if (e.target.nextSibling)
                                      e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              {!req.picture && req.initials ? (
                                <span className="request-patient-initials">
                                  {req.initials}
                                </span>
                              ) : null}
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: "1.25rem",
                                  color: "#9CA3AF",
                                  display:
                                    req.picture || req.initials ? "none" : "flex",
                                }}
                              >
                                person
                              </span>
                            </div>
                            <div className="request-patient-name">{req.name}</div>
                          </div>
                        </td>
                        <td className="request-date-cell">{formatDate(req.date)}</td>
                        <td>
                          <div className={`request-status-badge request-${req.status}`}>
                            <span className="request-dot"></span>
                            {req.displayStatus}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "3rem" }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "3rem", color: "#D1D5DB" }}
                        >
                          inbox
                        </span>
                        <p style={{ marginTop: "0.5rem", color: "#9CA3AF" }}>
                          No appointments found
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredRequests.length > itemsPerPage && (
              <div className="request-pagination-container">
                <div className="request-pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ←
                  </button>
                  {Array.from({
                    length: Math.ceil(filteredRequests.length / itemsPerPage),
                  }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={currentPage === i + 1 ? "request-active" : ""}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(p + 1, Math.ceil(filteredRequests.length / itemsPerPage))
                      )
                    }
                    disabled={
                      currentPage === Math.ceil(filteredRequests.length / itemsPerPage)
                    }
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="request-analytics-grid">
            <div className="request-analytics-card">
              <div className="request-analytics-card__icon">
                <span className="material-symbols-outlined" style={{ color: "#215eed", fontSize: "2rem" }}>
                  event_available
                </span>
              </div>
              <div className="analytic-text-container">
                  <p className="request-analytics-card__label" style={{ fontWeight: "900", color: "#414a5d" }}>Scheduled Appointments</p>
                <p className="request-analytics-card__value">{scheduledCount}</p>
              </div>
            </div>

            <div className="request-analytics-card">
                  <div className="request-analytics-card__icon">
                    <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "2rem" }}>
                      cancel
                    </span>
                  </div>
                  <div className="analytic-text-container">
                <p className="request-analytics-card__label" style={{ fontWeight: "900", color: "#414a5d" }}>Canceled Appointments</p>
                    <p className="request-analytics-card__value">{canceledCount}</p>
                  </div>
                </div>

            <div className="request-analytics-card">
              <div className="request-analytics-card__icon">
                <span className="material-symbols-outlined" style={{ color: "#5a471fbd", fontSize: "2rem" }}>
                  trending_up
                </span>
              </div>
              <div className="analytic-text-container">
                <p className="request-analytics-card__label" style={{ fontWeight: "900", color: "#414a5d" }}>Total Appointments</p>
                <p className="request-analytics-card__value">{requests.length}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Request;