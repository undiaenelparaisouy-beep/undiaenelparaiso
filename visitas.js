// Cuenta las visitas a la web para el panel. Sin cookies ni datos personales: una sesión al azar por pestaña,
// la página y por dónde llegó (?ref= del link compartido, o si no, el sitio de donde vino).
(function () {
  // Link de referido (?ref=CODIGO): queda guardado en este navegador para la inscripción, aunque vuelva otro día.
  try { var ref = new URLSearchParams(location.search).get('ref'); if (ref) localStorage.setItem('ref', ref.slice(0, 40)); } catch (e) {}

  var cfg = window.EL_PARAISO;
  window.visita = function () {};
  if (!cfg || location.hostname !== 'undiaenelparaiso.uy' || navigator.webdriver) return;

  var mem = {};
  function get(k) { try { return sessionStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { mem[k] = v; } }

  function canalDeLlegada() {
    var q = new URLSearchParams(location.search);
    var ref = q.get('ref') || q.get('utm_source');
    if (ref) return ref.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) || 'directo';
    var host = '';
    try { host = new URL(document.referrer).hostname.replace(/^www\./, ''); } catch (e) {}
    if (!host || host === location.hostname) return 'directo';
    var conocidos = [[/instagram/, 'instagram'], [/facebook|fb\./, 'facebook'], [/whatsapp|wa\.me/, 'whatsapp'], [/google/, 'google'], [/^t\.co$|twitter|x\.com/, 'x']];
    for (var i = 0; i < conocidos.length; i++) if (conocidos[i][0].test(host)) return conocidos[i][1];
    return host.slice(0, 40);
  }

  var sesion = get('v_sesion');
  if (!sesion) {
    sesion = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    set('v_sesion', sesion);
    set('v_canal', canalDeLlegada());
  }

  window.visita = function (pagina) {
    fetch(cfg.SUPABASE_URL + '/rest/v1/visitas', {
      method: 'POST', keepalive: true,
      headers: { apikey: cfg.SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ sesion: sesion, pagina: pagina, canal: get('v_canal') || 'directo' })
    }).catch(function () {});
  };

  // La vuelta de Mercado Pago (?pago=) no es una visita nueva.
  if (!/[?&]pago=/.test(location.search)) window.visita(/inscripcion/.test(location.pathname) ? 'inscripcion' : 'inicio');
})();
