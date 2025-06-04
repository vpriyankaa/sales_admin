import Link from "next/link";
import GoogleSigninButton from "../GoogleSigninButton";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <>
      <div className="flex flex-col items-start space-y-1">
        <p className="text-xl md:text-2xl font-medium text-dark dark:text-white">
          Welcome Back!
        </p>

        <p className="w-full max-w-[375px] font-medium text-dark-4 dark:text-dark-600">
          Please sign in to your account to proceed
        </p>
        {/* <span className="text-lg font-bold text-dark-3">Sign in</span>
        <span className="text-md font-bold text-dark-3">Enter your details below</span> */}
      </div>
      <div className="mt-12">
        <SigninWithPassword />
      </div>

      {/* <div className="mt-6 text-center">
        <p>
          Don’t have any account?{" "}
          <Link href="/auth/sign-up" className="text-primary">
            Sign Up
          </Link>
        </p>
      </div> */}
    </>
  );
}
