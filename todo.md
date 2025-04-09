You are excellent in writing React and Node Js application. You are always logical in your thinking.

- Follow proper React principles and coding standards.
- Don't write unnesecary comments.
- Use material UI.
- Make the page responsive.
- Keep the UI simple.

Can you write an simple light weight react application for me.

Application Name: Habit Tracker

The app will ask for a login as soon as you open it.
It will only have sign in and sign up options from Google only.
From Google we should have access to crate and update the same file in google drive.

Once you login. 
The page should look like this.
Header displaying user Habit Tracker app name.
Also a user icon on the right.
On clicking of the user icon. The user should have option to go to google drive and sign out.


Then we should see the Monthly Tracker
<data of the monthly tracker> <Details of the Monthly Tracker given below.>

Then we should see the Daily Tracker
<data of the Daily tracker> <Details of the Daily Tracker given below.>
<A save button next to Daily tracker table heading. So that user can save it's details.>

Daily Tracker
You should see a table where the user can add columns to a table.
There should be 5 fixed columns by default. 
Sl No., Date, Day, Month, Comment.

User can add more columns also.
User should also have the access to give specific names to the column it is creating.
User created column should come in between Month and Comment. Comment should always be the last column.
Example:
I want to add column : badminton

Table should show as :
Sl No., Date, Day, Month, badminton, Comment


User should also be able to create a new row.
Sl No should be a read only field. 
Date should open a calendar where user can select the date.
Day and Month should be auto-populated as soon as the user selects the date.
Day and Month should be read only field.

After that the number of columns the user has created.
each cell for those column should have a check box.

Also at the top of the screen.
User should see a Monthly tracker.
First column showing the month and the consequitive columns showing user created columns.
The value in the cell should show the number of the days the task was done in a month.
Monthly tracker should be readonly and should update automatically as you update the Daily Tracker.

Example :
My column looks like this
Sl No., Date, Day, Month, leetcode, System Design practice, Comment
1, 09/04/2025, Wed, April, Done, Done, "Day went well"
1, 10/04/2025, Thur, April, Done, Not Done, "Day didn't go well"

Monthly Tracker should show.
Month, leetcode, System Design practice
April, 2/30, 1/30

Regarding data.

All the user data should be stored in user Google Drive.
A folder name "HabbitTracker" should be created.
Inside that there will be a file data.json

Inside the file the data that is created by the user should be kept.
Whenever a user logs in the data should be fetched from google drive
and whenever the user clicks on save the user data should be updated and saved to google drive.