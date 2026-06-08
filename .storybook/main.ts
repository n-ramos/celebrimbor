import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../packages/**/*.stories.@(ts|tsx)"],
  addons: [],
};

export default config;
