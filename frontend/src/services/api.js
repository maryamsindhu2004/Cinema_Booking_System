const BASE_URL = "http://localhost:3000";

export async function getMovies() {
    const res = await fetch(`${BASE_URL}/movies`);
    return res.json();
}
