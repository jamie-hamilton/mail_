document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  let views = document.querySelectorAll('[id$="-viewer"')
  views.forEach(view => {
    let view_name = view.id.split('-')[0];
    view.addEventListener('click', () => load_mailbox(view_name));
  });
  // Toggle email view
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Manage Bootstap tooltips
  $("body").tooltip({
    selector : '[data-toggle=tooltip]'
  })
  $("body").on('show.bs.tooltip', function() {
      // Only one tooltip should be open at a time
      $('.tooltip').not(this).remove();
  });

});

// Create array to store alerts
var messages = [];
// Unopened message counter
var new_mail;
var mailbox;


// Cookies for posts & puts
// https://docs.djangoproject.com/en/3.1/ref/csrf/#ajax
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// Clear any existing alerts
function clear_alerts() {
  document.querySelector('#alert-box').style.display = 'none';
  [].forEach.call(document.querySelectorAll('.msg-item'),function(e){
    e.parentNode.removeChild(e);
  });
}

// Display alert messages
function display_alerts() {
    // Clear any existing messages in the view before displaying new
    clear_alerts();
    let alert = document.querySelector("#alert-message");
    message_type = messages[0].type;
    alert.className = `alert alert-${message_type} alert-dismissible fade show`;
    document.querySelector('#alert-box').style.display = 'block';
    for (x in messages)  {
      let msg_item = document.createElement('li');
      msg_item.className = "msg-item"
      msg_item.textContent = messages[x].message;
      alert.append(msg_item);
    }
    messages=[];
}

// Find elements with id that starts with string (id_prefix) and update from email data object
function update_modal(id_prefix, data) {
  let elements = document.querySelectorAll(`*[id^="${id_prefix}"]`)
  // Update modal title
  document.querySelector(`#e${id_prefix}title`).textContent = data.subject.startsWith("Re: ", 0) || id_prefix === "mail-" ? data.subject : `Re: ${data.subject}`; 
  
  // Update tooltip label dependent on inbox
  $('#modal-archive').attr('data-original-title', mailbox === 'inbox' ? 'Archive?' : 'Unarchive?');
  elements.forEach(element => {
    data_key = element.id.split('-')[1];
    element.textContent = data[data_key];
  });
}

// Send an email reply from email_data object
function send_reply(email_data) {
  let reply_text = document.querySelector('#reply-text').value
  fetch('/emails', {
      credentials: 'include',
      method: 'POST',
      mode: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
          recipients: email_data.sender,
          subject: email_data.subject.startsWith("Re: ", 0) ? email_data.subject : `Re: ${email_data.subject}`,
          body: reply_text
      })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error){
          messages.push({message: result.error, type: "danger"});
          open_reply(email_data);
        }
        else {
          messages.push({message: result.message, type: "info"});
          load_mailbox(mailbox);
        }
        // Renable send button on completion
        document.getElementById('send-reply').disabled = false;
        document.getElementById('send-reply').textContent = 'Send';
    });
}

// Open reply modal - takes email API object as variable
function open_reply(email_data) {
  // Clear alerts from view if there aren't any to display
  if (messages.length) {
    display_alerts();
  }
  else {
    clear_alerts();
    document.querySelector('#reply-text').value = '';
  }
  update_modal("reply-", email_data)
  $('#e-reply-modal').modal('show');

  // Click handler
  function handleReplyClick() {
    $('#e-reply-modal').modal('hide');
    // Disable send button to prevent duplicate API request
    document.getElementById('send-reply').disabled = true;
    document.getElementById('send-reply').textContent = 'Sending...';
    send_reply(email_data);
  }

  document.querySelector('#send-reply').addEventListener('click', handleReplyClick)

  // Remove click event on modal close
  $("#e-reply-modal").on("hidden.bs.modal", function(){
    document.getElementById('send-reply').removeEventListener("click", handleReplyClick);
    $(this).removeData();
  });
}

function archive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    credentials: 'include',
    method: 'PUT',
    mode: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken
    },
    body: JSON.stringify({
        // Set archive to true if click from inbox or false if click from archive
        archived: mailbox === 'inbox' ? true : false,
    })
  })
  .then(() => {
    messages.push({message: mailbox === 'inbox' ? "Message archived" : "Message moved to inbox", type: "info"});
    load_mailbox(mailbox);
  });
}

// Open email modal - takes email API object as variable
function open_email(email_data) {
  update_modal("mail-", email_data)
  $('#email-modal').modal('show');
  let buttons = document.querySelectorAll('#email-modal [class$="-primary"]')
  if (mailbox === 'sent') {
      // Hide send/archive buttons in send view
      buttons.forEach(button =>  { 
      button.style.display = 'none'; 
    })
  }
  else {
    // Show send/archive buttons
    buttons.forEach(button =>  { button.style.display = 'inline-block' })

    // Handle clicks
    function handleSendClick() {
      $('#email-modal').modal('hide');
      open_reply(email_data);
    }
    function handleArchiveClick() {
      $('#email-modal').modal('hide');
      archive_email(email_data.id);
    }

    document.querySelector('#reply').addEventListener('click', handleSendClick);
    document.querySelector('#modal-reply').addEventListener('click', handleSendClick);
    // Handle click for archive element
    document.getElementById('modal-archive').addEventListener('click', handleArchiveClick);

    // Remove click events on modal close
    $("#email-modal").on("hidden.bs.modal", function(){
      document.getElementById('reply').removeEventListener("click", handleSendClick);
      document.getElementById('modal-reply').removeEventListener("click", handleSendClick);
      document.getElementById('modal-archive').removeEventListener("click", handleArchiveClick);
      $(this).removeData();
    });
  }
}

