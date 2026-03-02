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
        description: "Intense concentration range",
        levels: {
            "gamma-waves-40": 50,
            "library-whisper": 20
        }
    },
    "cozy-rain": {
        name: "Cozy Rain",
        icon: "☔",
        description: "Warm rainy day vibes",
        levels: {
            "heavy-rain": 55,
            "coffee-shop": 30
        }
    },
    "nature-escape": {
        name: "Nature Escape",
        icon: "🌲",
        description: "Immersive mountain forest",
        levels: {
            "forest-birds": 40,
            "soft-wind": 30,
            "campfire-crackle": 25
        }
    },
    "urban-calm": {
        name: "Urban Calm",
        icon: "🏙️",
        description: "Productive city atmosphere",
        levels: {
            "coffee-shop": 45,
            "distant-traffic": 20,
            "rainy-city": 25
        }
    },
    "healing-state": {
        name: "Healing State",
        icon: "✨",
        description: "Recovery and mindfulness",
        levels: {
            "inner-peace-528": 60,
            "relaxing-water": 35
        }
    }
};

export const getRandomPreset = (): PresetConfig => {
    const keys = Object.keys(FOCUS_PRESETS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return FOCUS_PRESETS[randomKey];
};
