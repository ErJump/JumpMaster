// eslint-config-next 16 esporta flat config nativi: niente FlatCompat, e quindi
// nessun bisogno di @eslint/eslintrc.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'src/db/migrations/**',
      'src/content/srd/data/**',
      'data/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default config;
