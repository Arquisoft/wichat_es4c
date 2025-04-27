Feature: Changing game values and play a game as a user
 
Scenario: The user wants to play a game with his own game values
    Given A user with name "test" and password "test"
    When I log in with the user credentials
    And I press the account button
    And I press the settings button
    And I change the value number of questions to 2
    And I save the changes
    And I press the play button
    And I answer the first question
    And I answer the second question
    Then The game ends and the message "¡Resumen de la partida!" is shown