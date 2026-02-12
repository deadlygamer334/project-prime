const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../data.json');
const USER_ID = 'user_sample_001';
const START_DATE = new Date('2025-10-01');
const END_DATE = new Date('2026-01-31');

const HABITS = [
    { id: 'h1', name: 'Morning Jog', frequency: 'daily' },
    { id: 'h2', name: 'Read 30 mins', frequency: 'daily' },
    { id: 'h3', name: 'Code Side Project', frequency: 'weekly' }
];

function randomBool(probability = 0.5) {
    return Math.random() < probability;
}

function generateDates(start, end) {
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

const allDates = generateDates(START_DATE, END_DATE);

const data = {
    users: [
        {
            userId: USER_ID,
            email: 'demo@example.com',
            createdAt: '2025-09-15T10:00:00Z',
            stats: {
                totalFocusMinutes: 0
            }
        }
    ],
    habits: [],
    todoLists: [],
    focusSessions: []
};

// Generate Habits History
HABITS.forEach(habit => {
    const history = {};
    allDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        // 70% chance of completion
        if (randomBool(0.7)) {
            history[dateStr] = true;
        }
    });

    data.habits.push({
        userId: USER_ID,
        habitId: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        history: history, // storing as map for the JSON source, migration script will transform if needed
        createdAt: '2025-09-20T00:00:00Z'
    });
});

// Generate Todo Lists
allDates.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    const tasks = [];
    const numTasks = Math.floor(Math.random() * 5) + 1; // 1 to 5 tasks

    for (let i = 0; i < numTasks; i++) {
        tasks.push({
            title: `Task ${i + 1} for ${dateStr}`,
            completed: randomBool(0.6)
        });
    }

    data.todoLists.push({
        userId: USER_ID,
        date: dateStr,
        tasks: tasks
    });
});

// Generate Focus Sessions
allDates.forEach(date => {
    // 50% chance of having a session
    if (randomBool(0.5)) {
        const dateStr = date.toISOString().split('T')[0];
        const sessionsCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < sessionsCount; i++) {
            const duration = [25, 45, 60][Math.floor(Math.random() * 3)];
            data.users[0].stats.totalFocusMinutes += duration;

            data.focusSessions.push({
                userId: USER_ID,
                startTime: `${dateStr}T${10 + i}:00:00Z`,
                durationMinutes: duration,
                tag: ['Work', 'Study', 'Reading'][Math.floor(Math.random() * 3)],
                notes: 'Focused work session'
            });
        }
    }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
console.log(`Successfully generated sample data in ${OUTPUT_FILE}`);
console.log(`- ${data.users.length} Users`);
console.log(`- ${data.habits.length} Habits`);
console.log(`- ${data.todoLists.length} Todo Lists`);
console.log(`- ${data.focusSessions.length} Focus Sessions`);
