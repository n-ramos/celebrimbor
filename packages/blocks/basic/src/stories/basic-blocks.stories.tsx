import type { Meta, StoryObj } from "@storybook/react";
import { createBlockRegistry, createDocument } from "@n-ramos/core";
import { PageRenderer } from "@n-ramos/editor-react";
import { basicBlocks, registerBasicBlocks } from "..";

const registry = registerBasicBlocks(createBlockRegistry());

const meta = {
  title: "Blocks/Basic",
  component: PageRenderer,
} satisfies Meta<typeof PageRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MarketingPreset: Story = {
  args: {
    registry,
    document: createDocument({
      blocks: basicBlocks.map((definition, index) => registry.createBlock(definition.type, { id: `story-${index}` })),
    }),
  },
};
