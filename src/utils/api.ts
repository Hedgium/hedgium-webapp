import { useAuthStore } from "@/store/authStore";

import Cookies from 'js-cookie';


export async function myFetch(url: string, options: RequestInit = {}) {

  const csrftoken: string = Cookies.get('csrftoken') ?? "";

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRFToken': csrftoken,
      'X-API-Key': process.env.NEXT_PUBLIC_API_KEY ?? ""
    },
    credentials: "include",
  });

  return res;
}




export async function authFetch(url: string, options: RequestInit = {}) {
  const { accessToken, refreshAccessToken } = useAuthStore.getState();

  const token = accessToken;
  const csrftoken = Cookies.get('csrftoken');

  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
      'X-CSRFToken': csrftoken ?? "",
      'X-API-Key': process.env.NEXT_PUBLIC_API_KEY ?? ""
    },
    credentials: "include",
  });

  if (res.status === 401) {
    // try refreshing
    await refreshAccessToken();
    const newToken = useAuthStore.getState().accessToken;

    if (newToken) {
      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `JWT ${newToken}`,
        },
        credentials: "include",
      });
    }
  }

  return res;
}
