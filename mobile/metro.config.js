const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const stripeWebStub = path.resolve(__dirname, "src/mocks/stripe-web/index.js");

// Block Stripe's entire native package tree for web builds
// AND redirect the top-level import to our stub
if (!config.resolver.blockList) {
  config.resolver.blockList = [];
}

// Redirect @stripe/stripe-react-native → web stub
// Use extraNodeModules for module aliasing
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@stripe/stripe-react-native": path.resolve(__dirname, "src/mocks/stripe-web"),
};

module.exports = config;
