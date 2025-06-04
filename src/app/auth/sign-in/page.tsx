import Signin from "@/components/Auth/Signin";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignIn() {
  return (
    <main className="relative w-full flex flex-col h-screen">
      <div className="flex-1">
        <div className="flex min-h-screen w-full">
          <div className="hidden lg:flex lg:w-1/2 bg-[#001D6B] border-r flex-col p-18 relative items-center justify-center">
            <Image
              src="/images/logo/saamy-vel.png"
              alt="Saamy Logo"
              width={200}
              height={200}
              className="object-cover"
              priority
            />
            <Image
              src="/images/brand/saamy-agency-tamil.png"
              alt="Saamy Logo"
              width={400}
              height={300}
              className="object-cover my-8"
              priority
            />
          </div>

          <div className="w-full lg:w-1/2 p-6 flex items-center justify-center">
            <div className="w-full max-w-md p-4 md:p-6">
              <Signin />
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <>
      <div className="h-screen w-full flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-6xl h-auto max-h-[90vh] rounded-lg">
          <div className="flex flex-col md:flex-row h-full">
            {/* Left section: Logo */}
            <div className="flex-1 w-full custom-gradient-1 flex items-center justify-center p-4">
              <Image
                src="/images/logo/saamylogo.jpg"
                alt="Saamy Logo"
                fill={true}
                className="w-full h-full object-contain bg-red-100"
                priority
              />
            </div>

            {/* Right section: Sign-in form */}
            <div className="flex-1 w-full md:w-1/2 flex items-center justify-center">
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