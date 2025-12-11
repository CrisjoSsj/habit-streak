import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Clock, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Star,
  Heart
} from "lucide-react";
import { HABIT_TEMPLATES, getTemplatesByCategory, HabitTemplate } from "@/lib/habit-templates";
import { getHabitIcon } from "@/lib/habitIcons";

type TimePeriodConfig = {
  morning: string;
  afternoon: string;
  night: string;
  end_of_day: string;
};

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

export const Onboarding = ({ userId, onComplete }: OnboardingProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [timePeriods, setTimePeriods] = useState<TimePeriodConfig>({
    morning: "08:00",
    afternoon: "14:00",
    night: "19:00",
    end_of_day: "23:00",
  });
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleTimePeriodChange = (period: keyof TimePeriodConfig, value: string) => {
    setTimePeriods(prev => ({ ...prev, [period]: value }));
  };

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const saveTimePeriods = async () => {
    try {
      const periods = [
        { user_id: userId, period_type: "morning", start_time: timePeriods.morning },
        { user_id: userId, period_type: "afternoon", start_time: timePeriods.afternoon },
        { user_id: userId, period_type: "night", start_time: timePeriods.night },
        { user_id: userId, period_type: "end_of_day", start_time: timePeriods.end_of_day },
      ];

      // Eliminar períodos existentes y crear nuevos
      await supabase.from("time_periods").delete().eq("user_id", userId);
      const { error } = await supabase.from("time_periods").insert(periods);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error saving time periods:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron guardar los períodos de tiempo",
      });
      return false;
    }
  };

  const createHabitsFromTemplates = async () => {
    try {
      const templatesToCreate = HABIT_TEMPLATES.filter(t => selectedTemplates.has(t.id));
      
      if (templatesToCreate.length === 0) return true;

      const habits = templatesToCreate.map(template => ({
        user_id: userId,
        name: template.name,
        icon: template.icon,
        color: template.color,
        habit_type: template.habitType,
        goal_count: template.goalCount || 1,
        goal_minutes: template.goalMinutes || 10,
        time_of_day: template.timeOfDay,
        repeat_type: template.repeatType,
        repeat_days: template.repeatDays || ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        repeat_count: template.repeatCount || 7,
        reminder_enabled: false,
        incentive_text: template.description,
      }));

      const { error } = await supabase.from("habits").insert(habits);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error creating habits:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron crear los hábitos",
      });
      return false;
    }
  };

  const markOnboardingComplete = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error marking onboarding complete:", error);
      return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Guardar períodos de tiempo
      setLoading(true);
      const saved = await saveTimePeriods();
      setLoading(false);
      if (saved) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      // Crear hábitos desde templates
      setLoading(true);
      const created = await createHabitsFromTemplates();
      setLoading(false);
      if (created) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      // Finalizar onboarding
      setLoading(true);
      const completed = await markOnboardingComplete();
      setLoading(false);
      if (completed) {
        toast({
          title: "¡Bienvenido!",
          description: "Tu configuración ha sido guardada. ¡Comienza tu viaje hacia mejores hábitos!",
        });
        onComplete();
      }
    }
  };

  const handleSkip = async () => {
    // Marcar onboarding como completo sin configurar nada
    setLoading(true);
    const completed = await markOnboardingComplete();
    setLoading(false);
    if (completed) {
      onComplete();
    }
  };

  const categorizedTemplates = getTemplatesByCategory();
  const popularTemplates = HABIT_TEMPLATES.filter(t => t.popular);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-3 sm:p-4 md:p-6">
      <Card className="w-full max-w-3xl h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl border-2">
        {/* Header Fijo Compacto */}
        <CardHeader className="flex-shrink-0 border-b bg-card/95 backdrop-blur-md sticky top-0 z-20 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold leading-tight">Configuración Inicial</CardTitle>
                <CardDescription className="text-xs leading-tight">
                  Paso {currentStep} de {totalSteps}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip} 
              disabled={loading}
              className="text-xs h-8 px-2 sm:px-3"
            >
              Saltar
            </Button>
          </div>
          <Progress value={progress} className="h-1.5 mt-3" />
        </CardHeader>

        {/* Contenido Scrollable */}
        <CardContent className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 scrollbar-thin">
          {/* Paso 1: Bienvenida y Períodos de Tiempo */}
          {currentStep === 1 && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 py-2">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                  <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
                  ¡Bienvenido a HabitTrack!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-2">
                  Configura tus períodos de tiempo para organizar mejor tus hábitos durante el día
                </p>
              </div>

              <div className="space-y-3 max-w-xl mx-auto px-2">
                <Card className="border hover:border-primary/50 transition-colors shadow-sm">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <Label htmlFor="morning" className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Mañana
                    </Label>
                    <Input
                      id="morning"
                      type="time"
                      value={timePeriods.morning}
                      onChange={(e) => handleTimePeriodChange("morning", e.target.value)}
                      className="text-base h-11"
                    />
                    <p className="text-xs text-muted-foreground">¿A qué hora empieza tu mañana?</p>
                  </CardContent>
                </Card>

                <Card className="border hover:border-primary/50 transition-colors shadow-sm">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <Label htmlFor="afternoon" className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Tarde
                    </Label>
                    <Input
                      id="afternoon"
                      type="time"
                      value={timePeriods.afternoon}
                      onChange={(e) => handleTimePeriodChange("afternoon", e.target.value)}
                      className="text-base h-11"
                    />
                    <p className="text-xs text-muted-foreground">¿A qué hora empieza tu tarde?</p>
                  </CardContent>
                </Card>

                <Card className="border hover:border-primary/50 transition-colors shadow-sm">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <Label htmlFor="night" className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Noche
                    </Label>
                    <Input
                      id="night"
                      type="time"
                      value={timePeriods.night}
                      onChange={(e) => handleTimePeriodChange("night", e.target.value)}
                      className="text-base h-11"
                    />
                    <p className="text-xs text-muted-foreground">¿A qué hora empieza tu noche?</p>
                  </CardContent>
                </Card>

                <Card className="border hover:border-primary/50 transition-colors shadow-sm">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <Label htmlFor="end_of_day" className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Final del día
                    </Label>
                    <Input
                      id="end_of_day"
                      type="time"
                      value={timePeriods.end_of_day}
                      onChange={(e) => handleTimePeriodChange("end_of_day", e.target.value)}
                      className="text-base h-11"
                    />
                    <p className="text-xs text-muted-foreground">¿A qué hora termina tu día?</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Paso 2: Selección de Templates de Hábitos */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300 py-2">
              <div className="text-center space-y-3 px-2">
                <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-foreground to-primary shadow-lg">
                  <Target className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
                  Elige tus primeros hábitos
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Selecciona los hábitos que quieres comenzar. Puedes agregar más después
                </p>
              </div>

              {/* Templates Populares */}
              {popularTemplates.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground fill-accent-foreground" />
                    <h3 className="font-semibold text-sm sm:text-base">Populares</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {popularTemplates.map(template => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] border ${
                          selectedTemplates.has(template.id)
                            ? "ring-2 ring-primary border-primary bg-primary/5 shadow-sm"
                            : "hover:border-primary/30"
                        }`}
                        onClick={() => toggleTemplate(template.id)}
                      >
                        <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                          <Checkbox
                            checked={selectedTemplates.has(template.id)}
                            onCheckedChange={() => toggleTemplate(template.id)}
                            className="mt-0.5 flex-shrink-0 h-5 w-5"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-white shadow-sm flex-shrink-0"
                                style={{ backgroundColor: template.color }}
                              >
                                {(() => {
                                  const IconComponent = getHabitIcon(template.icon);
                                  return <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />;
                                })()}
                              </div>
                              <h4 className="font-semibold text-sm sm:text-base leading-tight">{template.name}</h4>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates por Categoría */}
              {Object.entries(categorizedTemplates).map(([category, templates]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-xs sm:text-sm uppercase text-muted-foreground tracking-wider px-1">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map(template => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] border ${
                          selectedTemplates.has(template.id)
                            ? "ring-2 ring-primary border-primary bg-primary/5 shadow-sm"
                            : "hover:border-primary/30"
                        }`}
                        onClick={() => toggleTemplate(template.id)}
                      >
                        <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                          <Checkbox
                            checked={selectedTemplates.has(template.id)}
                            onCheckedChange={() => toggleTemplate(template.id)}
                            className="mt-0.5 flex-shrink-0 h-5 w-5"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-white shadow-sm flex-shrink-0"
                                style={{ backgroundColor: template.color }}
                              >
                                {(() => {
                                  const IconComponent = getHabitIcon(template.icon);
                                  return <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />;
                                })()}
                              </div>
                              <h4 className="font-semibold text-sm sm:text-base leading-tight">{template.name}</h4>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {selectedTemplates.size === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Selecciona al menos un hábito o continúa para agregarlos después
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Finalización */}
          {currentStep === 3 && (
            <div className="space-y-5 text-center animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md mx-auto py-4 px-2">
              <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-foreground shadow-lg">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
                  ¡Todo listo!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Has configurado tu cuenta exitosamente. 
                  {selectedTemplates.size > 0 && (
                    <span className="block mt-2 font-medium text-foreground">
                      Se han creado {selectedTemplates.size} hábito{selectedTemplates.size !== 1 ? "s" : ""} para comenzar.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Períodos de tiempo configurados</span>
                </div>
                {selectedTemplates.size > 0 && (
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{selectedTemplates.size} hábito{selectedTemplates.size !== 1 ? "s" : ""} creado{selectedTemplates.size !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </CardContent>

        {/* Footer Fijo con Botones */}
        <div className="flex-shrink-0 border-t bg-card/95 backdrop-blur-md sticky bottom-0 z-20">
          <div className="flex justify-between items-center gap-3 px-4 sm:px-6 py-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || loading}
              className="flex-1 sm:flex-initial min-w-[90px] sm:min-w-[100px] h-10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Atrás</span>
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 sm:flex-initial min-w-[120px] sm:min-w-[140px] h-10 font-semibold"
            >
              {loading ? (
                <>
                  <span className="animate-pulse">Guardando...</span>
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <span className="hidden sm:inline">Comenzar</span>
                  <span className="sm:hidden">Listo</span>
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

