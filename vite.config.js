import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const hmrHost = env.VITE_HMR_HOST || 'localhost';

    return {
        server: {
            host: '0.0.0.0',
            port: 5173,
            origin: `http://${hmrHost}:5173`,
            cors: {
                origin: [`http://${hmrHost}:8000`, /^http:\/\/(localhost|127\.0\.0\.1):8000$/],
            },
            hmr: {
                host: hmrHost,
            },
        },
        plugins: [
            laravel({
                input: 'resources/js/app.jsx',
                refresh: true,
            }),
            react(),
        ],
    };
});
