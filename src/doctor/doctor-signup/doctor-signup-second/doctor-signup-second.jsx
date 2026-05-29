import styles from "./doctor-signup-second.module.css";
import Otp from "../../otp";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/authContext";
import { TailSpin } from "react-loader-spinner";
export default function DoctorSignSecond({ next }) {
  const { sendSignupEmail, verifyEmail } = useAuth();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [timeleft, setTimeleft] = useState(59);
  const [otp, setOtp] = useState(false);
  useEffect(() => {
    if (timeleft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeleft((time) => time - 1);
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [timeleft]);
  useEffect(() => setTimeleft(60), [otp]);
  return (
    <main className={styles.main}>
      <div className={styles.leftSide}>
        <div className={styles.leftInfo}>
          <div className={styles.leftIconCover}>
            <span className={styles.leftIcon}>verified_user</span>
          </div>
          <h1 className={styles.leftHead}>Secure Your Account</h1>
          <p className={styles.leftPara}>
            {otp
              ? "We've sent a 7-digit verification code to your registered Email"
              : "verify your Email to begin creating your Mediora account"}
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
        <div className={styles.logoFlex}>
          <span className={styles.icon}>medical_services</span>
          <h1 className={styles.med}>MEDIORA</h1>
        </div>
        <div className={styles.rightForm}>
          <div className={styles.rightCall}>
            <h2 className={styles.callHead}>
              {otp ? "Enter Verification Code" : "Enter your Email Address"}
            </h2>
            <p className={styles.callPara}>
              {otp
                ? "Please enter the security code to continue your registration."
                : "Please enter your Email to continue your registration"}
            </p>
          </div>
          <div className={styles.emailContain}>
            <input
              className={styles.emailIn}
              value={email}
              disabled={otp}
              onChange={(e) => {
                setEmail(e.target.value);
                sendSignupEmail.reset();
              }}
              type="email"
              placeholder="yourname@domain.com"
            />
            <span className={styles.iconM}>mail</span>
            {sendSignupEmail.isError ? (
              sendSignupEmail.error?.response?.status === 409 ? (
                <span className={`${styles.exist} ${styles.errorText}`}>
                  This account already exists
                </span>
              ) : (
                <span className={`${styles.exist} ${styles.errorText}`}>
                  An error occured,re-check your email and try again.
                </span>
              )
            ) : (
              ""
            )}
          </div>
          <div>
            {otp && <Otp length={7} onComplete={(c) => setCode(c)} />}
            {verifyEmail.isError && (
              <span className={`${styles.exist} ${styles.errorText}`}>
                Invalid or Expired Code
              </span>
            )}
          </div>
          <div className={styles.verify}>
            <button
              onClick={
                !otp
                  ? () => {
                      sendSignupEmail.mutate(email, {
                        onSuccess: () => {
                          setOtp(true);
                          sessionStorage.setItem("email", email);
                        },
                      });
                    }
                  : () => {
                      verifyEmail.mutate(
                        { code, email },
                        {
                          onSuccess: (data) => {
                            sessionStorage.setItem("flowToken", data.token);
                            next();
                          },
                        },
                      );
                    }
              }
              className={
                !otp
                  ? email &&
                    !(sendSignupEmail.isPending || verifyEmail.isPending)
                    ? styles.verifyButt
                    : styles.verifyStop
                  : code &&
                      !(sendSignupEmail.isPending || verifyEmail.isPending)
                    ? styles.verifyButt
                    : styles.verifyStop
              }
            >
              {!otp ? (
                email ? (
                  sendSignupEmail.isPending ? (
                    <TailSpin height="20" width="20" color="#215eed"></TailSpin>
                  ) : (
                    "Verify Email"
                  )
                ) : (
                  "Please Enter your Email"
                )
              ) : verifyEmail.isPending || sendSignupEmail.isPending ? (
                <TailSpin height="20" width="20" color="#215eed"></TailSpin>
              ) : code ? (
                "Verify & Continue"
              ) : (
                "Please Enter the Code"
              )}
            </button>
            {otp && (
              <div className={styles.time}>
                <div className={styles.resend}>
                  {timeleft === 0 ? "Didn't receive the code?" : ""}
                  <button
                    className={
                      timeleft === 0 ? styles.resendButt : styles.resendNo
                    }
                    onClick={() => {
                      setTimeleft(60);
                      sendSignupEmail.mutate(email);
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
            )}
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
