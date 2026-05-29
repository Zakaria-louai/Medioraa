import React, { useState } from "react";
import "./admin.css";
import {
  useApprove,
  useFetchRequests,
  useFetchRequest,
  useReject,
} from "../../hooks/useUser";
import { useEffect } from "react";
import styles from "./admin2.module.css";
import { useAuth } from "../contexts/authContext";
import { TailSpin } from "react-loader-spinner";
export default function Admin() {
  const { data, isFetching, error, refetch } = useFetchRequests();
  const [id, setId] = useState("");
  const [warning, setWarning] = useState(false);
  const {
    data: requestData,
    isFetching: requestIsFetching,
    error: requestError,
    refetch: requestFetch,
  } = useFetchRequest(id);
  const approve = useApprove();
  const reject = useReject();
  const { logout } = useAuth();
  useEffect(() => {
    refetch();
  }, []);
  useEffect(() => {
    if (!id) return;

    requestFetch();
  }, [id, requestFetch]);

  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");
  const [sortOrder, setSortOrder] = useState("Oldest");
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 5;
  // State for editable education data
  const [educationData, setEducationData] = useState({});
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [tempYears, setTempYears] = useState("");
  const [tempInstitution, setTempInstitution] = useState("");
  const [visiblePic, setVisiblePic] = useState(null);
  function formatSpecialty(input) {
    if (!input) return "";

    return input
      .split(" ")
      .filter(Boolean)
      .map((word) => {
        const lower = word.toLowerCase();

        if (lower === "orl") return "ORL";

        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }
  const doctors =
    data?.data?.map((doc) => ({
      id: doc.user.id,
      email: doc.user.email,
      requestId: doc.id,
      name: doc.user.first_name || `${doc.first_name} ${doc.last_name}`,
      fullName: doc.user.first_name,
      email: doc.user.email,
      picture: doc.user.picture,
      phone: "",
      clinic: "",
      specialty: formatSpecialty(doc.user.specialty),
      registrationDate: doc.created_at,
      isCritical: false,
      yearsExperience: "",
      institution: "",
      documents: doc.documents || [],
    })) || [];
  const requestDocuments =
    requestData?.data?.request_media?.map((item) => ({
      id: item.id,
      name: item.document_type,
      type: item.media?.resource_type || "file",
      size: item.media?.format || "",
      url: item.media?.url,
      public_id: item.media?.public_id,
    })) || [];
  //useEffect(() => {
  //console.log(requestDocuments);
  // }, [requestDocuments]);
  // Function to parse date strings
  const parseDate = (dateString) => new Date(dateString);

  // Function to calculate waiting days
  const calculateWaitingDays = (registrationDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const regDate = parseDate(registrationDate);
    regDate.setHours(0, 0, 0, 0);
    const diffTime = today - regDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getWaitingText = (days) => {
    if (isNaN(days) || days < 0) return "Just registered";
    if (days === 0) return "Less than a day";
    if (days === 1) return "1 day waiting";
    return `${days} days waiting`;
  };

  const handleRowClick = (doctorId, requestId) => {
    const isOpening = expandedRow !== doctorId;

    setExpandedRow(isOpening ? doctorId : null);

    if (isOpening) {
      setId(requestId);
    }
  };

  const handleAccept = (doctorId) => {
    console.log("accepted");
  };

  const handleReject = (doctorId) => {
    console.log("rejected");
  };

  // Start editing education info
  const startEditing = (doctorId, currentYears, currentInstitution) => {
    setEditingDoctor(doctorId);
    setTempYears(currentYears || "");
    setTempInstitution(currentInstitution || "");
  };

  // Save education info
  const saveEducation = (doctorId) => {
    setEducationData((prev) => ({
      ...prev,
      [doctorId]: {
        yearsExperience: tempYears,
        institution: tempInstitution,
      },
    }));

    setEditingDoctor(null);
    setTempYears("");
    setTempInstitution("");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingDoctor(null);
    setTempYears("");
    setTempInstitution("");
  };

  // Get education data for a doctor (from state or default)
  const getEducationForDoctor = (doctorId) => {
    return educationData[doctorId] || { yearsExperience: "", institution: "" };
  };

  // Add waitingDays dynamically
  const doctorsWithWaitingDays = doctors.map((doctor) => ({
    ...doctor,
    waitingDays: calculateWaitingDays(doctor.registrationDate),
  }));
  const filteredDoctors = doctorsWithWaitingDays
    .filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.clinic.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter(
      (doctor) =>
        specialtyFilter === "All Specialties" ||
        doctor.specialty === specialtyFilter,
    )
    .sort((a, b) => {
      if (sortOrder === "Newest") {
        return parseDate(b.registrationDate) - parseDate(a.registrationDate);
      } else {
        return parseDate(a.registrationDate) - parseDate(b.registrationDate);
      }
    });

  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(
    indexOfFirstDoctor,
    indexOfLastDoctor,
  );

  const getSortLabel = () => {
    return sortOrder === "Newest" ? "Sort: Newest" : "Sort: Oldest";
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedRow(null);
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= 3) return [1, 2];
    if (currentPage <= 2) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 1)
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };
  const nameLook = (name) => {
    switch (name) {
      case "degree":
        return "Doctor Degree";
        break;
      case "employment_certificate":
        return "Employement Certificate";
        break;
      case "images_of_workplace":
        return "Workplace Image";
        break;
      case "commercial_registration_certificate":
        return "Commercial Registration Certificate";
        break;
      default:
        return "";
    }
  };
  if (isFetching) {
    return (
      <div className={styles.spin}>
        <TailSpin height="60" width="60" color="#215eed"></TailSpin>
      </div>
    );
  } else if (data?.data) {
    return (
      <div className="ad-page">
        <header className="ad-header">
          <div className="ad-header__brand">
            <span className="material-symbols-outlined">clinical_notes</span>
            <h1>Clinical Azure</h1>
          </div>
          <div className="ad-header__actions">
            <div className="ad-header__icon-group">
              <button
                onClick={() => {
                  logout.mutate();
                }}
                className="ad-icon-btn"
              >
                {!logout.isPending ? (
                  <span className="material-symbols-outlined">logout</span>
                ) : (
                  <TailSpin height="20" width="20" color="#215eed"></TailSpin>
                )}
              </button>
            </div>
            <img
              alt="Administrator Profile"
              className="ad-avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9HqDyzp0jfBHgkvbyHT_GJrDWD6J0DoNmB0ScbB5x9wehx72OBpNTheqZFr_4goK4mBDD2x69pSt6DuINp5UGvEj7nbtec2zSfjClxI3dcGE9lorbgKTdlJtfXXuK4CdqZTdlfBbe5WAZWy42cMgpyZ943MYdTndsl7-lmzmQ59D5pV0Aq6QRLulbf4W90InRyVYH4QqI5TaaztUbD9cd_SVHpcl3vXIdxJHaP3B_PCiAP8pdj4LAiMoKVPgy0ykgFJI4GjVKKwSI"
            />
          </div>
        </header>

        <main className="ad-main">
          <div className="ad-page-header-row">
            <div>
              <h2 className="ad-page-title">Practitioner Approval Queue</h2>
              <p className="ad-subtitle">
                Review and verify new medical professional registrations.
              </p>
            </div>
            <div className="ad-stats-row">
              <div className="ad-stat-card">
                <p className="ad-stat-label">Pending</p>
                <p className="ad-stat-value ad-stat-value--primary">
                  {doctors.length}
                </p>
              </div>
              <div className="ad-stat-card">
                <p className="ad-stat-label">In Review</p>
                <p className="ad-stat-value ad-stat-value--amber">
                  {
                    doctorsWithWaitingDays.filter((d) => d.waitingDays > 3)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="ad-workspace">
            <div className="ad-control-bar">
              <div className="ad-search-wrap">
                <span className="material-symbols-outlined">search</span>
                <input
                  className="ad-search-input"
                  placeholder="Search by name, ID or clinic..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="ad-control-right">
                <div className="ad-filter-pill">
                  <span className="material-symbols-outlined">filter_list</span>
                  <select
                    value={specialtyFilter}
                    onChange={(e) => {
                      setSpecialtyFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option>All Specialties</option>
                    <option>Generaliste</option>
                    <option>Cardiology</option>
                    <option>Neurosurgeon</option>
                    <option>Pediatrics</option>
                    <option>Dermatology</option>
                    <option>General Surgerys</option>
                    <option>Urology</option>
                    <option>Neurology</option>
                    <option>Nephrology</option>
                    <option>Dentistry</option>
                    <option>ORL</option>
                    <option>Ophthalmology</option>
                    <option>Endocrinology</option>
                    <option>Gastroenterology</option>
                    <option>Gynecology</option>
                    <option>Traumatology</option>
                  </select>
                </div>
                <button
                  className="ad-sort-btn"
                  onClick={() => {
                    const newSortOrder =
                      sortOrder === "Newest" ? "Oldest" : "Newest";
                    setSortOrder(newSortOrder);
                    setCurrentPage(1);
                  }}
                >
                  <span className="material-symbols-outlined">swap_vert</span>
                  <span className="ad-sort-btn__label">{getSortLabel()}</span>
                </button>
              </div>
            </div>

            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Specialty</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                    <th>Waiting Time</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDoctors.map((doctor) => {
                    const eduInfo = getEducationForDoctor(doctor.id);
                    const isEditing = editingDoctor === doctor.id;

                    return (
                      <React.Fragment key={doctor.id}>
                        <tr
                          className={
                            doctor.isCritical
                              ? "ad-row--critical"
                              : "ad-row--normal"
                          }
                          onClick={() =>
                            handleRowClick(doctor.id, doctor.requestId)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <div className="ad-doctor-cell">
                              <div className="ad-avatar-wrap">
                                <img
                                  className="ad-avatar-sm"
                                  alt={`Portrait of ${doctor.name}`}
                                  src={doctor.picture}
                                />
                                {doctor.isCritical && (
                                  <div className="ad-status-dot"></div>
                                )}
                              </div>
                              <div>
                                <p className="ad-doctor-name">{doctor.name}</p>
                                <p className="ad-doctor-id">ID: {doctor.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="ad-specialty-cell">
                            {doctor.specialty}
                          </td>
                          <td className="ad-specialty-cell">
                            {new Date(
                              doctor.registrationDate,
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="ad-badge-pending">Pending</span>
                          </td>
                          <td>
                            <div
                              className={
                                doctor.waitingDays > 3
                                  ? "ad-wait--critical"
                                  : "ad-wait--normal"
                              }
                            >
                              <span className="material-symbols-outlined">
                                {doctor.waitingDays > 3
                                  ? "hourglass_empty"
                                  : "schedule"}
                              </span>
                              {getWaitingText(doctor.waitingDays)}
                            </div>
                          </td>
                        </tr>

                        {expandedRow === doctor.id && (
                          <tr className="ad-expanded-row">
                            <td colSpan="5">
                              <div className="ad-expanded-inner">
                                <div className="ad-expanded-grid">
                                  <div className="ad-col-left">
                                    <div className="ad-prac-card">
                                      <h4 className="ad-section-title">
                                        Practitioner Details
                                      </h4>
                                      <div className="ad-prac-fields">
                                        <div>
                                          <label className="ad-field-label">
                                            Full Name
                                          </label>
                                          <p className="ad-field-value">
                                            {doctor.fullName}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="ad-field-label">
                                            Email Address
                                          </label>
                                          <p className="ad-field-value">
                                            {doctor.email}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Admin Editable Education Section */}
                                    <div className="ad-education-wrap">
                                      <div className="ad-education-header">
                                        <h4 className="ad-section-title">
                                          Education & Experience (Admin Entry)
                                        </h4>
                                        <p className="ad-education-hint">
                                          Admin fills this information about the
                                          doctor
                                        </p>
                                      </div>

                                      {isEditing ? (
                                        <div className="ad-education-form">
                                          <div className="ad-form-field">
                                            <label className="ad-field-label">
                                              Practice Start Date
                                            </label>
                                            <input
                                              type="text"
                                              className="ad-form-input"
                                              placeholder="eg. 2006-12-15"
                                              value={tempYears}
                                              onChange={(e) =>
                                                setTempYears(e.target.value)
                                              }
                                              min="0"
                                              max="50"
                                            />
                                          </div>
                                          <div className="ad-form-field">
                                            <label className="ad-field-label">
                                              Institution (Medical School /
                                              Diploma)
                                            </label>
                                            <input
                                              type="text"
                                              className="ad-form-input"
                                              placeholder="e.g., Harvard Medical School"
                                              value={tempInstitution}
                                              onChange={(e) =>
                                                setTempInstitution(
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="ad-form-actions">
                                            <button
                                              className="ad-btn-save"
                                              onClick={() =>
                                                saveEducation(doctor.id)
                                              }
                                            >
                                              <span className="material-symbols-outlined">
                                                check
                                              </span>
                                              OK - Save
                                            </button>
                                            <button
                                              className="ad-btn-cancel"
                                              onClick={cancelEditing}
                                            >
                                              <span className="material-symbols-outlined">
                                                close
                                              </span>
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="ad-education-display">
                                          <div className="ad-experience-field">
                                            <label className="ad-field-label">
                                              Practice Start Date
                                            </label>
                                            <p className="ad-field-value ad-experience-value">
                                              <span className="material-symbols-outlined">
                                                workspace_premium
                                              </span>
                                              {eduInfo.yearsExperience
                                                ? `${eduInfo.yearsExperience}`
                                                : "Not specified yet"}
                                            </p>
                                          </div>
                                          <div className="ad-institution-field">
                                            <label className="ad-field-label">
                                              Institution (Medical School /
                                              Diploma)
                                            </label>
                                            <p className="ad-field-value ad-institution-value">
                                              <span className="material-symbols-outlined">
                                                school
                                              </span>
                                              {eduInfo.institution ||
                                                "Not specified yet"}
                                            </p>
                                          </div>
                                          <button
                                            className="ad-btn-edit"
                                            onClick={() => {
                                              setWarning(false);
                                              startEditing(
                                                doctor.id,
                                                eduInfo.yearsExperience,
                                                eduInfo.institution,
                                              );
                                            }}
                                          >
                                            <span className="material-symbols-outlined">
                                              edit
                                            </span>
                                            Edit Information
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    {warning && (
                                      <span
                                        className={`${styles.errorText} ${styles.warning}`}
                                      >
                                        Please fill in Doctor's Institution and
                                        Experience
                                      </span>
                                    )}
                                  </div>

                                  <div className="ad-col-right">
                                    <div>
                                      <div className="ad-docs-header">
                                        <h4 className="ad-section-title">
                                          Verification Documents
                                        </h4>
                                        <span className="ad-view-all-link">
                                          View All ({requestDocuments.length})
                                        </span>
                                      </div>
                                      <div className="ad-docs-scroll ad-hide-scrollbar">
                                        {requestIsFetching &&
                                        expandedRow === doctor.id ? (
                                          <div className={styles.spin}>
                                            <TailSpin
                                              height="40"
                                              width="40"
                                              color="#215eed"
                                            />
                                          </div>
                                        ) : requestDocuments.length > 0 ? (
                                          requestDocuments.map((doc, idx) => (
                                            <div
                                              className="ad-doc-card"
                                              key={idx}
                                            >
                                              <div className="ad-doc-icon-wrap">
                                                {doc.size
                                                  ?.toLowerCase()
                                                  .includes("pdf") ? (
                                                  <span className="material-symbols-outlined">
                                                    description
                                                  </span>
                                                ) : (
                                                  <span className="material-symbols-outlined">
                                                    image
                                                  </span>
                                                )}
                                              </div>

                                              <p className="ad-doc-name">
                                                {nameLook(doc.name)}
                                              </p>

                                              <p className="ad-doc-meta">
                                                {doc.size && `• ${doc.size}`}
                                              </p>

                                              <div className="ad-doc-actions">
                                                {!doc.size
                                                  ?.toLowerCase()
                                                  .includes("pdf") && (
                                                  <button
                                                    className="ad-doc-btn"
                                                    onClick={() =>
                                                      setVisiblePic(doc)
                                                    }
                                                  >
                                                    <span className="material-symbols-outlined">
                                                      visibility
                                                    </span>
                                                  </button>
                                                )}

                                                <a
                                                  href={doc.url}
                                                  download
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="ad-doc-btn"
                                                >
                                                  <span className="material-symbols-outlined">
                                                    open_in_new
                                                  </span>
                                                </a>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="ad-no-docs">
                                            <span className="material-symbols-outlined">
                                              folder_empty
                                            </span>
                                            <p>No documents uploaded yet</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="ad-cta-row">
                                      <button
                                        className="ad-btn-accept"
                                        onClick={() => {
                                          console.log(educationData);
                                          const edu =
                                            educationData[doctor.id] || {};
                                          if (
                                            !edu?.yearsExperience ||
                                            !edu?.institution
                                          ) {
                                            setWarning(true);
                                            return;
                                          }
                                          approve.mutate(
                                            {
                                              practice_start_date:
                                                edu.yearsExperience,
                                              institution: edu.institution,
                                              request_id: doctor.requestId,
                                            },
                                            {
                                              onSuccess: (data) => {
                                                refetch();
                                              },
                                            },
                                          );
                                        }}
                                      >
                                        {approve.isPending ? (
                                          <TailSpin
                                            width="20"
                                            height="20"
                                            color="#12ae82"
                                          ></TailSpin>
                                        ) : (
                                          <>
                                            <span
                                              style={{ color: "#12ae82" }}
                                              className="material-symbols-outlined"
                                            >
                                              check_circle
                                            </span>
                                            Approve Doctor
                                          </>
                                        )}
                                      </button>

                                      <button
                                        className="ad-btn-reject"
                                        onClick={() => {
                                          console.log(doctor);
                                          reject.mutate(
                                            {
                                              request_id: doctor.requestId,
                                            },
                                            {
                                              onSuccess: () => {
                                                refetch();
                                              },
                                            },
                                          );
                                        }}
                                      >
                                        {reject.isPending ? (
                                          <TailSpin
                                            width="20"
                                            height="20"
                                            color="#dc2626"
                                          ></TailSpin>
                                        ) : (
                                          <>
                                            <span
                                              style={{ color: "#dc2626" }}
                                              className="material-symbols-outlined"
                                            >
                                              cancel
                                            </span>
                                            Reject Doctor
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="ad-table-footer">
              <p className="ad-table-footer__count">
                Showing{" "}
                {filteredDoctors.length === 0 ? 0 : indexOfFirstDoctor + 1} to{" "}
                {Math.min(indexOfLastDoctor, filteredDoctors.length)} of{" "}
                {filteredDoctors.length} applications
              </p>

              <div className="ad-pagination">
                <button
                  className="ad-pagination__btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                  Prev
                </button>

                <div className="ad-pagination__pages">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`dots-${index}`}
                        className="ad-pagination__dots"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        className={`ad-pagination__page ${currentPage === page ? "ad-pagination__page--active" : ""}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  className="ad-pagination__btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
        {visiblePic && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <button
                className={styles.mapButton}
                type="button"
                onClick={() => setVisiblePic(null)}
              >
                ✕
              </button>
              {visiblePic.size?.toLowerCase() === "pdf" ? (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(visiblePic.url)}&embedded=true`}
                  className={styles.pdfFrame}
                  title="PDF Preview"
                />
              ) : (
                <img className={styles.pic} src={visiblePic.url} alt="" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className={styles.containD}>
        <div>
          <div className={styles.logoFlex}>
            <span className={styles.icon}>medical_services</span>
            <h1 className={styles.med}>MEDIORA</h1>
          </div>
          <h1 className={styles.requHead}>Unauthorized Individual</h1>
          <p className={styles.requPara}>
            Only Admins are allowed access to doctor requests.
          </p>
        </div>
        <div className={styles.buttFlex}>
          <button
            className={styles.butt}
            onClick={async () =>
              //navigate("/signin")
              logout.mutate()
            }
          >
            Log Out
            <span className={styles.iconLog}>Logout</span>
          </button>
        </div>
      </div>
    );
  }
}
