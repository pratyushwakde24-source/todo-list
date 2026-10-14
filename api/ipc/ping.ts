export default function handler(req: any, res: any) {
  const latencyMs = +(Math.random() * 1.5 + 0.8).toFixed(2);
  res.status(200).json({
    status: 'OK',
    stdout: JSON.stringify({
      status: 'OK',
      engine: 'TaskFlow Engine 1.0 (Vercel Serverless Ready)',
      timestamp: new Date().toISOString(),
      architecture: 'Cloud Serverless / C++ Simulation'
    }),
    enginePath: 'Vercel Serverless Function (/api/ipc/ping)',
    latencyMs
  });
}
