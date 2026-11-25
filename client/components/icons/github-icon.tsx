import { SiGithub } from "react-icons/si";
import { IconBaseProps } from "react-icons";
import { cn } from "@/lib/utils";

export function GithubIcon({ className, ...props }: IconBaseProps) {
  return (
    <SiGithub className={cn("h-5 w-5", className)} {...props} />
  );
}