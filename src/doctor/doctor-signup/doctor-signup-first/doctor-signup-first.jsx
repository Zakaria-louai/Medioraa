import { useEffect, useState } from "react";
import styles from "./doctor-signup-first.module.css";
import LocationPicker from "./map";
import { useAuth } from "../../contexts/authContext";
import { useNavigate } from "react-router";
import { TailSpin } from "react-loader-spinner";
import { useProfile } from "../../../hooks/useUser";
export default function DoctorSignFirst({ setStep }) {
  const { completeSignup, checkUser, uploadDocument } = useAuth();
  const [fullName, setFullName] = useState("");
  const USER_PREFIX = "Dr";
  const [selectedIm, setSelectedIm] = useState(null);
  const [userName, setUserName] = useState(USER_PREFIX);
  const [speciality, setSpeciality] = useState("generaliste");
  const [preview, setPreview] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const profile = useProfile();
  const navigate = useNavigate();
  const [gender, setGender] = useState("male");
  const email = sessionStorage.getItem("email");
  const pass = sessionStorage.getItem("password");
  const handlePfp = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedIm(file);
    setPreview(URL.createObjectURL(file));

    uploadDocument.mutate(file, {
      onSuccess: (data) => {
        setUploadedDoc(data);
      },
    });
  };
  return (
    <div className={styles.dark}>
      <div className={styles.main}>
        <aside className={styles.aside}>
          <div className={styles.profileContain}>
            <h2 className={styles.asideHeader}>Profile Picture</h2>
            <label className={styles.profileContainLabel}>
              {!preview ? (
                <div className={styles.profileContainLab}>
                  <span className={styles.profileContainIcon}>add_a_photo</span>
                  <p className={styles.profileContainPara}>Upload Portrait</p>
                  <input
                    className={styles.profileContainInput}
                    onChange={async (e) => handlePfp(e)}
                    type="file"
                    accept="image/*"
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
                    accept="image/*"
                  />
                  <img className={styles.profileContainIm} src={preview}></img>
                </>
              )}
            </label>

            <div className={styles.profileAdd}>
              <span className={styles.addIcon}>
                {uploadDocument.isPending ? (
                  <TailSpin height="20" width="20" color="#ffffff"></TailSpin>
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
              <span className={styles.underIcon}>info</span>
              <span>visible to all patients</span>
            </div>
          </div>
        </aside>
        <section className={styles.section}>
          <header className={styles.header}>
            <h1 className={styles.headerHead}>Professional Registration</h1>
            <p className={styles.headerPara}>
              Complete your practitioner profile to begin clinical sessions.
            </p>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className={styles.form}>
              <div className={styles.infoDiv}>
                <label className={styles.infoDivLabel}>Full Name</label>
                <input
                  onChange={(e) => setFullName(e.target.value)}
                  className={styles.infoDivText}
                  type="text"
                  placeholder="John Doe"
                />
              </div>
              <div className={styles.infoDiv}>
                <label className={styles.infoDivLabel}>Speciality</label>
                <select
                  onChange={(e) => setSpeciality(e.target.value)}
                  className={styles.infoDivSelect}
                >
                  <option value="generaliste">Generalist</option>
                  <option value="genecology">Gynecology</option>
                  <option value="dentistry">Dentistry</option>
                  <option value="urology">Urology</option>
                  <option value="nephrology">Nephrology</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="orl">ORL</option>
                  <option value="neurology">Neurology</option>
                  <option value="endocrinology">Endocrinology</option>
                  <option value="general surgery">General Surgery</option>
                  <option value="dermatology">Dermatology</option>
                  <option value="pediatric">Pediatric</option>
                  <option value="opthalmology">Opthalmology</option>
                  <option value="traumatology">Traumatology</option>
                  <option value="gastroenterology">Gastroenterology</option>
                </select>
              </div>
              <div className={styles.infoDiv}>
                <label className={styles.infoDivLabel}>User Name</label>
                <input
                  onChange={(e) => {
                    setUserName(e.target.value);
                    checkUser.reset();
                  }}
                  className={styles.infoDivText}
                  type="text"
                  placeholder="Dr. username"
                ></input>
                {checkUser.data?.exists && (
                  <span className={`${styles.exist} ${styles.errorText}`}>
                    Username already Taken
                  </span>
                )}
                {checkUser.isError && (
                  <span className={`${styles.exist} ${styles.errorText}`}>
                    Neither special characters nor spaces allowed
                  </span>
                )}
              </div>
              <div className={styles.spanner}>
                <div className={styles.radio}>
                  <label className={styles.formLabel}>Select Gender</label>
                  <div className={styles.radioGrid}>
                    <div>
                      <input
                        defaultChecked
                        onChange={(e) => setGender(e.target.value)}
                        id="role_patient"
                        type="radio"
                        name="role"
                        value="male"
                        className={styles.roleSelect}
                      ></input>
                      <label
                        htmlFor="role_patient"
                        className={styles.selectFlex}
                      >
                        <span className={styles.selectIcon}>male</span>
                        Male
                      </label>
                    </div>
                    <div>
                      <input
                        onChange={(e) => setGender(e.target.value)}
                        id="role_doctor"
                        type="radio"
                        name="role"
                        value="female"
                        className={styles.roleSelect}
                      ></input>
                      <label
                        htmlFor="role_doctor"
                        className={styles.selectFlex}
                      >
                        <span className={styles.selectIcon}>female</span>
                        Female
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.verify}>
              {completeSignup.isError && (
                <span className={`${styles.exist} ${styles.errorText}`}>
                  Make sure to fill all fields and try again
                </span>
              )}

              <button
                type="button"
                disabled={
                  checkUser.isPending ||
                  completeSignup.isPending ||
                  !fullName ||
                  !userName
                }
                onClick={() => {
                  if (checkUser.isPending || completeSignup.isPending) return;
                  checkUser.mutate(
                    { username: userName },
                    {
                      onSuccess: (data) => {
                        if (!data.exists) {
                          if (!email || !pass) {
                            setStep(1);
                          }
                          completeSignup.mutate(
                            {
                              first_name: fullName,
                              username: userName,
                              email: email,
                              password: pass,
                              role: "doctor",
                              gender: gender,
                              specialty: speciality,
                            },
                            {
                              onSuccess: async (data) => {
                                profile.mutate(uploadedDoc, {
                                  onSuccess: () => {
                                    navigate("/request-checker");
                                  },
                                });
                              },
                            },
                          );
                        }
                      },
                      onError: (err) => {
                        console.log("FULL ERROR:", err);
                        console.log("MESSAGE:", err.message);
                        console.log("RESPONSE:", err.response);
                      },
                    },
                  );
                }}
                className={
                  checkUser.isPending ||
                  completeSignup.isPending ||
                  !fullName ||
                  !userName ||
                  !preview
                    ? styles.wait
                    : styles.continue
                }
              >
                {checkUser.isPending ||
                completeSignup.isPending ||
                profile.isPending ? (
                  <TailSpin height="20" width="20" color="#215eed"></TailSpin>
                ) : fullName && userName && preview ? (
                  "Confirm Information"
                ) : (
                  "Please Enter your Informations and Portrait"
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
