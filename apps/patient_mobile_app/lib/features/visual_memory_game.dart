import 'dart:convert';

import 'package:flutter/material.dart';

import '../localization.dart';
import '../services/voice_service.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';

import '../database/database_helper.dart';
import '../models/game_telemetry.dart';

class VisualMemoryGame extends StatefulWidget {
  const VisualMemoryGame({super.key});

  @override
  State<VisualMemoryGame> createState() => _VisualMemoryGameState();
}

class _VisualMemoryGameState extends State<VisualMemoryGame> {
  final VoiceService _voiceService = VoiceService();
  final List<Map<String, String>> nerAssets = [
    {
      'name': 'Hornbill',
      'asset': 'lib/assets/cultural/hornbill.png',
    },
    {
      'name': 'One-horned Rhino',
      'asset': 'lib/assets/cultural/rhino.png',
    },
    {
      'name': 'Tea Garden',
      'asset': 'lib/assets/cultural/tea_leaf.png',
    },
    {
      'name': 'Dhol (Bihu)',
      'asset': 'lib/assets/cultural/dhol.png',
    },
  ];

  late Map<String, String> targetItem;
  late Stopwatch stopwatch;

  int hesitationCount = 0;
  int pendingLogsCount = 0;
  int currentLevel = 1;
  bool isGameActive = false;
  bool isSyncing = false;

  @override
  void initState() {
    super.initState();
    _refreshPendingLogs();
    _startNewRound();
  }

  Future<void> _refreshPendingLogs() async {
    final logs = await DatabaseHelper.instance.getUnsyncedTelemetry();

    if (!mounted) return;

    setState(() {
      pendingLogsCount = logs.length;
    });
  }

  void _startNewRound() {
    nerAssets.shuffle();

    targetItem = nerAssets.first;
    stopwatch = Stopwatch()..start();

    hesitationCount = 0;
    isGameActive = true;

    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _handleChoice(Map<String, String> selectedItem) async {
    if (!isGameActive) return;

    if (selectedItem['name'] != targetItem['name']) {
      setState(() {
        hesitationCount++;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Try again',
            style: TextStyle(fontSize: 20),
          ),
          duration: Duration(milliseconds: 700),
        ),
      );

      return;
    }

    stopwatch.stop();
    isGameActive = false;

    final reactionTime = stopwatch.elapsedMilliseconds;
    final accuracy = hesitationCount == 0 ? 1.0 : 0.5;

    if (reactionTime < 1800 && hesitationCount == 0) {
      currentLevel = currentLevel < 5 ? currentLevel + 1 : 5;
    } else if (reactionTime > 4000 || hesitationCount > 2) {
      currentLevel = currentLevel > 1 ? currentLevel - 1 : 1;
    }

    final fatigueIndex =
        (reactionTime > 3000 ? 0.3 : 0.05) + (hesitationCount * 0.1);

    final log = GameTelemetry(
      logId: const Uuid().v4(),
      patientId: 'patient_001',
      gameType: 'visual_memory_ner',
      difficultyLevel: currentLevel,
      reactionTimeMs: reactionTime,
      accuracyScore: accuracy,
      hesitationCount: hesitationCount,
      cognitiveFatigueIndex: fatigueIndex,
      playedAt: DateTime.now().toIso8601String(),
    );

    await DatabaseHelper.instance.insertTelemetry(log);
    await _refreshPendingLogs();

    if (!mounted) return;

    _showSuccessDialog();
  }

  Future<void> _syncLocalLogsToServer() async {
    if (isSyncing) return;

    setState(() {
      isSyncing = true;
    });

    final unsyncedLogs = await DatabaseHelper.instance.getUnsyncedTelemetry();

    if (unsyncedLogs.isEmpty) {
      if (!mounted) return;

      setState(() {
        isSyncing = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'All local logs are synced!',
            style: TextStyle(fontSize: 18),
          ),
        ),
      );

      return;
    }

    final payload = {
      'logs': unsyncedLogs.map((log) => log.toMap()).toList(),
    };

