/**
 * Templates de hábitos pre-configurados para onboarding
 */

export interface HabitTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  habitType: "check" | "count" | "timer";
  goalCount?: number;
  goalMinutes?: number;
  timeOfDay: "anytime" | "morning" | "afternoon" | "night";
  repeatType: "daily" | "specific_days" | "x_per_week" | "x_per_month" | "x_per_year";
  repeatDays?: string[];
  repeatCount?: number;
  category: string;
  description: string;
  popular?: boolean;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Ejercicio
  {
    id: "exercise-running",
    name: "Correr",
    icon: "zap",
    color: "#3B82F6",
    habitType: "timer",
    goalMinutes: 30,
    timeOfDay: "morning",
    repeatType: "x_per_week",
    repeatCount: 3,
    category: "Ejercicio",
    description: "Salir a correr para mantenerte activo",
    popular: true,
  },
  {
    id: "exercise-gym",
    name: "Ir al gimnasio",
    icon: "dumbbell",
    color: "#EF4444",
    habitType: "check",
    timeOfDay: "afternoon",
    repeatType: "x_per_week",
    repeatCount: 3,
    category: "Ejercicio",
    description: "Entrenar en el gimnasio",
    popular: true,
  },
  {
    id: "exercise-yoga",
    name: "Practicar yoga",
    icon: "leaf",
    color: "#22C55E",
    habitType: "timer",
    goalMinutes: 20,
    timeOfDay: "morning",
    repeatType: "daily",
    category: "Ejercicio",
    description: "Sesión de yoga para flexibilidad y relajación",
  },
  {
    id: "exercise-walk",
    name: "Caminar 10,000 pasos",
    icon: "footprints",
    color: "#8B5CF6",
    habitType: "count",
    goalCount: 10000,
    timeOfDay: "anytime",
    repeatType: "daily",
    category: "Ejercicio",
    description: "Alcanzar 10,000 pasos diarios",
    popular: true,
  },
  
  // Salud
  {
    id: "health-water",
    name: "Beber agua",
    icon: "droplet",
    color: "#06B6D4",
    habitType: "count",
    goalCount: 8,
    timeOfDay: "anytime",
    repeatType: "daily",
    category: "Salud",
    description: "Beber 8 vasos de agua al día",
    popular: true,
  },
  {
    id: "health-meditation",
    name: "Meditar",
    icon: "brain",
    color: "#8B5CF6",
    habitType: "timer",
    goalMinutes: 10,
    timeOfDay: "morning",
    repeatType: "daily",
    category: "Salud",
    description: "Tiempo de meditación para el bienestar mental",
    popular: true,
  },
  {
    id: "health-sleep",
    name: "Dormir 8 horas",
    icon: "moon",
    color: "#6366F1",
    habitType: "timer",
    goalMinutes: 480,
    timeOfDay: "night",
    repeatType: "daily",
    category: "Salud",
    description: "Asegurar 8 horas de sueño de calidad",
    popular: true,
  },
  {
    id: "health-vitamins",
    name: "Tomar vitaminas",
    icon: "pill",
    color: "#F59E0B",
    habitType: "check",
    timeOfDay: "morning",
    repeatType: "daily",
    category: "Salud",
    description: "Recordar tomar tus vitaminas diarias",
  },
  
  // Productividad
  {
    id: "productivity-reading",
    name: "Leer",
    icon: "book",
    color: "#8B5CF6",
    habitType: "timer",
    goalMinutes: 30,
    timeOfDay: "night",
    repeatType: "daily",
    category: "Productividad",
    description: "Tiempo dedicado a la lectura",
    popular: true,
  },
  {
    id: "productivity-writing",
    name: "Escribir en el diario",
    icon: "pen-tool",
    color: "#EC4899",
    habitType: "timer",
    goalMinutes: 15,
    timeOfDay: "night",
    repeatType: "daily",
    category: "Productividad",
    description: "Reflexionar y escribir sobre tu día",
  },
  {
    id: "productivity-study",
    name: "Estudiar",
    icon: "graduation-cap",
    color: "#3B82F6",
    habitType: "timer",
    goalMinutes: 60,
    timeOfDay: "afternoon",
    repeatType: "x_per_week",
    repeatCount: 5,
    category: "Productividad",
    description: "Tiempo dedicado al estudio",
  },
  {
    id: "productivity-no-phone",
    name: "No usar teléfono antes de dormir",
    icon: "smartphone",
    color: "#6366F1",
    habitType: "check",
    timeOfDay: "night",
    repeatType: "daily",
    category: "Productividad",
    description: "Evitar pantallas 1 hora antes de dormir",
  },
  
  // Bienestar
  {
    id: "wellbeing-gratitude",
    name: "Practicar gratitud",
    icon: "heart",
    color: "#EC4899",
    habitType: "check",
    timeOfDay: "night",
    repeatType: "daily",
    category: "Bienestar",
    description: "Escribir 3 cosas por las que estás agradecido",
    popular: true,
  },
  {
    id: "wellbeing-journaling",
    name: "Journaling",
    icon: "book-open",
    color: "#8B5CF6",
    habitType: "timer",
    goalMinutes: 10,
    timeOfDay: "morning",
    repeatType: "daily",
    category: "Bienestar",
    description: "Escribir tus pensamientos y emociones",
  },
  {
    id: "wellbeing-stretching",
    name: "Estiramientos",
    icon: "activity",
    color: "#22C55E",
    habitType: "timer",
    goalMinutes: 15,
    timeOfDay: "morning",
    repeatType: "daily",
    category: "Bienestar",
    description: "Estiramientos matutinos para activar el cuerpo",
  },
  {
    id: "wellbeing-social",
    name: "Tiempo con familia/amigos",
    icon: "users",
    color: "#F59E0B",
    habitType: "timer",
    goalMinutes: 60,
    timeOfDay: "afternoon",
    repeatType: "x_per_week",
    repeatCount: 3,
    category: "Bienestar",
    description: "Dedicar tiempo de calidad a tus relaciones",
  },
  
  // Alimentación
  {
    id: "food-vegetables",
    name: "Comer vegetales",
    icon: "carrot",
    color: "#22C55E",
    habitType: "count",
    goalCount: 5,
    timeOfDay: "anytime",
    repeatType: "daily",
    category: "Alimentación",
    description: "Comer 5 porciones de vegetales al día",
  },
  {
    id: "food-breakfast",
    name: "Desayunar saludable",
    icon: "coffee",
    color: "#F59E0B",
    habitType: "check",
    timeOfDay: "morning",
    repeatType: "daily",
    category: "Alimentación",
    description: "Empezar el día con un desayuno nutritivo",
  },
  {
    id: "food-meal-prep",
    name: "Preparar comida",
    icon: "chef-hat",
    color: "#EF4444",
    habitType: "check",
    timeOfDay: "afternoon",
    repeatType: "x_per_week",
    repeatCount: 2,
    category: "Alimentación",
    description: "Preparar comidas para la semana",
  },
];

export const getTemplatesByCategory = (): Record<string, HabitTemplate[]> => {
  const categorized: Record<string, HabitTemplate[]> = {};
  HABIT_TEMPLATES.forEach(template => {
    if (!categorized[template.category]) {
      categorized[template.category] = [];
    }
    categorized[template.category].push(template);
  });
  return categorized;
};

export const getPopularTemplates = (): HabitTemplate[] => {
  return HABIT_TEMPLATES.filter(t => t.popular);
};

