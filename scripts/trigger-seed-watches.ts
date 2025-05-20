async function triggerSeedWatches() {
  try {
    const res = await fetch("http://localhost:3000/api/seed-watches", {
      method: "POST",
    });

    const data = await res.json();
    console.log("Seeding result:", data);
  } catch (err) {
    console.error("Error triggering seed:", err);
  }
}

triggerSeedWatches();
