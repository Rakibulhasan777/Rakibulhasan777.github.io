/**
 * Form submission and validation helper.
 */
(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  window.addEventListener('pageshow', function() {
    forms.forEach(function(form) {
      form.reset();
    });
  });

  forms.forEach( function(e) {
    e.addEventListener('submit', function(event) {
      event.preventDefault();

      let thisForm = this;

      let action = thisForm.getAttribute('action');
      let recaptcha = thisForm.getAttribute('data-recaptcha-site-key');
      
      if( ! action ) {
        displayError(thisForm, 'The form action property is not set!');
        return;
      }

      if (action.toLowerCase().startsWith('mailto:')) {
        const formData = new FormData(thisForm);
        const subject = formData.get('subject') || 'Portfolio contact';
        const body = [
          `Name: ${formData.get('name') || ''}`,
          `Email: ${formData.get('email') || ''}`,
          '',
          formData.get('message') || ''
        ].join('\n');
        const mailtoUrl = `${action}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');
        thisForm.querySelector('.sent-message').textContent = 'Your email app has been opened with the message ready to send.';
        thisForm.querySelector('.sent-message').classList.add('d-block');
        return;
      }

      thisForm.querySelector('.loading').classList.add('d-block');
      thisForm.querySelector('.error-message').classList.remove('d-block');
      thisForm.querySelector('.sent-message').classList.remove('d-block');

      let formData = new FormData( thisForm );

      if ( recaptcha ) {
        if(typeof grecaptcha !== "undefined" ) {
          grecaptcha.ready(function() {
            try {
              grecaptcha.execute(recaptcha, {action: 'formspree_submit'})
              .then(token => {
                formData.set('recaptcha-response', token);
                submitForm(thisForm, action, formData);
              })
            } catch(error) {
              displayError(thisForm, error);
            }
          });
        } else {
          displayError(thisForm, 'The reCaptcha javascript API url is not loaded!')
        }
      } else {
        submitForm(thisForm, action, formData);
      }
    });
  });

  function submitForm(thisForm, action, formData) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch(action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: controller.signal
    })
    .then(response => {
      if( response.ok ) {
        return response.json().catch(() => ({}));
      } else {
        throw new Error(`${response.status} ${response.statusText} ${response.url}`); 
      }
    })
    .then(data => {
      clearTimeout(timeout);
      thisForm.querySelector('.loading').classList.remove('d-block');
      thisForm.querySelector('.sent-message').classList.add('d-block');
      thisForm.reset();
    })
    .catch((error) => {
      clearTimeout(timeout);
      displayError(thisForm, error);
    });
  }

  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    let message = error;
    if (error.name === 'AbortError') {
      message = 'The message service took too long to respond. Please try again or contact me directly by email.';
    }
    if (window.location.protocol === 'file:' && error instanceof TypeError) {
      message = 'The contact form needs to be hosted on a web server before sending messages.';
    }
    thisForm.reset();
    thisForm.querySelector('.error-message').textContent = message;
    thisForm.querySelector('.error-message').classList.add('d-block');
  }

})();
