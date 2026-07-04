import { createServer } from "node:net";

const WEB_PORT = Number(process.env.WEB_PORT ?? 9000);
const API_PORT = Number(process.env.API_PORT ?? 9001);

function isPortFreeOnHost(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, host);
  });
}

/** Check IPv4 and IPv6 loopback — either can block localhost on Windows. */
async function isPortFree(port: number): Promise<boolean> {
  const v4 = await isPortFreeOnHost(port, "127.0.0.1");
  const v6 = await isPortFreeOnHost(port, "::1");
  return v4 && v6;
}

async function main(): Promise<void> {
  const webFree = await isPortFree(WEB_PORT);
  const apiFree = await isPortFree(API_PORT);

  if (webFree && apiFree) {
    console.log(`✅ Ports ${WEB_PORT} (web) and ${API_PORT} (api) are available`);
    return;
  }

  console.error("❌ Ports in use:");
  if (!webFree) console.error(`   ${WEB_PORT} (web)`);
  if (!apiFree) console.error(`   ${API_PORT} (api)`);
  process.exit(1);
}

main();
