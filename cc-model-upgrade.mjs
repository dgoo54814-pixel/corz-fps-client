// C.C. AI Workbench model/chat usability upgrade (2026-11-21)
// Applies to the *existing* extracted deployment, without replacing owner features.
// No API credentials are included or stored by this patch.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const serverPath = join(root, 'server.js');
const appPath = join(root, 'public/app.js');
const stylePath = join(root, 'public/style.css');
const serverMarker = '// CC_MODEL_GATEWAY_2026';
const clientMarker = '// CC_MODEL_CHOOSER_2026';
const styleMarker = '/* CC_MODEL_STYLE_2026 */';
const read = filename => readFileSync(filename,'utf8');
const save = (filename,data) => writeFileSync(filename,data,'utf8');
let server = read(serverPath);
let app = read(appPath);
let style = read(stylePath);

const handler = String.raw`
${serverMarker}
// Responses API: explicitly user-supplied OpenAI credentials, never server-owned.
async function ccOpenAIChat(req, res) {
  if (!isSameOrigin(req)) return reply(res, 403, {error:'Invalid request origin.'});
  if (!settings.publicChat && !ownerSession(req)) return reply(res,403,{error:'Public chat is paused.'});
  if (!withinLimit(requestsByIp, getIp(req), 20, 60000)) return reply(res,429,{error:'Too many requests; try again shortly.'});
  let p;
  try { p = await parsePost(req); } catch (e) { return reply(res,e.status||400,{error:e.message}); }
  if (!p || typeof p !== 'object') return reply(res,400,{error:'Invalid request.'});
  const {key, model, messages} = p;
  if (typeof key !== 'string' || !/^sk-[A-Za-z0-9_-]{12,}$/.test(key.trim()) || key.length>1200)
    return reply(res,400,{error:'ChatGPT Astra requires an OpenAI Platform API key, not a ChatGPT subscription. Switch to Free Qwen or GPT OSS if you have no key.'});
  if (typeof model !== 'string' || !/^[a-zA-Z0-9._-]{2,90}$/.test(model))
    return reply(res,400,{error:'Choose a valid OpenAI API model ID.'});
  if (!Array.isArray(messages) || messages.length===0 || messages.length>40 || messages.at(-1)?.role!=='user' ||
      messages.some(m => !m || !['user','assistant'].includes(m.role) || typeof m.content!=='string' || !m.content.trim() || m.content.length>16000))
    return reply(res,400,{error:'Invalid chat history.'});
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),90000);
  try {
    const body = {
      model,
      input: messages.map(m => ({role:m.role,content:m.content})),
      max_output_tokens: Math.max(256, Math.min(4096,Number(p.maxTokens)||1024)),
      ...(settings.systemPrompt ? {instructions:settings.systemPrompt} : {}),
    };
    const remote = await fetch(process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/responses', {
      method:'POST',
      headers:{'content-type':'application/json','authorization':'Bearer '+key.trim()},
      body:JSON.stringify(body), signal:controller.signal,
    });
    const raw = await remote.text();
    let data;
    try {data=JSON.parse(raw)}catch{return reply(res,502,{error:'OpenAI sent a non-JSON response.'})}
    if (!remote.ok) {
      const msg = typeof data?.error?.message==='string' ? data.error.message.slice(0,450) : 'OpenAI API error';
      const billing = remote.status===402 || /insufficient_quota|billing|credit|exceeded your current quota/i.test(msg);
      return reply(res,remote.status===429?429:remote.status>=500?502:Math.min(499,remote.status),{
        error: billing ? 'OpenAI API credits are required for Astra and GPT models. Choose a free Qwen/GPT OSS model above, or add API billing in your OpenAI Platform account.' : msg,
        tryFree:billing,
      });
    }
    const output = typeof data.output_text==='string' ? data.output_text :
      (Array.isArray(data.output) ? data.output.flatMap(block => (block.content||[]).filter(p=>p.type==='output_text').map(p=>p.text||'')).join('\n') : '');
    if (!output.trim()) return reply(res,502,{error:'OpenAI returned no text. Try a different model or shorter prompt.'});
    return reply(res,200,{text:output,model,provider:'openai',usage:data.usage||null});
  } catch (e) {
    return reply(res,502,{error:e.name==='AbortError'?'OpenAI request timed out':'Could not reach OpenAI API. Try the free model option.'});
  } finally { clearTimeout(timer); }
}
`;
if(!server.includes(serverMarker)) {
  if (!server.includes('async function route(req, res) {')) throw new Error('Cannot locate server route(); preserve original build.');
  server=server.replace('async function route(req, res) {',handler+'\nasync function route(req, res) {');
  const routeLine=/const pathname = new URL\(req\.url,\s*['"]http:\/\/localhost['"]\)\.pathname;/;
  if(!routeLine.test(server)) throw new Error('Cannot find route() pathname; preserve original build.');
  server=server.replace(routeLine,match=>match+'\n  if (req.method===\'POST\' && pathname===\'/api/openai/chat\') return ccOpenAIChat(req,res);');
  save(serverPath,server);
}

const client = String.raw`
${clientMarker}
(() => {
  // Add OpenAI as an actual API integration, clearly separate from keyless open models.
  if (typeof presets !== 'undefined') presets.openai = {model:'gpt-6.2-astra',label:'OPENAI API · BYOK',keyHint:'sk-proj-…'};
  if (!document.querySelector('[data-provider="openai"]')) {
    const btn = document.createElement('button');
    btn.type='button'; btn.className='provider'; btn.dataset.provider='openai';
    btn.innerHTML='<span class="provider-mark router">G</span><span><strong>ChatGPT · Astra 6.2</strong><small>Official OpenAI API · Key + credits</small></span><span class="chevron">›</span>';
    const sibling=document.querySelector('[data-provider="claude"]');
    (document.querySelector('.providers')||sibling?.parentElement)?.insertBefore(btn,sibling||null);
    if(typeof buttons!=='undefined') buttons.push(btn);
    btn.addEventListener('click',()=>setProvider('openai'));
  }
  const composer = document.querySelector('.composer-wrap');
  if (!composer || document.getElementById('cc-fast-model')) return;
  const bar = document.createElement('section'); bar.className='cc-model-bar';
  const label = document.createElement('label');label.htmlFor='cc-fast-model';label.textContent='CHOOSE AI MODEL';
  const select = document.createElement('select');select.id='cc-fast-model';select.setAttribute('aria-label','Choose AI model');
  const catalogs = [
    ['FREE · NO KEY',[
      ['free','Qwen3.5-9B','★ Free · Qwen 3.5 9B'],
      ['free','Qwen3.6-27B','★ Free · Qwen 3.6 27B'],
      ['free','gpt-oss-20b','★ Free · GPT OSS 20B'],
    ]],
    ['OPENAI · API KEY + BILLING',[
      ['openai','gpt-6.2-astra','GPT-6.2 Astra · OpenAI API'],
      ['openai','gpt-6.2-sol','GPT-6.2 Sol · OpenAI API'],
      ['openai','gpt-6-luna','GPT-6 Luna · OpenAI API'],
    ]],
    ['CLAUDE · API KEY + BILLING',[
      ['claude','claude-opus-5','Claude Opus 5 · Anthropic API'],
      ['claude','claude-sonnet-5','Claude Sonnet 5 · Anthropic API'],
      ['claude','claude-fable-5','Claude Fable 5 · Anthropic API'],
      ['claude','claude-opus-4-6','Claude Opus 4.6 · Anthropic API'],
    ]],
    ['OTHER CONNECTIONS',[
      ['puter','gpt-5.4-nano','Puter AI · Sign-in and allowance'],
      ['openrouter','','OpenRouter · Choose model in settings'],
      ['abusegpt','qwen3.8-27b-free-uncensored','ABUSEGPT · Provider key required'],
    ]]
  ];
  for(const [group,options] of catalogs) {
    const g=document.createElement('optgroup');g.label=group;
    for(const [p,m,title] of options){
      const option=document.createElement('option');option.value=p+'|'+m;option.textContent=title;g.append(option);
    } select.append(g);
  }
  select.value='free|Qwen3.5-9B';
  const openModels=document.createElement('button');openModels.type='button';openModels.textContent='⚙ API settings';openModels.className='cc-model-settings';
  openModels.addEventListener('click',()=>document.getElementById('menu')?.click());
  const line=document.createElement('div');line.className='cc-model-line';line.append(label,select,openModels);
  const status=document.createElement('p');status.className='cc-model-description';status.id='cc-model-description';
  status.textContent='No API key or credit needed for free models. Shared provider limits apply.';
  bar.append(line,status);
  composer.prepend(bar);
  const alert=document.createElement('aside'); alert.className='cc-switch-free';alert.hidden=true;
  const alertText=document.createElement('span');alertText.textContent='This model requires API credits. The free Qwen / GPT OSS models work without an API key.';
  const switchBtn=document.createElement('button');switchBtn.type='button';switchBtn.textContent='Use free AI';
  alert.append(alertText,switchBtn);bar.append(alert);
  const originalSetProvider=typeof setProvider==='function'?setProvider:null;
  const updateStatus=()=>{
    status.textContent=provider==='free'
      ?'FREE: no credit, no account or key. The shared model may be rate-limited.'
      :provider==='puter'
      ?'Puter: sign-in may be requested; usage has its own allowance.'
      :'PREMIUM: official provider API key and available balance required. No paid model is being represented as free.';
    alert.hidden=provider==='free';
  };
  const syncSelect=()=>{
    const m=document.getElementById('model')?.value||'';
    const wanted=provider+'|'+m;
    if([...select.options].some(o=>o.value===wanted)) select.value=wanted;
    updateStatus();
  };
  const selectModel=()=>{
    const sep=select.value.indexOf('|');const next=select.value.slice(0,sep);const model=select.value.slice(sep+1);
    if(next!==provider){setProvider(next);if(next!==provider){syncSelect();return;}}
    const field=document.getElementById('model');if(field)field.value=model;
    if(next==='free'){const freeField=document.getElementById('free-model-picker');if(freeField)freeField.value=model;}
    document.getElementById('message')?.focus();updateStatus();
  };
  select.addEventListener('change',selectModel);
  switchBtn.addEventListener('click',()=>{select.value='free|Qwen3.5-9B';selectModel();alert.hidden=true;});
  document.querySelectorAll('.providers [data-provider]').forEach(b=>b.addEventListener('click',()=>queueMicrotask(syncSelect)));
  const modelField=document.getElementById('model');modelField?.addEventListener('input',syncSelect);
  document.getElementById('free-model-picker')?.addEventListener('change',syncSelect);
  const error=document.getElementById('error');
  if(error&&typeof MutationObserver!=='undefined'){
    new MutationObserver(()=>{
      const msg=error.textContent||'';
      if(/credit|billing|quota|API key|balance|payment|Not connected/i.test(msg) && !error.hidden){
        alert.hidden=false;
      }
    }).observe(error,{childList:true,characterData:true,subtree:true});
  }
  const textField=document.getElementById('message');
  if(textField){ textField.disabled=false; textField.placeholder='Ask free Qwen, GPT OSS, Astra or Claude…'; }
  // Make keyless models discoverable without navigating the settings drawer.
  if (provider==='free') updateStatus();
})();
`;
if(!app.includes(clientMarker)) {
  if (!app.includes("const presets = {")) throw new Error('Could not find presets in frontend; preserve original build.');
  if (!app.includes("fetch('/api/chat'")) throw new Error('Could not find chat request in frontend; preserve original build.');
  app=app.replace("fetch('/api/chat'", "fetch(provider === 'openai' ? '/api/openai/chat' : '/api/chat'");
  // Keep a failed message in the input so a billing error never eats the user's typed text.
  const marker="waiting.remove();\n    if (e.name === 'AbortError')";
  if(app.includes(marker))app=app.replace(marker,"waiting.remove();\n    $('message').value = text; resize();\n    if (e.name === 'AbortError')");
  app+='\n'+client;
  save(appPath,app);
}
const theme = String.raw`
${styleMarker}
.cc-model-bar{position:relative;z-index:25;width:min(810px,100%);margin:0 auto 8px;border:1px solid #926ad87a;border-radius:15px;background:linear-gradient(120deg,#1b1236ef,#0f0b21ef);padding:11px 14px;color:#eee9ff;box-shadow:0 5px 20px #0006}
.cc-model-line{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.cc-model-line>label{font-size:11px;letter-spacing:1.2px;font-weight:800;color:#cbb6fc;white-space:nowrap}
#cc-fast-model{min-width:180px;flex:1 1 230px;border:1px solid #785da7;border-radius:9px;padding:11px;color:#fff;background:#251b40;outline:none;font-size:13px;min-height:43px}
#cc-fast-model:focus{border-color:#c4a9fa}
.cc-model-settings{background:#342353;color:#f3eaff;border:1px solid #856ca9;border-radius:9px;padding:10px 13px;font-size:12px;min-height:42px}
.cc-model-description{font-size:11px;line-height:1.55;color:#b0a1ce;margin:8px 0 0}
.cc-switch-free[hidden]{display:none!important}
.cc-switch-free{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding:9px 12px;border:1px solid #9d7190;background:#40203bf0;border-radius:10px;font-size:12px;color:#fbe0f0}
.cc-switch-free button{background:#b07cfa;color:#120b25;border:0;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:800;white-space:nowrap}
body.uni-world #composer-wrap,body.uni-world .composer-wrap{pointer-events:auto!important}
body.uni-world .composer,body.uni-world #message,body.uni-world .cc-model-bar,body.uni-world #cc-fast-model{pointer-events:auto!important}
@media(max-width:650px){.cc-model-bar{padding:10px;}.cc-model-line{gap:7px}.cc-model-line>label{width:100%;font-size:10px}#cc-fast-model{flex:1 1 170px;min-width:150px}.cc-model-settings{font-size:10px;padding:10px 8px}.cc-switch-free{flex-direction:column;align-items:stretch}}
`;
if(!style.includes(styleMarker)){style+='\n'+theme;save(stylePath,style);}
console.log('C.C. model/chat usability upgrade installed');