// Fetch email data by id
function get_email(email_id) {
  // Send request for email data
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // If set to unread remove .unread class and send put request to mark email as read
      if (email.read === false) {
        document.getElementById(`email-${email_id}`).classList.remove("unread");
        new_mail--;
        document.getElementById("unread").textContent = new_mail < 1 ? new_mail = null : new_mail;
        fetch(`/emails/${email_id}`, {
          credentials: 'include',
          method: 'PUT',
          mode: 'same-origin',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({
              read: true
          })
        });
      }
      open_email(email);
  });
}

// Fetch emails for corresponding mailbox
function display_emails() {
  // Clear view
  let emails_view = document.querySelector('#emails-view');
  emails_view.textContent = '';

  // Show the mailbox name and loader
  emails_view.innerHTML = `<h4>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h4><div class="stage"><div class="dot-pulse"></div></div>`;

  let email_outer = document.createElement('div');
  emails_view.append(email_outer);
  email_outer.className = `email-outer`;
  email_outer.style.display = 'none';
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Set new_mail counter to 0 if opening inbox
    if (mailbox === 'inbox') new_mail = 0;
    // Create elements for each email retrieved
    emails.forEach(email => {
      let unread;
      if (!email.read && mailbox === 'inbox') {
        // Increment new mail counter & add unread class for each unread email
        unread = "unread ";
        new_mail++;
        document.getElementById("unread").textContent = new_mail < 1 ? new_mail = null : new_mail;
      }
      else {
        unread = ""
      }

      // Container for email row
      let element = document.createElement('div');
      element.className = `email-container row align-items-center`;
      element.id  = `email-row-${email.id}`
      email_outer.append(element);

      // Email sender, title and timestamp column
      let email_detail = document.createElement('div');
      email_detail.className = `${unread}email-detail col-11 row align-items-center`
      email_detail.id = `email-${email.id}`
      element.append(email_detail)
      email_detail.addEventListener('click', function() {
        get_email(email.id); //  EventListener for email click
      });
      let sender = document.createElement('div');
      sender.className = "sender small col-md-3";
      sender.textContent = email.sender;
      let subject = document.createElement('div');
      subject.className = "subject col-md-4";
      subject.textContent = email.subject;
      let timestamp = document.createElement('div');
      timestamp.className = "timestamp small col-md-5 text-muted text-right";
      timestamp.textContent = email.timestamp;
      email_detail.append(sender, subject, timestamp);
      // Archive/unarchive column + buttons (excluded from sent mailbox view)
      if (mailbox != 'sent') {
        let archive = document.createElement('div');
        archive.className = "col-1";
        element.append(archive);
        let archive_link = document.createElement('a');
        archive_link.className = "btn btn-sm btn-outline-primary";
        archive_link.id = `archive-${email.id}`;
        archive_link.setAttribute('data-toggle', 'tooltip');
        archive_link.setAttribute('data-trigger', 'hover');
        archive_link.setAttribute('data-placement', 'right');
        archive_link.title = mailbox === 'inbox' ? 'Archive?' : 'Unarchive?';
        archive.append(archive_link);
        let archive_icon = document.createElement('i');
        archive_icon.className = "far fa-folder-open";
        archive_link.append(archive_icon)
        archive_link.addEventListener('click', function() {
          document.querySelector('.tooltip').remove();
          archive_email(email.id); // EventListener for archive click
        });
      }
    })
  })
  .then(() => {
    document.querySelector('.stage').remove();
    email_outer.style.display = 'block';
    email_outer.classList.add('fade-in');
  });
}


function compose_email() {

  // Show compose view, hide other views and existing alerts
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Assign variables to composition fields
  const recipient = document.querySelector('#compose-recipients')
  const subject = document.querySelector('#compose-subject');
  const bodyText = document.querySelector('#compose-body');
  const send_btn = document.getElementById('send');
  // Listen for 'send' click and post data
  const form = document.querySelector('#compose-form')
  form.onsubmit = (e) => {
    e.preventDefault();
    // Disable send button to prevent duplicate API requests
    send_btn.disabled = true;
    send_btn.value = 'Sending...'
    send_email();
  }

  // Clear input fields where there are no messages to display
  if (messages.length) {
    display_alerts();
  }
  else {
    clear_alerts();
    recipient.value = '';
    subject.value = '';
    bodyText.value = '';
  }

  // Post user input to '/emails' route
  function send_email() {
    fetch('/emails', {
      credentials: 'include',
      method: 'POST',
      mode: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
          recipients: recipient.value,
          subject: subject.value,
          body: bodyText.value
      })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error){
          messages.push({message: result.error, type: "danger"});
          compose_email();
        }
        else {
          messages.push({message: result.message, type: "info"});
          load_mailbox('sent');
        }
        // Renable send button on completion
        send_btn.disabled = false;
        send_btn.value = 'Send';
    });
  }
}

function load_mailbox(view) {
  mailbox = view;

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  
  // Clear messages from view if there aren't any to display
  
  if (messages.length) {
    display_alerts();
  }
  else {
    clear_alerts();
  }
  
  // Request mailbox emails from API
  display_emails()
}