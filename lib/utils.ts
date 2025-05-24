export function uniqueByKey<T, K extends keyof T>(arr: T[], key: K): T[] {
  const seen = new Set<T[K]>();
  return arr.filter((item) => {
    if (seen.has(item[key])) {
      return false;
    }
    seen.add(item[key]);
    return true;
  });
}

const url = process.env.API_URL;
export async function serverRequest<T>({
  endpoint,
  method,
  body,
}: {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: T;
}): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${url}${endpoint}`, options);

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  const data: T = await res.json();
  return data;
}

export function toSentenceCase(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export const getWhatsAppUrl = ({ message }: { message: string }) => {
  return `https://wa.me/${process.env.WHATSAPP_NO}?text=${message}`;
};
