import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
}

export const CompletionModal = ({ open, onClose }: CompletionModalProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-center sm:max-w-md">
        <DialogHeader className="space-y-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
            <div className="relative">
              <Check className="h-12 w-12 text-white" strokeWidth={3} />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-200" />
              <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-yellow-200" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("congratulations")}
            </p>
            <DialogTitle className="text-2xl font-bold">
              {t("allCompleted")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {t("completionMessage")}
          </DialogDescription>
        </DialogHeader>
        <Button
          onClick={onClose}
          className="mt-4 w-full bg-primary text-lg font-semibold"
          size="lg"
        >
          {t("continue")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};