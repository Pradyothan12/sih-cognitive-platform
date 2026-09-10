const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

const DATA_FILE = path.join(__dirname, 'telemetry.json');
const REMINDERS_FILE = path.join(__dirname, 'reminders.json');

const usePostgres = !!process.env.DATABASE_URL;

const pool = usePostgres
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    })
    : null;

let reminders = [];
let patientLogs = [];

function loadLocalData() {
    if (fs.existsSync(REMINDERS_FILE)) {
        try {
            reminders = JSON.parse(
                fs.readFileSync(REMINDERS_FILE, 'utf8')
            );
            console.log(`[REMINDERS] Loaded ${reminders.length} local reminders.`);
        } catch (error) {
            console.log('[REMINDERS] Could not read reminders.json.');
            reminders = [];
        }
    }

    if (fs.existsSync(DATA_FILE)) {
        try {
            patientLogs = JSON.parse(
                fs.readFileSync(DATA_FILE, 'utf8')
            );
            console.log(`[DATABASE] Loaded ${patientLogs.length} local telemetry records.`);
        } catch (error) {
            console.log('[DATABASE] Could not read telemetry.json.');
            patientLogs = [];
        }
    }
}

function saveLocalReminders() {
    fs.writeFileSync(
        REMINDERS_FILE,
        JSON.stringify(reminders, null, 2),
        'utf8'
    );
}

function saveLocalTelemetry() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(patientLogs, null, 2),
        'utf8'
    );
}

async function initPostgres() {
    if (!usePostgres) {
        loadLocalData();
        console.log('[DATABASE] Running with local JSON storage.');
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS reminders (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            repeat TEXT NOT NULL,
            notes TEXT DEFAULT '',
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL,
            completed_at TIMESTAMPTZ
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS telemetry (
            id BIGSERIAL PRIMARY KEY,
            log_id TEXT,
            patient_id TEXT,
            data JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);

    const reminderCount = await pool.query(
        'SELECT COUNT(*)::int AS count FROM reminders'
    );

    const telemetryCount = await pool.query(
        'SELECT COUNT(*)::int AS count FROM telemetry'
    );

    console.log(
        `[DATABASE] PostgreSQL connected. Reminders: ${reminderCount.rows[0].count}, Telemetry: ${telemetryCount.rows[0].count}`
    );

    /*
     * One-time migration of existing JSON data.
     * Data is copied only when the corresponding PostgreSQL
     * table is empty.
     */

    if (reminderCount.rows[0].count === 0 && fs.existsSync(REMINDERS_FILE)) {
        try {
            const oldReminders = JSON.parse(
                fs.readFileSync(REMINDERS_FILE, 'utf8')
            );

            for (const reminder of oldReminders) {
                await pool.query(
                    `
                    INSERT INTO reminders
                    (
                        id,
                        patient_id,
                        title,
                        type,
                        date,
                        time,
                        repeat,
                        notes,
                        completed,
                        created_at,
                        completed_at
                    )
                    VALUES
                    (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
                    )
                    ON CONFLICT (id) DO NOTHING
                    `,
                    [
                        reminder.id,
                        reminder.patientId,
                        reminder.title,
                        reminder.type,
                        reminder.date,
                        reminder.time,
                        reminder.repeat || 'Once',
                        reminder.notes || '',
                        reminder.completed === true,
                        reminder.createdAt || new Date().toISOString(),
                        reminder.completedAt || null
                    ]
                );
            }

            console.log(
                `[MIGRATION] Migrated ${oldReminders.length} reminders to PostgreSQL.`
            );
        } catch (error) {
            console.error('[MIGRATION] Reminder migration failed:', error.message);
        }
    }

    if (telemetryCount.rows[0].count === 0 && fs.existsSync(DATA_FILE)) {
        try {
            const oldTelemetry = JSON.parse(
                fs.readFileSync(DATA_FILE, 'utf8')
            );

            for (const log of oldTelemetry) {
                await pool.query(
                    `
                    INSERT INTO telemetry
                    (
                        log_id,
                        patient_id,
                        data
                    )
                    VALUES ($1,$2,$3)
                    `,
                    [
                        log.logId || log.log_id || null,
                        log.patientId || log.patient_id || null,
                        JSON.stringify(log)
                    ]
                );
            }

            console.log(
                `[MIGRATION] Migrated ${oldTelemetry.length} telemetry records to PostgreSQL.`
            );
        } catch (error) {
            console.error('[MIGRATION] Telemetry migration failed:', error.message);
        }
    }
}


// --------------------------------------------------
// REMINDERS
// --------------------------------------------------

app.get('/api/reminders/patient/:patientId', async (req, res) => {
    const patientId = req.params.patientId;

    try {
        if (usePostgres) {
            const result = await pool.query(
                `
                SELECT
                    id,
                    patient_id AS "patientId",
                    title,
                    type,
                    date,
                    time,
                    repeat,
                    notes,
                    completed,
                    created_at AS "createdAt",
                    completed_at AS "completedAt"
                FROM reminders
                WHERE patient_id = $1
                ORDER BY date, time
                `,
                [patientId]
            );

            return res.json({
                success: true,
                patientId,
                reminders: result.rows
            });
        }

        const patientReminders = reminders.filter(
            reminder => reminder.patientId === patientId
        );

        res.json({
            success: true,
            patientId,
            reminders: patientReminders
        });
    } catch (error) {
        console.error('[REMINDER] Get error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load reminders'
        });
    }
});


app.post('/api/reminders', async (req, res) => {
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

    try {
        if (usePostgres) {
            await pool.query(
                `
                INSERT INTO reminders
                (
                    id,
                    patient_id,
                    title,
                    type,
                    date,
                    time,
                    repeat,
                    notes,
                    completed,
                    created_at
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                `,
                [
                    reminder.id,
                    reminder.patientId,
                    reminder.title,
                    reminder.type,
                    reminder.date,
                    reminder.time,
                    reminder.repeat,
                    reminder.notes,
                    false,
                    reminder.createdAt
                ]
            );
        } else {
            reminders.push(reminder);
            saveLocalReminders();
        }

        console.log(
            `[REMINDER] Created ${type} reminder for ${patientId}.`
        );

        res.status(201).json({
            success: true,
            reminder
        });
    } catch (error) {
        console.error('[REMINDER] Create error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create reminder'
        });
    }
});


