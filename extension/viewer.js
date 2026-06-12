function normalizeText(value) {
  return value == null ? '' : String(value).replace(/\s+/g, ' ').trim();
}

function parseResponseText(rawText) {
  const first = JSON.parse(rawText);
  return typeof first === 'string' ? JSON.parse(first) : first;
}

function extractHeader(data) {
  const headers = (data && data.data && data.data.headerInformation) || [];
  return headers.length ? headers[0] : {};
}

function buildCourseRecord(course) {
  return {
    course_id: normalizeText(course.eventId),
    course_name: normalizeText(course.eventName),
    subtype: normalizeText(course.eventSubType),
    credits: normalizeText(course.credits),
    grade: normalizeText(course.finalGrade),
    quality_points: normalizeText(course.qualityPoints),
  };
}

function buildGpaSummary(entries) {
  const term = (entries || []).find((entry) => entry.gpaType === 'T') || {};
  const overall = (entries || []).find((entry) => entry.gpaType === 'O') || {};
  return {
    term_gpa: normalizeText(term.gpa),
    term_attempted_credits: normalizeText(term.attemptedCredits),
    overall_gpa: normalizeText(overall.gpa),
    overall_attempted_credits: normalizeText(overall.attemptedCredits),
  };
}

function sumCredits(courses) {
  return (courses || [])
    .map((course) => Number.parseFloat(course.credits || '0'))
    .reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function flattenCourses(viewModel) {
  const rows = [];
  for (const semester of viewModel.semesters) {
    for (const organization of semester.organizations) {
      for (const course of organization.courses) {
        rows.push({
          period: semester.period,
          organization: organization.name,
          ...course,
        });
      }
    }
  }
  return rows;
}

function buildTranscriptViewModel(data) {
  const header = extractHeader(data);
  const semesters = [];

  for (const semester of header.transcriptYearTerm || []) {
    const organizations = [];
    for (const organization of semester.transcriptOrganization || []) {
      organizations.push({
        name: normalizeText(organization.organizationName),
        courses: (organization.transcriptCourses || []).map(buildCourseRecord),
      });
    }

    semesters.push({
      period: normalizeText(semester.period),
      gpa: buildGpaSummary(semester.transcriptGpa || []),
      organizations,
    });
  }

  return {
    student_name: normalizeText(header.fullName),
    institution: normalizeText(header.orgName),
    cumulative_gpa: normalizeText(header.cumGpa),
    semesters,
  };
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (value != null) node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function metricCard(label, value) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'label', text: label }),
    el('div', { className: 'value', text: value || '—' }),
  ]);
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  const headers = ['period', 'organization', 'course_id', 'course_name', 'subtype', 'credits', 'grade', 'quality_points'];
  const escape = (value) => {
    const s = String(value ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [headers.join(',')]
    .concat(rows.map((row) => headers.map((h) => escape(row[h])).join(',')))
    .join('\n');
}

function buildActions(viewModel) {
  const actions = el('div', { className: 'actions' });
  const exportBtn = el('button', { type: 'button', className: 'action-btn', text: 'Export CSV' });
  exportBtn.addEventListener('click', () => {
    const csv = toCsv(flattenCourses(viewModel));
    downloadText('zewail-transcript.csv', csv);
  });
  actions.appendChild(exportBtn);
  return actions;
}

function renderTable(courses) {
  const table = el('table');
  table.appendChild(el('tr', {}, [
    el('th', { text: 'Code' }),
    el('th', { text: 'Course' }),
    el('th', { text: 'Type' }),
    el('th', { text: 'Credits' }),
    el('th', { text: 'Grade' }),
    el('th', { text: 'QP' }),
  ]));

  for (const course of courses) {
    table.appendChild(el('tr', {}, [
      el('td', { text: course.course_id }),
      el('td', { text: course.course_name }),
      el('td', { text: course.subtype }),
      el('td', { text: course.credits }),
      el('td', { text: course.grade }),
      el('td', { text: course.quality_points }),
    ]));
  }

  return table;
}

function setStatus(text) {
  const status = document.getElementById('status');
  if (status) status.textContent = text;
}

function renderError(message) {
  const content = document.getElementById('content');
  clear(content);
  content.appendChild(el('div', { className: 'error', text: message }));
}

function renderTranscript(viewModel) {
  const content = document.getElementById('content');
  clear(content);

  const summary = el('div', { className: 'summary-grid' }, [
    metricCard('Student', viewModel.student_name),
    metricCard('Institution', viewModel.institution),
    metricCard('Cumulative GPA', viewModel.cumulative_gpa),
  ]);
  content.appendChild(summary);

  content.appendChild(buildActions(viewModel));

  for (const semester of viewModel.semesters) {
    const semesterCard = el('div', { className: 'semester-card' });
    semesterCard.appendChild(el('h2', { text: semester.period }));
    const totalSemesterCredits = semester.organizations.reduce((sum, org) => sum + sumCredits(org.courses), 0);
    semesterCard.appendChild(el('div', {
      className: 'muted',
      text: `Term GPA: ${semester.gpa.term_gpa || '—'} | Overall GPA: ${semester.gpa.overall_gpa || '—'} | Courses: ${semester.organizations.reduce((sum, org) => sum + org.courses.length, 0)} | Credits: ${totalSemesterCredits.toFixed(2)}`,
    }));

    for (const organization of semester.organizations) {
      const orgCard = el('div', { className: 'org-card' });
      const orgHeader = el('div', { className: 'org-header' }, [
        el('h3', { text: organization.name }),
        el('div', { className: 'muted', text: `${organization.courses.length} course${organization.courses.length === 1 ? '' : 's'} • ${sumCredits(organization.courses).toFixed(2)} credits` }),
      ]);
      orgCard.appendChild(orgHeader);
      orgCard.appendChild(renderTable(organization.courses));
      semesterCard.appendChild(orgCard);
    }

    content.appendChild(semesterCard);
  }
}

async function loadTranscript() {
  setStatus('Loading transcript…');
  const items = await chrome.storage.local.get(['transcript_payload']);
  const rawText = items.transcript_payload;
  await chrome.storage.local.remove(['transcript_payload']);

  if (!rawText) {
    setStatus('No payload found');
    renderError('No transcript payload found. Use the popup to fetch from the SelfService site.');
    return;
  }

  try {
    const payload = parseResponseText(rawText);
    const viewModel = buildTranscriptViewModel(payload);
    renderTranscript(viewModel);
    setStatus('Transcript rendered');
  } catch (err) {
    setStatus('Parse failed');
    renderError(`Failed to parse transcript: ${err}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTranscript().catch((err) => {
    setStatus('Load failed');
    renderError(`Failed to load transcript: ${err}`);
  });
});

