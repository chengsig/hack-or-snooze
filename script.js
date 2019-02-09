/// global flag to easily tell if we're logged in
let LOGGED_IN = false;

// global storyList variable
let storyList;

// global user variable
let user;

// let's see if we're logged in
let token = localStorage.getItem("token");
let username = localStorage.getItem("username");

if (token && username) {
  LOGGED_IN = true;
}

$(document).ready(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navLoggedinOptions = $('#nav-loggedin-options');
  const $favoritedArticles = $('#favorited-articles');
  const $removeIcon = '<i class="fas fa-trash-alt"></i>';

  // if there is a token in localStorage, call User.stayLoggedIn
  //  to get an instance of User with the right details
  //  this is designed to run once, on page load
  if (LOGGED_IN) {
    const userInstance = await User.stayLoggedIn();
    // we've got a user instance now
    user = userInstance;

    // let's build out some stories
    await generateStories();
    checkForFavs();
    // and then display the navigation
    showNavForLoggedInUser();

    //unhide the submit new story form 
    $submitForm.removeClass("hidden");
  } else {
    // we're not logged in, let's just generate stories and stop there
    await generateStories();
    console.log("here");
  }

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */
  $loginForm.on("submit", async function(e) {
    e.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    user = userInstance;
    LOGGED_IN = true;
    loginAndSubmitForm();
    checkForFavs();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */
  $createAccountForm.on("submit", async function(e) {
    e.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    user = newUser;
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */
  $navLogOut.on("click", function(e) {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */
  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event Handler for Clicking Favorites Btn
   */
  $('#favorites').on("click",async function(e){
    $favoritedArticles.empty();
    generateFavStories();
    $favoritedArticles.removeClass("hidden");
    $allStoriesList.hide();
  });

  /**
   * Event handler for Navigation to Homepage
   */
  $("body").on("click", "#nav-all", async function() {
    hideElements();
    $allStoriesList.show();
    $favoritedArticles.addClass("hidden");
    $submitForm.show();
  });

  /**
   * A rendering function to run to reset the forms and hide the login info
   */
  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // show new story form
    $submitForm.removeClass("hidden");

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * Event handler for new story submit
   */
  $submitForm.on("submit", async function(e) {
    e.preventDefault(); 

    let newStoryObj = {
      "author": $("#author").val(),
      "title": $("#title").val(),
      "url": $("#url").val()
    }
    
    let newStory = await storyList.addStory(user, newStoryObj);

    let result = generateStoryHTML(newStory, $removeIcon);

    $allStoriesList.append(result);
  });

  /** 
   * Event handler for favorite heart icon
   */
  $("body").on("click", "li .fa-heart", function(e){
    if($(e.target).hasClass("far")){
      user.addFavStory($(e.target).closest("li").attr('id'));
    } else {
      user.deleteFavStory($(e.target).closest("li").attr('id'));
    }
    $(e.target).toggleClass("far fas");
  })

  /**
   * Event handler for trach/delete/remove icon
   */
  $("body").on("click", "li .fa-trash-alt", async function(e){
    let storyID = $(e.target).closest("li").attr('id');
    await storyList.deleteStory(storyID);
    //remove from DOM
    $(e.target).closest("li").remove();
  })
  

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance.
   *  Then render it
   */
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();
    // loop through all of our stories and generate HTML for them
    storyList.stories.forEach(generateNewStory)
  }

  /**
   * Generates favorite stories from user's list of favorite stories
   */
  async function generateFavStories() {
    user.favorites.forEach(generateNewFavStory);
  } 

  /**
   * Append new story to DOM
   */
  function generateNewStory(newStory) {
    var ownStoryStatus = "";
    if(LOGGED_IN){
      ownStoryStatus = checkOwnStory(newStory);
    }
    const result = generateStoryHTML(newStory, ownStoryStatus);

    $allStoriesList.append(result);
  }

  /**
   * Append favorite stories to DOM
   */
  function generateNewFavStory(favStory){
    var ownStoryStatus = checkOwnStory(favStory);
    const favStoryHTML = generateStoryHTML(favStory,ownStoryStatus,"fas");
    $favoritedArticles.append(favStoryHTML);
  }


  

  /**
   * A function to render HTML for an individual Story instance
   */
  function generateStoryHTML(story, ownStoryStatus = "", favStatus = "far") {
    let hostName = getHostName(story.url);
    let favoriteStatus = favStatus;
    let ownStory = ownStoryStatus;

    // render story markup
    const storyMarkup = $(
      `<li class="list-group-item list-group-item-action list-group-item-success" id="${story.storyId}">
        <a class="article-link list-group-item-success" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        
        <small class="article-username">posted by ${story.username}</small>

        <i class="${favoriteStatus} fa-heart"></i>
        ${ownStory}
      </li>`
    );

    return storyMarkup;
  }

  /**
   * a function for finding favorite stories and filling heart icons
   */
  function checkForFavs() {
    for(let favStory of $(user.favorites)){
      let favStoryID = favStory.storyId;

      $(`#${favStoryID}`).find(".fa-heart").toggleClass("far fas");
    }
  }

  /**
   * a funxtion for checking if story in question is own story and returns correct param to be passed in
   */
  function checkOwnStory(storyInQuestion){
    for(let ownStory of $(user.ownStories)){
      if(storyInQuestion.storyId === ownStory.storyId){
        return $removeIcon;
      }
    }
    return "";
  }

  // hide all elements in elementsArr
  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach(val => val.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLoggedinOptions.show();
  }

  // simple function to pull the hostname from a URL
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }
});