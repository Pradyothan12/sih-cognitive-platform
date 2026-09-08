class GameTelemetry {
  final String logId;
  final String patientId;
  final String gameType;
  final int difficultyLevel;
  final int reactionTimeMs;
  final double accuracyScore;
  final int hesitationCount;
  final double cognitiveFatigueIndex;
  final String playedAt;
  final int syncStatus;

  GameTelemetry({
    required this.logId,
    required this.patientId,
    required this.gameType,
    required this.difficultyLevel,
    required this.reactionTimeMs,
    required this.accuracyScore,
    required this.hesitationCount,
    required this.cognitiveFatigueIndex,
    required this.playedAt,
    this.syncStatus = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'log_id': logId,
      'patient_id': patientId,
      'game_type': gameType,
      'difficulty_level': difficultyLevel,
      'reaction_time_ms': reactionTimeMs,
      'accuracy_score': accuracyScore,
      'hesitation_count': hesitationCount,
      'cognitive_fatigue_index': cognitiveFatigueIndex,
      'played_at': playedAt,
      'sync_status': syncStatus,
    };
  }

  factory GameTelemetry.fromMap(Map<String, dynamic> map) {
    return GameTelemetry(
      logId: map['log_id'],
      patientId: map['patient_id'],
      gameType: map['game_type'],
      difficultyLevel: map['difficulty_level'],
      reactionTimeMs: map['reaction_time_ms'],
      accuracyScore: (map['accuracy_score'] as num).toDouble(),
      hesitationCount: map['hesitation_count'],
      cognitiveFatigueIndex: (map['cognitive_fatigue_index'] as num).toDouble(),
      playedAt: map['played_at'],
      syncStatus: map['sync_status'],
    );
  }
}
