const safeHtmlElem = document.getElementById('safe-html');
const unsafeHtmlElem = document.getElementById('unsafe-html');
const safeScriptElem = document.getElementById('safe-script');
const unsafeScriptElem = document.getElementById('unsafe-script');
const safeScriptUrlElem = document.getElementById('safe-script-url');
const unsafeScriptUrlElem = document.getElementById('unsafe-script-url');

// In real world application make sure the policy is enclosed in module (not exported)
// and it's usage is restricted.
let myPolicy;
if (window.trustedTypes) {
  myPolicy = window.trustedTypes.createPolicy('my-policy', {
    createHTML: (s) => s,
    createScript: (s) => s,
    createScriptURL: (s) => s,
  });
} else {
  myPolicy = {
    createHTML: (s) => s,
    createScript: (s) => s,
    createScriptURL: (s) => s,
  };
}

safeHtmlElem.addEventListener('click', () => {
  const iframe = document.createElement('iframe');
  iframe.srcdoc = myPolicy.createHTML('<h1>hello from iframe</h1>');

  document.body.append(iframe);
});
unsafeHtmlElem.addEventListener('click', () => {
  const iframe = document.createElement('iframe');
  iframe.srcdoc = '<h1>hello from iframe</h1>';

  document.body.append(iframe);
});

safeScriptElem.addEventListener('click', () => {
  const script = document.createElement('script');
  script.textContent = myPolicy.createScript(
    'const span = document.createElement("span");span.textContent = "created from script";document.body.append(span)'
  );

  document.body.append(script);
});
unsafeScriptElem.addEventListener('click', () => {
  const script = document.createElement('script');
  script.textContent =
    'const span = document.createElement("span");span.textContent = "created from script";document.body.append(span)';

  document.body.append(script);
});

safeScriptUrlElem.addEventListener('click', () => {
  const script = document.createElement('script');
  script.src = myPolicy.createScriptURL('./my-script');

  document.body.append(script);
});
unsafeScriptUrlElem.addEventListener('click', () => {
  const script = document.createElement('script');
  script.src = './my-script';

  document.body.append(script);
});
