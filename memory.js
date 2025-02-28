const OKLADKA_BLUE = `cover_blue.png`;
const OKLADKA_RED = `cover_red.png`;
const ROZMIARY = [[4, 3], [6, 5], [9, 6], [10, 8]];
const KOMPUTER_NAME_LIST = ["RZUF", "Fred", "Bolec", "Cwaniak", "Gigantus", "Pułkownik UB", "Brutus", "Cezar", "Reżyser kina akcji", "Waldek"];
const KOMPUTER_FILM_LIST = [["rzuf.mp4"], ["fred.mp4"], ["bolec.mp4"], ["cwaniak.mp4"], ["gigantus.mp4"], ["pulkownik.mp4"], ["brutus.mp4"], ["cezar.mp4"], ["rezyser1.mp4", "rezyser2.mp4"], ["waldek.mp4"]];
let karty = [], poprzednia = [], wzory = [], pamiec = [];             // tablice z liczbami
let body, formularz, gra, wynik = [], gracz = [], startButton, endButton;           // elementy html
let player1, player2, komputer, rozmiar = [], okladka = [], poziom, procent, intro; // formularz
let humanName, komputerName, ustawienia = [];                                              // zapis wartości z formularza
let do_odgadniecia, mozliweRuchy = [];                                                     // ile kart do końca, możliwe ruchy
let isClickable, kolej, plikOkladki, zKomputerem;                                                 // flagi, ustawienia
const start = new Audio("start.mp3");
const uncover = new Audio("bounce_1.mp3");
const wrong = new Audio("bounce_2.mp3");
const correct = new Audio("dog.mp3");
const brawo = new Audio("cheers.mp3");

document.addEventListener("DOMContentLoaded", () => {
    formularz = document.getElementById("ekran-powitalny");
    player1 = document.getElementById("player1");
    player2 = document.getElementById("player2");
    rozmiar = document.getElementsByName("rozmiar");
    okladka = document.getElementsByName("okladka");
    komputer = document.getElementById("komputer");
    poziom = document.getElementById("poziom");
    procent = document.getElementById("procent");
    intro = document.getElementById("intro");
    body = document.body;
    gra = document.querySelector("#gra");
    wynik[1] = document.querySelector("#wynik1");
    wynik[2] = document.querySelector("#wynik2");
    gracz[1] = document.querySelector("#gracz1");
    gracz[2] = document.querySelector("#gracz2");
    komputer.addEventListener("input", () => przelaczKomputerGracz());
    poziom.addEventListener("input", () => ustawPoziomKomputera(poziom.value));
    ekranPowitalny();
});

/**
 * Uruchamia ekran powitalny z formularzem
 */
function ekranPowitalny() {
    gra.replaceChildren([]);  // Wyczyść stół do gry
    if (ustawienia.length === 0) { // wybory domyślne
        ustawienia[1] = "Ignaś";
        ustawienia[2] = "Tato";
        ustawienia[3] = 1;
        ustawienia[4] = 1;
        ustawienia[5] = false;
        ustawienia[6] = 50;
        ustawienia[7] = true;
    }
    formularz.hidden = false;
    formularz.style.display = "flex";
    player1.value = ustawienia[1];
    player2.value = ustawienia[2];
    rozmiar[ustawienia[3]].checked = true;
    okladka[ustawienia[4]].checked = true;
    komputer.checked = ustawienia[5];
    zKomputerem = ustawienia[5];
    poziom.value = ustawienia[6];
    intro.checked = ustawienia[7];
    komputerName = KOMPUTER_NAME_LIST[Math.floor(Math.min(ustawienia[6], 99) / 10)];
    startButton = dodajButton(formularz, "Zaczynamy!", ustawGre, 500);
}

/**
 * Zbiera z formularza ustawienia gry i ją wywołuje z odpowiednimi parametrami
 */
