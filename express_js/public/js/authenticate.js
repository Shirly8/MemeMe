

export { loggedInUser, roles, SignUp, Login };

  async function SignUp() {
      const username = document.getElementById('Username').value;
      const password = document.getElementById('Password').value;


      //Handle if username or password is inputted incorrectly
      if (username.length ==0) {
        alert ('PLEASE ENTER A USERNAME');
        return;
      }
      if (password.length < 8) {
          alert('Please enter a password that is at least 8 characters long.');
          return;
      }

      //ATTEMPT TO ADD TO DATABASE AND HANDLE ERRORS: 
      try {
          const response = await fetch('/signup', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password}),
          });

          if (response.status === 200) {
              alert('Account has been created! Please refresh the page and login!');

          }
      } catch (error) {
          alert('An error occurred. Try Again!');
      }
  }

  //FUNCTION TAKES IN INPUT FROM USER AND CHECKS DATABASE: 
  async function Login() {
      const username = document.getElementById('Username').value;
      const password = document.getElementById('Password').value;

      //RETRIEVE FROM DATABASE
      try {
          const response = await fetch('/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password }),
          });

          //IF SUCCESSFUL, GET THE POSTS AND DELETE BUTTON
          if (response.status === 200) {
            const responseData = await response.json(); //GET THE JSON TO RETRIEVE THE DATA
            loggedInUser = username; // Save the username

             alert(`Login successful!`);
             console.log('User logged in');

            //  console.log(responseData.user.roles);
             roles = responseData.user.roles;
             console.log(roles);

             getPost();
             attachDeleteButtonListeners();

              // Redirect to the Main container after login!
              document.getElementById('Login').style.display = 'none';
              document.getElementById('Main').style.display = 'block'; 
          } else {
              const errorMessage = await response.text();
              alert(`Login failed `);
          }
      } catch (error) {
          alert('An error occurred...');
      }
  }