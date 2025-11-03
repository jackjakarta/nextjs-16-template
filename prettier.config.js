import defineConfig, { presets } from '@jackjakarta/prettier-config';

export default defineConfig(presets.nextjs({ packageJson: true }));