function ustawGre() {
    formularz.removeChild(startButton);
    plikOkladki = okladka[0].checked ? OKLADKA_RED : OKLADKA_BLUE;
    gracz[1].innerHTML = player1.value;
    gracz[2].innerHTML = player2.value;
    // zapisz ustawienia
    ustawienia[1] = player1.value;
    ustawienia[2] = player2.value;
    ustawienia[3] = ktoryChecked(rozmiar);
    ustawienia[4] = ktoryChecked(okladka);
    ustawienia[5] = komputer.checked;
    ustawienia[6] = poziom.value;
    ustawienia[7] = intro.checked;
    if (zKomputerem) {
        pamiec = [];
        for (let i = 0; i < 40; i++) {     // Tutaj zapamiętujemy odkryte karty po numerze (z 40)
            pamiec[i] = [];
        }
    }
    if (zKomputerem) {
        if (intro.checked) {
            const intro = odtworzIntro(wybierzJeden(KOMPUTER_FILM_LIST[Math.floor(Math.min(ustawienia[6], 99) / 10)]), 640, 360);
            intro.onended = () => {
                setTimeout( () => document.body.removeChild(intro), 1000);
                setTimeout(() => wybierzGre(), 1000);
            };
        } else {
            wybierzGre()
        }
    } else {
        wybierzGre();
    }
}

function wybierzJeden(filmList = []) {
    return filmList[losuj(filmList.length)];
}

/**
 * Dokonuje wyboru właściwej wersji gry
 */
function wybierzGre() {
    for (let i = 0; i <= 3; i++) {
        if (rozmiar[i].checked) {
            uruchomGre(ROZMIARY[i][0], ROZMIARY[i][1]);
            return true;
        }
    }
}

/**
 * Uruchamia grę przy zadanych parametrach
 */
function uruchomGre(rozmiarPlanszyX, rozmiarPlanszyY) {
    formularz.hidden = true;
    formularz.style.display = "none";
    start.play();
    body.style.setProperty("--wiersze", rozmiarPlanszyY.toString());
    body.style.setProperty("--kolumny", rozmiarPlanszyX.toString());
    wynik[1].innerHTML = "0";
    wynik[2].innerHTML = "0";
    kolej = 1;
    const maks = rozmiarPlanszyX * rozmiarPlanszyY;
    do_odgadniecia = maks / 2;
    wzory = przygotujKarty(rozmiarPlanszyX, rozmiarPlanszyY);
    karty = [];
    for (let wiersz = 0; wiersz < rozmiarPlanszyY; wiersz++) {
        karty[wiersz] = [];
        for (let kolumna = 0; kolumna < rozmiarPlanszyX; kolumna++) {
            karty[wiersz].push(wzory.shift());
            img = document.createElement("img");
            img.id = zakodujAdres(wiersz, kolumna);
            img.className = 'button';
            zakryj(img);
            gra.appendChild(img);
            mozliweRuchy.push(img.id);
        }
    }
    if (zKomputerem) {
        for (let los = 0; los < maks * 3; los++) {
            zamien(mozliweRuchy, losuj(maks), losuj(maks));
        }
    }
    ustawGracza();
    poprzednia = [];
    isClickable = true;
}

/**
 * Przygotowuje karty do gry - wybiera pary kart, uklada je w tablicy i tasuje
 */
function przygotujKarty(x, y) {
    const obrazki = losujNumeryObrazkow();
    const temp = [];
    const maks = x * y;
    for (let i = 0; i < maks / 2; i++) {
        kolejnyNumer = obrazki.shift();
        temp.push(kolejnyNumer);
        temp.push(kolejnyNumer);
    }
    for (let los = 0; los < maks * 3; los++) {
        zamien(temp, losuj(maks), losuj(maks));
    }
    return temp;
}

/**
 * Losuje numery obrazków, żeby przy planszach mniejszych od maksymalnych nie były w każdej grze takie same
 */
function losujNumeryObrazkow() {
    const temp = [];
    for (let i = 0; i < 40; i++) {
        temp.push(numer(i));
    }
    for (let los = 0; los < 100; los++) {
        zamien(temp, losuj(40), losuj(40));
    }
    return temp;
}

/**
 * @returns Losuje liczbę od 0 do maks-1
 */
function losuj(maks) {
    return Math.floor(Math.random() * maks);
}

/**
 * @returns Losuje liczbę od a do b włącznie
 */
function od_do(a, b) {
    return (a >= b) ? 0 : a + losuj(b - a + 1);
}

