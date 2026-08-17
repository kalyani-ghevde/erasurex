/* ==========================================================
   ErasureX — application logic
   ========================================================== */

let currentDevice = null;
let currentMethodKey = null;

document.addEventListener("DOMContentLoaded", () => {
  hydrateIcons();
  wireNav();
  wireScan();
  wireVerify();
  wireReportsExport();
  renderDashboard();
  showView("dashboard");
});

/* ---------- ROUTING ---------- */
function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  const navBtn = document.querySelector(`.nav-item[data-view="${name}"]`);
  if (navBtn) navBtn.classList.add("active");
  if (name === "dashboard") renderDashboard();
  if (name === "reports") renderReports();
}

function wireNav() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.goto));
  });
}

/* ---------- DASHBOARD ---------- */
let chartInstance = null;

function renderDashboard() {
  const records = loadRecords();
  const total = records.length;
  const pass = records.filter(r => r.result === "PASS").length;
  const fail = total - pass;
  const rate = total ? Math.round((pass / total) * 100) + "%" : "—";

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-pass").textContent = pass;
  document.getElementById("stat-fail").textContent = fail;
  document.getElementById("stat-rate").textContent = rate;

  const list = document.getElementById("recent-activity");
  if (!records.length) {
    list.innerHTML = '<p class="muted small">No sanitization events yet. Start by scanning a device.</p>';
  } else {
    list.innerHTML = records.slice(0, 6).map(r => `
      <div class="activity-row">
        <div>
          <div class="a-dev">${r.device.name}</div>
          <div class="a-meta">${r.certId} · ${new Date(r.date).toLocaleString()}</div>
        </div>
        <span class="badge ${r.result === "PASS" ? "pass" : "fail"}">${r.result}</span>
      </div>
    `).join("");
  }

  renderChart(pass, fail);
}

function renderChart(pass, fail) {
  const wrap = document.getElementById("chart-wrap");
  if (typeof Chart === "undefined") {
    wrap.innerHTML = `<p class="muted small">Chart library unavailable offline — showing raw counts: PASS ${pass} / FAIL ${fail}</p>`;
    return;
  }
  if (!document.getElementById("chart-passfail")) {
    wrap.innerHTML = '<canvas id="chart-passfail" height="180"></canvas>';
  }
  const canvas = document.getElementById("chart-passfail");
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["PASS — certified", "FAIL — no certificate"],
      datasets: [{ data: [pass || 0, fail || 0], backgroundColor: ["#4CA22C", "#D34A4A"], borderWidth: 0 }]
    },
    options: { plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } }, cutout: "68%" }
  });
}

/* ---------- SCAN ---------- */
function wireScan() {
  document.getElementById("btn-scan").addEventListener("click", runScan);
}

function runScan() {
  document.getElementById("scan-empty").classList.add("hidden");
  document.getElementById("device-list").classList.add("hidden");
  document.getElementById("scan-loading").classList.remove("hidden");

  setTimeout(() => {
    document.getElementById("scan-loading").classList.add("hidden");
    const list = document.getElementById("device-list");
    list.classList.remove("hidden");
    const devices = DEVICE_POOL.map(d => ({ ...d, id: "dev-" + Math.random().toString(36).slice(2, 8) }));
    list.innerHTML = devices.map(d => `
      <div class="device-card" data-id="${d.id}">
        <div class="d-top">
          <div class="device-icon">${iconSVG(deviceIconName(d.type), 22)}</div>
          <div>
            <div class="d-name">${d.name}</div>
            <div class="d-type">${d.type} · ${d.iface}</div>
          </div>
        </div>
        <div class="device-meta">
          <span>${d.capacity}</span>
          <span>${d.serial}</span>
        </div>
      </div>
    `).join("");
    list.querySelectorAll(".device-card").forEach((card, i) => {
      card.addEventListener("click", () => openDeviceDetail(devices[i]));
    });
  }, 1100);
}

