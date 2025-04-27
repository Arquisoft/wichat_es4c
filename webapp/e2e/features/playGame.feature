Feature: Playing the game
 
Scenario: The user plays a game with his own game values and logs out
    Given A user with name "test" and password "test"
    When The user logs in with the user credentials
    And The user presses the account button
    And The user presses the settings button
    And The user changes the value number of questions to 2
    And The user saves the changes
    And The user presses the play button
    And The user answers the first question
    And The user answers the second question
    And The game ends and the message "¡Resumen de la partida!" is shown
    And The user presses the go menu button
    And The user presses the account button
    And The user presses the logout button
    Then The home page is shown

Scenario: The user plays a game and the statistics are saved
    Given A user with name "test" and password "test"
    When The user logs in with the user credentials
    And The user presses the play button
    And The user answers the first question
    And The user answers the second question
    And The game ends and the message "¡Resumen de la partida!" is shown
    And The user presses the go menu button
    And The user presses the account button
    And The user presses the profile button
    Then The user played games statistic is 2