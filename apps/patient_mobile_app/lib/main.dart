import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:alarm/alarm.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'features/care_reminders.dart';
import 'features/visual_memory_game.dart';
import 'localization.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  const permissionChannel = MethodChannel(
    'patient_mobile_app/permissions',
  );

  try {
    await permissionChannel.invokeMethod('requestNotifications');
  } catch (_) {}

  await Alarm.init();
  runApp(const NERCognitiveGameApp());
}

class NERCognitiveGameApp extends StatefulWidget {
  const NERCognitiveGameApp({super.key});

  @override
  State<NERCognitiveGameApp> createState() => _NERCognitiveGameAppState();
}

class _NERCognitiveGameAppState extends State<NERCognitiveGameApp> {
  Locale _locale = const Locale('en');

  void _changeLanguage(Locale locale) {
    setState(() {
      _locale = locale;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      locale: _locale,
      supportedLocales: supportedLanguages.map((language) => language.locale),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      title: AppStrings.get('appTitle', _locale.languageCode),
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFFFF8FF),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF079D92),
        ),
        useMaterial3: true,
      ),
      home: PatientHomeScreen(
        locale: _locale,
        onLanguageChanged: _changeLanguage,
      ),
    );
  }
}

class PatientHomeScreen extends StatelessWidget {
  final Locale locale;
  final ValueChanged<Locale> onLanguageChanged;

  const PatientHomeScreen({
    super.key,
    required this.locale,
    required this.onLanguageChanged,
  });

  String t(String key) {
    return AppStrings.get(key, locale.languageCode);
  }

  void _showLanguagePicker(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t('language'),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                ...supportedLanguages.map(
                  (language) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(
                      Icons.language_rounded,
                      size: 30,
                    ),
                    title: Text(
                      language.name,
                      style: const TextStyle(fontSize: 19),
                    ),
                    trailing: locale.languageCode == language.code
                        ? const Icon(
                            Icons.check_circle,
                            color: Color(0xFF079D92),
                          )
                        : null,
                    onTap: () {
                      onLanguageChanged(language.locale);
                      Navigator.pop(sheetContext);
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          t('appTitle'),
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 23,
          ),
        ),
        backgroundColor: const Color(0xFF079D92),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            tooltip: t('language'),
            onPressed: () => _showLanguagePicker(context),
            icon: const Icon(
              Icons.language_rounded,
              size: 30,
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 10),
          Text(
            t('welcome'),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            t('chooseActivity'),
            style: const TextStyle(fontSize: 19),
          ),
          const SizedBox(height: 25),
          _HomeOptionCard(
            icon: Icons.psychology_rounded,
            title: t('cognitiveGame'),
            subtitle: t('cognitiveGameSubtitle'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const VisualMemoryGame(),
                ),
              );
            },
          ),
          const SizedBox(height: 18),
          _HomeOptionCard(
            icon: Icons.notifications_active_rounded,
            title: t('careReminders'),
            subtitle: t('careRemindersSubtitle'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const CareReminders(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _HomeOptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _HomeOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Row(
            children: [
              CircleAvatar(
                radius: 34,
                backgroundColor: const Color(0xFF079D92),
                child: Icon(
                  icon,
                  size: 36,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios_rounded,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
