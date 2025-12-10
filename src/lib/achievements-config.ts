import { Target, Flame, Zap, Gem, Star, Sparkles, Trophy, CheckCircle2, Calendar, Clock, TrendingUp, Award, Crown, Rocket } from "lucide-react";

// Sistema de colores unificado por nivel (igual para todos los logros)
export const LEVEL_COLORS: Record<number, { gradient: string; solid: string; name: string }> = {
  1: { 
    gradient: "linear-gradient(to bottom right, #d97706, #92400e)", // Bronce
    solid: "#d97706",
    name: "Bronce"
  },
  2: { 
    gradient: "linear-gradient(to bottom right, #cbd5e1, #64748b)", // Plata
    solid: "#94a3b8",
    name: "Plata"
  },
  3: { 
    gradient: "linear-gradient(to bottom right, #facc15, #ca8a04)", // Oro
    solid: "#eab308",
    name: "Oro"
  },
  4: { 
    gradient: "linear-gradient(to bottom right, #5eead4, #0d9488)", // Platino
    solid: "#14b8a6",
    name: "Platino"
  },
  5: { 
    gradient: "linear-gradient(to bottom right, #a78bfa, #7c3aed)", // Diamante
    solid: "#8b5cf6",
    name: "Diamante"
  },
  6: { 
    gradient: "linear-gradient(to bottom right, #34d399, #059669)", // Esmeralda
    solid: "#10b981",
    name: "Esmeralda"
  },
  7: { 
    gradient: "linear-gradient(to bottom right, #f43f5e, #be185d)", // Rubí
    solid: "#e11d48",
    name: "Rubí"
  },
  8: { 
    gradient: "linear-gradient(to bottom right, #f97316, #c2410c)", // Zafiro
    solid: "#f97316",
    name: "Zafiro"
  }
};

export interface AchievementLevel {
  level: number;
  requirement: number;
  label: string;
  color: string; // Mantener para compatibilidad pero usar LEVEL_COLORS
  icon: typeof Target;
  colorValue?: string; // Valor CSS directo para el color
}

// Función helper para convertir colores de Tailwind a valores CSS
export function getColorValue(tailwindColor: string): string {
  // Mapeo de colores Tailwind a valores RGB/HSL
  const colorMap: Record<string, string> = {
    'amber-600': '#d97706',
    'amber-800': '#92400e',
    'slate-300': '#cbd5e1',
    'slate-500': '#64748b',
    'yellow-400': '#facc15',
    'yellow-600': '#ca8a04',
    'yellow-500': '#eab308',
    'yellow-700': '#a16207',
    'teal-300': '#5eead4',
    'teal-500': '#14b8a6',
    'teal-400': '#2dd4bf',
    'teal-600': '#0d9488',
    'teal-700': '#0f766e',
    'violet-400': '#a78bfa',
    'violet-500': '#8b5cf6',
    'violet-600': '#7c3aed',
    'violet-700': '#6d28d9',
    'rose-500': '#f43f5e',
    'rose-600': '#e11d48',
    'pink-600': '#db2777',
    'pink-700': '#be185d',
    'emerald-400': '#34d399',
    'emerald-500': '#10b981',
    'emerald-600': '#059669',
    'emerald-700': '#047857',
    'blue-400': '#60a5fa',
    'blue-500': '#3b82f6',
    'blue-600': '#2563eb',
    'blue-700': '#1d4ed8',
    'indigo-500': '#6366f1',
    'indigo-600': '#4f46e5',
    'indigo-700': '#4338ca',
    'indigo-800': '#3730a3',
    'purple-500': '#a855f7',
    'purple-600': '#9333ea',
    'purple-700': '#7e22ce',
    'purple-800': '#6b21a8',
    'orange-500': '#f97316',
    'orange-600': '#ea580c',
    'orange-700': '#c2410c',
    'red-500': '#ef4444',
    'red-600': '#dc2626',
    'red-700': '#b91c1c',
    'lime-400': '#a3e635',
    'lime-500': '#84cc16',
    'lime-700': '#4d7c0f',
    'cyan-400': '#22d3ee',
    'cyan-500': '#06b6d4',
    'cyan-600': '#0891b2',
    'cyan-700': '#0e7490',
    'sky-400': '#38bdf8',
    'sky-500': '#0ea5e9',
    'sky-600': '#0284c7',
    'sky-700': '#0369a1',
    'fuchsia-500': '#d946ef',
    'fuchsia-700': '#a21caf',
  };

  // Extraer el color base del gradiente (ej: "from-amber-600 to-amber-800" -> "amber-600")
  const fromColor = tailwindColor.match(/from-(\S+)/)?.[1];
  const toColor = tailwindColor.match(/to-(\S+)/)?.[1];
  
  if (fromColor && colorMap[fromColor]) {
    return colorMap[fromColor];
  }
  if (toColor && colorMap[toColor]) {
    return colorMap[toColor];
  }
  
  return '#6b7280'; // Color por defecto (gray-500)
}

