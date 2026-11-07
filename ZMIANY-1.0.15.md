# Samolociarze 1.0.15

- Zahaczenie zewnętrzną częścią skrzydła o ziemię lub główne budynki lotniska wywołuje mały wybuch w miejscu kontaktu. Odpada zewnętrzna część danego skrzydła, kadłub i drugie skrzydło pozostają widoczne. Uderzenie kadłubem i mocne przyziemienie nadal powodują katastrofę.
- Uszkodzenie bardzo silnie przechyla samolot, zwiększa opadanie, zmniejsza dostępną moc i reakcję sterów. Trzeba stale kontrować w przeciwną stronę. Uszkodzenia obu skrzydeł sumują utratę siły nośnej. Tego uszkodzenia nie da się naprawić w locie. To uproszczona mechanika gry, a nie rzeczywista symulacja uszkodzeń konstrukcji.
- Skrzydło stale dymi. Jedno skrzydło wybucha tylko raz; zapis i wznowienie zachowują uszkodzenia bez odtwarzania wybuchu. Sprawne samoloty AI zachowują dotychczasowy limit wywołań rysowania.
- W menu **Awaria** można po starcie przećwiczyć uszkodzenie lewego lub prawego skrzydła.
- **Awaria → MAYDAY · ziemia lub woda** pozwala natychmiast lądować w terenie lub wodować bez zgody wieży. Rzeczywista awaria lub uszkodzenie również pozwala przyziemić poza lotniskiem. Pilotaż pozostaje ręczny.
- W terenie wybierz płaskie miejsce, wysuń podwozie, ustaw klapy 2, wyrównaj skrzydła i ogranicz opadanie. Po przyziemieniu hamuj **H** do zatrzymania.
- Do wodowania schowaj podwozie, ustaw klapy 2 i łagodnie sprowadź samolot na wodę. Woda wyhamowuje samolot, widać biały rozbryzg. Rzeka, morze oraz jeziora mają powierzchnie kontaktu odpowiadające scenerii. Uderzenie w brzeg przy dużej prędkości kończy lot.
- Bezpieczne zatrzymanie kończy się udanym lądowaniem awaryjnym. Nie przyznaje nagrody za niedostarczony kontrakt; zapisane postępy pozostają zachowane.
- Trzy nowe pasma górskie mają rzeźbione grzbiety, skaliste stoki, śnieżne partie szczytów i wysokość terenu używaną przez wykrywanie kontaktu. Pasów i osi podejścia nie zasłaniają góry. Dodatkowo 3 wywołania rysowania i około 74 tys. trójkątów.

Sprawdzenie: cały zestaw `npm test`, w tym nowy `check-emergency.mjs`: oba skrzydła wszystkich 12 samolotów, kontakt z ziemią i cienką przeszkodą, przeciwdziałanie przechyłowi, zapis, miękkie/twarde wodowanie i lądowanie w terenie, podwozie, hamowanie, brak nagrody za kontrakt awaryjny, dym, rozbryzg, lokalny wybuch oraz geometria gór. Zachowano 120 testów ręcznego lądowania bez asysty.
