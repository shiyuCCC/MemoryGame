// Alex Franklin, #2342810
// Brian Ward, #1685448
// Shiyu Cai #2339433


// Global state variables to track game status. They track the current state of the game, selected cards,
// number of attempts, number of pairs found, limit of attempts and if the game is being played.

let gameState = {}; // object that stores current game state (cards, card IDs, img, alt)
let attempts = 0;
let selectedCards = []; // length of 2, stores selected cards 
let pairsFound = 0;
let attemptLimit = 0;
let playing = false;
let startTime; // starts when game starts 
let endTime; // ends when game ends 
let totalTime; // calculate the seconds of gameplay 
let elapsedTime; // current time - starttime / 1000 (used to display time as its updating)
let gameTimer; // stores timer - set Timeout - used to clear 
let timeLimit; // max time for each game mode 
let loseCount; // in event user runs out of time/attempts - losecount increments - doesnt execute code in endGame twice 



// Restart button - starts game as hidden 
$(".restartBtn").hide();
// executes restart() if clicked 
$(".restartBtn").on("click", function () {
  restart(true);
});

// Function to initialize the game when a difficulty button is clicked
$(".difficulty").click(function () {
  // Change active button style
  $(".difficulty").removeClass("active");
  $(this).addClass("active");
  // reserts lose count 
  loseCount = 0;

  // show game board, timer/attempts, restart button 
  $(".game-board, .output, .restartBtn").show();
  // hides memory instructions/buttons 
  toggleButtons();

  // Initialize the game with the chosen difficulty using switch 
  // calls initialise game function. 
  switch ($(this).data("difficulty")) {
    case "easy":
      timeLimit = Infinity;
      initializeGame(8, Infinity, timeLimit); // Easy mode: 8 pairs, unlimited attempts
      break;
    case "medium":
      timeLimit = 50000;
      initializeGame(8, 8, timeLimit); // Medium mode: 8 pairs, 8 attempts ** Time limit 50 seconds 
      break;
    case "hard":
      timeLimit = 90000;
      $(".game-board").addClass("narrow");
      initializeGame(12, 15, timeLimit); // Hard mode: 12 pairs, 15 attempts ** Time limit 90 seconds 
      break;
  }
});

/**
 *  Function to initialize the game. 
 * @param {int} pairCount - amount of pairs 
 * @param {int} limit - amount of attempts allowed
 * @param {int} timeLimit - time limit in milliseconds 
 */


function initializeGame(pairCount, limit, timeLimit) {
  // Reset game state
  // emtying/resetting global variables 
  gameState = {};
  attempts = 0;
  pairsFound = 0;
  attemptLimit = limit;
  selectedCards = [];
  playing = true;

  // displays attempts live - updates text on screen 
  // ternary operator - easy shows attempts, med/hard shows attempts left 
  $(".attempts").text(
    attemptLimit === Infinity
      ? `Attempts: ${attempts}`
      : `Attempts remaining: ${attemptLimit}`
  );

  // cards - calls generateAndShuffleCards function, stores its return value in cards[] 
  let cards = generateAndShuffleCards(pairCount);

  // Assign the shuffled cards to the game state object 
  for (const card of cards) {
    gameState[card.id] = { isRevealed: false, img: card.img, alt: card.alt };
  }

  // Generate the card layout on the page
  generateCardLayout();
  // reset start time based on date 
  startTime = new Date();
  // updates new time every second to display on page using updateTimer function 
  setInterval(updateTimer, 1000);

  // if not on easy,  setTimeout for endGame(false) based on timeLimit parameter, store in gameTimer to clearTimer if needed. 
  if (attemptLimit != Infinity) {
    gameTimer = setTimeout(endGame, timeLimit, false);
  }
}

/**
 * // Function to generate and shuffle the cards and returns cards array 
 * @param {int} pairCount - amount of pairs on each board
 * @returns cards[]
 */

function generateAndShuffleCards(pairCount) {
  // cards - empty array 
  let cards = [];
  // img alts 
  let imgAlts = [
    "bear",
    "pig",
    "frog",
    "bunny",
    "cat",
    "elephant",
    "lemon",
    "apple",
    "watermelon",
    "banana",
    "pear",
    "strawberry",
  ];

  // Generate the cards
  // runs amount of pair counts, to generate necessary pairs of cards 
  for (let i = 1; i <= pairCount; i++) {
    let imgPath =
      i <= 6 ? `../Images/animals-${i}.jpg` : `../Images/fruits-${i - 6}.jpg`;
    // pushes card object into card array - twice for pairs in each iteration 
    cards.push({ id: i, img: imgPath, alt: imgAlts[i - 1] });
    cards.push({ id: i + pairCount, img: imgPath, alt: imgAlts[i - 1] });
  }

  // returns card array 
  return cards;
}



// Function to generate the card layout on the page.
function generateCardLayout() {
  // Clear the game board
  $(".game-board").empty();

  // // Shuffle game state entries
  let gameEntries = Object.entries(gameState);

  // Fisher-Yates Shuffle
  for (let i = gameEntries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameEntries[i], gameEntries[j]] = [gameEntries[j], gameEntries[i]];
  }

  // Add card elements to the game board
  for (const [id, card] of gameEntries) {
    let cardElement = $(
      `<div class="card" data-card-id="${id}"><div class="card-inner"><img class="card-back" src="../Images/card-back.png" alt="back of card"><img class="card-image" src="${card.img}" alt="${card.alt}"></div></div>`
    );

    $(".game-board").append(cardElement);
  }

  // calls flipCard() function 
  $(".card").click(function () {
    let cardId = $(this).data("card-id");
    flipCard(cardId); // Flip the card when it's clicked
  });
}



