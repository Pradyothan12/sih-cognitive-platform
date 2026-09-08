import 'package:alarm/alarm.dart';

class AlarmService {
  static Future<void> scheduleReminder({
    required String reminderId,
    required DateTime dateTime,
    required String title,
    required String body,
  }) async {
    final settings = AlarmSettings(
      id: _alarmId(reminderId),
      dateTime: dateTime,
      assetAudioPath: null,
      loopAudio: true,
      vibrate: true,
      androidFullScreenIntent: true,
      androidStopAlarmOnTermination: false,
      volumeSettings: VolumeSettings.fade(
        volume: 1.0,
        fadeDuration: const Duration(seconds: 1),
        volumeEnforced: true,
      ),
      notificationSettings: NotificationSettings(
        title: title,
        body: body,
        stopButton: 'Stop Alarm',
      ),
    );

    await Alarm.set(alarmSettings: settings);
  }

  static Future<void> cancelReminder(String reminderId) async {
    await Alarm.stop(_alarmId(reminderId));
  }

  static int _alarmId(String reminderId) {
    final hash = reminderId.hashCode & 0x7fffffff;

    if (hash == 0 || hash == 1) {
      return 42;
    }

    return hash;
  }
}
