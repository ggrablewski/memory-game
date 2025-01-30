const OKLADKA_BLUE = `cover_blue.png`;
const OKLADKA_RED = `cover_red.png`;
const ROZMIARY = [ [4,3], [6,5], [9,6], [10,8] ];
let karty = [], poprzednia = [], wzory;                                         // tablice z liczbami
let body, formularz, gra, wynik = [], gracz = [];                               // elementy html
let player1, player2, komputer, rozmiar = [], okladka = [], poziom, procent;    // formularz
let do_odkrycia;                                                                // ile kart do końca
let isClickable, kolej, plikOkladki;                                            // flagi, ustawienia
const start = new Audio("start.mp3");
const uncover = new Audio("bounce_1.mp3");
const wrong = new Audio("bounce_2.mp3");
const correct = new Audio("dog.mp3");
const zmiana = new Audio("lamb.mp3");
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
    body = document.body;
    gra = document.querySelector("#gra");
    wynik[1] = document.querySelector("#wynik1");
    wynik[2] = document.querySelector("#wynik2");
    gracz[1] = document.querySelector("#gracz1");
    gracz[2] = document.querySelector("#gracz2");
    dodajButton(formularz, "Zaczynamy!", ustawGre, 500);    
    ekranPowitalny();
});

/**
 * Uruchamia ekran powitalny z formularzem
 */
function ekranPowitalny() {
    gra.replaceChildren([]);  // Wyczyść stół do gry
    formularz.hidden = false;
    player1.value = gracz[1].innerHTML; // wybory domyślne
    player2.value = gracz[2].innerHTML;
    rozmiar[1].checked = true;
    okladka[1].checked = true;
    poziom.addEventListener("input", () => { procent.textContent = `${poziom.value}%`; });
}

/**
 * Zbiera z formularza ustawienia gry i ją wywołuje z odpowiednimi parametrami
 */
function ustawGre() {
    plikOkladki = okladka[0].checked ? OKLADKA_RED : OKLADKA_BLUE;
    gracz[1].innerHTML = player1.value;
    gracz[2].innerHTML = player2.value;
    for (i = 0; i <= 3; i++) {
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
    start.play();
    body.style.setProperty("--wiersze", rozmiarPlanszyY.toString());
    body.style.setProperty("--kolumny", rozmiarPlanszyX.toString());
    wynik[1].innerHTML = "0";
    wynik[2].innerHTML = "0";
    kolej = 1;
    wzory = przygotujKarty(rozmiarPlanszyX, rozmiarPlanszyY);
    do_odkrycia = rozmiarPlanszyX * rozmiarPlanszyY / 2;
    ustawGracza();
    for (wiersz=0; wiersz<rozmiarPlanszyY; wiersz++) {
        karty[wiersz]=[];
        for (kolumna=0; kolumna<rozmiarPlanszyX; kolumna++) {
            karty[wiersz].push(wzory.shift());
            img = document.createElement("img");
            img.id = `tile-${wiersz}-${kolumna}`;
            img.className = 'button';
            zakryj(img);
            gra.appendChild(img);
        }
    };
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
function od_do(a,b) {
    return a + losuj(b-a+1);
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
function adres(id) {
    const lokal = id.split("-");
    lokal[1]=+lokal[1];
    lokal[2]=+lokal[2];
    return lokal;
}

/**
 * Obsługuje odkrycie karty - pokazuje odpowiedni obrazek, a w przypadku trafienia - usuwa karty ze stołu
 */
function pokaz(id) {
    if (!isClickable) { 
        return false; 
    }
    uncover.play();
    node = document.getElementById(id);
    indeksy = adres(id);
    odkryj(node, indeksy);
    if (poprzednia.length!==0) {
        isClickable = false; // zabezpieczenie przed dalszymi kliknięciami w czasie, gdy pokazywane są oba obrazki (żeby ktoś nie odkrył 3-4 obrazków na raz)
        setTimeout(() => {
            poprzedniNode = document.getElementById(`tile-${poprzednia[1]}-${[poprzednia[2]]}`);
            if (karty[indeksy[1]][indeksy[2]]===karty[poprzednia[1]][poprzednia[2]]) {
                correct.play();
                usunZeStolu(poprzedniNode);
                usunZeStolu(node);
                zwiekszWynik(kolej);
                poprzednia=[];
                isClickable = true;
                if (--do_odkrycia == 0) {
                    koniecGry();
                }
                return true;
            }
            wrong.play();
            zakryj(node);
            zakryj(poprzedniNode);
            poprzednia=[];
            zmienKolej();
        }, 1000);
    } else {
        poprzednia=indeksy;
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
}

/**
 * Usuwa znalezione karty ze stołu - podstawia pusty div w to miejsce
 */
function usunZeStolu(node) {
    const pusteMiejsce = document.createElement("div");
    gra.replaceChild(pusteMiejsce, node);
}

/**
 * Przygotowuje karty do gry - wybiera pary kart, uklada je w tablicy i tasuje
 */
function przygotujKarty(x, y) {
    const obrazki = losujNumeryObrazkow();
    const temp = [];
    const maks = x * y;
    for (i=0; i<maks/2; i++) {
        kolejnyNumer = obrazki.shift();
        temp.push(kolejnyNumer);
        temp.push(kolejnyNumer);
    }
    for (los=0; los<maks*3; los++) {
        zamien(temp, losuj(maks), losuj(maks));
    }
    return temp;
}

/**
 * Losuje numery obrazków, żeby przy planszach mniejszych od maksymalnych nie były w każdej grze takie same
 */
function losujNumeryObrazkow() {
    const temp = [];
    for (i=0; i<40; i++) {
        temp.push(numer(i));
    }
    for (los=0; los<100; los++) {
        zamien(temp, losuj(40), losuj(40));
    }
    return temp;
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
    wynik[ktory].innerHTML = (odczytajWynik(ktory)+1).toString();
}

/**
 * Ustawia ramkę na aktualnego gracza
 */
function ustawGracza() {
    gracz[3-kolej].style.borderStyle = "none";
    gracz[kolej].style.borderStyle = "outset";
    isClickable = true;
}

/**
 * Zmienia kolejność gracza
 */
function zmienKolej() {
    kolej = 3 - kolej;
    nowyGracz = pokazOknoNaSrodku(200, 150, "black", "coral");
    nowyGracz.innerHTML = `<div>Teraz</div><div>${gracz[kolej].innerHTML}</div>`;
    gra.appendChild(nowyGracz);
    setTimeout(() => {
        gra.removeChild(nowyGracz);
        ustawGracza();
    }, 1000);
    zmiana.play();
}

/**
 * Obsługuje koniec gry
 */
function koniecGry() {
    koniec = pokazOknoNaSrodku();
    koniec.innerHTML = odczytajWynik(1)===odczytajWynik(2)
        ? "<div>REMIS !!!</div>"
        : odczytajWynik(1)>odczytajWynik(2)
            ? `<div>Wygrał</div><div>${gracz[1].innerHTML}</div>`
            : `<div>Wygrał</div><div>${gracz[2].innerHTML}</div>`;
    dodajButton(koniec, "Brawo!", zrobReload);
    gra.appendChild(koniec);
    brawo.play();
}

/**
 * Zwraca element będący okienkiem na środku planszy gry
 */
function pokazOknoNaSrodku (width = 400, height = 250, fcolor = "#0000ff", bcolor = "#ffebcd") {
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
}

/**
 * Ponownie ładuje stronę
 */
function zrobReload() {
    ekranPowitalny();
}
