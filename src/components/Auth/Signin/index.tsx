import Link from "next/link";
import GoogleSigninButton from "../GoogleSigninButton";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <>


      <div className="flex flex-col items-start space-y-1">
        <span className="text-lg font-bold text-dark-3">Sign in</span>
        <span className="text-md font-bold text-dark-3">Enter your details below</span>
      </div>
      <div>
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
