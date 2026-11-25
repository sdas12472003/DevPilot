import { 
  SiTypescript, 
  SiJavascript, 
  SiPython, 
  SiGo, 
  SiRust, 
  SiRuby, 
  SiPhp, 
  SiCplusplus, 
  SiSharp, 
  SiHtml5,
  SiCss // <--- Updated CSS import
} from "react-icons/si";
import { FaJava } from "react-icons/fa"; 
import { FileCode } from "lucide-react";
import { IconBaseProps } from "react-icons";
import { cn } from "@/lib/utils";

interface LanguageIconProps extends IconBaseProps {
  language?: string | null;
}

export function LanguageIcon({ language, className, ...props }: LanguageIconProps) {
  const normalizedLang = language?.toLowerCase();
  const classes = cn("h-4 w-4", className);

  switch (normalizedLang) {
    case "typescript":
      return <SiTypescript className={classes} color="#3178C6" {...props} />;
    case "javascript":
      return <SiJavascript className={classes} color="#F7DF1E" {...props} />;
    case "python":
      return <SiPython className={classes} color="#3776AB" {...props} />;
    case "java":
      return <FaJava className={classes} color="#007396" {...props} />; 
    case "go":
      return <SiGo className={classes} color="#00ADD8" {...props} />;
    case "rust":
      return <SiRust className={classes} color="#000000" {...props} />;
    case "ruby":
      return <SiRuby className={classes} color="#CC342D" {...props} />;
    case "php":
      return <SiPhp className={classes} color="#777BB4" {...props} />;
    case "c++":
      return <SiCplusplus className={classes} color="#00599C" {...props} />;
    case "c#":
      return <SiSharp className={classes} color="#239120" {...props} />; 
    case "html":
      return <SiHtml5 className={classes} color="#E34F26" {...props} />;
    case "css":
      return <SiCss className={classes} color="#1572B6" {...props} />; // <--- Updated to SiCss
    default:
      return <FileCode className={classes} {...props} />;
  }
}