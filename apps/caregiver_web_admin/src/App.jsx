import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5001';
const PATIENT_ID = 'patient_001';

const reminderTypes = [
  'Medicine',
  'Hydration',
  'Daily Activity',
  'Medical Appointment',
  'Cognitive Activity',
];

function App() {
  const [telemetry, setTelemetry] = useState({
    patientId: PATIENT_ID,
    totalGamesPlayed: 0,
    avgReactionTimeMs: 0,
    recentLogs: [],
  });

  const [reminders, setReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [savingReminder, setSavingReminder] = useState(false);
  const [message, setMessage] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Medicine');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newRepeat, setNewRepeat] = useState('Once');
  const [newNotes, setNewNotes] = useState('');

  const fetchTelemetry = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/telemetry/patient/${PATIENT_ID}`
      );

      if (response.ok) {
        const data = await response.json();
        setTelemetry(data);
      }
    } catch (error) {
      console.log('Telemetry backend unavailable.');
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/reminders/patient/${PATIENT_ID}`
      );

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.log('Reminder backend unavailable.');
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchReminders();

    const interval = setInterval(() => {
      fetchTelemetry();
      fetchReminders();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setNewTitle('');
    setNewType('Medicine');
    setNewDate('');
    setNewTime('');
    setNewRepeat('Once');
    setNewNotes('');
  };

  const handleAddReminder = async (event) => {
    event.preventDefault();

    if (!newTitle || !newDate || !newTime) {
      setMessage('Please enter the reminder name, date and time.');
      return;
    }

    setSavingReminder(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: PATIENT_ID,
          title: newTitle,
          type: newType,
          date: newDate,
          time: newTime,
          repeat: newRepeat,
          notes: newNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Unable to create reminder.');
        return;
      }

      setMessage('Reminder added successfully.');
      resetForm();
      await fetchReminders();
    } catch (error) {
      setMessage('Backend connection failed.');
    } finally {
      setSavingReminder(false);
    }
  };

  const completeReminder = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/reminders/${id}/complete`,
        {
          method: 'PATCH',
        }
      );

      if (response.ok) {
        await fetchReminders();
        setMessage('Reminder marked as completed.');
      }
    } catch (error) {
      setMessage('Unable to update reminder.');
    }
  };

  const deleteReminder = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this reminder?'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchReminders();
        setMessage('Reminder deleted.');
      }
    } catch (error) {
      setMessage('Unable to delete reminder.');
    }
  };

  const getCognitiveStatus = () => {
    const logs = telemetry.recentLogs || [];

    if (logs.length === 0) {
      return {
        label: 'No Data',
        detail: 'Play a cognitive session to begin monitoring.',
      };
    }

    const recent = logs.slice(-3);

    const accuracyValues = recent.map((log) =>
      Number(log.accuracyScore ?? log.accuracy_score ?? 0)
    );

    const reactionValues = recent.map((log) =>
      Number(log.reactionTimeMs ?? log.reaction_time_ms ?? 0)
    );

    const averageAccuracy =
      accuracyValues.reduce((sum, value) => sum + value, 0) /
      accuracyValues.length;

    const averageReaction =
      reactionValues.reduce((sum, value) => sum + value, 0) /
      reactionValues.length;

    if (averageAccuracy >= 0.8 && averageReaction <= 5000) {
      return {
        label: 'Stable',
        detail: 'Recent cognitive activity is performing consistently.',
      };
    }

    return {
      label: 'Monitor',
      detail: 'Recent performance shows changes worth reviewing.',
    };
  };

  const getReminderIcon = (type) => {
    switch (type) {
      case 'Medicine':
        return '💊';
      case 'Hydration':
        return '💧';
      case 'Daily Activity':
        return '🏃';
      case 'Medical Appointment':
        return '🏥';
      case 'Cognitive Activity':
        return '🧠';
      default:
        return '🔔';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';

    const value = new Date(`${date}T00:00:00`);

    return value.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        background: '#f4f7f6',
        minHeight: '100vh',
        padding: '30px',
        color: '#222',
      }}
    >
      <header
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '22px 25px',
          marginBottom: '25px',
          borderLeft: '6px solid #008080',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            color: '#008080',
            margin: 0,
            fontSize: '30px',
          }}
        >
          🏥 NER Elderly Care — Health Worker Portal
        </h1>

        <p
          style={{
            color: '#555',
            margin: '8px 0 0',
            fontSize: '16px',
          }}
        >
          Patient monitoring, cognitive performance and care management
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '20px',
          marginBottom: '25px',
        }}
      >
        <div style={cardStyle}>
          <h3>👤 Patient Profile</h3>
          <p>
            <strong>Name:</strong> Smt. Lakhimi Baruah
          </p>
          <p>
            <strong>Age:</strong> 72
          </p>
          <p>
            <strong>Language:</strong> Assamese
          </p>
          <p>
            <strong>Region:</strong> Guwahati, Assam
          </p>
          <p>
            <strong>Patient ID:</strong> {PATIENT_ID}
          </p>
        </div>

        <div style={cardStyle}>
          <h3>🧠 Cognitive Performance</h3>
          <div style={metricStyle}>
            {telemetry.avgReactionTimeMs} ms
          </div>
          <p>Average Reaction Time</p>
        </div>

        <div style={cardStyle}>
          <h3>📊 Completed Sessions</h3>
          <div
            style={{
              ...metricStyle,
              color: '#ff8c00',
            }}
          >
            {telemetry.totalGamesPlayed}
          </div>
          <p>Synced Cognitive Sessions</p>
        </div>
      </section>

      <section style={{ ...cardStyle, marginBottom: '25px' }}>
        <h2 style={{ color: '#008080', marginTop: 0 }}>
          🧠 Cognitive Activity Status
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#008080',
            }}
          >
            {getCognitiveStatus().label}
          </div>

          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              Based on recent cognitive sessions
            </p>
            <p style={{ margin: '6px 0 0', color: '#666' }}>
              {getCognitiveStatus().detail}
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div
          style={{
            background: '#e7f6f3',
            color: '#00695c',
            padding: '13px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: 'bold',
          }}
        >
          {message}
        </div>
      )}

      <section style={{ ...cardStyle, marginBottom: '25px' }}>
        <h2 style={{ color: '#008080', marginTop: 0 }}>
          📊 Reaction Time Trend
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            height: '180px',
            padding: '15px 5px 5px',
            borderBottom: '1px solid #ddd',
          }}
        >
          {(telemetry.recentLogs || []).slice(-5).map((log, index) => {
            const reaction = Number(
              log.reactionTimeMs ?? log.reaction_time_ms ?? 0
            );

            const maxReaction = Math.max(
              1,
              ...(telemetry.recentLogs || []).slice(-5).map((item) =>
                Number(item.reactionTimeMs ?? item.reaction_time_ms ?? 0)
              )
            );

            const height = Math.max(15, (reaction / maxReaction) * 130);

            return (
              <div
                key={log.logId || log.log_id || index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}
                >
                  {reaction} ms
                </span>

                <div
                  style={{
                    width: '55%',
                    height: `${height}px`,
                    background: '#008080',
                    borderRadius: '6px 6px 0 0',
                    minHeight: '15px',
                  }}
                />

                <span
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '6px',
                  }}
                >
                  Session {index + 1}
                </span>
              </div>
            );
          })}
        </div>

        {(telemetry.recentLogs || []).length === 0 && (
          <p style={{ color: '#777', textAlign: 'center' }}>
            No cognitive sessions available yet.
          </p>
        )}

        <p style={{ color: '#666', marginBottom: 0 }}>
          Recent reaction times from cognitive game sessions.
        </p>
      </section>

      <section style={{ ...cardStyle, marginBottom: '25px' }}>
        <h2 style={{ color: '#008080', marginTop: 0 }}>
          🚨 Caregiver Alert & Recommendation
        </h2>

        {(() => {
          const logs = telemetry.recentLogs || [];

          if (logs.length === 0) {
            return (
              <div>
                <strong>No cognitive data available.</strong>
                <p style={{ color: '#666', marginBottom: 0 }}>
                  Encourage the patient to complete a cognitive activity.
                </p>
              </div>
            );
          }

          const recent = logs.slice(-3);

          const accuracyValues = recent.map((log) =>
            Number(log.accuracyScore ?? log.accuracy_score ?? 0)
          );

          const reactionValues = recent.map((log) =>
            Number(log.reactionTimeMs ?? log.reaction_time_ms ?? 0)
          );

          const fatigueValues = recent.map((log) =>
            Number(
              log.cognitiveFatigueIndex ??
                log.cognitive_fatigue_index ??
                0
            )
          );

          const averageAccuracy =
            accuracyValues.reduce((sum, value) => sum + value, 0) /
            accuracyValues.length;

          const averageReaction =
            reactionValues.reduce((sum, value) => sum + value, 0) /
            reactionValues.length;

          const latestFatigue =
            fatigueValues[fatigueValues.length - 1];

          const needsReview =
            averageAccuracy < 0.8 ||
            averageReaction > 8000 ||
            latestFatigue >= 0.4;

          if (needsReview) {
            return (
              <div>
                <strong style={{ color: '#b00020', fontSize: '20px' }}>
                  Review Recommended
                </strong>

                <p style={{ color: '#555' }}>
                  Recent cognitive activity shows a change in one or more
                  monitored indicators.
                </p>

                <ul style={{ color: '#555', paddingLeft: '20px' }}>
                  <li>
                    Average accuracy: {(averageAccuracy * 100).toFixed(0)}%
                  </li>
                  <li>
                    Average reaction time: {averageReaction.toFixed(0)} ms
                  </li>
                  <li>
                    Latest fatigue index: {latestFatigue.toFixed(2)}
                  </li>
                </ul>

                <p style={{ color: '#777', marginBottom: 0 }}>
                  Consider reviewing recent sessions and patient activity.
                </p>
              </div>
            );
          }

          return (
            <div>
              <strong style={{ color: '#008080', fontSize: '20px' }}>
                ✓ No Immediate Concern
              </strong>

              <p style={{ color: '#555', marginBottom: 0 }}>
                Recent cognitive activity is within the project's monitoring
                thresholds. Continue routine cognitive activities and
                observation.
              </p>
            </div>
          );
        })()}
      </section>

      <section style={{ ...cardStyle, marginBottom: '25px' }}>
        <h2 style={{ color: '#008080', marginTop: 0 }}>
          📋 Latest Cognitive Session
        </h2>

        {(() => {
          const logs = telemetry.recentLogs || [];
          const latest = logs.length > 0 ? logs[logs.length - 1] : null;

          if (!latest) {
            return (
              <p style={{ color: '#777' }}>
                No cognitive session recorded yet.
              </p>
            );
          }

          const accuracy = Number(
            latest.accuracyScore ?? latest.accuracy_score ?? 0
          );

          const reaction = Number(
            latest.reactionTimeMs ?? latest.reaction_time_ms ?? 0
          );

          const fatigue = Number(
            latest.cognitiveFatigueIndex ??
              latest.cognitive_fatigue_index ??
              0
          );

          const difficulty = Number(
            latest.difficultyLevel ??
              latest.difficulty_level ??
              1
          );

          const metricBox = {
            background: '#f4f7f6',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center',
          };

          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              <div style={metricBox}>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                  {(accuracy * 100).toFixed(0)}%
                </div>
                <div style={{ color: '#666', marginTop: '5px' }}>
                  Accuracy
                </div>
              </div>

              <div style={metricBox}>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                  {reaction} ms
                </div>
                <div style={{ color: '#666', marginTop: '5px' }}>
                  Reaction Time
                </div>
              </div>

              <div style={metricBox}>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                  {fatigue.toFixed(2)}
                </div>
                <div style={{ color: '#666', marginTop: '5px' }}>
                  Fatigue Index
                </div>
              </div>

              <div style={metricBox}>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                  Level {difficulty}
                </div>
                <div style={{ color: '#666', marginTop: '5px' }}>
                  Difficulty
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      <section style={{ ...cardStyle, marginBottom: '25px' }}>
        <h2 style={{ color: '#008080', marginTop: 0 }}>
          🧠 Cognitive Fatigue Monitoring
        </h2>

        {(() => {
          const logs = telemetry.recentLogs || [];

          const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

          const fatigue = latestLog
            ? Number(
                latestLog.cognitiveFatigueIndex ??
                  latestLog.cognitive_fatigue_index ??
                  0
              )
            : 0;

          const percentage = Math.max(
            0,
            Math.min(100, fatigue * 100)
          );

          let level = 'Low';
          if (fatigue >= 0.4) {
            level = 'High';
          } else if (fatigue >= 0.2) {
            level = 'Moderate';
          }

          return (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <strong>Current Level</strong>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#008080',
                  }}
                >
                  {level}
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '18px',
                  background: '#e0e0e0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: '#008080',
                    borderRadius: '10px',
                  }}
                />
              </div>

              <p style={{ marginBottom: 0, color: '#666' }}>
                Latest fatigue index: {fatigue.toFixed(2)}
              </p>

              <p style={{ marginBottom: 0, color: '#777', fontSize: '13px' }}>
                Monitoring indicator based on recent cognitive game activity.
              </p>
            </div>
          );
        })()}
      </section>

      <section style={{ ...cardStyle, marginBottom: '25px' }}>
        <h2 style={{ color: '#008080', marginTop: 0 }}>
          🎯 Accuracy Trend
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            height: '180px',
            padding: '15px 5px 5px',
            borderBottom: '1px solid #ddd',
          }}
        >
          {(telemetry.recentLogs || []).slice(-5).map((log, index) => {
            const accuracy = Number(
              log.accuracyScore ?? log.accuracy_score ?? 0
            );

            const percentage = Math.max(
              0,
              Math.min(100, accuracy * 100)
            );

            const height = Math.max(15, percentage * 1.3);

            return (
              <div
                key={log.logId || log.log_id || index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}
                >
                  {percentage.toFixed(0)}%
                </span>

                <div
                  style={{
                    width: '55%',
                    height: `${height}px`,
                    background: '#008080',
                    borderRadius: '6px 6px 0 0',
                    minHeight: '15px',
                  }}
                />

                <span
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '6px',
                  }}
                >
                  Session {index + 1}
                </span>
              </div>
            );
          })}
        </div>

        {(telemetry.recentLogs || []).length === 0 && (
          <p style={{ color: '#777', textAlign: 'center' }}>
            No cognitive sessions available yet.
          </p>
        )}

        <p style={{ color: '#666', marginBottom: 0 }}>
          Accuracy recorded during recent cognitive game sessions.
        </p>
      </section>

      <section style={{ ...cardStyle, marginBottom: '25px' }}>
        <h2 style={{ color: '#008080', marginTop: 0 }}>
          📊 Reaction Time Trend
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            height: '180px',
            padding: '15px 5px 5px',
            borderBottom: '1px solid #ddd',
          }}
        >
          {(telemetry.recentLogs || []).slice(-5).map((log, index) => {
            const reaction = Number(
              log.reactionTimeMs ?? log.reaction_time_ms ?? 0
            );

            const maxReaction = Math.max(
              1,
              ...(telemetry.recentLogs || []).slice(-5).map((item) =>
                Number(item.reactionTimeMs ?? item.reaction_time_ms ?? 0)
              )
            );

            const height = Math.max(15, (reaction / maxReaction) * 130);

            return (
              <div
                key={log.logId || log.log_id || index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}
                >
                  {reaction} ms
                </span>

                <div
                  style={{
                    width: '55%',
                    height: `${height}px`,
                    background: '#008080',
                    borderRadius: '6px 6px 0 0',
                    minHeight: '15px',
                  }}
                />

                <span
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '6px',
                  }}
                >
                  Session {index + 1}
                </span>
              </div>
            );
          })}
        </div>

        {(telemetry.recentLogs || []).length === 0 && (
          <p style={{ color: '#777', textAlign: 'center' }}>
            No cognitive sessions available yet.
          </p>
        )}

        <p style={{ color: '#666', marginBottom: 0 }}>
          Recent reaction times from cognitive game sessions.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 1fr)',
          gap: '25px',
          alignItems: 'start',
        }}
      >
        <div style={cardStyle}>
          <h2 style={{ color: '#008080', marginTop: 0 }}>
            📈 Recent Cognitive Telemetry
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#008080',
                    color: '#ffffff',
                    textAlign: 'left',
                  }}
                >
                  <th style={tableHeaderStyle}>Log ID</th>
                  <th style={tableHeaderStyle}>Game</th>
                  <th style={tableHeaderStyle}>Accuracy</th>
                  <th style={tableHeaderStyle}>Reaction</th>
                </tr>
              </thead>

              <tbody>
                {telemetry.recentLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        padding: '25px',
                        textAlign: 'center',
                        color: '#777',
                      }}
                    >
                      No cognitive sessions recorded yet.
                    </td>
                  </tr>
                ) : (
                  telemetry.recentLogs.map((log) => {
                    const logId = log.logId || log.log_id || '';
                    const gameType =
                      log.gameType || log.game_type || '-';
                    const accuracy =
                      log.accuracyScore ??
                      log.accuracy_score ??
                      0;
                    const reaction =
                      log.reactionTimeMs ??
                      log.reaction_time_ms ??
                      0;

                    return (
                      <tr
                        key={logId}
                        style={{
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        <td style={tableCellStyle}>
                          {logId.substring(0, 8)}...
                        </td>
                        <td style={tableCellStyle}>{gameType}</td>
                        <td style={tableCellStyle}>
                          {(accuracy * 100).toFixed(0)}%
                        </td>
                        <td style={tableCellStyle}>{reaction} ms</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ color: '#008080', marginTop: 0 }}>
            🔔 Care Management
          </h2>

          <form onSubmit={handleAddReminder}>
            <label style={labelStyle}>Reminder / Task</label>
            <input
              type="text"
              placeholder="Example: Morning Medicine"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Reminder Type</label>
            <select
              value={newType}
              onChange={(event) => setNewType(event.target.value)}
              style={inputStyle}
            >
              {reminderTypes.map((type) => (
                <option key={type} value={type}>
                  {getReminderIcon(type)} {type}
                </option>
              ))}
            </select>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(event) => setNewTime(event.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <label style={labelStyle}>Repeat</label>
            <select
              value={newRepeat}
              onChange={(event) => setNewRepeat(event.target.value)}
              style={inputStyle}
            >
              <option value="Once">Once</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
            </select>

            <label style={labelStyle}>Notes</label>
            <textarea
              placeholder="Optional instructions"
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
              rows="3"
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
            />

            <button
              type="submit"
              disabled={savingReminder}
              style={{
                width: '100%',
                padding: '13px',
                background: savingReminder ? '#999' : '#008080',
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                cursor: savingReminder ? 'default' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              {savingReminder ? 'Adding...' : '+ Add Care Reminder'}
            </button>
          </form>
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: '25px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h2 style={{ color: '#008080', margin: 0 }}>
            📅 Patient Care Schedule
          </h2>

          <button
            onClick={fetchReminders}
            style={{
              padding: '9px 15px',
              border: '1px solid #008080',
              borderRadius: '6px',
              background: '#ffffff',
              color: '#008080',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {loadingReminders ? (
          <p>Loading care reminders...</p>
        ) : reminders.length === 0 ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              background: '#f8f8f8',
              borderRadius: '8px',
              color: '#777',
            }}
          >
            No care reminders have been scheduled for this patient.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '15px',
            }}
          >
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                style={{
                  border: '1px solid #ddd',
                  borderLeft: '5px solid #008080',
                  borderRadius: '8px',
                  padding: '16px',
                  background: reminder.completed
                    ? '#f0f0f0'
                    : '#ffffff',
                  opacity: reminder.completed ? 0.75 : 1,
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    marginBottom: '8px',
                  }}
                >
                  {getReminderIcon(reminder.type)}
                </div>

                <h3
                  style={{
                    margin: '0 0 6px',
                    textDecoration: reminder.completed
                      ? 'line-through'
                      : 'none',
                  }}
                >
                  {reminder.title}
                </h3>

                <p style={{ margin: '5px 0', color: '#008080' }}>
                  <strong>{reminder.type}</strong>
                </p>

                <p style={{ margin: '5px 0' }}>
                  📅 {formatDate(reminder.date)}
                </p>

                <p style={{ margin: '5px 0' }}>
                  ⏰ {reminder.time}
                </p>

                <p style={{ margin: '5px 0' }}>
                  🔁 {reminder.repeat}
                </p>

                {reminder.notes && (
                  <p
                    style={{
                      margin: '8px 0',
                      color: '#555',
                    }}
                  >
                    📝 {reminder.notes}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                  }}
                >
                  {!reminder.completed && (
                    <button
                      onClick={() =>
                        completeReminder(reminder.id)
                      }
                      style={actionButtonStyle('#008080')}
                    >
                      ✓ Complete
                    </button>
                  )}

                  <button
                    onClick={() =>
                      deleteReminder(reminder.id)
                    }
                    style={actionButtonStyle('#c62828')}
                  >
                    🗑 Delete
                  </button>
                </div>

                {reminder.completed && (
                  <p
                    style={{
                      color: '#2e7d32',
                      fontWeight: 'bold',
                      marginBottom: 0,
                    }}
                  >
                    ✓ Completed
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const cardStyle = {
  background: '#ffffff',
  padding: '22px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const metricStyle = {
  color: '#008080',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '12px 0',
};

const tableHeaderStyle = {
  padding: '12px',
};

const tableCellStyle = {
  padding: '12px',
};

const labelStyle = {
  display: 'block',
  fontWeight: 'bold',
  margin: '10px 0 5px',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '15px',
  marginBottom: '8px',
};

const actionButtonStyle = (background) => ({
  padding: '8px 12px',
  background,
  color: '#ffffff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
});

export default App;
