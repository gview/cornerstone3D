export default {
  plugins: {
    // 简化的 PostCSS 配置，使用 ES 模块语法
    'postcss-preset-env': {},
    cssnano: process.env.NODE_ENV === 'production' ? {} : false,
  },
};