/**
 * Zapisuje liczbę jako tekst, z zerem wiodącym dla liczb jednocyfrowych - żeby dopasować do nazw plików
 */
function numer(x) {
    return x.toString().padStart(2, "0");
}

/**
 * Wyciąga adres komórki z id - numer wiersza (indeks [1]) i kolumny (indeks [2])
 */
function odkodujAdres(id = "") {
    const lokal = id.split("-");
    lokal[1] = +lokal[1];
    lokal[2] = +lokal[2];
    return lokal;
}

/**
 * Zapisuje adres jako jeden string
 * @param wiersz
 * @param kolumna
 * @return {string} zapisany adres
 */
function zakodujAdres(wiersz, kolumna) {
    return `tile-${wiersz}-${kolumna}`;
}

/**
 * Obsługuje odkrycie karty - pokazuje odpowiedni obrazek, a w przypadku trafienia - usuwa karty ze stołu
 */
function pokaz(id) {
    if (!isClickable && !czyRuchKomputera()) {
        return false;
    }
    uncover.play();
    node = document.getElementById(id);
    indeksy = odkodujAdres(id);
    odkryj(node, indeksy);
    if (poprzednia.length !== 0) {
        isClickable = false; // zabezpieczenie przed dalszymi kliknięciami w czasie, gdy pokazywane są oba obrazki (żeby ktoś nie odkrył 3-4 obrazków na raz)
        setTimeout(() => {
            poprzedniNode = document.getElementById(zakodujAdres(poprzednia[1], poprzednia[2]));
            if (karty[indeksy[1]][indeksy[2]] === karty[poprzednia[1]][poprzednia[2]]) {
                correct.play();
                usunZeStolu(poprzedniNode);
                usunZeStolu(node);
                zwiekszWynik(kolej);
                if (--do_odgadniecia === 0) {
                    koniecGry();
                }
                poprzednia = [];
                if (zKomputerem) {
                    usunZMozliwychRuchow([poprzedniNode.id, node.id]);
                    pamiec[+karty[indeksy[1]][indeksy[2]]] = [];
                }
                if (czyRuchKomputera()) {
                    setTimeout(() => wykonajRuchKomputera(), 500);
                } else {
                    isClickable = true;
                }
            } else {
                wrong.play();
                zakryj(node);
                zakryj(poprzedniNode);
                poprzednia = [];
                zmienKolej();
            }
        }, 1000);
    } else {
        poprzednia = indeksy;
    }
}

/**
 * Zamienia miejscami elementy w tablicy
 */
function zamien(tablica, e1, e2) {
    lok = tablica[e1];
    tablica[e1] = tablica[e2];
    tablica[e2] = lok;
}

/**
 * Zakrywa kartę - pokazuje obrazek okładki
 */
function zakryj(node) {
    node.src = plikOkladki;
    node.setAttribute("onclick", "pokaz(this.id)");
}

/**
 * Odkrywa kartę - pokazuje obrazek odpowiadający karcie
 */
function odkryj(node, indeksy = []) {
    node.src = `inside_${karty[indeksy[1]][indeksy[2]]}.png`;
    node.setAttribute("onclick", "");
    if (zKomputerem) {
        zapamietaj(+karty[indeksy[1]][indeksy[2]], indeksy[1], indeksy[2]);
    }
}

/**
 * Usuwa znalezione karty ze stołu - podstawia pusty div w to miejsce
 */
function usunZeStolu(node) {
    const pusteMiejsce = document.createElement("div");
    gra.replaceChild(pusteMiejsce, node);
}

/**
 * Odczytuje wynik
 */
function odczytajWynik(ktory) {
    return +wynik[ktory].innerHTML;
}

/**
 * Zwiększa wynik o 1 (jako innerHTML)
 */
function zwiekszWynik(ktory) {
    wynik[ktory].innerHTML = (odczytajWynik(ktory) + 1).toString();
}

/**
 * Ustawia ramkę na aktualnego gracza
 */
function ustawGracza() {
    gracz[3 - kolej].style.borderStyle = "none";
    gracz[kolej].style.borderStyle = "outset";
}

/**
 * Zmienia kolejność gracza
 */
