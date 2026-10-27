# Samolociarze 1.0.7

- „Po prostu leć” zaczyna się na początku pasa wybranego lotniska. Silniki są włączone, podwozie wysunięte, klapy na 1 i zgoda na start jest wydana. Nie ma załadunku ani kołowania. Dodaj moc, wystartuj i poleć do wybranego lotniska. T wybiera najbliższe lotnisko i pozwala poprosić o lądowanie; R zmienia pas. Lot kończy się po lądowaniu i zatrzymaniu hamulcem H, bez kołowania do terminalu.
- Concorde Air France: model FlightGear z charakterystycznym długim nosem, skrzydłem delta, czterema silnikami i podwoziem. Dostępny do wypróbowania w „Po prostu leć”; w karierze kosztuje 9000 monet i wymaga poziomu 3. Model nosa jest stały, w pozycji podniesionej; kabina pozostaje wspólnym odwzorowaniem z gry.
- Istniejący szczegółowy Boeing 737-800 otrzymał malowanie Ryanair. Tak samo wyglądają 737 obsługujące ruch na lotnisku.
- Każde lotnisko ma ogrodzenie z siatki, metalowymi słupkami, belkami i szeroką bramą przy drodze dojazdowej. Obejmuje oba pasy, tylną drogę kołowania oraz światła podejścia. Ogrodzenie jest elementem scenerii; nie dodaje nowego systemu kolizji.
- Rozbicie uruchamia błysk, płomienie, dym, odłamki i dźwięk. Kamera pokazuje zdarzenie z zewnątrz, a wynik pojawia się po krótkiej animacji. Poprawne przyziemienie, brak zgody wieży przy fizycznie bezpiecznym lądowaniu i opuszczenie obszaru misji nie powodują wybuchu.
- Efekty używają stałych pul obiektów. Geometria Concorde’a jest łączona do pięciu wywołań rysowania. Odpowiednie zasoby ogrodzeń i efektów są czyszczone przy zmianie lotu.
- Kontrola publikacji porównuje tekst z uwzględnieniem normalizacji końcówek linii Windows/Linux, więc poprawny plik nie zgłasza już fałszywego błędu.

Zachowano istniejącą karierę, zapis, sterowanie klawiaturą i dotykiem oraz układ telefonu z wersji 1.0.6. Nowy samolot nie resetuje postępów. Kod SAMOLOCIARZE uwzględnia już wszystkie 12 maszyn.

Weryfikacja: wszystkie testy gry, 60 zestawów samolot/pogoda ze startem z pasa i rzeczywistym oderwaniem od ziemi, 11 lotnisk, lądowania w obu kierunkach, nowe przypadki rozbicia i bezpiecznego lądowania, geometria i zasoby 12 samolotów, odtwarzalna konwersja Concorde’a, otwarta brama i zwalnianie zasobów ogrodzenia, wygaszanie i ponowne uruchamianie efektu rozbicia.
