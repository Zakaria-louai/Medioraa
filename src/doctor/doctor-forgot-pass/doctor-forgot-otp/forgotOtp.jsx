import styles from "./forgotOtp.module.css";
import Otp from "../../otp";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/authContext";
import { TailSpin } from "react-loader-spinner";
export default function ForgotOtp({ next, prev, email }) {
  const { forgotPassword, resetPassword } = useAuth();
  const [timeleft, setTimeleft] = useState(60);
  const [code, setCode] = useState("");
  useEffect(() => {
    if (timeleft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeleft((time) => time - 1);
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [timeleft]);
  return (
    <main className={styles.main}>
      <div className={styles.leftSide}>
        <div className={styles.leftInfo}>
          <button onClick={prev} className={styles.leftBack}>
            <span className={styles.backIcon}>arrow_back</span>
            <span style={{ fontWeight: 500 }}>Go Back</span>
          </button>
          <div className={styles.leftIconCover}>
            <span className={styles.leftIcon}>verified_user</span>
          </div>
          <h1 className={styles.leftHead}>Secure Your Account</h1>
          <p className={styles.leftPara}>
            We've sent a 10-digit verification code to your registered Email
          </p>
        </div>
        <div className={styles.leftBottom}>
          <div className={styles.leftBottomInfo}>
            <div className={styles.leftBottomDot}></div>
            <span className={styles.leftBottomNote}>
              Encrypted AES-256 connection
            </span>
          </div>
        </div>
      </div>
      <div className={styles.rightSide}>
        <div className={styles.rightForm}>
          <div className={styles.rightCall}>
            <h2 className={styles.callHead}>Enter Verification Code</h2>
            <p className={styles.callPara}>
              Please enter the security code to continue your registration.
            </p>
          </div>
          <Otp
            length={10}
            grid={true}
            onComplete={(c) => {
              setCode(c);
              resetPassword.reset();
            }}
          />
          {resetPassword.isError &&
            (resetPassword.error?.response?.status === 401 ? (
              <span className={`${styles.existNot} ${styles.errorText}`}>
                Code invalid or expired
              </span>
            ) : (
              <span className={styles.existNot}>
                An error occured,re-check your code and try again.
              </span>
            ))}
          <div className={styles.verify}>
            <button
              onClick={async () => {
                resetPassword.mutate(
                  { code },
                  {
                    onSuccess: () => next(),
                  },
                );
              }}
              className={
                code && !resetPassword.isPending && !forgotPassword.isPending
                  ? styles.verifyButt
                  : styles.verifyStop
              }
            >
              {resetPassword.isPending || forgotPassword.isPending ? (
                <TailSpin height="20" width="20" color="#215eed"></TailSpin>
              ) : code ? (
                "Verify & Continue"
              ) : (
                "Please Enter the Code"
              )}
            </button>
            <div className={styles.time}>
              <div className={styles.resend}>
                {timeleft === 0 ? "Didn't receive the code?" : ""}
                <button
                  className={
                    timeleft === 0 ? styles.resendButt : styles.resendNo
                  }
                  onClick={async () => {
                    setTimeleft(60);
                    forgotPassword.mutate({ email });
                    resetPassword.reset();
                  }}
                >
                  Resend Code
                </button>
              </div>
              <div className={styles.timeFlex}>
                <span className={styles.clock}>timer</span>
                <span>{timeleft >= 10 ? timeleft : `0${timeleft}`}</span>
              </div>
            </div>
          </div>
          <div className={styles.help}>
            <p className={styles.helpPara}>Need help?</p>
            <a className={styles.helpA} href="#">
              Contact Support Team
              <span className={styles.helpAIcon}>open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
