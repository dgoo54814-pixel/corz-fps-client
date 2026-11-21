// C.C. Universe visual skin for the existing C.C. AI Workbench.
// Runs after the original files are unpacked, before its server starts.
// Never modifies secrets, owner authentication, provider integrations or request handling.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = join(process.cwd(), 'public');
const cssPath = join(dir, 'style.css');
const jsPath = join(dir, 'app.js');
const htmlPath = join(dir, 'index.html');
const styleTag = '/* C.C. UNIVERSE visual edition v1.0 */';
const scriptTag = '/* C.C. UNIVERSE behavior edition v1.0 */';
const css = String.raw`
/* C.C. UNIVERSE visual edition v1.0 */
:root{color-scheme:dark;--uni-purple:#9258ef;--uni-lilac:#c9a5ff;--uni-border:rgba(195,161,255,.3)}
body.uni-world{margin:0;background:#080417!important;color:#f4eaff!important;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;overflow-x:hidden}
body.uni-world::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 44% 37% at 16% 36%,rgba(183,114,255,.68) 0%,rgba(109,42,221,.38) 39%,transparent 80%),radial-gradient(ellipse 58% 59% at 74% 8%,rgba(90,30,181,.35),transparent 76%),radial-gradient(ellipse 60% 70% at 45% 93%,rgba(49,15,101,.4),transparent),#080314}
body.uni-world .shell{display:block!important;background:transparent!important;min-height:100dvh!important;position:relative!important}
body.uni-world .workspace{width:100%!important;min-width:0!important;min-height:100dvh!important;background:transparent!important;display:flex!important;flex-direction:column!important;position:relative!important;z-index:2}
body.uni-world .topbar{display:none!important}
body.uni-world .sidebar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:min(400px,92vw)!important;z-index:110!important;box-shadow:28px 0 80px #04020be0!important;transform:translateX(-108%)!important;transition:transform .24s ease!important;display:flex!important;background:linear-gradient(160deg,#1b102e,#110c21)!important;border-right:1px solid #8869be50!important;overflow:auto!important;max-height:100dvh!important}
body.uni-world .sidebar.open,body.uni-world .sidebar.uni-open{transform:translateX(0)!important}
body.uni-world #shade:not([hidden]){position:fixed!important;inset:0!important;z-index:100!important;background:rgba(6,3,16,.72)!important;backdrop-filter:blur(10px)!important}
body.uni-world .uni-sky{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
body.uni-world .uni-sky:before{content:"";position:absolute;width:110%;height:150%;left:-37%;top:-34%;transform:rotate(-31deg);background:linear-gradient(90deg,transparent 40%,rgba(231,198,255,.02) 47%,rgba(239,215,255,.31) 49%,rgba(234,189,255,.17) 52%,rgba(150,82,255,.05) 60%,transparent 68%);filter:blur(15px)}
body.uni-world .uni-sky:after{content:"";position:absolute;width:58vw;height:58vw;min-width:460px;min-height:460px;left:-20vw;top:2vh;border-radius:50%;background:radial-gradient(circle,rgba(255,243,255,.94) 0%,rgba(214,170,255,.6) 12%,rgba(142,71,255,.33) 32%,transparent 67%);filter:blur(60px);opacity:.8}
.uni-star{position:absolute;display:block;border-radius:50%;background:#fff;box-shadow:0 0 6px 1px rgba(246,228,255,.85);opacity:.65;animation:uni-twinkle var(--d) ease-in-out infinite alternate}
@keyframes uni-twinkle{from{opacity:.18;transform:scale(.65)}to{opacity:.95;transform:scale(1.16)}}
body.uni-world .uni-nav{height:74px;position:relative;z-index:22;flex:0 0 74px;width:min(1420px,100%);margin:0 auto;padding:0 clamp(24px,5vw,70px);box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:16px}
.uni-brand{display:flex;align-items:center;gap:8px;text-decoration:none;color:#faf3ff!important;font-weight:800;font-size:17px;letter-spacing:-.04em}.uni-brand-mark{display:grid;place-items:center;color:#f9ebff;font-size:27px;filter:drop-shadow(0 0 10px #a37aff)}.uni-brand span:last-child{font-weight:400;font-size:13px;color:#e2d3f8}
.uni-nav-center{display:flex;align-items:center;gap:3px;padding:5px;background:rgba(18,13,34,.82);border:1px solid rgba(219,184,255,.21);box-shadow:0 5px 28px #08031699;border-radius:14px;backdrop-filter:blur(18px)}
.uni-nav button{font:inherit;cursor:pointer}.uni-nav-center button{color:#d1c4e7;padding:8px 12px;font-size:12px;border-radius:9px;border:0;background:none;transition:.15s}.uni-nav-center button:hover{background:rgba(168,121,255,.2);color:white}
.uni-nav-right{display:flex;gap:10px;align-items:center}.uni-signin{background:none;color:#e7dff4;border:0;font-size:12px;padding:11px}.uni-cta{background:linear-gradient(135deg,#9f6dff,#6240c5);color:white;border:1px solid #c1a4ff80;border-radius:11px;box-shadow:0 0 18px #733af885;padding:10px 16px;font-size:12px;font-weight:750}
.uni-cta:hover{filter:brightness(1.18)}
body.uni-world #world-banner{background:rgba(27,16,45,.52)!important;color:#dbbfff!important;text-align:center!important;border-top:1px solid #b99bf51c!important;border-bottom:1px solid #b99bf51c!important;font-size:10px!important;letter-spacing:1px!important;position:relative!important;z-index:3!important;padding:7px 12px!important}
body.uni-world .chat{position:relative!important;z-index:2;flex:1 1 auto!important;min-height:0!important;scrollbar-width:thin;scrollbar-color:#624c8b transparent}
body.uni-world #thread{position:relative;max-width:none!important;padding:0!important}
body.uni-world #thread:not(.has-messages) #welcome{width:100%;max-width:none!important;min-height:0!important;margin:0!important;padding:0!important;background:none!important;overflow:visible!important}
.uni-hero{position:relative;text-align:center;padding:40px 22px 32px;min-height:720px;isolation:isolate}
.uni-hero-inner{position:relative;z-index:2}.uni-pretitle{margin-top:8px;font-size:clamp(23px,3.2vw,34px);line-height:1.25;font-weight:300;letter-spacing:-.04em;color:#ddd0f4}.uni-title{font-size:clamp(58px,8.8vw,106px);line-height:1.01;margin:8px 0 17px!important;letter-spacing:-.075em;font-weight:760;color:#faf4ff;text-shadow:0 0 65px #b78eff80}.uni-title strong{font-weight:800;color:#fff}
.uni-badge{display:inline-flex;align-items:center;gap:8px;letter-spacing:.04em;color:#e9d9fa;font-size:12px;border:1px solid #b091e275;background:#1c1036a8;padding:8px 16px;border-radius:999px;box-shadow:0 0 28px #7e4cbb60;backdrop-filter:blur(12px)}.uni-badge span{color:#fff;font-size:15px}
.uni-preview{position:relative;z-index:2;display:grid;grid-template-columns:210px minmax(0,1fr);width:min(1090px,calc(100vw - 44px));min-height:390px;margin:79px auto 0;border:1px solid #9879cb8c;border-radius:24px;background:linear-gradient(134deg,rgba(30,22,53,.89),rgba(12,9,29,.91) 70%);box-shadow:0 30px 96px #060310c9,0 0 28px #ad68f62c;overflow:hidden;text-align:left;backdrop-filter:blur(22px)}
.uni-preview-sidebar{min-width:0;border-right:1px solid #b495d638;background:linear-gradient(180deg,rgba(24,18,44,.9),rgba(8,8,23,.88));padding:21px 13px}.uni-preview-search{border:1px solid #b0a0c447;background:#19152f;border-radius:11px;padding:11px 9px;font-size:11px;color:#a79bbd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.uni-history-label{font-size:9px;letter-spacing:1.5px;color:#9a8fae;margin:27px 9px 9px}.uni-history-item{width:100%;text-align:left;display:block;border:0;background:none;color:#c9c1d5;font-size:11px;padding:12px 9px;border-bottom:1px solid #9a8ba91c;line-height:1.5;cursor:pointer}.uni-history-item:hover{color:#fff;background:#7862a02e;border-radius:8px}
.uni-preview-main{position:relative;padding:22px 20px 22px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;min-width:0}.uni-preview-top{display:flex;align-items:center;justify-content:flex-end;gap:12px;color:#dad0eb;font-size:13px}.uni-beta{font-size:9px;letter-spacing:1.3px;border:1px solid #b79ad367;padding:5px 11px;border-radius:8px;color:#b89ddf}.uni-preview-chat{max-width:620px;width:100%;margin:20px auto 0;display:grid;gap:12px}.uni-message{width:fit-content;max-width:90%;padding:12px 15px;border-radius:13px;font-size:12px;line-height:1.6;color:#ded4ed;border:1px solid rgba(164,138,193,.28);background:rgba(21,16,39,.92);box-shadow:0 8px 18px #0002}.uni-message.user{margin-left:auto;background:rgba(72,52,104,.55);color:#fff}.uni-message.assistant{margin-right:auto}.uni-preview-note{align-self:center;font-size:10px;color:#aa98c8;letter-spacing:.02em;opacity:.75}.uni-ask-preview{width:100%;border:1px solid #866fa451;border-radius:10px;background:rgba(46,31,65,.48);color:#c7bddb;padding:13px 14px;text-align:left;font-size:11px;cursor:pointer}.uni-ask-preview:hover{background:#51306c8c;color:#fff}
.uni-float-card{position:absolute;z-index:5;top:190px;left:50%;width:min(300px,70vw);transform:translateX(-50%);border:1px solid #9374c18e;border-radius:17px;background:linear-gradient(140deg,#251c3d,#120e24);box-shadow:0 23px 68px #000b,0 0 22px #8654ba48;padding:16px;text-align:left}.uni-float-top{display:flex;gap:9px;align-items:center;margin-bottom:12px}.uni-avatar{width:29px;height:29px;border-radius:50%;display:grid;place-items:center;border:1px solid #cab2f8;background:#6b4bc2;box-shadow:0 0 11px #9162efab}.uni-float-question{font-size:11px;color:#f5edff;line-height:1.55}.uni-float-ans{margin-top:10px;padding:12px;border:1px solid #76649770;background:#110d22;border-radius:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;color:#c6b2e1;font-size:11px}.uni-purple-check{height:28px;width:28px;display:grid;place-items:center;background:#722cda;border-radius:50%;color:#fff;font-weight:900;box-shadow:0 0 13px #9960ff}
body.uni-world .composer-wrap{position:sticky!important;bottom:0!important;z-index:20!important;flex:0 0 auto!important;padding:8px 18px max(15px,env(safe-area-inset-bottom))!important;background:linear-gradient(0deg,#0a061aeF 70%,transparent)!important;border:0!important}
body.uni-world #composer{width:min(810px,100%)!important;background:rgba(23,17,43,.95)!important;border:1px solid rgba(168,131,228,.6)!important;border-radius:18px!important;box-shadow:0 12px 48px #000a,0 0 24px #bd84ff25!important}
body.uni-world #message{color:#f4ebff!important}.uni-footer-copy{display:block;text-align:center;color:#9d8bad;font-size:10px;letter-spacing:.04em;margin:0 auto 6px}
body.uni-world #thread.has-messages{max-width:880px!important;margin:0 auto!important;padding:26px 20px 50px!important}
body.uni-world #thread.has-messages .bubble{background:#1a122ef0!important;border:1px solid #836a9d64!important;color:#eee4ff!important}
body.uni-world #thread.has-messages .user .bubble{background:#35234feF!important}
body.uni-world .uni-credit-guide{display:none;max-width:800px;margin:5px auto 10px;padding:12px;border:1px solid #b696ea77;background:#1d1237;color:#eee2fc;border-radius:12px;font-size:12px;line-height:1.6}
body.uni-world .uni-credit-guide button{margin-left:8px;color:#fff;background:#6e40b9;border:1px solid #a587dc;border-radius:9px;padding:8px 12px;font-size:11px;cursor:pointer}
body.uni-world .uni-credit-guide.visible{display:block}
.uni-owner-free{border:1px solid rgba(165,132,221,.45);border-radius:12px;padding:13px;margin:16px 0;background:#2d1a4473;color:#e9d7ff;font-size:12px;line-height:1.6}.uni-owner-free strong{display:block;margin-bottom:6px}.uni-owner-free button{background:#7447c8;color:#fff;border-radius:9px;border:1px solid #ae8aed;padding:10px 12px;margin-top:9px;cursor:pointer}
@media(min-width:1100px){.uni-hero{padding-top:38px}.uni-preview{margin-top:80px}.uni-float-card{top:192px}}
@media(max-width:760px){body.uni-world .uni-nav{height:62px;flex-basis:62px;padding:0 15px}.uni-nav-center{display:none}.uni-nav-right{gap:3px}.uni-signin{padding:8px;font-size:11px}.uni-cta{font-size:10px;padding:9px 11px}.uni-brand{font-size:14px}.uni-brand span:last-child{font-size:11px}.uni-brand-mark{font-size:23px}.uni-hero{min-height:610px;padding:41px 10px 10px}.uni-pretitle{font-size:24px}.uni-title{font-size:clamp(48px,12.2vw,77px)}.uni-badge{font-size:10px}.uni-preview{margin-top:82px;width:calc(100vw - 18px);grid-template-columns:88px minmax(0,1fr);min-height:350px;border-radius:17px}.uni-preview-sidebar{padding:13px 5px}.uni-preview-search{font-size:8px;padding:9px 4px}.uni-history-label{font-size:8px;margin:23px 3px 10px}.uni-history-item{font-size:8px;padding:12px 3px;line-height:1.45}.uni-preview-main{padding:14px 8px}.uni-preview-top{font-size:10px}.uni-beta{font-size:8px;padding:4px 6px}.uni-preview-chat{margin:44px auto 0}.uni-message{font-size:10px;padding:10px}.uni-preview-note{font-size:8px;text-align:center}.uni-ask-preview{font-size:9px;padding:10px}.uni-float-card{width:min(274px,77vw);top:190px;padding:12px}.uni-float-question{font-size:10px}.uni-float-ans{font-size:10px}.uni-brand span:last-child{display:none}body.uni-world #world-banner{font-size:8px!important}.uni-owner-free{font-size:11px}}
@media(max-width:370px){.uni-cta{padding:9px 7px}.uni-signin{font-size:10px}.uni-preview{grid-template-columns:69px minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce){.uni-star{animation:none}}
`;
const js = String.raw`
/* C.C. UNIVERSE behavior edition v1.0 */
(() => {
  document.body.classList.add('uni-world');
  const $ = id => document.getElementById(id);
  const shell = document.querySelector('.shell');
  const workspace = document.querySelector('.workspace');
  const sidebar = $('sidebar');
  const thread = $('thread');
  if (!shell || !workspace || !thread) return;
  const escapeHtml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"','&quot;');
  const prompts = [
    'Explain the Big Bang theory in a way a 5-year-old can understand.',
    'How do I build my first AI-powered app?',
    'Help me create a fascinating sci-fi world.',
    'Give me three innovative small business ideas.'
  ];
  const starfield = document.createElement('div');
  starfield.className = 'uni-sky'; starfield.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('span');
    el.className = 'uni-star';
    const x = ((i * 73.913) % 100).toFixed(3);
    const y = ((i * 37.147 + 17) % 100).toFixed(3);
    const size = i % 19 === 0 ? 3.1 : i % 8 === 0 ? 2.1 : 1.2;
    el.style.cssText = 'left:' + x + '%;top:' + y + '%;width:' + size + 'px;height:' + size + 'px;--d:' + (2 + i % 4) + 's;animation-delay:-' + (i % 6) + 's';
    starfield.append(el);
  }
  document.body.prepend(starfield);
  const nav = document.createElement('header');
  nav.className = 'uni-nav';
  nav.innerHTML = '<a class="uni-brand" href="/" aria-label="C.C. Universe home"><span class="uni-brand-mark">✦</span><strong>C.C.</strong><span>Universe</span></a>' +
    '<nav class="uni-nav-center" aria-label="Site navigation"><button type="button" data-uni-action="new">New chat</button><button type="button" data-uni-action="models">Models</button><button type="button" data-uni-action="about">How it works</button><button type="button" data-uni-action="export">Export</button></nav>' +
    '<div class="uni-nav-right"><button type="button" class="uni-signin" data-uni-action="owner">Owner sign in</button><button type="button" class="uni-cta" data-uni-action="start">Start free journey</button></div>';
  workspace.prepend(nav);
  const creditGuide = document.createElement('div');
  creditGuide.className = 'uni-credit-guide';creditGuide.setAttribute('role','status');
  creditGuide.innerHTML = '<b>Claude API credits are required by Anthropic.</b> Your Claude.ai subscription does not include API usage. You can switch to an available free model instead — it is not Claude. <button type="button" data-uni-action="free">Use free AI</button>';
  const error = $('error');
  if (error && error.parentElement) error.insertAdjacentElement('afterend', creditGuide);
  const sendPrompt = text => {
    const box = $('message');if (!box) return;
    box.value = text;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    box.focus();
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const setFree = () => {
    const btn = document.querySelector('[data-provider="free"]');
    if (btn) { btn.click(); creditGuide.classList.remove('visible'); return; }
    creditGuide.classList.add('visible');
    creditGuide.firstChild && (creditGuide.firstChild.textContent = 'Free model switching is unavailable in this version. Claude API credits cannot be waived.');
  };
  const openSettings = owner => {
    const trigger = $(owner ? 'owner-top' : 'menu') || $(owner ? 'owner-entry' : 'model-top');
    if (trigger && !owner) trigger.click();
    else if (owner) {
      const oe = $('owner-top') || $('owner-entry');
      if (oe) oe.click(); else { sidebar?.classList.add('open'); $('shade')?.removeAttribute('hidden'); }
      sidebar?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  nav.addEventListener('click', e => {
    const button = e.target.closest('[data-uni-action]');
    if (!button) return;
    switch (button.dataset.uniAction) {
      case 'start': $('message')?.focus(); $('message')?.scrollIntoView({behavior:'smooth',block:'center'}); break;
      case 'models': openSettings(false); break;
      case 'owner': openSettings(true); break;
      case 'new': $('clear')?.click(); break;
      case 'export': $('export')?.click();break;
      case 'about': sendPrompt('Tell me what I can do with C.C. AI Workbench');break;
    }
  });
  creditGuide.addEventListener('click', e => {if(e.target.closest('[data-uni-action="free"]'))setFree();});
  const buildHero = () => [
    '<div class="uni-hero">',
      '<div class="uni-hero-inner"><div class="uni-pretitle">Experience</div><h1 class="uni-title">the <strong>Universe</strong></h1><div class="uni-badge"><span>✦</span> AI powered Chatbot <span>✦</span></div></div>',
      '<div class="uni-preview" aria-label="Demo of the chat experience">',
        '<div class="uni-preview-sidebar"><div class="uni-preview-search">⌕ Search chats</div><div class="uni-history-label">EXPLORE PROMPTS</div>',
          prompts.map((p,i)=>'<button class="uni-history-item" type="button" data-uni-prompt="'+i+'">◉ '+escapeHtml(p.slice(0,41))+'</button>').join(''),
        '</div>',
        '<div class="uni-preview-main"><div class="uni-preview-top">C.C. Universe <span class="uni-beta">FREE AI</span></div>',
          '<div class="uni-preview-chat"><div class="uni-message user">What if we could explore the universe with AI?</div><div class="uni-message assistant">Start by asking a question. Your real conversation appears here after you send it. ✨</div></div>',
          '<div class="uni-preview-note">Illustrative preview • not an active conversation</div>',
          '<button type="button" class="uni-ask-preview" data-uni-prompt="1">✦ Try a question: How do I build my first AI-powered app? <span style="float:right">➤</span></button>',
        '</div>',
      '</div>',
      '<div class="uni-float-card" aria-label="Suggested starter prompt"><div class="uni-float-top"><div class="uni-avatar">✦</div><span class="uni-float-question">“Consider quantum physics and explain the Big Bang theory like I am 5 years old.”</span></div><div class="uni-float-ans">Tap a suggested prompt to start <div class="uni-purple-check">⌄</div></div></div>',
    '</div>'
  ].join('');
  function decorateWelcome() {
    const welcome = $('welcome');
    if (!welcome || welcome.dataset.uniDecorated) return;
    welcome.dataset.uniDecorated = '1';
    welcome.innerHTML = buildHero();
  }
  decorateWelcome();
  thread.addEventListener('click', e => {
    const btn=e.target.closest('[data-uni-prompt]');
    if (!btn)return;
    const i=Number(btn.dataset.uniPrompt);
    if (Number.isInteger(i) && prompts[i]) sendPrompt(prompts[i]);
  });
  const observer = new MutationObserver(() => {
    decorateWelcome();
    const value = String(error?.textContent || '');
    const billing = /credit|balance|billing|insufficient|quota|payment required/i.test(value) && /claude|anthropic|credit|balance|billing/i.test(value);
    creditGuide.classList.toggle('visible',Boolean(billing && error && !error.hidden));
    const panel = $('owner-panel');
    if (panel && !panel.hidden && !panel.querySelector('.uni-owner-free')) {
      const freeBox = document.createElement('div');
      freeBox.className = 'uni-owner-free';
      freeBox.innerHTML = '<strong>✦ Private owner workspace</strong>Claude API calls require Anthropic credits. For a zero-key alternative, switch to the free model. To make this site owner-only, disable public chat above and save. <button type="button" data-uni-action="ownerfree">Open free model</button>';
      panel.append(freeBox);
      freeBox.querySelector('button').addEventListener('click',setFree);
    }
  });
  observer.observe(thread, { childList: true, subtree: false });
  if (error) observer.observe(error, {childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  const ownerPanel = $('owner-panel'); if (ownerPanel) observer.observe(ownerPanel,{attributes:true,attributeFilter:['hidden'],childList:true});
  // Initial application of owner-mode helper after the async config request.
  // Owner helper appears when the authenticated panel opens.
})();
`;
let existingCss=readFileSync(cssPath,'utf8');
let existingJs=readFileSync(jsPath,'utf8');
let existingHtml=readFileSync(htmlPath,'utf8');
if(!existingCss.includes(styleTag))writeFileSync(cssPath,existingCss+'\n'+css,'utf8');
if(!existingJs.includes(scriptTag))writeFileSync(jsPath,existingJs+'\n'+js,'utf8');
// No HTML transformation needed: the injected client code preserves original controls and IDs.
console.log('[C.C. Universe] Visual theme installed; original APIs, owner controls and chat engine preserved.');