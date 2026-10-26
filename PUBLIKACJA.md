# Publikacja tej kopii Samolociarzy

Gra znajduje się w `C:\Users\grusz\Documents\samolociarze`.
Docelowe repozytorium: [grusmin/samolociarze](https://github.com/grusmin/samolociarze).
Adres gry po zakończeniu publikacji: [grusmin.github.io/samolociarze](https://grusmin.github.io/samolociarze/).

## Co zrobić teraz

1. Otwórz ten folder w Eksploratorze Windows.
2. Dwukrotnie kliknij **OPUBLIKUJ-GITHUB.cmd**. Uruchom go ze swojego zwykłego konta Windows; środowisko agenta Codex nie ma prawa zapisu metadanych `.git`.
3. Wpisz login GitHub. Jeśli jest to `grusmin`, wystarczy Enter.
4. Wklej PAT i naciśnij Enter. Wpis w tym polu jest ukryty; przy wklejaniu nie będzie widać tokena.
5. Zostaw okno otwarte do komunikatu **GOTOWE!**. Skrypt sam sprawdzi grę, zapisze commit, wyśle pliki, włączy Pages, uruchomi publikację i sprawdzi stronę oraz wybrane modele.

Token trafia do procesu przez standardowe wejście i jest używany w pamięci. Nie zostaje zapisany w plikach projektu, adresie `origin` ani konfiguracji Git. Okno logowania nie wysyła tokena do czatu. Konto musi mieć prawo wysyłania zmian i zarządzania Pages w wskazanym repozytorium.

## Uprawnienia PAT

Możesz użyć istniejącego tokena z odpowiednimi uprawnieniami albo utworzyć go w [ustawieniach tokenów GitHub](https://github.com/settings/tokens).

- **Fine-grained PAT:** wybierz właściciela `grusmin`, wyłącznie repozytorium `samolociarze`, a w **Repository permissions** ustaw **Contents**, **Workflows**, **Actions**, **Pages** i **Administration** na **Read and write**. Uprawnienie Metadata do odczytu GitHub dodaje automatycznie. Pages i Administration służą włączeniu strony; Actions uruchamia i sprawdza publikację.
- **PAT classic:** potrzebne są zakresy **repo** oraz **workflow**.

GitHub wymaga uprawnień Pages i Administration do utworzenia witryny przez API: [dokumentacja GitHub Pages API](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site).

## Kolejne poprawki

Edytuj i testuj grę w tym folderze. Ponownie uruchom **OPUBLIKUJ-GITHUB.cmd** i podaj dane. Zmiany trafią do `main` bez nadpisywania historii. Jeżeli ktoś dodał nowsze commity na GitHub, skrypt zatrzyma się zamiast wykonywać force push.

Możesz również korzystać ze zwykłych `git commit` i `git push` albo GitHub Desktop. Gotowa konfiguracja `.github/workflows/pages.yml` publikuje `dist/` po wysłaniu zmian do `main`.

Aktualny wynik skryptu jest zapisany w lokalnym, pomijanym przez Git pliku `.publikacja/status.json`. Zawiera tylko status, link do Actions, adres gry i identyfikator commita. Nie zawiera tokena.

Do sprawdzenia gry bez publikacji służy `node tools/publish-github.mjs --check`. Opis grania i sterowania znajduje się w `README.md`.

## Zapis kariery

Folder zawiera kod i modele. Postępy pozostają w przeglądarce. Przed zmianą adresu w dotychczasowej grze wybierz **Ustawienia → Kopia postępów**, a na stronie GitHub Pages **Ustawienia → Wczytaj postępy**. Rozpoczęty lot nie jest częścią eksportu.
