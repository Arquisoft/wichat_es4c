Feature: Playing a game and losing as a user

  Scenario: The user wants to play a game and lose
    Given A user with name "admin" and password "admin"
    When I log in with the user credentials
    And I press the play button
    And The game starts and user can see the counter "Tiempo restante"
    And I play the game and lose
    Then The game ends
    