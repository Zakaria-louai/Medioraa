import { useContext } from "react"
import { SignupContext } from "../signupContext"
import './step1.css'

export default function Signup1(){
    const {formData,setFormData,step,nextStep}=useContext(SignupContext);
    return(
        <div className="step1">
            <div className="complete1Flex">
             <span className="completeStep1">Step 1 of 3:Personal Details</span>
             <span className="completeStep1grey">33% Complete</span>
            </div>
        <div className="oneThirdFlex">
         <div className='bar1 bar1Color'></div>
         <div className='bar1'></div>
         <div className='bar1'></div>
        </div>
        <div className="step1Flex">
        <div className="step1ImFlex">
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuARuzrU5BInM8N7Ul7R2cn4pF-I_vQJIQv7ks61JVmCOU7u_2a7Dyua0iR4WqaIEqCGP7WPV0xPkNQNtYu5-EqpHauCTQdUVr1d0KUW4tazOM6RJRRAY0bt_HW8K9EwauLV-RN-eRwyx_0h15lZeJ39jLVLN-tJmBdLElRZEuoIhJYHiYVMKz-y2hmq-08XpU_BQdWDvMix6TEDSfnOdcat1kiaI8PhlYTRcKgNSt_Sno4lLT6aXJDyJvEpJ1-T5pcOYJFTHDFG7ruD" className="Im1"/>
        <h2>Join Our Community</h2>
        <p>Connect with top healthcare professionals and manage your medical profile seamlessly</p>
        </div>
        <form className="step1Form">
            <div className="saveSignUp">
         <h2 className="callSignUp1">Create Account</h2>
         <p className="pSignUp1">Tell us a bit about yourself to get started</p>
         <div className="nameFlex">
          <div className="nameFirst">
            <label htmlFor="nameIn" className="nameFirstLabel">First Name</label>
            <input id="nameIn" type="text" placeholder="John" value={formData.fname} onChange={(e)=>{setFormData({
                ...formData,
                fname:e.target.value
            })}} className="firName"/>
          </div>
          <div className="nameFirst">
            <label htmlFor="nameLin" className="nameFirstLabel">Last Name</label>
            <input id="nameLin" type="text" placeholder="Doe" value={formData.lname} onChange={(e)=>setFormData({
                ...formData,
                lname:e.target.value
            })} className="firName"/>
          </div>
         </div>
         <div className="emailFlex">
            <div className="useName">
            <label htmlFor="nameU" className="nameFirstLabel">Username</label>
            <input id="nameU" type="text" placeholder="@JohnDoe" value={formData.uname} onChange={(e)=>setFormData({
                ...formData,
                uname:e.target.value
            })} className="firName"/>
            </div>
            <div className="emailU">
            <label htmlFor="emu" className="nameFirstLabel">Email</label>
            <input id="emu" className="firName" type="email" placeholder="yourname@domain.com" value={formData.email} onChange={(e)=>setFormData({
                ...formData,
                email:e.target.value
            })}/>
            </div>
         </div>
         <div className="next1Flex">
            <div className="nextArrowFlex" onClick={nextStep}>
         <button className="buttSignUp" >Next Step </button>
         <img src='src\signup\step1\step1Pics\arrow-right-svgrepo-com.svg' className="arrow"/>
            </div>
         </div>
         </div>
        </form>
        </div>
        </div>
    )
}