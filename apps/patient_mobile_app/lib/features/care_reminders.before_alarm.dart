import 'package:flutter/material.dart';

import '../services/reminder_service.dart';
import '../services/voice_service.dart';

class CareReminders extends StatefulWidget {
  const CareReminders({super.key});

  @override
  State<CareReminders> createState() => _CareRemindersState();
}

class _CareRemindersState extends State<CareReminders> {
  final ReminderService _service = ReminderService();
  final VoiceService _voiceService = VoiceService();

  List<Map<String, dynamic>> _reminders = [];
  bool _loading = true;
  String? _error;

  static const String patientId = 'patient_001';

  @override
  void initState() {
    super.initState();
    _loadReminders();
  }

  Future<void> _loadReminders() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final reminders = await _service.getReminders(patientId);

      if (!mounted) return;

      setState(() {
        _reminders = reminders;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = 'Unable to load reminders';
      });
    }
  }

  Future<void> _completeReminder(String id) async {
    final success = await _service.completeReminder(id);

    if (success) {
      await _loadReminders();
    }
  }

  Future<void> _speakReminder(Map<String, dynamic> reminder) async {
    final title = reminder['title']?.toString() ?? 'Reminder';
    final type = reminder['type']?.toString() ?? 'Care reminder';
    final time = reminder['time']?.toString() ?? '';
    final notes = reminder['notes']?.toString() ?? '';

    final languageCode = Localizations.localeOf(context).languageCode;

    final message = notes.isEmpty
        ? '$type reminder. $title. Time $time.'
        : '$type reminder. $title. Time $time. $notes';

    await _voiceService.speak(
      text: message,
      languageCode: languageCode,
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'Medicine':
        return Icons.medication_rounded;
      case 'Hydration':
        return Icons.water_drop_rounded;
      case 'Daily Activity':
        return Icons.directions_walk_rounded;
      case 'Medical Appointment':
        return Icons.local_hospital_rounded;
      case 'Cognitive Activity':
        return Icons.psychology_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'Medicine':
        return Colors.red.shade400;
      case 'Hydration':
        return Colors.blue.shade400;
      case 'Daily Activity':
        return Colors.green.shade500;
      case 'Medical Appointment':
        return Colors.purple.shade400;
      case 'Cognitive Activity':
        return Colors.orange.shade500;
      default:
        return Colors.teal.shade500;
    }
  }

  String _formatDate(String? date) {
    if (date == null || date.isEmpty) return '';

    try {
      final value = DateTime.parse(date);
      return '${value.day.toString().padLeft(2, '0')}/'
          '${value.month.toString().padLeft(2, '0')}/'
          '${value.year}';
    } catch (_) {
      return date;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Care Reminders',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF079D92),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loadReminders,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.cloud_off_rounded,
                size: 64,
                color: Colors.grey,
              ),
              const SizedBox(height: 16),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 20),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _loadReminders,
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    if (_reminders.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadReminders,
        child: ListView(
          children: const [
            SizedBox(height: 160),
            Icon(
              Icons.event_available_rounded,
              size: 72,
              color: Color(0xFF079D92),
            ),
            SizedBox(height: 20),
            Center(
              child: Text(
                'No care reminders',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            SizedBox(height: 8),
            Center(
              child: Text(
                'Your care team will add reminders here.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 17),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadReminders,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Today & Upcoming',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ..._reminders.map(_buildReminderCard),
        ],
      ),
    );
  }

  Widget _buildReminderCard(Map<String, dynamic> reminder) {
    final type = reminder['type']?.toString() ?? 'Reminder';
    final title = reminder['title']?.toString() ?? 'Reminder';
    final date = reminder['date']?.toString();
    final time = reminder['time']?.toString() ?? '';
    final repeat = reminder['repeat']?.toString() ?? '';
    final notes = reminder['notes']?.toString() ?? '';
    final completed = reminder['completed'] == true;
    final id = reminder['id']?.toString() ?? '';

    final color = _colorForType(type);

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: color.withValues(alpha: 0.15),
              child: Icon(
                _iconForType(type),
                size: 30,
                color: color,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      decoration: completed ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    type,
                    style: TextStyle(
                      fontSize: 16,
                      color: color,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_formatDate(date)}  •  $time',
                    style: const TextStyle(fontSize: 17),
                  ),
                  if (repeat.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Repeat: $repeat',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ],
                  if (notes.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      notes,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ],
                  if (!completed && id.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        OutlinedButton.icon(
                          onPressed: () => _speakReminder(reminder),
                          icon: const Icon(Icons.volume_up_rounded),
                          label: const Text('Speak'),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => _completeReminder(id),
                          icon: const Icon(Icons.check_circle_outline),
                          label: const Text('Mark Completed'),
                        ),
                      ],
                    ),
                  ],
                  if (completed) ...[
                    const SizedBox(height: 8),
                    const Text(
                      'Completed',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
