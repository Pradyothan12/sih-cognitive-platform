import React, { useState, useEffect } from 'react';

export default function App() {
  const [telemetry, setTelemetry] = useState({
    patientId: 'patient_001',
    totalGamesPlayed: 14,
    avgReactionTimeMs: 1650,
    recentLogs: [
      { log_id: '1', game_type: 'visual_memory_ner', accuracy_score: 1.0, reaction_time_ms: 1420 },
      { log_id: '2', game_type: 'visual_memory_ner', accuracy_score: 0.5, reaction_time_ms: 2100 },
      { log_id: '3', game_type: 'visual_memory_ner', accuracy_score: 1.0, reaction_time_ms: 1250 },
    ]
  });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <header style={{ borderBottom: '2px solid #008080', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ color: '#008080', margin: 0 }}>🏥 NER Elderly Cognitive Admin Portal</h1>
        <p style={{ color: '#555', margin: '5px 0' }}>Caregiver & Health Worker Dashboard (Assam/NER Region)</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Patient Profile</h3>
          <p><strong>Name:</strong> Smt. Lakhimi Baruah</p>
          <p><strong>Age:</strong> 72 | <strong>Language:</strong> Assamese</p>
          <p><strong>Region:</strong> Guwahati, Assam</p>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Cognitive Performance</h3>
          <h2 style={{ color: '#008080', fontSize: '36px', margin: '10px 0' }}>{telemetry.avgReactionTimeMs} ms</h2>
          <p>Average Reaction Speed</p>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Completed Sessions</h3>
          <h2 style={{ color: '#ff8c00', fontSize: '36px', margin: '10px 0' }}>{telemetry.totalGamesPlayed}</h2>
          <p>Local SQLite Sessions Recorded</p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3>Recent Game Telemetry Logs</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#008080', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Log ID</th>
              <th style={{ padding: '12px' }}>Game Type</th>
              <th style={{ padding: '12px' }}>Accuracy</th>
              <th style={{ padding: '12px' }}>Reaction Speed</th>
            </tr>
          </thead>
          <tbody>
            {telemetry.recentLogs.map((log) => (
              <tr key={log.log_id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{log.log_id}</td>
                <td style={{ padding: '12px' }}>{log.game_type}</td>
                <td style={{ padding: '12px' }}>{(log.accuracy_score * 100).toFixed(0)}%</td>
                <td style={{ padding: '12px' }}>{log.reaction_time_ms} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}