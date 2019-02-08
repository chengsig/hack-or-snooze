const BASE_URL = "https://hack-or-snooze-v2.herokuapp.com";

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */
class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * This method is designed to be called to generate a new StoryList.
   *  It calls the API, builds an array of Story instances, makes a single StoryList
   * instance out of that, and then returns the StoryList instance
   */
  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await $.getJSON(`${BASE_URL}/stories`); // why? why not just $.get??????
    
    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.stories.map(story => new Story(story));
    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories)
    return storyList;
  }

  /**
   * Method to make a POST request to /stories and add the new story to the list
   The function should accept the current instance of User who will post the story
    It should also accept an object which with a title, author, and url
    */
  async addStory(user, newStoryObj) { 
    //post to JSON using new story form inputs// function activated from script.js
    let responsePostStory = await $.post(`${BASE_URL}/stories`, {token: user.loginToken, story: newStoryObj});
    // console.log("respPost", responsePostStory.story);
    let newStory = new Story(responsePostStory.story);
    //console.log(this): StoryList: {stories: Array(25)} //stories: [Story{}, Story{}, Story{}...]
    this.stories.push(newStory);
    // console.log("add story", newStory);
    return newStory;
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in the script.js file where it will be appended to the DOM
  }
}


/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and stayLoggedIn
 */
class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /*
   A class method to create a new user - it accepts a username, password and name
   It makes a POST request to the API and returns the newly created User as well as a token
   */
  static async create(username, password, name) {
    const response = await $.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });
    // build a new User instance from the API response
    const newUser = new User(response.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.token;

    // save the token to localStorage
    localStorage.setItem("token", response.token);

    // also save the username so that we don't have to decode the token to get it every time
    localStorage.setItem("username", newUser.username); 
    return newUser;
  }

  /** 
   * Class method for adding a new favorite story to database with a POST request; accepts the story ID
   */
  async addFavStory(storyID){
    // add favorite to database
    let response = await $.post(`${BASE_URL}/users/${this.username}/favorites/${storyID}`, {token: user.loginToken});
    
    // add favorite to local storage
    let newStory = new Story(response.user.favorites[response.user.favorites.length-1]);

    this.favorites.push(newStory);
  }

  /** 
   * Class method for deleting a favorite story from database with a POST request; accepts the story ID
   */
  async deleteFavStory(storyID){

    // first delete favorite from localstorage
    for(let i =0; i<this.favorites.length; i++){
      if(this.favorites[i].storyId === storyID){
        this.favorites.splice(i,1);
      }
    }
    
    // delete favorite from database
    let response = await $.ajax({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyID}`,
      method: 'DELETE',
      data: {token: user.loginToken}
    });
  }

  /*
   A class method to log in a user. It returns the user 
   */
  static async login(username, password) {
    const response = await $.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });
    // build a new User instance from the API response
    const existingUser = new User(response.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.user.favorites.map(story => new Story(story))
    existingUser.ownStories = response.user.stories.map(story => new Story(story));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.token;

    // save the token to localStorage
    localStorage.setItem("token", response.token);

    // also save the username so that we don't have to decode the token to get it every time
    localStorage.setItem("username", existingUser.username);

    return existingUser;
  }

  /**
   * This function grabs a token and username from localStorage.
   *  It uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that inf function.
   */
  static async stayLoggedIn() {
    // get username and token from localStorage
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // call the API
    const response = await $.getJSON(`${BASE_URL}/users/${username}`, {
      token
    });
    // instantiate the user from the API information
    const existingUser = new User(response.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.user.favorites.map(
      story => new Story(story)
    );
    existingUser.ownStories = response.user.stories.map(
      story => new Story(story)
    );
    return existingUser;
  }
}
/**
 * Class to represent a single story. Has one method to update.
 */
class Story {
  /*
   * The constructor is designed to take an object for better readability / flexibility
   */
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}