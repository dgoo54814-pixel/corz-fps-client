// C.C. AI Workbench — additive model-access upgrade. No embedded API keys.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
function patchFile(name, patch) {
 const full=path.join(root,name),before=readFileSync(full,'utf8');
 const after=patch(before);
 if(after!==before)writeFileSync(full,after,'utf8');
}
const serverMarker='// CC_MULTI_CHAT_V2';
const handler=String.raw`
// CC_MULTI_CHAT_V2
const ccChatUsage = new Map();
function ccRate(id, max, windowMs) {
 const now=Date.now();if(ccChatUsage.size>12000)ccChatUsage.clear();
 const seen=(ccChatUsage.get(id)||[]).filter(t=>now-t<windowMs);
 if(seen.length>=max)return false;seen.push(now);ccChatUsage.set(id,seen);return true;
}
async function ccMultiChat(req,res) {
 if(typeof isSameOrigin==='function'&&!isSameOrigin(req))return reply(res,403,{error:'Invalid request origin.'});
 if(typeof settings!=='undefined'&&settings.publicChat===false&&!(typeof ownerSession==='function'&&ownerSession(req)))return reply(res,403,{error:'The owner has paused public chat.'});
 const ip=String(req.socket.remoteAddress||'visitor').slice(0,100);
 if(!ccRate('visitor:'+ip,20,60000))return reply(res,429,{error:'Too many requests. Please try again shortly.'});
 let p;
 try {let bytes=0;const parts=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>120000)return reply(res,413,{error:'Request too large.'});parts.push(chunk)}p=JSON.parse(Buffer.concat(parts).toString('utf8'));}
 catch{return reply(res,400,{error:'Malformed request.'})}
 const kind=p?.provider,model=p?.model,key=p?.key;
 const allowedFree=new Set(['Qwen3.5-9B','Qwen3.6-27B','gpt-oss-20b']);
 if(!['free','openai','claude'].includes(kind))return reply(res,400,{error:'Unknown provider.'});
 if(!Array.isArray(p.messages)||!p.messages.length||p.messages.length>32||p.messages.at(-1)?.role!=='user'||p.messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>10000))return reply(res,400,{error:'Invalid chat history.'});
 if(typeof model!=='string'||model.length>90||!/^[\w.-]+$/.test(model))return reply(res,400,{error:'Invalid model ID.'});
 if(kind==='free'&&!allowedFree.has(model))return reply(res,400,{error:'That model is not available on the free endpoint.'});
 if(kind!=='free'&&(typeof key!=='string'||key.trim().length<15||key.length>1200))return reply(res,400,{error:'This official API requires your own API key and available credits. Select a free model for no-key chat.',tryFree:true});
 if(kind==='free'&&!ccRate('free:'+model,2,60000))return reply(res,429,{error:'Free provider capacity is shared (two requests per minute per model). Choose another free model or retry shortly.'});
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),85000);
 try {
  const headers={'Content-Type':'application/json'};
  const max=Math.max(256,Math.min(2048,Number(p.maxTokens)||1024));
  let url,body;
  if(kind==='free'){
   url=process.env.OVH_TEST_ENDPOINT||'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions';
   body={model,messages:p.messages,max_tokens:Math.min(max,1024)};
  }else if(kind==='openai'){
   url=process.env.OPENAI_API_ENDPOINT||'https://api.openai.com/v1/responses';
   headers.Authorization='Bearer '+key.trim();
   body={model,input:p.messages.map(m=>({role:m.role,content:m.content})),max_output_tokens:max};
  }else{
   url=process.env.CLAUDE_API_ENDPOINT||'https://api.anthropic.com/v1/messages';
   headers['x-api-key']=key.trim();headers['anthropic-version']='2023-06-01';
   body={model,messages:p.messages,max_tokens:max};
  }
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal});
  let data;try{data=await response.json()}catch{return reply(res,502,{error:'Model provider did not return JSON.'})}
  if(!response.ok){
    const message=String(data?.error?.message||data?.message||'Provider returned '+response.status).slice(0,350);
    const billing=/credit|billing|quota|payment|insufficient|balance/i.test(message)||response.status===402;
    return reply(res,response.status===429?429:response.status>=500?502:Math.min(response.status,499),{
      error:billing?'This premium model requires credits with the official provider. Switch to FREE Qwen or GPT OSS to chat without an API key.':message,
      tryFree:billing,
    });
  }
  let result='';
  if(kind==='claude')result=Array.isArray(data.content)?data.content.filter(v=>v.type==='text').map(v=>v.text||'').join('\n'):'';
  else if(kind==='openai')result=typeof data.output_text==='string'?data.output_text:(Array.isArray(data.output)?data.output.flatMap(x=>(x.content||[]).filter(y=>y.type==='output_text').map(y=>y.text||'')).join('\n'):'');
  else result=data.choices?.[0]?.message?.content||'';
  if(typeof result!=='string'||!result.trim())return reply(res,502,{error:'The provider returned no text. Try a different model.'});
  return reply(res,200,{text:result,model,provider:kind});
 }catch(e){return reply(res,502,{error:e?.name==='AbortError'?'The model request timed out.':'The provider is unavailable. Try a different free model.'});}
 finally{clearTimeout(timeout)}
}
`;
patchFile('server.js',s=>{
 if(s.includes(serverMarker))return s;
 const anchor='async function route(req, res) {';
 if(!s.includes(anchor))throw Error('Cannot patch unknown server route safely');
 s=s.replace(anchor,handler+'\n'+anchor);
 const marker=/const pathname\s*=\s*new URL\(req\.url,[^;]+\)\.pathname;/;
 if(!marker.test(s))throw Error('No route pathname recognized');
 return s.replace(marker,m=>m+"\n  if (req.method === 'POST' && pathname === '/api/cc-multichat') return ccMultiChat(req,res);");
});
const clientMarker='// CC_MULTI_CHAT_UI_V2';
const script=String.raw`
// CC_MULTI_CHAT_UI_V2
(() => {
 if(document.getElementById('cc-multi-workspace'))return;
 const workspace=document.querySelector('.workspace')||document.querySelector('main');
 if(!workspace)return;
 const models=[
  ['free','Qwen3.5-9B','FREE · Qwen 3.5 9B'],
  ['free','Qwen3.6-27B','FREE · Qwen 3.6 27B'],
  ['free','gpt-oss-20b','FREE · GPT OSS 20B'],
  ['openai','gpt-6.2-astra','GPT-6.2 Astra · API credits'],
  ['openai','gpt-6.2-sol','GPT-6.2 Sol · API credits'],
  ['openai','gpt-6-luna','GPT-6 Luna · API credits'],
  ['claude','claude-opus-5','Claude Opus 5 · API credits'],
  ['claude','claude-sonnet-5','Claude Sonnet 5 · API credits'],
  ['claude','claude-fable-5','Claude Fable 5 · API credits'],
  ['claude','claude-opus-4-6','Claude Opus 4.6 · API credits'],
 ];
 const root=document.createElement('section');root.id='cc-multi-workspace';root.className='cc-multi-chat';
 root.innerHTML='<div class="cc-multi-header"><div><span class="cc-multi-brand">✦ C.C. UNIVERSE</span><h2>Chat with AI</h2><p>Choose a free model, or connect your own premium provider.</p></div><button type="button" id="cc-original-chat" class="cc-multi-secondary">Owner Claude / original chat</button></div><div class="cc-multi-controls"><label for="cc-multi-model">AI MODEL</label><select id="cc-multi-model" aria-label="AI model"></select><button type="button" id="cc-multi-clear" class="cc-multi-secondary">New chat</button></div><div id="cc-multi-paid" class="cc-multi-paid" hidden><label for="cc-multi-key">Provider API key (not stored)</label><div><input type="password" id="cc-multi-key" autocomplete="off" spellcheck="false" placeholder="Enter your own key"/><button type="button" id="cc-multi-eye">Show</button></div><small>Claude/ChatGPT API credits are not included in subscriptions. For no credit, choose FREE above.</small></div><div id="cc-multi-notice" class="cc-multi-notice">✓ FREE mode · No API key, subscription or credits. Shared limits apply.</div><div id="cc-multi-thread" class="cc-multi-thread"><div class="cc-multi-empty"><div class="cc-multi-mark">✦</div><h3>What can I help you explore?</h3><p>Ask anything. Your selected model appears above.</p><div class="cc-multi-prompts"><button type="button">Explain quantum physics simply</button><button type="button">Write a Roblox Luau GUI</button><button type="button">Build a study plan</button></div></div></div><form id="cc-multi-form" class="cc-multi-form"><textarea id="cc-multi-input" rows="2" maxlength="10000" placeholder="Message a free AI…" aria-label="Your message"></textarea><button type="submit" id="cc-multi-send">Send ↗</button></form><p class="cc-multi-footer">Free Qwen and GPT OSS models come from OVHcloud, and may be rate-limited. <a href="https://claude.ai" target="_blank" rel="noopener noreferrer">Claude.ai</a> · <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer">ChatGPT</a> · <a href="https://antigravity.google/docs/models" target="_blank" rel="noopener noreferrer">Antigravity models</a></p>';
 const nav=document.querySelector('.uni-nav')||document.querySelector('.topbar');
 if(nav?.parentElement===workspace)nav.insertAdjacentElement('afterend',root);else workspace.prepend(root);
 const el=id=>document.getElementById(id);
 const select=el('cc-multi-model'),input=el('cc-multi-input'),thread=el('cc-multi-thread'),notice=el('cc-multi-notice'),paid=el('cc-multi-paid'),key=el('cc-multi-key');
 const id=(a,b)=>a+'|'+b;let messages=[],busy=false,controller=null;
 const renderEmpty=()=>{thread.innerHTML='<div class="cc-multi-empty"><div class="cc-multi-mark">✦</div><h3>What can I help you explore?</h3><p>Ask anything. Your selected model appears above.</p><div class="cc-multi-prompts"><button type="button">Explain quantum physics simply</button><button type="button">Write a Roblox Luau GUI</button><button type="button">Build a study plan</button></div></div>';};
 for(const [p,m,label] of models){const opt=document.createElement('option');opt.value=id(p,m);opt.textContent=label;select.append(opt)}
 const current=()=>{const i=select.value.indexOf('|');return {provider:select.value.slice(0,i),model:select.value.slice(i+1)}};
 function update(){const {provider}=current();paid.hidden=provider==='free';notice.classList.remove('error');notice.textContent=provider==='free'?'✓ FREE mode · No API key, subscription or credits. Rate-limited shared capacity.':'Premium official API · Requires a provider API key and available credits.';key.value='';}
 function clear(){messages=[];renderEmpty();notice.classList.remove('error');notice.textContent='New conversation ready.';}
 function bubble(role,text){thread.querySelector('.cc-multi-empty')?.remove();const row=document.createElement('div');row.className='cc-multi-bubble '+role;const tag=document.createElement('strong');tag.textContent=role==='user'?'YOU':'✦ AI';const body=document.createElement('div');body.textContent=text;row.append(tag,body);thread.append(row);thread.scrollTop=thread.scrollHeight;return row;}
 function setBusy(next){busy=next;el('cc-multi-send').textContent=next?'Cancel':'Send ↗';select.disabled=next;input.disabled=next;}
 async function send(event){if(event)event.preventDefault();if(busy){controller?.abort();return}const prompt=input.value.trim();if(!prompt)return;
 const {provider,model}=current();const secret=key.value.trim();
 if(provider!=='free'&&!secret){notice.classList.add('error');notice.textContent='This model needs your provider API key and credit. Choose any FREE model above to chat with no key.';key.focus();return;}
 if(messages.length>=30){notice.classList.add('error');notice.textContent='Conversation limit reached. Start a new chat.';return;}
 input.value='';messages.push({role:'user',content:prompt});bubble('user',prompt);const wait=bubble('assistant','Thinking…');controller=new AbortController();setBusy(true);
 try{const response=await fetch('/api/cc-multichat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider,model,key:secret,messages,maxTokens:1024}),signal:controller.signal});const data=await response.json();
 if(!response.ok)throw new Error(data?.error||'Provider unavailable');if(!data.text)throw Error('Model returned no answer.');
 wait.querySelector('div').textContent=data.text;messages.push({role:'assistant',content:data.text});notice.classList.remove('error');notice.textContent='✓ Response received from '+model;
 }catch(error){wait.remove();messages.pop();input.value=prompt;notice.classList.add('error');notice.textContent=(error.name==='AbortError'?'Request cancelled.':error.message)+' Choose FREE above if the provider requires credits.';}finally{controller=null;setBusy(false);input.focus()}
 }
 select.addEventListener('change',()=>{clear();update()});
 el('cc-multi-clear').addEventListener('click',clear);
 el('cc-multi-eye').addEventListener('click',()=>{key.type=key.type==='password'?'text':'password'});
 el('cc-original-chat').addEventListener('click',()=>{document.body.classList.remove('cc-multi-active');input.blur();document.getElementById('menu')?.click();});
 el('cc-multi-form').addEventListener('submit',send);
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();send()}});
 thread.addEventListener('click',event=>{const btn=event.target.closest('.cc-multi-prompts button');if(btn){input.value=btn.textContent;input.focus()}});
 const restore=document.createElement('button');restore.type='button';restore.className='cc-multi-restore';restore.textContent='✦ Free & all models';restore.onclick=()=>{document.body.classList.add('cc-multi-active');input.focus()};
 const navBtns=document.querySelector('.uni-nav-right')||document.querySelector('.top-right');navBtns?.prepend(restore);
 document.body.classList.add('cc-multi-active');select.value='free|Qwen3.5-9B';update();
})();
`;
patchFile('public/app.js',s=>s.includes(clientMarker)?s:s+'\n'+script);
const css=String.raw`
/* CC_MULTI_CHAT_STYLE_V2 */
body.cc-multi-active .chat,body.cc-multi-active .composer-wrap,body.cc-multi-active #world-banner{display:none!important}
#cc-multi-workspace{display:none;box-sizing:border-box}
body.cc-multi-active #cc-multi-workspace{display:flex;flex-direction:column;flex:1;min-height:0;width:min(1020px,100%);margin:auto;padding:clamp(10px,2vw,28px);gap:14px;z-index:15;position:relative;color:#f4ebff}
.cc-multi-header{display:flex;align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(135deg,#2a1552d9,#161026ec);border:1px solid #8c6ccc70;border-radius:18px;padding:18px 22px}
.cc-multi-brand{font-size:10px;letter-spacing:2px;color:#c0a4f8;font-weight:800}.cc-multi-header h2{font-size:clamp(28px,4vw,42px);margin:6px 0;line-height:1.2}.cc-multi-header p{font-size:12px;color:#bba9d2;margin:0;line-height:1.5}
.cc-multi-secondary,.cc-multi-restore{border-radius:9px;border:1px solid #9274c3;background:#301e56;color:#efe3ff;padding:10px 12px;cursor:pointer;white-space:nowrap;font-size:12px}
.cc-multi-controls{display:flex;align-items:center;gap:12px}.cc-multi-controls label{font-size:11px;letter-spacing:1px;font-weight:800;white-space:nowrap;color:#c9b2ed}
#cc-multi-model{min-width:0;flex:1;padding:12px;background:#26193f;color:white;border:1px solid #9174c1;border-radius:10px;font-size:13px;min-height:44px}
.cc-multi-paid{border:1px solid #9870a1;background:#30162e;padding:11px 14px;border-radius:11px}.cc-multi-paid[hidden]{display:none}.cc-multi-paid>label{display:block;font-size:12px;margin-bottom:7px}.cc-multi-paid>div{display:flex;gap:6px}.cc-multi-paid input{flex:1;min-width:0;background:#120e21;color:white;padding:10px;border:1px solid #826397;border-radius:7px}.cc-multi-paid button{background:#9876d4;color:white;border:0;border-radius:7px;padding:8px 11px}.cc-multi-paid small{display:block;margin-top:8px;line-height:1.5;color:#d1afd1}
.cc-multi-notice{font-size:12px;color:#d5c4ee;line-height:1.5}.cc-multi-notice.error{background:#48203a;border:1px solid #a5578a;border-radius:10px;padding:10px;color:#ffd4e9}
.cc-multi-thread{flex:1;min-height:130px;overflow:auto;display:flex;flex-direction:column;gap:16px;padding:14px 10px;border:1px solid #5137717f;border-radius:16px;background:#100b22cc;scrollbar-width:thin}
.cc-multi-empty{margin:auto;text-align:center;color:#bba9d1;padding:14px}.cc-multi-mark{font-size:50px;color:#bc8cff}.cc-multi-empty h3{color:#fff;font-size:26px;margin:5px 0}.cc-multi-empty p{font-size:12px;line-height:1.5}.cc-multi-prompts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:15px}.cc-multi-prompts button{background:#2b1d49;color:#dbcaff;border:1px solid #7658a3;border-radius:10px;font-size:11px;padding:9px 12px;cursor:pointer}
.cc-multi-bubble{display:flex;flex-direction:column;gap:4px;max-width:89%;overflow-wrap:anywhere}.cc-multi-bubble strong{font-size:10px;letter-spacing:1px;color:#b9a0da}.cc-multi-bubble div{padding:12px 15px;border:1px solid #8366a158;border-radius:14px;background:#251934;white-space:pre-wrap;line-height:1.5;font-size:13px}.cc-multi-bubble.user{align-self:flex-end}.cc-multi-bubble.user div{background:#463068}
.cc-multi-form{display:flex;gap:10px;padding:11px;background:#1b1231f2;border:1px solid #9573ce;border-radius:15px}.cc-multi-form textarea{flex:1;min-width:0;min-height:54px;max-height:145px;border:0;outline:0;resize:vertical;background:transparent;color:white;font-size:14px;padding:8px}.cc-multi-form button{background:#8659dd;color:white;border:0;border-radius:10px;padding:10px 18px;cursor:pointer;font-weight:800}
.cc-multi-footer{font-size:10px;text-align:center;color:#aa96c7;margin:0 0 7px;line-height:1.4}.cc-multi-footer a{color:#d9bcff}
@media(max-width:720px){body.cc-multi-active #cc-multi-workspace{padding:8px;gap:9px}.cc-multi-header{padding:12px}.cc-multi-header h2{font-size:25px}.cc-multi-header p{font-size:11px}.cc-multi-header>button{white-space:normal;max-width:100px;font-size:10px}.cc-multi-controls{flex-wrap:wrap;gap:5px}.cc-multi-controls>label{width:100%}.cc-multi-controls #cc-multi-model{width:100%;flex-basis:70%}.cc-multi-controls .cc-multi-secondary{font-size:10px}.cc-multi-thread{min-height:130px}.cc-multi-form textarea{font-size:13px}.cc-multi-form button{padding:9px 12px}.cc-multi-empty h3{font-size:20px}}
`;
patchFile('public/style.css',s=>s.includes('CC_MULTI_CHAT_STYLE_V2')?s:s+'\n'+css);
console.log('C.C. multi-model chat installed; original owner chat preserved');