import 'dart:convert';

import 'package:http/http.dart' as http;

class ReminderService {
  static const String baseUrl = 'http://192.168.137.152:5001';

  Future<List<Map<String, dynamic>>> getReminders(
    String patientId,
  ) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/reminders/patient/$patientId'),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load reminders');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final reminders = data['reminders'] as List<dynamic>? ?? [];

    return reminders
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }

  Future<bool> completeReminder(String reminderId) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/api/reminders/$reminderId/complete'),
    );

    return response.statusCode == 200;
  }
}
