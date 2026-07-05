// Challenge_App loader: picks the signed-in student's set by gate identity.
(function () {
  function keyFor() {
    var n = (window.MathGate && MathGate.currentName && MathGate.currentName()) || '';
    return n.trim().toLowerCase();
  }
  function showNoSet() {
    var s = document.getElementById('startScreen');
    if (s) { s.hidden = false;
      s.innerHTML = '<div style="padding:48px;text-align:center;color:#94a3b8;font:600 1rem/1.5 Outfit,sans-serif;">No challenge set has been assigned to your account yet.</div>'; }
  }
  function loadSet() {
    var key = keyFor(), roster = window.CHALLENGE_ROSTER || {}, file = roster[key];
    if (!file) { showNoSet(); return; }
    var sc = document.createElement('script');
    sc.src = file; sc.onerror = showNoSet;
    document.body.appendChild(sc);
  }
  function wait() {
    if (window.MathGate && MathGate.isUnlocked && MathGate.isUnlocked() && keyFor()) loadSet();
    else setTimeout(wait, 300);
  }
  if (document.readyState !== 'loading') wait();
  else document.addEventListener('DOMContentLoaded', wait);
})();
