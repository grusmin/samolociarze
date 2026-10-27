# Modele samolotów

Modele z projektu Flightradar24 / FlightGear, na licencji GNU GPL v2:
https://github.com/Flightradar24/fr24-3d-models

- Airbus A380: FlightGear / FGMEMBERS A380-omega. Autorzy wymienieni w źródłach: Ampere, Cunningham, Dalvi, Hamilton, Toryx, Tapaninen i Narendran Muraleedharan. Malowanie Emirates A6-EDA: Models/Liveries/A6-EDA.png z https://github.com/FGMEMBERS/A380-omega. Plik a380-license-readme.txt potwierdza zmianę licencji całości na GPL2 w 2015 r.; starsza licencja CC-BY-NC jest zachowana w źródłach jako informacja historyczna.
- Boeing 747-400: FlightGear / https://github.com/FGMEMBERS/747-400. Malowanie KLM: Models/Liveries/KLM.png z tego samego repozytorium.
- Antonov An-225: FlightGear / https://github.com/FGMEMBERS/AN-225-Mrija, prace Lee Elliota i Viviana Meazzy; późniejsze prace projektu Herbert Wagner. W tej wersji wykorzystano historyczne czerwone malowanie dołączone do modelu Flightradar24.

Zmiany w Samolociarzach: konwersja glTF 1 → glTF 2 przez gltf-pipeline 4.3.1; materiały PBR, usunięcie alternatywnych zdublowanych części i płaskich cieni; łączenie geometrii do szybszego rysowania; ustawienie osi i położenia; podwozie w A380 i 747 dodane do modeli w konfiguracji lotnej. Malowania A380 i 747 zastąpiono teksturami odpowiednich przewoźników. Kod kabiny i efekty dymu są własnym uproszczonym odwzorowaniem na potrzeby gry.

Pełny tekst licencji: GPL-2.0.txt. Oryginalne modele, źródła i skrypty konwersji: ../../model-sources/ w zapisanym projekcie.

Znaki Emirates i KLM identyfikują malowania samolotów. Projekt nie jest oficjalnym produktem tych linii.

## Concorde Air France i Boeing 737 Ryanair (1.0.7)

Concorde: FlightGear / FGMEMBERS/Concorde, GPLv2, commit af22b7012bec173884a259eb84da1c29de72c23f. Źródło: https://github.com/FGMEMBERS/Concorde . Model i rozwój: Bogey (pierwotny autor opisany jako nieznany), C. Schmitt, E. Huminiuc, późniejsza opieka godarklight / islandmonkey; szczegóły w oryginalnym ReadmeModel.txt. Air France F-BVFB: Models/Liveries/AF.png. Konwersja AC3D do glTF 2, wybór zewnętrznych części bez zdublowanego podwozia i kabiny, dopasowanie osi oraz wymiarów 25,56 × 61,66 m; podwozie dodane w grze. Źródła, licencja, konwerter i wskazanie pobranych plików: model-sources/concorde/ w repozytorium gry.

Boeing 737-800 Ryanair: malowanie RYR-800.png / XML z https://github.com/FGMEMBERS/737-800/tree/9126249dd0236479ad723f3e7c4c7139455c7d81/Models/Liveries-800 , GPLv2. Zachowano oryginalną teksturę i licencję w model-sources/concorde/. Znaki linii lotniczych identyfikują malowanie; gra nie jest oficjalnym produktem przewoźników.
