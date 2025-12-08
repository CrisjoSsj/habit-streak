import { useState } from "react";
import { ChevronRight, ChevronDown, X, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRepeatDays, setShowRepeatDays] = useState(false);

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

  const dayLabels = [t("sun"), t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat")];

  const getTimeLabel = (time: TimeOfDay) => {
    switch (time) {
      case "anytime": return t("anyMoment");
      case "morning": return t("morning");
      case "afternoon": return t("afternoon");
      case "night": return t("night");
    }
  };

  // Repeat days selection view
  if (showRepeatDays) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowRepeatDays(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle>{t("habitDays")}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Specific days of the week */}
            <div
              className={cn(
                "rounded-lg border p-4 space-y-3",
                formData.repeatType === "daily" && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("specificDaysOfWeek")}</p>
                  <p className="text-sm text-muted-foreground">{t("allDays")}</p>
                </div>
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                    formData.repeatType === "daily"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                  onClick={() => setFormData({ ...formData, repeatType: "daily" })}
                >
                  {formData.repeatType === "daily" && <span className="text-xs">✓</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {WEEKDAYS.map((day, idx) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      formData.repeatDays.includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {dayLabels[idx]}
                  </button>
                ))}
              </div>
            </div>

            {/* X days per week */}
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-4",
                formData.repeatType === "x_per_week" && "border-primary bg-primary/5"
              )}
              onClick={() => setFormData({ ...formData, repeatType: "x_per_week" })}
            >
              <span>{t("xDaysPerWeek")}</span>
              <div
                className={cn(
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                  formData.repeatType === "x_per_week"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground"
                )}
              >
                {formData.repeatType === "x_per_week" && <span className="text-xs">✓</span>}
              </div>
            </button>

            {/* Long term habits section */}
            <div className="pt-4">
              <p className="font-semibold">{t("longTermHabit")}</p>
              <p className="text-sm text-muted-foreground">{t("longTermDesc")}</p>
            </div>

            {/* X days per month */}
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-4",
                formData.repeatType === "x_per_month" && "border-primary bg-primary/5"
              )}
              onClick={() => setFormData({ ...formData, repeatType: "x_per_month" })}
            >
              <span>{t("xDaysPerMonth")}</span>
              <div
                className={cn(
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                  formData.repeatType === "x_per_month"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground"
                )}
              >
                {formData.repeatType === "x_per_month" && <span className="text-xs">✓</span>}
              </div>
            </button>

            {/* X days per year */}
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-4",
                formData.repeatType === "x_per_year" && "border-primary bg-primary/5"
              )}
              onClick={() => setFormData({ ...formData, repeatType: "x_per_year" })}
            >
              <span>{t("xDaysPerYear")}</span>
              <div
                className={cn(
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                  formData.repeatType === "x_per_year"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground"
                )}
              >
                {formData.repeatType === "x_per_year" && <span className="text-xs">✓</span>}
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formData.name || t("habitName")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("frequentHabit")}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name Input */}
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t("habitFormSubtitle")}
            className="text-lg"
          />

          {/* Icon and Color */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">😊</span>
                <span>{t("habitIcon")}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span>{t("habitColor")}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-8 rounded-full transition-transform",
                      formData.color === color && "ring-2 ring-primary ring-offset-2 scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Repeat Days */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">{t("repeat")}</p>
            <button
              className="flex w-full items-center justify-between rounded-lg border bg-card p-4"
              onClick={() => setShowRepeatDays(true)}
            >
              <span>{t("habitDays")}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("allDays")}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </div>

          {/* Time of Day */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">{t("doIt")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["anytime", "morning", "afternoon", "night"] as TimeOfDay[]).map((time) => (
                <button
                  key={time}
                  className={cn(
                    "rounded-lg border p-3 text-sm font-medium transition-colors",
                    formData.timeOfDay === time
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card hover:bg-muted"
                  )}
                  onClick={() => setFormData({ ...formData, timeOfDay: time })}
                >
                  {getTimeLabel(time)}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">{t("dailyGoal")}</p>
            <button className="flex w-full items-center justify-between rounded-lg border bg-card p-4">
              <span>{t("objective")}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("disable")}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
            <div className="flex gap-2">
              {(["check", "count", "timer"] as const).map((type) => (
                <button
                  key={type}
                  className={cn(
                    "flex-1 rounded-lg border p-2 text-xs font-medium transition-colors",
                    formData.habitType === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card hover:bg-muted"
                  )}
                  onClick={() => setFormData({ ...formData, habitType: type })}
                >
                  {type === "check" ? t("typeCheckIn") : type === "count" ? t("typeCounter") : t("typeTimer")}
                </button>
              ))}
            </div>
            {formData.habitType === "count" && (
              <Input
                type="number"
                min={1}
                value={formData.goalCount}
                onChange={(e) => setFormData({ ...formData, goalCount: Number(e.target.value) || 1 })}
                placeholder="Meta (ej: 8)"
              />
            )}
            {formData.habitType === "timer" && (
              <Input
                type="number"
                min={1}
                value={formData.goalMinutes}
                onChange={(e) => setFormData({ ...formData, goalMinutes: Number(e.target.value) || 1 })}
                placeholder="Minutos (ej: 10)"
              />
            )}
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
              <span className="font-semibold">{t("advancedSettings")}</span>
              <ChevronDown className={cn("h-5 w-5 transition-transform", showAdvanced && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Reminder Section */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Recordatorio</p>
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span>{t("reminderForHabit")}</span>
                    <Switch
                      checked={formData.reminderEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, reminderEnabled: checked })}
                    />
                  </div>
                  {formData.reminderEnabled && (
                    <Input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    />
                  )}
                  <div className="flex items-center justify-between border-t pt-3">
                    <span>{t("soundEffects")}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("systemDefault")}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <span className="text-sm">{t("incentive")}</span>
                    <Textarea
                      value={formData.incentiveText}
                      onChange={(e) => setFormData({ ...formData, incentiveText: e.target.value })}
                      placeholder={t("incentivePlaceholder")}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* End Type Section */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">{t("endIn")}</p>
                <div className="flex gap-2">
                  {(["never", "date", "days"] as EndType[]).map((type) => (
                    <button
                      key={type}
                      className={cn(
                        "flex-1 rounded-lg border p-2 text-xs font-medium transition-colors",
                        formData.endType === type
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-card hover:bg-muted"
                      )}
                      onClick={() => setFormData({ ...formData, endType: type })}
                    >
                      {type === "never" ? t("deactivate") : type === "date" ? t("date") : t("daysOption")}
                    </button>
                  ))}
                </div>
                {formData.endType === "date" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>{t("lastDayIs")}</span>
                        <span>
                          {formData.endDate ? format(formData.endDate, "MMM d, yyyy") : "Seleccionar"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {formData.endType === "days" && (
                  <Input
                    type="number"
                    min={1}
                    value={formData.endDays}
                    onChange={(e) => setFormData({ ...formData, endDays: Number(e.target.value) || 30 })}
                    placeholder="Días"
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Save Button */}
          <Button onClick={handleSubmit} className="w-full" size="lg">
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};