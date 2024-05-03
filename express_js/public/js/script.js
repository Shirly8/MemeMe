
import { loggedInUser, roles, SignUp, Login } from './authenticate.js';


//HANDLE ALL EVENTS AND BUTTON EVENT
document.addEventListener('DOMContentLoaded', function() {

  document.getElementById('loginButton').addEventListener('click', Login);
  document.getElementById('SignUpButton').addEventListener('click', SignUp);

  document.getElementById('createButton').addEventListener('click', showForm);
  document.getElementById('searchButton').addEventListener('click', searchGif);
  document.getElementById('submitButton').addEventListener('click', function (e) {
    submitPost(e);
 });
 
 //GLOBAL VARIABLE TO KEEP TRACK OF ROLES NAD LOGGEDINUSER
 let loggedInUser = null;
 let roles = null;


 //Method displays the Form container
  function showForm() {
      document.getElementById('FormContainer').style.display = 'block';
  }

function getPost() {
  //Gets the posts from database
  fetch('/get-posts')
    .then(response => response.json())
    .then(posts => {
      const postSection = document.getElementById('postSection');
      const eachPost = document.getElementById('eachPost').innerHTML;
      const template = Handlebars.compile(eachPost);

      // Add to each post that only loggedUsers can retrieve and delete
      //Add another property only the admin account can delete all post
      posts = posts.map(post => {
        return {
          ...post,
          adminRole: roles === 'admin',
          loggedUser: post.username === loggedInUser,

        };
      });

      //Adds to handlebar template rendering
      postSection.innerHTML = template({ posts });
      attachDeleteButtonListeners(); // Attach delete button event listner
    })
    .catch(error => {
      console.error('Error fetching posts:', error);
    });
}

  function attachDeleteButtonListeners() {
    // Attach event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.deleteButton');

    deleteButtons.forEach(button => {
      //Get the postId that the delete Button will perform on
      button.addEventListener('click', function (event) {
        const postId = event.currentTarget.dataset.postId; 
        deletePost(postId);
      });
    });
  }

  function handleKeyDown(event) {
      const ENTER_KEY = 13 //keycode for enter key
      if (event.keyCode === ENTER_KEY) {
          searchGif(event);
          return false //don't propagate event
      }
  }


  //FUNCITON TAKES THE SEARCH INPUT FROM USER
function searchGif(event) {
  event.preventDefault();

  const gifsearch = document.getElementById('gifSearchInput').value;

  if (gifsearch.trim() === '') {
      return;
  }

  //DISPLAY IT IN A CAROUSEL ONCE FOUND
  fetch('/search-gifs?term=' + encodeURIComponent(gifsearch))
      .then(response => response.json())
      .then(gifs => {
        const resultsContainer = document.querySelector('.results-container');
        resultsContainer.innerHTML = ' ';

        resultsContainer.style.display = 'flex';
        
        let gifnum =0;

        //Add this to the handlebar
          gifs.forEach(gif => {
              const img = document.createElement('img');
              const id = 'gif_' + gifnum++;
              img.id = id;
              img.src = gif.images.fixed_height.url;

              img.addEventListener('click', function () {
                GifSelected(id, gif.title);
              });

              resultsContainer.appendChild(img); //Add every gif that is found
          });

          // If nothing found, just say nothing is found
          if (gifs.length === 0) {
              resultsContainer.innerHTML = '<p> No GIFs found</p>';
          }
      })
      .catch(error => {
          alert('An error occurred while fetching GIFs');
      });
}


//ADD SOME CSS STYLING FOR EVERY CHOSEN GIF
function GifSelected(id, name) {
  const allGifs = document.querySelectorAll('.results-container img');
  allGifs.forEach(gif => {
    gif.style.border = '';
    gif.classList.remove('chosen-gif');
  });

  const chosenGif = document.getElementById(id);
  chosenGif.classList.add('chosen-gif');

  //Display the GIF in a nice css styling
  const messageContainer = document.getElementById('selectedGif');
  if (chosenGif.classList.contains('chosen-gif')) {

    selectedGif.innerHTML = `GIF "${name}" selected!`;
    chosenGif.style.border = '10px solid #E8AFF6';

  }else {
    messageContainer.innerHTML = '';

  }
}

//BUTTON HANDLER FOR THE SUBMIT BUTTON, ADDS INTO THE SQLITE3 DATABASE
function submitPost(event) {
  event.preventDefault();

  // Get form data 
  let date = new Date().toISOString().split('T')[0]; //proper display of time
  let caption = document.getElementById('caption').value;
  let gif = document.querySelector('.chosen-gif').src;

  //Ensure that caption or gif is not blank
  if (!caption || !gif) {
    alert('Caption and GIF cannot be blank!');
    return;
  }

  // Make request to the server
  fetch('/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date, caption, gif, username: loggedInUser}),
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById('Submitted').innerHTML = 'MEME SUBMITTED!';

      document.getElementById('FormContainer').style.display = 'none'; 
      getPost()
    })

    .catch(error => {
      console.error('Error:', error);
    });
}


// GET THE POST (WHEN THE PAGE IS LOADED)
fetch('/get-posts')
  .then(response => response.json())

  .then(posts => {
    const postSection = document.getElementById('postSection');
    const eachPost = document.getElementById('eachPost').innerHTML;

    const template = Handlebars.compile(eachPost);
    postSection.innerHTML = template({ posts });
  })
  .catch(error => {
    console.error('Error fetching posts:', error);
  });


  //DELETE FUNCTION TO REMOVE THE POST FROM THE DATABASE AND WINDOW
  async function deletePost(postId) {

    //RETRIEVE THE POSTID DATA AND THE USERNAME 
    try {
      const response = await fetch(`/delete-post`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: postId, username: loggedInUser }),
      });
  
      if (response.status === 200) {
        getPost();
      } else {
        alert('Error occured deleting the post.');
      }
    } catch (error) {
      alert('Deleting the post error.');
    }
  }
});