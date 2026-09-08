import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/game_telemetry.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  DatabaseHelper._init();

  static const String _storageKey = 'offline_telemetry_logs';

  Future<void> insertTelemetry(GameTelemetry telemetry) async {
    final prefs = await SharedPreferences.getInstance();
    List<String> rawLogs = prefs.getStringList(_storageKey) ?? [];
    rawLogs.add(jsonEncode(telemetry.toMap()));
    await prefs.setStringList(_storageKey, rawLogs);
  }

  Future<List<GameTelemetry>> getUnsyncedTelemetry() async {
    final prefs = await SharedPreferences.getInstance();
    List<String> rawLogs = prefs.getStringList(_storageKey) ?? [];

    return rawLogs
        .map((str) => GameTelemetry.fromMap(jsonDecode(str)))
        .where((log) => log.syncStatus == 0)
        .toList();
  }

  Future<void> markTelemetryAsSynced(List<String> logIds) async {
    final prefs = await SharedPreferences.getInstance();
    List<String> rawLogs = prefs.getStringList(_storageKey) ?? [];

    List<String> updatedLogs = rawLogs.map((str) {
      Map<String, dynamic> map = jsonDecode(str);
      if (logIds.contains(map['log_id'])) {
        map['sync_status'] = 1;
      }
      return jsonEncode(map);
    }).toList();

    await prefs.setStringList(_storageKey, updatedLogs);
  }
}
