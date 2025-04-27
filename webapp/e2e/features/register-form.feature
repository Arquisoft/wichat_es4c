Feature: Registering a new user

Scenario: The user is not registered in the site
    Given A user with name "admin3" and password "admin3"
    When The user fills the data in the form and press submit
    Then The confirmation message "Redirecting to login..." should be shown in the screen

Scenario: The user is not registered in the site but the user name is not valid
    Given A user with name "a" and password "admin3"
    When The user fills the data in the form and press submit
    Then The message "Username must be at least 3 characters long" should be shown in the screen

Scenario: The user is not registered in the site but the password is not valid
    Given A user with name "admin4" and password "a"
    When The user fills the data in the form and press submit
    Then The message "Password must be at least 3 characters long" should be shown in the screen

Scenario: The user is not registered in the site but the username is already taken
    Given A user with name "admin3" and password "admin3"
    When The user fills the data in the form and press submit
    Then The message "duplicate key error" should be shown in the screen