const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Database Store for Hackathon MVP
let patientLogs = [];

// 1. Receive Offline Sync Payload from Patient Mobile App
app.post('/api/telemetry/sync', (req, res) => {
    const { logs } = req.body;
    if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({ error: 'Invalid payload format' });
    }

    patientLogs.push(...logs);
    console.log(`Synced ${logs.length} offline cognitive records into Cloud Server.`);

    const syncedLogIds = logs.map(l => l.logId || l.log_id);
    res.json({ success: true, syncedCount: logs.length, syncedLogIds });
});

// 2. Stream Analytics Data to Caregiver Web Dashboard
app.get('/api/telemetry/patient/:id', (req, res) => {
    const patientId = req.params.id;
    const logs = patientLogs.filter(l => l.patientId === patientId || l.patient_id === patientId);

    // Calculate aggregated cognitive index
    const totalReactionTime = logs.reduce((acc, curr) => acc + (curr.reactionTimeMs || curr.reaction_time_ms || 0), 0);
    const avgReactionTime = logs.length > 0 ? (totalReactionTime / logs.length).toFixed(0) : 0;

    res.json({
        patientId,
        totalGamesPlayed: logs.length,
        avgReactionTimeMs: Number(avgReactionTime),
        recentLogs: logs.slice(-10)
    });
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`🚀 Caregiver & Sync Server running on http://localhost:${PORT}`);
});