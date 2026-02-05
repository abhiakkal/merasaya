import axios from "axios";

// Set base URL and ensure credentials are sent (CORS must allow credentials server-side)
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
axios.defaults.withCredentials = true; // important if backend uses cookies

export default function useApi() {
	// ...existing wrapper code...
	// ensure post/get calls return axios response so callers can read res.data.access_token
	return {
		// ...existing methods...
		post: (url: string, body?: any, config?: any) => axios.post(url, body, config),
		get: (url: string, config?: any) => axios.get(url, config),
		// ...existing methods...
	};
}