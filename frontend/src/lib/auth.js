export const getToken = () => localStorage.getItem("admin_token");
export const setToken = (t) => localStorage.setItem("admin_token", t);
export const clearToken = () => localStorage.removeItem("admin_token");
