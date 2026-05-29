import { useState } from "react"
import './step3.css';
export default function Signup3(){
    const [pass,setPass]=useState("");
    const [copass,setCopass]=useState("");
  const calculateStrength = (passw) => {
    let score = 0;

    if (passw.length >= 8) score++;
    if (/[a-z]/.test(passw)) score++;
    if (/[A-Z]/.test(passw)) score++;
    if (/[0-9]/.test(passw)) score++;
    if (/[^A-Za-z0-9]/.test(passw)) score++;

    return score;
  };

  const strength = calculateStrength(pass);

  const getStrengthLabel = () => {
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
  };

  const label = getStrengthLabel();

   return(
<div>
    <div className="complete3Flex">
    <span className="secureOrderSignUp3">Secure Your Account</span>
    <div><span className="stepNumSignUp3">Step 3 of 3</span><br></br>Security Verification</div>
    </div>
    <div className="oneThirdFlex3">
         <div className='bar3'></div>
         <div className='bar3'></div>
         <div className='bar3'></div>
        </div>
    <div className="pageFlexSignUp3">
    <div className="conditionsSignUp3">
    <div className="secureFlexSignUp3">
        <img src="src\signup\step3\step3Pics\outlined-shield-secure-svgrepo-com (1).svg" className="secureImSignUp3"></img>
        <span>Security Guidlines</span>
    </div>
    <p>Create a strong password to protect your sensitive medical data and history.</p>
    <div className="insiderConditionFlexSignUp3">
    <div className="conditionFlexSignUp3">
        <img className="circleImSignUp3" src={pass.length >=8? 
            "src/signup/step3/step3Pics/checkmark-circle-svgrepo-com.svg"
            :"src/signup/step3/step3Pics/empty-circle-svgrepo-com.svg"}></img>
        <span>Minimum 8 characters long</span>
    </div>
    
    <div className="conditionFlexSignUp3">
        <img className="circleImSignUp3" src={/[^A-Za-z0-9\s]/.test(pass)?"src/signup/step3/step3Pics/checkmark-circle-svgrepo-com.svg":"src/signup/step3/step3Pics/empty-circle-svgrepo-com.svg"}></img>
        <span>At least 1 special character (!$#%@)</span>
    </div>
    <div className="conditionFlexSignUp3">
        <img className="circleImSignUp3" src={ /\d/.test(pass)?"src/signup/step3/step3Pics/checkmark-circle-svgrepo-com.svg":"src/signup/step3/step3Pics/empty-circle-svgrepo-com.svg"}></img>
        <span>Include at least 1 number (0-9)</span>
    </div>
    <div className="conditionFlexSignUp3">
        <img className="circleImSignUp3" src={/[A-Z]/.test(pass) && /[a-z]/.test(pass) ?"src/signup/step3/step3Pics/checkmark-circle-svgrepo-com.svg":"src/signup/step3/step3Pics/empty-circle-svgrepo-com.svg"}></img>
        <span>Mixed case (Uppercase & Lowercase)</span>
    </div>
    </div>
    </div>
    <div className="formSignUp3">
    <label htmlFor="passSignUp3" className="passWordSignUp3">Create Password</label>
    <input type="password" id="passSignUp3" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="........" className="passInSignUp3"/>
    <div className="strengthSignUp3">{pass && "strength: "}<span className="strengthColorSignUp3">{pass && label}</span></div>
    <label htmlFor="passCoSignUp3" className="passWordSignUp3">Confirm Password</label>
    <input type="password" id="passCoSignUp3" value={copass} onChange={(e)=>setCopass(e.target.value)} placeholder="........" className="passInSignUp3"/>
    <p className="matchSignUp3">{pass===copass || (pass==="" || copass==="") ? "":"Passwords Must Match"}</p>
    <div className="warningFlexSignUp3">
    <img className="infoImSignUp3" src="src\signup\step3\step3Pics\info-circle-svgrepo-com.svg"></img>
    <span>Passwords are case-sensitive and must match exactly.We recommend using a unique password not used elsewhere</span>
    </div>
    </div>
     </div>
    <button className="doneSignUp3" 
    disabled={pass.length<8 ||!/[^A-Za-z0-9\s]/.test(pass) ||  !/\d/.test(pass) || !/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || pass!==copass}>{pass.length<8 ||!/[^A-Za-z0-9\s]/.test(pass) ||  !/\d/.test(pass) || !/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || pass!==copass ?"Check The Conditions and Try Again":"Create My Account"}</button>
    <p className="endParaSignUp3">By clicking "Create My Account",you agree to MEDIORA's <button className="termsSignUp3">Terms of Service</button> and <button className="termsSignUp3">Privacy Policy</button></p>
</div>
    )
}