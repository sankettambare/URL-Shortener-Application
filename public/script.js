const form = document.querySelector('#shortener');
const list = document.getElementById("shortened-urls");

// Fetch and display shortened URLs
const fetchShortenedURL = async () => {
  try {
    const response = await fetch("/links");
    const links = await response.json();

    list.innerHTML = "";

    for (const [key, value] of Object.entries(links)) {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<a href="/${key}" target="_blank">${window.location.origin}/${key}</a> - ${value}`;
      list.appendChild(listItem);
    }
  } catch (err) {
    console.error("Error fetching links:", err);
  }
};

// Handle form submission
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const url = formData.get('url');
  const short = formData.get('Short-url');

  try {
    const response = await fetch("/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, shortCode: short })
    });

    if (response.ok) {
      const resData = await response.json();
      alert(`Short URL created! Access it at: ${window.location.origin}/${resData.shortCode}`);
      fetchShortenedURL();
    } else {
      const errorMessage = await response.text();
      alert(errorMessage);
    }
  } catch {
    alert("Network error occurred");
  }
});

fetchShortenedURL(); // Call initially to load saved links