/* ---------- DEVICE DETAIL / ANALYSIS ---------- */
function openDeviceDetail(device) {
  currentDevice = device;
  currentMethodKey = device.type;
  const method = METHODS[device.type];

  document.getElementById("device-profile").innerHTML = `
    <h3>Device profile</h3>
    <div class="profile-row"><span class="k">Name</span><span class="v">${device.name}</span></div>
    <div class="profile-row"><span class="k">Type</span><span class="v">${device.type}</span></div>
    <div class="profile-row"><span class="k">Interface</span><span class="v">${device.iface}</span></div>
    <div class="profile-row"><span class="k">Capacity</span><span class="v">${device.capacity}</span></div>
    <div class="profile-row"><span class="k">Serial</span><span class="v">${device.serial}</span></div>
    <div class="profile-row"><span class="k">Encryption state</span><span class="v">Detected</span></div>
  `;

  document.getElementById("method-card").innerHTML = `
    <div class="m-name">${method.name}</div>
    <div class="m-desc">${method.desc}</div>
    <ul>${method.steps.map(s => `<li>${s}</li>`).join("")}</ul>
  `;

  showView("detail");
  document.getElementById("btn-start-wipe").onclick = () => startWipe(device, method);
}

/* ---------- WIPE SIMULATION ---------- */
function startWipe(device, method) {
  showView("wipe");
  document.getElementById("wipe-device-name").textContent = `${device.name} (${device.serial})`;
  const log = document.getElementById("wipe-log");
  const fill = document.getElementById("wipe-fill");
  const pct = document.getElementById("wipe-pct");
  log.innerHTML = "";
  fill.style.width = "0%";
  pct.textContent = "0%";

  const steps = method.steps;
  let progress = 0;
  let stepIndex = 0;

  function logLine(text, warn) {
    const line = document.createElement("div");
    line.className = "line" + (warn ? " warn" : "");
    line.textContent = "> " + text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  logLine("Booting offline sanitization environment (ISO)…");
  logLine("Target locked: " + device.serial);

  const interval = setInterval(() => {
    progress += Math.random() * 9 + 4;
    if (progress >= (stepIndex + 1) * (100 / steps.length) && stepIndex < steps.length) {
      logLine(steps[stepIndex]);
      stepIndex++;
    }
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      logLine("Sanitization complete. Handing off to validation engine…");
      fill.style.width = "100%";
      pct.textContent = "100%";
      setTimeout(() => runValidation(device, method), 900);
    }
    fill.style.width = progress + "%";
    pct.textContent = Math.floor(progress) + "%";
  }, 260);
}

/* ---------- VALIDATION ---------- */
function runValidation(device, method) {
  showView("result");
  const panel = document.getElementById("result-panel");
  panel.innerHTML = `<div class="spinner" style="margin-bottom:16px;"></div><p class="muted">Running independent validation…</p>`;

  setTimeout(async () => {
    const pass = Math.random() < 0.85; // 85% pass rate for demo
    if (pass) {
      const certId = genCertId();
      const timestamp = new Date().toISOString();
      const hash = await sha256Hex(certId + device.serial + timestamp);
      const record = { certId, device, method: method.name, result: "PASS", date: timestamp, hash };
      addRecord(record);

      panel.innerHTML = `
        <div class="result-icon pass">${iconSVG("check", 34)}</div>
        <div class="result-title pass">Validation passed</div>
        <div class="result-sub">All sectors verified — sanitization confirmed against ${device.name}</div>
        <button class="btn primary" id="btn-view-cert">View certificate</button>
      `;
      document.getElementById("btn-view-cert").onclick = () => showCertificate(record);
    } else {
      const record = { certId: null, device, method: method.name, result: "FAIL", date: new Date().toISOString(), hash: null };
      addRecord(record);
      panel.innerHTML = `
        <div class="result-icon fail">${iconSVG("x", 34)}</div>
        <div class="result-title fail">Validation failed</div>
        <div class="result-sub">Residual data detected — sanitization did not meet the required standard</div>
        <div class="no-proof-tag">NO PROOF = NO CERTIFICATE</div><br>
        <button class="btn ghost" data-goto="scan">Retry sanitization</button>
      `;
      wireNav(); // re-bind the new data-goto button
    }
  }, 1400);
}