// Función helper para convertir gradientes de Tailwind a CSS linear-gradient
export function getGradientStyle(tailwindColor: string): string {
  const colorMap: Record<string, string> = {
    'amber-600': '#d97706',
    'amber-800': '#92400e',
    'slate-300': '#cbd5e1',
    'slate-500': '#64748b',
    'yellow-400': '#facc15',
    'yellow-600': '#ca8a04',
    'yellow-500': '#eab308',
    'yellow-700': '#a16207',
    'teal-300': '#5eead4',
    'teal-500': '#14b8a6',
    'teal-400': '#2dd4bf',
    'teal-600': '#0d9488',
    'teal-700': '#0f766e',
    'violet-400': '#a78bfa',
    'violet-500': '#8b5cf6',
    'violet-600': '#7c3aed',
    'violet-700': '#6d28d9',
    'rose-500': '#f43f5e',
    'rose-600': '#e11d48',
    'pink-600': '#db2777',
    'pink-700': '#be185d',
    'emerald-400': '#34d399',
    'emerald-500': '#10b981',
    'emerald-600': '#059669',
    'emerald-700': '#047857',
    'blue-400': '#60a5fa',
    'blue-500': '#3b82f6',
    'blue-600': '#2563eb',
    'blue-700': '#1d4ed8',
    'indigo-500': '#6366f1',
    'indigo-600': '#4f46e5',
    'indigo-700': '#4338ca',
    'indigo-800': '#3730a3',
    'purple-500': '#a855f7',
    'purple-600': '#9333ea',
    'purple-700': '#7e22ce',
    'purple-800': '#6b21a8',
    'orange-500': '#f97316',
    'orange-600': '#ea580c',
    'orange-700': '#c2410c',
    'red-500': '#ef4444',
    'red-600': '#dc2626',
    'red-700': '#b91c1c',
    'lime-400': '#a3e635',
    'lime-500': '#84cc16',
    'lime-700': '#4d7c0f',
    'cyan-400': '#22d3ee',
    'cyan-500': '#06b6d4',
    'cyan-600': '#0891b2',
    'cyan-700': '#0e7490',
    'sky-400': '#38bdf8',
    'sky-500': '#0ea5e9',
    'sky-600': '#0284c7',
    'sky-700': '#0369a1',
    'fuchsia-500': '#d946ef',
    'fuchsia-700': '#a21caf',
  };

  const fromColor = tailwindColor.match(/from-(\S+)/)?.[1];
  const toColor = tailwindColor.match(/to-(\S+)/)?.[1];
  
  const fromValue = fromColor && colorMap[fromColor] ? colorMap[fromColor] : '#6b7280';
  const toValue = toColor && colorMap[toColor] ? colorMap[toColor] : fromValue;
  
  return `linear-gradient(to bottom right, ${fromValue}, ${toValue})`;
}

export interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  icon: typeof Target;
  levels: AchievementLevel[];
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: "first_completion",
    name: "Primer Paso",
    description: "Completa tu primer hábito",
    icon: Target,
    levels: [
      { level: 1, requirement: 1, label: "Primera completación", color: "from-blue-400 to-blue-600", icon: Target }
    ]
  },
  {
    type: "streak",
    name: "Racha de Fuego",
    description: "Mantén una racha consecutiva",
    icon: Flame,
    levels: [
      { level: 1, requirement: 3, label: "Bronce - 3 días", color: "from-amber-600 to-amber-800", icon: Flame },
      { level: 2, requirement: 7, label: "Plata - 7 días", color: "from-slate-300 to-slate-500", icon: Flame },
      { level: 3, requirement: 30, label: "Oro - 30 días", color: "from-yellow-400 to-yellow-600", icon: Zap },
      { level: 4, requirement: 60, label: "Platino - 60 días", color: "from-teal-300 to-teal-500", icon: Zap },
      { level: 5, requirement: 100, label: "Diamante - 100 días", color: "from-violet-400 to-violet-600", icon: Gem },
      { level: 6, requirement: 365, label: "Esmeralda - 365 días", color: "from-emerald-400 to-emerald-600", icon: Gem }
    ]
  },
  {
    type: "perfect_day",
    name: "Día Perfecto",
    description: "Completa todos tus hábitos en un día",
    icon: Star,
    levels: [
      { level: 1, requirement: 1, label: "Bronce - 1 día", color: "from-amber-600 to-amber-800", icon: Star },
      { level: 2, requirement: 3, label: "Plata - 3 días", color: "from-slate-300 to-slate-500", icon: Star },
      { level: 3, requirement: 5, label: "Oro - 5 días", color: "from-yellow-400 to-yellow-600", icon: Star },
      { level: 4, requirement: 10, label: "Platino - 10 días", color: "from-teal-300 to-teal-500", icon: Star },
      { level: 5, requirement: 20, label: "Diamante - 20 días", color: "from-violet-400 to-violet-600", icon: Star },
      { level: 6, requirement: 30, label: "Esmeralda - 30 días", color: "from-emerald-400 to-emerald-600", icon: Star },
      { level: 7, requirement: 50, label: "Rubí - 50 días", color: "from-rose-500 to-pink-600", icon: Star },
      { level: 8, requirement: 100, label: "Zafiro - 100 días", color: "from-orange-500 to-orange-700", icon: Star }
    ]
  },
  {
    type: "perfect_week",
    name: "Semana Perfecta",
    description: "Completa todos tus hábitos durante toda una semana",
    icon: Sparkles,
    levels: [
      { level: 1, requirement: 1, label: "Bronce - 1 semana", color: "from-amber-600 to-amber-800", icon: Sparkles },
      { level: 2, requirement: 2, label: "Plata - 2 semanas", color: "from-slate-300 to-slate-500", icon: Sparkles },
      { level: 3, requirement: 4, label: "Oro - 4 semanas", color: "from-yellow-400 to-yellow-600", icon: Sparkles },
      { level: 4, requirement: 8, label: "Platino - 8 semanas", color: "from-teal-300 to-teal-500", icon: Sparkles },
      { level: 5, requirement: 12, label: "Diamante - 12 semanas", color: "from-violet-400 to-violet-600", icon: Sparkles },
      { level: 6, requirement: 24, label: "Esmeralda - 24 semanas", color: "from-emerald-400 to-emerald-600", icon: Sparkles }
    ]
  },
  {
    type: "total_completions",
    name: "Maestro de Hábitos",
    description: "Completa hábitos muchas veces",
    icon: CheckCircle2,
    levels: [
      { level: 1, requirement: 10, label: "Bronce - 10 completaciones", color: "from-amber-600 to-amber-800", icon: CheckCircle2 },
      { level: 2, requirement: 50, label: "Plata - 50 completaciones", color: "from-slate-300 to-slate-500", icon: CheckCircle2 },
      { level: 3, requirement: 100, label: "Oro - 100 completaciones", color: "from-yellow-400 to-yellow-600", icon: CheckCircle2 },
      { level: 4, requirement: 500, label: "Platino - 500 completaciones", color: "from-teal-300 to-teal-500", icon: CheckCircle2 },
      { level: 5, requirement: 1000, label: "Diamante - 1000 completaciones", color: "from-violet-400 to-violet-600", icon: CheckCircle2 },
      { level: 6, requirement: 5000, label: "Esmeralda - 5000 completaciones", color: "from-emerald-400 to-emerald-600", icon: Crown }
    ]
  },
  {
    type: "habits_created",
    name: "Creador de Hábitos",
    description: "Crea múltiples hábitos",
    icon: Rocket,
    levels: [
      { level: 1, requirement: 1, label: "Bronce - 1 hábito", color: "from-amber-600 to-amber-800", icon: Rocket },
      { level: 2, requirement: 5, label: "Plata - 5 hábitos", color: "from-slate-300 to-slate-500", icon: Rocket },
      { level: 3, requirement: 10, label: "Oro - 10 hábitos", color: "from-yellow-400 to-yellow-600", icon: Rocket },
      { level: 4, requirement: 20, label: "Platino - 20 hábitos", color: "from-teal-300 to-teal-500", icon: Rocket },
      { level: 5, requirement: 50, label: "Diamante - 50 hábitos", color: "from-violet-400 to-violet-600", icon: Crown }
    ]
  },
  {
    type: "perfect_month",
    name: "Mes Perfecto",
    description: "Completa todos tus hábitos durante un mes completo",
    icon: Calendar,
    levels: [
      { level: 1, requirement: 1, label: "Bronce - 1 mes", color: "from-amber-600 to-amber-800", icon: Calendar },
      { level: 2, requirement: 3, label: "Plata - 3 meses", color: "from-slate-300 to-slate-500", icon: Calendar },
      { level: 3, requirement: 6, label: "Oro - 6 meses", color: "from-yellow-400 to-yellow-600", icon: Calendar },
      { level: 4, requirement: 12, label: "Platino - 12 meses", color: "from-teal-300 to-teal-500", icon: Crown }
    ]
  },
  {
    type: "no_miss_streak",
    name: "Sin Faltar",
    description: "Mantén una racha sin faltar ningún día",
    icon: TrendingUp,
    levels: [
      { level: 1, requirement: 7, label: "Bronce - 7 días", color: "from-amber-600 to-amber-800", icon: TrendingUp },
      { level: 2, requirement: 14, label: "Plata - 14 días", color: "from-slate-300 to-slate-500", icon: TrendingUp },
      { level: 3, requirement: 30, label: "Oro - 30 días", color: "from-yellow-400 to-yellow-600", icon: TrendingUp },
      { level: 4, requirement: 60, label: "Platino - 60 días", color: "from-teal-300 to-teal-500", icon: TrendingUp },
      { level: 5, requirement: 90, label: "Diamante - 90 días", color: "from-violet-400 to-violet-600", icon: TrendingUp },
      { level: 6, requirement: 180, label: "Esmeralda - 180 días", color: "from-emerald-400 to-emerald-600", icon: Crown }
    ]
  },
  {
    type: "active_habits",
    name: "Multitarea",
    description: "Mantén múltiples hábitos activos simultáneamente",
    icon: Award,
    levels: [
      { level: 1, requirement: 3, label: "Bronce - 3 hábitos", color: "from-amber-600 to-amber-800", icon: Award },
      { level: 2, requirement: 5, label: "Plata - 5 hábitos", color: "from-slate-300 to-slate-500", icon: Award },
      { level: 3, requirement: 10, label: "Oro - 10 hábitos", color: "from-yellow-400 to-yellow-600", icon: Award },
      { level: 4, requirement: 15, label: "Platino - 15 hábitos", color: "from-teal-300 to-teal-500", icon: Award },
      { level: 5, requirement: 20, label: "Diamante - 20 hábitos", color: "from-violet-400 to-violet-600", icon: Crown }
    ]
  },
  {
    type: "time_variety",
    name: "Todo el Día",
    description: "Completa hábitos en diferentes momentos del día",
    icon: Clock,
    levels: [
      { level: 1, requirement: 2, label: "Bronce - 2 momentos", color: "from-amber-600 to-amber-800", icon: Clock },
      { level: 2, requirement: 3, label: "Plata - 3 momentos", color: "from-slate-300 to-slate-500", icon: Clock },
      { level: 3, requirement: 4, label: "Oro - 4 momentos", color: "from-yellow-400 to-yellow-600", icon: Clock }
    ]
  },
  {
    type: "weekend_warrior",
    name: "Guerrero de Fin de Semana",
    description: "Completa hábitos consistentemente los fines de semana",
    icon: Trophy,
    levels: [
      { level: 1, requirement: 4, label: "Bronce - 4 fines de semana", color: "from-amber-600 to-amber-800", icon: Trophy },
      { level: 2, requirement: 8, label: "Plata - 8 fines de semana", color: "from-slate-300 to-slate-500", icon: Trophy },
      { level: 3, requirement: 12, label: "Oro - 12 fines de semana", color: "from-yellow-400 to-yellow-600", icon: Trophy },
      { level: 4, requirement: 24, label: "Platino - 24 fines de semana", color: "from-teal-300 to-teal-500", icon: Crown }
    ]
  },
  {
    type: "early_bird",
    name: "Madrugador",
    description: "Completa hábitos en la mañana consistentemente",
    icon: Zap,
    levels: [
      { level: 1, requirement: 7, label: "Bronce - 7 mañanas", color: "from-amber-600 to-amber-800", icon: Zap },
      { level: 2, requirement: 14, label: "Plata - 14 mañanas", color: "from-slate-300 to-slate-500", icon: Zap },
      { level: 3, requirement: 30, label: "Oro - 30 mañanas", color: "from-yellow-400 to-yellow-600", icon: Zap }
    ]
  }
];