    try {
      final response = await http.post(
        Uri.parse('http://192.168.29.87:5001/api/telemetry/sync'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        final logIds = unsyncedLogs.map((log) => log.logId).toList();

        await DatabaseHelper.instance.markTelemetryAsSynced(logIds);
        await _refreshPendingLogs();

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Synced ${unsyncedLogs.length} logs successfully!',
              style: const TextStyle(fontSize: 18),
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Sync failed. Logs remain safely stored.',
              style: TextStyle(fontSize: 18),
            ),
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Backend unavailable. Logs remain stored locally.',
            style: TextStyle(fontSize: 18),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          isSyncing = false;
        });
      }
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: const Text(
            'Correct!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.bold,
              color: Color(0xFF079D92),
            ),
          ),
          content: const Text(
            'Well done!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 24,
              color: Colors.black87,
            ),
          ),
          actionsAlignment: MainAxisAlignment.center,
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                _startNewRound();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF079D92),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 35,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'Next',
                style: TextStyle(fontSize: 20),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildAnswerCard(Map<String, String> item) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: isGameActive ? () => _handleChoice(item) : null,
        borderRadius: BorderRadius.circular(28),
        child: Ink(
          decoration: BoxDecoration(
            color: const Color(0xFFB2DEDE),
            borderRadius: BorderRadius.circular(28),
            boxShadow: const [
              BoxShadow(
                color: Color(0x22000000),
                blurRadius: 5,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 10,
              vertical: 12,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset(
                  item['asset']!,
                  width: 70,
                  height: 70,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 12),
                Text(
                  _localizedItemName(
                    item['name']!,
                    Localizations.localeOf(context).languageCode,
                  ),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111111),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _localizedItemName(
    String name,
    String languageCode,
  ) {
    switch (name) {
      case 'Hornbill':
        return AppStrings.get('hornbill', languageCode);
      case 'One-horned Rhino':
        return AppStrings.get('rhino', languageCode);
      case 'Tea Garden':
        return AppStrings.get('teaGarden', languageCode);
      case 'Dhol (Bihu)':
        return AppStrings.get('dhol', languageCode);
      default:
        return name;
    }
  }

  Future<void> _speakGameInstruction() async {
    final languageCode = Localizations.localeOf(context).languageCode;

    final instruction = AppStrings.get(
      'gamePrompt',
      languageCode,
    );

    await _voiceService.speak(
      text: instruction,
      languageCode: languageCode,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFF079D92),
        elevation: 0,
        toolbarHeight: 82,
        title: const Text(
          'NER Elderly Cognitive Game',
          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.w500,
          ),
        ),
        actions: [
          IconButton(
            onPressed: isSyncing ? null : _syncLocalLogsToServer,
            icon: const Icon(
              Icons.cloud_upload,
              size: 32,
              color: Colors.black54,
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(28, 28, 28, 35),
          child: Column(
            children: [
              // Offline logs
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 20,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF0DB),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Offline Logs: $pendingLogsCount unsynced',
                        style: const TextStyle(
                          color: Color(0xFFE95435),
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: isSyncing ? null : _syncLocalLogsToServer,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF4B27),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 15,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: Text(
                        isSyncing ? 'Syncing...' : 'Sync Now',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 38),

              Row(
                children: [
                  Expanded(
                    child: Text(
                      AppStrings.get(
                        'gamePrompt',
                        Localizations.localeOf(context).languageCode,
                      ),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 29,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF171717),
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: AppStrings.get(
                      'gameSpeak',
                      Localizations.localeOf(context).languageCode,
                    ),
                    onPressed: _speakGameInstruction,
                    icon: const Icon(
                      Icons.volume_up_rounded,
                      size: 32,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 25),

              // Target card
              Container(
                width: double.infinity,
                constraints: const BoxConstraints(
                  minHeight: 135,
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 18,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFE6F5F5),
                  border: Border.all(
                    color: const Color(0xFF079D92),
                    width: 4,
                  ),
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      targetItem['asset']!,
                      width: 85,
                      height: 85,
                      fit: BoxFit.contain,
                    ),
                    const SizedBox(width: 18),
                    Flexible(
                      child: Text(
                        _localizedItemName(
                          targetItem['name']!,
                          Localizations.localeOf(context).languageCode,
                        ),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF079D92),
                          fontSize: 29,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 35),

              // Answer grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: nerAssets.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 22,
                  mainAxisSpacing: 22,
                  childAspectRatio: 0.70,
                ),
                itemBuilder: (context, index) {
                  return _buildAnswerCard(nerAssets[index]);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
