'use strict';
(() => {
  const categories = ['재능', '물건', '공간', '시간'];
  const styles = {재능:'talent',물건:'object',공간:'space',시간:'time'};
  const key = 'village-timebank-resources-v1';
  const initial = [
    {id:1,category:'재능',title:'자전거 간단 수리',owner:'이웃 A',available:'토요일 오전',detail:'브레이크와 타이어를 함께 살펴봐요.'},
    {id:2,category:'물건',title:'행사용 접이식 의자 12개',owner:'마을회관',available:'행사 전날부터',detail:'사용 뒤 깨끗하게 반납해 주세요.'},
    {id:3,category:'공간',title:'작은 모임방',owner:'느티나무 공방',available:'수요일 저녁',detail:'8명까지 둘러앉을 수 있어요.'},
    {id:4,category:'시간',title:'아이 돌봄 도움',owner:'이웃 B',available:'월 2회, 2시간',detail:'마을 행사 때 아이들과 책을 읽어드려요.'}
  ];
  const get = id => document.getElementById(id);
  const notice = text => { get('notice').textContent = text; get('notice').hidden = false; };
  let resources = initial.slice();
  const valid = item => item && categories.includes(item.category) && ['title','owner','available','detail'].every(k => typeof item[k] === 'string') && ['title','owner','available'].every(k => item[k].trim());
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.every(valid)) throw new Error('invalid saved data');
      resources = saved;
    }
  } catch { notice('저장된 목록을 읽을 수 없어 예시를 표시합니다. 브라우저의 저장 설정을 확인해 주세요.'); }
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function render() {
    const word = get('search').value.trim().toLowerCase();
    const list = resources.filter(item => [item.category,item.title,item.owner,item.detail].join(' ').toLowerCase().includes(word));
    get('resource-list').replaceChildren();
    for (const item of list) {
      const card = element('article',undefined,'card');
      const top = element('div',undefined,'card-top');
      top.append(element('span',item.category,'badge '+styles[item.category]),element('span',item.owner,'owner'));
      const bottom = element('div',undefined,'card-bottom');
      const interest = element('button','관심 있어요 →','interest');
      interest.type = 'button';
      interest.addEventListener('click',() => notice(item.owner+'님의 자원에 관심 표시를 했습니다. 실제 연락은 아직 진행되지 않습니다.'));
      bottom.append(element('span','◷ '+item.available),interest);
      card.append(top,element('h3',item.title),element('p',item.detail),bottom);
      get('resource-list').append(card);
    }
    get('empty').hidden = list.length !== 0;
  }
  get('search').addEventListener('input',render);
  const tabs = Array.from(document.querySelectorAll('[role=tab]'));
  function selectTab(tab) {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected',String(selected));
      item.tabIndex = selected ? 0 : -1;
      get(item.getAttribute('aria-controls')).hidden = !selected;
    }
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',() => selectTab(tab));
    tab.addEventListener('keydown',event => {
      let next;
      if (event.key === 'ArrowRight') next = (index+1)%tabs.length;
      if (event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length-1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next]); tabs[next].focus(); }
    });
  });
  const dialog = get('resource-dialog');
  get('open-dialog').addEventListener('click',() => { get('form-error').hidden = true; dialog.showModal(); });
  get('close-dialog').addEventListener('click',() => dialog.close());
  function addResource(input) {
    const item = {id:Date.now(),category:input.category,title:input.title?.trim(),owner:input.owner?.trim(),available:input.available?.trim(),detail:input.detail?.trim() || '함께 이야기하며 이용 방법을 정해요.'};
    if (!valid(item)) throw new Error('종류, 자원 이름, 별명, 가능한 시간을 입력해 주세요.');
    if (item.title.length>100 || item.owner.length>40 || item.available.length>100 || item.detail.length>300) throw new Error('입력 내용을 조금 더 짧게 적어 주세요.');
    const next = [item,...resources];
    try { localStorage.setItem(key,JSON.stringify(next)); }
    catch { throw new Error('브라우저에 저장하지 못했습니다. 저장 공간과 쿠키·사이트 데이터 설정을 확인해 주세요. 입력 내용은 그대로 남아 있습니다.'); }
    resources = next;
    get('search').value = '';
    selectTab(tabs[0]);
    render();
    notice(item.owner+'님의 ‘'+item.title+'’ 자원이 이 브라우저에 저장되었습니다.');
    return {status:'added',resource:{category:item.category,title:item.title,owner:item.owner}};
  }
  get('resource-form').addEventListener('submit',event => {
    event.preventDefault();
    try { addResource(Object.fromEntries(new FormData(event.currentTarget))); event.currentTarget.reset(); dialog.close(); }
    catch(error) { get('form-error').textContent = error.message; get('form-error').hidden = false; }
  });
  if (document.modelContext?.registerTool) {
    try { Promise.resolve(document.modelContext.registerTool({name:'add_demo_resource',title:'체험 자원 등록',description:'재능, 물건, 공간 또는 시간을 이 브라우저의 체험 목록에 저장합니다.',inputSchema:{type:'object',properties:{category:{type:'string',enum:categories},title:{type:'string'},owner:{type:'string'},available:{type:'string'},detail:{type:'string'}},required:['category','title','owner','available'],additionalProperties:false},annotations:{readOnlyHint:false},execute:addResource})).catch(() => {}); } catch {}
  }
  render();
})();
