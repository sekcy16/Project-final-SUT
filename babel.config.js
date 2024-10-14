module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "nativewind/babel",
      "react-native-reanimated/plugin", // เพิ่มบรรทัดนี้ถ้าคุณใช้ react-native-reanimated
    ],
  };
};