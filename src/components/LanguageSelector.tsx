import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPreferredLanguage = async () => {
      if (!user) return;

      try {
        // Use type assertion since the column was just added
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if ((data as any)?.preferred_language) {
          setSelectedLanguage((data as any).preferred_language);
        }
      } catch (error) {
        console.error("Error fetching language preference:", error);
      }
    };

    fetchPreferredLanguage();
  }, [user]);

  const handleLanguageChange = async (languageCode: string) => {
    if (!user) {
      setSelectedLanguage(languageCode);
      return;
    }

    setIsLoading(true);
    try {
      // Use type assertion since the column was just added
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_language: languageCode } as any)
        .eq("id", user.id);

      if (error) throw error;

      setSelectedLanguage(languageCode);
      toast.success("Language preference updated");
    } catch (error) {
      console.error("Error updating language preference:", error);
      toast.error("Failed to update language preference");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <label className="text-sm font-medium text-muted-foreground">
          Language
        </label>
      )}
      <Select
        value={selectedLanguage}
        onValueChange={handleLanguageChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[160px]">
          <Globe className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Select language" />
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
