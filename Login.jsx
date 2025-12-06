import Vid from "./Vid";
import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
const Login = ({ setx }) => {
  const [username, setUsername] = useState("");
  return (
    <>
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <TextInput
            style={styles.input}
            placeholder="Enter Username"
            value={username}
            onChangeText={setUsername}
          />
        </View>
        <Vid setx={setx} username={username} data="login" />
      </View>
    </>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  input: {
    width: "80%",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 5,
    backgroundColor: "#fff",
  },
});
