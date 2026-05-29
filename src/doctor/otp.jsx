import { useRef } from "react";
import { useState } from "react";
import styles from './doctor-forgot-pass/doctor-new-pass/doctor-new-pass.module.css'
import styless from './doctor-signup/doctor-signup-second/doctor-signup-second.module.css'
import { useEffect } from "react";
export default function Otp({length=7,grid=false,onComplete}){
   const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRef = useRef([]);
  useEffect(() => {
  if (otp.every((n) => n !== "")) {
    onComplete && onComplete(otp.join(""));
  } else {
    onComplete && onComplete("");
  }
}, [otp]);
  // Handle input change
  const handleChange = (e, index) => {
    let val = e.target.value.replace(/\D/g, ""); // numeric only
    if (!val) return;
    const newOtp = [...otp];
    newOtp[index] = val[0]; // only take first character
    setOtp(newOtp);

    // Move focus to next input
    if (index < length - 1) {
      inputRef.current[index + 1].focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];

      if (otp[index] !== "") {
        // Clear current input
        newOtp[index] = "";
        setOtp(newOtp);
        inputRef.current[index].focus();
      } else if (index > 0) {
        // Move back and clear previous
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRef.current[index - 1].focus();
      }
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!paste) return;

    const newOtp = [...otp];
    for (let i = 0; i < length; i++) {
      newOtp[i] = paste[i] || "";
    }
    setOtp(newOtp);

    // Focus last filled input
    const lastFilled = Math.min(paste.length, length - 1);
    inputRef.current[lastFilled].focus();

  };

  return (
    <div className={!grid?styless.otpContain:styless.otpGrid}>
      {otp.map((value, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={!grid?styless.otpInput:styless.inGrid}
          value={value}
          ref={(el) => (inputRef.current[index] = el)}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
export function Conditions({password,conditions=[
      { id: 1, text: "At least 8 characters", test: /.{8,}/ },
       { id: 2, text: "Contains a number", test: /\d/ },
       { id: 3, text: "Contains an uppercase letter", test: /[A-Z]/ },
              { id: 4, text: "Contains a special character", test: /[!@#$%^&*]/ }
    ]}){
        return (
    <div className={styles.requiGrid} >
      {conditions.map(({ id, text, test }) => {
        const isValid = test.test(password);
        return (
          <div
            key={id}
            className={isValid? styles.requiFlexFul:styles.requiFlex}
          >
            <span className={styles.requiIcon}>check_circle</span>
            <span>
              {text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
export function conditionsVerify(password,conditions=[
      { id: 1, text: "At least 8 characters", test: /.{8,}/ },
       { id: 2, text: "Contains a number", test: /\d/ },
       { id: 3, text: "Contains an uppercase letter", test: /[A-Z]/ },
              { id: 4, text: "Contains a special character", test: /[!@#$%^&*]/ }
    ]){
   return conditions.every(con=>con.test.test(password));
}
export function StrengthLabel({ passw, segment = 5 }) {
  function calculateStrength(passw) {
    let score = 0;
    if (passw.length >= 8) score++;
    if (/[a-z]/.test(passw)) score++;
    if (/[A-Z]/.test(passw)) score++;
    if (/[0-9]/.test(passw)) score++;
    if (/[^A-Za-z0-9]/.test(passw)) score++;
    return score;
  }

  const strength = calculateStrength(passw);

  function getStrengthLabel() {
    switch (strength) {
      case 0:
      case 1:
        return "Very Weak";
      case 2:
        return "Weak";
      case 3:
        return "Medium";
      case 4:
        return "Strong";
      case 5:
        return "Very Strong";
      default:
        return "";
    }
  }

  const filledSegments = Math.min(strength, segment);
  const segmentsArray = Array(segment).fill("");

  return (
    <>
      <div className={styles.powerFlex}>
        {segmentsArray.map((_, index) => (
          <div
            key={`seg-${index}`}
            className={index < filledSegments ? styles.strong : styles.weak}
          ></div>
        ))}
      </div>
      {passw &&
      <p className={styles.strength}>
        Password Strength:{" "}
        <span className={styles.strengthRate}>{getStrengthLabel()}</span>
      </p>}
    </>
  );
}