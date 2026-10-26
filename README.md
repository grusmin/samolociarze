# Samolociarze 1.0.6 — kariera pilota

**Gra w przeglądarce:** [grusmin.github.io/samolociarze](https://grusmin.github.io/samolociarze/) — adres będzie aktywny po udanej publikacji.

Repozytorium: [grusmin/samolociarze](https://github.com/grusmin/samolociarze). Publikacja i kolejne aktualizacje: dwuklik **OPUBLIKUJ-GITHUB.cmd**, instrukcja w [PUBLIKACJA.md](PUBLIKACJA.md). Skrypt prosi o login i PAT w osobnym oknie, wysyła commit do `main`, włącza Pages i sprawdza wynik. Token nie jest zapisywany na dysku.

Lokalna gra 3D na komputer i telefon, rozwijana z pomysłów Samolociarzy.

## Uruchomienie

Dwuklik URUCHOM-GRE.cmd lub polecenie node server.cjs. Otwórz http://127.0.0.1:4174/ .
Nie trzeba instalować pakietów do grania. Serwer wymaga Node.js, dostępnego na tym komputerze. Okno serwera pozostaw otwarte podczas gry.

## Co jest w tej wersji

- 11 modeli samolotów: A380 Emirates, 747 KLM, An-225 Mrija, 737-800, A320, 767-300, Beluga ST, 787-8, A340-300, 777-200, A350-900. Osiem nowych maszyn ma malowania dostarczone z modelami FlightGear. A380, 747 i An-225 dostępne od początku; pozostałe odblokowuje się monetami i poziomami.
- 11 lotnisk: Warszawa, Londyn Heathrow, JFK, Frankfurt, Paryż CDG, Barcelona, LAX, Tokio Haneda, Pekin, Seul Incheon, Bogota. Każde ma dwa równoległe pasy w stylizowanym świecie gry.
- Pełen cykl kontraktu: uruchomienie silników, dojazd do terminalu pasażerskiego lub strefy cargo, załadunek, zgoda na kołowanie, podjazd do pasa, zgoda na start, przelot, zgoda na lądowanie, hamowanie, powrót do właściwego stanowiska i rozładunek.
- Misje pasażerskie/towarowe, swobodne loty, monety, poziomy, odznaki, dziennik lotów, automatyczny zapis oraz wznawianie lotu po zamknięciu strony. Kopię postępów pobierzesz w Ustawieniach.
- Załadunek i rozładunek towarów około 2 s. Wsiadanie pasażerów trwa 20 s, wysiadanie około 7 s. Podczas załadunku widać postęp i pozostałe sekundy.
- Ruch samolotów AI. Wieża odmawia lądowania na zajętym pasie; R pozwala wybrać drugi pas. Przyznana zgoda rezerwuje pas na podejście.
- Samoloty zaparkowane i obsługujące ruch AI używają szczegółowych modeli 737-800 i A320, w rzeczywistej skali, z teksturami i podwoziem. Każde lotnisko ma dwie zaparkowane maszyny. Modele floty mają połączone identyczne materiały i części podwozia, co ogranicza liczbę wywołań rysowania bez usuwania geometrii.
- Pięć wariantów pogody: słońce, wiatr, deszcz, zachód słońca i noc. Trzy poziomy trudności. Wiatr, turbulencje, paliwo, klapy, przeciągnięcie, ocena siły przyziemienia. Ekspert może dostać awarię w trakcie lotu.
- Awaria lewego/prawego silnika, ptak w silniku, awaria panelu, zacięte podwozie, procedury awaryjne i lądowanie na najbliższym lotnisku. Awaria zmniejsza moc i reakcję sterów. Dym z uszkodzonego silnika; dym spod kół przy hamowaniu.
- Sceneria 3D: terminale, wieże, pojazdy obsługi, pasażerowie, dwa miasta przy lotniskach, trzy dodatkowe miejscowości na trasie, drogi, domy, drzewa, woda i góry zależnie od regionu.
- Fotel kapitana bliżej szyb i po lewej, widoczny pas na ziemi, animowany wolant w Boeingach / An-225 / Beludze ST i drążek boczny w nowoczesnych Airbusach, dźwignie mocy, napis MOC SILNIKÓW i procenty. Kamery za samolotem, pod silnikiem, pod samolotem, z boku i z przodu.

## Sterowanie

S lub ↓: nos w górę, drążek/wolant do siebie. W lub ↑: nos w dół. A/D lub ←/→: skręt. Po puszczeniu steru nos utrzymuje kąt.
+ / −: moc. H: hamulec (spacja również działa). E: silniki. T: wieża. G: podwozie. F: klapy 0/1/2. R: drugi pas do lądowania. C: kokpit. V: kolejna kamera. M: mapa. Esc: pauza.
Podczas hamowania świeci pomarańczowa ikona HAMUJESZ. Na telefonie służą do tego przyciski ekranowe.

Asysta kołowania jest opcjonalna i działa tylko na ziemi. Na poziomie Kapitan i Ekspert samodzielnie koryguj wiatr, prędkość i opadanie. Przy awarii silnika zmniejsz moc do 35% i zabezpiecz silnik; dalsza moc pozostaje ograniczona. Przed awaryjnym wysunięciem podwozia zwolnij poniżej 190 kt.

## Po prostu leć

Duży złoty przycisk „Po prostu leć” znajduje się pod nazwą samolotu w głównym menu. Wybierz model w Hangarze i pogodę w planie lotu. Ten tryb pozwala wypróbować każdy z 11 modeli, także jeszcze niekupiony w karierze.

Samolot od razu leci 900 m nad ziemią, w pobliżu wybranego lotniska. Silniki pracują, podwozie i klapy są schowane, prędkość jest bezpieczna do lotu. Nie trzeba ładować pasażerów ani towarów, kołować, przechodzić punktów misji ani wybierać poprawnej trasy kariery. Paliwo nie kończy się i nie ma automatycznych awarii. Nadal możesz sam wywołać awarię do ćwiczeń. Sterowanie WASD/strzałkami, kokpit C, kamery V i przyciski na telefonie działają tak samo jak w karierze.

T wybiera najbliższe z dwóch lotnisk i pozwala poprosić o opcjonalne lądowanie; R zmienia pas. Po zatrzymaniu samolotu można kliknąć „Po prostu leć jeszcze raz”, aby ponownie zacząć w powietrzu, bez rozładunku i kołowania. Widoczny teren podąża za dalekim lotem, więc nie ma końca obszaru misji.

Ten tryb nie przyznaje monet ani XP i nie nadpisuje zapisanego lotu kariery. Pauza pozwala wznowić aktualny lot, ale po odświeżeniu przycisk „Po prostu leć” zaczyna nowy przelot. „Wznów lot” pozostaje dostępne dla wcześniej zapisanej kariery.

## Gra na telefonie

Interfejs działa pionowo i poziomo, także na szerokich telefonach. Stery są pod prawym kciukiem; moc i hamulec pod lewym. Przytrzymuj przyciski — możesz jednocześnie skręcać, zmieniać pochylenie i moc. Pomarańczowe podświetlenie pokazuje trzymany przycisk. Pauza, obrót ekranu i utrata dotyku zwalniają stery.

Parametry lotu pozostają widoczne również w kokpicie. Pasek funkcji pod parametrami przewijaj palcem w bok, aby dotrzeć do obsługi naziemnej, silników, podwozia, klap i procedur awaryjnych. „Więcej” otwiera dodatkowe kamery, awarie oraz pełny ekran, jeśli przeglądarka go obsługuje. Mapa i panele mają przycisk zamknięcia. Tryb automatyczny grafiki ogranicza rozdzielczość i cienie również po obróceniu telefonu. Układ uwzględnia wycięcie ekranu i dolny pasek systemowy.

## Zapis i kopia

Postępy są w localStorage tej przeglądarki, osobno dla każdego adresu. Korzystaj stale z http://127.0.0.1:4174/ . Adres localhost ma osobny zapis. Ustawienia → Kopia postępów eksportuje JSON, który można później wczytać. Kod projektu i modele są w tym folderze; ZIP projektu nie zawiera automatycznie postępów przeglądarki.

## Dojazd do załadunku

Nowy lot zaczyna się na płycie postojowej, poza stanowiskiem. Uruchom silniki E. Pasażerów zabierasz w zielonym okręgu przy terminalu, towary w żółtym okręgu strefy cargo. Kolorowa strzałka 3D wskazuje dokładne miejsce, a napis nad stanowiskiem pozwala rozpoznać je z daleka. Jedź z mocą około 20–30%, zatrzymaj się H i ustaw moc na 0%. Przycisk „Obsługa · załaduj” włączy się dopiero przy właściwym stanowisku. „Asysta dojazdu” może poprowadzić samolot i zatrzymać go na miejscu. Mapa M przybliża lotnisko i pokazuje oba miejsca oraz drogę dojazdu.

Po lądowaniu rozładunek również odbywa się przy odpowiednim stanowisku lotniska docelowego. Towary nadal ładują się i rozładowują w około 2 sekundy. Starsze zapisane loty zachowują pozycję; cargo zaparkowane wcześniej przy terminalu dostaje wskazanie do nowej strefy.

## Kody do gry

W Ustawieniach wpisz kod i kliknij „Włącz kod” albo naciśnij Enter. Wielkość liter nie ma znaczenia.

- SAMOLOCIARZE: najwyższa ranga (Dowódca floty, poziom 6) i wszystkie 11 samolotów.
- POZIOMY: najwyższa ranga i odblokowanie wymagań poziomów.
- HANGAR: wszystkie samoloty bez kupowania.
- MONETY: podnosi saldo do co najmniej 100 000 monet.

Kody nie obniżają już zdobytych XP ani monet. Dziennik lotów i odznaki nadal zdobywasz za wykonane misje. Przed pierwszym poprawnym kodem gra zachowuje osobną kopię zapisu w tej przeglądarce. „Przywróć zapis sprzed kodów” wraca do tej kopii, cofając również postępy z lotów wykonanych po użyciu kodu. Kolejne kody nie nadpisują kopii; zapis oraz odblokowania przetrwają odświeżenie strony.

## Kołowanie i wybór pasa do startu

Po załadunku zgłoś się do wieży T. Wieża przydziela prawy pas i podaje numer, np. 33R w Warszawie lub 27R w Londynie. Trasa A prowadzi do niego bez przekraczania drugiego pasa. Niebieska linia na ziemi i mapa M prowadzą za tyłem pasa do pomarańczowego STOP, gdzie cały samolot pozostaje poza pasem. Zatrzymaj się i ponownie wywołaj wieżę T. Gdy pas jest zajęty, czekaj na zgodę.

Po zgodzie podjedź niebieską linią do strzałki START z numerem pasa, ustawiając nos wzdłuż białej linii. Asysta kołowania obsługuje oba etapy. Dopiero na początku pasa zwiększ moc do 100% i rozpocznij rozbieg; przed samolotem jest około 3,1 km pasa. Komunikaty i mapa przypominają przydzielony numer oraz właściwy wjazd.

Starsze zapisy kołowania dostają nową trasę bez zmiany pozycji samolotu. Już rozpoczęty rozbieg i lot można kontynuować. Losowe awarie Eksperta liczą czas spędzony w powietrzu, więc dłuższe kołowanie nie wywołuje awarii tuż po starcie.

## Zakres i źródła

To kompletna grywalna kariera cywilna w tej wersji. Nie obejmuje jeszcze wszystkich maszyn z pierwszego pomysłu, multiplayera i misji wojskowych. Lotniska, miasta, kabina i fizyka są uproszczone. Układy pasów i trasy nie odwzorowują prawdziwych map; loty są skrócone. Kabina nie jest dokładną repliką każdego typu. Gra nie osiąga poziomu całego Microsoft Flight Simulator.

Poprzedni trening: training.html. Three.js i loader: MIT. Modele FlightGear / Flightradar24: GPL2, autorzy w dist/models/CREDITS.md i FLEET-CREDITS.md; oryginały, licencje i konwertery w model-sources/. Własna sceneria i efekty są generowane w kodzie. Fonty Google Fonts mają zamienniki systemowe, więc bez nich gra również działa.

## Sprawdzenie

npm test albo kolejno: node check-flight.cjs, node check-career.mjs, node check-ground.mjs, node check-departure.mjs, node check-free-flight.mjs, node check-cheats.mjs, node check-models.mjs, node check-airport-fleet.mjs.
Test „Po prostu leć” obejmuje 55 kombinacji samolotu i pogody, natychmiastowe sterowanie, utrzymanie pochylenia, długi lot, brak ograniczeń trasy, opcjonalne lądowania na obu lotniskach w obu kierunkach, ochronę zapisu kariery i starsze zapisy. Kod JavaScript oraz zgodność obu stron wejściowych zostały sprawdzone. Przycisk oraz menu zweryfikowano w przeglądarce również z zastępczą czcionką.
Test odlotu obejmuje dojazd za tyłem pasa, STOP poza pasem, numer przydzielonego pasa, odmowę zgody przy ruchu, zajęcie pasa po zgodzie, pełny rozbieg i start dla wszystkich 11 lotnisk oraz 11 typów samolotów. Sprawdza też ręczne ustawianie, migrację zapisu i czas losowych awarii.
Test innych samolotów sprawdza oryginalną geometrię, skalę i podwozie ośmiu maszyn na dwóch lotniskach, współdzielenie zasobów, budżet rysowania i zachowanie zasobów floty podczas przebudowy scenerii.
Test stanowisk obejmuje dojazd i wyjazd, hamulec, blokadę obsługi poza strefą lub w ruchu, przerwanie załadunku, starsze zapisy oraz rozładunek na lotnisku docelowym dla wszystkich 11 samolotów.
Test kodów obejmuje poprawne i błędne wpisy, odblokowania, monety, zapis, kopię i przywracanie, ponowne użycie oraz błąd zapisu. Działanie formularza sprawdzone w przeglądarce na komputerze i przy szerokości 390 px.
Sprawdzone: pełna misja przy wietrze; zakup i walidacja zapisu; wznawianie; procedury awaryjne; ruch na pasach i drugi pas; obsługa towarów w 2 s; geometria, tekstury i podwozie 11 modeli; menu, kamery, kokpit i układ 390 × 844 w przeglądarce. Test rozmiaru ekranu nie zastępuje pomiaru na rzeczywistym telefonie.

Test sterowania `node check-controls.mjs` jest częścią `npm test` i sprawdza jednoczesne dotknięcia, niezależne puszczanie przycisków, przerwanie dotyku, utratę przechwycenia oraz reset przy pauzie.

Test przeglądarkowy: uruchom `node server.cjs`, a następnie `node check-mobile.mjs` (lub `npm run test:mobile`). Wymaga Playwright oraz jego Chromium; opcjonalnie `BROWSER_CHANNEL=msedge` wybiera zainstalowany Edge. Zmienna `PLAYWRIGHT_MODULE` pozwala wskazać istniejący moduł Playwright, a `GAME_TEST_URL` inny serwer. Zrzuty trafiają do ignorowanego folderu `.openai/mobile/`. Test obejmuje dziewięć rozmiarów od 320 × 568 do 1024 × 768, menu, brak nakładania sterów, cele dotyku minimum 44 px, kokpit, panele, marginesy systemowe, rzeczywiste zdarzenia wielodotyku, przewijanie paska funkcji, hamulec, pauzę, zapis i wznowienie kariery oraz układ komputerowy 1366 × 768. To emulacja dotyku w przeglądarce, bez pomiaru na fizycznym telefonie.

Wysłanie zmian na `main` uruchamia publikację gry przez GitHub Pages.
