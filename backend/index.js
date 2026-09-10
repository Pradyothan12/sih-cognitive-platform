const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'telemetry.json');
const REMINDERS_FILE = path.join(__dirname, 'reminders.json');

let reminders = [];

if (fs.existsSync(REMINDERS_FILE)) {
    try {
        reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
        console.log(`[REMINDERS] Loaded ${reminders.length} reminders.`);
    } catch (error) {
        console.log('[REMINDERS] Could not read reminders.json. Starting empty.');
        reminders = [];
    }
}

function saveReminders() {
    fs.writeFileSync(
        REMINDERS_FILE,
        JSON.stringify(reminders, null, 2),
        'utf8'
    );
}

let patientLogs = [];

// Load previously saved telemetry
if (fs.existsSync(DATA_FILE)) {
    try {
        patientLogs = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        console.log(`[DATABASE] Loaded ${patientLogs.length} telemetry records.`);
    } catch (error) {
        console.log('[DATABASE] Could not read telemetry.json. Starting with empty data.');
        patientLogs = [];
    }
}

// Save telemetry to disk
function saveTelemetry() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(patientLogs, null, 2),
        'utf8'
    );
}


// Get all reminders for a patient
app.get('/api/reminders/patient/:patientId', (req, res) => {
    const patientId = req.params.patientId;

    const patientReminders = reminders.filter(
        reminder => reminder.patientId === patientId
    );

    res.json({
        success: true,
        patientId,
        reminders: patientReminders
    });
});

// Create a new care reminder
app.post('/api/reminders', (req, res) => {
    const {
        patientId,
        title,
        type,
        date,
        time,
        repeat,
        notes
    } = req.body;

    if (!patientId || !title || !type || !date || !time) {
        return res.status(400).json({
            success: false,
            error: 'patientId, title, type, date and time are required'
        });
    }

    const validTypes = [
        'Medicine',
        'Hydration',
        'Daily Activity',
        'Medical Appointment',
        'Cognitive Activity'
    ];

    if (!validTypes.includes(type)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid reminder type'
        });
    }

    const reminder = {
        id: Date.now().toString(),
        patientId,
        title,
        type,
        date,
        time,
        repeat: repeat || 'Once',
        notes: notes || '',
        completed: false,
        createdAt: new Date().toISOString()
    };

    reminders.push(reminder);
    saveReminders();

    console.log(`[REMINDER] Created ${type} reminder for ${patientId}.`);

    res.status(201).json({
        success: true,
        reminder
    });
});

// Update reminder completion status
app.patch('/api/reminders/:id/complete', (req, res) => {
    const reminder = reminders.find(
        item => item.id === req.params.id
    );

    if (!reminder) {
        return res.status(404).json({
            success: false,
            error: 'Reminder not found'
        });
    }

    reminder.completed = true;
    reminder.completedAt = new Date().toISOString();

    saveReminders();

    res.json({
        success: true,
        reminder
    });
});

// Delete a reminder
app.delete('/api/reminders/:id', (req, res) => {
    const index = reminders.findIndex(
        item => item.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Reminder not found'
        });
    }

    const deleted = reminders.splice(index, 1)[0];
    saveReminders();

    res.json({
        success: true,
        deletedReminder: deleted
    });
});

// Sync telemetry from patient app
app.post('/api/telemetry/sync', (req, res) => {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    patientLogs.push(...logs);
    saveTelemetry();

    console.log(`[CLOUD SYNC] Stored ${logs.length} telemetry records.`);

    const syncedLogIds = logs.map(
        l => l.logId || l.log_id
    );

    res.json({
        success: true,
        syncedCount: logs.length,
        syncedLogIds
    });
});

// Get patient telemetry
app.get('/api/telemetry/patient/:id', (req, res) => {
    const patientId = req.params.id;

    const logs = patientLogs.filter(
        l => l.patientId === patientId || l.patient_id === patientId
    );

    const totalReactionTime = logs.reduce(
        (acc, curr) =>
            acc + (curr.reactionTimeMs || curr.reaction_time_ms || 0),
        0
    );

    const avgReactionTime =
        logs.length > 0
            ? Math.round(totalReactionTime / logs.length)
            : 0;

    res.json({
        patientId,
        totalGamesPlayed: logs.length,
        avgReactionTimeMs: avgReactionTime,
        recentLogs: logs.slice(-10)
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Node.js Express Backend running on port ${PORT}`);
});
