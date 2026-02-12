export interface PresetConfig {
    name: string;
    icon: string;
    description: string;
    levels: Record<string, number>; // soundId -> volume (0-100)
}

export const FOCUS_PRESETS: Record<string, PresetConfig> = {
    "deep-focus": {
        name: "Deep Focus",
        icon: "🎯",
        description: "Minimal distraction for intense concentration",
        levels: {
            "brown-noise": 50,
            "library": 20
        }
    },
    "cozy-rain": {
        name: "Cozy Rain",
        icon: "☔",
        description: "Warm and comforting rainy day vibes",
        levels: {
            "heavy-rain": 60,
            "coffee-shop": 30
        }
    },
    "nature-escape": {
        name: "Nature Escape",
        icon: "🌲",
        description: "Immersive forest environment",
        levels: {
            "forest-birds": 45,
            "soft-wind": 35,
            "heavy-rain": 25
        }
    },
    "urban-calm": {
        name: "Urban Calm",
        icon: "🏙️",
        description: "Productive city atmosphere",
        levels: {
            "coffee-shop": 50,
            "distant-traffic": 20,
            "pink-noise": 15
        }
    },
    "white-noise-max": {
        name: "Pure Focus",
        icon: "⚪",
        description: "Classic white noise isolation",
        levels: {
            "white-noise": 70
        }
    }
};

export const getRandomPreset = (): PresetConfig => {
    const keys = Object.keys(FOCUS_PRESETS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return FOCUS_PRESETS[randomKey];
};
