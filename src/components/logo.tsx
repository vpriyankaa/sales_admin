import darkLogo from "@/assets/logos/dark.svg";
import logo from "@/assets/logos/main.svg";
import saamyAgencyFull from "@/assets/logos/saamy-agency-full.svg";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-16 w-full bg-primary dark:bg-primary-dark">
      <Image
        src={saamyAgencyFull}
        fill
        className="dark:hidden"
        alt="Saamy Agency"
        role="presentation"
        quality={100}
      />

      <Image
        src={saamyAgencyFull}
        fill
        className="hidden dark:block"
        alt="Saamy Agency"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
