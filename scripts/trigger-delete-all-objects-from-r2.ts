async function triggerDeleteObjectsFromR2() {
  try {
    const res = await fetch("http://localhost:3000/api/delete-all-objects", {
      method: "DELETE",
    });

    const data = await res.json();
    console.log("Result:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

triggerDeleteObjectsFromR2();
