import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("The Exocore Platform application root is missing.");
}

app.innerHTML = `
  <main class="orientation-shell" aria-labelledby="page-title">
    <header class="masthead">
      <p class="eyebrow">Early work in progress</p>
      <h1 id="page-title">Exocore Platform</h1>
      <p class="lede">
        A local-first cognitive workbench for people who want durable context,
        clear agency, and a humane path back into their work.
      </p>
    </header>

    <section class="posture" aria-labelledby="posture-title">
      <h2 id="posture-title">What this window is</h2>
      <p>
        A public orientation shell. It proves that the first desktop surface can
        launch and hold the project direction in view. It does not yet manage
        records, run agents, collect data, or reach the network.
      </p>
    </section>

    <section class="principles" aria-labelledby="principles-title">
      <h2 id="principles-title">Design posture</h2>
      <ul>
        <li><strong>Agency stays visible.</strong> Assistance can propose. People decide what becomes durable.</li>
        <li><strong>Local first.</strong> The workbench should return people to their own context rather than hide it behind a service.</li>
        <li><strong>Provenance matters.</strong> A useful output needs a legible route back to its sources, decisions, and revisions.</li>
      </ul>
    </section>

    <section class="not-yet" aria-labelledby="not-yet-title">
      <h2 id="not-yet-title">Deliberately not here yet</h2>
      <p>
        No CoreStore, filesystem access, adapters, model providers, ContextPack
        integration, telemetry, or automatic workflow changes. Those boundaries
        need their own design records and recovery proofs before implementation.
      </p>
    </section>

    <footer>
      <p>Pre-alpha orientation shell. Build the boundary before building the machine.</p>
    </footer>
  </main>
`;
