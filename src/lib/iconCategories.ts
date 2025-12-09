// Categorías de iconos organizadas para el selector
export const iconCategories = [
  {
    name: "Básicos",
    icons: ["smile", "target", "star", "heart", "trophy", "check", "zap", "flame", "sparkles", "gem", "crown", "award"],
  },
  {
    name: "Ejercicio",
    icons: ["dumbbell", "running", "bike", "footprints", "activity", "swimming", "yoga"],
  },
  {
    name: "Salud",
    icons: ["heartPulse", "pill", "bed", "alarmClock", "apple", "droplet", "brain", "meditation", "stethoscope", "pillBottle"],
  },
  {
    name: "Comida",
    icons: ["coffee", "utensils", "apple", "cookie", "iceCream", "pizza", "cake", "candy"],
  },
  {
    name: "Trabajo",
    icons: ["briefcase", "laptop", "code", "lightbulb", "pen", "camera", "palette", "paintbrush"],
  },
  {
    name: "Estudio",
    icons: ["book", "bookOpen", "graduation", "languages", "library", "school"],
  },
  {
    name: "Entretenimiento",
    icons: ["music", "music2", "guitar", "film", "tv", "radio", "headphones", "gamepad"],
  },
  {
    name: "Naturaleza",
    icons: ["leaf", "tree", "flower", "fish", "cloud", "mountain", "sunrise", "sunset"],
  },
  {
    name: "Animales",
    icons: ["dog", "cat", "bird", "rabbit"],
  },
  {
    name: "Transporte",
    icons: ["car", "bike", "plane", "navigation", "compass", "mapPin"],
  },
  {
    name: "Lugares",
    icons: ["home", "building", "building2", "hospital", "store", "school", "library"],
  },
  {
    name: "Tecnología",
    icons: ["smartphone", "tablet", "watch", "clock", "calendar", "timer"],
  },
];

// Obtener todos los iconos disponibles
export const getAllAvailableIcons = () => {
  return iconCategories.flatMap(category => category.icons);
};

