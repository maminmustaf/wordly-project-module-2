const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const searchForm = document.getElementById("searchForm");
const wordInput = document.getElementById("wordInput");
const searchBtn = document.getElementById("searchBtn");
const closeBtn = document.getElementById("closeBtn");

const loading = document.getElementById("loading");
const error = document.getElementById("error");

const wordTitle = document.getElementById("wordTitle");
const phonetic = document.getElementById("phonetic");
const audioBtn = document.getElementById("audioBtn");
const favoriteBtn = document.getElementById("favoriteBtn");

const meaningsContainer = document.getElementById("meaningsContainer");

const sourceLink = document.getElementById("sourceLink");

const favoritesContainer = document.getElementById("favoritesContainer");
const favoritesEmpty = document.getElementById("favoritesEmpty");

const themeBtn = document.getElementById("themeBtn");

let currentWord = null;
let currentAudio = "";

document.addEventListener("DOMContentLoaded", () => {

    loadTheme();

    displayFavorites();

    wordInput.focus();

});

searchForm.addEventListener("submit", searchWord);

async function searchWord(event){

    event.preventDefault();

    const word = wordInput.value.trim();

    clearError();

    if(word === ""){

        showError("Please enter a word.");

        return;

    }

    showLoading(true);

    try{

        const response = await fetch(API_URL + encodeURIComponent(word));

        if(!response.ok){

            throw new Error("Word not found.");

        }

        const data = await response.json();

        currentWord = data[0];

        displayWord(currentWord);

    }

    catch{

        showError("Word not found.");

        resetCard();

    }

    finally{

        showLoading(false);

    }

}

function showLoading(state){

    if(state){

        loading.classList.remove("hidden");

        searchBtn.disabled = true;

    }

    else{

        loading.classList.add("hidden");

        searchBtn.disabled = false;

    }

}

function showError(message){

    error.textContent = message;

    error.classList.remove("hidden");

}

function clearError(){

    error.textContent = "";

    error.classList.add("hidden");

}

function resetCard(){

    wordTitle.textContent = "Search a word...";

    phonetic.textContent = "Pronunciation will appear here.";

    sourceLink.textContent = "Source link will appear here.";

    sourceLink.href = "#";

    currentAudio = "";

    favoriteBtn.textContent = "☆";

    favoriteBtn.classList.remove("saved");

    meaningsContainer.innerHTML = "";

}
function displayWord(entry){

    wordTitle.textContent = entry.word;

    phonetic.textContent =
        entry.phonetic ||
        entry.phonetics.find(item => item.text)?.text ||
        "Pronunciation unavailable.";

    currentAudio = "";

    const audio = entry.phonetics.find(item => item.audio);

    if(audio){

        currentAudio = audio.audio;

    }

    meaningsContainer.innerHTML = "";

    entry.meanings.forEach(meaning =>{

        const section = document.createElement("div");
        section.className = "meaning";

        const part = document.createElement("h3");
        part.className = "partOfSpeech";
        part.textContent = meaning.partOfSpeech;

        section.appendChild(part);

        const definitions = document.createElement("div");
        definitions.className = "definitions";

        meaning.definitions.forEach((definition,index)=>{

            const paragraph = document.createElement("p");

            paragraph.textContent =
                `${index + 1}. ${definition.definition}`;

            definitions.appendChild(paragraph);

        });

        section.appendChild(definitions);

        const examples = document.createElement("div");
        examples.className = "examples";

        examples.innerHTML = "<h4>Examples</h4>";

        const exampleList = document.createElement("ul");
        exampleList.className = "exampleList";

        const availableExamples =
            meaning.definitions.filter(item => item.example);

        if(availableExamples.length){

            availableExamples.forEach(item=>{

                const li = document.createElement("li");

                li.textContent = item.example;

                exampleList.appendChild(li);

            });

        }

        else{

            const li = document.createElement("li");

            li.textContent = "No examples available.";

            exampleList.appendChild(li);

        }

        examples.appendChild(exampleList);

        section.appendChild(examples);

        const synonyms = document.createElement("div");
        synonyms.className = "synonyms";

        synonyms.innerHTML = `
            <h4>Synonyms</h4>
            <p class="synonymText">
                ${collectSynonyms(meaning)}
            </p>
        `;

        section.appendChild(synonyms);

        const antonyms = document.createElement("div");
        antonyms.className = "antonyms";

        antonyms.innerHTML = `
            <h4>Antonyms</h4>
            <p class="antonymText">
                ${collectAntonyms(meaning)}
            </p>
        `;

        section.appendChild(antonyms);

        meaningsContainer.appendChild(section);

    });

    if(entry.sourceUrls && entry.sourceUrls.length){

        sourceLink.href = entry.sourceUrls[0];

        sourceLink.textContent = entry.sourceUrls[0];

    }

    else{

        sourceLink.href = "#";

        sourceLink.textContent = "No source available.";

    }

    updateFavoriteButton();

}
function collectSynonyms(meaning){

    const synonyms = new Set();

    if(meaning.synonyms){

        meaning.synonyms.forEach(word => synonyms.add(word));

    }

    meaning.definitions.forEach(definition=>{

        if(definition.synonyms){

            definition.synonyms.forEach(word=>synonyms.add(word));

        }

    });

    return synonyms.size
        ? [...synonyms].join(", ")
        : "No synonyms available.";

}

