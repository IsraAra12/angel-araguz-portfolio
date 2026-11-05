const form = document.getElementById('solicitud-diagnostico');
const sendButton = form.querySelector('button[type="submit"]');
const statusLine = form.querySelector('[role="status"]');
const isLocalPreview = location.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(location.hostname);
const endpoint = isLocalPreview ? 'http://127.0.0.1:8000/api/v1/public/contact' : '/api/contact';

const messages = {
  es: {
    sending: 'Enviando solicitud…',
    success: 'Recibimos tu solicitud. Te contactaremos para dar seguimiento.',
    invalid: 'Revisa los datos del formulario y vuelve a intentarlo.',
    tooMany: 'Recibimos demasiadas solicitudes. Intenta de nuevo en un minuto.',
    failed: 'No pudimos confirmar el envío. Puedes volver a intentarlo o escribirnos por correo.',
    localFile: 'Abre la vista local por HTTP para enviar el formulario.',
  },
  en: {
    sending: 'Sending your request…',
    success: 'We received your request and will contact you to follow up.',
    invalid: 'Check your details and try again.',
    tooMany: 'We received too many requests. Try again in a minute.',
    failed: 'We could not confirm your submission. Please try again or contact us by email.',
    localFile: 'Open the local preview over HTTP to submit the form.',
  },
};

function showStatus(message, error = false) {
  const language = document.documentElement.lang === 'en' ? 'en' : 'es';
  statusLine.textContent = messages[language][message];
  statusLine.dataset.error = String(error);
}

let openedAt = Date.now();
const submissionIds = new Map();

sendButton.hidden = false;
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sendButton.disabled) return;
  if (location.protocol === 'file:') {
    showStatus('localFile', true);
    return;
  }

  const fields = new FormData(form);
  const payload = {
    name: fields.get('name').trim(),
    company: fields.get('company').trim(),
    email: fields.get('email').trim(),
    phone: fields.get('phone').trim() || null,
    service_interest: fields.get('service_interest'),
    message: fields.get('message').trim(),
    consent: fields.has('consent'),
    hp_website: fields.get('hp_website'),
    client_timestamp: openedAt,
  };
  if (payload.name.length < 2 || payload.company.length < 2 || payload.message.length < 10) {
    showStatus('invalid', true);
    return;
  }
  const fingerprint = JSON.stringify(payload);
  if (!submissionIds.has(fingerprint)) submissionIds.set(fingerprint, crypto.randomUUID());
  payload.submission_id = submissionIds.get(fingerprint);

  sendButton.disabled = true;
  showStatus('sending');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok && (await response.json()).ok === true) {
      form.reset();
      openedAt = Date.now();
      submissionIds.clear();
      showStatus('success');
    } else if (response.status === 429) {
      showStatus('tooMany', true);
    } else if ([400, 413, 422].includes(response.status)) {
      showStatus('invalid', true);
    } else {
      showStatus('failed', true);
    }
  } catch {
    showStatus('failed', true);
  } finally {
    sendButton.disabled = false;
  }
});
