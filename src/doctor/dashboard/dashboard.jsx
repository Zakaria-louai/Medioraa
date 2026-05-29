import "./dashboard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addLeave,
  getLeave,
  deleteLeave,
  getSchedule,
  updateLeave,
  getAppointments,
  getAllDoctors,
  getDoctorFeedback,
} from "../../api/api";
import { useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useAuth } from "../contexts/authContext";
import { TailSpin } from "react-loader-spinner";

function Dashboard() {
  const navigate = useNavigate();
  const { isOnline, setIsOnline } = useAuth();
  const [leaveId, setLeaveId] = useState(null);
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [tempVacationStart, setTempVacationStart] = useState("");
  const [tempVacationEnd, setTempVacationEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [canceledCount, setCanceledCount] = useState(0);
  const [capacityPercentage, setCapacityPercentage] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [todayschedule, setTodaySchedule] = useState(null);
  const { data: doctorData, refetch, isLoading, isFetching } = useUser();
  const { logout } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (doctorData?.data) {
      localStorage.setItem("doctorId", doctorData.data.id);
    }
  }, [doctorData]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        if (!doctorData?.data?.id) return;
        const response = await getSchedule(doctorData.data.id);
        setSchedule(response.data.data);
      } catch (err) {
        console.error("Schedule error:", err);
        setSchedule(null);
      }
    };
    fetchSchedule();
  }, [doctorData]);

  const getTodaySchedule = () => {
    if (!schedule) return null;

    let scheduleData = Array.isArray(schedule?.data)
      ? schedule.data
      : Array.isArray(schedule)
        ? schedule
        : Array.isArray(schedule?.data?.data)
          ? schedule.data.data
          : null;

    if (!scheduleData || scheduleData.length === 0) return null;

    const today = new Date().getDay();
    return scheduleData.find((s) => s.day_of_week === today) || null;
  };

  const getNextWorkingDay = () => {
    if (!schedule) return "Not set";
    
    let scheduleData = Array.isArray(schedule?.data)
      ? schedule.data
      : Array.isArray(schedule)
        ? schedule
        : Array.isArray(schedule?.data?.data)
          ? schedule.data.data
          : null;
    
    if (!scheduleData || scheduleData.length === 0) return "No schedule";
    
    // Get today's day - with Monday = 0
    const todayJS = new Date().getDay();
    let today = todayJS - 1;
    if (today < 0) today = 6;
    
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const workingDays = scheduleData.map(s => s.day_of_week);
    
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (today + i) % 7;
      if (workingDays.includes(nextDayIndex)) {
        return days[nextDayIndex];
      }
    }
    
    return "No working days found";
  };

  const buildWorkBlocks = () => {
    const todaySchedule = getTodaySchedule();

    if (!todaySchedule) {
      return [{ start: "09:00", end: "17:00" }];
    }

    const formatTime = (timeString) => {
      if (!timeString) return "00:00";

      if (timeString.includes("T")) {
        return timeString.split("T")[1].slice(0, 5);
      }

      return timeString.slice(0, 5);
    };

    const startTime = formatTime(todaySchedule.starting_time);
    const endTime = formatTime(todaySchedule.finish_time);

    if (!todaySchedule.rest_times || todaySchedule.rest_times.length === 0) {
      return [{ start: startTime, end: endTime }];
    }

    const blocks = [];
    let currentStart = startTime;

    const sortedRests = [...todaySchedule.rest_times].sort((a, b) =>
      a.starting_time.localeCompare(b.starting_time),
    );

    for (const rest of sortedRests) {
      const restStart = formatTime(rest.starting_time);
      const restEnd = formatTime(rest.finish_time);

      if (currentStart < restStart) {
        blocks.push({
          start: currentStart,
          end: restStart,
        });
      }

      currentStart = restEnd;
    }

    if (currentStart < endTime) {
      blocks.push({
        start: currentStart,
        end: endTime,
      });
    }

    return blocks;
  };

  const fetchFeedbacks = async () => {
    try {
      setFeedbackLoading(true);

      const doctorId = getDoctorId();

      if (!doctorId) return;

      const response = await getDoctorFeedback(doctorId);

      let feedbackList = [];

      if (Array.isArray(response.data)) {
        feedbackList = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        feedbackList = response.data.data;
      }

      setFeedbacks(feedbackList);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      setFeedbacks([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const getDoctorId = () => {
    const doctorId = doctorData?.data?.id;
    if (!doctorId) {
      return null;
    }
    return doctorId;
  };

  const fetchAppointments = async () => {
    try {
      const response = await getAppointments();

      let appointmentsList = [];

      if (Array.isArray(response.data)) {
        appointmentsList = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        appointmentsList = response.data.data;
      }

      setAppointments(appointmentsList);

      const today = new Date().toISOString().split("T")[0];
      const todayApps = appointmentsList.filter((app) => app.date === today);
      setAppointmentsCount(todayApps.length);

      const completed = appointmentsList.filter(
        (app) => app.status === "completed",
      ).length;
      const canceled = appointmentsList.filter(
        (app) => app.status === "canceled",
      ).length;
      setCompletedCount(completed);
      setCanceledCount(canceled);

      const totalSlots = getTodaySchedule()?.max_appointments || 8;
      const percentage = (todayApps.length / totalSlots) * 100;
      setCapacityPercentage(Math.round(percentage));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointmentsCount(0);
      setCompletedCount(0);
      setCanceledCount(0);
      setCapacityPercentage(0);
    }
  };

  const fetchDoctorInfo = async () => {
    try {
      const doctorId = getDoctorId();
      if (!doctorId) {
        setDoctorName("");
        setCurrentDoctor(null);
        return;
      }

      const response = await getAllDoctors();

      let doctorsList = [];
      if (Array.isArray(response.data)) {
        doctorsList = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        doctorsList = response.data.data;
      }

      const doctor = doctorsList.find((doc) => String(doc.id) === doctorId);
      setCurrentDoctor(doctor || null);

      if (doctor) {
        const displayName = doctor.username || "Doctor";
        setDoctorName(displayName);
        localStorage.setItem("doctorUsername", displayName);
      } else {
        setDoctorName("");
      }
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      setDoctorName("");
      setCurrentDoctor(null);
    }
  };

  const checkVacationStatus = async () => {
    try {
      const response = await getLeave();
      const raw = response?.data;

      const vacations = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : raw?.data
            ? [raw.data]
            : [];

      const doctorId = localStorage.getItem("doctorId");

      const myVacations = vacations.filter(
        (v) => String(v.user_id) === String(doctorId),
      );

      if (myVacations.length > 0) {
        const v = myVacations[0];
        setVacationMode(true);
        setLeaveId(v.id);
        setVacationStart(v.starting_date);
        setVacationEnd(v.finish_date);
      } else {
        setVacationMode(false);
        setLeaveId(null);
        setVacationStart("");
        setVacationEnd("");
      }
    } catch (error) {
      console.error("Vacation error:", error);
      setVacationMode(false);
    }
  };

  useEffect(() => {
    if (!doctorData?.data?.id) return;
    checkVacationStatus();
    fetchDoctorInfo();
    fetchAppointments();
    fetchFeedbacks();
  }, [doctorData]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        if (!doctorData?.data?.id) return;
        const response = await getSchedule(doctorData.data.id);
        setSchedule(response.data);
      } catch (err) {
        console.error("Schedule error:", err);
        setSchedule(null);
      }
    };
    fetchSchedule();
  }, [doctorData]);

  const getMinStartDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 7);
    return minDate.toISOString().split("T")[0];
  };

  const getMinEndDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 8);
    return minDate.toISOString().split("T")[0];
  };

  const getReturnDate = (vacationEndDate) => {
    const returnDate = new Date(vacationEndDate);
    returnDate.setDate(returnDate.getDate() + 1);
    return formatDisplayDate(returnDate.toISOString().split("T")[0]);
  };

  const openVacationModal = async () => {
    await checkVacationStatus();

    if (vacationMode) {
      return;
    }

    setTempVacationStart("");
    setTempVacationEnd("");
    setShowVacationModal(true);
  };

  const closeVacationModal = () => {
    setShowVacationModal(false);
    setTempVacationStart("");
    setTempVacationEnd("");
  };

  const confirmVacation = async () => {
    if (!tempVacationStart || !tempVacationEnd) return;

    setLoading(true);
    try {
      await addLeave({
        starting_date: tempVacationStart,
        finish_date: tempVacationEnd,
      });
      await checkVacationStatus();
      closeVacationModal();
    } catch (error) {
      console.error("Error creating vacation:", error);
      if (error.response?.status === 409) {
        alert("You already have an active vacation. Refreshing...");
        await checkVacationStatus();
      } else {
        alert(`Error: ${error.response?.data?.message || "Please try again"}`);
        console.log(error.response);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelVacation = async () => {
    if (!vacationMode) {
      return;
    }

    setLoading(true);
    try {
      await deleteLeave(leaveId);
      await checkVacationStatus();
    } catch (error) {
      console.error("Error deleting vacation:", error);
      if (error.response?.status === 404) {
        alert("Vacation not found.");
        await checkVacationStatus();
      } else {
        alert(`Error: ${error.response?.data?.message || "Please try again"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const goToProfile = () => {
    navigate("/mainpage/profile");
  };

  const openAllReviewsModal = () => {
    setShowAllReviewsModal(true);
  };

  const closeAllReviewsModal = () => {
    setShowAllReviewsModal(false);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getDisplayName = () => {
    if (doctorName && doctorName !== "Doctor") {
      return `${getGreeting()}, ${doctorName}.`;
    }
    return `${getGreeting()}, Doctor.`;
  };

  const getProfileName = () => {
    if (doctorName && doctorName !== "Doctor") {
      return doctorName;
    }
    return "Doctor";
  };

  const getFormattedDate = () => {
    return currentDateTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTodayPatientCount = () => {
    return appointmentsCount;
  };

  const getClinicHours = () => {
    const blocks = buildWorkBlocks();
    if (blocks.length === 1 && blocks[0].start === "09:00" && blocks[0].end === "17:00") {
      return "Today: 9:00 AM - 5:00 PM";
    }
    return blocks.map(b => `${b.start} - ${b.end}`).join(", ");
  };

  const doctorProfilePic =
    currentDoctor?.picture || currentDoctor?.photo_url || null;
  const doctorSpecialty = currentDoctor?.specialty || "Healthcare Provider";
  const doctorEmail = currentDoctor?.email || "";
  const doctorPhone = currentDoctor?.phone || "";
  const doctorBio =
    doctorData?.data.description ||
    "Dedicated healthcare professional committed to providing excellent patient care.";

  if (isLoading || isFetching) {
    return (
      <div className="request-wait-dash">
        <TailSpin width="60" height="60" color="#215eed"></TailSpin>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <p className="dash-sidebar-label">Clinical Tools</p>
          <p className="dash-sidebar-subtitle">Practitioner Portal</p>
        </div>
        
        {/* Profile Summary Section */}
        <div className="dash-sidebar-profile-summary">
          <div className="dash-sidebar-avatar">
            {doctorProfilePic ? (
              <img
                src={doctorProfilePic}
                alt={doctorName}
                className="dash-sidebar-avatar-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  const parent = e.target.parentElement;
                  const placeholder = document.createElement('div');
                  placeholder.className = 'dash-sidebar-avatar-placeholder';
                  placeholder.textContent = getProfileName().charAt(0).toUpperCase();
                  parent.appendChild(placeholder);
                  e.target.remove();
                }}
              />
            ) : (
              <div className="dash-sidebar-avatar-placeholder">
                {getProfileName().charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="dash-sidebar-doctor-name">{getProfileName()}</h3>
          <p className="dash-sidebar-doctor-specialty">{doctorSpecialty}</p>
          {/* Status moved here - below specialty in green */}
          <div className={`dash-sidebar-status ${isOnline ? "online" : "offline"}`}>
            <span className="dash-status-dot"></span>
            {isOnline ? "Available for consultations" : "Currently offline"}
          </div>
        </div>

        {/* Info Cards - Reordered */}
        <div className="dash-sidebar-info-cards">
          <div className="dash-sidebar-info-card">
            <span className="material-symbols-outlined">calendar_today</span>
            <div>
              <p className="dash-sidebar-info-label">Today's Date</p>
              <p className="dash-sidebar-info-value">{getFormattedDate()}</p>
            </div>
          </div>
          
          <div className="dash-sidebar-info-card">
            <span className="material-symbols-outlined">groups</span>
            <div>
              <p className="dash-sidebar-info-label">Today's Patients</p>
              <p className="dash-sidebar-info-value">{getTodayPatientCount()} scheduled</p>
            </div>
          </div>
          
          <div className="dash-sidebar-info-card">
            <span className="material-symbols-outlined">access_time</span>
            <div>
              <p className="dash-sidebar-info-label">Clinic Hours for Today</p>
              <p className="dash-sidebar-info-value dash-hours-text">{getClinicHours()}</p>
            </div>
          </div>

          <div className="dash-sidebar-info-card">
            <span className="material-symbols-outlined">event</span>
            <div>
              <p className="dash-sidebar-info-label">Next Working Day</p>
              <p className="dash-sidebar-info-value">{getNextWorkingDay()}</p>
            </div>
          </div>
        </div>
        
        {/* Motivating Quote */}
        <div className="dash-sidebar-quote">
          <span className="material-symbols-outlined">psychiatry</span>
          <p>"Healing is a matter of time, but it is sometimes also a matter of opportunity."</p>
          <span className="dash-quote-author">— Hippocrates</span>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-main-inner">
          <header className="dash-welcome-header">
            <h1>{getDisplayName()}</h1>
            <p>
              You have{" "}
              <span className="dash-highlight">
                {appointmentsCount} appointment
                {appointmentsCount !== 1 ? "s" : ""}
              </span>{" "}
              scheduled for today.
            </p>
            {vacationMode && (
              <div className="dash-vacation-notice">
                <span className="material-symbols-outlined">beach_access</span>
                <span>
                  On vacation from {formatDisplayDate(vacationStart)} to{" "}
                  {formatDisplayDate(vacationEnd)}. Returning on{" "}
                  {getReturnDate(vacationEnd)}
                </span>
              </div>
            )}
          </header>

          <div className="dash-grid">
            <div className="dash-col-left">
              <section className="dash-card dash-availability-card">
                <div className="dash-availability-header">
                  <h2>Availability Control</h2>
                  <div className="dash-status-control">
                    <span className="dash-status-control-label">
                      Status Control
                    </span>
                    <div className="dash-toggle-group">
                      <button
                        className={
                          !isOnline ? "dash-off dash-active" : "dash-off"
                        }
                        onClick={() => setIsOnline(false)}
                      >
                        OFFLINE
                      </button>
                      <button
                        className={isOnline ? "dash-on dash-active" : "dash-on"}
                        onClick={() => setIsOnline(true)}
                      >
                        ONLINE
                      </button>
                    </div>
                  </div>
                </div>

                <div className="dash-current-hours">
                  <div className="dash-hours-info">
                    <span className="dash-hours-label">
                      Current Working Hours
                    </span>
                    <div
                      className="dash-hours-value"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {buildWorkBlocks().map((b, i) => (
                        <div
                          key={i}
                          className="dash-schedule-block"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ color: "#1976d2", fontSize: "20px" }}
                          >
                            schedule
                          </span>
                          <span style={{ fontWeight: 500, color: "#215eed" }}>
                            {b.start} — {b.end}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="dash-quick-actions">
                  <button
                    className={`dash-qa-btn dash-stop ${vacationMode ? "dash-active-stop" : ""}`}
                    onClick={openVacationModal}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">
                      {vacationMode ? "beach_access" : "beach_access"}
                    </span>
                    <span className="dash-label">
                      {loading ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span className="dash-spinner-white-small"></span>
                          Processing...
                        </span>
                      ) : vacationMode ? (
                        "On Vacation..."
                      ) : (
                        "Take Time Off"
                      )}
                    </span>
                  </button>
                  <button
                    className={`dash-qa-btn dash-reopen ${!vacationMode ? "dash-active-reopen" : ""}`}
                    onClick={cancelVacation}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                    <span className="dash-label">
                      {loading ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span className="dash-spinner-blue-small"></span>
                          Processing...
                        </span>
                      ) : (
                        "Reopen Availability"
                      )}
                    </span>
                  </button>
                </div>

                {showVacationModal && (
                  <div className="dash-calendar-overlay">
                    <div className="dash-calendar-modal">
                      <div className="dash-calendar-header">
                        <h3>Set Time Off</h3>
                        <button
                          className="dash-close-calendar"
                          onClick={closeVacationModal}
                        >
                          <span className="material-symbols-outlined">
                            close
                          </span>
                        </button>
                      </div>

                      <div className="dash-calendar-body">
                        <div className="dash-time-input-group">
                          <label>Start Date (minimum 7 days from today)</label>
                          <input
                            type="date"
                            className="dash-date-picker-input"
                            value={tempVacationStart}
                            onChange={(e) =>
                              setTempVacationStart(e.target.value)
                            }
                            min={getMinStartDate()}
                          />
                        </div>

                        <div className="dash-time-input-group">
                          <label>End Date (minimum 8 days from today)</label>
                          <input
                            type="date"
                            className="dash-date-picker-input"
                            value={tempVacationEnd}
                            onChange={(e) => setTempVacationEnd(e.target.value)}
                            min={getMinEndDate()}
                          />
                        </div>

                        {(tempVacationStart || tempVacationEnd) && (
                          <div className="dash-selected-date-info">
                            <span className="material-symbols-outlined">
                              info
                            </span>
                            <span>
                              Time off from{" "}
                              <strong>
                                {tempVacationStart
                                  ? formatDisplayDate(tempVacationStart)
                                  : "selected date"}
                              </strong>
                              {tempVacationEnd &&
                                ` to ${formatDisplayDate(tempVacationEnd)}`}
                              {tempVacationEnd && (
                                <span className="dash-note">
                                  {" "}
                                  (Returning on {getReturnDate(tempVacationEnd)}
                                  )
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="dash-calendar-footer">
                        <button
                          className="dash-btn-secondary"
                          onClick={closeVacationModal}
                        >
                          Cancel
                        </button>
                        <button
                          className="dash-btn-primary"
                          onClick={confirmVacation}
                          disabled={
                            !tempVacationStart || !tempVacationEnd || loading
                          }
                        >
                          {loading ? (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span className="dash-spinner-white-small"></span>
                              Processing...
                            </span>
                          ) : (
                            "Confirm Time Off"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
              <section
                className="dash-card dash-profile-card"
                onClick={goToProfile}
                style={{ cursor: "pointer" }}
              >
                <div className="dash-profile-bg-blob"></div>
                <div className="dash-profile-info">
                  <div className="dash-profile-avatar">
                    {doctorProfilePic ? (
                      <img
                        src={doctorProfilePic}
                        alt={doctorName}
                        className="dash-profile-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          const parent = e.target.parentElement;
                          const placeholder = document.createElement('div');
                          placeholder.className = 'dash-avatar-placeholder dash-large';
                          placeholder.textContent = getProfileName().charAt(0).toUpperCase();
                          parent.appendChild(placeholder);
                          e.target.remove();
                        }}
                      />
                    ) : (
                      <div className="dash-avatar-placeholder dash-large">
                        {getProfileName().charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="dash-profile-name">{getProfileName()}</p>
                    <p className="dash-profile-role">{doctorSpecialty}</p>
                  </div>
                </div>
                <div className="dash-profile-actions">
                  <button
                    className="dash-btn-view-profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToProfile();
                    }}
                  >
                    VIEW FULL PROFILE
                  </button>
                </div>
              </section>
            </div>

            <div className="dash-col-right">
              <section className="dash-card dash-stats-card">
                <h3 className="dash-anal-head">Daily Statistics</h3>
                <div className="dash-stats-body">
                  <div>
                    <div className="dash-capacity-label">
                      <span>Capacity Used</span>
                      <span className="dash-capacity-pct">
                        {capacityPercentage}%
                      </span>
                    </div>
                    <div className="dash-progress-track">
                      <div
                        className="dash-progress-fill"
                        style={{ width: `${capacityPercentage}%` }}
                      ></div>
                    </div>
                    <p className="dash-capacity-note">
                      {appointmentsCount} of{" "}
                      {getTodaySchedule()?.max_appointments || 8} slots booked for
                      today
                    </p>
                  </div>
                  <div className="dash-stat-mini-grid">
                    <div className="dash-stat-mini">
                      <p className="dash-stat-mini-label">Completed</p>
                      <p className="dash-stat-mini-val">{completedCount}</p>
                    </div>
                    <div className="dash-stat-mini">
                      <p className="dash-stat-mini-label">Canceled</p>
                      <p className="dash-stat-mini-val dash-red">
                        {canceledCount}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="dash-feedback-section">
                <div className="dash-feedback-header">
                  <h3>Patient Feedback</h3>
                  <span className="material-symbols-outlined">reviews</span>
                </div>

                {feedbackLoading ? (
                  <div className="dash-feedback-empty">
                    <TailSpin width="35" height="35" color="#215eed" />
                    <p>Loading feedback...</p>
                  </div>
                ) : feedbacks.length > 0 ? (
                  <>
                    <div className="dash-feedback-card">
                      <div className="dash-feedback-quote">
                        <span className="material-symbols-outlined">
                          format_quote
                        </span>
                      </div>

                      <p className="dash-feedback-text">
                        "{feedbacks[0].body}"
                      </p>

                      <div className="dash-feedback-user">
                        <div className="dash-feedback-avatar">
                          {(
                            feedbacks[0]?.patient?.username ||
                            feedbacks[0]?.patient?.first_name ||
                            "P"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="dash-feedback-name">
                            {feedbacks[0]?.patient?.username ||
                              `${feedbacks[0]?.patient?.first_name || ""} ${
                                feedbacks[0]?.patient?.last_name || ""
                              }`.trim() ||
                              "Patient"}
                          </p>

                          <p className="dash-feedback-role">Verified Patient</p>
                        </div>
                      </div>
                    </div>

                    <button
                      className="dash-reviews-btn"
                      onClick={openAllReviewsModal}
                    >
                      Read All Reviews ({feedbacks.length})
                    </button>
                  </>
                ) : (
                  <div className="dash-feedback-empty-card">
                    <div className="dash-feedback-empty-icon">
                      <span className="material-symbols-outlined">forum</span>
                    </div>

                    <h4>No Feedback Yet</h4>

                    <p>
                      Patient reviews and experiences will appear here once
                      feedback is submitted.
                    </p>

                    <div className="dash-feedback-placeholder">
                      <div className="dash-feedback-placeholder-line"></div>
                      <div className="dash-feedback-placeholder-line short"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ALL REVIEWS MODAL */}
      {showAllReviewsModal && (
        <div className="dash-calendar-overlay" onClick={closeAllReviewsModal}>
          <div
            className="dash-reviews-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-calendar-header">
              <h3>All Patient Reviews ({feedbacks.length})</h3>
              <button
                className="dash-close-calendar"
                onClick={closeAllReviewsModal}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="dash-reviews-modal-body">
              {feedbacks.length > 0 ? (
                <div className="dash-reviews-list">
                  {feedbacks.map((feedback, index) => (
                    <div
                      key={feedback.id || index}
                      className="dash-review-item"
                    >
                      <div className="dash-feedback-quote">
                        <span className="material-symbols-outlined">
                          format_quote
                        </span>
                      </div>
                      <p className="dash-feedback-text">{feedback.body}</p>
                      <div className="dash-feedback-user">
                        <div className="dash-feedback-avatar">
                          {(
                            feedback?.patient?.username ||
                            feedback?.patient?.first_name ||
                            "P"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="dash-feedback-name">
                            {feedback?.patient?.username ||
                              `${feedback?.patient?.first_name || ""} ${feedback?.patient?.last_name || ""}`.trim() ||
                              "Patient"}
                          </p>
                          <p className="dash-feedback-role">Verified Patient</p>
                          {feedback.created_at && (
                            <p className="dash-feedback-date">
                              {new Date(
                                feedback.created_at,
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dash-feedback-empty-card">
                  <div className="dash-feedback-empty-icon">
                    <span className="material-symbols-outlined">forum</span>
                  </div>
                  <h4>No Reviews Yet</h4>
                  <p>
                    Patient reviews and experiences will appear here once
                    feedback is submitted.
                  </p>
                </div>
              )}
            </div>

            <div className="dash-calendar-footer">
              <button
                className="dash-btn-secondary"
                onClick={closeAllReviewsModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;