function zmienKolej() {
    kolej = 3 - kolej;
    nowyGracz = pokazOknoNaSrodku(300, 150, "black", "coral");
    nowyGracz.innerHTML = `<div>Teraz</div><div>${gracz[kolej].innerHTML}</div>`;
    gra.appendChild(nowyGracz);
    setTimeout(() => {
        gra.removeChild(nowyGracz);
        ustawGracza();
        if (czyRuchKomputera()) {
            wykonajRuchKomputera()
        } else {
            isClickable = true;
        }
    }, 1000);
}

/**
 * Obsługuje koniec gry
 */
function koniecGry() {
    koniec = pokazOknoNaSrodku();
    koniec.innerHTML = odczytajWynik(1) === odczytajWynik(2)
        ? "<div>REMIS !!!</div>"
        : odczytajWynik(1) > odczytajWynik(2)
            ? komunikatWygrana(gracz[1].innerHTML)
            : komunikatWygrana(gracz[2].innerHTML);
    endButton = dodajButton(koniec, "Brawo!", zrobReload);
    gra.appendChild(koniec);
    brawo.play();
}

/**
 * Przygotowuje komunikat o wygranej
 * @param imie Imię zwycieskiego gracza
 * @return Treść komunikatu
 */
function komunikatWygrana(imie) {
    const koncowka = ['a', 'A'].includes(imie[imie.length - 1]) ? 'a' : '';
    return `<div>Wygrał${koncowka}</div><div>${imie}</div>`;
}

/**
 * Zwraca element będący okienkiem na środku planszy gry
 */
function pokazOknoNaSrodku(width = 400, height = 250, fcolor = "#0000ff", bcolor = "#ffebcd") {
    node = document.createElement("div");
    node.setAttribute("class", "modal-window");
    node.style.setProperty("width", `${width}px`);
    node.style.setProperty("height", `${height}px`);
    node.style.setProperty("background-color", `${bcolor}`);
    node.style.setProperty("color", `${fcolor}`);
    node.style.setProperty("position", "absolute");
    node.style.top = "40%";
    node.style.left = "50%";
    node.style.transform = "translate(-50%, -50%)"; // Wyśrodkowanie
    return node;
}

/**
 * Dodaje przycisk OK do okienka, powodujący ponowne załadowanie strony
 */
function dodajButton(node, tekst, fn, szerokosc = 150) {
    button = document.createElement("div");
    button.innerHTML = tekst;
    button.setAttribute("class", "button-ok");
    button.style.width = `${szerokosc}px`;
    button.addEventListener("click", fn);
    node.appendChild(button);
    return button;
}

/**
 * Ustawia wartości elementów html zależne od wybranego poziomu gry - liczbowa wartość oraz imię gracza 2 (komputer)
 * @param value aktualna wartość poziomu
 */
function ustawPoziomKomputera(value) {
    procent.textContent = `${value}%`;
    komputerName = KOMPUTER_NAME_LIST[Math.floor(Math.min(value, 99) / 10)];
    if (zKomputerem) {
        player2.value = komputerName;
    }
}

/**
 * Dopsowuje elementy html do gracza człowiek lub gracza komputer
 */
function przelaczKomputerGracz() {
    zKomputerem = !zKomputerem;
    if (zKomputerem) {
        humanName = player2.value;
        player2.value = komputerName;
        player2.disabled = true;
        poziom.disabled = false;
        intro.disabled = false;
    } else {
        player2.value = humanName;
        player2.disabled = false;
        poziom.disabled = true;
        intro.disabled = true;
    }
}

/**
 * Sprawdza, który element tablicy jest "checked"
 * @param tablica - tablica do przejrzenia
 * @return numer pozycji, która jest checked
 */
function ktoryChecked(tablica) {
    for (let i = 0; i < tablica.length; i++) {
        if (tablica[i].checked === true) {
            return i;
        }
    }
    return 0;
}

/**
 * Zapamiętuje odkryte karty
 * @param nrKarty Nr karty do zapamiętania
 * @param wiersz Lokalizacja - nr wiersza
 * @param kolumna Lokalizacja - nr kolumny
 */
