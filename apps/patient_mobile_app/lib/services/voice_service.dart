import 'package:flutter_tts/flutter_tts.dart';

class VoiceService {
  final FlutterTts _tts = FlutterTts();

  Future<void> speak({
    required String text,
    required String languageCode,
  }) async {
    String language;

    switch (languageCode) {
      case 'te':
        language = 'te-IN';
        break;
      case 'hi':
        language = 'hi-IN';
        break;
      default:
        language = 'en-IN';
    }

    await _tts.setLanguage(language);
    await _tts.setSpeechRate(0.42);
    await _tts.setPitch(1.0);
    await _tts.setVolume(1.0);

    await _tts.stop();
    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
  }
}
