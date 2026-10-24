# W Modlitwie — statyczny podgląd strony pamięci

Ten folder jest samodzielnym, publicznym **podglądem projektu**. `index.html`, `creator.html` i `gallery.html` działają bez Next.js, backendu, kont, bazy danych i operatora płatności. Wszystkie odnośniki oraz pliki są względne, więc zawartość folderu można umieścić w katalogu głównym osobnego repozytorium GitHub Pages lub pod ścieżką projektu.

Strona główna podglądu pokazuje wyłącznie fikcyjną osobę. Przyciski „Świeca płonie” i „Po wygaśnięciu” zmieniają lokalny stan demonstracji; nie uruchamiają usługi ani okresu płatnego. Animacja świecy i odległych świateł reaguje na pauzę, ustawienie ograniczonego ruchu, ukrycie karty i wyjście sceny poza ekran. Przycisk udostępniania udostępnia tylko adres tego podglądu.

W kreatorze można przejść wszystkie trzy kroki, dobrać daty, słowa pamięci i modlitwę, dopasować własne zdjęcie w ramce oraz zobaczyć końcową scenę. Wynik pozostaje wyłącznie lokalnym podglądem — przycisk końcowy nie publikuje strony, nie tworzy konta ani zamówienia. Wybór własnego zdjęcia tworzy lokalny adres `blob:` i obraz WebP w pamięci przeglądarki. Obraz nie opuszcza urządzenia, nie jest zapisywany ani przesyłany. Akceptowane są JPG, PNG i WebP do 10 MB. Zmiana lub usunięcie zdjęcia zwalnia poprzedni adres; zamknięcie strony również go zwalnia.

`gallery.html` prezentuje sześć fikcyjnych osób w jednej siatce. Wyszukiwanie oraz strony osób (`gallery-person.html`) działają lokalnie. Pierwsze dwie karty noszą oznaczenie „Wieczne Światło” wyłącznie jako element projektu; nie oznacza ono aktywnej usługi ani obietnicy bezterminowego utrzymania strony. Karty nie reprezentują prawdziwych użytkowników ani zakupów; zdjęcie dodane w kreatorze nigdy nie trafia do tej galerii.

Zawartość publikacyjna:

- `index.html`, `style.css`, `app.js` — kompletna statyczna strona demonstracyjna;
- `creator.html`, `creator.js` — lokalny, trzyetapowy kreator z podglądem;
- `gallery.html`, `gallery.js`, `gallery-person.html` — lokalna galeria i przykładowe strony fikcyjnych osób;
- `assets/*.webp` — lokalne obrazy sceny i fikcyjnych portretów;
- `assets/fonts/*.woff2` — lokalne fonty Inter i Lora oraz ich licencje.

Pakiet nie zawiera plików `.env`, kodu backendu, kluczy, danych użytkowników ani prawdziwego zamówienia. Nie podłączaj do tego podglądu produkcyjnego checkoutu ani prywatnych zdjęć bez osobnej implementacji bezpieczeństwa i uprawnień.

Do lokalnego sprawdzenia otwórz folder na zwykłym serwerze statycznym. GitHub Pages zapewnia takie środowisko. Ładowanie `index.html` bezpośrednio przez `file://` może ograniczać fonty lub schowek w niektórych przeglądarkach.