function zapamietaj(nrKarty, wiersz, kolumna) {
    if (losuj(100) < poziom.value) {            // prawdopodobieństwo zapamiętania = wybrany poziom
        let indeks = zakodujAdres(wiersz, kolumna);
        if ((pamiec[nrKarty].length === 0) ||
            (pamiec[nrKarty].length === 1 && pamiec[nrKarty][0] !== indeks)) {
            pamiec[nrKarty].push(indeks);
            usunZMozliwychRuchow([indeks]);  // jeżeli zapamiętał, usuń z możliwych ruchów
        }
    } else {
        if (czyRuchKomputera()) { // jeżeli nie zapamiętał, przenieś ten ruch w inne miejsce kolejki
            zamien(mozliweRuchy, 0, od_do(1, mozliweRuchy.length - 1));
        }
    }
}

/**
 * Usuwa odgadnięte karty z możliwych do wykonania ruchów
 * @param ids Tablica z odgadniętymi kartami
 */
function usunZMozliwychRuchow(ids = []) {
    for (let i = 0; i < mozliweRuchy.length; i++) {
        if (ids.includes(mozliweRuchy[i])) {
            mozliweRuchy[i] = null;
        }
    }
    mozliweRuchy = mozliweRuchy.filter(Boolean);
}

/**
 * Sprawdza, czy teraz rusza się komputer
 * @return true, jeżeli rusza się komputer
 */
function czyRuchKomputera() {
    return zKomputerem && (kolej === 2);
}

/**
 * Sprawdza, czy i której karty są znane oba położenia
 * @return numer karty, której oba położenia są zapamiętane, lub 99, jeśli nie ma takiej karty
 */
function znajdzPodwojny() {
    for (let i = 0; i < 40; i++) {
        if (pamiec[i].length === 2) {
            return i;
        }
    }
    return 99;
}

/**
 * Sprawdza, czy jest w pamięci inna lokalizacja takiej samej karty
 * @param pamiecElement Pamięć - tablica; może zawierać 0, 1 lub 2 elmenty, może zawierać odkrytą kartę lub nie
 * @param odkryta Karta do znalezienia
 * @return Adres znalezionej drugiej lokalizacji karty lub "", jeżeli nie ma w pamięci drugiej lokalizacji
 */
function znajdzInnaKarte(pamiecElement = [], odkryta) {
    if (pamiecElement.length === 0) {
        return "";
    }
    for (let i = 0; i < pamiecElement.length; i++) {
        if (pamiecElement[i] !== odkryta) {
            return pamiecElement[i];
        }
    }
    return "";
}

/**
 * Obsługuje ruch gracza komputer
 */
function wykonajRuchKomputera() {
    const ruch = znajdzPodwojny();
    if (ruch !== 99) {
        pokaz(pamiec[ruch].shift());
        setTimeout(() => pokaz(pamiec[ruch].shift()), 1000);
    } else {
        const odkryta = mozliweRuchy[0];
        const indeksy = odkodujAdres(odkryta);
        const numerKarty = +karty[indeksy[1]][indeksy[2]];
        pokaz(odkryta);
        const inna = znajdzInnaKarte(pamiec[numerKarty], odkryta);
        if (inna !== "") {
            setTimeout(() => pokaz(inna), 1000);
        } else {
            setTimeout(() => pokaz(mozliweRuchy[0]), 1000);
        }
    }
}

/**
 * Odtwarza film w ramach intro dla gracza komputera
 * @param title Nazwa pliku z filmem
 * @param width rozmiar okna filmu - szerokość
 * @param height rozmiar okna filmu - wysokość
 */
function odtworzIntro(title, width = 480, height = 270) {
    const video = document.createElement("video");
    video.src = title; // Ścieżka do pliku
    video.autoplay = false;
    video.controls = false;
    video.style.position = "absolute";
    video.style.top = "50%";
    video.style.left = "50%";
    video.style.transform = "translate(-50%, -50%)";
    video.style.width = `${width}px`;
    video.style.height = `${height}px`;
    document.body.appendChild(video);
    video.play();
    return video;
}

/**
 * Ponownie ładuje stronę
 */
function zrobReload() {
    koniec.removeChild(endButton);
    ekranPowitalny();
}
