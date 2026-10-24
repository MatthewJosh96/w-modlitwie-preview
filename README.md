# W Modlitwie — strona publiczna

Statyczne wydanie portalu przygotowane do GitHub Pages. `index.html` jest stroną główną, a podkatalogi zawierają modlitwy, świętych, artykuły, plany modlitwy, różaniec, czytania, kalendarz oraz strony informacyjne. `pamiec.html`, `creator.html`, `gallery.html` i `gallery-person.html` dotyczą miejsca pamięci.

Treści modlitw, biografii, artykułów, bezpłatnych części planów i kolejnych kroków różańca pochodzą z aplikacji W Modlitwie. Wygląd stron publicznych korzysta z jej styli, obrazów i fontów. Kalendarz Polski, obliczony z Romcal, obejmuje lata 2025–2035. Czytania prowadzą do Niezbędnika Katolika; strona nie kopiuje współczesnych przekładów Pisma Świętego.

Wyszukiwanie modlitw, różaniec, kalendarz i wybór daty czytań działają w przeglądarce. Postęp różańca jest zapisany lokalnie na urządzeniu. W kreatorze zdjęcie pozostaje na urządzeniu i służy do zobaczenia układu strony. Publikacja treści, konta, intencje, płatności i biblioteka Plus wymagają serwera i nie są uruchomione na GitHub Pages. Strony tych funkcji podają ich aktualny stan.

Karty galerii pamięci przedstawiają przykładowe, fikcyjne osoby. Nie są świadectwami użytkowników, zapisem zakupów ani aktywnymi usługami.

Źródło generowania stron publicznych: `scripts/export-public-pages.ts` w lokalnym projekcie `w-modlitwie`. Skrypt zapisuje zawartość tego repozytorium oraz `output/pages-preview` w projekcie aplikacji. Pliki pamięci są utrzymywane osobno. Do lokalnego podglądu wystarczy zwykły serwer statyczny, np. `python3 -m http.server 8963`.
