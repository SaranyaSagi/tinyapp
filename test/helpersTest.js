//npm test - to run

const { assert } = require('chai');

const getUserByEmail = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert(user, expectedUserID);
  });

  it('should return undefined, if email not in database', function() {
    const user = getUserByEmail("foo@bar.com", testUsers)
    const expectedUserID = undefined;
    assert.equal(user, undefined)
  })
});

//If we pass in an email that is not in our users databse, then our function should return undefined.
// In same describe statement, add another it statement to test that a non-existent email returns undefined. 

//Make sure all tests are passing before moving on. 