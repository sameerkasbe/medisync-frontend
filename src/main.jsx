import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "http://127.0.0.1:5000";

const navigation = [
  ["Dashboard", "▦"],
  ["Patients", "♙"],
  ["Agent Runs", "✦"],
  ["Conflicts", "⚠"],
  ["Activity", "◷"],
  ["Settings", "⚙"]
];

function App() {
  const [page, setPage] = useState("Dashboard");
  const [patients, setPatients] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [toast, setToast] = useState("");

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  const loadData = async () => {
    try {
      const patientResponse = await fetch(`${API}/api/patients`);

      if (!patientResponse.ok) {
        throw new Error("Patients API failed");
      }

      const patientData = await patientResponse.json();

      setPatients(patientData.value || patientData || []);

      const runsResponse = await fetch(`${API}/api/agent/runs`);

      if (runsResponse.ok) {
        const runsData = await runsResponse.json();

        setRuns(runsData.value || runsData || []);
      }

      setBackendOnline(true);
    } catch (error) {
      console.error(error);
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------
  // TOAST
  // --------------------------------------------------

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  // --------------------------------------------------
  // RUN AGENT
  // --------------------------------------------------

  const runAgent = async (patientId = "P001") => {
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/agent/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patient_id: patientId
        })
      });

      if (!response.ok) {
        throw new Error("Agent failed");
      }

      const data = await response.json();

      setSelectedRun(data);

      setPage("Agent Run");

      await loadData();

      showToast("Agent workflow completed successfully.");
    } catch (error) {
      console.error(error);

      showToast(
        "Unable to run agent. Make sure Flask is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // OPEN PATIENT
  // --------------------------------------------------

  const openPatient = async (patientId) => {
    try {
      const response = await fetch(
        `${API}/api/patients/${patientId}`
      );

      if (!response.ok) {
        throw new Error("Patient not found");
      }

      const data = await response.json();

      setSelectedPatient(data);

      setPage("Patient Detail");
    } catch (error) {
      console.error(error);

      showToast("Unable to load patient.");
    }
  };

  // --------------------------------------------------
  // OPEN RUN
  // --------------------------------------------------

  const openRun = async (runId) => {
    try {
      const response = await fetch(
        `${API}/api/agent/runs/${runId}`
      );

      if (!response.ok) {
        throw new Error("Run not found");
      }

      const data = await response.json();

      setSelectedRun(data);

      setPage("Agent Run");
    } catch (error) {
      console.error(error);

      showToast("Unable to load agent run.");
    }
  };

  return (
    <div className="app">

      {/* ================= TOP NAVBAR ================= */}

      <header className="topbar">

        <button
          className="menu-button"
          onClick={() =>
            setSidebarCollapsed(!sidebarCollapsed)
          }
        >
          ☰
        </button>

        <div className="brand">

          <div className="brand-icon">
            M
          </div>

          <div>
            <strong>MediSync</strong>
            <small>AI Clinical Agent</small>
          </div>

        </div>

        <div className="search-box">

          <span>⌕</span>

          <input
            placeholder="Search patients, runs, records..."
          />

        </div>

        <div className="top-actions">

          <span
            className={
              backendOnline
                ? "connection online"
                : "connection offline"
            }
          >
            ●{" "}
            {backendOnline
              ? "Backend connected"
              : "Backend offline"}
          </span>

          <button>♢</button>

          <div className="profile">
            S
          </div>

        </div>

      </header>


      {/* ================= SIDEBAR ================= */}

      <aside
        className={
          sidebarCollapsed
            ? "sidebar collapsed"
            : "sidebar"
        }
      >

        <div className="nav-title">
          WORKSPACE
        </div>

        {navigation.map(([name, icon]) => (

          <button
            key={name}
            className={
              page === name ||
              (page === "Agent Run" &&
                name === "Agent Runs") ||
              (page === "Patient Detail" &&
                name === "Patients")
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setPage(name)}
          >

            <span className="nav-icon">
              {icon}
            </span>

            <span className="nav-text">
              {name}
            </span>

          </button>

        ))}


        <div className="safety-card">

          <strong>
            ◆ Safety Guardrails
          </strong>

          <small>
            Synthetic data only
            <br />
            Human review enabled
          </small>

        </div>

      </aside>


      {/* ================= MAIN ================= */}

      <main
        className={
          sidebarCollapsed
            ? "main-content expanded"
            : "main-content"
        }
      >

        {page === "Dashboard" && (
          <Dashboard
            patients={patients}
            runs={runs}
            runAgent={runAgent}
            openPatient={openPatient}
            openRun={openRun}
            loading={loading}
          />
        )}

        {page === "Patients" && (
          <Patients
            patients={patients}
            openPatient={openPatient}
            runAgent={runAgent}
          />
        )}

        {page === "Patient Detail" && (
          <PatientDetail
            patient={selectedPatient}
            back={() => setPage("Patients")}
            runAgent={runAgent}
          />
        )}

        {page === "Agent Runs" && (
          <AgentRuns
            runs={runs}
            openRun={openRun}
            runAgent={runAgent}
            loading={loading}
          />
        )}

        {page === "Agent Run" && (
          <AgentRun
            run={selectedRun}
            back={() => setPage("Agent Runs")}
          />
        )}

        {page === "Conflicts" && (
          <Conflicts
            runs={runs}
            openRun={openRun}
          />
        )}

        {page === "Activity" && (
          <Activity
            runs={runs}
            openRun={openRun}
          />
        )}

        {page === "Settings" && <Settings />}

      </main>


      {/* ================= TOAST ================= */}

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

    </div>
  );
}


// ==================================================
// PAGE HEADER
// ==================================================

function PageHeader({
  eyebrow,
  title,
  description,
  action
}) {

  return (
    <div className="page-header">

      <div>

        <label>
          {eyebrow}
        </label>

        <h1>
          {title}
        </h1>

        <p>
          {description}
        </p>

      </div>

      {action}

    </div>
  );
}


// ==================================================
// BUTTON
// ==================================================

function PrimaryButton({
  children,
  onClick
}) {

  return (
    <button
      className="primary-button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}


// ==================================================
// STATUS
// ==================================================

function Status({ text }) {

  const isWarning =
    String(text || "")
      .toLowerCase()
      .includes("review");

  return (
    <span
      className={
        isWarning
          ? "status warning"
          : "status success"
      }
    >
      ● {text || "Completed"}
    </span>
  );
}


// ==================================================
// DASHBOARD
// ==================================================

function Dashboard({
  patients,
  runs,
  runAgent,
  openPatient,
  openRun,
  loading
}) {

  const reviews =
    runs.filter(
      (run) => run.human_review_required
    ).length;

  return (
    <>

      <PageHeader
        eyebrow="OVERVIEW"
        title="Clinical Agent Dashboard"
        description="Monitor autonomous documentation, source reconciliation and human-review escalation."
        action={
          <PrimaryButton
            onClick={() => runAgent("P001")}
          >
            ✦ {loading ? "Running..." : "Run Agent"}
          </PrimaryButton>
        }
      />


      {/* STATS */}

      <div className="stats-grid">

        <StatCard
          number={patients.length}
          title="Synthetic Patients"
          subtitle="in database"
        />

        <StatCard
          number={runs.length}
          title="Agent Runs"
          subtitle="recorded"
        />

        <StatCard
          number={reviews}
          title="Human Review"
          subtitle="needs attention"
        />

        <StatCard
          number="Healthy"
          title="System Status"
          subtitle="Supabase + Flask"
        />

      </div>


      {/* COLUMNS */}

      <div className="dashboard-grid">

        <section className="card">

          <SectionTitle
            title="Recent Agent Runs"
            subtitle="Latest autonomous workflows"
          />

          {runs.length === 0 ? (

            <Empty>
              No agent runs yet.
            </Empty>

          ) : (

            runs
              .slice(0, 6)
              .map((run) => (

                <RunRow
                  key={run.id}
                  run={run}
                  onClick={() =>
                    openRun(run.id)
                  }
                />

              ))

          )}

        </section>


        <section className="card">

          <SectionTitle
            title="Patients"
            subtitle="Synthetic records available to the agent"
          />

          {patients.map((patient) => (

            <PatientRow
              key={patient.patient_id}
              patient={patient}
              onClick={() =>
                openPatient(patient.patient_id)
              }
            />

          ))}

        </section>

      </div>


      {/* WORKFLOW */}

      <section className="card workflow-card">

        <SectionTitle
          title="Autonomous Workflow"
          subtitle="Goal → Decision → Tool → Adaptation → Validation → Outcome"
        />

        <div className="workflow">

          {[
            "Goal",
            "Decision",
            "Tool Action",
            "Conflict",
            "Adaptation",
            "Draft",
            "Validation",
            "Outcome"
          ].map((step, index) => (

            <React.Fragment key={step}>

              <div
                className={
                  step === "Conflict"
                    ? "workflow-step danger"
                    : "workflow-step"
                }
              >

                <small>
                  0{index + 1}
                </small>

                {step}

              </div>

              {index < 7 && (
                <b className="arrow">
                  →
                </b>
              )}

            </React.Fragment>

          ))}

        </div>

      </section>

    </>
  );
}


// ==================================================
// STAT CARD
// ==================================================

function StatCard({
  number,
  title,
  subtitle
}) {

  return (
    <div className="card stat-card">

      <small>
        {subtitle}
      </small>

      <strong>
        {number}
      </strong>

      <span>
        {title}
      </span>

    </div>
  );
}


// ==================================================
// SECTION TITLE
// ==================================================

function SectionTitle({
  title,
  subtitle
}) {

  return (
    <div className="section-title">

      <h2>
        {title}
      </h2>

      <p>
        {subtitle}
      </p>

    </div>
  );
}


// ==================================================
// RUN ROW
// ==================================================

function RunRow({
  run,
  onClick
}) {

  return (
    <button
      className="data-row"
      onClick={onClick}
    >

      <b>
        #{run.id}
      </b>

      <div>

        <strong>
          {run.patient_id}
        </strong>

        <small>
          {run.goal ||
            "Clinical documentation workflow"}
        </small>

      </div>

      <Status
        text={run.final_status}
      />

      <i>
        ›
      </i>

    </button>
  );
}


// ==================================================
// PATIENT ROW
// ==================================================

function PatientRow({
  patient,
  onClick
}) {

  return (
    <button
      className="data-row"
      onClick={onClick}
    >

      <b className="avatar">
        {(patient.name || "P")[0]}
      </b>

      <div>

        <strong>
          {patient.name}
        </strong>

        <small>
          {patient.patient_id}
          {" · "}
          {patient.age}
          {" · "}
          {patient.sex || patient.gender}
        </small>

      </div>

      <i>
        ›
      </i>

    </button>
  );
}


// ==================================================
// PATIENTS
// ==================================================

function Patients({
  patients,
  openPatient
}) {

  return (
    <>

      <PageHeader
        eyebrow="PATIENT RECORDS"
        title="Patients"
        description="Synthetic/deidentified records available for autonomous reconciliation."
      />

      <section className="card table-card">

        <table>

          <thead>

            <tr>
              <th>Patient</th>
              <th>ID</th>
              <th>Age</th>
              <th>Sex</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

            {patients.map((patient) => (

              <tr key={patient.patient_id}>

                <td>
                  <b>{patient.name}</b>
                </td>

                <td>
                  <code>
                    {patient.patient_id}
                  </code>
                </td>

                <td>
                  {patient.age}
                </td>

                <td>
                  {patient.sex ||
                    patient.gender}
                </td>

                <td>

                  <button
                    className="link-button"
                    onClick={() =>
                      openPatient(
                        patient.patient_id
                      )
                    }
                  >
                    Open →
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {patients.length === 0 && (
          <Empty>
            No patients found.
          </Empty>
        )}

      </section>

    </>
  );
}


// ==================================================
// PATIENT DETAIL
// ==================================================

function PatientDetail({
  patient,
  back,
  runAgent
}) {

  if (!patient) {

    return (
      <Empty>
        No patient selected.
      </Empty>
    );

  }

  const data =
    patient.patient || patient;

  return (
    <>

      <button
        className="back-button"
        onClick={back}
      >
        ← Patients
      </button>


      <PageHeader
        eyebrow="PATIENT DETAIL"
        title={data.name}
        description={`Synthetic record · ${data.patient_id}`}
      />


      <div className="patient-detail">

        <section className="card profile-card">

          <div className="big-avatar">
            {(data.name || "P")[0]}
          </div>

          <h2>
            {data.name}
          </h2>

          <code>
            {data.patient_id}
          </code>

          <p>
            {data.age} years ·{" "}
            {data.sex || data.gender}
          </p>

          <PrimaryButton
            onClick={() =>
              runAgent(data.patient_id)
            }
          >
            ✦ Run Agent
          </PrimaryButton>

        </section>


        <section className="card">

          <SectionTitle
            title="Record Sources"
            subtitle="Information available to the agent"
          />

          <div className="sources-grid">

            <Source
              title="Consultation"
              value={
                patient.consultation?.summary ||
                patient.consultation_summary ||
                "Available"
              }
            />

            <Source
              title="Allergies"
              value={
                patient.allergies
                  ?.map((a) => a.substance)
                  .join(", ") ||
                "No known allergies"
              }
            />

            <Source
              title="Medications"
              value={
                patient.medications
                  ?.map(
                    (m) =>
                      `${m.name} ${m.dose}`
                  )
                  .join(", ") ||
                "None"
              }
            />

            <Source
              title="Laboratory"
              value={
                patient.laboratory_reports
                  ?.map(
                    (l) =>
                      `${l.test}: ${l.value} ${l.unit}`
                  )
                  .join(" · ") ||
                "No reports"
              }
            />

          </div>

        </section>

      </div>

    </>
  );
}


// ==================================================
// SOURCE
// ==================================================

function Source({
  title,
  value
}) {

  return (
    <div className="source">

      <label>
        {title}
      </label>

      <p>
        {value}
      </p>

    </div>
  );
}


// ==================================================
// AGENT RUNS
// ==================================================

function AgentRuns({
  runs,
  openRun,
  runAgent,
  loading
}) {

  return (
    <>

      <PageHeader
        eyebrow="AUTONOMOUS WORKFLOWS"
        title="Agent Runs"
        description="Every run is persisted with decisions, tool actions and validation."
        action={
          <PrimaryButton
            onClick={() => runAgent("P001")}
          >
            ✦{" "}
            {loading
              ? "Running..."
              : "Run Agent"}
          </PrimaryButton>
        }
      />


      <section className="card table-card">

        <table>

          <thead>

            <tr>
              <th>Run</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Review</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

            {runs.map((run) => (

              <tr key={run.id}>

                <td>
                  #{run.id}
                </td>

                <td>
                  {run.patient_id}
                </td>

                <td>
                  <Status
                    text={run.final_status}
                  />
                </td>

                <td>
                  {run.human_review_required
                    ? "⚠ Required"
                    : "✓ No"}
                </td>

                <td>

                  <button
                    className="link-button"
                    onClick={() =>
                      openRun(run.id)
                    }
                  >
                    Inspect →
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {runs.length === 0 && (
          <Empty>
            No agent runs recorded yet.
          </Empty>
        )}

      </section>

    </>
  );
}


// ==================================================
// AGENT EXECUTION
// ==================================================

function AgentRun({
  run,
  back
}) {

  if (!run) {

    return (
      <Empty>
        Open an agent run to inspect it.
      </Empty>
    );

  }

  const record =
    run.record || {};

  return (
    <>

      <button
        className="back-button"
        onClick={back}
      >
        ← Agent Runs
      </button>


      <PageHeader
        eyebrow={`RUN #${run.run_id || run.id}`}
        title="Agent Execution"
        description="Traceable autonomous workflow with source reconciliation and validation."
        action={
          <Status
            text={
              record.final_status ||
              run.final_status
            }
          />
        }
      />


      <div className="run-layout">

        {/* TIMELINE */}

        <section className="card">

          <SectionTitle
            title="Execution Timeline"
            subtitle="Decision and tool-action trace"
          />

          <div className="timeline">

            {(run.steps || []).map(
              (step, index) => (

                <div
                  className="timeline-step"
                  key={index}
                >

                  <div
                    className={
                      step.status === "warning"
                        ? "timeline-dot warning"
                        : "timeline-dot"
                    }
                  >
                    {step.status === "warning"
                      ? "!"
                      : "✓"}
                  </div>


                  <div className="timeline-content">

                    <label>
                      {step.stage}
                    </label>

                    <h3>
                      {step.action}
                    </h3>

                    <p>
                      <b>Decision:</b>{" "}
                      {step.decision}
                    </p>

                    <blockquote>
                      {step.result}
                    </blockquote>

                  </div>

                </div>

              )
            )}

          </div>

        </section>


        {/* SIDE */}

        <div className="run-side">

          <section className="card">

            <SectionTitle
              title="Conflicts"
              subtitle="Source inconsistencies"
            />

            {(record.identified_conflicts ||
              []).map(
              (conflict, index) => (

                <div
                  className="conflict"
                  key={index}
                >

                  <b>
                    ⚠{" "}
                    {conflict.type}
                  </b>

                  <p>
                    {conflict.source_a}:{" "}
                    {conflict.source_a_value}
                  </p>

                  <p>
                    {conflict.source_b}:{" "}
                    {conflict.source_b_value}
                  </p>

                  <small>
                    {conflict.status}
                  </small>

                </div>

              )
            )}

          </section>


          <section className="card">

            <SectionTitle
              title="Validation"
              subtitle="Pre-finalization checks"
            />

            {Object.entries(
              run.validation?.checks ||
                record.validation?.checks ||
                {}
            ).map(
              ([key, value]) => (

                <div
                  className="validation-row"
                  key={key}
                >

                  ✓{" "}
                  {key.replaceAll(
                    "_",
                    " "
                  )}

                  <b>
                    {value
                      ? "PASS"
                      : "FAIL"}
                  </b>

                </div>

              )
            )}

          </section>

        </div>

      </div>

    </>
  );
}


// ==================================================
// CONFLICTS
// ==================================================

function Conflicts({
  runs,
  openRun
}) {

  const reviewRuns =
    runs.filter(
      (run) =>
        run.human_review_required
    );

  return (
    <>

      <PageHeader
        eyebrow="SAFETY & RECONCILIATION"
        title="Conflicts"
        description="Unresolved inconsistencies surfaced for human review."
      />


      <section className="card">

        <div className="warning-banner">

          <span>⚠</span>

          <div>

            <b>
              {reviewRuns.length} run(s)
              require human review
            </b>

            <p>
              Review conflicting source
              information before treating
              it as a confirmed classification.
            </p>

          </div>

        </div>


        {reviewRuns.map((run) => (

          <div
            className="conflict-row"
            key={run.id}
          >

            <b>
              Run #{run.id} ·{" "}
              {run.patient_id}
            </b>

            <Status
              text={run.final_status}
            />

            <button
              className="link-button"
              onClick={() =>
                openRun(run.id)
              }
            >
              Review →
            </button>

          </div>

        ))}

        {reviewRuns.length === 0 && (
          <Empty>
            No unresolved conflicts.
          </Empty>
        )}

      </section>

    </>
  );
}


// ==================================================
// ACTIVITY
// ==================================================

function Activity({
  runs,
  openRun
}) {

  const activities =
    runs.flatMap((run) =>
      (run.steps || [])
        .slice(-5)
        .map((step, index) => ({
          run,
          step,
          index
        }))
    );

  return (
    <>

      <PageHeader
        eyebrow="AUDIT TRAIL"
        title="Activity"
        description="Persistent agent execution history for traceability."
      />


      <section className="card">

        {activities.map(
          ({
            run,
            step,
            index
          }) => (

            <button
              className="activity-row"
              key={`${run.id}-${index}`}
              onClick={() =>
                openRun(run.id)
              }
            >

              <span>
                {step.status === "warning"
                  ? "!"
                  : "✓"}
              </span>

              <div>

                <b>
                  {step.stage}
                </b>

                <p>
                  {step.action}
                </p>

              </div>

              <small>
                Run #{run.id}
              </small>

            </button>

          )
        )}

        {activities.length === 0 && (
          <Empty>
            No activity yet.
          </Empty>
        )}

      </section>

    </>
  );
}


// ==================================================
// SETTINGS
// ==================================================

function Settings() {

  return (
    <>

      <PageHeader
        eyebrow="CONFIGURATION"
        title="Settings"
        description="Environment and safety configuration for the prototype."
      />


      <div className="dashboard-grid">

        <section className="card setting-card">

          <SectionTitle
            title="Backend"
            subtitle="Connection configuration"
          />

          <p>

            <b>
              Flask API
            </b>

            <br />

            <code>
              {API}
            </code>

          </p>


          <p>

            <b>
              Environment
            </b>

            <br />

            <span className="tag">
              SYNTHETIC
            </span>

          </p>

        </section>


        <section className="card setting-card">

          <SectionTitle
            title="Safety"
            subtitle="Guardrail configuration"
          />

          <p>
            ✓ Human review escalation
            <b> Enabled</b>
          </p>

          <p>
            ✓ Autonomous diagnosis
            <b> Disabled</b>
          </p>

          <p>
            ✓ Prescribing actions
            <b> Disabled</b>
          </p>

        </section>

      </div>

    </>
  );
}


// ==================================================
// EMPTY
// ==================================================

function Empty({
  children
}) {

  return (
    <div className="empty">

      <div>
        ◌
      </div>

      <p>
        {children}
      </p>

    </div>
  );
}


createRoot(
  document.getElementById("root")
).render(
  <App />
);