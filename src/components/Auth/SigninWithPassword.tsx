"use client";
import { useRouter } from "next/navigation";
import { PhoneIcon, EyeIcon , EyeOffIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";
import { checkUserCredentials } from '@/app/actions';
import { useAuth } from "@/contexts/auth-context";
import { Eye, EyeOff } from "lucide-react";


export default function SigninWithPassword() {
  const router = useRouter();
  const { login } = useAuth();

  const [data, setData] = useState({
    phone: "",
    password:"",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {

      const user = await checkUserCredentials(data.phone, data.password);


      // console.log("user----1",user);

     if (user) {
        login(user);
        sessionStorage.setItem("user", JSON.stringify(user));
        router.push("/dashboard");
      } else {
        setError("Incorrect phone number or password. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        type="phone"
        label="Phone"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your Phone Number"
        name="phone"
        handleChange={handleChange}
        value={data.phone}
        iconPosition="right"
        required
      />

      <InputGroup
        type={showPassword ? "text" : "password"}
        label="Password"
        className="mb-5 [&_input]:py-[15px]"
        placeholder="Enter your password"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="focus:outline-none mt-1"
          >
            {showPassword ? <Eye /> : <EyeOff />}
          </button>
        }
        iconPosition="right"
        required
      />

      <div className="mb-6 flex items-center justify-end gap-2 py-2 font-medium">
      

        <Link
          href="/auth/forgot-password"
          className="hover:text-primary dark:hover:text-primary"
        >
          Forgot Password?
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-4.5">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-3 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
        >
          Sign In
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary" />
          )}
        </button>
      </div>
    </form>
  );
}
