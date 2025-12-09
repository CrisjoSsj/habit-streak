import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";

export const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">{t("footerTitle")}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footerDescription")}
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">{t("footerLinks")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  {t("features")}
                </a>
              </li>
              <li>
                <a href="#how-it-works-heading" className="hover:text-foreground transition-colors">
                  {t("howItWorks")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  {t("footerPrivacy")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  {t("footerTerms")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">{t("footerContact")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:soporte@habittrack.com" className="hover:text-foreground transition-colors">
                  soporte@habittrack.com
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  {t("footerSupport")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {currentYear} HabitTrack. {t("footerRights")}</p>
        </div>
      </div>
    </footer>
  );
};
