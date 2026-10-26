# Samolociarze — kopia gry i darmowa publikacja na GitHub Pages

Kopia wersji **1.0.5**, przygotowana **26.10.2026**. Zawiera grę 3D, wszystkie 11 modeli samolotów, tekstury, źródła modeli, licencje i testy. Dotychczasowy projekt pozostaje bez zmian. **Ten pakiet jest przygotowany do publikacji; nic nie zostało jeszcze wysłane na GitHub.**

GitHub Pages może bezpłatnie udostępniać tę grę z **publicznego repozytorium** na koncie GitHub Free. Dla tego wariantu nie potrzebujesz płatnego planu, własnej domeny ani serwera. GitHub Actions w publicznym repozytorium również jest bezpłatny. [Warunki GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

## 1. Zachowaj postępy z lokalnej gry

1. Otwórz dotychczasową grę pod adresem, przy którym masz swoje poziomy, np. `http://127.0.0.1:4174/career.html`.
2. W menu wybierz **Ustawienia → Kopia postępów**.
3. Zachowaj pobrany plik **Samolociarze-postepy.json** w osobnym miejscu, razem z kopią zapasową gry.

Kopia folderu ani ZIP nie pobierają automatycznie danych z przeglądarki. Eksport zachowuje karierę, monety, samoloty i dziennik; nie przenosi aktualnie rozpoczętego lotu. Adres GitHub Pages będzie miał osobny zapis, podobnie jak telefon i inna przeglądarka. Pliku postępów nie trzeba wysyłać do publicznego repozytorium.

## 2. Przygotuj GitHub Desktop

1. Zaloguj się na konto na [GitHub](https://github.com/).
2. Zainstaluj i uruchom [GitHub Desktop](https://desktop.github.com/download/), a następnie zaloguj się w nim na to samo konto.
3. Wybierz **File → New repository**.
4. Ustaw **Name: `samolociarze`** oraz **Local path**, np. folder `Dokumenty\GitHub`. Program utworzy w nim nowy podfolder `samolociarze`.
5. Pozostaw **Git ignore: None** i **License: None**. Nie zaznaczaj dodawania README — te pliki są już w przygotowanej kopii. Kliknij **Create repository**.
6. Sprawdź u góry **Current branch**. Powinno być **main**. Jeśli jest inaczej, zmień nazwę gałęzi przez **Branch → Rename** na `main`.
7. Wybierz **Repository → Show in Explorer**. To docelowy folder nowego repozytorium.
8. W drugim oknie Eksploratora otwórz folder tej kopii, **Samolociarze-GitHub-Pages**. Skopiuj **całą jego zawartość** do folderu repozytorium z punktu 7.

Na najwyższym poziomie repozytorium muszą być foldery `dist`, `model-sources` i `.github` oraz pliki `package.json`, `.gitignore` i instrukcja. **Nie wkładaj tam dodatkowego folderu Samolociarze-GitHub-Pages ani samego ZIP-a.** Nie usuwaj folderu `.git`, który utworzył GitHub Desktop.

```text
samolociarze/                    ← folder repozytorium
├── .github/
│   └── workflows/
│       └── pages.yml            ← gotowa automatyczna publikacja
├── .gitignore
├── dist/
│   ├── index.html               ← strona startowa
│   ├── career.html
│   ├── app.js
│   ├── models/                  ← samoloty, tekstury i licencje
│   └── ...
├── model-sources/               ← oryginalne modele i konwersja
├── package.json
├── server.cjs
├── URUCHOM-GRE.cmd
├── INSTRUKCJA-GITHUB-PAGES.md
└── ...                          ← pozostałe pliki kopii
```

To sposób z GitHub Desktop, ponieważ gra zawiera ponad 100 plików. Przeglądarkowy formularz GitHub pozwala wysłać do 100 plików naraz. [Dokumentacja przesyłania plików](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

## 3. Wyślij kopię gry do publicznego repozytorium

1. Wróć do GitHub Desktop. W zakładce **Changes** zobaczysz skopiowane pliki; zostaw je zaznaczone.
2. W polu **Summary** wpisz `Samolociarze 1.0.5 — pierwsza kopia` i kliknij **Commit to main**.
3. Kliknij **Publish repository**. Ustaw nazwę **samolociarze** i **odznacz Keep this code private**, aby repozytorium było publiczne.
4. Kliknij **Publish repository** w oknie potwierdzenia. To ten krok wysyła pliki na GitHub.
5. Wybierz **Repository → View on GitHub**. Sprawdź, że widać foldery `dist`, `model-sources` i plik `.github/workflows/pages.yml`.

Kod i modele w takim repozytorium będą publicznie dostępne. Zachowaj dołączone informacje o autorach i licencjach; znajdują się m.in. w `dist/models/CREDITS.md`, `dist/models/FLEET-CREDITS.md`, `dist/models/GPL-2.0.txt`, `dist/THREE-LICENSE.txt` i `model-sources/`.

[Pomoc GitHub Desktop: publikacja projektu](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop)

## 4. Włącz GitHub Pages

1. Na stronie repozytorium wybierz **Settings → Pages**.
2. W sekcji **Build and deployment → Source** wybierz **GitHub Actions**.
3. Gotowy workflow jest już w paczce. Nie dodawaj kolejnego szablonu ani Jekylla.
4. Otwórz zakładkę **Actions** i po lewej wybierz **Publikacja Samolociarzy**.
5. Kliknij **Run workflow**, wybierz gałąź **main** i ponownie **Run workflow**.
6. Poczekaj, aż uruchomienie zakończy się zielonym znakiem. Pierwsze automatyczne uruchomienie mogło się nie udać, jeśli Pages nie było jeszcze włączone; ręczne uruchomienie wykonaj po punkcie 2.
7. Wróć do **Settings → Pages** i kliknij **Visit site**, aby dostać właściwy adres.

Gotowy plik `.github/workflows/pages.yml` wysyła zawartość `dist/` jako stronę. Nie ma instalacji pakietów ani kompilacji: ta wersja jest już statyczną grą HTML/CSS/JavaScript. Uprawnienia do publikacji są zapisane w workflow; nie trzeba tworzyć osobistego tokena ani dodawać sekretów. [Konfiguracja źródła publikacji](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [workflow GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 5. Otwórz grę na komputerze i telefonie

Przy nazwie repozytorium `samolociarze` adres będzie miał postać:

```text
https://TWOJ_LOGIN.github.io/samolociarze/
```

Zastąp `TWOJ_LOGIN` loginem konta, na którym opublikowano repozytorium. Dokładny link znajdziesz w **Settings → Pages → Visit site**. Nie dodawaj do niego `/dist/`. [Adresy witryn projektów GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

Otwórz ten sam link w przeglądarce telefonu. Komputer z lokalnym serwerem nie musi być wtedy włączony. Gra potrzebuje przeglądarki obsługującej WebGL; przy pierwszym uruchomieniu pobiera modele 3D. Na słabszym telefonie wybierz **Ustawienia → Jakość grafiki → Oszczędna**.

Aby przywrócić karierę, otwórz na nowej stronie **Ustawienia → Wczytaj postępy** i wybierz plik z punktu 1. Żeby mieć ten sam postęp na telefonie, przenieś tam plik i również go wczytaj. Gra nie ma wspólnego konta gracza ani automatycznej synchronizacji urządzeń.

## 6. Jak publikować następne poprawki

1. Wprowadzaj i testuj zmiany lokalnie. Jeśli nadal rozwijasz grę w dotychczasowym folderze, przenieś zmienione pliki do folderu repozytorium GitHub Desktop; sama kopia nie synchronizuje się z oryginałem.
2. Aktualizuj komplet zmienionych plików `dist/`, w tym modele i tekstury. Jeśli zmieniasz główną stronę, utrzymuj też zgodność `dist/index.html` i `dist/career.html`. Zaktualizowane źródła modeli zachowuj w `model-sources/`.
3. W GitHub Desktop wpisz opis w **Summary**, wybierz **Commit to main**, a potem **Push origin**.
4. Każde wysłanie zmian do `main` uruchamia ten sam workflow. Postęp sprawdzisz w **Actions**. Po zielonym zakończeniu odśwież stronę gry.

Do aktualizacji nie musisz ponownie ustawiać Pages. Plik `SUMY-SHA256.json` opisuje stan kopii z dnia jej przygotowania; po edycjach jego stare sumy nie będą już zgodne z nowymi plikami.

## Granie lokalnie z tej kopii

Na komputerze z Node.js uruchom `URUCHOM-GRE.cmd` albo w terminalu otwartym w folderze kopii wpisz:

```powershell
node server.cjs
```

Otwórz `http://127.0.0.1:4174/` i zostaw serwer uruchomiony. Gra nie wymaga `npm install`. Nie otwieraj `index.html` dwuklikiem z dysku — moduły JavaScript potrzebują serwera HTTP.

Jeżeli dotychczasowa gra już zajmuje port 4174, skrót `URUCHOM-GRE.cmd` otworzy tę działającą instancję. Aby osobno przetestować właśnie kopię, w jej folderze uruchom:

```powershell
$env:SAMOLOCIARZE_PORT = '4175'
node server.cjs
```

Wtedy otwórz `http://127.0.0.1:4175/`. Ten adres również ma osobny zapis; w razie potrzeby wczytaj eksport kariery. Node.js służy wyłącznie do lokalnego uruchomienia. Osoby grające przez GitHub Pages nie muszą go instalować.

## Gdy coś nie działa

| Objaw | Co sprawdzić |
| --- | --- |
| Błąd 404 pod adresem gry | Użyj linku **Visit site**. Sprawdź **Source: GitHub Actions**, zielone uruchomienie w Actions oraz plik `dist/index.html` w repozytorium. Po pierwszej publikacji odczekaj kilka minut. |
| Nie widać workflow na liście Actions | Sprawdź dokładną ścieżkę `.github/workflows/pages.yml` na gałęzi `main`; plik nie może być schowany w dodatkowym folderze kopii. |
| Czerwone uruchomienie przy przygotowaniu Pages | Włącz **Settings → Pages → Source: GitHub Actions**, potem ręcznie **Run workflow**. Repozytorium musi być publiczne dla wariantu GitHub Free. |
| Actions są wyłączone | W ustawieniach repozytorium sprawdź **Actions → General** i zezwól na dołączone akcje GitHub. Na koncie organizacji ustawienia może kontrolować administrator. |
| Widać interfejs, ale nie modele | Sprawdź, czy wysłano cały `dist/models/`, razem z plikami `.gltf`, `.bin`, `.png` i `.jpg`. Zachowaj wielkość liter w nazwach. |
| Po poprawce wciąż widać starą grę | Poczekaj na zielone Actions; na komputerze użyj **Ctrl+F5**, a na telefonie zamknij i ponownie otwórz stronę. |
| Zniknęły samoloty lub poziomy | Nowy adres, telefon lub przeglądarka mają osobny zapis. Wczytaj plik kariery przez **Ustawienia → Wczytaj postępy**. |
| Błąd zajętego portu przy grze lokalnej | Użyj działającej gry na 4174 albo uruchom kopię na innym wolnym porcie, np. 4175, według polecenia wyżej. |

GitHub wskazuje, że zmiany po wysłaniu mogą pojawić się na stronie w ciągu około 10 minut. [Pomoc dotycząca publikacji Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
