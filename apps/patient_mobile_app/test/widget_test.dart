import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patient_mobile_app/main.dart';

void main() {
  testWidgets('NER Cognitive Game loads', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;

    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(const NERCognitiveGameApp());
    await tester.pumpAndSettle();

    expect(find.text('NER Elderly Cognitive Game'), findsOneWidget);
    expect(find.text('Tap the matching cultural icon:'), findsOneWidget);
  });
}
