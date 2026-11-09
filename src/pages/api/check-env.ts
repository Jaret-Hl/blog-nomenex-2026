// availability.ts -> \pages\api
// book.ts -> \pages\api
// test-calendar.ts -> \pages\api
// create.ts -> \pages\api\calendar

// src/pages/api/env-check.ts
// import { env } from "../../config/env.server";

// export const GET = async () =>
//   new Response(JSON.stringify({ ok: Boolean(env.clientId) }));
export const GET = async () => {
  return new Response(
    JSON.stringify({
      clientId: process.env.AZURE_CLIENT_ID,
      allKeys: Object.keys(process.env).filter(k =>
        k.includes("AZURE") || k.includes("MS_")
      ),
    }, null, 2)
  );
};
