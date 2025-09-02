let activities = {};
let subjects = [];

async function saveActivities() {
  try {
    console.log("Saving subjects", subjects);
    console.log("Saving activities", activities);

    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjects, activities })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error("Save failed:", data);
    } else {
      console.log("Saved successfully");
    }
  } catch (err) {
    console.error('Error saving to server', err);
  }
}

async function loadActivities() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed to fetch data from server');
    const data = await res.json();
    subjects = data.subjects || [];
    activities = data.activities || {};
  } catch (err) {
    console.error(err);
    // fallback localStorage
    const savedActs = localStorage.getItem('calendarActivities');
    if (savedActs) activities = JSON.parse(savedActs);
    const savedSubs = localStorage.getItem('calendarSubjects');
    if (savedSubs) subjects = JSON.parse(savedSubs);
  }
}

function getIconHTML(subject) {
  let shapeClass = '';
  if(subject.symbol==='square') shapeClass='icon-square';
  else if(subject.symbol==='circle') shapeClass='icon-circle';
  else if(subject.symbol==='diamond') shapeClass='icon-diamond';
  return `<span class="level-icon level-${subject.level.replace(/[\/]/g,'')} ${shapeClass}">${subject.level}</span>`;
}

function makeDraggable(element, data) {
  element.setAttribute('draggable', true);
  element.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    element.classList.add('dragging');
  });
  element.addEventListener('dragend', () => {
    element.classList.remove('dragging');
    const rect = element.getBoundingClientRect();
    if(rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth){
      if(element.dataset.fromdate) removeActivity(element.dataset.fromdate, element.dataset.id);
      saveActivities();
      generateCalendar('yearInput','monthInput');
      generateDraggableList();
    }
  });
}

function removeSubject(id) {
  subjects = subjects.filter(s => s.id !== id);
  for(const d in activities){
    activities[d] = activities[d].filter(a => a.id !== id);
    if(!activities[d].length) delete activities[d];
  }
  saveActivities();
  generateDraggableList();
  generateCalendar('yearInput','monthInput');
  updateFilterOptions();
}

function removeActivity(dateStr, id) {
  if(activities[dateStr]){
    activities[dateStr] = activities[dateStr].filter(a => a.id !== id);
    if(!activities[dateStr].length) delete activities[dateStr];
  }
}

function generateDraggableList(){
  const list = document.getElementById('draggableList');
  if(!list) return;
  list.innerHTML = '';

  const filter = document.getElementById('filterSubject');
  const selectedTitle = filter.value ? subjects.find(s => s.id === filter.value)?.title : '';

  subjects.forEach(subject => {
    if(filter.value && subject.title !== selectedTitle) return;

    const li = document.createElement('li');
    li.className = 'draggable-item';
    li.dataset.id = subject.id;
    li.dataset.title = subject.title.toLowerCase();
    li.innerHTML = `
      ${getIconHTML(subject)}
      <div>
        <div class="title">${subject.title}</div>
        <small>${subject.subtitle || ''}</small>
        <small>${subject.time}</small>
      </div>
      <button class="delete-btn" title="ลบวิชา">❌</button>
    `;
    makeDraggable(li, subject);
    li.querySelector('.delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      removeSubject(subject.id);
    });
    list.appendChild(li);
  });
}

