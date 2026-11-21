// C.C. owner-only API token for the site's anonymous free models.
// This token is NOT a Claude/OpenAI API key; it has no provider credit balance.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd();
const backend = join(root, 'server.js');
let source = readFileSync(backend, 'utf8');
const marker = '// CC_OWNER_FREE_API_V1';
if (!source.includes(marker)) {
  const needle = 'async function route(req, res) {';
  if (!source.includes(needle)) throw Error('Owner API patch: route anchor not found');
  const routeCode = String.raw`
// CC_OWNER_FREE_API_V1
// Server-side token for private API clients. Free upstream capacity remains rate limited.
const CC_OWNER_API_TOKEN = process.env.CC_OWNER_API_TOKEN || '';
const CC_OWNER_MODELS = new Set(['Qwen3.5-9B','Qwen3.6-27B','gpt-oss-20b']);
const CC_OWNER_OVH_ENDPOINT = process.env.OVH_TEST_ENDPOINT || 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions';
const ccOwnerModelUses = new Map();
function ccOwnerApiAuthorized(req) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const supplied = header.slice(7);
  if (!CC_OWNER_API_TOKEN || supplied.length < 32 || supplied.length > 256) return false;
  const digest = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(supplied), digest(CC_OWNER_API_TOKEN));
}
async function ccOwnerFreeChat(req, res) {
  if (!ccOwnerApiAuthorized(req)) return reply(res, 401, { error: 'Valid owner API key required.' });
  let payload;
  try { payload = await parsePost(req); }
  catch(error) { return reply(res, error.status || 400, { error: error.message }); }
  const model = payload?.model || 'Qwen3.5-9B';
  if (!CC_OWNER_MODELS.has(model)) return reply(res, 400, { error: 'This owner API key supports only the free open-model endpoint, not paid Claude or OpenAI APIs.' });
  const messages = payload?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 32 || messages.at(-1)?.role !== 'user' || messages.some(m => !m || !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 10000)) {
    return reply(res, 400, { error: 'Invalid chat messages.' });
  }
  // No C.C. site-credit counter. Honor the shared provider's free capacity.
  const now = Date.now();
  const recent = (ccOwnerModelUses.get(model) || []).filter(t => now - t < 60_000);
  if (recent.length >= 2) {
    return reply(res, 429, { error: 'Free upstream capacity is shared (2 requests/minute per model). No paid fallback was used.' });
  }
  recent.push(now); ccOwnerModelUses.set(model,recent);
  const maxTokens = Math.max(128, Math.min(1024, Number(payload.maxTokens) || 512));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 75_000);
  try {
    const upstream = await fetch(CC_OWNER_OVH_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      signal: controller.signal,
    });
    let answer;
    try { answer = await upstream.json(); }
    catch { return reply(res, 502, { error: 'Upstream returned unreadable JSON.' }); }
    if (!upstream.ok) return reply(res, upstream.status === 429 ? 429 : 502, { error: upstream.status === 429 ? 'Free provider is rate-limited.' : 'Free provider request failed.' });
    const message = answer?.choices?.[0]?.message?.content;
    if (typeof message !== 'string' || !message.trim()) return reply(res, 502, { error: 'The free provider returned no text.' });
    return reply(res, 200, { text: message, provider: 'free', model, siteCredits: 'unmetered', upstreamRateLimited: true });
  } catch(error) {
    return reply(res, 502, { error: error?.name === 'AbortError' ? 'Upstream timed out.' : 'Upstream unavailable.' });
  } finally { clearTimeout(timer); }
}
`;
  source = source.replace(needle, routeCode + '\n' + needle);
  const routeAnchor = "  if (req.method === 'POST' && pathname === '/api/cc-multichat') return ccMultiChat(req,res);";
  if (!source.includes(routeAnchor)) throw Error('Owner API patch: multichat route missing');
  source = source.replace(routeAnchor, "  if (req.method === 'POST' && pathname === '/api/owner/free-chat') return ccOwnerFreeChat(req, res);\n" + routeAnchor);
  writeFileSync(backend, source);
}
const browser = join(root, 'public/app.js');
let client = readFileSync(browser, 'utf8');
if (!client.includes('CC_OWNER_API_BADGE_V1')) {
  client += String.raw`
// CC_OWNER_API_BADGE_V1
(() => {
  const panel = document.getElementById('owner-panel');
  if (!panel || document.getElementById('cc-owner-api-info')) return;
  const box = document.createElement('section');
  box.id = 'cc-owner-api-info';
  box.className = 'cc-owner-api-info';
  const heading = document.createElement('strong');
  heading.textContent = '∞ Owner site credits';
  const note = document.createElement('p');
  note.textContent = 'Your private site API does not deduct C.C. credits. Free provider capacity is still shared and rate-limited. Paid Claude/OpenAI credits are not included.';
  const code = document.createElement('code');
  code.textContent = 'POST /api/owner/free-chat';
  box.append(heading,note,code);
  panel.append(box);
})();
`;
  writeFileSync(browser, client);
}
const cssPath = join(root, 'public/style.css');
let css = readFileSync(cssPath,'utf8');
if (!css.includes('CC_OWNER_API_BADGE_CSS_V1')) {
  css += '\n/* CC_OWNER_API_BADGE_CSS_V1 */\n.cc-owner-api-info{padding:14px;border:1px solid #8060c8;border-radius:12px;background:#241639;color:#eee3ff;margin-top:12px;line-height:1.5}.cc-owner-api-info strong{display:block;font-weight:800;font-size:14px}.cc-owner-api-info p{font-size:12px;color:#cfbde7;margin:5px 0}.cc-owner-api-info code{display:block;font-size:11px;overflow-wrap:anywhere;color:#d2b0ff}\n';
  writeFileSync(cssPath,css);
}
console.log('C.C. owner free-model API installed; no upstream credit bypass');