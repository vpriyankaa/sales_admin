"use client"

import { useRouter } from "next/navigation";
import { useState } from "react"
import { resetPassword } from "@/app/actions"

export default function ResetPassword() {

  const router = useRouter();

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Individual field errors
  const [phoneError, setPhoneError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [formError, setFormError] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogMessage, setDialogMessage] = useState("")
  const [dialogSuccess, setDialogSuccess] = useState(false)

  const validatePhone = (phone: string) => {
    return /^\d{7,15}$/.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setPhoneError("")
    setPasswordError("")
    setConfirmPasswordError("")

    let valid = true

    if (!validatePhone(phone)) {
      setPhoneError("Phone number must be 10 digits.")
      valid = false
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.")
      valid = false
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.")
      valid = false
    }

    if (!valid) return

    setLoading(true)

    try {
      const passwordReset = await resetPassword(phone, password)

      if (passwordReset) {
        setDialogTitle("Success")
        setDialogMessage("Your password has been reset successfully. You can now sign in with your new password.")
        setDialogSuccess(true)
      } else {
        setDialogTitle("Error")
        setDialogMessage("Failed to reset password. Please check your phone number and try again.")
        setDialogSuccess(false)
      }
    } catch {
      setDialogTitle("Error")
      setDialogMessage("An unexpected error occurred. Please try again later.")
      setDialogSuccess(false)
    } finally {
      setLoading(false)
      setDialogOpen(true)
    }
  }

  return (
    <div className="flex min-h-screen bg-transparent items-center justify-center p-4">
      <div className="p-4 bg-white rounded shadow relative w-full max-w-lg">
        <h2 className="mb-6 w-full text-2xl text-dark font-bold text-center">Reset your password</h2>
        <form onSubmit={handleSubmit} noValidate>
          {/* Phone */}
          <label htmlFor="phone" className="block mb-1 font-medium">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            className={`w-full mb-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 ${phoneError ? "border-red-600 focus:ring-red-600" : "focus:ring-blue-600"
              }`}
            placeholder="1234567890"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (phoneError) setPhoneError("")
            }}
            disabled={loading}
            aria-describedby="phone-error"
            required
          />

          {phoneError && (
            <p id="phone-error" className="mb-2 text-xs text-red-600">
              {phoneError}
            </p>
          )}

          {/* New Password */}
          <label htmlFor="password" className="block mb-1 font-medium">
            New Password
          </label>
          <input
            id="password"
            type="password"
            className={`w-full mb-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 ${passwordError ? "border-red-600 focus:ring-red-600" : "focus:ring-blue-600"
              }`}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (passwordError) setPasswordError("")
            }}
            disabled={loading}
            aria-describedby="password-error"
            minLength={6}
            required
          />
          {passwordError && (
            <p id="password-error" className="mb-2 text-xs text-red-600">
              {passwordError}
            </p>
          )}

          {/* Confirm Password */}
          <label htmlFor="confirmPassword" className="block mb-1 font-medium">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`w-full mb-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 ${confirmPasswordError ? "border-red-600 focus:ring-red-600" : "focus:ring-blue-600"
              }`}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (confirmPasswordError) setConfirmPasswordError("")
            }}
            disabled={loading}
            aria-describedby="confirm-password-error"
            minLength={6}
            required
          />
          <p
            id="confirm-password-error"
            className={`mb-2 text-xs transition-all duration-200 ${confirmPasswordError ? "text-red-600" : "text-transparent"
              }`}
            style={{ minHeight: "1.25rem" }} // About 20px tall
          >
            {confirmPasswordError || "Placeholder"}
          </p>


          {/* Form level error */}
          {formError && <p className="mb-4 text-center text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded p-6 max-w-sm w-full text-center shadow-lg">
              <h3 className={`mb-4 text-xl font-semibold ${dialogSuccess ? "text-primary" : "text-red-600"}`}>
                {dialogTitle}
              </h3>
              <p className="mb-6">{dialogMessage}</p>
              <button
                onClick={() => {
                  setDialogOpen(false)
                  if (dialogSuccess) {
                    router.push("/auth/sign-in")
                  }
                }}
                className={`px-4 py-2 rounded text-white ${dialogSuccess ? "bg-primary hover:bg-primary" : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                Ok
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
