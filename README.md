# :mailbox: mail_ 

_mail_ is a single page mock email application built on a Django API.

__tl;dr:__
 - UI! JavaScript! Django/JSON API! Sass! Bootstrap!
 
 - see the finished project [here](https://mail-api-app.herokuapp.com/) (it'll take a few seconds to get going as it is on a hobby server)
 
 - favourite code snippet:
  ```javascript
   // handle archive/unarchive alerts
   .then(() => {
      messages.push({
        message: mailbox === 'inbox' ? "Message archived" : "Message moved to inbox", 
        type: "info"
      });
      load_mailbox(mailbox);
   });

  ```
  - what it looks like:
  
![mail screenshot](https://s3.eu-west-2.amazonaws.com/media.jh-portfolio/media/project_images/mail-1.png)


This project was completed as part of Harvard's [CS50’s Web Programming with Python and JavaScript](https://online-learning.harvard.edu/course/cs50s-web-programming-python-and-javascript) course, following an investigation of user interface design. 

After a lot of fiddling with data, models, views and paths in the earlier weeks of the course, the lectures that preceded this task looked into how we can use JavaScript and CSS - along with additional tools like Bootstrap, Sass and React - to make for a better user experience.

On the frontend, _mail_ relies heavily on vanilla JavaScript, with Sass and a sprinkling of jQuery for Bootstrap integration. I'd mainly steered clear of fetch requests and JSON up until this point, assuming that they were much more complicated and frightening than they actually are. So I was grateful that this task gave me a much deeper dive into those topics, as well as using event listeners to manipulate the DOM.

I was pleased with how the UI design came out for this one, having learnt a lot of new tricks in the research for the project I could've easily gone overboard but managed to keep it clean and functional. 

I'd used JSON sparingly for a few projects prior to this one, but it was a bit of a revelation to see how useful it can be for separating out frontend and backend concerns. The API for this project was It got me researching different techniques of using APIs, especially the [Django Rest Framework](https://www.django-rest-framework.org), and this is definitely something I'm going to play with more as I dip into the world of React!
