import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
 
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1=email, 2=otp+password
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
 
  const navigate = useNavigate();
 
  // STEP 1: Send OTP
  const sendOtp = async () => {
    setError("");
    setMessage("");
 
    try {
      const res = await fetch(
        `http://localhost:8080/auth/forgot-password?email=${email}`,
        {
          method: "POST",
        }
      );
 
      if (!res.ok) {
        throw new Error();
      }
 
      setMessage("OTP sent to your email");
      setStep(2);
 
    } catch {
      setError("Email not found");
    }
  };
 
  // STEP 2: Verify OTP & reset password
  const resetPassword = async () => {
    setError("");
    setMessage("");
 
    try {
      const res = await fetch(
        `http://localhost:8080/auth/reset-password?email=${email}&otp=${otp}&newPassword=${newPassword}`,
        {
          method: "POST",
        }
      );
 
      if (!res.ok) {
        throw new Error();
      }
 
      alert("Password reset successful");
      navigate("/login");
 
    } catch {
      setError("Invalid OTP or OTP expired");
    }
  };
 
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ textAlign: "center" }}>Forgot Password</h2>
 
        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.message}>{message}</p>}
 
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div style={styles.field}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
 
            <button onClick={sendOtp} style={styles.button}>
              Send OTP
            </button>
          </>
        )}
 
        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div style={styles.field}>
              <label>OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                style={styles.input}
              />
            </div>
 
            <div style={styles.field}>
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>
 
            <button onClick={resetPassword} style={styles.button}>
              Reset Password
            </button>
          </>
        )}
 
        <p
          style={styles.back}
          onClick={() => navigate("/login")}
        >
          Back to Login
        </p>
      </div>
    </div>
  );
};
 
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    // background: "#253d90",
  },
  card: {
    width: "380px",
    padding: "25px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
  },
  field: {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "8px",
    marginTop: "5px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#f4c430",
    border: "none",
    borderRadius: "4px",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: "10px",
  },
  message: {
    color: "green",
    textAlign: "center",
    marginBottom: "10px",
  },
  back: {
    marginTop: "15px",
    textAlign: "center",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "14px",
  },
};
 
export default ForgotPassword;