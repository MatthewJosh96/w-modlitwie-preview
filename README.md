# W Modlitwie — statyczny podgląd strony pamięci

Ten folder jest samodzielnym, publicznym **podglądem projektu**. `index.html` działa bez Next.js, backendu, kont, bazy danych i operatora płatności. Wszystkie odnośniki oraz pliki są względne, więc zawartość folderu można umieścić w katalogu głównym osobnego repozytorium GitHub Pages lub pod ścieżką projektu.

Podgląd pokazuje wyłącznie fikcyjną osobę. Przyciski „Świeca płonie” i „Po wygaśnięciu” zmieniają lokalny stan demonstracji; nie uruchamiają usługi ani okresu płatnego. Animacja świecy i odległych świateł reaguje na pauzę, ustawienie ograniczonego ruchu, ukrycie karty i wyjście sceny poza ekran. Przycisk udostępniania udostępnia tylko adres tego podglądu.

Wybór własnego zdjęcia tworzy lokalny adres `blob:`. Obraz nie opuszcza urządzenia, nie jest zapisywany ani przesyłany. Akceptowane są JPG, PNG i WebP do 10 MB. Zmiana lub usunięcie zdjęcia zwalnia poprzedni adres; zamknięcie strony również go zwalnia.

Zawartość publikacyjna:

- `index.html`, `style.css`, `app.js` — kompletna statyczna strona;
- `assets/*.webp` — cztery lokalne obrazy sceny i fikcyjnego portretu;
- `assets/fonts/*.woff2` — lokalne fonty Inter i Lora oraz ich licencje.

Pakiet nie zawiera plików `.env`, kodu backendu, kluczy, danych użytkowników ani prawdziwego zamówienia. Nie podłączaj do tego podglądu produkcyjnego checkoutu ani prywatnych zdjęć bez osobnej implementacji bezpieczeństwa i uprawnień.

Do lokalnego sprawdzenia otwórz folder na zwykłym serwerze statycznym. GitHub Pages zapewnia takie środowisko. Ładowanie `index.html` bezpośrednio przez `file://` może ograniczać fonty lub schowek w niektórych przeglądarkach.
