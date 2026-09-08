import 'package:flutter/material.dart';

class AppLanguage {
  final String code;
  final String name;
  final Locale locale;

  const AppLanguage({
    required this.code,
    required this.name,
    required this.locale,
  });
}

const supportedLanguages = [
  AppLanguage(
    code: 'en',
    name: 'English',
    locale: Locale('en'),
  ),
  AppLanguage(
    code: 'te',
    name: 'తెలుగు',
    locale: Locale('te'),
  ),
  AppLanguage(
    code: 'hi',
    name: 'हिन्दी',
    locale: Locale('hi'),
  ),
];

class AppStrings {
  static const Map<String, Map<String, String>> translations = {
    'en': {
      'appTitle': 'NER Elderly Care',
      'welcome': 'Welcome',
      'chooseActivity': 'Choose an activity',
      'cognitiveGame': 'Cognitive Game',
      'cognitiveGameSubtitle': 'Play your cultural memory game',
      'careReminders': 'Care Reminders',
      'careRemindersSubtitle':
          'Medicines, hydration, activities & appointments',
      'todayUpcoming': 'Today & Upcoming',
      'noReminders': 'No care reminders',
      'careTeamWillAdd': 'Your care team will add reminders here.',
      'markCompleted': 'Mark Completed',
      'completed': 'Completed',
      'repeat': 'Repeat',
      'language': 'Language',
      'medicine': 'Medicine',
      'hydration': 'Hydration',
      'dailyActivity': 'Daily Activity',
      'medicalAppointment': 'Medical Appointment',
      'cognitiveActivity': 'Cognitive Activity',
      'hornbill': 'Hornbill',
      'rhino': 'One-horned Rhino',
      'teaGarden': 'Tea Garden',
      'dhol': 'Dhol (Bihu)',
    },
    'te': {
      'appTitle': 'NER వృద్ధుల సంరక్షణ',
      'welcome': 'స్వాగతం',
      'chooseActivity': 'ఒక కార్యకలాపాన్ని ఎంచుకోండి',
      'cognitiveGame': 'జ్ఞాపకశక్తి ఆట',
      'cognitiveGameSubtitle': 'మీ సాంస్కృతిక జ్ఞాపకశక్తి ఆట ఆడండి',
      'careReminders': 'సంరక్షణ రిమైండర్లు',
      'careRemindersSubtitle':
          'మందులు, నీరు, రోజువారీ కార్యకలాపాలు & వైద్య అపాయింట్‌మెంట్లు',
      'todayUpcoming': 'ఈరోజు & రాబోయేవి',
      'noReminders': 'సంరక్షణ రిమైండర్లు లేవు',
      'careTeamWillAdd': 'మీ సంరక్షణ బృందం ఇక్కడ రిమైండర్లను జోడిస్తుంది.',
      'markCompleted': 'పూర్తయినట్లు గుర్తించండి',
      'completed': 'పూర్తయింది',
      'repeat': 'పునరావృతం',
      'language': 'భాష',
      'medicine': 'మందులు',
      'hydration': 'నీరు',
      'dailyActivity': 'రోజువారీ కార్యకలాపం',
      'medicalAppointment': 'వైద్య అపాయింట్‌మెంట్',
      'cognitiveActivity': 'జ్ఞాపకశక్తి కార్యకలాపం',
      'hornbill': 'కొమ్ము పిట్ట',
      'rhino': 'ఒంటి కొమ్ము ఖడ్గమృగం',
      'teaGarden': 'టీ తోట',
      'dhol': 'ఢోల్ (బిహు)',
    },
    'hi': {
      'appTitle': 'NER बुजुर्ग देखभाल',
      'welcome': 'स्वागत है',
      'chooseActivity': 'एक गतिविधि चुनें',
      'cognitiveGame': 'संज्ञानात्मक खेल',
      'cognitiveGameSubtitle': 'अपना सांस्कृतिक स्मृति खेल खेलें',
      'careReminders': 'देखभाल अनुस्मारक',
      'careRemindersSubtitle':
          'दवाइयाँ, पानी, दैनिक गतिविधियाँ और मेडिकल अपॉइंटमेंट',
      'todayUpcoming': 'आज और आने वाले',
      'noReminders': 'कोई देखभाल अनुस्मारक नहीं',
      'careTeamWillAdd': 'आपकी देखभाल टीम यहाँ अनुस्मारक जोड़ेगी।',
      'markCompleted': 'पूरा हुआ चिह्नित करें',
      'completed': 'पूरा हुआ',
      'repeat': 'दोहराएँ',
      'language': 'भाषा',
      'medicine': 'दवा',
      'hydration': 'पानी',
      'dailyActivity': 'दैनिक गतिविधि',
      'medicalAppointment': 'मेडिकल अपॉइंटमेंट',
      'cognitiveActivity': 'संज्ञानात्मक गतिविधि',
      'hornbill': 'हॉर्नबिल',
      'rhino': 'एक सींग वाला गैंडा',
      'teaGarden': 'चाय का बागान',
      'dhol': 'ढोल (बिहू)',
    },
  };

  static String get(String key, String languageCode) {
    return translations[languageCode]?[key] ?? translations['en']?[key] ?? key;
  }
}
