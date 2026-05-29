import {useState} from 'react'
import { SignupContext } from './signupContext';
import Signup1 from './step1/step1';
import {motion,AnimatePresence} from "framer-motion";
import './signup.css';
import Signup2 from './step2/step2';
import Signup3 from './step3/step3';
export default function SignUp(){
   const [step,setStep]=useState(Number(sessionStorage.getItem("currentStep")||1));
   const [isVerified,setIsVerified]=useState(false);
   const nextStep = ()=>{
    setStep(n=>n+1);
   }
   const prevStep = ()=>{
    setStep(n=>n-1);
   }
   const handleVerified=()=>{
    setIsVerified(!isVerified);
   }
    return(
        <div className="pageFlexSignUp">
        <div className="pageSignUp">    
        <div className="recoFlex">
         <div className="medFlexSignUp">
        <img src="src\signup\signupPics\icons8-medical-bag-64.png" className="medPicSignUp"/>
        <span>MEDIORA</span>
        </div>
       <div className="backFlexSignUp">
        <span>Already have an account?</span>
        <span className="signInSignUp">Sign In</span>
       </div>
        </div>
     
  <AnimatePresence>
    <SignupContext.Provider
  value={{
    formData,
    setFormData,
    step,
    nextStep,
    prevStep,
    isVerified,
    handleVerified,
  }}>
    {step === 1 && (
      <motion.div
        key="step1"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.3 }}
      >
        <Signup1 />
      </motion.div>
    )}

    {step === 2 && (
      <motion.div
        key="step2"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.3 }}
      >
        <Signup2 />
      </motion.div>
    )}
    {step===3 && (
      <motion.div
      kep="step3"
      initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.3 }}
      >
        <Signup3/>
      </motion.div>
    )}
    </SignupContext.Provider>
  </AnimatePresence>
        <footer className="footFlexSignUp">
        <span className="proofSignUp">&copy; MEDIORA Medical Systems.All rights reserved</span>
        <div className="lastFlexSignUp">
        <button className='footerOpSignUp'>Privacy Policy</button>
        <button className='footerOpSignUp'>Terms of Service</button>
        <button className='footerOpSignUp'>Help Center</button>
        </div>
        </footer>
        </div>
        </div>
    )
}