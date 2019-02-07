// global flag to easily tell if we're logged in
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
   * Event handler for Navigation to Homepage
   */
  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
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

    generateNewStory(newStory);
  });

  /**
   * Append new story to DOM
   */
  function generateNewStory(newStory) {
    const result = generateStoryHTML(newStory);
    $allStoriesList.append(result);
    
  }

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

    
    // for (let story of storyList.stories) {
    //   generateNewStory(story);
    // }

    // 
    
    // cats.forEach(console.log)

  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(
      `<li class="list-group-item list-group-item-action list-group-item-success" id="${story.storyId}">
        <a class="article-link list-group-item-success" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        
        <small class="article-username">posted by ${story.username}</small>

        <i class="far fa-heart"></i>
      </li>`
    );

    return storyMarkup;
  }

  function checkForFavs() {

    for(let favStory of $(user.favorites)){
      let favStoryID = favStory.storyId;
      $(`#${favStoryID}`).find(".fa-heart").toggleClass("far fas");
      
    }
  }

  $allStoriesList.on("click", "li .fa-heart", function(e){
    $(e.target).toggleClass("far fas");
    user.addFavStory($(e.target).closest("li").attr('id'));
    //console.log($(e.target).closest("li").attr('id'))
  })


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