function collectAntonyms(meaning){

    const antonyms = new Set();

    if(meaning.antonyms){

        meaning.antonyms.forEach(word=>antonyms.add(word));

    }

    meaning.definitions.forEach(definition=>{

        if(definition.antonyms){

            definition.antonyms.forEach(word=>antonyms.add(word));

        }

    });

    return antonyms.size
        ? [...antonyms].join(", ")
        : "No antonyms available.";

}

audioBtn.addEventListener("click",()=>{

    clearError();

    if(currentAudio === ""){

        showError("No pronunciation audio available.");

        return;

    }

    const audio = new Audio(currentAudio);

    audio.play();

});

closeBtn.addEventListener("click",()=>{

    wordInput.value = "";

    clearError();

    resetCard();

    wordInput.focus();

});

favoriteBtn.addEventListener("click",()=>{

    if(!currentWord){

        return;

    }

    const favorites = getFavorites();

    const exists = favorites.some(item=>
        item.word.toLowerCase() === currentWord.word.toLowerCase()
    );

    if(exists){

        removeFavorite(currentWord.word);

    }

    else{

        addFavorite(currentWord);

    }

});
function getFavorites(){

    return JSON.parse(localStorage.getItem("favorites")) || [];

}

function saveFavorites(favorites){

    localStorage.setItem("favorites", JSON.stringify(favorites));

}

function addFavorite(word){

    const favorites = getFavorites();

    favorites.push({

        word: word.word,

        phonetic:
            word.phonetic ||
            word.phonetics.find(item => item.text)?.text ||
            "Pronunciation unavailable."

    });

    saveFavorites(favorites);

    displayFavorites();

    updateFavoriteButton();

}

function removeFavorite(word){

    const favorites = getFavorites().filter(item=>
        item.word.toLowerCase() !== word.toLowerCase()
    );

    saveFavorites(favorites);

    displayFavorites();

    updateFavoriteButton();

}

function updateFavoriteButton(){

    if(!currentWord){

        favoriteBtn.textContent = "☆";

        favoriteBtn.classList.remove("saved");

        return;

    }

    const favorites = getFavorites();

    const exists = favorites.some(item=>
        item.word.toLowerCase() === currentWord.word.toLowerCase()
    );

    if(exists){

        favoriteBtn.textContent = "★";

        favoriteBtn.classList.add("saved");

    }

    else{

        favoriteBtn.textContent = "☆";

        favoriteBtn.classList.remove("saved");

    }

}

function displayFavorites(){

    const favorites = getFavorites();

    favoritesContainer.innerHTML = "";

    favoritesEmpty.style.display =
        favorites.length ? "none" : "block";

    favorites.forEach(item=>{

        const card = document.createElement("div");

        card.className = "favorite-card";

        card.innerHTML = `
            <h3>${item.word}</h3>

            <p>${item.phonetic}</p>

            <div class="favorite-actions">

                <button class="search-again">
                    Search
                </button>

                <button class="remove-btn">
                    Remove
                </button>

            </div>
        `;

        card.querySelector(".search-again").addEventListener("click",()=>{

            wordInput.value = item.word;

            searchWord(new Event("submit"));

        });

        card.querySelector(".remove-btn").addEventListener("click",()=>{

            removeFavorite(item.word);

        });

        favoritesContainer.appendChild(card);

    });

}
themeBtn.addEventListener("click", toggleTheme);

function toggleTheme(){

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){

        themeBtn.textContent = "☀️";

        localStorage.setItem("theme","dark");

    }

    else{

        themeBtn.textContent = "🌙";

        localStorage.setItem("theme","light");

    }

}

function loadTheme(){

    const theme = localStorage.getItem("theme");

    if(theme === "dark"){

        document.body.classList.add("dark");

        themeBtn.textContent = "☀️";

    }

    else{

        document.body.classList.remove("dark");

        themeBtn.textContent = "🌙";

    }

}

window.addEventListener("keydown",(event)=>{

    if(event.key === "/"){

        if(document.activeElement !== wordInput){

            event.preventDefault();

            wordInput.focus();

        }

    }

});

window.addEventListener("load",()=>{

    loadTheme();

    displayFavorites();

    wordInput.focus();

});
