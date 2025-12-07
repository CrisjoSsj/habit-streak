import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type TimeOfDay = "anytime" | "morning" | "afternoon" | "night";
type EndType = "never" | "date" | "days";
type RepeatType = "daily" | "specific_days" | "x_per_week" | "x_per_month" | "x_per_year";

interface HabitFormData {
  name: string;
  icon: string;
  color: string;
  habitType: "check" | "count" | "timer";
  goalCount: number;
  goalMinutes: number;
  timeOfDay: TimeOfDay;
  repeatType: RepeatType;
  repeatDays: string[];
  repeatCount: number;
  reminderEnabled: boolean;
  reminderTime: string;
  incentiveText: string;
  endType: EndType;
  endDate: Date | undefined;
  endDays: number;
}

interface HabitFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HabitFormData) => void;
  initialData?: Partial<HabitFormData>;
}

const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4"];
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const HabitFormDialog = ({ open, onClose, onSave, initialData }: HabitFormDialogProps) => {
  const { translations } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDaysSelector, setShowDaysSelector] = useState(false);

  const [formData, setFormData] = useState<HabitFormData>({
    name: initialData?.name || "",
    icon: initialData?.icon || "smile",
    color: initialData?.color || "#3B82F6",
    habitType: initialData?.habitType || "check",
    goalCount: initialData?.goalCount || 1,
    goalMinutes: initialData?.goalMinutes || 10,
    timeOfDay: initialData?.timeOfDay || "anytime",
    repeatType: initialData?.repeatType || "daily",
    repeatDays: initialData?.repeatDays || WEEKDAYS,
    repeatCount: initialData?.repeatCount || 7,
    reminderEnabled: initialData?.reminderEnabled || false,
    reminderTime: initialData?.reminderTime || "22:30",
    incentiveText: initialData?.incentiveText || "",
    endType: initialData?.endType || "never",
    endDate: initialData?.endDate,
    endDays: initialData?.endDays || 30,
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter((d) => d !== day)
        : [...prev.repeatDays, day],
    }));
  };

  const dayLabels = [translations.days.sun, translations.days.mon, translations.days.tue, translations.days.wed, translations.days.thu, translations.days.fri, translations.days.sat];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formData.name || translations.habitForm.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">{translations.habitForm.subtitle}</p>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={translations.habitForm.title} />
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span>{translations.habitForm.icon}</span>
              <span className="text-2xl">😊</span>
            </div>
            <div className="border-t pt-3">
              <span>{translations.habitForm.color}</span>
              <div className="mt-2 flex gap-2">
                {COLORS.map((color) => (
                  <button key={color} className={cn("h-8 w-8 rounded-full", formData.color === color && "ring-2 ring-primary ring-offset-2")} style={{ backgroundColor: color }} onClick={() => setFormData({ ...formData, color })} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{translations.habitForm.doIt}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["anytime", "morning", "afternoon", "night"] as TimeOfDay[]).map((time) => (
                <button key={time} className={cn("rounded-lg border p-3 text-sm font-medium", formData.timeOfDay === time ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")} onClick={() => setFormData({ ...formData, timeOfDay: time })}>
                  {translations.dashboard[time === "anytime" ? "anytime" : time]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{translations.habitForm.dailyGoal}</p>
            <div className="flex gap-2 mb-3">
              {(["check", "count", "timer"] as const).map((type) => (
                <button key={type} className={cn("flex-1 rounded-lg border p-2 text-xs font-medium", formData.habitType === type ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")} onClick={() => setFormData({ ...formData, habitType: type })}>
                  {type === "check" ? "Check-in" : type === "count" ? "Contador" : "Temporizador"}
                </button>
              ))}
            </div>
            {formData.habitType === "count" && <Input type="number" min={1} value={formData.goalCount} onChange={(e) => setFormData({ ...formData, goalCount: Number(e.target.value) || 1 })} />}
            {formData.habitType === "timer" && <Input type="number" min={1} value={formData.goalMinutes} onChange={(e) => setFormData({ ...formData, goalMinutes: Number(e.target.value) || 1 })} />}
          </div>

          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
              <span className="font-medium">{translations.habitForm.advancedSettings}</span>
              <ChevronDown className={cn("h-5 w-5 transition-transform", showAdvanced && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span>{translations.habitForm.reminderForHabit}</span>
                  <Switch checked={formData.reminderEnabled} onCheckedChange={(checked) => setFormData({ ...formData, reminderEnabled: checked })} />
                </div>
                {formData.reminderEnabled && <Input type="time" value={formData.reminderTime} onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })} />}
                <div className="border-t pt-3">
                  <span className="text-sm">{translations.habitForm.incentive}</span>
                  <Textarea value={formData.incentiveText} onChange={(e) => setFormData({ ...formData, incentiveText: e.target.value })} placeholder={translations.habitForm.incentivePlaceholder} className="mt-2" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button onClick={handleSubmit} className="w-full" size="lg">{translations.habitForm.save}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