export function getAchievementProgress(
  achievementType: string,
  currentValue: number
): { currentLevel: AchievementLevel | null; nextLevel: AchievementLevel | null; progress: number } {
  const definition = ACHIEVEMENT_DEFINITIONS.find(d => d.type === achievementType);
  if (!definition) {
    return { currentLevel: null, nextLevel: null, progress: 0 };
  }

  // Encontrar el nivel actual (el más alto que el usuario ha alcanzado)
  let currentLevel: AchievementLevel | null = null;
  let nextLevel: AchievementLevel | null = null;

  for (let i = definition.levels.length - 1; i >= 0; i--) {
    if (currentValue >= definition.levels[i].requirement) {
      currentLevel = definition.levels[i];
      if (i < definition.levels.length - 1) {
        nextLevel = definition.levels[i + 1];
      }
      break;
    }
  }

  // Si no tiene ningún nivel, el siguiente es el primero
  if (!currentLevel && definition.levels.length > 0) {
    nextLevel = definition.levels[0];
  }

  // Calcular progreso hacia el siguiente nivel
  let progress = 0;
  if (nextLevel) {
    const baseRequirement = currentLevel ? currentLevel.requirement : 0;
    const targetRequirement = nextLevel.requirement;
    const progressValue = currentValue - baseRequirement;
    const totalNeeded = targetRequirement - baseRequirement;
    progress = totalNeeded > 0 ? Math.min(100, Math.round((progressValue / totalNeeded) * 100)) : 0;
  } else if (currentLevel) {
    progress = 100; // Máximo nivel alcanzado
  }

  return { currentLevel, nextLevel, progress };
}

