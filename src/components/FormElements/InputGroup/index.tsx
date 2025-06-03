import { cn } from "@/lib/utils";
import { type HTMLInputTypeAttribute, useId } from "react";

type InputGroupProps = {
  className?: string;
  label: string;
  placeholder: string;
  type: HTMLInputTypeAttribute;
  fileStyleVariant?: "style1" | "style2";
  required?: boolean;
  disabled?: boolean;
  active?: boolean;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  height?: "sm" | "default";
  defaultValue?: string;
};

const InputGroup: React.FC<InputGroupProps> = ({
  className,
  label,
  type,
  placeholder,
  required,
  disabled,
  active,
  handleChange,
  icon,
  ...props
}) => {
  const id = useId();

  return (
   <div
  className={cn(
    "relative mt-3",
  )}
>
  <input
    id={id}
    type={type}
    name={props.name}
    placeholder={placeholder}
    onChange={handleChange}
    value={props.value}
    defaultValue={props.defaultValue}
    className={cn(
      "w-full rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition focus:border-primary disabled:cursor-default disabled:bg-gray-100 dark:border-dark-3",
      type === "file"
        ? getFileStyles(props.fileStyleVariant!)
        : "px-6 py-3 text-dark placeholder:text-dark-400 text-left",
      props.iconPosition === "left" && "pl-12.5",
      props.height === "sm" && "py-2.5",
    )}
    required={required}
    disabled={disabled}
    data-active={active}
  />

  {icon && (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2","ml-90%",
        props.iconPosition === "left" ? "left-4.5" : "right-4.5"
        
      )}
      style={{ marginLeft: props.iconPosition === "right" ? "90%" : undefined }}

    >
      {icon}
    </div>
  )}
</div>

  );
};

export default InputGroup;

function getFileStyles(variant: "style1" | "style2") {
  switch (variant) {
    case "style1":
      return `file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-[#E2E8F0] file:px-6.5 file:py-[13px] file:text-body-sm file:font-medium file:text-dark-500 file:hover:bg-primary file:hover:bg-opacity-10 `;
    default:
      return `file:mr-4 file:rounded file:border-[0.5px] file:border-stroke file:bg-stroke file:px-2.5 file:py-1 file:text-body-xs file:font-medium file:text-dark-500 file:focus:border-primary px-3 py-[9px]`;
  }
}