function generateCalendar(yearInputId, monthInputId){
  const year = parseInt(document.getElementById(yearInputId).value, 10);
  const month = parseInt(document.getElementById(monthInputId).value, 10);
  const wrap = document.getElementById('calendarDisplay');
  wrap.innerHTML = '';

  let firstDay = new Date(year, month-1, 1).getDay();
  firstDay = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const table = document.createElement('table');
  table.className = 'calendar-table';

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  ['MON','TUE','WED','THU','FRI','SAT','SUN'].forEach(day => {
    const th = document.createElement('th'); th.textContent = day; trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  let row = document.createElement('tr');

  const filter = document.getElementById('filterSubject');
  const selectedTitle = filter.value ? subjects.find(s => s.id === filter.value)?.title : '';

  let monthTotalHours = 0;

  for(let i = 0; i < firstDay; i++) row.appendChild(document.createElement('td'));
  for(let day = 1; day <= daysInMonth; day++){
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const td = document.createElement('td'); td.dataset.date = dateStr;
    td.innerHTML = `<strong>${day}</strong>`;

    if(activities[dateStr]){
      activities[dateStr].forEach(act => {
        if(selectedTitle && act.title !== selectedTitle) return;

        const div = document.createElement('div');
        div.className = 'activity-item';
        div.dataset.id = act.id;
        div.dataset.title = act.title.toLowerCase();
        div.dataset.fromdate = dateStr;
        div.innerHTML = `${getIconHTML(act)}
          <div>
            <div class="title">${act.title}</div>
            <small>${act.subtitle || ''}</small>
            <small>${act.time}</small>
          </div>`;
        makeDraggable(div, {...act, fromdate: dateStr});
        td.appendChild(div);

        if(act.time && selectedTitle){
          const [start, end] = act.time.split('-');
          const startHour = parseInt(start.split(':')[0],10) + parseInt(start.split(':')[1],10)/60;
          const endHour = parseInt(end.split(':')[0],10) + parseInt(end.split(':')[1],10)/60;
          const hours = endHour - startHour;
          monthTotalHours += hours;
        }
      });
    }

    td.addEventListener('dragover', e => { e.preventDefault(); td.classList.add('drag-over'); });
    td.addEventListener('dragleave', () => td.classList.remove('drag-over'));
    td.addEventListener('drop', e => {
      e.preventDefault(); td.classList.remove('drag-over');
      const dropped = JSON.parse(e.dataTransfer.getData('text/plain')||'{}');
      if(!dropped.id) return;
      if(dropped.fromdate) removeActivity(dropped.fromdate, dropped.id);
      if(!activities[dateStr]) activities[dateStr] = [];
      if(!activities[dateStr].some(a => a.id === dropped.id)){
        activities[dateStr].push({...dropped});
      }
      saveActivities();
      generateCalendar(yearInputId, monthInputId);
      generateDraggableList();
    });

    row.appendChild(td);
    if((firstDay + day) % 7 === 0 || day === daysInMonth){
      tbody.appendChild(row);
      row = document.createElement('tr');
    }
  }

  table.appendChild(tbody);
  wrap.appendChild(table);

  if(selectedTitle){
    const monthTotalDiv = document.createElement('div');
    monthTotalDiv.className = 'month-total-hours';
    monthTotalDiv.textContent = `ชั่วโมงรวมเดือน: ${monthTotalHours.toFixed(1)} ชม.`;
    wrap.prepend(monthTotalDiv);
  }
}

function updateFilterOptions(){
  const filter = document.getElementById('filterSubject');
  if(!filter) return;
  filter.innerHTML = '<option value="">ทั้งหมด</option>';
  const addedTitles = new Set();
  subjects.forEach(sub => {
    if(addedTitles.has(sub.title)) return;
    const option = document.createElement('option');
    option.value = sub.id;
    option.textContent = sub.title;
    filter.appendChild(option);
    addedTitles.add(sub.title);
  });
}

function initUI() {
  generateDraggableList();
  generateCalendar('yearInput', 'monthInput');
  updateFilterOptions();

  document.getElementById('addSubjectBtn')?.addEventListener('click', () => {
    const title = document.getElementById('newTitle').value.trim();
    const subtitle = document.getElementById('newSubTitle').value.trim();
    const level = document.querySelector('input[name="level"]:checked')?.value;
    const symbol = document.querySelector('input[name="symbol"]:checked')?.value;
    const start = document.getElementById('newStartTime').value;
    const end = document.getElementById('newEndTime').value;

    if(!title || !level || !symbol) return;

    const id = Date.now().toString();
    subjects.push({id, title, subtitle, level, symbol, time: `${start}-${end}`});

    saveActivities();
    generateDraggableList();
    updateFilterOptions();

    document.getElementById('newTitle').value='';
    document.getElementById('newSubTitle').value='';
    document.getElementById('newStartTime').value='';
    document.getElementById('newEndTime').value='';
    document.querySelectorAll('input[name="level"]').forEach(r=>r.checked=false);
    document.querySelectorAll('input[name="symbol"]').forEach(r=>r.checked=false);
  });

  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    const year = parseInt(document.getElementById('yearInput').value, 10);
    const month = parseInt(document.getElementById('monthInput').value, 10);
    if(!isNaN(year) && !isNaN(month)){
      const monthPrefix = `${year}-${String(month).padStart(2,'0')}-`;
      for(const dateStr in activities){
        if(dateStr.startsWith(monthPrefix)) delete activities[dateStr];
      }
      saveActivities();
      generateCalendar('yearInput','monthInput');
      generateDraggableList();
    }
  });

  document.getElementById('searchSubject')?.addEventListener('input', function(){
    const keyword = this.value.toLowerCase();
    document.querySelectorAll('#draggableList li').forEach(li=>{
      const title = li.querySelector('.title').textContent.toLowerCase();
      li.style.display = title.includes(keyword) ? '' : 'none';
    });
  });

  document.getElementById('filterSubject')?.addEventListener('change', () => {
    generateDraggableList();
    generateCalendar('yearInput','monthInput');
  });

  document.getElementById('yearInput')?.addEventListener('input', () => { generateCalendar('yearInput','monthInput'); });
  document.getElementById('monthInput')?.addEventListener('input', () => { generateCalendar('yearInput','monthInput'); });

  const list = document.getElementById('draggableList');
  if(list){
    list.addEventListener('dragover', e=>{e.preventDefault(); list.classList.add('drag-over');});
    list.addEventListener('dragleave', ()=>list.classList.remove('drag-over'));
    list.addEventListener('drop', e=>{
      e.preventDefault(); list.classList.remove('drag-over');
      const dropped = JSON.parse(e.dataTransfer.getData('text/plain')||'{}');
      if(!dropped.id || !dropped.fromdate) return;
      removeActivity(dropped.fromdate, dropped.id);
      saveActivities();
      generateCalendar('yearInput','monthInput');
      generateDraggableList();
    });
  }

  document.getElementById('downloadBtn')?.addEventListener('click', () => {
    const cal = document.getElementById('calendarDisplay');
    html2canvas(cal).then(canvas=>{
      const link = document.createElement('a');
      const year = document.getElementById('yearInput').value;
      const month = document.getElementById('monthInput').value;
      link.download = `calendar-${year}-${month}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadActivities();
  initUI();
});
