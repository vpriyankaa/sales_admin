import Signin from "@/components/Auth/Signin";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignIn() {
  return (
    <>
       <div className="h-screen w-full flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-6xl h-auto max-h-[90vh] rounded-lg">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left section: Logo */}
          <div className="w-full md:w-1/2 custom-gradient-1 flex items-center justify-center p-4">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/logo/saamylogo.jpg"
                alt="Saamy Logo"
                width={500}
                height={50}
                className="w-auto max-h-[70vh] object-contain"
                priority
              />
            </div>
          </div>

          {/* Right section: Sign-in form */}
          <div className="w-full md:w-1/2 flex items-center justify-center">
            <div className="w-full max-w-md p-4 md:p-6">
              <Signin />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}