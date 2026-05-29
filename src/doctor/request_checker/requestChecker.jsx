import { useState } from "react";
import { useAuth } from "../contexts/authContext";
import styles from "./requestChecker.module.css";
import { TailSpin } from "react-loader-spinner";
import { Conditions, conditionsVerify } from "../otp";
import { Navigate, useNavigate } from "react-router";
import { useEffect } from "react";
import { useUser } from "../../hooks/useUser";
export default function RequestChecker() {
  const validateFile = (file, allowedTypes) => {
    if (!file) return false;

    return allowedTypes.includes(file.type);
  };

  const allowedPdfTypes = ["application/pdf"];

  const allowedImageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];
  const { uploadDocument, fetchMine, sendDocuments, logout } = useAuth();
  const { isLoading, data, error, refetch } = fetchMine;
  const {
    isFetching,
    data: doctorData,
    error: doctor,
    refetch: doctorRefetch,
  } = useUser();
  const [go, setGo] = useState(false);
  const [diploma, setDiploma] = useState(null);
  const [empCer, setEmpCer] = useState(null);
  const [crc, setCrc] = useState(null);
  const [locPics, setLocPics] = useState([]);
  const [wallet, setWallet] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    refetch();
  }, []);
  useEffect(() => {
    doctorRefetch();
  }, []);
  const handleDip = (e) => {
    const selectedDip = e.target.files[0];

    if (!selectedDip) return;

    if (!validateFile(selectedDip, allowedPdfTypes)) {
      alert("Only PDF files are allowed.");
      return;
    }

    setDiploma(selectedDip);
  };
  const handleEmpCer = (e) => {
    const selectedEmpCer = e.target.files[0];

    if (!selectedEmpCer) return;

    if (!validateFile(selectedEmpCer, allowedPdfTypes)) {
      alert("Only PDF files are allowed.");
      return;
    }

    setEmpCer(selectedEmpCer);
  };
  const handleCrc = (e) => {
    const selectedCrc = e.target.files[0];

    if (!selectedCrc) return;

    if (!validateFile(selectedCrc, allowedImageTypes)) {
      alert("Only PNG, JPG, JPEG or WEBP images are allowed.");
      return;
    }

    setCrc(selectedCrc);
  };
  const handleLocPics = (e) => {
    const selectedLocPics = Array.from(e.target.files);

    const validFiles = selectedLocPics.filter((file) =>
      validateFile(file, allowedImageTypes),
    );

    if (validFiles.length !== selectedLocPics.length) {
      alert("Some files were rejected.");
    }

    setLocPics((prev) => [...prev, ...validFiles]);
  };
  const handleSubmit = async () => {
    const degree = await uploadDocument.mutateAsync(diploma);
    const emp = await uploadDocument.mutateAsync(empCer);
    const crcDoc = await uploadDocument.mutateAsync(crc);

    const workplace = await Promise.all(
      locPics.map((file) => uploadDocument.mutateAsync(file)),
    );

    const payload = {
      degree: {
        public_id: degree.public_id,
        format: degree.format,
        resource_type: degree.resource_type,
        secure_url: degree.secure_url,
      },
      employment_certificate: {
        public_id: emp.public_id,
        format: emp.format,
        resource_type: emp.resource_type,
        secure_url: emp.secure_url,
      },
      images_of_workplace: workplace.map((img) => ({
        public_id: img.public_id,
        format: img.format,
        resource_type: img.resource_type,
        secure_url: img.secure_url,
      })),
      commercial_registration_certificate: {
        public_id: crcDoc.public_id,
        format: crcDoc.format,
        resource_type: crcDoc.resource_type,
        secure_url: crcDoc.secure_url,
      },
      wallet_password: wallet,
    };

    sendDocuments.mutate(payload, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  if (isLoading || isFetching)
    return (
      <div className={styles.spin}>
        <TailSpin height="60" width="60" color="#215eed"></TailSpin>
      </div>
    );
  else if (
    (!data?.data || data?.data.reviewed) &&
    !doctorData?.data.is_doctor
  ) {
    return (
      <div className={styles.container}>
        <div className={styles.main}>
          <div>
            <div className={styles.logoFlex}>
              <span className={styles.icon}>medical_services</span>
              <h1 className={styles.med}>MEDIORA</h1>
            </div>
            <h1 className={styles.requHead}>
              {!localStorage.getItem("signPath")
                ? "No Request Found"
                : "Account Created Successfully"}
            </h1>
            <p className={styles.requPara}>
              Before you start taking reservation,you must send a request
              containing your professional documents to be verified by our
              Admins.
            </p>
          </div>
          <div className={styles.professional}>
            <h3 className={styles.professionalHead}>Professional Documents</h3>
            <div className={styles.documents}>
              <label className={styles.document}>
                <div className={styles.docCover}>
                  <span
                    className={!diploma ? styles.lastIcon : styles.lastIcon1}
                  >
                    {!diploma ? "cloud_upload" : "description"}
                  </span>
                </div>
                {!diploma ? (
                  <div>
                    <div>
                      <p className={styles.tipPara1}>Upload Diploma</p>
                      <p className={styles.tipPara2}>PDF</p>
                    </div>
                    <input
                      className={styles.profileContainInput}
                      type="file"
                      onChange={(e) => {
                        handleDip(e);
                      }}
                      accept=".pdf"
                    />
                  </div>
                ) : (
                  <div>
                    <p className={styles.tipPara1}>Diploma</p>
                    <p className={styles.success}>UPLOADED SUCCESS</p>
                  </div>
                )}
              </label>
              <label className={styles.document}>
                <div className={styles.docCover}>
                  <span
                    className={!empCer ? styles.lastIcon : styles.lastIcon1}
                  >
                    {!empCer ? "cloud_upload" : "description"}
                  </span>
                </div>
                {!empCer ? (
                  <div>
                    <div>
                      <p className={styles.tipPara1}>
                        Upload Employement Certificate
                      </p>
                      <p className={styles.tipPara2}>PDF</p>
                    </div>
                    <input
                      className={styles.profileContainInput}
                      onChange={(e) => handleEmpCer(e)}
                      type="file"
                      accept=".pdf"
                    />
                  </div>
                ) : (
                  <div>
                    <p className={styles.tipPara1}>Employement Certificate</p>
                    <p className={styles.success}>UPLOADED SUCCESS</p>
                  </div>
                )}
              </label>
              <label className={styles.document}>
                <div className={styles.docCover}>
                  <span className={!crc ? styles.lastIcon : styles.lastIcon1}>
                    {!crc ? "cloud_upload" : "description"}
                  </span>
                </div>
                {!crc ? (
                  <div>
                    <div>
                      <p className={styles.tipPara1}>
                        Upload Commercial Registration Certificate
                      </p>
                      <p className={styles.tipPara2}>PNG,JPG,JPEG,WEBP</p>
                    </div>
                    <input
                      className={styles.profileContainInput}
                      onChange={(e) => handleCrc(e)}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                    />
                  </div>
                ) : (
                  <div>
                    <p className={styles.tipPara1}>
                      Commercial Registration Certificate
                    </p>
                    <p className={styles.success}>UPLOADED SUCCESS</p>
                  </div>
                )}
              </label>
              <label className={styles.document}>
                <div className={styles.docCover}>
                  <span
                    className={
                      locPics.length === 0 ? styles.lastIcon : styles.lastIcon1
                    }
                  >
                    {locPics.length === 0 ? "cloud_upload" : "description"}
                  </span>
                </div>
                {locPics.length === 0 ? (
                  <div>
                    <div>
                      <p className={styles.tipPara1}>
                        Upload Workplace Pictures
                      </p>
                      <p className={styles.tipPara2}>PNG,JPG,JPEG,WEBP</p>
                    </div>
                    <input
                      className={styles.profileContainInput}
                      onChange={(e) => handleLocPics(e)}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                    />
                  </div>
                ) : (
                  <div>
                    <p className={styles.tipPara1}>Workplace Pictures</p>
                    <p className={styles.success}>
                      {locPics.length} images selected
                    </p>
                    <p className={styles.success}>UPLOADED SUCCESS</p>
                    <input
                      className={styles.profileContainInput}
                      onChange={(e) => handleLocPics(e)}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                    />
                  </div>
                )}
              </label>
              <div>
                <div className={styles.infoDiv}>
                  <label className={styles.infoDivLabel}>Wallet Password</label>
                  <input
                    onChange={(e) => setWallet(e.target.value)}
                    className={styles.infoDivText}
                    type="password"
                    placeholder="........"
                  />
                </div>
              </div>
              <Conditions password={wallet} />
            </div>
          </div>
          <div className={styles.buttFlex}>
            {sendDocuments.isError &&
              (sendDocuments.error?.response?.status === 400 ? (
                <span className={`${styles.exist} ${styles.errorText}`}>
                  Request Already Sent
                </span>
              ) : (
                <span className={`${styles.exist} ${styles.errorText}`}>
                  Something went wrong,check your files and try again.
                </span>
              ))}
            <button
              onClick={handleSubmit}
              disabled={
                !diploma ||
                !crc ||
                locPics.length === 0 ||
                !empCer ||
                !wallet ||
                sendDocuments.isPending ||
                uploadDocument.isPending
              }
              className={
                !diploma ||
                !crc ||
                locPics.length === 0 ||
                !empCer ||
                sendDocuments.isPending ||
                uploadDocument.isPending
                  ? styles.disable
                  : styles.butt
              }
            >
              {sendDocuments.isPending || uploadDocument.isPending ? (
                <TailSpin height="20" width="20" color="#215eed"></TailSpin>
              ) : !diploma ||
                !crc ||
                !locPics ||
                !empCer ||
                !conditionsVerify(wallet) ? (
                "Please fill all Fields"
              ) : (
                "Send Request"
              )}
              {!(
                !diploma ||
                !crc ||
                locPics.length === 0 ||
                !empCer ||
                !wallet ||
                sendDocuments.isPending ||
                uploadDocument.isPending
              ) && <span className={styles.arrow}>send</span>}
            </button>
          </div>
        </div>
      </div>
    );
  } else if (doctorData?.data.is_doctor) {
    return <Navigate to="/mainpage" />;
  } else {
    return (
      <div className={styles.containD}>
        <div>
          <div className={styles.logoFlex}>
            <span className={styles.icon}>medical_services</span>
            <h1 className={styles.med}>MEDIORA</h1>
          </div>
          <h1 className={styles.requHead}>Request Under Review</h1>
          <p className={styles.requPara}>
            Once your request is reviewed and accepted by our Admins,you will be
            able to benefit from Mediora's services
          </p>
        </div>
        <div className={styles.buttFlex}>
          <button
            className={styles.butt}
            onClick={async () => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("doctorId");
              localStorage.removeItem("doctorUsername");
              logout.mutate();
            }}
          >
            {!logout.isPending ? (
              <>
                Log Out
                <span className={styles.iconLog}>Logout</span>
              </>
            ) : (
              <TailSpin height="20" width="20" color="#ffffff"></TailSpin>
            )}
          </button>
        </div>
      </div>
    );
  }
}
