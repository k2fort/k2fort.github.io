const searchInput = document.getElementById("search");
const versionFilter = document.getElementById("versionFilter");
const patches = document.querySelectorAll(".patch");

function filterPatches() {
  const searchText = searchInput.value.toLowerCase();
  const version = versionFilter.value;

  patches.forEach(patch => {
    const text = patch.innerText.toLowerCase();
    const patchVersion = patch.dataset.version;

    const matchesText = text.includes(searchText);
    const matchesVersion = version === "all" || version === patchVersion;

    patch.style.display = matchesText && matchesVersion ? "block" : "none";
  });
}

searchInput.addEventListener("input", filterPatches);
versionFilter.addEventListener("change", filterPatches);
