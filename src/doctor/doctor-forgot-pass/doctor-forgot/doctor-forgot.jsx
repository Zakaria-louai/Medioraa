import { Link } from "react-router";
import styles from "./doctor-forgot.module.css";
import { useAuth } from "../../contexts/authContext";
import { useState } from "react";
import { TailSpin } from "react-loader-spinner";
export default function DoctorForgot({ emailR, setEmailR, next }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <main className={styles.main}>
      <div className={styles.mainFlex}>
        <div className={styles.leftSide}>
          <div className={styles.lockIconCover}>
            <span className={styles.lockIcon}>lock_reset</span>
          </div>
          <h2 className={styles.reset}>Reset Password</h2>
          <p className={styles.resetPara}>
            To regain access to your healthcare portal, please provide your
            registered credentials. We will send a secure verification link to
            your inbox.
          </p>
          <div className={styles.notes}>
            <div className={styles.notesFlex}>
              <span className={styles.notesIcon}>verified_user</span>
              <span>Secure end-to-end encrypted process</span>
            </div>
            <div className={styles.notesFlex}>
              <span className={styles.notesIcon}>schedule</span>
              <span>Link valid for the next 30 minutes</span>
            </div>
          </div>
        </div>
        <div className={styles.rightSide}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className={styles.form}
          >
            <div>
              <label className={styles.label} htmlFor="recovery-contact">
                Email Address or Phone
              </label>
              <div className={styles.inputField}>
                <span className={styles.mailIcon}>mail</span>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailR(e.target.value);
                    forgotPassword.reset();
                  }}
                  className={styles.input}
                  id="recovery-contact"
                  type="text"
                  placeholder="name@domain.com"
                ></input>
              </div>
              {forgotPassword.isError &&
                (forgotPassword.error?.response?.status === 401 ? (
                  <span className={`${styles.existNot} ${styles.errorText}`}>
                    Invalid Email.
                  </span>
                ) : (
                  <span className={`${styles.existNot} ${styles.errorText}`}>
                    An error has occured,check your Email and try again.
                  </span>
                ))}
            </div>
            <div className={styles.buttons}>
              <button
                type="button"
                disabled={!isValidEmail || forgotPassword.isPending}
                onClick={async () =>
                  forgotPassword.mutate(
                    { email },
                    {
                      onSuccess: () => {
                        next();
                      },
                    },
                  )
                }
                className={
                  !isValidEmail || forgotPassword.isPending
                    ? styles.offButt
                    : styles.button
                }
              >
                <span>
                  {forgotPassword.isPending ? (
                    <TailSpin height="20" width="20" color="#215eed"></TailSpin>
                  ) : isValidEmail ? (
                    "Next"
                  ) : (
                    "Please Enter your Email"
                  )}
                </span>
                {!forgotPassword.isPending && (
                  <span className={styles.buttonIcon}>
                    {isValidEmail ? "arrow_forward" : ""}
                  </span>
                )}
              </button>
              <div className={styles.a}>
                <span className={styles.aIcon}>chevron_left</span>
                <Link className={styles.noUnder} to="/signin">
                  Back to log in screen
                </Link>
              </div>
            </div>
          </form>
          <div className={styles.help}>
            <p className={styles.helpPara}>
              Need help?{" "}
              <a className={styles.helpParaA} href="#">
                Contact MEDIORA support
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
