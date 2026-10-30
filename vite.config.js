import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Local development middleware for Razorpay Orders API
 * Intercepts /api/create-order and creates order with payment_capture: 1
 */
function razorpayDevServerPlugin(env) {
  return {
    name: 'razorpay-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/create-order' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', chunk => bodyStr += chunk);
          req.on('end', async () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const amount = body.amount || 50000;
              const keyId = env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
              const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

              if (!keyId || !keySecret) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Razorpay keys not found in .env' }));
                return;
              }

              const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
              const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({
                  amount,
                  currency: 'INR',
                  receipt: `rcpt_${Date.now()}`,
                  payment_capture: 1 // Automatically captures payment on authorization
                })
              });

              const order = await rzpRes.json();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = rzpRes.status;
              res.end(JSON.stringify({ ...order, keyId }));
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      razorpayDevServerPlugin(env)
    ],
  };
});
