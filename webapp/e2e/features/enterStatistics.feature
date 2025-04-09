Feature: Accessing user statistics as user
 
Scenario: The user wants to access their statistics
    Given A user with name "testuser" and password "password"
    When I log in with the user credentials
    And I press the statistics button
    Then I should see the profile page for "testuser"