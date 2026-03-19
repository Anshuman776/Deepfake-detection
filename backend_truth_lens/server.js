const app = require("./app");

const PORT = Number(process.env.PORT || 8002);

app.listen(PORT, () => {
  console.log(`TruthLens backend_truth_lens listening on http://127.0.0.1:${PORT}`);
});
