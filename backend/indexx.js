const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let patientLogs = [];

app.post('/api/telemetry/sync', (req, res) => {
    const { logs } = req.body;
    if (!logs || !Array.isArray(logs)) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    patientLogs.push(...logs);
    console.log(`[CLOUD SYNC] Stored ${logs.length} telemetry records.`);

    const syncedLogIds = logs.map(l => l.logId || l.log_id);
    res.json({ success: true, syncedCount: logs.length, syncedLogIds });
});

app.get('/api/telemetry/patient/:id', (req, res) => {
    const patientId = req.params.id;
    const logs = patientLogs.filter(l => l.patientId === patientId || l.patient_id === patientId);

    const totalReactionTime = logs.reduce((acc, curr) => acc + (curr.reactionTimeMs || curr.reaction_time_ms || 0), 0);
    const avgReactionTime = logs.length > 0 ? Math.round(totalReactionTime / logs.length) : 0;

    res.json({
        patientId,
        totalGamesPlayed: logs.length,
        avgReactionTimeMs: avgReactionTime,
        recentLogs: logs.slice(-10)
    });
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`🚀 Node.js Express Backend running at http://localhost:${PORT}`);
});