/* ---------- CERTIFICATE ---------- */
function showCertificate(record) {
  showView("certificate");
  const box = document.getElementById("certificate-box");
  box.innerHTML = `
    <div class="cert-head">
      <div class="cx-title">ERASUREX</div>
      <div class="cx-sub">Digital Certificate of Sanitization</div>
    </div>
    <div class="cert-body">
      <div>
        <div class="cert-field"><span class="k">Certificate ID</span><span class="v">${record.certId}</span></div>
        <div class="cert-field"><span class="k">Device</span><span class="v">${record.device.name}</span></div>
        <div class="cert-field"><span class="k">Serial number</span><span class="v">${record.device.serial}</span></div>
        <div class="cert-field"><span class="k">Method applied</span><span class="v">${record.method}</span></div>
        <div class="cert-field"><span class="k">Result</span><span class="v">PASS</span></div>
        <div class="cert-field"><span class="k">Issued</span><span class="v">${new Date(record.date).toLocaleString()}</span></div>
        <div class="cert-field" style="flex-direction:column; align-items:flex-start; gap:4px;">
          <span class="k">SHA-256 proof hash</span><span class="v cert-hash">${record.hash}</span>
        </div>
      </div>
      <div class="cert-qr">
        <canvas id="cert-qr-canvas"></canvas>
        <div class="qr-label">Scan to verify<br>${record.certId}</div>
      </div>
    </div>
    <div class="cert-status pass">✓ VERIFIED — CERTIFICATE VALID</div>
  `;
  const canvas = document.getElementById("cert-qr-canvas");
  drawVerificationPattern(canvas, record.certId + record.hash);

  document.getElementById("btn-print-cert").onclick = () => window.print();
}

/* ---------- REPORTS ---------- */
function renderReports() {
  const records = loadRecords();
  const tbody = document.getElementById("reports-tbody");
  const empty = document.getElementById("reports-empty");
  if (!records.length) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  tbody.innerHTML = records.map(r => `
    <tr>
      <td>${r.certId || "—"}</td>
      <td>${r.device.name}</td>
      <td>${r.method}</td>
      <td><span class="badge ${r.result === "PASS" ? "pass" : "fail"}">${r.result}</span></td>
      <td>${new Date(r.date).toLocaleDateString()}</td>
      <td>${r.certId ? `<button class="link-btn" data-cert="${r.certId}">View</button>` : ""}</td>
    </tr>
  `).join("");
  tbody.querySelectorAll("[data-cert]").forEach(btn => {
    btn.addEventListener("click", () => {
      const rec = findRecord(btn.dataset.cert);
      if (rec) showCertificate(rec);
    });
  });
}

function wireReportsExport() {
  document.getElementById("btn-export-csv").addEventListener("click", () => {
    const records = loadRecords();
    const rows = [["Certificate ID", "Device", "Serial", "Method", "Result", "Date"]];
    records.forEach(r => rows.push([r.certId || "", r.device.name, r.device.serial, r.method, r.result, r.date]));
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "erasurex_audit_log.csv";
    a.click();
  });
}

/* ---------- VERIFY PORTAL ---------- */
function wireVerify() {
  document.getElementById("btn-verify").addEventListener("click", doVerify);
  document.getElementById("verify-input").addEventListener("keydown", e => {
    if (e.key === "Enter") doVerify();
  });
}

function doVerify() {
  const input = document.getElementById("verify-input");
  const resultBox = document.getElementById("verify-result");
  const id = input.value.trim();
  if (!id) {
    resultBox.innerHTML = `<p class="muted small">Enter a certificate ID to verify.</p>`;
    return;
  }
  const record = findRecord(id);
  if (record && record.result === "PASS") {
    resultBox.innerHTML = `
      <div class="cert-status pass" style="margin-top:0;">✓ VALID CERTIFICATE</div>
      <div class="panel" style="margin-top:14px; box-shadow:none;">
        <div class="profile-row"><span class="k">Device</span><span class="v">${record.device.name}</span></div>
        <div class="profile-row"><span class="k">Method</span><span class="v">${record.method}</span></div>
        <div class="profile-row"><span class="k">Issued</span><span class="v">${new Date(record.date).toLocaleString()}</span></div>
        <div class="profile-row"><span class="k">Proof hash</span><span class="v cert-hash">${record.hash.slice(0, 24)}…</span></div>
      </div>`;
  } else {
    resultBox.innerHTML = `<div class="no-proof-tag" style="display:block; margin-top:16px;">CERTIFICATE NOT FOUND OR INVALID</div>`;
  }
}