app.patch('/api/reminders/:id/complete', async (req, res) => {
    const id = req.params.id;

    try {
        if (usePostgres) {
            const result = await pool.query(
                `
                UPDATE reminders
                SET
                    completed = TRUE,
                    completed_at = NOW()
                WHERE id = $1
                RETURNING
                    id,
                    patient_id AS "patientId",
                    title,
                    type,
                    date,
                    time,
                    repeat,
                    notes,
                    completed,
                    created_at AS "createdAt",
                    completed_at AS "completedAt"
                `,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Reminder not found'
                });
            }

            return res.json({
                success: true,
                reminder: result.rows[0]
            });
        }

        const reminder = reminders.find(
            item => item.id === id
        );

        if (!reminder) {
            return res.status(404).json({
                success: false,
                error: 'Reminder not found'
            });
        }

        reminder.completed = true;
        reminder.completedAt = new Date().toISOString();

        saveLocalReminders();

        res.json({
            success: true,
            reminder
        });
    } catch (error) {
        console.error('[REMINDER] Complete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete reminder'
        });
    }
});


app.delete('/api/reminders/:id', async (req, res) => {
    const id = req.params.id;

    try {
        if (usePostgres) {
            const result = await pool.query(
                `
                DELETE FROM reminders
                WHERE id = $1
                RETURNING
                    id,
                    patient_id AS "patientId",
                    title,
                    type,
                    date,
                    time,
                    repeat,
                    notes,
                    completed,
                    created_at AS "createdAt",
                    completed_at AS "completedAt"
                `,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Reminder not found'
                });
            }

            return res.json({
                success: true,
                deletedReminder: result.rows[0]
            });
        }

        const index = reminders.findIndex(
            item => item.id === id
        );

        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Reminder not found'
            });
        }

        const deleted = reminders.splice(index, 1)[0];
        saveLocalReminders();

        res.json({
            success: true,
            deletedReminder: deleted
        });
    } catch (error) {
        console.error('[REMINDER] Delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete reminder'
        });
    }
});


// --------------------------------------------------
// TELEMETRY
// --------------------------------------------------

app.post('/api/telemetry/sync', async (req, res) => {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({
            error: 'Invalid payload'
        });
    }

    try {
        if (usePostgres) {
            for (const log of logs) {
                await pool.query(
                    `
                    INSERT INTO telemetry
                    (
                        log_id,
                        patient_id,
                        data
                    )
                    VALUES ($1,$2,$3)
                    `,
                    [
                        log.logId || log.log_id || null,
                        log.patientId || log.patient_id || null,
                        JSON.stringify(log)
                    ]
                );
            }
        } else {
            patientLogs.push(...logs);
            saveLocalTelemetry();
        }

        console.log(
            `[CLOUD SYNC] Stored ${logs.length} telemetry records.`
        );

        const syncedLogIds = logs.map(
            l => l.logId || l.log_id
        );

        res.json({
            success: true,
            syncedCount: logs.length,
            syncedLogIds
        });
    } catch (error) {
        console.error('[TELEMETRY] Sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync telemetry'
        });
    }
});


app.get('/api/telemetry/patient/:id', async (req, res) => {
    const patientId = req.params.id;

    try {
        let logs;

        if (usePostgres) {
            const result = await pool.query(
                `
                SELECT data
                FROM telemetry
                WHERE patient_id = $1
                ORDER BY created_at ASC
                `,
                [patientId]
            );

            logs = result.rows.map(row => row.data);
        } else {
            logs = patientLogs.filter(
                l =>
                    l.patientId === patientId ||
                    l.patient_id === patientId
            );
        }

        const totalReactionTime = logs.reduce(
            (acc, curr) =>
                acc +
                (curr.reactionTimeMs ||
                    curr.reaction_time_ms ||
                    0),
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
    } catch (error) {
        console.error('[TELEMETRY] Get error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load telemetry'
        });
    }
});


// --------------------------------------------------
// START SERVER
// --------------------------------------------------

async function startServer() {
    try {
        await initPostgres();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(
                `🚀 Node.js Express Backend running on port ${PORT}`
            );

            if (usePostgres) {
                console.log('🗄️ PostgreSQL persistence enabled.');
            } else {
                console.log('📁 Local JSON persistence enabled.');
            }
        });
    } catch (error) {
        console.error(
            '❌ Failed to initialize backend:',
            error
        );
        process.exit(1);
    }
}

startServer();
