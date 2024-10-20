import { View, TextInput, TouchableOpacity } from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { Entypo, MaterialIcons } from "@expo/vector-icons";

const UserTextinput = ({
  placeholder,
  isPass,
  setStatValue,
  setGetEmailValidationStatus,
}) => {
  const [value, setValue] = useState("");
  const [showPass, setShowPass] = useState(true);
  const [icon, setIcon] = useState(null);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const handleTextChanged = (text) => {
    setValue(text);
    setStatValue(text);

    if (placeholder === "Email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const status = emailRegex.test(text);
      setIsEmailValid(status);
      if (setGetEmailValidationStatus) {
        setGetEmailValidationStatus(status);
      }
    }
  };

  useLayoutEffect(() => {
    switch (placeholder) {
      case "Full Name":
        setIcon("person");
        break;
      case "Email":
        setIcon("email");
        break;
      case "Password":
        setIcon("lock");
        break;
      default:
        setIcon(null);
    }
  }, [placeholder]);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor:
          !isEmailValid && placeholder === "Email" && value.length > 0
            ? "red"
            : "gray",
        borderRadius: 15,
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 8,
      }}
    >
      <MaterialIcons name={icon} size={24} color="#6c6d83" />
      <TextInput
        style={{
          flex: 1,
          fontSize: 16,
          color: "#333",
          fontWeight: "600",
          marginTop: -2,
        }}
        placeholder={placeholder}
        value={value}
        onChangeText={handleTextChanged}
        secureTextEntry={isPass && showPass}
        autoCapitalize="none"
      />
      {isPass && (
        <TouchableOpacity onPress={() => setShowPass(!showPass)}>
          <Entypo
            name={showPass ? "eye" : "eye-with-line"}
            size={24}
            color="#6c6d83"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UserTextinput;