/**
 * // Function to flip a card. Takes the card id as a parameter.
 * @param {int} cardId - takes in card id
 * @returns - exit function 
 */
function flipCard(cardId) {
  if (!playing || selectedCards.length === 2) return; // If the game is not playing or two cards are already selected, do nothing
  let card = gameState[cardId]; // retrieves card Id from gameState 
  if (card.isRevealed) return; // If the card is already revealed, do nothing

  // Reveal the card
  card.isRevealed = true;
  // toggle class to flipped - css 
  $(`[data-card-id="${cardId}"] .card-inner`).toggleClass("flipped");
  // push card id to selected cards array for comparison 
  selectedCards.push(cardId);

  // If two cards are selected, check for a match
  if (selectedCards.length === 2) {
    // set timer to show the last card - calls checkMatch() function 
    setTimeout(checkMatch, 600);
  }
}

// Function to check if the two selected cards are a match.
function checkMatch() {
  if (gameState[selectedCards[0]].img === gameState[selectedCards[1]].img) {
    // If the cards match, increase the count of pairs found
    pairsFound++;

    // If all pairs have been found, the player wins the game
    if (pairsFound === Object.keys(gameState).length / 2) {
      setTimeout(() => {
        // endGame(true) - game won
        endGame(true);
      }, 600);

    }
    selectedCards = [];
    // pair found, game not won yet
  } else {
    // If the cards do not match, increase the count of attempts and flip the cards back
    attempts++;
    // changing .attempts to red and set to bold when it reached 3 
    if (attemptLimit - attempts == 3) {
      $(".attempts").css("color", "red").css("font-weight", "bold");
    }

    // Update the attempt counter display based on playing mode 
    if (attemptLimit !== Infinity) {
      $(".attempts").text(`Attempts remaining: ${attemptLimit - attempts}`);
    } else if (attemptLimit == Infinity) {
      $(".attempts").text(`Attempts: ${attempts}`);
    }
    // if cards don't match 
    setTimeout(() => {
      for (const cardId of selectedCards) {
        gameState[cardId].isRevealed = false;
        $(`[data-card-id="${cardId}"] .card-inner`).toggleClass("flipped");
      }
      selectedCards = [];

      // If the attempt limit is reached, the game is over
      if (attempts == attemptLimit) {
        // clearTimeout - end timer
        clearTimeout(gameTimer)
        setTimeout(() => {
          //endGame(false) - lost
          endGame(false);
          // }
        }, 600);
      }
    }, 600);
  }
}

// displays timer on page as game is playing 
function updateTimer() {
  if (!playing) return;
  const currentTime = new Date();
  // calculating current time - start time / 1000 : shows time elapsed 
  elapsedTime = Math.floor((currentTime - startTime) / 1000);
  $(".timer").text(`Timer: ${elapsedTime} seconds`);
  // easy - display time as is 
  if (timeLimit == Infinity) {
    $(".timer").text(`Timer: ${elapsedTime} seconds`);
    // med/hard  - display count down 
  } else {
    let timeLeft = timeLimit / 1000 - elapsedTime;
    $(".timer").text(`Timer: ${timeLeft} seconds left`);
    // change .timer colour to red when 10 seconds left 
    if (timeLeft == 10) {
      $(".timer").css("color", "red").css("font-weight", "bold");
    }
  }
}
/**
 * // resets css, hides game board/reset btn, removes narrow class, sets elapsed time to 0 and playing - false 
 * @param {boolean} restartRequest - true if restart btn was clicked, false if game ended through win/lose
 */

function restart(restartRequest) {
  clearTimeout(gameTimer);
  $(".timer, .attempts").css("color", "black").css("font-weight", "normal");
  $(".restartBtn,.game-board").hide();
  $(".game-board").removeClass("narrow");
  elapsedTime = 0;
  playing = false;

  $(".output").hide()

  // if restart, it calls toggleButtons() function (reused at bottom of endGame so we need to toggle here as well )
  if (restartRequest) {
    toggleButtons();

  }
}

/**
 * // calls restart(false) to reset board, determine output based on win/lose scenarios 
 * @param {boolean} result - did win, or not.
 */
function endGame(result) {
  // get gameTime before elapsed time is removed by restart() function 
  let gameTime = elapsedTime;
  // call restart to remove board - false 
  restart(false);
  // initialises message variables 
  let messageH1;
  let messageP;
  // loseCount increments (in case two loses occur at once, code execute only once)
  loseCount++;

  // if we win - clear timeout and set message variables - call endTimeout function 
  if (result) {
    clearTimeout(gameTimer)
    messageH1 = "Congratulations! You've won!!";
    messageP = "You used " + attempts + " attempts <br> It took you " + gameTime + " seconds to finish";
    endTimeout(messageH1, messageP)
    // exits function - does not execute a second time. 
  } else if (loseCount == 2) {
    return;
    // losing messages = call endTimeout function  
  } else {
    messageH1 = "Too bad, you lost.";
    if (attempts === attemptLimit) {
      messageP = "You ran out of tries";
      endTimeout(messageH1, messageP)
    } else {
      messageP = "You ran out of time.";
      endTimeout(messageH1, messageP)
    }
  }

}
/**
 * // displays messages in browser for 4 seconds 
 * @param {string} messageH1 - winning/losing message 
 * @param {string} messageP - details message for p 
 */

function endTimeout(messageH1, messageP) {
  $(".endH1").html(messageH1);
  $(".endP").html(messageP);
  setTimeout(function () {
    // empties .endGame (h1 and p) 
    $(".endGame").html("");
    // used in other function - toggles game intro 
    toggleButtons();
  }, 4000);
}


// toggles game intro - used in many functions 
function toggleButtons() {
  $(".gameIntro").toggle();
}
