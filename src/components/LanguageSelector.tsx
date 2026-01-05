import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी (Hindi)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
];

interface LanguageSelectorProps {
  showLabel?: boolean;
}

const LanguageSelector = ({ showLabel = false }: LanguageSelectorProps) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <label className="text-sm font-medium text-muted-foreground">
          {t("language")}
        </label>
      )}
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-[160px]">
          <Globe className="w-4 h-4 mr-2" />
          <SelectValue placeholder={t("selectLanguage")} />
        </SelectTrigger>
        <SelectContent className="bg-background">
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
