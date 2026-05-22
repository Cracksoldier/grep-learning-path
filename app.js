const STORAGE_KEY = 'grep-lp-progress';

const RESOURCE_ICONS = {
  docs: '📄',
  video: '🎬',
  interactive: '🎮',
  article: '📰',
  book: '📚',
  community: '💬',
};

const DIFFICULTY_CLASS = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
  expert: 'badge-expert',
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        completedLessons: new Set(data.completedLessons || []),
        completedChallenges: new Set(data.completedChallenges || []),
      };
    }
  } catch (_) {}
  return { completedLessons: new Set(), completedChallenges: new Set() };
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    completedLessons: [...progress.completedLessons],
    completedChallenges: [...progress.completedChallenges],
  }));
}

function getTotals() {
  return stages.reduce(
    (acc, s) => ({ lessons: acc.lessons + s.lessons.length, challenges: acc.challenges + s.challenges.length }),
    { lessons: 0, challenges: 0 }
  );
}

function updateOverallProgress(progress) {
  const { lessons: totalL, challenges: totalC } = getTotals();
  const total = totalL + totalC;
  const done = progress.completedLessons.size + progress.completedChallenges.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('overall-bar').style.width = `${pct}%`;
  document.getElementById('overall-pct').textContent = `${pct}%`;
  document.getElementById('overall-count').textContent = `${done} / ${total} items completed`;
}

function updateStageProgress(stage, progress) {
  const done = stage.challenges.filter(c => progress.completedChallenges.has(c.id)).length;
  const total = stage.challenges.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const bar = document.getElementById(`stage-bar-${stage.id}`);
  const badge = document.getElementById(`stage-badge-${stage.id}`);
  const label = document.getElementById(`stage-pct-${stage.id}`);
  if (bar) bar.style.width = `${pct}%`;
  if (badge) badge.textContent = `${done} / ${total} challenges`;
  if (label) label.textContent = `${pct}% of challenges`;
}

function renderStage(stage, progress) {
  const card = document.createElement('section');
  card.className = 'stage-card';
  card.id = stage.id;

  const lessonsHtml = stage.lessons.map(l => `
    <li class="checklist-item${progress.completedLessons.has(l.id) ? ' completed' : ''}">
      <label class="checklist-label">
        <input type="checkbox" class="lesson-check" data-id="${l.id}"${progress.completedLessons.has(l.id) ? ' checked' : ''}>
        <div class="item-content">
          <span class="item-title">${l.title}</span>
          <code class="item-example">${escapeHtml(l.example)}</code>
        </div>
      </label>
    </li>`).join('');

  const resourcesHtml = stage.resources.map(r => `
    <li class="resource-item">
      <span class="resource-icon">${RESOURCE_ICONS[r.type] || '🔗'}</span>
      <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-link">${r.title}</a>
      <span class="resource-type-badge">${r.type}</span>
    </li>`).join('');

  const challengesHtml = stage.challenges.map(ch => `
    <li class="checklist-item${progress.completedChallenges.has(ch.id) ? ' completed' : ''}">
      <label class="checklist-label">
        <input type="checkbox" class="challenge-check" data-id="${ch.id}" data-stage="${stage.id}"${progress.completedChallenges.has(ch.id) ? ' checked' : ''}>
        <div class="item-content">
          <span class="item-title">${ch.title}</span>
          <span class="badge ${DIFFICULTY_CLASS[ch.difficulty] || ''}">${ch.difficulty}</span>
        </div>
      </label>
    </li>`).join('');

  card.innerHTML = `
    <div class="stage-header">
      <div class="stage-title-group">
        <span class="stage-icon">${stage.icon}</span>
        <div>
          <h2 class="stage-title">${stage.title}</h2>
          <p class="stage-desc">${stage.description}</p>
        </div>
      </div>
      <span class="stage-challenge-badge" id="stage-badge-${stage.id}">0 / ${stage.challenges.length} challenges</span>
    </div>
    <div class="stage-progress-wrap">
      <div class="progress-track">
        <div class="progress-fill stage-fill" id="stage-bar-${stage.id}" style="width:0%"></div>
      </div>
      <span class="progress-label" id="stage-pct-${stage.id}">0% of challenges</span>
    </div>
    <div class="stage-sections">
      <div class="section-block">
        <h3 class="section-heading">
          <span class="section-icon">📖</span> Lessons
          <span class="section-count">${stage.lessons.length} topics</span>
        </h3>
        <ul class="checklist">${lessonsHtml}</ul>
      </div>
      <div class="section-block">
        <h3 class="section-heading">
          <span class="section-icon">🔗</span> Resources
          <span class="section-count">${stage.resources.length} links</span>
        </h3>
        <ul class="resource-list">${resourcesHtml}</ul>
      </div>
      <div class="section-block">
        <h3 class="section-heading">
          <span class="section-icon">🎯</span> Challenges
          <span class="section-count">${stage.challenges.length} tasks</span>
        </h3>
        <ul class="checklist">${challengesHtml}</ul>
      </div>
    </div>`;

  return card;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function exportProgress(progress) {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    completedLessons: [...progress.completedLessons],
    completedChallenges: [...progress.completedChallenges],
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'grep-learning-progress.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importProgress(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.completedLessons) || !Array.isArray(data.completedChallenges)) {
        throw new Error('invalid shape');
      }
      onSuccess({
        completedLessons: new Set(data.completedLessons),
        completedChallenges: new Set(data.completedChallenges),
      });
    } catch (_) {
      alert('Could not import: invalid or corrupt progress file.');
    }
  };
  reader.readAsText(file);
}

function fullRender(container, progress) {
  container.innerHTML = '';
  stages.forEach(stage => container.appendChild(renderStage(stage, progress)));
  requestAnimationFrame(() => {
    stages.forEach(stage => updateStageProgress(stage, progress));
    updateOverallProgress(progress);
  });
}

function init() {
  let progress = loadProgress();
  const container = document.getElementById('stages-container');

  fullRender(container, progress);

  container.addEventListener('change', (e) => {
    const target = e.target;
    const isLesson = target.classList.contains('lesson-check');
    const isChallenge = target.classList.contains('challenge-check');
    if (!isLesson && !isChallenge) return;

    const id = target.dataset.id;
    const set = isLesson ? progress.completedLessons : progress.completedChallenges;

    target.checked ? set.add(id) : set.delete(id);
    target.closest('.checklist-item').classList.toggle('completed', target.checked);

    saveProgress(progress);
    updateOverallProgress(progress);

    if (isChallenge) {
      const stage = stages.find(s => s.id === target.dataset.stage);
      if (stage) updateStageProgress(stage, progress);
    }
  });

  document.getElementById('export-btn').addEventListener('click', () => exportProgress(progress));

  const importInput = document.getElementById('import-input');
  document.getElementById('import-btn').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importProgress(file, (newProgress) => {
      progress = newProgress;
      saveProgress(progress);
      fullRender(container, progress);
      importInput.value = '';
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
