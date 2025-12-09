import { useState, useEffect } from "react";
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
import { getHabitIcon } from "@/lib/habitIcons";
import { iconCategories } from "@/lib/iconCategories";

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

const getDefaultFormData = (initialData?: Partial<HabitFormData>): HabitFormData => ({
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

export const HabitFormDialog = ({ open, onClose, onSave, initialData }: HabitFormDialogProps) => {
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRepeatDays, setShowRepeatDays] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [repeatDaysError, setRepeatDaysError] = useState<string>("");

  const [formData, setFormData] = useState<HabitFormData>(getDefaultFormData(initialData));

  // Resetear el formulario cuando se abre el diálogo o cambia initialData
  useEffect(() => {
    if (open) {
      setFormData(getDefaultFormData(initialData));
      setShowAdvanced(false);
      setShowRepeatDays(false);
      setShowIconSelector(false);
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
    // Resetear el formulario después de guardar
    setFormData(getDefaultFormData());
    setShowAdvanced(false);
    setShowRepeatDays(false);
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

  // Icon selector view
  if (showIconSelector) {
    const CurrentIcon = getHabitIcon(formData.icon);
    const currentColor = formData.color || "#3B82F6";
    
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowIconSelector(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle>{t("habitIcon")}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Icono actual */}
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md"
                style={{ backgroundColor: currentColor }}
              >
                <CurrentIcon className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">Icono seleccionado</p>
                <p className="text-sm text-muted-foreground truncate">{formData.icon}</p>
              </div>
            </div>

            {/* Categorías de iconos */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {iconCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">
                    {category.name}
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {category.icons.map((iconName) => {
                      const IconComponent = getHabitIcon(iconName);
                      const isSelected = formData.icon === iconName;
                      
                      return (
                        <button
                          key={iconName}
                          onClick={() => {
                            setFormData({ ...formData, icon: iconName });
                            setShowIconSelector(false);
                          }}
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full transition-all relative",
                            isSelected
                              ? "scale-110"
                              : "hover:scale-105 hover:opacity-90"
                          )}
                          style={{ backgroundColor: currentColor }}
                        >
                          <IconComponent className="h-6 w-6 text-white" />
                          {isSelected && (
                            <div 
                              className="absolute inset-0 rounded-full border-2 border-white"
                              style={{ 
                                boxShadow: `0 0 0 2px ${currentColor}, 0 0 0 4px hsl(var(--background))`,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            {/* Daily - All days */}
            <div
              className={cn(
                "rounded-lg border p-4 space-y-3 cursor-pointer",
                formData.repeatType === "daily" && "border-primary bg-primary/5"
              )}
              onClick={() => setFormData({ ...formData, repeatType: "daily", repeatDays: WEEKDAYS })}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("allDays")}</p>
                  <p className="text-sm text-muted-foreground">{t("specificDaysOfWeek")}</p>
                </div>
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                    formData.repeatType === "daily"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                >
                  {formData.repeatType === "daily" && <span className="text-xs">✓</span>}
                </div>
              </div>
            </div>

            {/* Specific days of the week */}
            <div
              className={cn(
                "rounded-lg border p-4 space-y-3",
                formData.repeatType === "specific_days" && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("specificDaysOfWeek")}</p>
                  <p className="text-sm text-muted-foreground">{t("selectDays")}</p>
                </div>
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer",
                    formData.repeatType === "specific_days"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                  onClick={() => setFormData({ ...formData, repeatType: "specific_days" })}
                >
                  {formData.repeatType === "specific_days" && <span className="text-xs">✓</span>}
                </div>
              </div>
              {formData.repeatType === "specific_days" && (
                <div className="flex gap-2">
                  {WEEKDAYS.map((day, idx) => (
                    <button
                      key={day}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDay(day);
                      }}
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
              )}
            </div>

            {/* X days per week */}
            <div
              className={cn(
                "rounded-lg border p-4 space-y-3",
                formData.repeatType === "x_per_week" && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("xDaysPerWeek")}</p>
                  <p className="text-sm text-muted-foreground">{t("enterDays")}</p>
                </div>
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer",
                    formData.repeatType === "x_per_week"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                  onClick={() => setFormData({ ...formData, repeatType: "x_per_week" })}
                >
                  {formData.repeatType === "x_per_week" && <span className="text-xs">✓</span>}
                </div>
              </div>
              {formData.repeatType === "x_per_week" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.repeatCount || 1}
                    onChange={(e) => setFormData({ ...formData, repeatCount: parseInt(e.target.value) || 1 })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">{t("daysPerWeek")}</span>
                </div>
              )}
            </div>

            {/* Long term habits section */}
            <div className="pt-4">
              <p className="font-semibold">{t("longTermHabit")}</p>
              <p className="text-sm text-muted-foreground">{t("longTermDesc")}</p>
            </div>

            {/* X days per month */}
            <div
              className={cn(
                "rounded-lg border p-4 space-y-3",
                formData.repeatType === "x_per_month" && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("xDaysPerMonth")}</p>
                  <p className="text-sm text-muted-foreground">{t("enterDays")}</p>
                </div>
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer",
                    formData.repeatType === "x_per_month"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                  onClick={() => setFormData({ ...formData, repeatType: "x_per_month" })}
                >
                  {formData.repeatType === "x_per_month" && <span className="text-xs">✓</span>}
                </div>
              </div>
              {formData.repeatType === "x_per_month" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.repeatCount || 1}
                    onChange={(e) => setFormData({ ...formData, repeatCount: parseInt(e.target.value) || 1 })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">{t("daysPerMonth")}</span>
                </div>
              )}
            </div>

            {/* X days per year */}
            <div
              className={cn(
                "rounded-lg border p-4 space-y-3",
                formData.repeatType === "x_per_year" && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("xDaysPerYear")}</p>
                  <p className="text-sm text-muted-foreground">{t("enterDays")}</p>
                </div>
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer",
                    formData.repeatType === "x_per_year"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                  onClick={() => setFormData({ ...formData, repeatType: "x_per_year" })}
                >
                  {formData.repeatType === "x_per_year" && <span className="text-xs">✓</span>}
                </div>
              </div>
              {formData.repeatType === "x_per_year" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.repeatCount || 1}
                    onChange={(e) => setFormData({ ...formData, repeatCount: parseInt(e.target.value) || 1 })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">{t("daysPerYear")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje de error */}
          {repeatDaysError && (
            <div className="text-sm text-destructive mt-2">
              {repeatDaysError}
            </div>
          )}

          {/* Botón de guardar/continuar */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRepeatDays(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setRepeatDaysError("");
                
                // Validar que si es specific_days, tenga al menos un día seleccionado
                if (formData.repeatType === "specific_days" && formData.repeatDays.length === 0) {
                  setRepeatDaysError(t("selectAtLeastOneDay") || "Selecciona al menos un día");
                  return;
                }
                
                // Validar que si es x_per_week/month/year, tenga un número válido
                if (["x_per_week", "x_per_month", "x_per_year"].includes(formData.repeatType)) {
                  if (!formData.repeatCount || formData.repeatCount < 1) {
                    setRepeatDaysError(t("enterValidNumber") || "Ingresa un número válido");
                    return;
                  }
                  // Validaciones específicas por tipo
                  if (formData.repeatType === "x_per_week" && formData.repeatCount > 7) {
                    setRepeatDaysError(t("maxDaysPerWeek") || "Máximo 7 días por semana");
                    return;
                  }
                  if (formData.repeatType === "x_per_month" && formData.repeatCount > 31) {
                    setRepeatDaysError(t("maxDaysPerMonth") || "Máximo 31 días por mes");
                    return;
                  }
                  if (formData.repeatType === "x_per_year" && formData.repeatCount > 365) {
                    setRepeatDaysError(t("maxDaysPerYear") || "Máximo 365 días por año");
                    return;
                  }
                }
                
                setShowRepeatDays(false);
              }}
            >
              {t("save")}
            </Button>
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
            <button
              onClick={() => setShowIconSelector(true)}
              className="flex w-full items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: formData.color || "#3B82F6" }}
                >
                  {(() => {
                    const IconComponent = getHabitIcon(formData.icon);
                    return <IconComponent className="h-5 w-5" />;
                  })()}
                </div>
                <span>{t("habitIcon")}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
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
                <span className="text-sm text-muted-foreground">
                  {formData.repeatType === "daily" && t("allDays")}
                  {formData.repeatType === "specific_days" && `${formData.repeatDays.length} ${t("days")}`}
                  {formData.repeatType === "x_per_week" && `${formData.repeatCount} ${t("daysPerWeek")}`}
                  {formData.repeatType === "x_per_month" && `${formData.repeatCount} ${t("daysPerMonth")}`}
                  {formData.repeatType === "x_per_year" && `${formData.repeatCount} ${t("daysPerYear")}`}
                </span>
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