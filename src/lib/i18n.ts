export type Language = "es" | "en";

export const translations = {
  es: {
    // Header
    brand: "HABITTRACK",
    tagline: "Sistema de gestión de hábitos ISO 9001",
    login: "Iniciar sesión",
    logout: "Cerrar sesión",
    profile: "Mi perfil",
    admin: "Panel Admin",
    dashboard: "Mi panel",
    
    // Landing
    heroTitle: "Sistema profesional de seguimiento de hábitos",
    heroSubtitle: "Plataforma certificada para la gestión integral de hábitos personales y profesionales. Cumplimos con estándares de calidad ISO 9001.",
    getStarted: "Comenzar ahora",
    learnMore: "Más información",
    features: "Características",
    
    // Stats
    todayHabits: "Hábitos de hoy",
    bestStreak: "Mejor racha",
    days: "días",
    reminders: "Recordatorios",
    active: "activos",
    
    // Auth
    accessTitle: "Acceso al Sistema",
    accessSubtitle: "Inicie sesión para continuar o registre una nueva cuenta.",
    loginTab: "Iniciar sesión",
    registerTab: "Crear cuenta",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    firstName: "Nombre",
    lastName: "Apellidos",
    phone: "Teléfono móvil",
    age: "Edad",
    enter: "Entrar",
    createAccount: "Crear cuenta",
    processing: "Procesando...",
    testAccounts: "Cuentas de demostración",
    createAdminAccount: "Crear cuenta admin",
    createUserAccount: "Crear cuenta usuario",
    
    // Footer
    footerTitle: "HabitTrack",
    footerDescription: "Sistema profesional de gestión de hábitos con estándares de calidad ISO 9001.",
    footerLinks: "Enlaces",
    footerContact: "Contacto",
    footerPrivacy: "Política de privacidad",
    footerTerms: "Términos de uso",
    footerSupport: "Soporte técnico",
    footerRights: "Todos los derechos reservados.",
    footerCertification: "Certificación de calidad ISO 9001:2015",
    
    // Dashboard
    today: "HOY",
    yourHabitsToday: "Sus hábitos de hoy",
    markCheckIns: "Registre sus check-ins diarios y mantenga sus rachas activas.",
    goal: "Meta",
    progress: "Progreso",
    completed: "Completado",
    checkIn: "Registrar",
    register: "Registrar +1",
    reset: "Reiniciar",
    start: "Iniciar",
    pause: "Pausar",
    finish: "Finalizar",
    finishAll: "Completar todo",
    restDay: "Día de descanso",
    edit: "Editar",
    all: "Todos",
    anytime: "Cualquier hora",
    anyMoment: "Cualquier momento",
    min: "min",
    reps: "reps",
    createNewHabit: "Crear un nuevo hábito",
    noHabitsYet: "Todavía no has creado ningún hábito.",
    
    // Time of day
    morning: "Mañana",
    afternoon: "Tarde",
    night: "Noche",
    evening: "Noche",
    
    // Progress
    progressCharts: "Gráficos de progreso",
    progressChartsDesc: "Visualice sus hábitos cumplidos por día y semana.",
    week: "Semana",
    month: "Mes",
    
    // Achievements
    achievements: "Logros",
    achievementsDesc: "Medallas obtenidas por su constancia.",
    myAchievements: "Mis logros",
    youHaveEarned: "Has ganado el",
    ofAllAchievements: "de todos los logros",
    finishedHabits: "Hábitos terminados",
    archived: "Archivados",
    perfectDays: "Días perfectos",
    finishHabitOnce: "Termina un hábito por primera vez",
    finishHabit10: "Termina un hábito 10 veces",
    finishHabit20: "Termina un hábito 20 veces",
    finishHabit50: "Termina un hábito 50 veces",
    finishHabit100: "Termina un hábito 100 veces",
    finishHabit300: "Termina un hábito 300 veces",
    perfectDay3: "3 días perfectos",
    perfectDay10: "10 días perfectos",
    perfectDay20: "20 días perfectos",
    
    // How it works
    howItWorks: "Cómo funciona",
    howItWorksDesc: "Proceso estructurado para la gestión efectiva de hábitos.",
    step1Title: "Defina sus hábitos",
    step1Desc: "Configure objetivos personalizados con métricas claras.",
    step2Title: "Registre diariamente",
    step2Desc: "Marque su progreso con check-ins simples.",
    step3Title: "Analice resultados",
    step3Desc: "Visualice estadísticas y patrones de comportamiento.",
    
    // Reminders
    reminderConfig: "Configuración de recordatorios",
    reminderDesc: "Programe notificaciones personalizadas.",
    
    // View
    viewExample: "Vista ejemplo",
    
    // Navigation
    navToday: "Hoy",
    navJourney: "Viaje",
    navHistory: "Historial",
    navProfile: "Mío",
    
    // Completion modal
    congratulations: "¡Felicitaciones!",
    allCompleted: "¡Todos completados!",
    completionMessage: "Has completado todos tus hábitos de hoy. ¡Sigue así!",
    continue: "Continuar",
    
    // Days of week
    sun: "D",
    mon: "L",
    tue: "M",
    wed: "X",
    thu: "J",
    fri: "V",
    sat: "S",
    
    // Habit form
    habitFormTitle: "Nuevo hábito",
    habitFormSubtitle: "¿Qué hábito quieres crear?",
    habitName: "Nombre de hábito",
    frequentHabit: "Hábito asiduo",
    habitIcon: "Ícono",
    habitColor: "Color",
    repeat: "Repetir",
    habitDays: "Días de hábito",
    allDays: "Todos los días",
    specificDaysOfWeek: "Días específicos de la semana",
    xDaysPerWeek: "X días a la semana",
    xDaysPerMonth: "X días al mes",
    xDaysPerYear: "X días al año",
    longTermHabit: "Hábito a largo plazo",
    longTermDesc: "Se registrará individualmente en la categoría \"largo plazo\" de tu lista de hábitos.",
    doIt: "Hacerlo",
    dailyGoal: "Objetivo diario",
    objective: "Objetivo",
    disable: "Desactivar",
    advancedSettings: "Ajustes avanzados",
    reminderForHabit: "Recordatorio para este hábito",
    soundEffects: "Efectos de sonido",
    systemDefault: "Sistema predeterminado",
    incentive: "Incentivo",
    incentivePlaceholder: "Escribe algo para incentivarte...",
    endIn: "Terminar en",
    deactivate: "Desactivar",
    date: "Fecha",
    daysOption: "Días",
    lastDayIs: "El último día es...",
    save: "Guardar",
    typeCheckIn: "Check-in",
    typeCounter: "Contador",
    typeTimer: "Temporizador",
    
    // History page
    history: "Historial",
    calendar: "Calendario",
    allHabits: "Todos los hábitos",
    currentStreak: "Racha actual",
    habitCompleted: "Hábito terminado",
    thisWeek: "Esta semana",
    completionRate: "Índice de completado",
    habits: "hábitos",
    
    // Profile / Settings
    settings: "Configuración",
    timePeriods: "Periodos de tiempo",
    notifications: "Notificación",
    globalReminders: "Recordatorios globales",
    morningHabit: "Hábito de mañana",
    afternoonHabit: "Hábito de tarde",
    nightHabit: "Hábito de noche",
    startAt: "Empezar a la(s)",
    endOfDay: "Final del día",
    account: "Cuenta",
    editProfile: "Editar perfil",
    
    // Loading states
    loading: "Cargando...",
    checkingSession: "Comprobando tu sesión...",
  },
  en: {
    // Header
    brand: "HABITTRACK",
    tagline: "ISO 9001 Habit Management System",
    login: "Sign in",
    logout: "Sign out",
    profile: "My profile",
    admin: "Admin Panel",
    dashboard: "Dashboard",
    
    // Landing
    heroTitle: "Professional Habit Tracking System",
    heroSubtitle: "Certified platform for comprehensive personal and professional habit management. ISO 9001 quality standards compliant.",
    getStarted: "Get Started",
    learnMore: "Learn More",
    features: "Features",
    
    // Stats
    todayHabits: "Today's habits",
    bestStreak: "Best streak",
    days: "days",
    reminders: "Reminders",
    active: "active",
    
    // Auth
    accessTitle: "System Access",
    accessSubtitle: "Sign in to continue or register a new account.",
    loginTab: "Sign in",
    registerTab: "Create account",
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    firstName: "First name",
    lastName: "Last name",
    phone: "Mobile phone",
    age: "Age",
    enter: "Sign in",
    createAccount: "Create account",
    processing: "Processing...",
    testAccounts: "Demo accounts",
    createAdminAccount: "Create admin account",
    createUserAccount: "Create user account",
    
    // Footer
    footerTitle: "HabitTrack",
    footerDescription: "Professional habit management system with ISO 9001 quality standards.",
    footerLinks: "Links",
    footerContact: "Contact",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Use",
    footerSupport: "Technical Support",
    footerRights: "All rights reserved.",
    footerCertification: "ISO 9001:2015 Quality Certification",
    
    // Dashboard
    today: "TODAY",
    yourHabitsToday: "Your habits today",
    markCheckIns: "Record your daily check-ins and keep your streaks active.",
    goal: "Goal",
    progress: "Progress",
    completed: "Completed",
    checkIn: "Check-in",
    register: "Register +1",
    reset: "Reset",
    start: "Start",
    pause: "Pause",
    finish: "Finish",
    finishAll: "Complete all",
    restDay: "Rest day",
    edit: "Edit",
    all: "All",
    anytime: "Anytime",
    anyMoment: "Any moment",
    min: "min",
    reps: "reps",
    createNewHabit: "Create a new habit",
    noHabitsYet: "You haven't created any habits yet.",
    
    // Time of day
    morning: "Morning",
    afternoon: "Afternoon",
    night: "Night",
    evening: "Evening",
    
    // Progress
    progressCharts: "Progress Charts",
    progressChartsDesc: "View your completed habits by day and week.",
    week: "Week",
    month: "Month",
    
    // Achievements
    achievements: "Achievements",
    achievementsDesc: "Medals earned for your consistency.",
    myAchievements: "My achievements",
    youHaveEarned: "You have earned",
    ofAllAchievements: "of all achievements",
    finishedHabits: "Finished habits",
    archived: "Archived",
    perfectDays: "Perfect days",
    finishHabitOnce: "Finish a habit for the first time",
    finishHabit10: "Finish a habit 10 times",
    finishHabit20: "Finish a habit 20 times",
    finishHabit50: "Finish a habit 50 times",
    finishHabit100: "Finish a habit 100 times",
    finishHabit300: "Finish a habit 300 times",
    perfectDay3: "3 perfect days",
    perfectDay10: "10 perfect days",
    perfectDay20: "20 perfect days",
    
    // How it works
    howItWorks: "How it works",
    howItWorksDesc: "Structured process for effective habit management.",
    step1Title: "Define your habits",
    step1Desc: "Configure personalized goals with clear metrics.",
    step2Title: "Record daily",
    step2Desc: "Mark your progress with simple check-ins.",
    step3Title: "Analyze results",
    step3Desc: "Visualize statistics and behavior patterns.",
    
    // Reminders
    reminderConfig: "Reminder configuration",
    reminderDesc: "Schedule personalized notifications.",
    
    // View
    viewExample: "Example view",
    
    // Navigation
    navToday: "Today",
    navJourney: "Journey",
    navHistory: "History",
    navProfile: "Me",
    
    // Completion modal
    congratulations: "Congratulations!",
    allCompleted: "All completed!",
    completionMessage: "You've completed all your habits today. Keep it up!",
    continue: "Continue",
    
    // Days of week
    sun: "S",
    mon: "M",
    tue: "T",
    wed: "W",
    thu: "T",
    fri: "F",
    sat: "S",
    
    // Habit form
    habitFormTitle: "New habit",
    habitFormSubtitle: "What habit do you want to create?",
    habitName: "Habit name",
    frequentHabit: "Frequent habit",
    habitIcon: "Icon",
    habitColor: "Color",
    repeat: "Repeat",
    habitDays: "Habit days",
    allDays: "Every day",
    specificDaysOfWeek: "Specific days of the week",
    xDaysPerWeek: "X days per week",
    xDaysPerMonth: "X days per month",
    xDaysPerYear: "X days per year",
    longTermHabit: "Long term habit",
    longTermDesc: "Will be recorded individually in the \"long term\" category of your habit list.",
    doIt: "Do it",
    dailyGoal: "Daily goal",
    objective: "Objective",
    disable: "Disable",
    advancedSettings: "Advanced settings",
    reminderForHabit: "Reminder for this habit",
    soundEffects: "Sound effects",
    systemDefault: "System default",
    incentive: "Incentive",
    incentivePlaceholder: "Write something to motivate yourself...",
    endIn: "End in",
    deactivate: "Deactivate",
    date: "Date",
    daysOption: "Days",
    lastDayIs: "The last day is...",
    save: "Save",
    typeCheckIn: "Check-in",
    typeCounter: "Counter",
    typeTimer: "Timer",
    
    // History page
    history: "History",
    calendar: "Calendar",
    allHabits: "All habits",
    currentStreak: "Current streak",
    habitCompleted: "Habit completed",
    thisWeek: "This week",
    completionRate: "Completion rate",
    habits: "habits",
    
    // Profile / Settings
    settings: "Settings",
    timePeriods: "Time periods",
    notifications: "Notification",
    globalReminders: "Global reminders",
    morningHabit: "Morning habit",
    afternoonHabit: "Afternoon habit",
    nightHabit: "Night habit",
    startAt: "Start at",
    endOfDay: "End of day",
    account: "Account",
    editProfile: "Edit profile",
    
    // Loading states
    loading: "Loading...",
    checkingSession: "Checking your session...",
  },
} as const;

export type TranslationKey = keyof typeof translations.es;
export type TranslationKeys = typeof translations.es;

export const getTranslation = (lang: Language, key: TranslationKey): string => {
  return translations[lang][key];
};
