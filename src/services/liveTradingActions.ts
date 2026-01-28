import { authFetch } from "@/utils/api";

export type PlaceOrderPayload = {
  exchange: string;
  tradingsymbol: string;
  transaction_type: string;
  quantity: number;
  order_type: string;
  product: string;
  price: number;
};

export type ModifyOrderPayload = {
  quantity: number;
  price: number;
  tradingsymbol: string;
  exchange: string;
};

type ApiResult<T = unknown> = {
  ok: boolean;
  data: T;
};

export async function placeOrder(profileId: string | number, payload: PlaceOrderPayload) {
  const response = await authFetch(`orders/live/orders/${profileId}/place/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { ok: response.ok, data } as ApiResult<typeof data>;
}

export async function modifyOrder(
  profileId: string | number,
  orderId: string,
  payload: ModifyOrderPayload
) {
  const response = await authFetch(`orders/live/orders/${profileId}/modify/${orderId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { ok: response.ok, data } as ApiResult<typeof data>;
}

export async function cancelOrder(profileId: string | number, orderId: string) {
  const response = await authFetch(`orders/live/orders/${profileId}/cancel/${orderId}/`, {
    method: "DELETE",
  });
  const data = await response.json();
  return { ok: response.ok, data } as ApiResult<typeof data>;
}
