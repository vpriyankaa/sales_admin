"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { useState, useMemo,  } from "react";
import { LogOutIcon, } from "./icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"


export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const USER = {
    name: "John Smith",
    email: "johnson@nextadmin.com",
    img: "/images/user/user-03.png",
  };


  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false)


  const memoizedUser = useMemo(() => user, [user]);

  // console.log("isLoading",isLoading);


  const handleLogout = async () => {
    await setIsLoading(true);
    try {
      await logout();

    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!memoizedUser) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 max-[1024px]:sr-only"></div>
      </div>
    );
  }

    if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">

          <Avatar className="h-9 w-9 bg-primary text-white font-medium text-base">
            <AvatarImage src={memoizedUser?.name} alt={memoizedUser?.name} />             <AvatarFallback>
              {memoizedUser?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:!text-white max-[1024px]:sr-only">
            <span>{memoizedUser.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <Avatar className="h-9 w-9 bg-primary text-white font-medium text-base">
            <AvatarImage src={memoizedUser?.name} alt={memoizedUser?.name} />             <AvatarFallback>
              {memoizedUser?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:!text-white">
              {memoizedUser.name}
            </div>

            <div className="leading-none text-gray-6 dark:!text-white">{memoizedUser.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />



        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:!text-white">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:!text-white"
            onClick={handleLogout}
          >
            <LogOutIcon />

            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
