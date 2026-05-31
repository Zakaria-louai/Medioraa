import { useState } from "react";
import { Conditions, conditionsVerify, StrengthLabel } from "../../otp";
import styles from "./doctor-new-pass.module.css";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/authContext";
import { TailSpin } from "react-loader-spinner";

export default function DoctorNewPass({ setStep }) {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [coPassword, setCoPassword] = useState("");

  return (
    <>
      <div className={styles.mainContainer}>
        <div className={styles.leftSide}>
          <div className={styles.leftInfo}>
            <div className={styles.leftLogo}>
              <span className={styles.icon}>medical_services</span>
              <span className={styles.med}>MEDIORA</span>
            </div>
            <h2 className={styles.leftHead}>Security is our top priority</h2>
            <p className={styles.leftPara}>
              Protecting patient data starts with a strong, unique password.
            </p>
            <div className={styles.leftDescs}>
              <div className={styles.desc}>
                <div className={styles.iconCover}>
                  <span className={styles.descIcons}>medical_services</span>
                </div>
                <div>
                  <h4 className={styles.descHead}>Multi-factor ready</h4>
                  <p className={styles.descPara}>
                    Your password is the first layer of defense.
                  </p>
                </div>
              </div>
              <div className={styles.desc}>
                <div className={styles.iconCover}>
                  <span className={styles.descIcons}>lock_reset</span>
                </div>
                <div>
                  <h4 className={styles.descHead}>Strength indicator</h4>
                  <p className={styles.descPara}>
                    Follow our real-time feedback for maximum security.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.imageContain}>
            <img
              className={styles.image}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1iWVJeuPhCser31_G6psi7CAVzav1ciGmrD6kri4TgMi226hiK_hnHij5qnqeoKmtNTvX8ijQGAB5jyuqHdCZao2wPrq1ZtT0wsIgB16p6S4VPHBVbdzLjFDUjU6EAkgxYRVb8-Ar5Rc5-075K962CjFXUNDw_uFQytaMP4AIVIStIFpRDUFK-RebGJ21z3Baa8dTSBgGHs1SaCxNwPMeaO6RpALqObbVSBq9rf8UenSHlrDFtIYr2jIEove2IO_nKyB_Jp0UkLyV"
              alt="Medical"
            />
          </div>
        </div>
        <div className={styles.rightSide}>
          <div className={styles.rightContainer}>
            <div className={styles.rightLogoFlex}>
              <span className={styles.iconRight}>medical_services</span>
              <span className={styles.medRight}>MEDIORA</span>
            </div>
            <div className={styles.call}>
              <h1 className={styles.callHeader}>Create New Password</h1>
              <p className={styles.callPara}>
                Please enter a new password to secure your Mediora medical account.
              </p>
            </div>
            <form className={styles.form}>
              <div className={styles.passwordIn}>
                <label className={styles.passLabel} htmlFor="new_password">
                  New Password
                </label>
                <div>
                  <input
                    onChange={(e) => {
                      setPassword(e.target.value);
                      updatePassword.reset();
                    }}
                    className={styles.input}
                    id="new_password"
                    type="password"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className={styles.strengthContain}>
                  <StrengthLabel passw={password} />
                </div>
              </div>
              <div className={styles.passwordIn}>
                <label className={styles.passLabel} htmlFor="confirm_password">
                  Confirm New Password
                </label>
                <div>
                  <input
                    onChange={(e) => {
                      setCoPassword(e.target.value);
                      updatePassword.reset();
                    }}
                    className={styles.input}
                    type="password"
                    placeholder="Repeat Password"
                    id="confirm_password"
                  />
                </div>
              </div>
              {password !== coPassword && coPassword && (
                <p className={styles.match}>Passwords must match</p>
              )}
              <div className={styles.requi}>
                <h4 className={styles.requiHead}>Requirements</h4>
                <Conditions password={password} />
              </div>
              {updatePassword.isError && (
                <span className={`${styles.existNot} ${styles.errorText}`}>
                  An error occurred, try again.
                </span>
              )}
              <div className={styles.buttons}>
                <button
                  onClick={async () => {
                    updatePassword.mutate(
                      { password },
                      {
                        onSuccess: () => {
                          sessionStorage.removeItem("current");
                          setStep(1);
                          navigate("/signin");
                        },
                      }
                    );
                  }}
                  className={styles.upButt}
                  type="button"
                  disabled={
                    !conditionsVerify(password) ||
                    password !== coPassword ||
                    updatePassword.isPending
                  }
                >
                  {updatePassword.isPending ? (
                    <TailSpin height="20" width="20" color="#215eed" />
                  ) : !conditionsVerify(password) || password !== coPassword ? (
                    "Please check the Requirements"
                  ) : (
                    "Update Password"
                  )}
                  {!updatePassword.isPending && (
                    <span className={styles.buttIcon}>arrow_forward</span>
                  )}
                </button>
                <div className={styles.a}>
                  <span className={styles.aIcon}>arrow_back</span>
                  <Link className={styles.noUnder} to="/signin">
                    Back to Login
                  </Link>
                </div>
              </div>
            </form>
            <div className={styles.footer}>
              <p className={styles.para}>
                Need Help?{" "}
                <a className={styles.aFoot} href="#">
                  Contact MEDIORA support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}