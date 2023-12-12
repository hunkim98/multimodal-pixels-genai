// For building on vercel: https://github.com/Automattic/node-canvas/issues/1779
// if (
//   process.env.LD_LIBRARY_PATH == null ||
//   !process.env.LD_LIBRARY_PATH.includes(
//     `${process.env.PWD}/node_modules/canvas/build/Release:`,
//   )
// ) {
//   process.env.LD_LIBRARY_PATH = `${
//     process.env.PWD
//   }/node_modules/canvas/build/Release:${process.env.LD_LIBRARY_PATH || ""}`;
// }

// when error due to node-canvas please refer to :
// https://github.com/Automattic/node-canvas/issues/1779
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: [
    "@adobe/react-spectrum",
    "@react-spectrum/color",
    "@react-spectrum/actionbar",
    "@react-spectrum/actiongroup",
    "@react-spectrum/avatar",
    "@react-spectrum/badge",
    "@react-spectrum/breadcrumbs",
    "@react-spectrum/button",
    "@react-spectrum/buttongroup",
    "@react-spectrum/calendar",
    "@react-spectrum/checkbox",
    "@react-spectrum/combobox",
    "@react-spectrum/contextualhelp",
    "@react-spectrum/datepicker",
    "@react-spectrum/dialog",
    "@react-spectrum/divider",
    "@react-spectrum/dnd",
    "@react-spectrum/form",
    "@react-spectrum/icon",
    "@react-spectrum/illustratedmessage",
    "@react-spectrum/inlinealert",
    "@react-spectrum/image",
    "@react-spectrum/label",
    "@react-spectrum/labeledvalue",
    "@react-spectrum/layout",
    "@react-spectrum/link",
    "@react-spectrum/list",
    "@react-spectrum/listbox",
    "@react-spectrum/menu",
    "@react-spectrum/meter",
    "@react-spectrum/numberfield",
    "@react-spectrum/overlays",
    "@react-spectrum/picker",
    "@react-spectrum/progress",
    "@react-spectrum/provider",
    "@react-spectrum/radio",
    "@react-spectrum/slider",
    "@react-spectrum/searchfield",
    "@react-spectrum/statuslight",
    "@react-spectrum/switch",
    "@react-spectrum/table",
    "@react-spectrum/tabs",
    "@react-spectrum/tag",
    "@react-spectrum/text",
    "@react-spectrum/textfield",
    "@react-spectrum/theme-dark",
    "@react-spectrum/theme-default",
    "@react-spectrum/theme-light",
    "@react-spectrum/tooltip",
    "@react-spectrum/view",
    "@react-spectrum/well",
    "@spectrum-icons/illustrations",
    "@spectrum-icons/ui",
    "@spectrum-icons/workflow",
  ],
  env: {
    REPLICATE_TOKEN: process.env.REPLICATE_TOKEN,
    // IMAGE_URL: process.env.IMAGE_URL,
    // S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    // S3_REGION: process.env.S3_REGION,
    // S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  },
  async rewrites() {
    return [
      {
        source: "/genapi/:path*",
        destination: process.env.SERVER_URL + "/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
