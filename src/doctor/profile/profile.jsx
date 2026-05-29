import { useEffect, useState } from "react";
import "./profile.css";
import styles from "./profile_2.module.css";
import LocationPicker from "../doctor-signup/doctor-signup-first/map";
import { useTheme } from "../contexts/themeContext";
import { useAuth } from "../contexts/authContext";
import { TailSpin } from "react-loader-spinner";
import {
  updateUser,
  useAddService,
  useDeleteSchedule,
  useFetchService,
  useFetchTime,
  useProfile,
  useRemoveRest,
  useRestTime,
  useSchedule,
  useUpdatePassword,
  useUser,
} from "../../hooks/useUser";
import "leaflet/dist/leaflet.css";
import { Conditions, conditionsVerify, StrengthLabel } from "../otp";
import { useNavigate } from "react-router";

export default function Profile() {
  const { data, error, isLoading, refetch } = useUser();
  const profile = useProfile();
  const { checkUser, uploadDocument, queryClient, logout } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const hour = useSchedule();
  const update = updateUser();
  const [preview, setPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [change, setChange] = useState(false);
  const [userName, setUserName] = useState("");
  const [text, setText] = useState("");
  const [location, setLocation] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [replace, setReplace] = useState(false);
  const [id, setId] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [service, setService] = useState([]);
  const [showService, setShowService] = useState(false);
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
    refetch: scheduleFetch,
  } = useFetchTime(id);
  const {
    data: serviceData,
    isLoading: serviceLoading,
    error: serviceError,
    refetch: serviceRefetch,
  } = useFetchService(id);
  const deleteSchedule = useDeleteSchedule();
  const [pass, setPass] = useState("");
  const navigate = useNavigate();
  const [newPass, setNewPass] = useState("");
  const changePass = useUpdatePassword();
  const rest = useRestTime();
  const [showRest, setShowRest] = useState(false);
  const deleteRest = useRemoveRest();
  const postService = useAddService();
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceDescription, setServiceDescription] = useState("");

  useEffect(() => {
    if (data?.data && !initialized) {
      console.log(data.data);
      setText(data.data.description || "");
      setLocation({
        lat: Number(data.data.clinic_posx),
        lng: Number(data.data.clinic_posy),
      });
      setPreview(data.data.picture || null);
      setUserName(data.data.username || "");
      setInitialized(true);
      setId(data.data.id);
    }
  }, [data, initialized]);

  useEffect(() => {
    if (serviceData?.data?.length > 0) {
      const mapped = serviceData.data.map((d) => ({
        id: d.id,
        price: d.price,
        name: d.name,
        description: d.description,
      }));
      setService(mapped);
    } else {
      setService([]);
    }
  }, [serviceData]);

  useEffect(() => {
    if (scheduleData?.data) {
      const base = Array(7)
        .fill(null)
        .map((_, i) => ({
          id: null,
          active: false,
          start: "09:00",
          end: "17:00",
          max: 1,
          rest: { start: "12:00", end: "13:00" },
          existsInSchedule: false,
        }));
      scheduleData.data.forEach((d) => {
        base[d.day_of_week] = {
          id: d.id,
          active: true,
          start: d.starting_time,
          end: d.finish_time,
          max: d.max_appointments,
          rest: d.rest_times[0]
            ? {
                start: d.rest_times[0].starting_time,
                end: d.rest_times[0].finish_time,
              }
            : base[d.day_of_week].rest,
          rest_times: d.rest_times || [],
          existsInSchedule: true,
        };
      });
      setSchedule(base);
    }
  }, [scheduleData]);

  const handleSaveRest = async (dayIndex) => {
    const d = schedule[dayIndex];
    if (!d.active) return;
    if (!d.rest?.start || !d.rest?.end) return;
    try {
      await rest.mutateAsync(
        {
          starting_time: d.rest.start,
          finish_time: d.rest.end,
          day_of_week: dayIndex,
          reason: "Break",
        },
        {
          onSuccess: () => {
            scheduleFetch();
            setShowRest(true);
          },
        },
      );
      console.log(`Rest saved for day ${dayIndex}`);
    } catch (err) {
      console.error("Rest save failed:", err);
    }
  };

  const handleSaveSchedule = async () => {
    const entries = schedule;
    const activeDays = entries
      .map((d, index) => ({
        ...d,
        day_of_week: index,
      }))
      .filter((d) => d.active)
      .map((d) => ({
        id: d.id,
        day_of_week: d.day_of_week,
        starting_time: d.start,
        finish_time: d.end,
        max_appointments: d.max,
      }));
    const toDelete = entries.filter((d) => !d.active && d.id).map((d) => d.id);
    try {
      await hour.mutateAsync({
        schedule: activeDays,
      });
      await Promise.all(
        toDelete.map((id) =>
          deleteSchedule.mutateAsync(id, {
            onSettled: () => {
              console.log("delete success");
            },
          }),
        ),
      );
      console.log("Schedule updated successfully");
      scheduleFetch();
    } catch (err) {
      console.error("Schedule update failed:", err);
    }
  };

  const handlePfp = async (e) => {
    const selectedIm = e.target.files[0];
    if (selectedIm) {
      uploadDocument.mutate(selectedIm, {
        onSuccess: async (data) => {
          profile.mutate(data, {
            onSuccess: () => setPreview(URL.createObjectURL(selectedIm)),
          });
        },
      });
    }
  };

  const [selectedDay, setSelectedDay] = useState(0);
  const [schedule, setSchedule] = useState([
    {
      id: null,
      active: false,
      start: "09:00",
      end: "17:00",
      max: 1,
      rest: { start: "12:00", end: "13:00" },
      existsInSchedule: false,
    },
    {
      id: null,
      active: false,
      start: "09:00",
      end: "17:00",
      max: 1,
      rest: { start: "12:00", end: "13:00" },
      existsInSchedule: false,
    },
    {
      id: null,
      active: false,
      start: "09:00",
      end: "17:00",
      max: 1,
      rest: { start: "12:00", end: "13:00" },
      existsInSchedule: false,
    },
    {
      id: null,
      active: false,
      start: "09:00",
      end: "17:00",
      max: 1,
      rest: { start: "12:00", end: "13:00" },
      existsInSchedule: false,
    },
    {
      id: null,
      active: false,
      start: "09:00",
      end: "17:00",
      max: 1,
      rest: { start: "12:00", end: "13:00" },
      existsInSchedule: false,
    },
    {
      id: null,
      active: false,
      start: "09:00",
      end: "17:00",
      max: 1,
      rest: { start: "12:00", end: "13:00" },
      existsInSchedule: false,
    },
    {
      id: null,
      active: false,
      start: "09:00",
      end: "17:00",
      max: 1,
      rest: { start: "12:00", end: "13:00" },
      existsInSchedule: false,
    },
  ]);

  function getYearDifference(dateString) {
    const inputDate = new Date(dateString);
    const today = new Date();
    let diff = today.getFullYear() - inputDate.getFullYear();
    const hasNotReachedAnniversary =
      today.getMonth() < inputDate.getMonth() ||
      (today.getMonth() === inputDate.getMonth() &&
        today.getDate() < inputDate.getDate());
    if (hasNotReachedAnniversary) {
      diff--;
    }
    return diff;
  }

  const updateDay = (day, field, value) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === day ? { ...item, [field]: value } : item)),
    );
  };

  const updateRest = (day, field, value) => {
    setSchedule((prev) =>
      prev.map((item, i) =>
        i === day ? { ...item, rest: { ...item.rest, [field]: value } } : item,
      ),
    );
  };

  useEffect(() => {
    refetch();
  }, []);

  if (isLoading || scheduleLoading || serviceLoading) {
    return (
      <div className={styles.spin}>
        <TailSpin height="60" width="60" color="#215eed"></TailSpin>
      </div>
    );
  } else if (data?.data) {
    return (
      <div className="profile-container">
        {/* Top Navigation Bar */}
        <main className="main">
          <div className="page-heading">
            <h2>Doctor Profile Management</h2>
            <p>
              Manage your public presence, clinical availability, and security
              settings.
            </p>
          </div>

          {/* Three Column Grid */}
          <div className="grid-main">
            {/* ── Left Column ── */}
            <div className="col-left">
              {/* Profile Card */}
              <aside className={styles.aside}>
                <h2 className={styles.asideHeader}>{data?.data.first_name}</h2>
                <div className={styles.profileContain}>
                  <label className={styles.profileContainLabel}>
                    {!preview ? (
                      <div className={styles.profileContainLab}>
                        <span className={styles.profileContainIcon}>
                          add_a_photo
                        </span>
                        <p className={styles.profileContainPara}>
                          Upload Portrait
                        </p>
                        <input
                          className={styles.profileContainInput}
                          onChange={async (e) => handlePfp(e)}
                          type="file"
                          accept="image"
                        />
                      </div>
                    ) : (
                      <>
                        <input
                          className={styles.profileContainInput}
                          onChange={async (e) => {
                            handlePfp(e);
                          }}
                          type="file"
                          accept="image"
                        />
                        <img
                          className={styles.profileContainIm}
                          src={preview}
                          alt="profile"
                        />
                      </>
                    )}
                  </label>

                  <div className={styles.profileAdd}>
                    <span className={styles.addIcon}>
                      {uploadDocument.isPending || profile.isPending ? (
                        <TailSpin
                          height="20"
                          width="20"
                          color="#ffffff"
                        ></TailSpin>
                      ) : !preview ? (
                        "add"
                      ) : (
                        "replace_image"
                      )}
                    </span>
                  </div>
                </div>
                <div className={styles.profileUnder}>
                  <p className={styles.profileUnderPara}>
                    {!preview
                      ? "Upload a professional headshot. High resolution JPG or PNG preferred for patient trust."
                      : "Click your profile picture to change it at anytime.Save draft to keep your changes."}
                  </p>
                  <div className={styles.profileUnderNotice}>
                    <span className={styles.underIcon}>check_circle</span>
                    <p>{!replace ? data?.data.username : userName}</p>
                  </div>
                </div>
              </aside>

              {/* Security Settings - Updated */}
              <div className="card security-card">
                <h3 className="security-title">
                  <span className="material-symbols-outlined">
                    shield_person
                  </span>
                  Account Security
                </h3>
                <div className="security-list">
                  <div
                    onClick={() => setShowPass(true)}
                    className="security-item"
                  >
                    <div className="security-item-left">
                      <div className="security-icon">
                        <span className="material-symbols-outlined">lock</span>
                      </div>
                      <div>
                        <div className="security-label">Change Password</div>
                        <div className="security-sublabel"></div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined chevron">
                      chevron_right
                    </span>
                  </div>

                  {showPass && (
                    <div className={styles.modalOverlayP}>
                      <div className={styles.modalContentP}>
                        <div className={styles.main}>
                          <div className={styles.leftSide}>
                            <button
                              onClick={() => setShowPass(false)}
                              className={styles.leftBack}
                            >
                              <span className={styles.backIcon}>
                                arrow_back
                              </span>
                              <span style={{ fontWeight: 500 }}>Go Back</span>
                            </button>
                            <div>
                              <h3 className={styles.leftHead}>
                                <span className={styles.leftLogoIcon}>
                                  verified_user
                                </span>
                                Security Guidelines
                              </h3>
                              <p className={styles.leftPara}>
                                MEDIORA uses industry-leading end-to-end
                                encryption. Create a strong password to protect
                                your sensitive medical data and history.
                              </p>
                              <Conditions password={newPass} />
                            </div>
                            <div
                              className={
                                !conditionsVerify(newPass) || !pass || !newPass
                                  ? styles.saveStop
                                  : styles.saveFlexW
                              }
                            >
                              {!changePass.isPending ? (
                                <button
                                  disabled={
                                    !conditionsVerify(newPass) ||
                                    !pass ||
                                    !newPass
                                  }
                                  onClick={async () => {
                                    changePass.mutate(
                                      {
                                        password: newPass,
                                        current_password: pass,
                                      },
                                      {
                                        onSuccess: () => {
                                          setPass("");
                                          setNewPass("");
                                          setShowPass(false);
                                        },
                                      },
                                    );
                                  }}
                                  className={
                                    !conditionsVerify(newPass) ||
                                    !pass ||
                                    !newPass
                                      ? styles.stopDraft
                                      : styles.draft
                                  }
                                >
                                  Confirm New Password
                                </button>
                              ) : (
                                <TailSpin
                                  height="20"
                                  width="20"
                                  color="#ffffff"
                                ></TailSpin>
                              )}
                            </div>
                            {changePass.isError && (
                              <span
                                className={`${styles.be} ${styles.errorText}`}
                              >
                                Re-check your current password and try again.
                              </span>
                            )}
                          </div>
                          <div className={styles.rightSide}>
                            <div className={styles.formContain}>
                              <form className={styles.form}>
                                <div className={styles.inputDiv}>
                                  <label
                                    className={styles.label}
                                    htmlFor="password"
                                  >
                                    Current Password
                                  </label>
                                  <div>
                                    <input
                                      onChange={(e) => {
                                        setPass(e.target.value);
                                        changePass.reset();
                                      }}
                                      className={styles.input}
                                      placeholder="••••••••"
                                      type="password"
                                      id="password"
                                    />
                                  </div>
                                  <span
                                    onClick={() => navigate("/forgotpass")}
                                    className={styles.beF}
                                  >
                                    Forgot Password?
                                  </span>
                                </div>
                                <div className={styles.inputDiv}>
                                  <label
                                    className={styles.label}
                                    htmlFor="confirm-password"
                                  >
                                    New Password
                                  </label>
                                  <div>
                                    <input
                                      onChange={(e) => {
                                        setNewPass(e.target.value);
                                        changePass.reset();
                                      }}
                                      className={styles.input}
                                      id="confirm-password"
                                      type="password"
                                      placeholder="••••••••"
                                    />
                                  </div>
                                  <StrengthLabel passw={newPass} />
                                </div>
                                <div className={styles.infoFlex}>
                                  <span className={styles.infoIcon}>info</span>
                                  <p className={styles.infoPara}>
                                    We recommend using a unique password not
                                    used elsewhere.
                                  </p>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => setChange(!change)}
                    className="security-item"
                  >
                    <div className="security-item-left">
                      <div className="security-icon">
                        <span className="material-symbols-outlined">
                          person
                        </span>
                      </div>
                      <div>
                        <div className="security-label">Change Username</div>
                        <div className="security-sublabel">
                          Current: {replace ? userName : data?.data.username}
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined chevron">
                      chevron_right
                    </span>
                  </div>

                  {change &&
                    (!checkUser.isPending ? (
                      <div className={styles.greyAbsolute}>
                        <input
                          className={styles.grey}
                          type="text"
                          placeholder="DrGrey"
                          value={userName}
                          onChange={(e) => {
                            setUserName(e.target.value);
                            checkUser.reset();
                          }}
                        ></input>
                        <span
                          onClick={async () => {
                            checkUser.mutate(
                              { username: userName },
                              {
                                onSuccess: () => {
                                  setReplace(true);
                                  setChange(false);
                                },
                              },
                            );
                          }}
                          className={styles.greyIcon}
                        >
                          check
                        </span>
                      </div>
                    ) : (
                      <div className={styles.checkWait}>
                        <TailSpin
                          height="20"
                          width="20"
                          color="#215eed"
                        ></TailSpin>
                      </div>
                    ))}

                  {checkUser.isError &&
                    (checkUser.error?.response?.status === 409 ? (
                      <span className={`${styles.be} ${styles.errorText}`}>
                        Username already taken.
                      </span>
                    ) : (
                      <span className={`${styles.be} ${styles.errorText}`}>
                        Re-check your username and try again.
                      </span>
                    ))}

                  <div
                    onClick={async () => {
                      localStorage.removeItem("authToken");
                      localStorage.removeItem("doctorId");
                      localStorage.removeItem("doctorUsername");

                      logout.mutate();
                    }}
                    className="security-item"
                  >
                    <div className="security-item-left">
                      <div className="security-icon">
                        {logout.isPending ? (
                          <TailSpin
                            height="20"
                            width="20"
                            color="#215eed"
                          ></TailSpin>
                        ) : (
                          <span className="material-symbols-outlined">
                            logout
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="security-label">Log Out</div>
                        <div className="security-sublabel"></div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined chevron">
                      chevron_right
                    </span>
                  </div>
                </div>
              </div>

              {/* SAVE DRAFT BUTTON - MOVED HERE */}
              <div
                onClick={async () => {
                  update.mutate(
                    {
                      first_name: data.data.first_name,
                      username: userName,
                      description: text,
                      clinic_posx: location?.lat?.toString(),
                      clinic_posy: location?.lng?.toString(),
                    },
                    {},
                  );
                }}
                className={styles.saveFlex}
              >
                {update?.isPending ? (
                  <TailSpin width="20" height="20" color="#215eed"></TailSpin>
                ) : (
                  <>
                    <span className={styles.save}>save</span>
                    <button className={styles.draft}>Save Draft</button>
                  </>
                )}
              </div>
            </div>

            {/* ── Center Column ── */}
            <div className="col-center">
              <div className="card pro-card">
                <h3 className="section-title">Professional Information</h3>
                <div className="form-stack">
                  <div className="form-textarea-contain">
                    <label className="form-label">
                      About Me/Clinic Information
                    </label>
                    <textarea
                      onChange={(e) => setText(e.target.value)}
                      className="form-textarea"
                      spellCheck={false}
                      value={text}
                      rows={2}
                      placeholder="Describe your experience, specialties, and approach to patient care..."
                    />
                  </div>
                  <div className={styles.spaceFlex}>
                    <div className={styles.space}>
                      <span className={styles.underIcon}>school</span>
                      <p className={styles.paraSpace}>
                        {data?.data.institution}
                      </p>
                    </div>
                    <div className={styles.space}>
                      <span className={styles.underIcon}>work_history</span>
                      <p className={styles.paraSpace}>
                        {getYearDifference(data?.data.practice_start_date)}
                        {getYearDifference(data?.data.practice_start_date) === 1
                          ? " year of experience"
                          : " years of experience"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.services}>
                <div className={styles.serviceLabelFlex}>
                  <label>
                    {service.length === 0 ? "" : "Professional Services"}
                  </label>
                </div>
                <div
                  className={
                    service.length > 0 ? styles.serviceGrid : styles.notFound
                  }
                >
                  {service.length > 0 &&
                    service.map((d, index) => (
                      <div className={styles.serviceInfo} key={index}>
                        <span className={styles.serviceSpanW}>{d.name}</span>
                        <span className={styles.serviceSpan}></span>
                        <span className={styles.serviceSpan}>
                          {d.description}
                        </span>
                      </div>
                    ))}
                  {service.length === 0 && (
                    <div className={styles.serviceHeadMissing}>
                      <h2 className={styles.serviceHead}>No Services Found</h2>
                      <p className={styles.servicePara}>
                        Offer different services for patients and start taking
                        reservations.
                      </p>
                    </div>
                  )}
                </div>
                <div className={styles.saveFlexW}>
                  <button
                    className={styles.draft}
                    onClick={() => setShowService(true)}
                  >
                    Add New Service
                  </button>
                </div>

                {showService && (
                  <div className={styles.modalOverlayP}>
                    <div className={styles.modalContentPHE}>
                      <div className={styles.leaveFlex}>
                        <label className={styles.serviceLabelE}>
                          Create a new Service
                        </label>
                        <button
                          className={styles.mapButton}
                          onClick={() => setShowService(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <div>
                        <div className={styles.serviceFieldDiv}>
                          <label className={styles.serviceLabel}>
                            Service Name
                          </label>
                          <input
                            className={styles.serviceInput}
                            value={serviceName}
                            type="text"
                            onChange={(e) => setServiceName(e.target.value)}
                            placeholder="Consultation"
                          />
                        </div>
                        <div className={styles.serviceFieldDiv}>
                          <label className={styles.serviceLabel}>
                            Service Price
                          </label>
                          <input
                            className={styles.serviceInput}
                            value={servicePrice}
                            type="number"
                            onChange={(e) => setServicePrice(e.target.value)}
                            placeholder="1000DA"
                          />
                        </div>
                        <div className={styles.serviceFieldDiv}>
                          <label className={styles.serviceLabel}>
                            Service Description
                          </label>
                          <textarea
                            className={styles.serviceArea}
                            value={serviceDescription}
                            rows={4}
                            spellCheck={false}
                            maxLength={200}
                            onChange={(e) =>
                              setServiceDescription(e.target.value)
                            }
                          ></textarea>
                        </div>
                      </div>
                      <div className={styles.saveFlexW}>
                        {!postService.isPending ? (
                          <button
                            className={styles.draft}
                            onClick={() => {
                              postService.mutate(
                                {
                                  name: serviceName,
                                  price: servicePrice,
                                  description: serviceDescription,
                                },
                                {
                                  onSuccess: () => {
                                    setShowService(false);
                                    serviceRefetch();
                                  },
                                },
                              );
                            }}
                          >
                            Add Service
                          </button>
                        ) : (
                          <TailSpin
                            height="20"
                            width="20"
                            color="#215eed"
                          ></TailSpin>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.mandatory}>
                <span className={styles.mandatoryIcon}>info</span>
                <span className={styles.mandatoryPara}>
                  To enable appointment booking and ensure smooth clinic
                  workflow, please complete your working days, maximum patient
                  capacity, and clinic information.
                </span>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="col-right">
              <div className="card practice-card">
                <h3 className="section-title">Practice Management</h3>

                <div className="practice-stack">
                  {/* ── Working Days ── */}
                  <div>
                    <label
                      className="form-label"
                      style={{ marginBottom: "1rem" }}
                    >
                      Working Days
                    </label>

                    <div className="days-grid">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (d, i) => (
                          <label key={i} className="day-label">
                            <input
                              type="checkbox"
                              className="fade"
                              checked={schedule[i].active}
                              onChange={() =>
                                updateDay(i, "active", !schedule[i].active)
                              }
                            />
                            <div
                              className="day-box"
                              onClick={() => setSelectedDay(i)}
                              style={{
                                background: schedule[i].active ? "#215eed" : "",
                              }}
                            >
                              {d[0]}
                            </div>
                            <span
                              className={
                                selectedDay !== i ? "day-name" : "day-blue"
                              }
                            >
                              {d}
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  </div>

                  {/* ── Consultation Hours (per selected day) ── */}
                  <div>
                    <label
                      className="form-label"
                      style={{ marginBottom: "0.75rem" }}
                    >
                      Consultation Hours
                    </label>

                    <div className="hours-row">
                      <div className="time-wrap">
                        <span className="material-symbols-outlined">work</span>
                        <input
                          className="form-time"
                          type="time"
                          disabled={!schedule[selectedDay].active}
                          value={schedule[selectedDay].start}
                          onChange={(e) =>
                            updateDay(selectedDay, "start", e.target.value)
                          }
                        />
                      </div>

                      <span className="hours-sep">to</span>

                      <div className="time-wrap">
                        <span className="material-symbols-outlined">work</span>
                        <input
                          className="form-time"
                          type="time"
                          disabled={!schedule[selectedDay].active}
                          value={schedule[selectedDay].end}
                          onChange={(e) =>
                            updateDay(selectedDay, "end", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {schedule[selectedDay].existsInSchedule && (
                    <div>
                      <div>
                        <label
                          className="form-label"
                          style={{ marginBottom: "0.75rem" }}
                        >
                          Break Time
                        </label>

                        <div className="hours-row">
                          <div className="time-wrap">
                            <span className="material-symbols-outlined">
                              free_breakfast
                            </span>
                            <input
                              className="form-time"
                              type="time"
                              disabled={!schedule[selectedDay].active}
                              value={schedule[selectedDay].rest.start}
                              onChange={(e) =>
                                updateRest(selectedDay, "start", e.target.value)
                              }
                            />
                          </div>

                          <span className="hours-sep">to</span>

                          <div className="time-wrap">
                            <span className="material-symbols-outlined">
                              free_breakfast
                            </span>
                            <input
                              className="form-time"
                              type="time"
                              disabled={!schedule[selectedDay].active}
                              value={schedule[selectedDay].rest.end}
                              onChange={(e) => {
                                updateRest(selectedDay, "end", e.target.value);
                                rest.reset();
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      {rest.isError && rest.error?.response?.status === 409 && (
                        <span className={`${styles.be} ${styles.errorText}`}>
                          Rest already exists in that time
                        </span>
                      )}
                      <div className={styles.saveFlexWH}>
                        <div className={styles.saveFlexW}>
                          {!rest.isPending ? (
                            <button
                              disabled={!schedule[selectedDay].active}
                              onClick={() => handleSaveRest(selectedDay)}
                              className={styles.draft}
                            >
                              Add Rest
                            </button>
                          ) : (
                            <TailSpin
                              width="20"
                              height="20"
                              color="#215eed"
                            ></TailSpin>
                          )}
                        </div>
                        <div className={styles.saveFlexW}>
                          <button
                            onClick={() => {
                              console.log(schedule[selectedDay]?.rest_times);
                              setShowRest(true);
                            }}
                            className={styles.draft}
                          >
                            View Rests
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showRest && (
                    <div className={styles.modalOverlayP}>
                      <div className={styles.modalContentPH}>
                        <div className={styles.labelFlex}>
                          <label className={styles.labelAlign}>
                            Resting Times
                          </label>
                          <button
                            className={styles.draftE}
                            onClick={() => setShowRest(false)}
                          >
                            ✕
                          </button>
                        </div>
                        <div className={styles.saveFlexWH}>
                          {schedule[selectedDay]?.rest_times?.map(
                            (d, index) => (
                              <div key={index}>
                                <p className={styles.be}>{d.starting_time}</p>
                                <p className="hours-sep">to</p>
                                <p className={styles.be}>{d.finish_time}</p>

                                <div className={styles.saveFlexWHE}>
                                  {!deleteRest.isPending ? (
                                    <button
                                      className={styles.draft}
                                      onClick={() => {
                                        deleteRest.mutate(d.id, {
                                          onSuccess: () => {
                                            scheduleFetch();
                                          },
                                        });
                                      }}
                                    >
                                      Delete Rest
                                    </button>
                                  ) : (
                                    <TailSpin
                                      height="20"
                                      width="20"
                                      color="#215eed"
                                    />
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Max Patients ── */}
                  <div>
                    <div className="patients-header">
                      <span className="patients-label">Max Patients/Day</span>
                      <span className="patients-badge">
                        {schedule[selectedDay].max} Patients
                      </span>
                    </div>

                    <input
                      className="range-input"
                      type="range"
                      disabled={!schedule[selectedDay].active}
                      min="1"
                      max="20"
                      value={schedule[selectedDay].max}
                      onChange={(e) =>
                        updateDay(selectedDay, "max", Number(e.target.value))
                      }
                    />

                    <div className="range-ticks">
                      <span>1</span>
                      <span>10</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>

                <div onClick={handleSaveSchedule} className={styles.saveFlexW}>
                  {hour?.isPending ? (
                    <TailSpin width="20" height="20" color="#215eed" />
                  ) : (
                    <>
                      <button className={styles.draft}>Save Schedule</button>
                    </>
                  )}
                </div>
              </div>

              {/* SAVE DRAFT BUTTON REMOVED FROM HERE */}
            </div>
          </div>
        </main>
      </div>
    );
  } else {
    return <p>Bruh</p>;
  }
}
